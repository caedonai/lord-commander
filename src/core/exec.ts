/**
 * Process execution wrapper with async/await support and error handling
 * 
 * Provides secure command execution with proper error handling,
 * output capture, streaming, and cancellation support using execa.
 */

// Note: execa package needs to be installed as a dependency
// npm install execa@^8.0.1
import { execa, execaSync } from 'execa';
import type { ExecaReturnValue, ExecaSyncReturnValue, Options } from 'execa';
import { ProcessError } from './errors';
import { createLogger } from './logger';
import { PACKAGE_MANAGER_COMMANDS, type PackageManager } from './constants';

// Create a logger instance for internal exec operations
const execLogger = createLogger({ prefix: 'exec' });

/**
 * Result of a command execution
 */
export interface ExecResult {
  stdout: string; // Standard output from the command
  stderr: string; // Standard error output  
  exitCode: number; // Exit code (0 = success, non-zero = error)
  command: string; // The full command that was executed
  failed: boolean; // True if the command failed (exitCode !== 0)
  timedOut: boolean; // True if the command timed out
  killed: boolean; // True if the command was forcibly terminated
  duration: number; // Execution time in milliseconds
}

/**
 * Options for command execution
 */
export interface ExecOptions {
  cwd?: string; // Working directory to execute command in
  env?: Record<string, string>; // Environment variables to set
  timeout?: number; // Timeout in milliseconds (0 = no timeout)
  input?: string; // Input to send to the command's stdin
  stdio?: 'inherit' | 'pipe' | 'ignore'; // How to handle stdio streams
  silent?: boolean; // Suppress output logging
  shell?: boolean | string; // Run command in shell (true, false, or shell path)
  windowsHide?: boolean; // Hide console window on Windows
  reject?: boolean; // Whether to reject promise on non-zero exit code
  stripFinalNewline?: boolean; // Remove trailing newline from output
  preferLocal?: boolean; // Prefer locally installed binaries
  localDir?: string; // Directory to look for local binaries
  cleanup?: boolean; // Kill spawned process on parent process exit
  encoding?: BufferEncoding; // Output encoding
  maxBuffer?: number; // Max buffer size for stdout/stderr
  signal?: AbortSignal; // AbortController signal for cancellation
}

/**
 * Options for streaming command execution
 */
export interface ExecStreamOptions extends ExecOptions {
  onStdout?: (data: string) => void; // Callback for stdout data chunks
  onStderr?: (data: string) => void; // Callback for stderr data chunks
  onProgress?: (progress: { type: 'stdout' | 'stderr'; data: string }) => void; // Generic progress callback
}

/**
 * Package manager detection result
 */
export interface PackageManagerInfo {
  manager: PackageManager;
  lockFile: string;
  commands: typeof PACKAGE_MANAGER_COMMANDS[PackageManager];
}

/**
 * Execute a command and return the result
 */
export async function exec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const startTime = Date.now();
  const fullCommand = `${command} ${args.join(' ')}`.trim();
  
  try {
    const {
      silent = false,
      reject = true,
      cwd = process.cwd(),
      timeout = 0,
      ...execaOptions
    } = options;

    if (!silent) {
      execLogger.debug(`Executing: ${fullCommand}`, { cwd });
    }

    const execaResult: ExecaReturnValue = await execa(command, args, {
      cwd,
      timeout: timeout || undefined,
      reject,
      ...execaOptions,
    } as Options);

    const duration = Date.now() - startTime;
    const result: ExecResult = {
      stdout: execaResult.stdout,
      stderr: execaResult.stderr,
      exitCode: execaResult.exitCode,
      command: fullCommand,
      failed: execaResult.failed,
      timedOut: execaResult.timedOut,
      killed: execaResult.killed,
      duration,
    };

    if (!silent) {
      if (result.failed) {
        execLogger.warn(`Command failed: ${fullCommand} (exit code: ${result.exitCode})`);
      } else {
        execLogger.debug(`Command completed: ${fullCommand} (${duration}ms)`);
      }
    }

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Handle execa-specific errors
    if (error.exitCode !== undefined) {
      const result: ExecResult = {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.exitCode,
        command: fullCommand,
        failed: true,
        timedOut: error.timedOut || false,
        killed: error.killed || false,
        duration,
      };

      if (!options.silent) {
        execLogger.error(`Command failed: ${fullCommand} (exit code: ${error.exitCode})`);
      }

      if (options.reject !== false) {
        throw new ProcessError(
          error.message || `Command failed: ${fullCommand}`,
          fullCommand,
          error.exitCode,
          error
        );
      }

      return result;
    }

    // Handle other errors (e.g., command not found)
    throw new ProcessError(
      `Failed to execute command: ${fullCommand}`,
      fullCommand,
      undefined,
      error
    );
  }
}

/**
 * Execute a command synchronously
 */
export function execSync(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): ExecResult {
  const startTime = Date.now();
  const fullCommand = `${command} ${args.join(' ')}`.trim();
  
  try {
    const {
      silent = false,
      reject = true,
      cwd = process.cwd(),
      timeout = 0,
      ...execaOptions
    } = options;

    if (!silent) {
      execLogger.debug(`Executing sync: ${fullCommand}`, { cwd });
    }

    const execaResult: ExecaSyncReturnValue = execaSync(command, args, {
      cwd,
      timeout: timeout || undefined,
      reject,
      ...execaOptions,
    } as Options);

    const duration = Date.now() - startTime;
    const result: ExecResult = {
      stdout: execaResult.stdout,
      stderr: execaResult.stderr,
      exitCode: execaResult.exitCode,
      command: fullCommand,
      failed: execaResult.failed,
      timedOut: execaResult.timedOut,
      killed: execaResult.killed,
      duration,
    };

    if (!silent) {
      if (result.failed) {
        execLogger.warn(`Sync command failed: ${fullCommand} (exit code: ${result.exitCode})`);
      } else {
        execLogger.debug(`Sync command completed: ${fullCommand} (${duration}ms)`);
      }
    }

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error.exitCode !== undefined) {
      const result: ExecResult = {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.exitCode,
        command: fullCommand,
        failed: true,
        timedOut: error.timedOut || false,
        killed: error.killed || false,
        duration,
      };

      if (options.reject !== false) {
        throw new ProcessError(
          error.message || `Sync command failed: ${fullCommand}`,
          fullCommand,
          error.exitCode,
          error
        );
      }

      return result;
    }

    throw new ProcessError(
      `Failed to execute sync command: ${fullCommand}`,
      fullCommand,
      undefined,
      error
    );
  }
}

/**
 * Execute a command with real-time output streaming
 */
export async function execStream(
  command: string,
  args: string[] = [],
  options: ExecStreamOptions = {}
): Promise<ExecResult> {
  const startTime = Date.now();
  const fullCommand = `${command} ${args.join(' ')}`.trim();
  
  try {
    const {
      silent = false,
      onStdout,
      onStderr,
      onProgress,
      cwd = process.cwd(),
      timeout = 0,
      ...execaOptions
    } = options;

    if (!silent) {
      execLogger.debug(`Streaming: ${fullCommand}`, { cwd });
    }

    // Force pipe stdio for streaming
    const subprocess = execa(command, args, {
      cwd,
      timeout: timeout || undefined,
      stdio: 'pipe',
      ...execaOptions,
    } as Options);

    // Handle stdout streaming
    if (subprocess.stdout && (onStdout || onProgress)) {
      subprocess.stdout.on('data', (chunk: Buffer) => {
        const data = chunk.toString();
        if (onStdout) onStdout(data);
        if (onProgress) onProgress({ type: 'stdout', data });
      });
    }

    // Handle stderr streaming  
    if (subprocess.stderr && (onStderr || onProgress)) {
      subprocess.stderr.on('data', (chunk: Buffer) => {
        const data = chunk.toString();
        if (onStderr) onStderr(data);
        if (onProgress) onProgress({ type: 'stderr', data });
      });
    }

    const execaResult = await subprocess;
    const duration = Date.now() - startTime;

    const result: ExecResult = {
      stdout: execaResult.stdout,
      stderr: execaResult.stderr,
      exitCode: execaResult.exitCode,
      command: fullCommand,
      failed: execaResult.failed,
      timedOut: execaResult.timedOut,
      killed: execaResult.killed,
      duration,
    };

    if (!silent) {
      execLogger.debug(`Streaming completed: ${fullCommand} (${duration}ms)`);
    }

    return result;
  } catch (error: any) {
    if (error.exitCode !== undefined) {
      throw new ProcessError(
        error.message || `Streaming command failed: ${fullCommand}`,
        fullCommand,
        error.exitCode,
        error
      );
    }

    throw new ProcessError(
      `Failed to stream command: ${fullCommand}`,
      fullCommand,
      undefined,
      error
    );
  }
}

/**
 * Execute a command and capture only the output (no error throwing)
 */
export async function execWithOutput(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  return exec(command, args, { 
    ...options, 
    reject: false, // Don't throw on non-zero exit codes
    silent: options.silent ?? true // Default to silent for output capture
  });
}

/**
 * Check if a command exists and is executable
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    const isWindows = process.platform === 'win32';
    const checkCommand = isWindows ? 'where' : 'which';
    
    const result = await execWithOutput(checkCommand, [command]);
    return result.exitCode === 0 && result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Detect the package manager used in a project
 */
export async function detectPackageManager(cwd: string = process.cwd()): Promise<PackageManagerInfo | null> {
  try {
    // Check for lock files in order of preference
    const { exists } = await import('./fs');
    const { join } = await import('path');

    for (const [manager, config] of Object.entries(PACKAGE_MANAGER_COMMANDS)) {
      const lockFilePath = join(cwd, config.lockFile);
      if (exists(lockFilePath)) {
        return {
          manager: manager as PackageManager,
          lockFile: config.lockFile,
          commands: config,
        };
      }
    }

    // If no lock file found, check if package managers are available
    for (const manager of ['pnpm', 'yarn', 'bun', 'npm'] as PackageManager[]) {
      if (await commandExists(manager)) {
        return {
          manager,
          lockFile: PACKAGE_MANAGER_COMMANDS[manager].lockFile,
          commands: PACKAGE_MANAGER_COMMANDS[manager],
        };
      }
    }

    return null;
  } catch (error) {
    execLogger.debug('Failed to detect package manager', error);
    return null;
  }
}

/**
 * Run a package manager command (install, run, etc.)
 */
export async function runPackageManagerCommand(
  action: 'install' | 'installDev' | 'run' | 'create',
  packageOrScript?: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  const pmInfo = await detectPackageManager(options.cwd);
  
  if (!pmInfo) {
    throw new ProcessError(
      'No package manager detected. Please install npm, pnpm, yarn, or bun.',
      'package-manager-detection'
    );
  }

  let command: string;
  const args: string[] = [];

  switch (action) {
    case 'install':
      if (packageOrScript) {
        command = pmInfo.manager;
        args.push('install', packageOrScript);
      } else {
        const installParts = pmInfo.commands.install.split(' ');
        command = installParts[0];
        args.push(...installParts.slice(1));
      }
      break;
    
    case 'installDev':
      const installDevParts = pmInfo.commands.installDev.split(' ');
      command = installDevParts[0];
      args.push(...installDevParts.slice(1));
      if (packageOrScript) {
        args.push(packageOrScript);
      }
      break;
    
    case 'run':
      if (!packageOrScript) {
        throw new ProcessError('Script name is required for run command', 'run-command');
      }
      const runParts = pmInfo.commands.run.split(' ');
      command = runParts[0];
      args.push(...runParts.slice(1), packageOrScript);
      break;
    
    case 'create':
      if (!packageOrScript) {
        throw new ProcessError('Package name is required for create command', 'create-command');
      }
      const createParts = pmInfo.commands.create.split(' ');
      command = createParts[0];
      args.push(...createParts.slice(1), packageOrScript);
      break;
    
    default:
      throw new ProcessError(`Unknown package manager action: ${action}`, 'unknown-action');
  }

  execLogger.info(`Running ${pmInfo.manager} ${action}${packageOrScript ? ` ${packageOrScript}` : ''}`);
  
  return exec(command, args, {
    ...options,
    stdio: options.stdio ?? 'inherit', // Show output by default for package manager commands
  });
}

/**
 * Execute git commands with proper error handling
 */
export async function git(
  subcommand: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  // Check if git is available
  if (!(await commandExists('git'))) {
    throw new ProcessError(
      'Git is not installed or not available in PATH',
      'git-not-found'
    );
  }

  return exec('git', [subcommand, ...args], {
    ...options,
    silent: options.silent ?? false, // Show git output by default
  });
}

/**
 * Create an AbortController for cancelling commands
 */
export function createCancellableExecution() {
  const controller = new AbortController();
  
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
    exec: (command: string, args: string[] = [], options: ExecOptions = {}) =>
      exec(command, args, { ...options, signal: controller.signal }),
    execStream: (command: string, args: string[] = [], options: ExecStreamOptions = {}) =>
      execStream(command, args, { ...options, signal: controller.signal }),
  };
}

/**
 * Utility to run multiple commands in sequence
 */
export async function execSequence(
  commands: Array<{ command: string; args?: string[]; options?: ExecOptions }>,
  options: { stopOnError?: boolean; cwd?: string } = {}
): Promise<ExecResult[]> {
  const { stopOnError = true, cwd } = options;
  const results: ExecResult[] = [];

  for (const { command, args = [], options: cmdOptions = {} } of commands) {
    try {
      const result = await exec(command, args, {
        cwd,
        ...cmdOptions,
      });
      
      results.push(result);
      
      if (result.failed && stopOnError) {
        break;
      }
    } catch (error) {
      if (stopOnError) {
        throw error;
      }
      // If not stopping on error, create a failed result
      results.push({
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        command: `${command} ${args.join(' ')}`,
        failed: true,
        timedOut: false,
        killed: false,
        duration: 0,
      });
    }
  }

  return results;
}

/**
 * Utility to run multiple commands in parallel
 */
export async function execParallel(
  commands: Array<{ command: string; args?: string[]; options?: ExecOptions }>,
  options: { cwd?: string; maxConcurrency?: number } = {}
): Promise<ExecResult[]> {
  const { cwd, maxConcurrency = 5 } = options;
  
  const executeCommand = async ({ command, args = [], options: cmdOptions = {} }: typeof commands[0]) => {
    return exec(command, args, { cwd, ...cmdOptions });
  };

  // Simple concurrency control
  const results: ExecResult[] = [];
  const executing: Promise<void>[] = [];

  for (const cmd of commands) {
    const promise = executeCommand(cmd).then(result => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        if (await Promise.allSettled([executing[i]]).then(([{status}]) => status === 'fulfilled')) {
          executing.splice(i, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
}