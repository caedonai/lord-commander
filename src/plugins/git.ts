/**
 * Git Plugin - Repository operations and version control utilities
 * 
 * Provides essential git functionality for CLI tools including:
 * - Repository status and validation
 * - Basic operations (init, clone, add, commit)
 * - Branch and remote management
 * - Utility functions for version control workflows
 */

import { execa, execaStream } from '../core/execution/execa.js';
import { CLIError } from '../core/foundation/errors/errors.js';

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  clean: boolean;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
}

export interface CloneOptions {
  branch?: string;
  depth?: number;
  recursive?: boolean;
  progress?: boolean;
}

export interface CommitOptions {
  message: string;
  amend?: boolean;
  signOff?: boolean;
  allowEmpty?: boolean;
}

// Helper function to execute git commands with proper error handling
async function gitExeca(
  args: string[], 
  options: { cwd?: string; stream?: boolean } = {}
): Promise<{ stdout: string; stderr: string }> {
  try {
    if (options.stream) {
      await execaStream('git', args, { cwd: options.cwd });
      return { stdout: '', stderr: '' };
    } else {
      return await execa('git', args, { cwd: options.cwd });
    }
  } catch (error) {
    throw new CLIError(
      `Git command failed: git ${args.join(' ')}`,
      {
        code: 'GIT_COMMAND_FAILED',
        cause: error instanceof Error ? error : undefined,
        context: { args, options }
      }
    );
  }
}

/**
 * Check if the current directory is a git repository
 */
export async function isGitRepository(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--git-dir'], { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if git is installed and available
 */
export async function isGitAvailable(): Promise<boolean> {
  try {
    await execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the git repository root directory
 */
export async function getRepositoryRoot(cwd: string = process.cwd()): Promise<string> {
  try {
    const result = await execa('git', ['rev-parse', '--show-toplevel'], { cwd });
    return result.stdout.trim();
  } catch (error) {
    throw new CLIError('Not in a git repository', {
      code: 'NOT_GIT_REPOSITORY',
      suggestion: 'Run this command from within a git repository',
      context: { cwd },
      cause: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * Initialize a new git repository
 */
export async function init(
  directory: string = process.cwd(),
  options: { bare?: boolean; defaultBranch?: string } = {}
): Promise<void> {
  const args = ['init'];
  
  if (options.bare) {
    args.push('--bare');
  }
  
  if (options.defaultBranch) {
    args.push('--initial-branch', options.defaultBranch);
  }
  
  args.push(directory);
  
  try {
    await execa('git', args, { cwd: directory });
  } catch (error) {
    throw new CLIError(`Failed to initialize git repository: ${error instanceof Error ? error.message : String(error)}`, {
      code: 'GIT_INIT_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { directory, options },
    });
  }
}

/**
 * Clone a git repository
 */
export async function clone(
  url: string,
  directory: string,
  options: CloneOptions = {}
): Promise<void> {
  const args = ['clone'];
  
  if (options.branch) {
    args.push('--branch', options.branch);
  }
  
  if (options.depth) {
    args.push('--depth', options.depth.toString());
  }
  
  if (options.recursive) {
    args.push('--recursive');
  }
  

  
  if (options.progress) {
    args.push('--progress');
  }
  
  args.push(url, directory);
  
  try {
    if (options.progress) {
      await execaStream('git', args);
    } else {
      await execa('git', args);
    }
  } catch (error) {
    throw new CLIError(`Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`, {
      code: 'GIT_CLONE_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { url, directory, options },
    });
  }
}

/**
 * Get the current repository status
 */
export async function getStatus(cwd: string = process.cwd()): Promise<GitStatus> {
  try {
    // Get current branch and tracking info
    const branchResult = await execa('git', ['branch', '--show-current'], { cwd });
    const branch = branchResult.stdout.trim();
    
    // Get ahead/behind counts
    let ahead = 0;
    let behind = 0;
    try {
      const trackingResult = await execa('git', ['rev-list', '--count', '--left-right', '@{upstream}...HEAD'], { cwd });
      const [behindStr, aheadStr] = trackingResult.stdout.trim().split('\t');
      behind = parseInt(behindStr) || 0;
      ahead = parseInt(aheadStr) || 0;
    } catch {
      // No upstream branch
    }
    
    // Get file status
    const statusResult = await execa('git', ['status', '--porcelain'], { cwd });
    const lines = statusResult.stdout.trim().split('\n').filter(line => line);
    
    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];
    
    for (const line of lines) {
      const statusCode = line.substring(0, 2);
      const fileName = line.substring(3);
      
      if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
        staged.push(fileName);
      }
      
      if (statusCode[1] !== ' ' && statusCode[1] !== '?') {
        unstaged.push(fileName);
      }
      
      if (statusCode === '??') {
        untracked.push(fileName);
      }
    }
    
    return {
      branch,
      ahead,
      behind,
      staged,
      unstaged,
      untracked,
      clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
    };
  } catch (error) {
    throw new CLIError(`Failed to get git status: ${error instanceof Error ? error.message : String(error)}`, {
      code: 'GIT_STATUS_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd },
    });
  }
}

/**
 * Add files to the staging area
 */
export async function add(
  files: string | string[],
  cwd: string = process.cwd()
): Promise<void> {
  const fileList = Array.isArray(files) ? files : [files];
  const args = ['add', ...fileList];
  
  try {
    await gitExeca(args, { cwd });
  } catch (error) {
    throw new CLIError(`Failed to add files`, {
      code: 'GIT_ADD_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { files, cwd },
    });
  }
}

/**
 * Create a commit
 */
export async function commit(
  options: CommitOptions,
  cwd: string = process.cwd()
): Promise<string> {
  const args = ['commit', '-m', options.message];
  
  if (options.amend) {
    args.push('--amend');
  }
  
  if (options.signOff) {
    args.push('--signoff');
  }
  
  if (options.allowEmpty) {
    args.push('--allow-empty');
  }
  
  try {
    const result = await gitExeca(args, { cwd });
    // Extract commit hash from output
    const match = result.stdout.match(/\[.+ ([a-f0-9]+)\]/);
    return match ? match[1] : '';
  } catch (error) {
    throw new CLIError(`Failed to create commit`, {
      code: 'GIT_COMMIT_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { options, cwd },
    });
  }
}

/**
 * Get commit history
 */
export async function getCommits(
  count: number = 10,
  cwd: string = process.cwd()
): Promise<GitCommit[]> {
  try {
    const format = '--pretty=format:%H|%h|%an|%ae|%ai|%s';
    const result = await gitExeca(['log', `-${count}`, format], { cwd });
    
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
          message,
        };
      });
  } catch (error) {
    throw new CLIError(`Failed to get commits`, {
      code: 'GIT_LOG_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { count, cwd },
    });
  }
}

/**
 * Get basic diff information
 */
export async function getDiff(
  from?: string,
  to?: string,
  cwd: string = process.cwd()
): Promise<string> {
  const args = ['diff'];
  
  if (from) {
    args.push(from);
    if (to) {
      args.push(to);
    }
  }
  
  try {
    const result = await gitExeca(args, { cwd });
    return result.stdout;
  } catch (error) {
    throw new CLIError(`Failed to get diff`, {
      code: 'GIT_DIFF_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { from, to, cwd },
    });
  }
}

/**
 * Get branches
 */
export async function getBranches(
  cwd: string = process.cwd(),
  includeRemote: boolean = false
): Promise<string[]> {
  const args = ['branch'];
  
  if (includeRemote) {
    args.push('-a');
  }
  
  try {
    const result = await gitExeca(args, { cwd });
    return result.stdout
      .trim()
      .split('\n')
      .map(line => line.replace(/^\*?\s+/, '').trim())
      .filter(line => line && !line.startsWith('->'));
  } catch (error) {
    throw new CLIError(`Failed to list branches`, {
      code: 'GIT_BRANCH_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd, includeRemote },
    });
  }
}

/**
 * Create a new branch
 */
export async function createBranch(
  name: string,
  cwd: string = process.cwd(),
  checkout: boolean = false
): Promise<void> {
  const args = checkout ? ['checkout', '-b', name] : ['branch', name];
  
  try {
    await gitExeca(args, { cwd });
  } catch (error) {
    throw new CLIError(`Failed to create branch`, {
      code: 'GIT_BRANCH_CREATE_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { name, cwd, checkout },
    });
  }
}

/**
 * Checkout a branch or commit
 */
export async function checkout(
  ref: string,
  cwd: string = process.cwd()
): Promise<void> {
  try {
    await gitExeca(['checkout', ref], { cwd });
  } catch (error) {
    throw new CLIError(`Failed to checkout`, {
      code: 'GIT_CHECKOUT_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { ref, cwd },
    });
  }
}

/**
 * Get the current commit hash
 */
export async function getCurrentCommit(cwd: string = process.cwd()): Promise<string> {
  try {
    const result = await gitExeca(['rev-parse', 'HEAD'], { cwd });
    return result.stdout.trim();
  } catch (error) {
    throw new CLIError(`Failed to get current commit`, {
      code: 'GIT_COMMIT_HASH_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd },
    });
  }
}

/**
 * Check if the working directory is clean (no uncommitted changes)
 */
export async function isClean(cwd: string = process.cwd()): Promise<boolean> {
  try {
    const status = await getStatus(cwd);
    return status.clean;
  } catch (error) {
    throw new CLIError(`Failed to check if repository is clean`, {
      code: 'GIT_CLEAN_CHECK_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd },
    });
  }
}
