import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CommandContext } from '@lord-commander/cli-core';
import type { Command } from 'commander';

function getCLICoreVersion(): string {
  try {
    // Get the directory of this module
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // Go up to the monorepo root and then to the cli-core library
    const packagePath = join(__dirname, '..', '..', '..', 'libs', 'cli-core', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version;
  } catch (_error) {
    // Fallback to a default version if we can't read package.json
    return 'unknown';
  }
}

export default function (program: Command, context: CommandContext) {
  const { logger } = context;

  program
    .command('status')
    .description('Show CLI status and configuration')
    .action(async () => {
      logger.intro('📊 CLI Status');

      const version = getCLICoreVersion();
      logger.info(`CLI Name: lord-commander`);
      logger.info(`CLI SDK Version: ${version}`);
      logger.info(`Working Directory: ${process.cwd()}`);
      logger.info(`Node.js Version: ${process.version}`);
      logger.info(`Platform: ${process.platform}`);
      logger.outro('✨ Status check complete!');
    });
}
