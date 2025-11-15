import type { CommandContext } from '@lord-commander/cli-core';
import type { Command } from 'commander';

export default function (program: Command, context: CommandContext) {
  const { logger } = context;

  program
    .command('status')
    .description('Show CLI status and configuration')
    .action(async () => {
      logger.intro('📊 CLI Status');

      logger.info(`CLI Name: lord-commander`);
      logger.info(`Version: 1.0.0`);
      logger.info(`Working Directory: ${process.cwd()}`);
      logger.info(`Node.js Version: ${process.version}`);
      logger.info(`Platform: ${process.platform}`);
      logger.outro('✨ Status check complete!');
    });
}
