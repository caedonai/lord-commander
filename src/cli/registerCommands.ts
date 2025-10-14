import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger';
import { ConfigType } from '../utils/config';

interface CommandContext {
  logger: Logger;
  config: ConfigType;
}

// interface CommandModule {
//   default: (program: Command, context: CommandContext) => void;
// }

/**
 * Recursively discover and register commands from a directory
 */
export async function registerCommands(program: Command, context: CommandContext) {
  const commandsDir = './commands';
  const absolutePath = path.resolve(process.cwd(), commandsDir);

  if (!fs.existsSync(absolutePath)) {
    context.logger.warn(`Commands directory not found: ${commandsDir}`);
    return;
  }

  try {
    // Get all files in the commands directory
    const entries = fs.readdirSync(absolutePath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(absolutePath, entry.name);

      if (entry.isDirectory()) {
        // Recursively process subdirectories
        await registerCommands(program, context);
        continue;
      }

      // Only process TypeScript/JavaScript files
      if (!entry.name.match(/\.(ts|js)$/)) continue;

      // Skip test, type definition, and non-command files
      if (entry.name.match(/\.(test|spec|d)\.(ts|js)$/)) continue;
      if (entry.name === 'index.ts' || entry.name === 'index.js') continue;

      try {
        const commandModule = await import(fullPath);
        
        if (typeof commandModule.default === 'function') {
          commandModule.default(program, context);
        } else {
          context.logger.warn(`Command module ${entry.name} does not export a default function`);
        }
      } catch (error) {
        context.logger.error(`Failed to load command from ${entry.name}: ${error}`);
      }
    }
  } catch (error) {
    context.logger.error(`Failed to read commands directory: ${error}`);
  }
}
