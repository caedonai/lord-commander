import { Command } from 'commander';
import { CommandContext } from '../types/cli.js';
import { generateCompletion, installCompletion, uninstallCompletion, detectShell, checkCompletionStatus } from '../core/commands/autocomplete.js';

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
    .option('-s, --shell <shell>', 'Check status for specific shell (bash, zsh, fish, powershell)')
    .action(async (options) => {
      logger.intro('Checking completion status...');
      
      try {
        const detectedShell = await detectShell();
        const targetShell = options.shell || detectedShell;
        
        const status = await checkCompletionStatus(program, targetShell as any);
        
        // Display basic information
        logger.info(`CLI Name: ${status.cliName}`);
        logger.info(`Detected Shell: ${detectedShell}`);
        if (options.shell && options.shell !== detectedShell) {
          logger.info(`Checking Shell: ${status.shell} (specified)`);
        } else {
          logger.info(`Checking Shell: ${status.shell}`);
        }
        
        // Display installation status
        if (status.installed) {
          logger.success('✓ Completion is installed');
          logger.info(`  Installation Path: ${status.installationPath}`);
          logger.info(`  Installation Type: ${status.installationType}`);
          
          if (status.isActive === true) {
            logger.success('  Status: Active and working');
          } else if (status.isActive === false) {
            logger.warn('  Status: Installed but may not be active');
          } else {
            logger.note('  Status: Cannot determine if active (manual verification needed)');
          }
        } else {
          logger.warn('✗ Completion is not installed');
          logger.note('Run `completion install` to set up shell completion');
        }
        
        // Show error message if any
        if (status.errorMessage) {
          logger.warn(`Note: ${status.errorMessage}`);
        }
        
        // Provide helpful next steps
        if (!status.installed) {
          logger.outro('To install completion, run: completion install');
        } else if (status.isActive === false) {
          logger.outro('Completion installed but may need shell restart. Try: exec $SHELL');
        } else {
          logger.outro('Completion status check complete');
        }
      } catch (error) {
        logger.error(`Failed to check status: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}