/**
 * @file File System Module Tests - Simplified Version
 * @description Focused test suite for the fs.ts module with proper mocking
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';
import * as fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';

// Mock Node.js fs modules
vi.mock('node:fs', () => ({
  existsSync: vi.fn()
}));

vi.mock('node:fs/promises', () => ({
  default: {
    stat: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    copyFile: vi.fn(),
    utimes: vi.fn(),
    readdir: vi.fn(),
    rename: vi.fn()
  }
}));

// Mock logger to prevent console output during tests
vi.mock('../../core/ui/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

// Mock constants
vi.mock('../../core/foundation/core/constants.js', () => ({
  DEFAULT_IGNORE_PATTERNS: ['node_modules', '.git', '*.log']
}));

// Mock FileSystemError
vi.mock('../../core/foundation/errors/errors.js', () => ({
  FileSystemError: class FileSystemError extends Error {
    constructor(message: string, _path?: string, cause?: Error) {
      super(message);
      this.name = 'FileSystemError';
      this.cause = cause;
    }
  }
}));

import * as fsModule from '../../core/execution/fs.js';

describe('File System Module - Basic Functions', () => {
  let mockExistsSync: MockedFunction<typeof fs.existsSync>;
  let mockStat: MockedFunction<typeof fsPromises.stat>;
  let mockMkdir: MockedFunction<typeof fsPromises.mkdir>;
  let mockReadFile: MockedFunction<typeof fsPromises.readFile>;
  let mockWriteFile: MockedFunction<typeof fsPromises.writeFile>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocked functions
    mockExistsSync = vi.mocked(fs.existsSync);
    mockStat = vi.mocked(fsPromises.stat);
    mockMkdir = vi.mocked(fsPromises.mkdir);
    mockReadFile = vi.mocked(fsPromises.readFile);
    mockWriteFile = vi.mocked(fsPromises.writeFile);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exists', () => {
    it('should return true when file exists', () => {
      mockExistsSync.mockReturnValue(true);
      
      const result = fsModule.exists('/test/file.txt');
      
      expect(result).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should return false when file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = fsModule.exists('/nonexistent/file.txt');
      
      expect(result).toBe(false);
      expect(mockExistsSync).toHaveBeenCalledWith('/nonexistent/file.txt');
    });

    it('should return false when existsSync throws an error', () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = fsModule.exists('/protected/file.txt');
      
      expect(result).toBe(false);
    });
  });

  describe('stat', () => {
    it('should return file statistics successfully', async () => {
      const mockStats = {
        isFile: vi.fn(() => true),
        isDirectory: vi.fn(() => false),
        isSymbolicLink: vi.fn(() => false),
        size: 1024,
        mtime: new Date('2023-01-01'),
        birthtime: new Date('2023-01-01')
      };
      mockStat.mockResolvedValue(mockStats as any);
      
      const result = await fsModule.stat('/test/file.txt');
      
      expect(result).toEqual({
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        size: 1024,
        modified: new Date('2023-01-01'),
        created: new Date('2023-01-01')
      });
      expect(mockStat).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should throw FileSystemError when stat fails', async () => {
      mockStat.mockRejectedValue(new Error('File not found'));
      
      await expect(fsModule.stat('/nonexistent/file.txt')).rejects.toThrow('Failed to get stats for: /nonexistent/file.txt');
    });
  });

  describe('ensureDir', () => {
    it('should create directory successfully', async () => {
      mockMkdir.mockResolvedValue(undefined);
      
      await fsModule.ensureDir('/test/new-dir');
      
      expect(mockMkdir).toHaveBeenCalledWith('/test/new-dir', { recursive: true });
    });

    it('should throw FileSystemError when mkdir fails', async () => {
      mockMkdir.mockRejectedValue(new Error('Permission denied'));
      
      await expect(fsModule.ensureDir('/protected/new-dir')).rejects.toThrow('Failed to create directory: /protected/new-dir');
    });
  });

  describe('readFile', () => {
    it('should read file successfully with default encoding', async () => {
      const content = 'Hello, World!';
      mockReadFile.mockResolvedValue(content);
      
      const result = await fsModule.readFile('/test/file.txt');
      
      expect(result).toBe(content);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
    });

    it('should read file with custom encoding', async () => {
      const content = 'Hello, World!';
      mockReadFile.mockResolvedValue(content);
      
      const result = await fsModule.readFile('/test/file.txt', 'ascii');
      
      expect(result).toBe(content);
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.txt', 'ascii');
    });

    it('should throw FileSystemError when read fails', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      
      await expect(fsModule.readFile('/nonexistent/file.txt')).rejects.toThrow('Failed to read file: /nonexistent/file.txt');
    });
  });

  describe('writeFile', () => {
    it('should write file successfully with simple options', async () => {
      const content = 'Hello, World!';
      
      // Mock path.dirname to return a directory
      vi.spyOn(path, 'dirname').mockReturnValue('/test');
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockExistsSync.mockReturnValue(false); // File doesn't exist yet
      
      await fsModule.writeFile('/test/file.txt', content);
      
      expect(mockWriteFile).toHaveBeenCalledWith('/test/file.txt', content, 'utf8');
    });

    it('should throw FileSystemError when file exists and overwrite is disabled', async () => {
      mockExistsSync.mockReturnValue(true);
      
      await expect(fsModule.writeFile('/test/file.txt', 'content', { overwrite: false }))
        .rejects.toThrow('File already exists and overwrite is disabled: /test/file.txt');
    });

    it('should not create directories when createDirs is false', async () => {
      const content = 'Hello, World!';
      mockWriteFile.mockResolvedValue(undefined);
      mockExistsSync.mockReturnValue(false);
      
      await fsModule.writeFile('/test/file.txt', content, { createDirs: false });
      
      expect(mockMkdir).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith('/test/file.txt', content, 'utf8');
    });
  });

  describe('readJSON', () => {
    it('should read and parse JSON file successfully', async () => {
      const jsonContent = '{"name": "test", "version": "1.0.0"}';
      const expectedData = { name: 'test', version: '1.0.0' };
      mockReadFile.mockResolvedValue(jsonContent);
      
      const result = await fsModule.readJSON('/test/package.json');
      
      expect(result).toEqual(expectedData);
      expect(mockReadFile).toHaveBeenCalledWith('/test/package.json', 'utf8');
    });

    it('should throw FileSystemError for invalid JSON', async () => {
      const invalidJson = '{"name": "test", "version":}';
      mockReadFile.mockResolvedValue(invalidJson);
      
      await expect(fsModule.readJSON('/test/invalid.json')).rejects.toThrow('Invalid JSON in file: /test/invalid.json');
    });
  });

  describe('writeJSON', () => {
    it('should write JSON file with default indent', async () => {
      const data = { name: 'test', version: '1.0.0' };
      const expectedContent = JSON.stringify(data, null, 2);
      
      // Mock dependencies
      vi.spyOn(path, 'dirname').mockReturnValue('/test');
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockExistsSync.mockReturnValue(false);
      
      await fsModule.writeJSON('/test/package.json', data);
      
      expect(mockWriteFile).toHaveBeenCalledWith('/test/package.json', expectedContent, 'utf8');
    });

    it('should write JSON file with custom indent', async () => {
      const data = { name: 'test' };
      const expectedContent = JSON.stringify(data, null, 4);
      
      vi.spyOn(path, 'dirname').mockReturnValue('/test');
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockExistsSync.mockReturnValue(false);
      
      await fsModule.writeJSON('/test/file.json', data, { indent: 4 });
      
      expect(mockWriteFile).toHaveBeenCalledWith('/test/file.json', expectedContent, 'utf8');
    });
  });

  describe('Module Export Structure', () => {
    it('should export all core functions', () => {
      expect(typeof fsModule.exists).toBe('function');
      expect(typeof fsModule.ensureDir).toBe('function');
      expect(typeof fsModule.readFile).toBe('function');
      expect(typeof fsModule.writeFile).toBe('function');
      expect(typeof fsModule.readJSON).toBe('function');
      expect(typeof fsModule.writeJSON).toBe('function');
    });

    it('should export directory operations', () => {
      expect(typeof fsModule.readDir).toBe('function');
      expect(typeof fsModule.remove).toBe('function');
      expect(typeof fsModule.cleanDir).toBe('function');
    });

    it('should export advanced operations', () => {
      expect(typeof fsModule.copy).toBe('function');
      expect(typeof fsModule.copyFile).toBe('function');
      expect(typeof fsModule.copyDir).toBe('function');
      expect(typeof fsModule.move).toBe('function');
      expect(typeof fsModule.stat).toBe('function');
      expect(typeof fsModule.getSize).toBe('function');
      expect(typeof fsModule.findFiles).toBe('function');
    });
  });
});