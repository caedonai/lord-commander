/**
 * Process execution wrapper with async/await support and error handling
 *
 * Provides secure command execution with proper error handling,
 * output capture, streaming, and cancellation support using execa.
 */

import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ExecaError, ExecaReturnValue, ExecaSyncReturnValue, Options } from 'execa';
// Note: execa package needs to be installed as a dependency
// npm install execa@^8.0.1
import { execa as execaLib, execaSync as execaSyncLib } from 'execa';
import { PACKAGE_MANAGER_COMMANDS, type PackageManager } from '../foundation/core/constants.js';
import { ProcessError } from '../foundation/errors/errors.js';
import { createLogger } from '../ui/logger.js';

// Create a logger instance for internal execa operations
const execaLogger = createLogger({ prefix: 'execa' });

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
 * Sandboxing configuration for command execution
 */
export interface SandboxConfig {
  enabled?: boolean; // Enable/disable sandboxing (default: true)
  isolateWorkingDirectory?: boolean; // Create isolated temp directory (default: true)
  restrictEnvironment?: boolean; // Use minimal safe environment (default: true)
  allowedEnvVars?: string[]; // Additional env vars to preserve (default: ['PATH', 'NODE_ENV'])
  customSandboxDir?: string; // Use custom sandbox directory instead of temp
  sandboxPrefix?: string; // Prefix for sandbox directory names (default: 'lord-commander-sandbox')
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
  shell?: boolean | string; // Run command in shell (true, false, or shell path) - security: defaults to false
  windowsHide?: boolean; // Hide console window on Windows
  reject?: boolean; // Whether to reject promise on non-zero exit code
  stripFinalNewline?: boolean; // Remove trailing newline from output
  preferLocal?: boolean; // Prefer locally installed binaries
  localDir?: string; // Directory to look for local binaries
  cleanup?: boolean; // Kill spawned process on parent process exit
  encoding?: BufferEncoding; // Output encoding
  maxBuffer?: number; // Max buffer size for stdout/stderr
  signal?: AbortSignal; // AbortController signal for cancellation
  sandbox?: SandboxConfig; // Sandboxing configuration for security
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
  commands: (typeof PACKAGE_MANAGER_COMMANDS)[PackageManager];
}

/**
 * Default sandbox configuration
 */
const DEFAULT_SANDBOX_CONFIG: Required<SandboxConfig> = {
  enabled: true,
  isolateWorkingDirectory: true,
  restrictEnvironment: true,
  allowedEnvVars: ['PATH', 'NODE_ENV', 'HOME', 'USERPROFILE', 'TEMP', 'TMP'],
  customSandboxDir: '',
  sandboxPrefix: 'lord-commander-sandbox',
};

/**
 * Create secure environment configuration (synchronous version)
 */
function createSandboxEnv(config: SandboxConfig = {}): Record<string, string> {
  const sandboxConfig = { ...DEFAULT_SANDBOX_CONFIG, ...config };
  let sandboxEnv: Record<string, string> = {};

  execaLogger.debug(`createSandboxEnv called with config:`, {
    enabled: sandboxConfig.enabled,
    restrictEnvironment: sandboxConfig.restrictEnvironment,
    allowedEnvVars: sandboxConfig.allowedEnvVars,
  });

  // Create restricted environment if enabled
  if (sandboxConfig.enabled && sandboxConfig.restrictEnvironment) {
    // Start with minimal environment
    sandboxEnv = {
      NODE_ENV: 'production', // Safe default
    };

    // Add allowed environment variables
    for (const envVar of sandboxConfig.allowedEnvVars) {
      const envValue = process.env[envVar];
      if (envValue) {
        sandboxEnv[envVar] = envValue;
      }
    }

    execaLogger.debug(
      `Created restricted environment with ${Object.keys(sandboxEnv).length} variables:`,
      Object.keys(sandboxEnv)
    );
  } else {
    // Use current environment if not restricting
    sandboxEnv = Object.fromEntries(
      Object.entries(process.env).filter(([, value]) => value !== undefined)
    ) as Record<string, string>;
    execaLogger.debug(`Using full environment with ${Object.keys(sandboxEnv).length} variables`);
  }

  return sandboxEnv;
}

/**
 * Create a secure sandbox environment for command execution
 */
async function createSandbox(
  config: SandboxConfig = {}
): Promise<{ cwd: string; env: Record<string, string> }> {
  const sandboxConfig = { ...DEFAULT_SANDBOX_CONFIG, ...config };

  let sandboxCwd = process.cwd();

  // Create isolated working directory if enabled
  if (sandboxConfig.enabled && sandboxConfig.isolateWorkingDirectory) {
    try {
      const sandboxDir =
        sandboxConfig.customSandboxDir ||
        join(
          tmpdir(),
          `${sandboxConfig.sandboxPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        );

      await mkdir(sandboxDir, { recursive: true });
      sandboxCwd = sandboxDir;

      execaLogger.debug(`Created sandbox directory: ${sandboxDir}`);
    } catch (error) {
      execaLogger.warn(`Failed to create sandbox directory, using current directory: ${error}`);
    }
  }

  const sandboxEnv = createSandboxEnv(config);
  return { cwd: sandboxCwd, env: sandboxEnv };
}

/**
 * Validate and secure command execution options
 */
function secureExecOptions(options: ExecOptions): ExecOptions {
  const securedOptions = { ...options };

  // Force shell to false for security unless explicitly overridden
  if (securedOptions.shell === undefined) {
    securedOptions.shell = false;
  }

  // Add security warnings for shell usage
  if (securedOptions.shell === true || typeof securedOptions.shell === 'string') {
    execaLogger.warn('⚠️  Shell execution enabled - this may introduce security risks');
  }

  // Set secure defaults
  securedOptions.cleanup = securedOptions.cleanup ?? true;
  securedOptions.windowsHide = securedOptions.windowsHide ?? true;

  return securedOptions;
}

/**
 * Execute a command and return the result
 */
export async function execa(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const startTime = Date.now();
  const fullCommand = `${command} ${args.join(' ')}`.trim();

  try {
    // Apply security defaults and extract options
    const securedOptions = secureExecOptions(options);
    const {
      silent = false,
      reject = true,
      cwd: originalCwd,
      timeout = 0,
      sandbox,
      env: userEnv,
      ...execaOptions
    } = securedOptions;

    // Create sandbox environment
    const sandboxResult = await createSandbox(sandbox);
    const finalCwd = originalCwd || sandboxResult.cwd;
    // Always use sandboxed environment, with user env overrides if provided
    const finalEnv = userEnv ? { ...sandboxResult.env, ...userEnv } : sandboxResult.env;

    if (!silent) {
      execaLogger.debug(`Executing: ${fullCommand}`, {
        cwd: finalCwd,
        sandbox: sandbox?.enabled !== false ? 'enabled' : 'disabled',
        envVars: Object.keys(finalEnv).length,
      });
    }

    const execaResult: ExecaReturnValue = await execaLib(command, args, {
      cwd: finalCwd,
      env: finalEnv, // Always pass explicit environment
      extendEnv: false, // Don't inherit parent environment when using sandboxed env
      timeout: timeout || undefined,
      reject,
      shell: false, // Force secure default
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
        execaLogger.warn(`Command failed: ${fullCommand} (exit code: ${result.exitCode})`);
      } else {
        execaLogger.debug(`Command completed: ${fullCommand} (${duration}ms)`);
      }
    }

    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    interface ExecaError {
      exitCode?: number;
      stdout?: string;
      stderr?: string;
      signal?: string;
      killed?: boolean;
      timedOut?: boolean;
    }
    const execError = error as unknown as ExecaError;

    // Handle execa-specific errors
    if (execError.exitCode !== undefined) {
      const result: ExecResult = {
        stdout: execError.stdout || '',
        stderr: execError.stderr || '',
        exitCode: execError.exitCode,
        command: fullCommand,
        failed: true,
        timedOut: execError.timedOut || false,
        killed: execError.killed || false,
        duration,
      };

      if (!options.silent) {
        execaLogger.error(`Command failed: ${fullCommand} (exit code: ${execError.exitCode})`);
      }

      if (options.reject !== false) {
        throw new ProcessError(
          (execError as Error).message || `Command failed: ${fullCommand}`,
          fullCommand,
          execError.exitCode,
          execError as Error
        );
      }

      return result;
    }

    // Handle other errors (e.g., command not found)
    throw new ProcessError(
      `Failed to execute command: ${fullCommand}`,
      fullCommand,
      undefined,
      error as Error
    );
  }
}

/**
 * Execute a command synchronously
 */
export function execaSync(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): ExecResult {
  const startTime = Date.now();
  const fullCommand = `${command} ${args.join(' ')}`.trim();

  try {
    // Apply security defaults and extract options
    const securedOptions = secureExecOptions(options);
    const {
      silent = false,
      reject = true,
      cwd: originalCwd = process.cwd(),
      timeout = 0,
      sandbox,
      env: userEnv,
      ...execaOptions
    } = securedOptions;

    // Create secure environment (sync version - no directory isolation)
    const sandboxEnv = createSandboxEnv(sandbox);
    // Always use sandboxed environment, with user env overrides if provided
    const finalEnv = userEnv ? { ...sandboxEnv, ...userEnv } : sandboxEnv;

    if (!silent) {
      execaLogger.debug(`Executing sync: ${fullCommand}`, {
        cwd: originalCwd,
        sandbox: sandbox?.enabled !== false ? 'enabled' : 'disabled',
        envVars: Object.keys(finalEnv).length,
      });
    }

    // Filter out options that don't apply to sync execution and handle type compatibility
    const { signal: _signal, encoding, ...syncOptions } = execaOptions;

    const execaResult: ExecaSyncReturnValue = execaSyncLib(command, args, {
      cwd: originalCwd,
      env: finalEnv, // Always pass explicit environment
      extendEnv: false, // Don't inherit parent environment when using sandboxed env
      timeout: timeout || undefined,
      reject,
      shell: false, // Force secure default
      encoding: encoding === 'utf8' ? encoding : 'utf8',
      ...syncOptions,
    });

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
        execaLogger.warn(`Sync command failed: ${fullCommand} (exit code: ${result.exitCode})`);
      } else {
        execaLogger.debug(`Sync command completed: ${fullCommand} (${duration}ms)`);
      }
    }

    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const execError = error as unknown as ExecaError;

    if (execError.exitCode !== undefined) {
      const result: ExecResult = {
        stdout: execError.stdout || '',
        stderr: execError.stderr || '',
        exitCode: execError.exitCode,
        command: fullCommand,
        failed: true,
        timedOut: execError.timedOut || false,
        killed: execError.killed || false,
        duration,
      };

      if (options.reject !== false) {
        throw new ProcessError(
          execError.message || `Sync command failed: ${fullCommand}`,
          fullCommand,
          execError.exitCode,
          execError
        );
      }

      return result;
    }

    throw new ProcessError(
      `Failed to execute sync command: ${fullCommand}`,
      fullCommand,
      undefined,
      error as Error
    );
  }
}

/**
 * Execute a command with real-time output streaming
 */
export async function execaStream(
  command: string,
  args: string[] = [],
  options: ExecStreamOptions = {}
): Promise<ExecResult> {
  const startTime = Date.now();
  const fullCommand = `${command} ${args.join(' ')}`.trim();

  try {
    // Extract stream-specific options first
    const { onStdout, onStderr, onProgress, ...baseOptions } = options;

    // Apply security defaults and extract options
    const securedOptions = secureExecOptions(baseOptions);
    const {
      silent = false,
      cwd: originalCwd,
      timeout = 0,
      sandbox,
      env: userEnv,
      ...execaOptions
    } = securedOptions;

    // Create sandbox environment
    const sandboxResult = await createSandbox(sandbox);
    const finalCwd = originalCwd || sandboxResult.cwd;
    // Always use sandboxed environment, with user env overrides if provided
    const finalEnv = userEnv ? { ...sandboxResult.env, ...userEnv } : sandboxResult.env;

    if (!silent) {
      execaLogger.debug(`Streaming: ${fullCommand}`, {
        cwd: finalCwd,
        sandbox: sandbox?.enabled !== false ? 'enabled' : 'disabled',
        envVars: Object.keys(finalEnv).length,
      });
    }

    // Force pipe stdio for streaming
    const subprocess = execaLib(command, args, {
      cwd: finalCwd,
      env: finalEnv, // Always pass explicit environment
      extendEnv: false, // Don't inherit parent environment when using sandboxed env
      timeout: timeout || undefined,
      stdio: 'pipe',
      shell: false, // Force secure default
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
      execaLogger.debug(`Streaming completed: ${fullCommand} (${duration}ms)`);
    }

    return result;
  } catch (error: unknown) {
    const execError = error as unknown as ExecaError;
    if (execError.exitCode !== undefined) {
      throw new ProcessError(
        (execError as Error).message || `Streaming command failed: ${fullCommand}`,
        fullCommand,
        execError.exitCode,
        execError as Error
      );
    }

    throw new ProcessError(
      `Failed to stream command: ${fullCommand}`,
      fullCommand,
      undefined,
      error as Error
    );
  }
}

/**
 * Execute a command and capture only the output (no error throwing)
 */
export async function execaWithOutput(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  return execa(command, args, {
    ...options,
    reject: false, // Don't throw on non-zero exit codes
    silent: options.silent ?? true, // Default to silent for output capture
  });
}

/**
 * Check if a command exists and is executable
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    const isWindows = process.platform === 'win32';
    const checkCommand = isWindows ? 'where' : 'which';

    const result = await execaWithOutput(checkCommand, [command]);
    return result.exitCode === 0 && result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Detect the package manager used in a project
 */
export async function detectPackageManager(
  cwd: string = process.cwd()
): Promise<PackageManagerInfo | null> {
  try {
    // Check for lock files in order of preference
    const { exists } = await import('./fs');
    const { join } = await import('node:path');

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
    execaLogger.debug('Failed to detect package manager', error);
    return null;
  }
}

/**
 * Run a package manager command (install, run, etc.)
 */
export async function runPackageManagerExeca(
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

    case 'installDev': {
      const installDevParts = pmInfo.commands.installDev.split(' ');
      command = installDevParts[0];
      args.push(...installDevParts.slice(1));
      if (packageOrScript) {
        args.push(packageOrScript);
      }
      break;
    }

    case 'run': {
      if (!packageOrScript) {
        throw new ProcessError('Script name is required for run command', 'run-command');
      }
      const runParts = pmInfo.commands.run.split(' ');
      command = runParts[0];
      args.push(...runParts.slice(1), packageOrScript);
      break;
    }

    case 'create': {
      if (!packageOrScript) {
        throw new ProcessError('Package name is required for create command', 'create-command');
      }
      const createParts = pmInfo.commands.create.split(' ');
      command = createParts[0];
      args.push(...createParts.slice(1), packageOrScript);
      break;
    }

    default:
      throw new ProcessError(`Unknown package manager action: ${action}`, 'unknown-action');
  }

  execaLogger.info(
    `Running ${pmInfo.manager} ${action}${packageOrScript ? ` ${packageOrScript}` : ''}`
  );

  return execa(command, args, {
    ...options,
    stdio: options.stdio ?? 'inherit', // Show output by default for package manager commands
  });
}

/**
 * Execute git commands with proper error handling
 */
export async function gitExeca(
  subcommand: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  // Check if git is available
  if (!(await commandExists('git'))) {
    throw new ProcessError('Git is not installed or not available in PATH', 'git-not-found');
  }

  return execa('git', [subcommand, ...args], {
    ...options,
    silent: options.silent ?? false, // Show git output by default
  });
}

/**
 * Create an AbortController for cancelling commands
 */
export function createCancellableExecution(): {
  signal: AbortSignal;
  cancel: () => void;
  execa: (command: string, args?: string[], options?: ExecOptions) => Promise<ExecResult>;
  execStream: (
    command: string,
    args?: string[],
    options?: ExecStreamOptions
  ) => Promise<ExecResult>;
} {
  const controller = new AbortController();

  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
    execa: (command: string, args: string[] = [], options: ExecOptions = {}) =>
      execa(command, args, { ...options, signal: controller.signal }),
    execStream: (command: string, args: string[] = [], options: ExecStreamOptions = {}) =>
      execaStream(command, args, { ...options, signal: controller.signal }),
  };
}

/**
 * Utility to run multiple commands in sequence
 */
export async function execaSequence(
  commands: Array<{ command: string; args?: string[]; options?: ExecOptions }>,
  options: { stopOnError?: boolean; cwd?: string } = {}
): Promise<ExecResult[]> {
  const { stopOnError = true, cwd } = options;
  const results: ExecResult[] = [];

  for (const { command, args = [], options: cmdOptions = {} } of commands) {
    try {
      const result = await execa(command, args, {
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
export async function execaParallel(
  commands: Array<{ command: string; args?: string[]; options?: ExecOptions }>,
  options: { cwd?: string; maxConcurrency?: number } = {}
): Promise<ExecResult[]> {
  const { cwd, maxConcurrency = 5 } = options;

  const executeCommand = async ({
    command,
    args = [],
    options: cmdOptions = {},
  }: (typeof commands)[0]) => {
    return execa(command, args, { cwd, ...cmdOptions });
  };

  // Simple concurrency control
  const results: ExecResult[] = [];
  const executing: Promise<void>[] = [];

  for (const cmd of commands) {
    const promise = executeCommand(cmd).then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        if (
          await Promise.allSettled([executing[i]]).then(([{ status }]) => status === 'fulfilled')
        ) {
          executing.splice(i, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
}
