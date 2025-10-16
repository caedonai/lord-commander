import { Command } from "commander";
import { registerCommands } from './commands/registerCommands.js';
import resolveCliDefaults, { loadConfig } from '../utils/config.js';
import { logger } from './ui/logger.js';
import * as prompts from './ui/prompts.js';
import * as fs from './execution/fs.js';
import * as exec from './execution/exec.js';
import * as git from '../plugins/git.js';
import { detectShell, installCompletion, analyzeProgram } from './commands/autocomplete.js';
import { CreateCliOptions, CommandContext } from "../types/cli";




/**
 * Create and run a Commander-based CLI.
 *
 * Initializes a Command with the provided options, loads CLI configuration,
 * registers commands from the given path, and parses argv asynchronously.
 * Any error thrown by command handlers is logged and causes the process to exit(1).
 *
 * @param {CreateCLIOptions} options - Options to configure the CLI.
 * @param {string} [options.name] - CLI display name. Defaults to 'CLI Tool'.
 * @param {string} [options.description] - CLI description. Defaults to ''.
 * @param {string} [options.version] - CLI version string. Defaults to '0.1.0'.
 * @param {string} [options.commandsPath] - Path to commands directory. If not specified, auto-discovers in common locations.
 * @param {object} [options.builtinCommands] - Configure built-in SDK commands.
 * @param {boolean} [options.builtinCommands.completion=true] - Include shell completion management command.
 * @param {boolean} [options.builtinCommands.hello=false] - Include example hello command.
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
    await registerCommands(program, context, options.commandsPath, builtinConfig);

    // Handle autocomplete setup if enabled
    if (options.autocomplete?.enabled !== false) {
        await handleAutocompleteSetup(program, options);
    }

    // Start CLI processing
    program.parseAsync(process.argv).catch((error) => {
        logger.error(`Error executing command: ${error.message}`);
        process.exit(1);
    });

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