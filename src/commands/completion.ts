import { Command } from 'commander';
import { CommandContext } from '../types/cli.js';
import { generateCompletion, installCompletion, uninstallCompletion, detectShell } from '../core/autocomplete.js';

export default function(program: Command, context: CommandContext) {
  const { logger } = context;

  const completionCmd = program
    .command('completion')
    .description('Manage shell completions for this CLI');

  // Install completion
  completionCmd
    .command('install')
    .description('Install shell completion for the current shell')
    .option('-s, --shell <shell>', 'Target shell (bash, zsh, fish, powershell)')
    .option('-g, --global', 'Install globally for all users')
    .option('--force', 'Force reinstall even if already installed')
    .action(async (options) => {
      logger.intro('Installing shell completion...');
      
      try {
        const shell = options.shell || await detectShell();
        const spinner = logger.spinner(`Installing completion for ${shell}...`);
        
        const result = await installCompletion(program, {
          shell,
          global: options.global,
          force: options.force
        });
        
        if (result.success) {
          spinner.success(`Completion installed successfully!`);
          
          if (result.restartRequired) {
            logger.note('Restart your shell or run the following to activate:');
            logger.info(`  ${result.activationCommand}`);
          }
          
          logger.outro('Shell completion is now active! 🎉');
        } else {
          spinner.fail(`Installation failed: ${result.error}`);
        }
      } catch (error) {
        logger.error(`Failed to install completion: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  // Uninstall completion
  completionCmd
    .command('uninstall')
    .description('Remove shell completion')
    .option('-s, --shell <shell>', 'Target shell (bash, zsh, fish, powershell)')
    .option('-g, --global', 'Remove from global installation')
    .action(async (options) => {
      logger.intro('Removing shell completion...');
      
      try {
        const shell = options.shell || await detectShell();
        const spinner = logger.spinner(`Removing completion for ${shell}...`);
        
        const result = await uninstallCompletion(program, {
          shell,
          global: options.global
        });
        
        if (result.success) {
          spinner.success('Completion removed successfully!');
          logger.outro('Shell completion has been disabled.');
        } else {
          spinner.fail(`Removal failed: ${result.error}`);
        }
      } catch (error) {
        logger.error(`Failed to remove completion: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  // Generate completion script
  completionCmd
    .command('generate')
    .description('Generate completion script for manual installation')
    .option('-s, --shell <shell>', 'Target shell (bash, zsh, fish, powershell)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
      try {
        const shell = options.shell || await detectShell();
        const script = await generateCompletion(program, shell);
        
        if (options.output) {
          const fs = await import('node:fs/promises');
          await fs.writeFile(options.output, script, 'utf-8');
          logger.success(`Completion script written to ${options.output}`);
        } else {
          console.log(script);
        }
      } catch (error) {
        logger.error(`Failed to generate completion: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  // Show status
  completionCmd
    .command('status')
    .description('Show completion installation status')
    .action(async () => {
      logger.intro('Checking completion status...');
      
      try {
        const shell = await detectShell();
        logger.info(`Current shell: ${shell}`);
        
        // Check if completion is installed
        // This would require implementing a status check in autocomplete.ts
        logger.note('Status check functionality coming soon...');
      } catch (error) {
        logger.error(`Failed to check status: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}