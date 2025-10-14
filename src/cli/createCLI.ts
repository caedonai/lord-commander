import { Command } from "commander";
import { registerCommands } from './registerCommands';
import { loadConfig } from '../utils/config';
import { logger } from '../utils/logger';
import { CreateCliOptions } from "../types/cli";
import resolveCliDefaults from "../utils/resolveCliDefaults";



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
 * @param {string} [options.commandsPath] - Relative path to commands. Defaults to './commands'.
 * @returns {void}
 */
export function createCLI(options: CreateCliOptions) {
    const {name, version, description} = resolveCliDefaults(options);
    const program = new Command();

    program.name(name);
    program.version(version);
    program.description(description);

    const config = loadConfig(name);
    

    registerCommands(program, { logger, config });

    program.parseAsync(process.argv).catch((error) => {
        logger.error(`Error executing command: ${error.message}`);
        process.exit(1);
    });
}