import { Command } from 'commander';
import type { CommandContext } from '../types/cli';

export default function(program: Command, context: CommandContext) {
  const { logger, prompts } = context;
  
  program
    .command('hello')
    .description('Say hello to someone')
    .argument('[name]', 'Name of the person to greet')
    .option('-u, --uppercase', 'Convert the output to uppercase')
    .option('--verbose', 'Enable verbose logging')
    .action((name = 'World', options) => {
      // Enable verbose logging if requested
      if (options.verbose) {
        logger.enableVerbose();
      }
      
      logger.info(`Greeting ${name}...`);
      
      let message = `Hello, ${name}!`;
      
      if (options.uppercase) {
        message = message.toUpperCase();
        logger.debug('Message converted to uppercase');
      }
      
      logger.success(message);
    });
}