import { Command } from 'commander';

export default function(program, context) {
  const { logger } = context;
  
  program
    .command('demo')
    .description('Demonstration command showing SDK capabilities')
    .option('-f, --framework <name>', 'Target framework', 'typescript')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (options) => {
      if (options.verbose) {
        logger.enableVerbose();
      }
      
      logger.intro('🚀 Lord Commander SDK Demo');
      logger.info(`Framework: ${options.framework}`);
      logger.success('SDK is working perfectly!');
      logger.outro('Demo completed');
    });
}