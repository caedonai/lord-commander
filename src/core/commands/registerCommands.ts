import fs from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import type { CommandContext } from '../../types/cli';
import { ERROR_MESSAGES } from '../foundation/core/constants.js';

// Track registered commands and their sources for conflict detection
const registeredCommands = new Map<string, { source: string; path: string }>();
const processedPaths = new Set<string>();

/**
 * Validate that a path is safe and within allowed boundaries
 */
function validateCommandPath(commandPath: string, workingDir: string): boolean {
  try {
    const resolvedPath = path.resolve(commandPath);
    const resolvedWorkingDir = path.resolve(workingDir);

    // Ensure the resolved path is within the working directory or its subdirectories
    const relativePath = path.relative(resolvedWorkingDir, resolvedPath);

    // If relative path starts with '..' or is absolute, it's trying to escape
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return false;
    }

    // Additional check: make sure the resolved path is actually under working directory
    return resolvedPath.startsWith(resolvedWorkingDir);
  } catch {
    // If path resolution fails, consider it unsafe
    return false;
  }
}

/**
 * Check if a built-in command should be skipped based on configuration
 */
function shouldSkipBuiltinCommand(
  fileName: string,
  builtinConfig: { completion?: boolean; hello?: boolean; version?: boolean }
): boolean {
  switch (fileName) {
    case 'completion':
      return builtinConfig.completion === true;
    case 'hello':
      return builtinConfig.hello === true;
    case 'version':
      return builtinConfig.version === true;
    default:
      return false;
  }
}

/**
 * Check if a command name is already registered and handle conflicts
 */
function checkCommandConflict(
  commandName: string,
  commandPath: string,
  sourcePath: string,
  context: CommandContext
): boolean {
  const existing = registeredCommands.get(commandName);

  if (existing) {
    // Check if it's from the same directory path (duplicate registration)
    if (existing.source === sourcePath) {
      context.logger.debug(
        `Skipping duplicate registration of command '${commandName}' from same path: ${sourcePath}`
      );
      return true; // Skip silently
    } else {
      // Different paths with same command name - this is a conflict!
      const error = new Error(
        ERROR_MESSAGES.COMMAND_NAME_CONFLICT(
          commandName,
          existing.path,
          existing.source,
          commandPath,
          sourcePath
        )
      );
      context.logger.error(error.message);
      throw error;
    }
  }

  // Register this command
  registeredCommands.set(commandName, {
    source: sourcePath,
    path: commandPath,
  });

  return false; // No conflict, proceed with registration
}

/**
 * Reset command registration tracking (useful for testing)
 */
export function resetCommandTracking(): void {
  registeredCommands.clear();
  processedPaths.clear();
}

/**
 * Automatically discover commands directory in common locations
 */
function discoverCommandsDirectory(): string | null {
  const cwd = process.cwd();

  // Common command directory patterns to search for
  const searchPaths = [
    './commands', // Root level commands folder
    './src/commands', // Inside src folder
    './lib/commands', // Inside lib folder
    './cli/commands', // Inside cli folder
    './app/commands', // Inside app folder
    './bin/commands', // Inside bin folder
  ];

  for (const searchPath of searchPaths) {
    const absolutePath = path.resolve(cwd, searchPath);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
      // Check if directory has any command files
      const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
      const hasCommandFiles = entries.some(
        (entry) =>
          entry.isFile() &&
          entry.name.match(/\.(ts|js)$/) &&
          !entry.name.match(/\.(test|spec|d)\.(ts|js)$/) &&
          entry.name !== 'index.ts' &&
          entry.name !== 'index.js'
      );

      if (hasCommandFiles) {
        return absolutePath;
      }
    }
  }

  return null;
}

// interface CommandModule {
//   default: (program: Command, context: CommandContext) => void;
// }

/**
 * Recursively discover and register commands from a directory
 */
export async function registerCommands(
  program: Command,
  context: CommandContext,
  commandsPath?: string,
  builtinConfig?: { completion?: boolean; hello?: boolean; version?: boolean }
) {
  let absolutePath: string;
  const workingDir = process.cwd();

  if (commandsPath) {
    // Validate path security before processing
    if (!validateCommandPath(commandsPath, workingDir)) {
      const error = new Error(ERROR_MESSAGES.INVALID_COMMAND_PATH(commandsPath));
      context.logger.error(error.message);
      throw error;
    }

    // Use provided path
    absolutePath = path.resolve(workingDir, commandsPath);
    if (!fs.existsSync(absolutePath)) {
      context.logger.warn(`Specified commands directory not found: ${commandsPath}`);
      return;
    }
  } else {
    // Auto-discover commands directory
    const discoveredPath = discoverCommandsDirectory();
    if (!discoveredPath) {
      context.logger.debug('No commands directory found in common locations');
      return; // Silently return - this is normal for libraries that don't have commands
    }
    absolutePath = discoveredPath;
    context.logger.debug(
      `Auto-discovered commands directory: ${path.relative(workingDir, absolutePath)}`
    );
  }

  // Check if we've already processed this path
  const normalizedPath = path.normalize(absolutePath);
  if (processedPaths.has(normalizedPath)) {
    context.logger.debug(
      `Skipping already processed commands directory: ${path.relative(process.cwd(), absolutePath)}`
    );
    return;
  }

  // Mark this path as processed
  processedPaths.add(normalizedPath);

  try {
    // Get all files in the commands directory
    const entries = fs.readdirSync(absolutePath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(absolutePath, entry.name);

      if (entry.isDirectory()) {
        // Recursively process subdirectories, but don't mark subdirectories as "processed"
        // since they're part of the same source tree
        await registerCommands(program, context, fullPath, builtinConfig);
        continue;
      }

      // Only process TypeScript/JavaScript files
      if (!entry.name.match(/\.(ts|js|mjs)$/)) continue;

      // Skip test, type definition, and non-command files
      if (entry.name.match(/\.(test|spec|d)\.(ts|js)$/)) continue;
      if (entry.name === 'index.ts' || entry.name === 'index.js' || entry.name === 'index.mjs')
        continue;

      // Skip built-in commands only if they are enabled in registerBuiltinCommands
      const fileName = entry.name.replace(/\.(ts|js|mjs)$/, '');
      if (builtinConfig && shouldSkipBuiltinCommand(fileName, builtinConfig)) {
        context.logger.debug(
          `Skipping built-in command: ${fileName} (handled by registerBuiltinCommands)`
        );
        continue;
      }

      try {
        // Check for command name conflicts before registration
        const shouldSkip = checkCommandConflict(fileName, fullPath, absolutePath, context);
        if (shouldSkip) {
          continue;
        }

        // Use file:// URL for absolute path
        const fileUrl = `file:///${fullPath.replace(/\\/g, '/')}`;
        const commandModule = await import(fileUrl);

        if (typeof commandModule.default === 'function') {
          // Try to register the command and catch Commander.js duplicate errors
          try {
            commandModule.default(program, context);
            context.logger.debug(`Successfully registered command: ${fileName}`);
          } catch (cmdError) {
            // Handle Commander.js duplicate command errors gracefully
            if (cmdError instanceof Error && cmdError.message.includes('already have command')) {
              context.logger.warn(
                `Command '${fileName}' already registered, skipping: ${cmdError.message}`
              );
              // Remove from our tracking since it wasn't actually registered
              registeredCommands.delete(fileName);
            } else {
              throw cmdError; // Re-throw other errors
            }
          }
        } else {
          context.logger.warn(`Command module ${entry.name} does not export a default function`);
          // Remove from tracking since it wasn't registered
          registeredCommands.delete(fileName);
        }
      } catch (error) {
        // Handle both conflict errors and module loading errors
        if (error instanceof Error && error.message.includes('Command name conflict')) {
          // Re-throw conflict errors to stop processing
          throw error;
        } else {
          // Log other errors but continue processing
          const message = error instanceof Error ? error.message : String(error);
          context.logger.error(`Failed to load command from ${entry.name}: ${message}`);
          // Remove from tracking since registration failed
          registeredCommands.delete(fileName);
        }
      }
    }
  } catch (error) {
    // Re-throw command name conflict errors to stop the CLI
    if (error instanceof Error && error.message.includes('Command name conflict')) {
      throw error;
    } else {
      // Log other directory-level errors but don't crash
      context.logger.error(`Failed to read commands directory: ${error}`);
    }
  }
}
