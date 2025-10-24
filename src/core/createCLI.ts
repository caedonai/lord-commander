import { Command } from "commander";
import { registerCommands } from './commands/registerCommands.js';
import resolveCliDefaults, { loadConfig } from '../utils/config.js';
import { logger } from './ui/logger.js';
import * as prompts from './ui/prompts.js';
import * as fs from './execution/fs.js';
import * as execa from './execution/execa.js';
import { detectShell, installCompletion, analyzeProgram } from './commands/autocomplete.js';
import { formatError, CLIError } from './foundation/errors/errors.js';
import { CreateCliOptions, CommandContext } from "../types/cli";

/**
 * Custom error class for error handler validation failures
 */
export class ErrorHandlerValidationError extends Error {
    public violations: string[] = [];
    
    constructor(message: string, violations: string[] = []) {
        super(message);
        this.name = 'ErrorHandlerValidationError';
        this.violations = violations;
    }
}

/**
 * Security configuration for error handler validation
 */
interface ErrorHandlerSecurityOptions {
    strict?: boolean;
    timeout?: number;
    allowedModules?: string[];
    maxFunctionLength?: number;
}

/**
 * Default security configuration for error handler validation
 */
const DEFAULT_SECURITY_OPTIONS: Required<ErrorHandlerSecurityOptions> = {
    strict: true,
    timeout: 5000, // 5 second timeout
    allowedModules: ['util', 'path'], // Only safe Node.js modules
    maxFunctionLength: 10000 // Max function source length
};

/**
 * Validate error handler function for security risks
 * 
 * Performs comprehensive security analysis including:
 * - Function type and parameter validation
 * - Code content analysis for dangerous operations
 * - Module usage validation
 * - Size and complexity limits
 * 
 * @param handler - The error handler function to validate
 * @param options - Security configuration options
 * @throws {ErrorHandlerValidationError} If validation fails
 */
export function validateErrorHandler(
    handler: any, 
    options: ErrorHandlerSecurityOptions = {}
): void {
    const config = { ...DEFAULT_SECURITY_OPTIONS, ...options };
    const violations: string[] = [];

    // 1. Type validation
    if (typeof handler !== 'function') {
        throw new ErrorHandlerValidationError(
            `Error handler must be a function, received: ${typeof handler}`,
            ['INVALID_TYPE']
        );
    }

    // 2. Parameter count validation
    if (handler.length !== 1) {
        throw new ErrorHandlerValidationError(
            `Error handler must accept exactly one parameter (error: Error), received: ${handler.length} parameters`,
            ['INVALID_PARAMETER_COUNT']
        );
    }

    // 3. Function source code analysis
    const functionSource = handler.toString();
    
    // Check function length
    if (functionSource.length > config.maxFunctionLength) {
        violations.push(`FUNCTION_TOO_LARGE: Function source exceeds ${config.maxFunctionLength} characters`);
    }

    // 4. Dangerous operation detection
    const dangerousPatterns = [
        // Code execution
        { pattern: /\beval\s*\(/gi, reason: 'eval() can execute arbitrary code' },
        { pattern: /new\s+Function\s*\(/gi, reason: 'Function constructor can execute arbitrary code' },
        
        // Process manipulation
        { pattern: /process\.exit\s*\(/gi, reason: 'process.exit() can terminate the application unexpectedly' },
        { pattern: /process\.kill\s*\(/gi, reason: 'process.kill() can terminate processes' },
        { pattern: /process\.abort\s*\(/gi, reason: 'process.abort() can crash the application' },
        
        // File system access (in strict mode)
        ...(config.strict ? [
            { pattern: /require\s*\(\s*['"`]fs['"`]\s*\)/gi, reason: 'File system access is restricted' },
            { pattern: /require\s*\(\s*['"`]child_process['"`]\s*\)/gi, reason: 'Child process spawning is restricted' },
            { pattern: /require\s*\(\s*['"`]os['"`]\s*\)/gi, reason: 'OS module access is restricted' },
            { pattern: /require\s*\(\s*['"`]crypto['"`]\s*\).*randomBytes/gi, reason: 'Large crypto operations are restricted' },
        ] : []),
        
        // Network access
        { pattern: /require\s*\(\s*['"`]http['"`]\s*\)/gi, reason: 'HTTP module access is restricted' },
        { pattern: /require\s*\(\s*['"`]https['"`]\s*\)/gi, reason: 'HTTPS module access is restricted' },
        { pattern: /require\s*\(\s*['"`]net['"`]\s*\)/gi, reason: 'Network module access is restricted' },
        
        // Dynamic module loading
        { pattern: /require\s*\(\s*[^'"`]/gi, reason: 'Dynamic require() calls are restricted' },
        { pattern: /import\s*\(\s*[^'"`]/gi, reason: 'Dynamic import() calls are restricted' },
    ];

    for (const { pattern, reason } of dangerousPatterns) {
        if (pattern.test(functionSource)) {
            violations.push(`DANGEROUS_OPERATION: ${reason}`);
        }
    }

    // 5. Module usage validation
    const modulePattern = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/gi;
    let match;
    while ((match = modulePattern.exec(functionSource)) !== null) {
        const moduleName = match[1];
        if (!config.allowedModules.includes(moduleName)) {
            violations.push(`RESTRICTED_MODULE: Module '${moduleName}' is not in the allowed list`);
        }
    }

    // 6. Throw error if violations found
    if (violations.length > 0) {
        const message = `Error handler contains potentially dangerous operations:\n${violations.join('\n')}`;
        throw new ErrorHandlerValidationError(message, violations);
    }
}

/**
 * Execute error handler safely with timeout and error isolation
 * 
 * Provides additional runtime protection including:
 * - Timeout protection against hanging handlers
 * - Error isolation and wrapping
 * - Input sanitization
 * - Resource cleanup
 * 
 * @param handler - The validated error handler function
 * @param error - The error to pass to the handler
 * @param options - Execution options
 * @returns Promise that resolves when handler completes
 */
export async function executeErrorHandlerSafely(
    handler: Function,
    error: Error,
    options: Pick<ErrorHandlerSecurityOptions, 'timeout'> = {}
): Promise<void> {
    const config = { ...DEFAULT_SECURITY_OPTIONS, ...options };
    
    // 1. Apply comprehensive error sanitization with integrated memory protection
    const { 
      sanitizeErrorObjectWithMemoryProtection, 
      DEFAULT_MEMORY_CONFIG 
    } = await import('./foundation/memory/protection.js');
    
    const sanitizedError = sanitizeErrorObjectWithMemoryProtection(error, DEFAULT_MEMORY_CONFIG);
    
    // 2. Create timeout promise with proper cleanup
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(
                `Error handler execution timed out after ${config.timeout}ms. ` +
                `This may indicate an infinite loop or blocking operation in the error handler.`
            ));
        }, config.timeout);
    });

    // 3. Execute handler with timeout protection
    try {
        const handlerPromise = Promise.resolve(handler(sanitizedError));
        const result = await Promise.race([handlerPromise, timeoutPromise]);
        
        // Clear timeout on successful completion
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        return result;
    } catch (handlerError) {
        // Clear timeout on error
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        // 4. Wrap handler errors with context
        const wrappedError = new Error(
            `Error handler failed: ${handlerError instanceof Error ? handlerError.message : String(handlerError)}. ` +
            `Original error: ${error.message}`
        );
        
        // Preserve stack trace for debugging if available
        if (handlerError instanceof Error && handlerError.stack) {
            wrappedError.stack = `${wrappedError.stack}\nCaused by: ${handlerError.stack}`;
        }
        
        throw wrappedError;
    }
}



/**
 * Format error for user-friendly display with appropriate detail level
 * Includes security-conscious formatting for production environments
 */
function formatErrorForDisplay(error: Error, options: { showStack?: boolean } = {}): string {
    const { showStack = false } = options;
    
    // Security: Use shouldShowDetailedErrors for production safety
    const showDetails = enhancedShouldShowDetailedErrors();
    const actualShowStack = showStack && showDetails;
    
    // Sanitize the error message
    const sanitizedMessage = showDetails ? error.message : enhancedSanitizeErrorMessage(error.message);
    
    // Create sanitized error for display
    const displayError = new Error(sanitizedMessage);
    if (actualShowStack && error.stack) {
        displayError.stack = enhancedSanitizeStackTrace(error.stack);
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
 * Security configuration for error handling and memory protection
 */
interface SecurityConfig {
    /** Maximum error message length (default: 500 characters) */
    maxMessageLength: number;
    /** Maximum stack trace depth (default: 10 frames) */
    maxStackTraceDepth: number;
    /** Maximum error object memory size in bytes (default: 10KB) */
    maxErrorObjectSize: number;
    /** Maximum number of properties in error context (default: 50) */
    maxContextProperties: number;
    /** Enable memory usage monitoring (default: true) */
    enableMemoryMonitoring: boolean;
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    maxMessageLength: 500,
    maxStackTraceDepth: 10,
    maxErrorObjectSize: 10 * 1024, // 10KB
    maxContextProperties: 50,
    enableMemoryMonitoring: true
};

/**
 * Calculate approximate memory size of an object
 */
function getObjectMemorySize(obj: any, visited = new WeakSet()): number {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'boolean') return 4;
    if (typeof obj === 'string') return obj.length * 2; // UTF-16
    
    // Prevent infinite recursion with circular references
    if (visited.has(obj)) return 0;
    visited.add(obj);
    
    let size = 0;
    
    if (Array.isArray(obj)) {
        size = obj.length * 8; // Array overhead
        for (const item of obj) {
            size += getObjectMemorySize(item, visited);
            // Don't break early - let it calculate the full size for warning purposes
            // Just set a reasonable upper bound to prevent infinite calculation
            if (size > DEFAULT_SECURITY_CONFIG.maxErrorObjectSize * 10) break;
        }
    } else if (typeof obj === 'object') {
        size = 64; // Object overhead
        const keys = Object.keys(obj);
        
        // Limit number of properties to prevent memory exhaustion during calculation
        const limitedKeys = keys.slice(0, DEFAULT_SECURITY_CONFIG.maxContextProperties);
        
        for (const key of limitedKeys) {
            size += key.length * 2; // Key string
            size += getObjectMemorySize(obj[key], visited);
            // Don't break early - let it calculate the full size for warning purposes
            // Just set a reasonable upper bound to prevent infinite calculation
            if (size > DEFAULT_SECURITY_CONFIG.maxErrorObjectSize * 10) break;
        }
    }
    
    return size; // Return actual calculated size, not limited
}

/**
 * Truncate error message with memory protection
 */
function truncateErrorMessage(message: string, maxLength = DEFAULT_SECURITY_CONFIG.maxMessageLength): string {
    if (!message || message.length <= maxLength) return message;
    
    // Add truncation indicator
    const indicator = '... [truncated for security]';
    const availableLength = maxLength - indicator.length;
    
    if (availableLength <= 0) return indicator;
    
    return message.slice(0, availableLength) + indicator;
}

/**
 * Sanitize error object with memory protection
 */
function sanitizeErrorObject(error: Error, securityConfig = DEFAULT_SECURITY_CONFIG): Error {
    // Calculate memory size if monitoring is enabled
    if (securityConfig.enableMemoryMonitoring) {
        const memorySize = getObjectMemorySize(error);
        if (memorySize > securityConfig.maxErrorObjectSize) {
            console.warn(`[Security] Large error object detected (${memorySize} bytes), applying memory protection`);
        }
    }
    
    // Create a new error with sanitized message (handles truncation internally)
    const sanitizedMessage = enhancedSanitizeErrorMessage(error.message || '');
    const sanitizedError = new Error(sanitizedMessage);
    sanitizedError.name = error.name;
    
    // Handle stack trace - only if original error had one
    if (error.stack) {
        const stackLines = error.stack.split('\n');
        const limitedStack = stackLines.slice(0, securityConfig.maxStackTraceDepth);
        sanitizedError.stack = enhancedSanitizeStackTrace(limitedStack.join('\n'));
    } else {
        // If original error had no stack, remove the auto-generated stack
        Object.defineProperty(sanitizedError, 'stack', {
            value: undefined,
            writable: true,
            enumerable: false,
            configurable: true
        });
    }
    
    // Safely copy limited context if it exists
    if (error instanceof CLIError && error.context) {
        const contextEntries = Object.entries(error.context).slice(0, securityConfig.maxContextProperties);
        (sanitizedError as any).context = Object.fromEntries(
            contextEntries.map(([key, value]) => [
                key,
                typeof value === 'string' ? truncateErrorMessage(value, 100) : 
                typeof value === 'object' ? '[Object - truncated]' : 
                value
            ])
        );
    }
    
    return sanitizedError;
}

// Import enhanced error sanitization functions
import { 
    sanitizeErrorMessage as enhancedSanitizeErrorMessage,
    sanitizeStackTrace as enhancedSanitizeStackTrace,
    shouldShowDetailedErrors as enhancedShouldShowDetailedErrors,
    isDebugMode as enhancedIsDebugMode
} from './foundation/errors/sanitization.js';



// Re-export log injection protection functions from foundation module
export { sanitizeLogOutput, sanitizeLogOutputAdvanced, analyzeLogSecurity, type LogInjectionConfig } from './foundation/logging/security.js';

/**
 * Enhanced Command interface with manual execution control
 */
export interface EnhancedCommand extends Command {
    /**
     * Manually run the CLI with proper error handling
     * 
     * @param argv - Command line arguments (defaults to process.argv)
     * @returns Promise that resolves when CLI execution completes
     * @throws {Error} If CLI has already been started (when autoStart: true)
     */
    run(argv?: string[]): Promise<void>;
    
    /**
     * Internal state tracking for execution control
     */
    _cliState?: {
        hasBeenExecuted: boolean;
        autoStartEnabled: boolean;
        options: CreateCliOptions;
    };
}

/**
 * Centralized error handling logic for CLI execution
 * 
 * Handles both custom and default error scenarios with comprehensive security
 * 
 * @param error - The error that occurred during CLI execution
 * @param options - CLI options containing error handler configuration
 */
async function handleCLIError(error: Error, options: CreateCliOptions): Promise<void> {
    if (options.errorHandler) {
        // Use custom error handler with security wrapper
        try {
            await executeErrorHandlerSafely(options.errorHandler, error);
        } catch (handlerError) {
            // If custom error handler throws, fall back to default behavior with enhanced logging
            logger.error('Custom error handler failed:');
            const handlerErr = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
            logger.error(formatErrorForDisplay(handlerErr, { showStack: enhancedIsDebugMode() }));
            logger.error('\nOriginal command error:');
            logger.error(formatErrorForDisplay(error, { showStack: enhancedIsDebugMode() }));
            process.exit(1);
        }
    } else {
        // Enhanced default error handling with security-conscious approach
        const showDetails = enhancedShouldShowDetailedErrors();
        
        if (showDetails) {
            // Development: Show detailed information
            logger.error('Command execution failed:');
            logger.error(formatErrorForDisplay(error, { showStack: true }));
        } else {
            // Production: Show minimal, sanitized information
            const sanitizedMessage = enhancedSanitizeErrorMessage(error.message);
            logger.error(`Application error: ${sanitizedMessage}`);
            logger.error('Please contact support for assistance.');
        }
        
        process.exit(1);
    }
}

/**
 * Create and optionally run a Commander-based CLI.
 *
 * Initializes a Command with the provided options, loads CLI configuration,
 * registers commands from the given path, and optionally parses argv asynchronously.
 * Any error thrown by command handlers is logged and causes the process to exit(1).
 * 
 * Error Handling:
 * - If options.errorHandler is provided, it will be validated for security and executed safely
 * - If custom error handler throws, falls back to default error handling
 * - Default behavior: Log error with appropriate detail level and exit(1)
 * - Debug mode: Shows full stack traces and detailed information  
 * - Production mode: Shows minimal sanitized information
 * 
 * Manual Execution:
 * - Set autoStart: false for manual control
 * - Use returned program.run() method to execute when ready
 * - run() method includes same error handling as autoStart
 * - Prevents double execution when autoStart: true
 * 
 * @param {CreateCliOptions} options - Configuration for the CLI
 * @param {string} options.name - CLI name (used for help and config)
 * @param {string} options.version - CLI version (shown in --version)
 * @param {string} options.description - CLI description (shown in help)
 * @param {string|string[]} [options.commandsPath] - Path(s) to commands directory. Supports arrays for multiple directories. Defaults to "./commands".
 * @param {object} [options.autocomplete] - Autocomplete configuration
 * @param {boolean} [options.autocomplete.enabled=true] - Enable shell completion
 * @param {boolean} [options.autocomplete.autoInstall=false] - Auto-install completion 
 * @param {string[]} [options.autocomplete.shells] - Target shells for completion
 * @param {object} [options.builtinCommands] - Built-in command configuration
 * @param {boolean} [options.builtinCommands.completion=true] - Include shell completion management command.
 * @param {boolean} [options.builtinCommands.hello=false] - Include example hello command.
 * @param {object} [options.plugins] - Plugin configuration
 * @param {boolean} [options.plugins.git=false] - Enable git operations plugin
 * @param {boolean} [options.plugins.workspace=false] - Enable workspace management plugin  
 * @param {boolean} [options.plugins.updater=false] - Enable version update plugin
 * @param {function} [options.errorHandler] - Custom error handler for command execution errors. Receives Error object. Should sanitize sensitive information. If not provided, defaults to logging error with stack trace in debug mode and exit(1).
 * @param {boolean} [options.autoStart=true] - Automatically start CLI with parseAsync(). Set to false for manual control via program.run().
 * @returns {Promise<EnhancedCommand>} The configured Commander program instance with run() method
 */
export async function createCLI(options: CreateCliOptions): Promise<EnhancedCommand> {
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
        execa,
        config,
        cwd: process.cwd()
    };

    // Add plugins if enabled - Dynamic plugin registry for optimal tree-shaking
    if (options.plugins) {
        const pluginLoaders = {
            git: () => import('../plugins/git.js'),
            workspace: () => import('../plugins/workspace.js'),
            updater: () => import('../plugins/updater.js')
        };
        
        for (const [pluginName, isEnabled] of Object.entries(options.plugins)) {
            if (isEnabled && pluginLoaders[pluginName as keyof typeof pluginLoaders]) {
                try {
                    const pluginModule = await pluginLoaders[pluginName as keyof typeof pluginLoaders]();
                    (context as any)[pluginName] = pluginModule;
                    logger.debug(`Dynamically loaded plugin: ${pluginName}`);
                } catch (error) {
                    logger.warn(`Failed to load plugin '${pluginName}': ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
    }

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

    // Validate error handler security if provided
    if (options.errorHandler) {
        try {
            validateErrorHandler(options.errorHandler, {
                strict: process.env.NODE_ENV === 'production', // Stricter validation in production
                timeout: 5000 // 5 second timeout
            });
        } catch (validationError) {
            if (validationError instanceof ErrorHandlerValidationError) {
                logger.error('Error handler validation failed:');
                logger.error(validationError.message);
                if (validationError.violations.length > 0) {
                    logger.error('Violations detected:');
                    validationError.violations.forEach(violation => {
                        logger.error(`  - ${violation}`);
                    });
                }
                throw validationError;
            }
            throw validationError;
        }
    }

    // Start CLI processing (unless autoStart is disabled)
    const enhancedProgram = program as EnhancedCommand;
    
    // Add CLI state tracking
    enhancedProgram._cliState = {
        hasBeenExecuted: false,
        autoStartEnabled: options.autoStart !== false,
        options
    };
    
    // Add run method for manual execution control
    enhancedProgram.run = async function(argv: string[] = process.argv): Promise<void> {
        const state = this._cliState!;
        
        // Prevent double execution with optimized logic
        if (state.hasBeenExecuted) {
            const message = state.autoStartEnabled 
                ? 'CLI has already been executed automatically (autoStart: true). Set autoStart: false if you want manual control via run().'
                : 'CLI has already been executed. Multiple calls to run() are not supported.';
            logger.warn(message);
            return;
        }
        
        // Mark as executed
        state.hasBeenExecuted = true;
        
        try {
            await this.parseAsync(argv);
        } catch (error) {
            await handleCLIError(error as Error, state.options);
        }
    };
    
    // Auto-start if enabled (default behavior)
    if (options.autoStart !== false) {
        enhancedProgram._cliState.hasBeenExecuted = true;
        program.parseAsync(process.argv).catch(async (error) => {
            await handleCLIError(error, options);
        });
    }

    return enhancedProgram;
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

// Export memory protection and display functions
export {
    sanitizeErrorObject,
    truncateErrorMessage,
    getObjectMemorySize,
    formatErrorForDisplay
};

// Re-export enhanced error sanitization functions from foundation module
export { 
    sanitizeErrorMessage,
    sanitizeStackTrace,
    isDebugMode,
    shouldShowDetailedErrors,
    sanitizeErrorForProduction,
    createEnvironmentConfig,
    type ErrorSanitizationConfig,
    DEFAULT_ERROR_SANITIZATION_CONFIG
} from './foundation/errors/sanitization.js';