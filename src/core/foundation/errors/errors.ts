/**
 * Error handling and cancellation utilities for the CLI SDK
 *
 * Provides graceful error management, user-friendly messages,
 * and proper cleanup for CLI operations.
 */

import { isCancel as clackIsCancel } from '@clack/prompts';
import colors from 'picocolors';

/**
 * Custom CLI error class with enhanced error information
 */
export class CLIError extends Error {
  public readonly code: string;
  public readonly suggestion?: string;
  public readonly recoverable: boolean;
  public readonly context?: Record<string, any>;
  public readonly cause?: Error;

  constructor(
    message: string,
    options: {
      code?: string;
      suggestion?: string;
      recoverable?: boolean;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'CLIError';
    this.code = options.code || 'CLI_ERROR';
    this.suggestion = options.suggestion;
    this.recoverable = options.recoverable ?? false;
    this.context = options.context;
    this.cause = options.cause;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CLIError);
    }
  }
}

/**
 * Specific error types for different CLI operations
 */
export class FileSystemError extends CLIError {
  constructor(message: string, filePath: string, cause?: Error) {
    super(message, {
      code: 'FS_ERROR',
      suggestion: `Check if the path exists and you have the necessary permissions: ${filePath}`,
      recoverable: true,
      context: { filePath },
      cause,
    });
  }
}

export class ProcessError extends CLIError {
  constructor(message: string, command: string, exitCode?: number, cause?: Error) {
    super(message, {
      code: 'PROCESS_ERROR',
      suggestion:
        exitCode === 127
          ? `Command not found: ${command}. Make sure it's installed and in your PATH.`
          : `Command failed: ${command}. Check the command syntax and try again.`,
      recoverable: true,
      context: { command, exitCode },
      cause,
    });
  }
}

export class NetworkError extends CLIError {
  constructor(message: string, url?: string, cause?: Error) {
    super(message, {
      code: 'NETWORK_ERROR',
      suggestion: 'Check your internet connection and try again.',
      recoverable: true,
      context: { url },
      cause,
    });
  }
}

export class ConfigurationError extends CLIError {
  constructor(message: string, configPath?: string, cause?: Error) {
    super(message, {
      code: 'CONFIG_ERROR',
      suggestion: configPath
        ? `Check the configuration file format: ${configPath}`
        : 'Verify your configuration settings and try again.',
      recoverable: true,
      context: { configPath },
      cause,
    });
  }
}

export class ValidationError extends CLIError {
  constructor(message: string, field?: string, value?: any) {
    super(message, {
      code: 'VALIDATION_ERROR',
      suggestion: field
        ? `Please provide a valid value for: ${field}`
        : 'Please check your input and try again.',
      recoverable: true,
      context: { field, value },
    });
  }
}

/**
 * User cancellation error for @clack/prompts integration
 */
export class UserCancelledError extends CLIError {
  constructor(operation?: string) {
    super(`Operation cancelled by user${operation ? `: ${operation}` : ''}`, {
      code: 'USER_CANCELLED',
      recoverable: false,
      context: { operation },
    });
  }
}

/**
 * Error recovery suggestions map for common error patterns
 */
export const ERROR_RECOVERY_SUGGESTIONS = {
  ENOENT: 'File or directory not found. Check the path and try again.',
  EACCES: 'Permission denied. Try running with elevated permissions or check file permissions.',
  EEXIST: 'File or directory already exists. Use --force to overwrite or choose a different name.',
  ENOTDIR: 'Expected a directory but found a file. Check the path and try again.',
  EISDIR: 'Expected a file but found a directory. Check the path and try again.',
  EMFILE: 'Too many open files. Close some files or increase the file descriptor limit.',
  ENOSPC: 'No space left on device. Free up some disk space and try again.',
  ECONNREFUSED: 'Connection refused. Check if the service is running and accessible.',
  ETIMEDOUT: 'Operation timed out. Check your network connection and try again.',
  ENOTFOUND: 'DNS lookup failed. Check the hostname and your internet connection.',
  COMMAND_NOT_FOUND:
    'Command not found. Make sure the required tool is installed and in your PATH.',
  INVALID_JSON: 'Invalid JSON format. Check the file syntax and try again.',
  UNSUPPORTED_NODE_VERSION: 'Unsupported Node.js version. Please upgrade to a supported version.',
} as const;

/**
 * Check if a value represents a user cancellation from @clack/prompts
 */
export function isCancel(value: unknown): value is symbol {
  return clackIsCancel(value);
}

/**
 * Handle user cancellation gracefully
 */
export function handleCancel(operation?: string): never {
  throw new UserCancelledError(operation);
}

/**
 * Graceful exit function with cleanup
 */
export function gracefulExit(
  code: number = 0,
  message?: string,
  cleanup?: () => Promise<void> | void
): never {
  const exit = async () => {
    try {
      if (cleanup) {
        await cleanup();
      }
    } catch (error) {
      console.error(colors.red('Error during cleanup:'), error);
    } finally {
      if (message) {
        if (code === 0) {
          console.log(colors.green(message));
        } else {
          console.error(colors.red(message));
        }
      }
      process.exit(code);
    }
  };

  // Handle both sync and async cleanup
  exit();

  // This line will never be reached, but satisfies TypeScript's never return type
  throw new Error('Process should have exited');
}

/**
 * Format error with stack trace prettification
 */
export function formatError(
  error: Error,
  options: {
    showStack?: boolean;
    showSuggestion?: boolean;
    showContext?: boolean;
    colorize?: boolean;
  } = {}
): string {
  const { showStack = false, showSuggestion = true, showContext = true, colorize = true } = options;

  const parts: string[] = [];

  // Error name and message
  const errorHeader = `${error.name}: ${error.message}`;
  parts.push(colorize ? colors.red(errorHeader) : errorHeader);

  // CLI-specific error details
  if (error instanceof CLIError) {
    if (error.code) {
      const codeText = `Code: ${error.code}`;
      parts.push(colorize ? colors.gray(codeText) : codeText);
    }

    if (showSuggestion && error.suggestion) {
      const suggestionText = `💡 ${error.suggestion}`;
      parts.push(colorize ? colors.yellow(suggestionText) : suggestionText);
    }

    if (showContext && error.context && Object.keys(error.context).length > 0) {
      const contextText = `Context: ${JSON.stringify(error.context, null, 2)}`;
      parts.push(colorize ? colors.gray(contextText) : contextText);
    }
  }

  // Stack trace (if requested and available)
  if (showStack && error.stack) {
    const stackLines = error.stack.split('\n').slice(1); // Remove first line (already shown)
    const stackText = stackLines.join('\n');
    parts.push(colorize ? colors.gray(stackText) : stackText);
  }

  // Cause chain (if available) - check for CLIError which has cause property
  if (error instanceof CLIError && error.cause) {
    const causeText = `\nCaused by: ${formatError(error.cause, options)}`;
    parts.push(causeText);
  }

  return parts.join('\n');
}

/**
 * Get error recovery suggestion based on error code or type
 */
export function getRecoverySuggestion(error: Error): string | undefined {
  // Check for known error codes
  if ('code' in error && typeof error.code === 'string') {
    const suggestion =
      ERROR_RECOVERY_SUGGESTIONS[error.code as keyof typeof ERROR_RECOVERY_SUGGESTIONS];
    if (suggestion) return suggestion;
  }

  // Check for CLI-specific errors
  if (error instanceof CLIError && error.suggestion) {
    return error.suggestion;
  }

  // Check for common Node.js error codes
  if ('errno' in error && typeof error.errno === 'string') {
    const suggestion =
      ERROR_RECOVERY_SUGGESTIONS[error.errno as keyof typeof ERROR_RECOVERY_SUGGESTIONS];
    if (suggestion) return suggestion;
  }

  return undefined;
}

/**
 * Create a standardized error handler for async operations
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Check for user cancellation
      if (isCancel(error)) {
        handleCancel(operation);
      }

      // Re-throw CLI errors as-is
      if (error instanceof CLIError) {
        throw error;
      }

      // Wrap other errors in CLIError
      if (error instanceof Error) {
        throw new CLIError(`${operation ? `${operation}: ` : ''}${error.message}`, {
          code: 'WRAPPED_ERROR',
          suggestion: getRecoverySuggestion(error),
          recoverable: true,
          context: { operation },
          cause: error,
        });
      }

      // Handle non-Error objects
      throw new CLIError(`${operation ? `${operation}: ` : ''}Unknown error occurred`, {
        code: 'UNKNOWN_ERROR',
        recoverable: false,
        context: { operation, error },
      });
    }
  };
}

/**
 * Setup global error handlers for unhandled errors
 */
export function setupGlobalErrorHandlers(
  options: {
    onUnhandledRejection?: (error: Error) => void;
    onUncaughtException?: (error: Error) => void;
  } = {}
): void {
  const { onUnhandledRejection, onUncaughtException } = options;

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    if (onUnhandledRejection) {
      onUnhandledRejection(error);
    } else {
      console.error(colors.red('Unhandled Promise Rejection:'));
      console.error(formatError(error, { showStack: true }));
      gracefulExit(1, 'Exiting due to unhandled promise rejection');
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    if (onUncaughtException) {
      onUncaughtException(error);
    } else {
      console.error(colors.red('Uncaught Exception:'));
      console.error(formatError(error, { showStack: true }));
      gracefulExit(1, 'Exiting due to uncaught exception');
    }
  });

  // Handle process termination signals
  process.on('SIGINT', () => {
    gracefulExit(0, '\nOperation cancelled by user (Ctrl+C)');
  });

  process.on('SIGTERM', () => {
    gracefulExit(0, '\nProcess terminated');
  });
}
