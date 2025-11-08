import { existsSync } from 'node:fs';
import fsPromises from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    rmdir: vi.fn(),
    unlink: vi.fn(),
    rename: vi.fn(),
    utimes: vi.fn(),
  },
}));

// Import fs module after mocking
let fsModule: typeof import('../../../core/execution/fs.js');

describe('fs module - focused tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    if (!fsModule) {
      fsModule = await import('../../../core/execution/fs.js');
    }
  });

  describe('readFile', () => {
    it('should read file with default encoding', async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValue('test content');

      const result = await fsModule.readFile('/test/file.txt');

      expect(result).toBe('test content');
      expect(fsPromises.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
    });

    it('should read file with custom encoding', async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValue('test content');

      const result = await fsModule.readFile('/test/file.txt', 'base64');

      expect(result).toBe('test content');
      expect(fsPromises.readFile).toHaveBeenCalledWith('/test/file.txt', 'base64');
    });

    it('should handle file read errors', async () => {
      const error = new Error('File not found');
      vi.mocked(fsPromises.readFile).mockRejectedValue(error);

      await expect(fsModule.readFile('/nonexistent/file.txt')).rejects.toThrow(
        'Failed to read file'
      );
    });
  });

  describe('writeFile', () => {
    it('should write file with default encoding', async () => {
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await fsModule.writeFile('/test/file.txt', 'content');

      expect(fsPromises.writeFile).toHaveBeenCalledWith('/test/file.txt', 'content', 'utf8');
    });

    it('should create parent directories when createDirs is true', async () => {
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(existsSync).mockReturnValue(false);

      await fsModule.writeFile('/new/path/file.txt', 'content', { createDirs: true });

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/new/path', { recursive: true });
      expect(fsPromises.writeFile).toHaveBeenCalledWith('/new/path/file.txt', 'content', 'utf8');
    });

    it('should handle write errors', async () => {
      const error = new Error('Write permission denied');
      vi.mocked(fsPromises.writeFile).mockRejectedValue(error);

      await expect(fsModule.writeFile('/readonly/file.txt', 'content')).rejects.toThrow(
        'Failed to write file'
      );
    });
  });

  describe('readJSON', () => {
    it('should read and parse JSON file', async () => {
      const jsonData = { key: 'value', number: 42 };
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(jsonData));

      const result = await fsModule.readJSON('/test/data.json');

      expect(result).toEqual(jsonData);
      expect(fsPromises.readFile).toHaveBeenCalledWith('/test/data.json', 'utf8');
    });

    it('should handle JSON parse errors', async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValue('invalid json {');

      await expect(fsModule.readJSON('/test/invalid.json')).rejects.toThrow();
    });
  });

  describe('writeJSON', () => {
    it('should stringify and write JSON file', async () => {
      const jsonData = { key: 'value', number: 42 };
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await fsModule.writeJSON('/test/data.json', jsonData);

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/test/data.json',
        JSON.stringify(jsonData, null, 2),
        'utf8'
      );
    });

    it('should create directories and write JSON when createDirs is true', async () => {
      const jsonData = { test: true };
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(existsSync).mockReturnValue(false);

      await fsModule.writeJSON('/new/path/data.json', jsonData, { createDirs: true });

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/new/path', { recursive: true });
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/new/path/data.json',
        JSON.stringify(jsonData, null, 2),
        'utf8'
      );
    });
  });

  describe('copyDir', () => {
    it('should copy directory recursively', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.readdir).mockResolvedValue(['file1.txt'] as never);
      vi.mocked(fsPromises.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        size: 100,
        mtime: new Date(),
        birthtime: new Date(),
      } as never);
      vi.mocked(fsPromises.copyFile).mockResolvedValue(undefined);

      await fsModule.copyDir('/source', '/dest');

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/dest', { recursive: true });
      expect(fsPromises.readdir).toHaveBeenCalledWith('/source');
    });

    it('should handle copy errors gracefully', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(fsModule.copyDir('/nonexistent', '/dest')).rejects.toThrow(
        'Source directory does not exist'
      );
    });
  });

  describe('findFiles', () => {
    it('should find files by pattern', async () => {
      vi.mocked(fsPromises.readdir).mockResolvedValue([
        'file1.txt',
        'file2.js',
        'file3.txt',
      ] as never);
      vi.mocked(fsPromises.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        size: 100,
        mtime: new Date(),
        birthtime: new Date(),
      } as never);

      const result = await fsModule.findFiles('/search/path', '*.txt');

      expect(result).toContain('/search/path/file1.txt');
      expect(result).toContain('/search/path/file3.txt');
      expect(result).not.toContain('/search/path/file2.js');
    });

    it('should handle search errors gracefully', async () => {
      const error = new Error('Permission denied');
      vi.mocked(fsPromises.readdir).mockRejectedValue(error);

      await expect(fsModule.findFiles('/protected', '*.txt')).rejects.toThrow(
        'Failed to find files'
      );
    });
  });

  describe('ensureDir', () => {
    it('should create directory', async () => {
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);

      await fsModule.ensureDir('/new/directory');

      expect(fsPromises.mkdir).toHaveBeenCalledWith('/new/directory', { recursive: true });
    });

    it('should handle mkdir errors', async () => {
      const error = new Error('Permission denied');
      vi.mocked(fsPromises.mkdir).mockRejectedValue(error);

      await expect(fsModule.ensureDir('/protected/directory')).rejects.toThrow(
        'Failed to create directory'
      );
    });
  });

  describe('remove', () => {
    it('should remove file', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        size: 100,
        mtime: new Date(),
        birthtime: new Date(),
      } as never);
      vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);

      await fsModule.remove('/path/to/file.txt');

      expect(fsPromises.unlink).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('should remove directory', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.stat).mockResolvedValue({
        isFile: () => false,
        isDirectory: () => true,
        isSymbolicLink: () => false,
        size: 0,
        mtime: new Date(),
        birthtime: new Date(),
      } as never);
      vi.mocked(fsPromises.rmdir).mockResolvedValue(undefined);

      await fsModule.remove('/path/to/dir');

      expect(fsPromises.rmdir).toHaveBeenCalledWith('/path/to/dir', { recursive: true });
    });
  });

  describe('move', () => {
    it('should move file', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.rename).mockResolvedValue(undefined);

      await fsModule.move('/source/file.txt', '/dest/file.txt');

      expect(fsPromises.rename).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt');
    });

    it('should handle move errors', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(fsModule.move('/nonexistent/file.txt', '/dest/file.txt')).rejects.toThrow(
        'Source does not exist'
      );
    });
  });

  describe('stat', () => {
    it('should get file statistics', async () => {
      const mockStats = {
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        size: 1024,
        mtime: new Date('2023-01-01'),
        birthtime: new Date('2023-01-01'),
      };
      vi.mocked(fsPromises.stat).mockResolvedValue(mockStats as never);

      const result = await fsModule.stat('/test/file.txt');

      expect(result.isFile).toBe(true);
      expect(result.size).toBe(1024);
      expect(fsPromises.stat).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should handle stat errors', async () => {
      const error = new Error('File not found');
      vi.mocked(fsPromises.stat).mockRejectedValue(error);

      await expect(fsModule.stat('/nonexistent/file.txt')).rejects.toThrow('Failed to get stats');
    });
  });
});
