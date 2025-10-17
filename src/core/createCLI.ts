import { Command } from "commander";
import { registerCommands } from './commands/registerCommands.js';
import resolveCliDefaults, { loadConfig } from '../utils/config.js';
import { logger } from './ui/logger.js';
import * as prompts from './ui/prompts.js';
import * as fs from './execution/fs.js';
import * as exec from './execution/exec.js';
import * as git from '../plugins/git.js';
import { detectShell, installCompletion, analyzeProgram } from './commands/autocomplete.js';
import { formatError } from './foundation/errors.js';
import { CreateCliOptions, CommandContext } from "../types/cli";

/**
 * Check if debug mode is enabled via environment variables or CLI arguments
 * In production, debug mode is disabled regardless of flags for security
 */
function isDebugMode(): boolean {
    // Security: Never enable debug mode in production
    if (process.env.NODE_ENV === 'production') {
        return false;
    }
    
    return process.env.DEBUG === 'true' || 
           process.env.NODE_ENV === 'development' ||
           process.argv.includes('--debug') ||
           process.argv.includes('--verbose');
}

/**
 * Format error for user-friendly display with appropriate detail level
 * Includes security-conscious formatting for production environments
 */
function formatErrorForDisplay(error: Error, options: { showStack?: boolean } = {}): string {
    const { showStack = false } = options;
    
    // Use the formatError utility but with user-friendly defaults
    return formatError(error, {
        showStack,
        showSuggestion: true,
        showContext: process.env.NODE_ENV !== 'production', // Hide context in production
        colorize: true
    });
}

/**
 * Sanitize error message to remove potentially sensitive information
 */
function sanitizeErrorMessage(message: string): string {
    return message
        .replace(/password[=:]\s*\S+/gi, 'password=***')
        .replace(/token[=:]\s*\S+/gi, 'token=***')
        .replace(/key[=:]\s*\S+/gi, 'key=***')
        .replace(/secret[=:]\s*\S+/gi, 'secret=***')
        .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***');
}




/**
 * Create and run a Commander-based CLI.
 *
 * Initializes a Command with the provided options, loads CLI configuration,
 * registers commands from the given path, and parses argv asynchronously.
 * Any error thrown by command handlers is logged and causes the process to exit(1).
 * 
 * Error Handling:
 * - Default: Logs user-friendly error message; stack traces shown in debug mode
 * - Custom errorHandler: Receives full Error object; if handler throws, falls back to default behavior
 * - Debug mode: Enabled via DEBUG=true, NODE_ENV=development, --debug, or --verbose flags
 * - Stack traces: Automatically shown in debug mode for better developer experience
 * - Production safety: Debug mode disabled when NODE_ENV=production regardless of flags
 * - Message sanitization: Sensitive patterns (passwords, tokens, keys) sanitized in production
 * 
 * Security Considerations:
 * - Custom error handlers execute with full application privileges
 * - Error handlers should sanitize sensitive information before logging
 * - Production deployments should set NODE_ENV=production to disable debug features
 * - Consider implementing error handler validation for untrusted code
 *
 * @param {CreateCLIOptions} options - Options to configure the CLI.
 * @param {string} [options.name] - CLI display name. Defaults to 'CLI Tool'.
 * @param {string} [options.description] - CLI description. Defaults to ''.
 * @param {string} [options.version] - CLI version string. Defaults to '0.1.0'.
 * @param {string|string[]} [options.commandsPath] - Path(s) to commands directory/directories. If not specified, auto-discovers in common locations.
 * @param {object} [options.builtinCommands] - Configure built-in SDK commands.
 * @param {boolean} [options.builtinCommands.completion=true] - Include shell completion management command.
 * @param {boolean} [options.builtinCommands.hello=false] - Include example hello command.
 * @param {function} [options.errorHandler] - Custom error handler for command execution errors. Receives Error object. Should sanitize sensitive information. If not provided, defaults to logging error with stack trace in debug mode and exit(1).
 * @returns {Promise<Command>} The configured Commander program instance
 */
export async function createCLI(options: CreateCliOptions): Promise<Command> {
    const {name, version, description} = resolveCliDefaults(options);
    const program = new Command();

    program.name(name);
    program.version(version);
    program.description(description);

    const config = loadConfig(name);
    
    // Create CommandContext with available utilities
    const context: CommandContext = {
        logger,
        prompts,
        fs,
        exec,
        git,
        config,
        cwd: process.cwd()
    };

    // Configure built-in commands (defaults: completion=true, hello=false, version=false)
    const builtinConfig = {
        completion: options.builtinCommands?.completion ?? true,
        hello: options.builtinCommands?.hello ?? false,
        version: options.builtinCommands?.version ?? false
    };

    // Register built-in commands first (if enabled)
    await registerBuiltinCommands(program, context, builtinConfig);

    // Register user commands (auto-discover if no path specified)
    // Pass builtinConfig so registerCommands knows which commands to skip
    if (options.commandsPath) {
        const paths = Array.isArray(options.commandsPath) ? options.commandsPath : [options.commandsPath];
        // Filter out falsy values (null, undefined, empty strings)
        const validPaths = paths.filter(Boolean);
        for (const commandPath of validPaths) {
            await registerCommands(program, context, commandPath, builtinConfig);
        }
    } else {
        // Auto-discovery when no paths specified
        await registerCommands(program, context, undefined, builtinConfig);
    }

    // Handle autocomplete setup if enabled
    if (options.autocomplete?.enabled !== false) {
        await handleAutocompleteSetup(program, options);
    }

    // Start CLI processing (unless skipped for testing)
    if (!options.skipArgvParsing) {
        program.parseAsync(process.argv).catch(async (error) => {
            if (options.errorHandler) {
                // Use custom error handler if provided
                try {
                    await options.errorHandler(error);
                } catch (handlerError) {
                    // If custom error handler throws, fall back to default behavior with enhanced logging
                    logger.error('Custom error handler failed:');
                    const handlerErr = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
                    logger.error(formatErrorForDisplay(handlerErr, { showStack: isDebugMode() }));
                    logger.error('\nOriginal command error:');
                    logger.error(formatErrorForDisplay(error, { showStack: isDebugMode() }));
                    process.exit(1);
                }
            } else {
                // Enhanced default error handling with stack traces in debug mode and message sanitization
                const isDebug = isDebugMode();
                const message = isDebug ? error.message : sanitizeErrorMessage(error.message);
                
                // Create a sanitized error for display if not in debug mode
                const displayError = isDebug ? error : new Error(message);
                if (!isDebug && error.stack) {
                    displayError.stack = undefined; // Remove stack trace in production
                }
                
                logger.error('Command execution failed:');
                logger.error(formatErrorForDisplay(displayError, { showStack: isDebug }));
                process.exit(1);
            }
        });
    }

    return program;
}

/**
 * Register built-in SDK commands based on configuration
 */
export async function registerBuiltinCommands(
    program: Command, 
    context: CommandContext, 
    config: { completion: boolean; hello: boolean; version: boolean }
) {
    if (config.completion) {
        try {
            const completionModule = await import('../commands/completion.js');
            if (completionModule.default) {
                completionModule.default(program, context);
            }
        } catch (error) {
            // Silently ignore if completion command is not available
            logger.debug(`Could not load completion command: ${error}`);
        }
    }

    if (config.hello) {
        try {
            const helloModule = await import('../commands/hello.js');
            if (helloModule.default) {
                helloModule.default(program, context);
            }
        } catch (error) {
            // Silently ignore if hello command is not available
            logger.debug(`Could not load hello command: ${error}`);
        }
    }

    if (config.version) {
        try {
            const versionModule = await import('../commands/version.js');
            if (versionModule.default) {
                versionModule.default(program, context);
            }
        } catch (error) {
            // Silently ignore if version command is not available
            logger.debug(`Could not load version command: ${error}`);
        }
    }
}

/**
 * Handle autocomplete setup during CLI initialization
 */
async function handleAutocompleteSetup(program: Command, options: CreateCliOptions) {
    const autocompleteConfig = options.autocomplete || {};
    
    // Auto-install if requested and not already installed
    if (autocompleteConfig.autoInstall) {
        try {
            const shell = await detectShell();
            
            // Check if completion should be installed for this shell
            if (!autocompleteConfig.shells || autocompleteConfig.shells.includes(shell)) {
                logger.info(`Setting up ${shell} completion...`);
                
                const result = await installCompletion(program, {
                    shell,
                    global: false // Default to user-local installation
                });
                
                if (result.success && result.restartRequired) {
                    logger.note(`Shell completion installed! Restart your shell or run: ${result.activationCommand}`);
                }
            }
        } catch (error) {
            // Silently ignore autocomplete setup errors during CLI creation
            logger.debug(`Autocomplete setup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    // Add completion context to program for command access
    (program as any)._autocompleteContext = analyzeProgram(program);
}