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
    
    // Security: Use shouldShowDetailedErrors for production safety
    const showDetails = shouldShowDetailedErrors();
    const actualShowStack = showStack && showDetails;
    
    // Sanitize the error message
    const sanitizedMessage = showDetails ? error.message : sanitizeErrorMessage(error.message);
    
    // Create sanitized error for display
    const displayError = new Error(sanitizedMessage);
    if (actualShowStack && error.stack) {
        displayError.stack = sanitizeStackTrace(error.stack);
    }
    
    // Use the formatError utility but with security-conscious defaults
    return formatError(displayError, {
        showStack: actualShowStack,
        showSuggestion: true,
        showContext: showDetails, // Hide context in production
        colorize: true
    });
}

/**
 * Sanitize error message to remove potentially sensitive information
 * Enhanced to catch more patterns and provide comprehensive protection
 */
function sanitizeErrorMessage(message: string): string {
    return message
        // Remove potential injection patterns first (before other processing)
        .replace(/<[^>]*>/g, '') // Remove HTML/XML tags completely
        .replace(/javascript:[^;\s]*/gi, '') // Remove javascript: URLs
        .replace(/alert\s*\([^)]*\)/gi, '') // Remove alert() calls
        .replace(/eval\s*\([^)]*\)/gi, '') // Remove eval() calls
        .replace(/on\w+\s*=\s*[^>\s]*/gi, '') // Remove event handlers
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        
        // Generic patterns for common sensitive data (processed first to preserve casing)
        .replace(/API_KEY[=:-][^\s,;}]+/g, 'API_KEY=***')
        .replace(/TOKEN[=:-][^\s,;}]+/g, 'TOKEN=***')
        .replace(/SECRET[=:-][^\s,;}]+/g, 'SECRET=***')
        .replace(/PWD[=:-][^\s,;}]+/g, 'PWD=***')
        .replace(/([A-Z_]*SECRET[A-Z_]*)-[^\s,;}]+/gi, '$1=***') // Handle SECRET-data pattern
        .replace(/(key|secret|token|password|pass|pwd)[=:-][^\s,;}]+/gi, '$1=***')
        
        // Passwords and secrets (more specific patterns)
        .replace(/password[=:]\s*\S+/gi, 'password=***')
        .replace(/passwd[=:]\s*\S+/gi, 'passwd=***')
        .replace(/private[_-]?key[=:]\s*\S+/gi, 'private_key=***')
        
        // API keys and tokens (kept only for patterns not covered above)
        .replace(/access[_-]?token[=:]\s*\S+/gi, 'access_token=***')
        .replace(/bearer[=:]\s*\S+/gi, 'bearer=***')
        .replace(/authorization[=:]\s*[^\s]+(\s+[^\s]+)*/gi, 'authorization=***')
        
        // Database and connection strings
        .replace(/connection[_-]?string[=:]\s*\S+/gi, 'connection_string=***')
        .replace(/(mongodb|mysql|postgres|redis):\/\/[^\s]+/gi, '$1://***')
        .replace(/host[=:]\s*\S+/gi, 'host=***')
        .replace(/database[=:]\s*\S+/gi, 'database=***')
        
        // File paths that might contain sensitive info
        .replace(/\/Users\/[^\/\s]+(?:\/[^\/\s]*)*(?:\/[^\/\s]+)?/g, '/Users/***/')
        .replace(/C:[\/\\]Users[\/\\][^\/\\\s]+(?:[\/\\][^\/\\\s]*)*(?:[\/\\][^\/\\\s]+)?/g, 'C:\\Users\\***\\')
        .replace(/\/home\/[^\/\s]+(?:\/[^\/\s]*)*(?:\/[^\/\s]+)?/g, '/home/***/')
        
        // Email addresses and usernames
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***')
        .replace(/username[=:]\s*\S+/gi, 'username=***')
        .replace(/user[=:]\s*\S+/gi, 'user=***')
        
        // Credit card and financial information
        .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****')
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****') // SSN pattern
        
        // IP addresses and network info
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '***.***.***.***')
        .replace(/port[=:]\s*\d+/gi, 'port=***')
        
        .replace(/['"](sk|pk|tok|key)-[a-zA-Z0-9_-]+['"]/g, '"***"')
        
        .slice(0, 500); // Limit message length to prevent DoS
}

/**
 * Sanitize stack trace to remove sensitive file paths and internal details
 */
function sanitizeStackTrace(stack: string): string {
    if (!stack) return stack;
    
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        // In production, completely remove stack traces for security
        return '';
    }
    
    return stack
        // Remove absolute file paths, keep relative ones
        .replace(/\/.*?\/node_modules/g, 'node_modules')
        .replace(/C:\\.*?\\node_modules/g, 'node_modules')
        // Remove user home directory paths
        .replace(/\/Users\/[^\/]+/g, '/Users/***')
        .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\***')
        // Remove other potentially sensitive paths
        .replace(/\/home\/[^\/]+/g, '/home/***')
        .replace(/\/opt\/[^\/]+/g, '/opt/***')
        // Limit stack trace depth in development
        .split('\n').slice(0, 10).join('\n');
}

/**
 * Check if we should show detailed error information
 */
function shouldShowDetailedErrors(): boolean {
    // Never show detailed errors in production
    if (process.env.NODE_ENV === 'production') {
        return false;
    }
    
    // Show detailed errors in development/debug mode
    return isDebugMode();
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
                // Enhanced default error handling with security-conscious approach
                const showDetails = shouldShowDetailedErrors();
                
                if (showDetails) {
                    // Development: Show detailed information
                    logger.error('Command execution failed:');
                    logger.error(formatErrorForDisplay(error, { showStack: true }));
                } else {
                    // Production: Show minimal, sanitized information
                    const sanitizedMessage = sanitizeErrorMessage(error.message);
                    logger.error(`Application error: ${sanitizedMessage}`);
                    logger.error('Please contact support for assistance.');
                }
                
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

// Export sanitization functions for testing
export {
    sanitizeErrorMessage,
    sanitizeStackTrace,
    isDebugMode,
    shouldShowDetailedErrors,
    formatErrorForDisplay
};