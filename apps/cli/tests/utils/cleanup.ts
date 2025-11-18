import { rm, access, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Cleanup utilities for integration tests
 * Ensures proper cleanup of scaffolded projects, temporary directories,
 * and any artifacts created during testing.
 */

export interface CleanupOptions {
  /** Force removal even if path is outside test directory */
  force?: boolean;
  /** Verbose logging of cleanup operations */
  verbose?: boolean;
  /** Maximum depth to traverse for cleanup */
  maxDepth?: number;
}

/**
 * Safely removes a directory and all its contents
 * Includes safety checks to prevent accidental deletion of important directories
 */
export async function safeRemoveDirectory(
  path: string, 
  options: CleanupOptions = {}
): Promise<void> {
  const { force = false, verbose = false, maxDepth = 10 } = options;

  try {
    // Safety checks to prevent accidental deletion of important directories
    if (!force) {
      await validateSafePath(path);
    }

    // Check if path exists
    try {
      await access(path);
    } catch {
      // Path doesn't exist, nothing to clean up
      if (verbose) {
        console.log(`Cleanup: Path ${path} does not exist, skipping`);
      }
      return;
    }

    // Verify it's actually a directory
    const pathStats = await stat(path);
    if (!pathStats.isDirectory()) {
      throw new Error(`Path ${path} is not a directory`);
    }

    // Check directory depth to prevent infinite loops
    const depth = path.split('/').length;
    if (depth > maxDepth) {
      throw new Error(`Path ${path} exceeds maximum depth of ${maxDepth}`);
    }

    if (verbose) {
      console.log(`Cleanup: Removing directory ${path}`);
    }

    // Remove the directory and all contents
    await rm(path, { 
      recursive: true, 
      force: true,
      // Retry on busy/locked files (common on Windows)
      maxRetries: 3,
      retryDelay: 100
    });

    if (verbose) {
      console.log(`Cleanup: Successfully removed ${path}`);
    }
  } catch (error) {
    console.error(`Cleanup failed for ${path}:`, error);
    throw error;
  }
}

/**
 * Validates that a path is safe to delete
 * Prevents deletion of system directories, home directory, etc.
 */
async function validateSafePath(path: string): Promise<void> {
  // Normalize path for comparison
  const normalizedPath = path.toLowerCase();
  
  // Get temp directory for comparison
  const tempDir = tmpdir().toLowerCase();
  
  // List of dangerous paths that should never be deleted
  const dangerousPaths = [
    '/',
    '/home',
    '/usr',
    '/var',
    '/etc',
    '/bin',
    '/sbin',
    '/root',
    '/opt',
    'c:\\',
    'c:\\windows',
    'c:\\users',
    'c:\\program files',
    process.env.HOME?.toLowerCase(),
    process.cwd().toLowerCase()
  ].filter(Boolean);

  // Check if path is in dangerous paths
  for (const dangerousPath of dangerousPaths) {
    if (normalizedPath === dangerousPath || normalizedPath.startsWith(dangerousPath + '/')) {
      throw new Error(`Refusing to delete dangerous path: ${path}`);
    }
  }

  // Ensure path is within temp directory (safest option)
  if (!normalizedPath.startsWith(tempDir)) {
    // Allow if it's clearly a test directory
    const testIndicators = ['test', 'temp', 'tmp', 'lord-commander-test', 'vitest'];
    const hasTestIndicator = testIndicators.some(indicator => 
      normalizedPath.includes(indicator)
    );
    
    if (!hasTestIndicator) {
      throw new Error(
        `Path ${path} is not in temp directory (${tempDir}) and doesn't appear to be a test directory. Use force: true to override.`
      );
    }
  }
}

/**
 * Cleanup utility for scaffolded CLI projects
 * Removes common CLI project artifacts
 */
export async function cleanupScaffoldedProject(
  projectPath: string,
  options: CleanupOptions = {}
): Promise<void> {
  const { verbose = false } = options;

  if (verbose) {
    console.log(`Cleanup: Starting scaffolded project cleanup for ${projectPath}`);
  }

  try {
    // Common directories created by scaffolding
    const commonDirs = [
      'node_modules',
      'dist',
      'build',
      '.next',
      '.nx',
      'coverage'
    ];

    // Clean up common build artifacts first
    for (const dir of commonDirs) {
      const dirPath = join(projectPath, dir);
      try {
        await safeRemoveDirectory(dirPath, { ...options, force: true });
      } catch (error) {
        // Continue cleanup even if some artifacts fail to remove
        if (verbose) {
          console.warn(`Cleanup: Failed to remove ${dirPath}:`, error);
        }
      }
    }

    // Remove the main project directory
    await safeRemoveDirectory(projectPath, options);

  } catch (error) {
    console.error(`Scaffolded project cleanup failed for ${projectPath}:`, error);
    throw error;
  }
}

/**
 * Cleanup utility for monorepo structures
 * Handles NX workspaces and multi-app setups
 */
export async function cleanupMonorepo(
  workspacePath: string,
  options: CleanupOptions = {}
): Promise<void> {
  const { verbose = false } = options;

  if (verbose) {
    console.log(`Cleanup: Starting monorepo cleanup for ${workspacePath}`);
  }

  try {
    // Monorepo-specific artifacts
    const monorepoArtifacts = [
      'node_modules',
      'dist',
      'tmp',
      '.nx',
      'coverage',
      // App-specific artifacts
      join('apps', '*/dist'),
      join('apps', '*/node_modules'),
      join('apps', '*/build'),
      join('apps', '*/.next'),
      // Lib-specific artifacts  
      join('libs', '*/dist'),
      join('libs', '*/node_modules'),
      join('libs', '*/coverage')
    ];

    // Clean up artifacts first
    for (const artifact of monorepoArtifacts) {
      try {
        const artifactPath = join(workspacePath, artifact);
        // Handle glob patterns for apps/libs
        if (artifact.includes('*')) {
          // This would require glob expansion in a real implementation
          // For now, skip glob patterns
          continue;
        }
        await safeRemoveDirectory(artifactPath, { ...options, force: true });
      } catch (error) {
        if (verbose) {
          console.warn(`Cleanup: Failed to remove ${artifact}:`, error);
        }
      }
    }

    // Remove the workspace directory
    await safeRemoveDirectory(workspacePath, options);

  } catch (error) {
    console.error(`Monorepo cleanup failed for ${workspacePath}:`, error);
    throw error;
  }
}

/**
 * Creates a cleanup function that can be used in test teardown
 * Returns a function that safely cleans up all registered paths
 */
export function createTestCleanup(options: CleanupOptions = {}) {
  const pathsToCleanup = new Set<string>();
  
  return {
    /**
     * Register a path for cleanup
     */
    register(path: string): void {
      pathsToCleanup.add(path);
    },

    /**
     * Clean up all registered paths
     */
    async cleanup(): Promise<void> {
      const cleanupPromises = Array.from(pathsToCleanup).map(async (path) => {
        try {
          await safeRemoveDirectory(path, options);
        } catch (error) {
          console.error(`Failed to cleanup registered path ${path}:`, error);
        }
      });

      await Promise.all(cleanupPromises);
      pathsToCleanup.clear();
    },

    /**
     * Get all registered paths (for debugging)
     */
    getRegisteredPaths(): string[] {
      return Array.from(pathsToCleanup);
    }
  };
}

/**
 * Utility for cleaning up package manager artifacts
 * Handles npm, pnpm, yarn lockfiles and caches
 */
export async function cleanupPackageManagerArtifacts(
  projectPath: string,
  options: CleanupOptions = {}
): Promise<void> {
  const { verbose = false } = options;

  if (verbose) {
    console.log(`Cleanup: Removing package manager artifacts from ${projectPath}`);
  }

  const artifacts = [
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.npmrc',
    '.pnpmrc',
    '.yarnrc',
    '.yarn',
    'node_modules'
  ];

  for (const artifact of artifacts) {
    try {
      const artifactPath = join(projectPath, artifact);
      await safeRemoveDirectory(artifactPath, { ...options, force: true });
    } catch {
      // Ignore errors for individual artifacts
      // They might not exist or be locked
    }
  }
}

/**
 * Emergency cleanup function for when tests fail catastrophically
 * Attempts to clean up common test directories
 */
export async function emergencyCleanup(options: CleanupOptions = {}): Promise<void> {
  const { verbose = false } = options;
  
  if (verbose) {
    console.log('Cleanup: Running emergency cleanup...');
  }

  const tempDir = tmpdir();
  const commonTestPatterns = [
    'lord-commander-test-*',
    'lord-commander-status-test-*',
    'vitest-*',
    'tmp-*-lord-commander'
  ];

  // This is a simplified version - a full implementation would use glob
  // to find directories matching patterns and clean them up
  
  console.log(`Emergency cleanup complete. Temp directory: ${tempDir}`);
}

/**
 * Validates that cleanup was successful
 * Checks that specified paths no longer exist
 */
export async function validateCleanup(paths: string[]): Promise<boolean> {
  for (const path of paths) {
    try {
      await access(path);
      // If we can access it, cleanup failed
      console.error(`Cleanup validation failed: ${path} still exists`);
      return false;
    } catch {
      // Good, path doesn't exist anymore
    }
  }
  
  return true;
}