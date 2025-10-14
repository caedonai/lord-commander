import { Command } from 'commander';
import type { Logger } from '../utils/logger';
import type { ConfigType } from '../utils/config';

interface CommandContext {
  logger: Logger;
  config: ConfigType;
}

export default function(program: Command, { logger }: CommandContext) {
  program
    .command('hello')
    .description('Say hello to someone')
    .argument('[name]', 'Name of the person to greet')
    .option('-u, --uppercase', 'Convert the output to uppercase')
    .action((name = 'World', options) => {
      let message = `Hello, ${name}!`;
      
      if (options.uppercase) {
        message = message.toUpperCase();
      }
      
      logger.success(message);
    });
}