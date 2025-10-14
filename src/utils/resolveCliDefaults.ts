import { CliConfig } from '../types/cli';
import getPackageJSON from './getPackageJSON';
import { logger } from './logger';


/**
 * Resolve CLI defaults by combining provided options, package.json and fallbacks.
 */
export default function resolveCliDefaults(options: CliConfig = {}) {
    let pkgJSON: CliConfig = {};
    try {
        pkgJSON = getPackageJSON(process.cwd());
    } catch (error) {
        if(error instanceof Error) {
            logger.error(`Failed to read package.json: ${error.message}`);
        }
    }

    return {
        name: options.name || pkgJSON.name || 'CLI Tool',
        version: options.version || pkgJSON.version || '0.1.0',
        description: options.description || pkgJSON.description || '',
    };
}