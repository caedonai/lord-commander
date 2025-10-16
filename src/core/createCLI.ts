import { Command } from "commander";
import { registerCommands } from './registerCommands.js';
import resolveCliDefaults, { loadConfig } from '../utils/config.js';
import { logger } from './logger.js';
import * as prompts from './prompts.js';
import * as fs from './fs.js';
import * as exec from './exec.js';
import * as git from '../plugins/git.js';
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
 * @returns {Promise<void>}
 */
export async function createCLI(options: CreateCliOptions) {
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

    // Register commands (auto-discover if no path specified)
    await registerCommands(program, context, options.commandsPath);

    program.parseAsync(process.argv).catch((error) => {
        logger.error(`Error executing command: ${error.message}`);
        process.exit(1);
    });
}