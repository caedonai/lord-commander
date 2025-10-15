/**
 * File system utilities with safe operations and error handling
 * 
 * Provides secure file system operations with proper error handling,
 * progress tracking, and integration with the CLI logger system.
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { DEFAULT_IGNORE_PATTERNS } from './constants';
import { FileSystemError } from './errors';
import { createLogger } from './logger';

// Create a logger instance for internal file operations
const fsLogger = createLogger({ prefix: 'fs' });

/**
 * Options for file operations
 */
export interface FileOperationOptions {
  overwrite?: boolean; // Allow overwriting existing files/directories
  createDirs?: boolean; // Create parent directories if they don't exist
  recursive?: boolean; // Apply operation recursively to subdirectories
  ignorePatterns?: readonly string[]; // File patterns to skip (e.g., 'node_modules', '*.log')
  onProgress?: (current: number, total: number, file: string) => void; // Progress callback for long operations
}

/**
 * Options for copy operations
 */
export interface CopyOptions extends FileOperationOptions {
  filter?: (src: string, dest: string) => boolean | Promise<boolean>; // Custom function to decide which files to copy
  preserveTimestamps?: boolean; // Keep original file modification/creation times
  dereference?: boolean; // Follow symbolic links instead of copying them as links
}

/**
 * File system statistics interface
 */
export interface FileStats {
  isFile: boolean; // True if path points to a regular file
  isDirectory: boolean; // True if path points to a directory/folder
  isSymbolicLink: boolean; // True if path is a symbolic link (shortcut)
  size: number; // File size in bytes
  modified: Date; // Last modification timestamp
  created: Date; // Creation timestamp (birth time)
}

/**
 * Directory listing result
 */
export interface DirectoryEntry {
  name: string; // Just the filename or directory name (without path)
  path: string; // Full absolute or relative path to the item
  isFile: boolean; // True if this entry is a file
  isDirectory: boolean; // True if this entry is a directory
  size?: number; // File size in bytes (only present for files when includeStats=true)
}

/**
 * Check if a file or directory exists
 */
export function exists(filePath: string): boolean {
  try {
    return existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Get file/directory statistics
 */
export async function stat(filePath: string): Promise<FileStats> {
  try {
    const stats = await fs.stat(filePath);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime,
    };
  } catch (error) {
    throw new FileSystemError(
      `Failed to get stats for: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Ensure a directory exists, creating it and parent directories if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    fsLogger.debug(`Ensured directory exists: ${dirPath}`);
  } catch (error) {
    throw new FileSystemError(
      `Failed to create directory: ${dirPath}`,
      dirPath,
      error as Error
    );
  }
}

/**
 * Remove a file or directory
 */
export async function remove(targetPath: string, options: { recursive?: boolean } = {}): Promise<void> {
  try {
    if (!exists(targetPath)) {
      fsLogger.debug(`Path does not exist, nothing to remove: ${targetPath}`);
      return;
    }

    const stats = await stat(targetPath);
    
    if (stats.isDirectory) {
      await fs.rmdir(targetPath, { recursive: options.recursive ?? true });
      fsLogger.debug(`Removed directory: ${targetPath}`);
    } else {
      await fs.unlink(targetPath);
      fsLogger.debug(`Removed file: ${targetPath}`);
    }
  } catch (error) {
    throw new FileSystemError(
      `Failed to remove: ${targetPath}`,
      targetPath,
      error as Error
    );
  }
}

/**
 * Read a text file
 */
export async function readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
  try {
    const content = await fs.readFile(filePath, encoding);
    fsLogger.debug(`Read file: ${filePath} (${content.length} chars)`);
    return content;
  } catch (error) {
    throw new FileSystemError(
      `Failed to read file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Write a text file
 */
export async function writeFile(
  filePath: string, 
  content: string, 
  options: FileOperationOptions = {}
): Promise<void> {
  try {
    const { createDirs = true, overwrite = true } = options;

    // Check if file exists and overwrite is disabled
    if (!overwrite && exists(filePath)) {
      throw new FileSystemError(
        `File already exists and overwrite is disabled: ${filePath}`,
        filePath
      );
    }

    // Create parent directories if needed
    if (createDirs) {
      const parentDir = path.dirname(filePath);
      await ensureDir(parentDir);
    }

    await fs.writeFile(filePath, content, 'utf8');
    fsLogger.debug(`Wrote file: ${filePath} (${content.length} chars)`);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(
      `Failed to write file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Read and parse a JSON file
 */
export async function readJSON<T = any>(filePath: string): Promise<T> {
  try {
    const content = await readFile(filePath);
    const parsed = JSON.parse(content);
    fsLogger.debug(`Read JSON file: ${filePath}`);
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new FileSystemError(
        `Invalid JSON in file: ${filePath}`,
        filePath,
        error
      );
    }
    throw error;
  }
}

/**
 * Write an object as JSON file
 */
export async function writeJSON(
  filePath: string, 
  data: any, 
  options: FileOperationOptions & { indent?: number } = {}
): Promise<void> {
  try {
    const { indent = 2, ...fileOptions } = options;
    const content = JSON.stringify(data, null, indent);
    await writeFile(filePath, content, fileOptions);
    fsLogger.debug(`Wrote JSON file: ${filePath}`);
  } catch (error) {
    throw new FileSystemError(
      `Failed to write JSON file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Copy a file
 */
export async function copyFile(
  srcPath: string, 
  destPath: string, 
  options: CopyOptions = {}
): Promise<void> {
  try {
    const { overwrite = true, createDirs = true, preserveTimestamps = false } = options;

    // Check if source exists
    if (!exists(srcPath)) {
      throw new FileSystemError(
        `Source file does not exist: ${srcPath}`,
        srcPath
      );
    }

    // Check if destination exists and overwrite is disabled
    if (!overwrite && exists(destPath)) {
      throw new FileSystemError(
        `Destination file already exists and overwrite is disabled: ${destPath}`,
        destPath
      );
    }

    // Create destination directory if needed
    if (createDirs) {
      const destDir = path.dirname(destPath);
      await ensureDir(destDir);
    }

    // Copy the file
    await fs.copyFile(srcPath, destPath);

    // Preserve timestamps if requested
    if (preserveTimestamps) {
      const srcStats = await stat(srcPath);
      await fs.utimes(destPath, srcStats.modified, srcStats.modified);
    }

    fsLogger.debug(`Copied file: ${srcPath} -> ${destPath}`);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(
      `Failed to copy file: ${srcPath} -> ${destPath}`,
      srcPath,
      error as Error
    );
  }
}

/**
 * Check if a path matches any ignore pattern
 */
function shouldIgnore(filePath: string, ignorePatterns: readonly string[]): boolean {
  const normalizedPath = path.normalize(filePath).replace(/\\/g, '/'); // Normalize path separators for cross-platform compatibility
  return ignorePatterns.some(pattern => {
    // Simple glob-like matching - convert wildcards to regex
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(normalizedPath);
    }
    // Direct string matching for simple patterns like 'node_modules'
    return normalizedPath.includes(pattern);
  });
}

/**
 * List directory contents
 */
export async function readDir(
  dirPath: string, 
  options: { 
    recursive?: boolean; // Scan subdirectories recursively
    includeStats?: boolean; // Include file sizes and detailed stats
  } = {}
): Promise<DirectoryEntry[]> {
  try {
    const { recursive = false, includeStats = false } = options;
    const entries: DirectoryEntry[] = [];

    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      let stats: FileStats;
      
      if (includeStats) {
        stats = await stat(itemPath);
      } else {
        const fsStats = await fs.stat(itemPath);
        stats = {
          isFile: fsStats.isFile(),
          isDirectory: fsStats.isDirectory(),
          isSymbolicLink: fsStats.isSymbolicLink(),
          size: fsStats.size,
          modified: fsStats.mtime,
          created: fsStats.birthtime,
        };
      }
      
      const entry: DirectoryEntry = {
        name: item,
        path: itemPath,
        isFile: stats.isFile,
        isDirectory: stats.isDirectory,
      };

      if (includeStats && stats.isFile) {
        entry.size = stats.size;
      }

      entries.push(entry);

      // Recursively read subdirectories if requested
      if (recursive && stats.isDirectory) {
        const subEntries = await readDir(itemPath, options);
        entries.push(...subEntries);
      }
    }

    fsLogger.debug(`Read directory: ${dirPath} (${entries.length} entries)`);
    return entries;
  } catch (error) {
    throw new FileSystemError(
      `Failed to read directory: ${dirPath}`,
      dirPath,
      error as Error
    );
  }
}

/**
 * Copy a directory and its contents
 */
export async function copyDir(
  srcDir: string, 
  destDir: string, 
  options: CopyOptions = {}
): Promise<void> {
  try {
    const { 
      overwrite = true, 
      recursive = true,
      ignorePatterns = DEFAULT_IGNORE_PATTERNS,
      filter,
      onProgress
    } = options;

    // Check if source directory exists
    if (!exists(srcDir)) {
      throw new FileSystemError(
        `Source directory does not exist: ${srcDir}`,
        srcDir
      );
    }

    // Create destination directory
    await ensureDir(destDir);

    // Get all files and directories to copy
    const entries = await readDir(srcDir, { recursive });
    let processed = 0;

    for (const entry of entries) {
      const relativePath = path.relative(srcDir, entry.path);
      const destPath = path.join(destDir, relativePath);

      // Check ignore patterns
      if (shouldIgnore(relativePath, ignorePatterns)) {
        fsLogger.debug(`Ignored: ${relativePath}`);
        continue;
      }

      // Apply custom filter if provided
      if (filter && !(await filter(entry.path, destPath))) {
        fsLogger.debug(`Filtered out: ${relativePath}`);
        continue;
      }

      // Progress callback
      if (onProgress) {
        onProgress(processed + 1, entries.length, relativePath);
      }

      if (entry.isFile) {
        await copyFile(entry.path, destPath, { 
          overwrite, 
          createDirs: true,
          preserveTimestamps: options.preserveTimestamps 
        });
      } else if (entry.isDirectory) {
        await ensureDir(destPath);
      }

      processed++;
    }

    fsLogger.debug(`Copied directory: ${srcDir} -> ${destDir} (${processed} items)`);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(
      `Failed to copy directory: ${srcDir} -> ${destDir}`,
      srcDir,
      error as Error
    );
  }
}

/**
 * Copy files or directories (auto-detects type)
 */
export async function copy(
  src: string, 
  dest: string, 
  options: CopyOptions = {}
): Promise<void> {
  try {
    if (!exists(src)) {
      throw new FileSystemError(
        `Source does not exist: ${src}`,
        src
      );
    }

    const srcStats = await stat(src);
    
    if (srcStats.isFile) {
      await copyFile(src, dest, options);
    } else if (srcStats.isDirectory) {
      await copyDir(src, dest, options);
    } else {
      throw new FileSystemError(
        `Source is neither a file nor a directory: ${src}`,
        src
      );
    }
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(
      `Failed to copy: ${src} -> ${dest}`,
      src,
      error as Error
    );
  }
}

/**
 * Find files matching a pattern
 */
export async function findFiles(
  searchDir: string,
  pattern: string | RegExp, // Pattern to match filenames (supports wildcards like '*.js')
  options: { 
    recursive?: boolean; // Search subdirectories
    ignorePatterns?: readonly string[]; // Patterns to exclude from search
  } = {}
): Promise<string[]> {
  try {
    const { recursive = true, ignorePatterns = DEFAULT_IGNORE_PATTERNS } = options;
    const matches: string[] = [];
    
    // Convert string patterns with wildcards to regex (e.g., '*.js' becomes /.*\.js/)
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*'))
      : pattern;

    const entries = await readDir(searchDir, { recursive });
    
    for (const entry of entries) {
      if (!entry.isFile) continue;
      
      const relativePath = path.relative(searchDir, entry.path);
      
      // Check ignore patterns
      if (shouldIgnore(relativePath, ignorePatterns)) {
        continue;
      }

      // Check if filename matches pattern
      if (regex.test(entry.name) || regex.test(relativePath)) {
        matches.push(entry.path);
      }
    }

    fsLogger.debug(`Found ${matches.length} files matching pattern in: ${searchDir}`);
    return matches;
  } catch (error) {
    throw new FileSystemError(
      `Failed to find files in: ${searchDir}`,
      searchDir,
      error as Error
    );
  }
}

/**
 * Clean a directory (remove all contents but keep the directory)
 */
export async function cleanDir(dirPath: string): Promise<void> {
  try {
    if (!exists(dirPath)) {
      fsLogger.debug(`Directory does not exist, nothing to clean: ${dirPath}`);
      return;
    }

    const entries = await readDir(dirPath);
    
    for (const entry of entries) {
      await remove(entry.path, { recursive: true });
    }

    fsLogger.debug(`Cleaned directory: ${dirPath} (${entries.length} items removed)`);
  } catch (error) {
    throw new FileSystemError(
      `Failed to clean directory: ${dirPath}`,
      dirPath,
      error as Error
    );
  }
}

/**
 * Get the size of a file or directory in bytes
 */
export async function getSize(targetPath: string): Promise<number> {
  try {
    const stats = await stat(targetPath);
    
    if (stats.isFile) {
      return stats.size;
    }
    
    if (stats.isDirectory) {
      const entries = await readDir(targetPath, { recursive: true, includeStats: true });
      return entries
        .filter(entry => entry.isFile)
        .reduce((total, entry) => total + (entry.size || 0), 0);
    }
    
    return 0;
  } catch (error) {
    throw new FileSystemError(
      `Failed to get size of: ${targetPath}`,
      targetPath,
      error as Error
    );
  }
}

/**
 * Move (rename) a file or directory
 */
export async function move(src: string, dest: string, options: FileOperationOptions = {}): Promise<void> {
  try {
    const { overwrite = true, createDirs = true } = options;

    if (!exists(src)) {
      throw new FileSystemError(
        `Source does not exist: ${src}`,
        src
      );
    }

    if (!overwrite && exists(dest)) {
      throw new FileSystemError(
        `Destination already exists and overwrite is disabled: ${dest}`,
        dest
      );
    }

    if (createDirs) {
      const destDir = path.dirname(dest);
      await ensureDir(destDir);
    }

    await fs.rename(src, dest);
    fsLogger.debug(`Moved: ${src} -> ${dest}`);
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError(
      `Failed to move: ${src} -> ${dest}`,
      src,
      error as Error
    );
  }
}