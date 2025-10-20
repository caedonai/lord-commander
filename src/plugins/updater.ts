/**
 * Updater Plugin - Version comparison and patch application engine
 * 
 * Provides semantic version management and project update capabilities:
 * - Semantic version parsing and comparison
 * - Git-based version diffing and change detection
 * - Patch application and conflict resolution
 * - Update planning and validation
 */

import * as git from './git.js';
import { execa } from '../core/execution/execa.js';
import { ensureDir, copyFile, exists } from '../core/execution/fs.js';
import { CLIError } from '../core/foundation/errors.js';
import { logger } from '../core/ui/logger.js';
import path from 'node:path';
import fs from 'node:fs/promises';

// Semantic Version interfaces and types
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
  raw: string;
}

export interface VersionDiff {
  from: SemanticVersion;
  to: SemanticVersion;
  changeType: 'major' | 'minor' | 'patch' | 'prerelease' | 'none';
  files: FileDiff[];
  commits: git.GitCommit[];
  breaking: boolean;
}

export interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string; // For renamed files
  insertions: number;
  deletions: number;
  content?: {
    before?: string;
    after?: string;
  };
}

export interface UpdatePlan {
  fromVersion: string;
  toVersion: string;
  diff: VersionDiff;
  conflicts: UpdateConflict[];
  strategy: UpdateStrategy;
  backupRequired: boolean;
}

export interface UpdateConflict {
  file: string;
  type: 'content' | 'deletion' | 'permission' | 'dependency';
  description: string;
  resolution?: 'skip' | 'overwrite' | 'merge' | 'manual';
}

export interface UpdateStrategy {
  type: 'overwrite' | 'merge' | 'selective';
  excludePaths: string[];
  preserveFiles: string[];
  customMergers: Record<string, (local: string, remote: string) => string>;
}

export interface UpdateOptions {
  strategy?: Partial<UpdateStrategy>;
  createBackup?: boolean;
  dryRun?: boolean;
  force?: boolean;
  interactive?: boolean;
}

// Semantic Version utilities
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?(?:\+([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?$/;

/**
 * Parse a semantic version string
 */
export function parseVersion(versionString: string): SemanticVersion {
  // Handle 'v' prefix
  const cleaned = versionString.replace(/^v/, '');
  const match = cleaned.match(VERSION_REGEX);
  
  if (!match) {
    throw new CLIError(`Invalid semantic version: ${versionString}`, {
      code: 'INVALID_SEMVER',
      suggestion: 'Use format: major.minor.patch[-prerelease][+build]'
    });
  }
  
  const [, major, minor, patch, prerelease, build] = match;
  
  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease,
    build,
    raw: versionString
  };
}

/**
 * Compare two semantic versions
 * Returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: SemanticVersion, b: SemanticVersion): number {
  // Compare major.minor.patch
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  
  // Handle prerelease precedence
  if (!a.prerelease && !b.prerelease) return 0;
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && !b.prerelease) return -1;
  
  // Compare prerelease versions
  if (a.prerelease && b.prerelease) {
    const aParts = a.prerelease.split('.');
    const bParts = b.prerelease.split('.');
    const maxLength = Math.max(aParts.length, bParts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || '';
      const bPart = bParts[i] || '';
      
      if (aPart !== bPart) {
        // Numeric comparison if both are numbers
        const aNum = parseInt(aPart, 10);
        const bNum = parseInt(bPart, 10);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // Lexical comparison otherwise
        return aPart < bPart ? -1 : 1;
      }
    }
  }
  
  return 0;
}

/**
 * Determine the type of version change
 */
export function getChangeType(from: SemanticVersion, to: SemanticVersion): 'major' | 'minor' | 'patch' | 'prerelease' | 'none' {
  if (from.major !== to.major) return 'major';
  if (from.minor !== to.minor) return 'minor';
  if (from.patch !== to.patch) return 'patch';
  if (from.prerelease !== to.prerelease) return 'prerelease';
  return 'none';
}

/**
 * Check if a version satisfies a range (simple implementation)
 */
export function satisfiesRange(version: SemanticVersion, range: string): boolean {
  // Basic range patterns: "^1.2.3", "~1.2.3", ">=1.2.3", "1.2.3"
  if (range.startsWith('^')) {
    const targetVersion = parseVersion(range.slice(1));
    return version.major === targetVersion.major && compareVersions(version, targetVersion) >= 0;
  }
  
  if (range.startsWith('~')) {
    const targetVersion = parseVersion(range.slice(1));
    return version.major === targetVersion.major && 
           version.minor === targetVersion.minor && 
           compareVersions(version, targetVersion) >= 0;
  }
  
  if (range.startsWith('>=')) {
    const targetVersion = parseVersion(range.slice(2));
    return compareVersions(version, targetVersion) >= 0;
  }
  
  if (range.startsWith('>')) {
    const targetVersion = parseVersion(range.slice(1));
    return compareVersions(version, targetVersion) > 0;
  }
  
  if (range.startsWith('<=')) {
    const targetVersion = parseVersion(range.slice(2));
    return compareVersions(version, targetVersion) <= 0;
  }
  
  if (range.startsWith('<')) {
    const targetVersion = parseVersion(range.slice(1));
    return compareVersions(version, targetVersion) < 0;
  }
  
  // Exact match
  const targetVersion = parseVersion(range);
  return compareVersions(version, targetVersion) === 0;
}

// Git-based version diffing
/**
 * Get detailed diff between two git tags/commits
 */
export async function getVersionDiff(
  fromTag: string, 
  toTag: string, 
  cwd: string = process.cwd()
): Promise<VersionDiff> {
  const fromVersion = parseVersion(fromTag);
  const toVersion = parseVersion(toTag);
  
  try {
    // Get commit history between versions
    const commits = await getCommitsBetweenTags(fromTag, toTag, cwd);
    
    // Get file changes
    const files = await getFilesBetweenTags(fromTag, toTag, cwd);
    
    // Determine if this is a breaking change
    const breaking = await isBreakingChange(fromTag, toTag, cwd);
    
    return {
      from: fromVersion,
      to: toVersion,
      changeType: getChangeType(fromVersion, toVersion),
      files,
      commits,
      breaking
    };
  } catch (error) {
    throw new CLIError(`Failed to get version diff from ${fromTag} to ${toTag}`, {
      code: 'VERSION_DIFF_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { fromTag, toTag, cwd }
    });
  }
}

/**
 * Get commits between two git tags
 */
async function getCommitsBetweenTags(
  fromTag: string, 
  toTag: string, 
  cwd: string
): Promise<git.GitCommit[]> {
  try {
    const format = '--pretty=format:%H|%h|%an|%ae|%ai|%s';
    const result = await execa('git', ['log', `${fromTag}..${toTag}`, format], { cwd });
    
    return result.stdout
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [hash, shortHash, author, email, date, message] = line.split('|');
        return {
          hash,
          shortHash,
          author,
          email,
          date: new Date(date),
          message
        };
      });
  } catch (error) {
    throw new CLIError(`Failed to get commits between ${fromTag} and ${toTag}`, {
      code: 'GIT_COMMITS_FAILED',
      cause: error instanceof Error ? error : undefined
    });
  }
}

/**
 * Get detailed file changes between two git tags
 */
async function getFilesBetweenTags(
  fromTag: string, 
  toTag: string, 
  cwd: string
): Promise<FileDiff[]> {
  try {
    // Get file stats
    const statsResult = await execa('git', ['diff', '--numstat', `${fromTag}..${toTag}`], { cwd });
    const stats = new Map<string, { insertions: number; deletions: number }>();
    
    for (const line of statsResult.stdout.trim().split('\n').filter(Boolean)) {
      const [insertions, deletions, path] = line.split('\t');
      stats.set(path, {
        insertions: insertions === '-' ? 0 : parseInt(insertions, 10),
        deletions: deletions === '-' ? 0 : parseInt(deletions, 10)
      });
    }
    
    // Get file status (added, modified, deleted, renamed)
    const nameStatusResult = await execa('git', ['diff', '--name-status', `${fromTag}..${toTag}`], { cwd });
    const files: FileDiff[] = [];
    
    for (const line of nameStatusResult.stdout.trim().split('\n').filter(Boolean)) {
      const parts = line.split('\t');
      const status = parts[0];
      const path = parts[1];
      
      let fileStatus: FileDiff['status'];
      let oldPath: string | undefined;
      
      if (status === 'A') {
        fileStatus = 'added';
      } else if (status === 'D') {
        fileStatus = 'deleted';
      } else if (status === 'M') {
        fileStatus = 'modified';
      } else if (status.startsWith('R')) {
        fileStatus = 'renamed';
        oldPath = path;
        // For renames, the new path is in parts[2]
        const newPath = parts[2];
        const fileStats = stats.get(newPath) || { insertions: 0, deletions: 0 };
        
        files.push({
          path: newPath,
          status: fileStatus,
          oldPath,
          insertions: fileStats.insertions,
          deletions: fileStats.deletions
        });
        continue;
      } else {
        fileStatus = 'modified'; // Default for other statuses
      }
      
      const fileStats = stats.get(path) || { insertions: 0, deletions: 0 };
      
      files.push({
        path,
        status: fileStatus,
        oldPath,
        insertions: fileStats.insertions,
        deletions: fileStats.deletions
      });
    }
    
    return files;
  } catch (error) {
    throw new CLIError(`Failed to get file changes between ${fromTag} and ${toTag}`, {
      code: 'GIT_FILES_FAILED',
      cause: error instanceof Error ? error : undefined
    });
  }
}

/**
 * Heuristic to determine if changes are breaking
 */
async function isBreakingChange(
  fromTag: string, 
  toTag: string, 
  cwd: string
): Promise<boolean> {
  try {
    // Check commit messages for breaking change indicators
    const commits = await getCommitsBetweenTags(fromTag, toTag, cwd);
    const breakingKeywords = [
      'BREAKING CHANGE', 'breaking change', 'BREAKING:', 
      '!:', 'breaking:', 'BC:', 'bc:'
    ];
    
    const hasBreakingCommit = commits.some(commit => 
      breakingKeywords.some(keyword => 
        commit.message.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (hasBreakingCommit) return true;
    
    // Check for major version bump
    const fromVersion = parseVersion(fromTag);
    const toVersion = parseVersion(toTag);
    
    return fromVersion.major !== toVersion.major;
  } catch {
    // Default to false if we can't determine
    return false;
  }
}

// Update planning and application
/**
 * Create an update plan for applying changes
 */
export async function createUpdatePlan(
  fromVersion: string,
  toVersion: string,
  targetDir: string,
  options: UpdateOptions = {}
): Promise<UpdatePlan> {
  try {
    const diff = await getVersionDiff(fromVersion, toVersion, targetDir);
    const conflicts = await detectConflicts(diff, targetDir);
    
    const strategy: UpdateStrategy = {
      type: options.strategy?.type || 'merge',
      excludePaths: options.strategy?.excludePaths || [
        '.git',
        'node_modules',
        '.env',
        '.env.local'
      ],
      preserveFiles: options.strategy?.preserveFiles || [
        'package.json',
        'README.md',
        '.gitignore'
      ],
      customMergers: options.strategy?.customMergers || {}
    };
    
    return {
      fromVersion,
      toVersion,
      diff,
      conflicts,
      strategy,
      backupRequired: options.createBackup !== false || conflicts.length > 0
    };
  } catch (error) {
    throw new CLIError(`Failed to create update plan`, {
      code: 'UPDATE_PLAN_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { fromVersion, toVersion, targetDir }
    });
  }
}

/**
 * Detect potential conflicts in the update
 */
async function detectConflicts(
  diff: VersionDiff,
  targetDir: string
): Promise<UpdateConflict[]> {
  const conflicts: UpdateConflict[] = [];
  
  for (const file of diff.files) {
    const filePath = path.join(targetDir, file.path);
    
    try {
      // Check if file exists and has local changes
      if (await exists(filePath)) {
        if (file.status === 'deleted') {
          conflicts.push({
            file: file.path,
            type: 'deletion',
            description: `File exists locally but is deleted in the update`,
            resolution: 'manual'
          });
        } else if (file.status === 'modified') {
          // Could check git status here to see if file has local changes
          const hasLocalChanges = await checkLocalChanges(filePath, targetDir);
          if (hasLocalChanges) {
            conflicts.push({
              file: file.path,
              type: 'content',
              description: `File has both local and remote changes`,
              resolution: 'merge'
            });
          }
        }
      }
      
      // Check file permissions
      const stats = await fs.stat(filePath).catch(() => null);
      if (stats && !stats.isFile()) {
        conflicts.push({
          file: file.path,
          type: 'permission',
          description: `Path exists but is not a regular file`,
          resolution: 'skip'
        });
      }
    } catch {
      // File doesn't exist - no conflict
    }
  }
  
  return conflicts;
}

/**
 * Check if a file has local changes (not committed)
 */
async function checkLocalChanges(filePath: string, cwd: string): Promise<boolean> {
  try {
    const relativePath = path.relative(cwd, filePath);
    const result = await execa('git', ['status', '--porcelain', relativePath], { cwd });
    return result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Apply an update plan
 */
export async function applyUpdate(
  plan: UpdatePlan,
  targetDir: string,
  options: UpdateOptions = {}
): Promise<void> {
  if (options.dryRun) {
    logger.info('Dry run mode - no changes will be applied');
    await logUpdatePlan(plan);
    return;
  }
  
  try {
    // Create backup if required
    if (plan.backupRequired && options.createBackup !== false) {
      await createBackup(targetDir);
    }
    
    // Apply changes based on strategy
    switch (plan.strategy.type) {
      case 'overwrite':
        await applyOverwriteStrategy(plan, targetDir, options);
        break;
      case 'merge':
        await applyMergeStrategy(plan, targetDir, options);
        break;
      case 'selective':
        await applySelectiveStrategy(plan, targetDir, options);
        break;
    }
    
    logger.success(`Successfully updated from ${plan.fromVersion} to ${plan.toVersion}`);
  } catch (error) {
    throw new CLIError(`Failed to apply update`, {
      code: 'UPDATE_APPLICATION_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { plan, targetDir, options }
    });
  }
}

/**
 * Create a backup of the target directory
 */
async function createBackup(targetDir: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `${targetDir}.backup.${timestamp}`;
  
  logger.info(`Creating backup at ${backupDir}`);
  
  try {
    await execa('cp', ['-r', targetDir, backupDir]);
    return backupDir;
  } catch {
    // Fallback for systems without cp
    await copyDirectory(targetDir, backupDir);
    return backupDir;
  }
}

/**
 * Recursive directory copy fallback
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const items = await fs.readdir(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stats = await fs.stat(srcPath);
    
    if (stats.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

/**
 * Apply overwrite strategy (replace everything)
 */
async function applyOverwriteStrategy(
  plan: UpdatePlan,
  targetDir: string,
  _options: UpdateOptions
): Promise<void> {
  logger.info('Applying overwrite strategy');
  
  for (const file of plan.diff.files) {
    if (plan.strategy.excludePaths.some(exclude => file.path.startsWith(exclude))) {
      continue;
    }
    
    const targetPath = path.join(targetDir, file.path);
    
    if (file.status === 'deleted') {
      if (await exists(targetPath)) {
        await fs.unlink(targetPath);
        logger.info(`Deleted: ${file.path}`);
      }
    } else if (file.status === 'added' || file.status === 'modified') {
      // This would require the source content - placeholder for now
      logger.info(`Would update: ${file.path}`);
    }
  }
}

/**
 * Apply merge strategy (intelligent merging)
 */
async function applyMergeStrategy(
  plan: UpdatePlan,
  targetDir: string,
  _options: UpdateOptions
): Promise<void> {
  logger.info('Applying merge strategy');
  
  for (const file of plan.diff.files) {
    if (plan.strategy.excludePaths.some(exclude => file.path.startsWith(exclude))) {
      continue;
    }
    
    const targetPath = path.join(targetDir, file.path);
    
    // Handle conflicts based on their resolution strategy
    const conflict = plan.conflicts.find(c => c.file === file.path);
    if (conflict) {
      await handleConflict(conflict, targetPath, plan.strategy);
    } else {
      // No conflict - apply change directly
      if (file.status === 'added' || file.status === 'modified') {
        logger.info(`Would update: ${file.path}`);
      } else if (file.status === 'deleted') {
        if (await exists(targetPath)) {
          await fs.unlink(targetPath);
          logger.info(`Deleted: ${file.path}`);
        }
      }
    }
  }
}

/**
 * Apply selective strategy (user chooses what to update)
 */
async function applySelectiveStrategy(
  _plan: UpdatePlan,
  _targetDir: string,
  _options: UpdateOptions
): Promise<void> {
  logger.info('Applying selective strategy');
  // Implementation would involve prompting user for each file change
  // This is a placeholder for the selective update logic
  logger.info('Selective strategy not yet fully implemented');
}

/**
 * Handle update conflicts
 */
async function handleConflict(
  conflict: UpdateConflict,
  _targetPath: string,
  _strategy: UpdateStrategy
): Promise<void> {
  switch (conflict.resolution) {
    case 'skip':
      logger.warn(`Skipping conflicted file: ${conflict.file}`);
      break;
    case 'overwrite':
      logger.warn(`Overwriting conflicted file: ${conflict.file}`);
      // Implementation would overwrite the file
      break;
    case 'merge':
      logger.info(`Attempting to merge conflicted file: ${conflict.file}`);
      // Implementation would use git merge or custom merger
      break;
    case 'manual':
      logger.error(`Manual resolution required for: ${conflict.file}`);
      logger.info(`  ${conflict.description}`);
      break;
  }
}

/**
 * Log the update plan details
 */
async function logUpdatePlan(plan: UpdatePlan): Promise<void> {
  logger.info(`Update Plan: ${plan.fromVersion} → ${plan.toVersion}`);
  logger.info(`Change Type: ${plan.diff.changeType}`);
  logger.info(`Breaking: ${plan.diff.breaking ? 'Yes' : 'No'}`);
  logger.info(`Strategy: ${plan.strategy.type}`);
  
  if (plan.diff.files.length > 0) {
    logger.info('\nFile Changes:');
    for (const file of plan.diff.files) {
      const status = file.status.charAt(0).toUpperCase() + file.status.slice(1);
      logger.info(`  ${status}: ${file.path} (+${file.insertions}/-${file.deletions})`);
    }
  }
  
  if (plan.conflicts.length > 0) {
    logger.warn('\nConflicts:');
    for (const conflict of plan.conflicts) {
      logger.warn(`  ${conflict.file}: ${conflict.description}`);
    }
  }
  
  if (plan.diff.commits.length > 0) {
    logger.info('\nCommits:');
    for (const commit of plan.diff.commits.slice(0, 5)) {
      logger.info(`  ${commit.shortHash}: ${commit.message}`);
    }
    if (plan.diff.commits.length > 5) {
      logger.info(`  ... and ${plan.diff.commits.length - 5} more commits`);
    }
  }
}

// Utility functions for version management
/**
 * Get the latest tag in the repository
 */
export async function getLatestTag(cwd: string = process.cwd()): Promise<string | null> {
  try {
    const result = await execa('git', ['describe', '--tags', '--abbrev=0'], { cwd, silent: true });
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Get all tags in the repository, sorted by version
 */
export async function getAllTags(cwd: string = process.cwd()): Promise<string[]> {
  try {
    const result = await execa('git', ['tag', '-l'], { cwd });
    const tags = result.stdout.trim().split('\n').filter(Boolean);
    
    // Sort tags by semantic version
    return tags.sort((a, b) => {
      try {
        const versionA = parseVersion(a);
        const versionB = parseVersion(b);
        return compareVersions(versionA, versionB);
      } catch {
        // Fallback to string comparison for non-semver tags
        return a.localeCompare(b);
      }
    });
  } catch {
    return [];
  }
}

/**
 * Check if a tag exists in the repository
 */
export async function tagExists(tag: string, cwd: string = process.cwd()): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', `refs/tags/${tag}`], { cwd, silent: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a new git tag
 */
export async function createTag(
  tag: string, 
  message?: string, 
  cwd: string = process.cwd()
): Promise<void> {
  try {
    const args = ['tag'];
    if (message) {
      args.push('-a', tag, '-m', message);
    } else {
      args.push(tag);
    }
    
    await execa('git', args, { cwd });
  } catch (error) {
    throw new CLIError(`Failed to create tag ${tag}`, {
      code: 'GIT_TAG_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { tag, message, cwd }
    });
  }
}
