/**
 * Lightweight File System Operations Tests
 *
 * A memory-optimized version of fs-advanced.test.ts focusing on core functionality
 * without exhausting heap memory. This test suite covers essential fs operations
 * with minimal mock overhead.
 */

import { existsSync, type Stats } from 'node:fs';
import fsPromises from 'node:fs/promises';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Type definitions for proper mocking
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
}

// Dynamic imports after mocking
let fsModule: typeof import('../../../core/execution/fs.js');
let FileSystemError: typeof import('../../../core/foundation/errors/errors.js')['FileSystemError'];

beforeAll(async () => {
  const fsModuleImport = await import('../../../core/execution/fs.js');
  fsModule = fsModuleImport;

  const errorsImport = await import('../../../core/foundation/errors/errors.js');
  FileSystemError = errorsImport.FileSystemError;
});

// Lightweight mocking with shared instances
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
    unlink: vi.fn(),
    rmdir: vi.fn(),
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
  };
});

vi.mock('../../core/ui/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('Lightweight File System Operations', () => {
  // Shared mock instances to minimize memory allocation
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
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(fsPromises.stat).mockResolvedValue(defaultMockStats as Stats);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Core File Operations', () => {
    it('should read file with UTF-8 encoding', async () => {
      const content = 'test file content';
      vi.mocked(fsPromises.readFile).mockResolvedValue(content);

      const result = await fsModule.readFile('/test/file.txt');

      expect(fsPromises.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
      expect(result).toBe(content);
    });

    it('should write file with default options', async () => {
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(existsSync).mockReturnValue(false);

      await fsModule.writeFile('/test/file.txt', 'test content');

      expect(fsPromises.writeFile).toHaveBeenCalledWith('/test/file.txt', 'test content', 'utf8');
    });

    it('should create parent directories when requested', async () => {
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);

      await fsModule.writeFile('/new/path/file.txt', 'content', { createDirs: true });

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/new/path', { recursive: true });
    });

    it('should handle file read errors', async () => {
      vi.mocked(fsPromises.readFile).mockRejectedValue(new Error('Read failed'));

      await expect(fsModule.readFile('/nonexistent/file.txt')).rejects.toThrow(FileSystemError);
    });

    it('should handle write failures', async () => {
      vi.mocked(fsPromises.writeFile).mockRejectedValue(new Error('Write failed'));

      await expect(fsModule.writeFile('/test/file.txt', 'content')).rejects.toThrow(
        FileSystemError
      );
    });
  });

  describe('JSON Operations', () => {
    it('should read and parse valid JSON', async () => {
      const jsonData = { key: 'value', number: 42 };
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(jsonData));

      const result = await fsModule.readJSON('/test/config.json');

      expect(result).toEqual(jsonData);
    });

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

    it('should throw FileSystemError for invalid JSON', async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValue('invalid json {');

      await expect(fsModule.readJSON('/test/invalid.json')).rejects.toThrow(FileSystemError);
    });
  });

  describe('Directory Operations', () => {
    it('should read directory entries', async () => {
      const mockFiles = ['file1.txt', 'file2.js', 'subdir'];
      vi.mocked(fsPromises.readdir).mockResolvedValue(mockFiles as never);
      vi.mocked(fsPromises.stat).mockImplementation((filePath) => {
        const isDir = (filePath as string).includes('subdir');
        return Promise.resolve((isDir ? dirMockStats : defaultMockStats) as Stats);
      });

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

    it('should handle empty directories', async () => {
      vi.mocked(fsPromises.readdir).mockResolvedValue([]);

      const entries = await fsModule.readDir('/empty/dir');

      expect(entries).toHaveLength(0);
    });

    it('should handle directory read failures', async () => {
      vi.mocked(fsPromises.readdir).mockRejectedValue(new Error('Permission denied'));

      await expect(fsModule.readDir('/protected/dir')).rejects.toThrow(FileSystemError);
    });
  });

  describe('Copy Operations', () => {
    it('should copy file with default options', async () => {
      vi.mocked(fsPromises.copyFile).mockResolvedValue(undefined);

      await fsModule.copyFile('/src/file.txt', '/dest/file.txt');

      expect(fsPromises.copyFile).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    it('should throw error when source does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(fsModule.copyFile('/nonexistent.txt', '/dest.txt')).rejects.toThrow(
        FileSystemError
      );
    });

    it('should handle copy failures', async () => {
      vi.mocked(fsPromises.copyFile).mockRejectedValue(new Error('Copy failed'));

      await expect(fsModule.copyFile('/src/file.txt', '/dest/file.txt')).rejects.toThrow(
        FileSystemError
      );
    });
  });

  describe('Remove Operations', () => {
    it('should remove files', async () => {
      vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);

      await fsModule.remove('/test/file.txt');

      expect(fsPromises.unlink).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should handle removal failures', async () => {
      vi.mocked(fsPromises.unlink).mockRejectedValue(new Error('Permission denied'));

      await expect(fsModule.remove('/protected/file.txt')).rejects.toThrow(FileSystemError);
    });
  });

  describe('Error Handling', () => {
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

    it('should preserve original error information', async () => {
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
});
