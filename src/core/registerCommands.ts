import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import type { CommandContext } from '../types/cli';

/**
 * Automatically discover commands directory in common locations
 */
function discoverCommandsDirectory(): string | null {
  const cwd = process.cwd();
  
  // Common command directory patterns to search for
  const searchPaths = [
    './commands',           // Root level commands folder
    './src/commands',       // Inside src folder
    './lib/commands',       // Inside lib folder  
    './cli/commands',       // Inside cli folder
    './app/commands',       // Inside app folder
    './bin/commands',       // Inside bin folder
  ];
  
  for (const searchPath of searchPaths) {
    const absolutePath = path.resolve(cwd, searchPath);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
      // Check if directory has any command files
      const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
      const hasCommandFiles = entries.some(entry => 
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
export async function registerCommands(program: Command, context: CommandContext, commandsPath?: string) {
  let absolutePath: string;
  
  if (commandsPath) {
    // Use provided path
    absolutePath = path.resolve(process.cwd(), commandsPath);
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
    context.logger.debug(`Auto-discovered commands directory: ${path.relative(process.cwd(), absolutePath)}`);
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
        // Use file:// URL for absolute path
        const fileUrl = `file:///${fullPath.replace(/\\/g, '/')}`;
        const commandModule = await import(fileUrl);
        
        if (typeof commandModule.default === 'function') {
          commandModule.default(program, context);
        } else {
          context.logger.warn(`Command module ${entry.name} does not export a default function`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        context.logger.error(`Failed to load command from ${entry.name}: ${message}`);
      }
    }
  } catch (error) {
    context.logger.error(`Failed to read commands directory: ${error}`);
  }
}
