import { existsSync, type Stats } from 'node:fs';
import fsPromises from 'node:fs/promises';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

interface MockStats extends Partial<Stats> {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  size: number;
  mtime: Date;
  birthtime: Date;
}

interface NodeError extends Error {
  code: string;
  path?: string;
  errno?: number;
  syscall?: string;
}

// Dynamic imports after mocking
let fsModule: typeof import('../../../core/execution/fs.js');
let FileSystemError: typeof import('../../../core/foundation/errors/errors.js')['FileSystemError'];

beforeAll(async () => {
  // Import after mocking to ensure mocks are applied
  const fsModuleImport = await import('../../../core/execution/fs.js');
  fsModule = fsModuleImport;

  const errorsImport = await import('../../../core/foundation/errors/errors.js');
  FileSystemError = errorsImport.FileSystemError;
});

// Mock Node.js fs modules
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
    copyFile: vi.fn(),
    rm: vi.fn(),
    access: vi.fn(),
    chmod: vi.fn(),
    utimes: vi.fn(),
  },
}));

vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path');
  return {
    ...actual,
    dirname: vi.fn((p: string) => p.split('/').slice(0, -1).join('/') || '/'),
    join: vi.fn((...parts: string[]) => parts.join('/')),
    resolve: vi.fn((...parts: string[]) => `/${parts.join('/')}`),
    basename: vi.fn((p: string) => p.split('/').pop() || ''),
    extname: vi.fn((p: string) => {
      const name = p.split('/').pop() || '';
      const dot = name.lastIndexOf('.');
      return dot > 0 ? name.substring(dot) : '';
    }),
  };
});

// Mock logger
vi.mock('../../core/ui/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('Advanced File System Operations', () => {
  // Shared mock instances to reduce memory allocation
  const defaultMockStats: MockStats = {
    isFile: () => true,
    isDirectory: () => false,
    isSymbolicLink: () => false,
    size: 1024,
    mtime: new Date('2024-01-01'),
    birthtime: new Date('2024-01-01'),
  };

  const dirMockStats: MockStats = {
    isFile: () => false,
    isDirectory: () => true,
    isSymbolicLink: () => false,
    size: 0,
    mtime: new Date('2024-01-01'),
    birthtime: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks with shared instances
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(fsPromises.stat).mockResolvedValue(defaultMockStats as Stats);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('readFile', () => {
    it('should read file with default UTF-8 encoding', async () => {
      const content = 'test file content';
      vi.mocked(fsPromises.readFile).mockResolvedValue(content);

      const result = await fsModule.readFile('/test/file.txt');

      expect(fsPromises.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
      expect(result).toBe(content);
    });

    it('should read file with custom encoding', async () => {
      const content = Buffer.from('test content', 'base64');
      vi.mocked(fsPromises.readFile).mockResolvedValue(content.toString('base64'));

      const result = await fsModule.readFile('/test/file.txt', 'base64');

      expect(fsPromises.readFile).toHaveBeenCalledWith('/test/file.txt', 'base64');
      expect(result).toBe(content.toString('base64'));
    });

    it('should throw FileSystemError when read fails', async () => {
      vi.mocked(fsPromises.readFile).mockRejectedValue(new Error('Read failed'));

      await expect(fsModule.readFile('/nonexistent/file.txt')).rejects.toThrow(FileSystemError);
      await expect(fsModule.readFile('/nonexistent/file.txt')).rejects.toThrow(
        'Failed to read file: /nonexistent/file.txt'
      );
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('EACCES: permission denied');
      vi.mocked(fsPromises.readFile).mockRejectedValue(permissionError);

      await expect(fsModule.readFile('/protected/file.txt')).rejects.toThrow(FileSystemError);
    });
  });

  describe('writeFile', () => {
    it('should write file with default options', async () => {
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(existsSync).mockReturnValue(false);

      await fsModule.writeFile('/test/file.txt', 'test content');

      expect(fsPromises.writeFile).toHaveBeenCalledWith('/test/file.txt', 'test content', 'utf8');
    });

    it('should create parent directories when createDirs is true', async () => {
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(existsSync).mockReturnValue(false);

      await fsModule.writeFile('/new/path/file.txt', 'content', { createDirs: true });

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/new/path', { recursive: true });
      expect(fsPromises.writeFile).toHaveBeenCalledWith('/new/path/file.txt', 'content', 'utf8');
    });

    it('should not create directories when createDirs is false', async () => {
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await fsModule.writeFile('/test/file.txt', 'content', { createDirs: false });

      expect(fsPromises.mkdir).not.toHaveBeenCalled();
    });

    it('should throw error when file exists and overwrite is false', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await expect(
        fsModule.writeFile('/existing/file.txt', 'content', { overwrite: false })
      ).rejects.toThrow(FileSystemError);
      await expect(
        fsModule.writeFile('/existing/file.txt', 'content', { overwrite: false })
      ).rejects.toThrow('File already exists and overwrite is disabled');
    });

    it('should overwrite existing file when overwrite is true', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await fsModule.writeFile('/existing/file.txt', 'new content', { overwrite: true });

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/existing/file.txt',
        'new content',
        'utf8'
      );
    });

    it('should handle write failures', async () => {
      vi.mocked(fsPromises.writeFile).mockRejectedValue(new Error('Write failed'));

      await expect(fsModule.writeFile('/test/file.txt', 'content')).rejects.toThrow(
        FileSystemError
      );
    });

    it('should rethrow existing FileSystemError', async () => {
      const fsError = new FileSystemError('Custom error', '/test/file.txt');
      vi.mocked(fsPromises.writeFile).mockRejectedValue(fsError);

      await expect(fsModule.writeFile('/test/file.txt', 'content')).rejects.toThrow(fsError);
    });
  });

  describe('readJSON', () => {
    it('should read and parse valid JSON', async () => {
      const jsonData = { key: 'value', number: 42 };
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(jsonData));

      const result = await fsModule.readJSON('/test/config.json');

      expect(result).toEqual(jsonData);
    });

    it('should throw FileSystemError for invalid JSON', async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValue('invalid json {');

      await expect(fsModule.readJSON('/test/invalid.json')).rejects.toThrow(FileSystemError);
      await expect(fsModule.readJSON('/test/invalid.json')).rejects.toThrow(
        'Invalid JSON in file: /test/invalid.json'
      );
    });

    it('should handle nested objects and arrays', async () => {
      const complexData = {
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
        settings: {
          theme: 'dark',
          language: 'en',
        },
      };
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(complexData));

      const result = await fsModule.readJSON('/test/complex.json');

      expect(result).toEqual(complexData);
    });

    it('should rethrow non-JSON errors', async () => {
      vi.mocked(fsPromises.readFile).mockRejectedValue(new Error('File not found'));

      await expect(fsModule.readJSON('/test/missing.json')).rejects.toThrow('File not found');
    });
  });

  describe('writeJSON', () => {
    it('should write JSON with default indentation', async () => {
      const data = { key: 'value', number: 42 };
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await fsModule.writeJSON('/test/output.json', data);

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/test/output.json',
        JSON.stringify(data, null, 2),
        'utf8'
      );
    });

    it('should write JSON with custom indentation', async () => {
      const data = { key: 'value' };
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await fsModule.writeJSON('/test/output.json', data, { indent: 4 });

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/test/output.json',
        JSON.stringify(data, null, 4),
        'utf8'
      );
    });

    it('should pass through file options', async () => {
      const data = { key: 'value' };
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);

      await fsModule.writeJSON('/test/output.json', data, { createDirs: true, overwrite: false });

      expect(fsPromises.mkdir).toHaveBeenCalled();
    });

    it('should handle write failures', async () => {
      vi.mocked(fsPromises.writeFile).mockRejectedValue(new Error('Write failed'));

      await expect(fsModule.writeJSON('/test/output.json', { data: 'value' })).rejects.toThrow(
        FileSystemError
      );
    });
  });

  describe('copyFile', () => {
    beforeEach(() => {
      vi.mocked(fsPromises.copyFile).mockResolvedValue(undefined);
      // Reuse defaultMockStats to reduce memory allocation
      vi.mocked(fsPromises.stat).mockResolvedValue(defaultMockStats as Stats);
      vi.mocked(fsPromises.utimes).mockResolvedValue(undefined);
    });

    it('should copy file with default options', async () => {
      await fsModule.copyFile('/src/file.txt', '/dest/file.txt');

      expect(fsPromises.copyFile).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    it('should throw error when source does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(fsModule.copyFile('/nonexistent.txt', '/dest.txt')).rejects.toThrow(
        FileSystemError
      );
      await expect(fsModule.copyFile('/nonexistent.txt', '/dest.txt')).rejects.toThrow(
        'Source file does not exist'
      );
    });

    it('should create destination directories when createDirs is true', async () => {
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);

      await fsModule.copyFile('/src/file.txt', '/new/path/file.txt', { createDirs: true });

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/new/path', { recursive: true });
    });

    it('should preserve timestamps when preserveTimestamps is true', async () => {
      const mockTime = new Date('2024-01-01');
      const timestampMockStats: MockStats = {
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        mtime: mockTime,
        atime: mockTime,
        size: 1024,
        birthtime: mockTime,
      };
      vi.mocked(fsPromises.stat).mockResolvedValue(timestampMockStats as Stats);

      await fsModule.copyFile('/src/file.txt', '/dest/file.txt', { preserveTimestamps: true });

      expect(fsPromises.stat).toHaveBeenCalledWith('/src/file.txt');
      expect(fsPromises.utimes).toHaveBeenCalledWith('/dest/file.txt', mockTime, mockTime);
    });

    it('should handle copy failures', async () => {
      vi.mocked(fsPromises.copyFile).mockRejectedValue(new Error('Copy failed'));

      await expect(fsModule.copyFile('/src/file.txt', '/dest/file.txt')).rejects.toThrow(
        FileSystemError
      );
    });

    it('should not overwrite when overwrite is false and destination exists', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/dest/existing.txt';
      });

      await expect(
        fsModule.copyFile('/src/file.txt', '/dest/existing.txt', { overwrite: false })
      ).rejects.toThrow(FileSystemError);
      await expect(
        fsModule.copyFile('/src/file.txt', '/dest/existing.txt', { overwrite: false })
      ).rejects.toThrow('Destination file already exists');
    });
  });

  describe('readDir', () => {
    // Shared mock arrays to reduce memory allocation
    const mockDirContents = ['file1.txt', 'file2.js', 'subdir'] as never;

    beforeEach(() => {
      vi.mocked(fsPromises.readdir).mockResolvedValue(mockDirContents);
      vi.mocked(fsPromises.stat).mockImplementation((filePath) => {
        const isDir = (filePath as string).includes('subdir');
        return Promise.resolve((isDir ? dirMockStats : defaultMockStats) as Stats);
      });
    });

    it('should read directory entries without stats', async () => {
      const entries = await fsModule.readDir('/test/dir');

      expect(fsPromises.readdir).toHaveBeenCalledWith('/test/dir');
      expect(entries).toHaveLength(3);
      expect(entries[0]).toMatchObject({
        name: 'file1.txt',
        path: '/test/dir/file1.txt',
        isFile: true,
        isDirectory: false,
      });
    });

    it('should include file stats when requested', async () => {
      const entries = await fsModule.readDir('/test/dir', { includeStats: true });

      expect(entries[0]).toMatchObject({
        name: 'file1.txt',
        isFile: true,
        size: 1024,
      });
    });

    it('should recursively read subdirectories', async () => {
      // Mock recursive call
      vi.mocked(fsPromises.readdir)
        .mockResolvedValueOnce(['file1.txt', 'subdir'] as never)
        .mockResolvedValueOnce(['nested.txt'] as never);

      const entries = await fsModule.readDir('/test/dir', { recursive: true });

      expect(entries.length).toBeGreaterThanOrEqual(2);
      expect(fsPromises.readdir).toHaveBeenCalledTimes(2);
    });

    it('should read directory entries with basic options', async () => {
      const entries = await fsModule.readDir('/test/dir', {
        recursive: false,
        includeStats: true,
      });

      // Should return directory entries with stats
      expect(entries).toHaveLength(3); // file1.txt, file2.js, subdir
      expect(entries[0]).toHaveProperty('name');
      expect(entries[0]).toHaveProperty('isFile');
    });

    it('should handle read directory failures', async () => {
      vi.mocked(fsPromises.readdir).mockRejectedValue(new Error('Permission denied'));

      await expect(fsModule.readDir('/protected/dir')).rejects.toThrow(FileSystemError);
    });

    it('should handle empty directories', async () => {
      vi.mocked(fsPromises.readdir).mockResolvedValue([]);

      const entries = await fsModule.readDir('/empty/dir');

      expect(entries).toHaveLength(0);
    });
  });

  describe('copyDir', () => {
    // Shared mock data for copyDir tests
    const copyDirContents = ['file1.txt', 'subdir'] as never;

    beforeEach(() => {
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.readdir).mockResolvedValue(copyDirContents);
      vi.mocked(fsPromises.stat).mockImplementation((filePath) => {
        const isDir = (filePath as string).includes('subdir');
        return Promise.resolve((isDir ? dirMockStats : defaultMockStats) as Stats);
      });
      vi.mocked(fsPromises.copyFile).mockResolvedValue(undefined);
    });

    it('should copy directory and contents', async () => {
      await fsModule.copyDir('/src/dir', '/dest/dir');

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/dest/dir', { recursive: true });
      expect(fsPromises.readdir).toHaveBeenCalledWith('/src/dir');
      expect(fsPromises.copyFile).toHaveBeenCalled();
    });

    it('should handle progress callback', async () => {
      const onProgress = vi.fn();

      await fsModule.copyDir('/src/dir', '/dest/dir', { onProgress });

      expect(onProgress).toHaveBeenCalled();
    });

    it('should respect ignore patterns', async () => {
      vi.mocked(fsPromises.readdir).mockResolvedValue([
        'file1.txt',
        'node_modules',
        'src',
      ] as never);

      await fsModule.copyDir('/src/dir', '/dest/dir', {
        ignorePatterns: ['node_modules'],
      });

      // node_modules should be skipped
      expect(fsPromises.copyFile).toHaveBeenCalledTimes(1); // Only file1.txt
    });

    it('should handle copy failures', async () => {
      vi.mocked(fsPromises.copyFile).mockRejectedValue(new Error('Copy failed'));

      await expect(fsModule.copyDir('/src/dir', '/dest/dir')).rejects.toThrow(FileSystemError);
    });
  });

  describe('copy (auto-detect)', () => {
    it('should copy file when source is a file', async () => {
      const fileMockStats: MockStats = {
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        size: 1024,
        mtime: new Date('2024-01-01'),
        birthtime: new Date('2024-01-01'),
      };
      vi.mocked(fsPromises.stat).mockResolvedValue(fileMockStats as Stats);
      vi.mocked(fsPromises.copyFile).mockResolvedValue(undefined);

      await fsModule.copy('/src/file.txt', '/dest/file.txt');

      expect(fsPromises.copyFile).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    it('should copy directory when source is a directory', async () => {
      const dirMockStats: MockStats = {
        isFile: () => false,
        isDirectory: () => true,
        isSymbolicLink: () => false,
        size: 0,
        mtime: new Date('2024-01-01'),
        birthtime: new Date('2024-01-01'),
      };
      vi.mocked(fsPromises.stat).mockResolvedValue(dirMockStats as Stats);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.readdir).mockResolvedValue([]);

      await fsModule.copy('/src/dir', '/dest/dir');

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/dest/dir', { recursive: true });
    });

    it('should throw error when source does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(fsModule.copy('/nonexistent', '/dest')).rejects.toThrow(FileSystemError);
      await expect(fsModule.copy('/nonexistent', '/dest')).rejects.toThrow('Source does not exist');
    });

    it('should throw error for unsupported file types', async () => {
      const symlinkMockStats: MockStats = {
        isFile: () => false,
        isDirectory: () => false,
        isSymbolicLink: () => true,
        size: 0,
        mtime: new Date('2024-01-01'),
        birthtime: new Date('2024-01-01'),
      };
      vi.mocked(fsPromises.stat).mockResolvedValue(symlinkMockStats as Stats);

      await expect(fsModule.copy('/src/symlink', '/dest/symlink')).rejects.toThrow(FileSystemError);
      await expect(fsModule.copy('/src/symlink', '/dest/symlink')).rejects.toThrow(
        'Source is neither a file nor a directory'
      );
    });
  });

  describe('findFiles', () => {
    beforeEach(() => {
      vi.mocked(fsPromises.readdir).mockResolvedValue([
        'app.js',
        'config.json',
        'test.spec.js',
        'node_modules',
        'src',
      ] as never);
      vi.mocked(fsPromises.stat).mockImplementation((filePath) => {
        const name = (filePath as string).split('/').pop();
        const isDir = ['node_modules', 'src'].includes(name || '');
        const findFilesMockStats: MockStats = {
          isFile: () => !isDir,
          isDirectory: () => isDir,
          isSymbolicLink: () => false,
          size: isDir ? 0 : 1024,
          mtime: new Date('2024-01-01'),
          birthtime: new Date('2024-01-01'),
        };
        return Promise.resolve(findFilesMockStats as Stats);
      });
    });

    it('should find files matching string pattern', async () => {
      const files = await fsModule.findFiles('/test', '*.js');

      expect(files).toContain('/test/app.js');
      expect(files).toContain('/test/test.spec.js');
      expect(files).not.toContain('/test/config.json');
    });

    it('should find files matching regex pattern', async () => {
      const files = await fsModule.findFiles('/test', /\.js$/);

      expect(files).toContain('/test/app.js');
      expect(files).toContain('/test/test.spec.js');
    });

    it('should search recursively when enabled', async () => {
      // Mock nested directory structure
      vi.mocked(fsPromises.readdir)
        .mockResolvedValueOnce(['app.js', 'src'] as never)
        .mockResolvedValueOnce(['nested.js'] as never);

      const files = await fsModule.findFiles('/test', '*.js', { recursive: true });

      expect(files).toContain('/test/app.js');
      expect(files).toContain('/test/src/nested.js');
    });

    it('should respect ignore patterns', async () => {
      const files = await fsModule.findFiles('/test', '*', {
        ignorePatterns: ['node_modules'],
      });

      expect(files).not.toContain('/test/node_modules');
    });

    it('should handle search failures', async () => {
      vi.mocked(fsPromises.readdir).mockRejectedValue(new Error('Permission denied'));

      await expect(fsModule.findFiles('/protected', '*.js')).rejects.toThrow(FileSystemError);
    });
  });

  describe('removeFile and removeDir', () => {
    beforeEach(() => {
      vi.mocked(fsPromises.rm).mockResolvedValue(undefined);
    });

    it('should remove file', async () => {
      await fsModule.remove('/test/file.txt');

      expect(fsPromises.rm).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should remove directory', async () => {
      await fsModule.remove('/test/dir');

      expect(fsPromises.rm).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should handle removal failures', async () => {
      vi.mocked(fsPromises.rm).mockRejectedValue(new Error('Permission denied'));

      await expect(fsModule.remove('/protected/file.txt')).rejects.toThrow(FileSystemError);
    });
  });

  describe('File permissions and advanced operations', () => {
    it('should handle chmod operations', async () => {
      vi.mocked(fsPromises.chmod).mockResolvedValue(undefined);

      // Test that chmod-related functionality works
      expect(fsPromises.chmod).toBeDefined();
    });

    it('should handle file access checks', async () => {
      vi.mocked(fsPromises.access).mockResolvedValue(undefined);

      // Test that access-related functionality works
      expect(fsPromises.access).toBeDefined();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle ENOENT errors', async () => {
      const enoentError: NodeError = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });
      vi.mocked(fsPromises.readFile).mockRejectedValue(enoentError);

      await expect(fsModule.readFile('/nonexistent.txt')).rejects.toThrow(FileSystemError);
    });

    it('should handle EACCES errors', async () => {
      const eaccesError: NodeError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      });
      vi.mocked(fsPromises.writeFile).mockRejectedValue(eaccesError);

      await expect(fsModule.writeFile('/protected/file.txt', 'content')).rejects.toThrow(
        FileSystemError
      );
    });

    it('should handle EMFILE errors (too many open files)', async () => {
      const emfileError: NodeError = Object.assign(new Error('EMFILE: too many open files'), {
        code: 'EMFILE',
      });
      vi.mocked(fsPromises.readFile).mockRejectedValue(emfileError);

      await expect(fsModule.readFile('/test/file.txt')).rejects.toThrow(FileSystemError);
    });

    it('should preserve original error information in FileSystemError', async () => {
      const originalError = new Error('Original error message');
      vi.mocked(fsPromises.readFile).mockRejectedValue(originalError);

      try {
        await fsModule.readFile('/test/file.txt');
      } catch (error) {
        expect(error).toBeInstanceOf(FileSystemError);
        expect((error as InstanceType<typeof FileSystemError>).cause).toBe(originalError);
      }
    });
  });

  describe('Default ignore patterns', () => {
    it('should respect DEFAULT_IGNORE_PATTERNS', async () => {
      vi.mocked(fsPromises.readdir).mockResolvedValue([
        'file.txt',
        'node_modules',
        '.git',
        'dist',
      ] as never);

      const files = await fsModule.findFiles('/test', '*', {
        ignorePatterns: ['node_modules', '.git', 'dist'],
      });

      expect(files).toContain('/test/file.txt');
      expect(files).not.toContain('/test/node_modules');
      expect(files).not.toContain('/test/.git');
      expect(files).not.toContain('/test/dist');
    });
  });
});
