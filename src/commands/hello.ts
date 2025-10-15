import { Command } from 'commander';
import type { CommandContext } from '../types/cli';

export default function(program: Command, context: CommandContext) {
  const { logger, git } = context;
  
  program
    .command('hello')
    .description('Say hello and show git repository info')
    .argument('[name]', 'Name of the person to greet')
    .option('-u, --uppercase', 'Convert the output to uppercase')
    .option('--verbose', 'Enable verbose logging')
    .option('-g, --git', 'Show git repository information')
    .action(async (name = 'World', options) => {
      // Enable verbose logging if requested
      if (options.verbose) {
        logger.enableVerbose();
      }
      
      logger.intro('Hello Command');
      logger.info(`Greeting ${name}...`);
      
      let message = `Hello, ${name}!`;
      
      if (options.uppercase) {
        message = message.toUpperCase();
        logger.debug('Message converted to uppercase');
      }
      
      logger.success(message);
      
      // Test git functionality if requested
      if (options.git) {
        try {
          logger.info('Checking git status...');
          
          const isGitAvailable = await git.isGitAvailable();
          logger.info(`Git available: ${isGitAvailable ? '✅' : '❌'}`);
          
          if (isGitAvailable) {
            const isRepo = await git.isGitRepository();
            logger.info(`Is git repository: ${isRepo ? '✅' : '❌'}`);
            
            if (isRepo) {
              const status = await git.getStatus();
              logger.info(`Current branch: ${status.branch}`);
              logger.info(`Repository is clean: ${status.clean ? '✅' : '❌'}`);
              
              if (!status.clean) {
                if (status.staged.length > 0) {
                  logger.info(`Staged files: ${status.staged.join(', ')}`);
                }
                if (status.unstaged.length > 0) {
                  logger.info(`Unstaged files: ${status.unstaged.join(', ')}`);
                }
                if (status.untracked.length > 0) {
                  logger.info(`Untracked files: ${status.untracked.join(', ')}`);
                }
              }
              
              // Show recent commits
              const commits = await git.getCommits(3);
              logger.info(`Recent commits:`);
              commits.forEach((commit: any) => {
                logger.info(`  ${commit.shortHash} - ${commit.message} (${commit.author})`);
              });
            }
          }
        } catch (error) {
          logger.error(`Git error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      logger.outro('Command completed!');
    });
}