import type { Command } from 'commander';
import {
  checkCompletionStatus,
  detectShell,
  generateCompletion,
  installCompletion,
  uninstallCompletion,
} from '../core/commands/autocomplete.js';
import type { CommandContext } from '../types/cli.js';

/**
 * Shell completion management command
 *
 * Provides comprehensive shell completion functionality for professional CLI tools.
 * Supports bash, zsh, fish, and PowerShell with automatic installation and management.
 *
 * @example
 * ```bash
 * # Install completion for current shell
 * my-cli completion install
 *
 * # Install completion for specific shell
 * my-cli completion install --shell zsh
 *
 * # Install globally for all users (requires admin privileges)
 * my-cli completion install --global
 *
 * # Force reinstall even if already installed
 * my-cli completion install --force
 * ```
 *
 * @example
 * ```bash
 * # Generate completion script for manual installation
 * my-cli completion generate --shell bash --output ~/.bashrc
 *
 * # Generate for zsh and append to config
 * my-cli completion generate --shell zsh >> ~/.zshrc
 *
 * # Generate PowerShell completion
 * my-cli completion generate --shell powershell --output $PROFILE
 * ```
 *
 * @example
 * ```bash
 * # Check completion installation status
 * my-cli completion status
 *
 * # Check status for specific shell
 * my-cli completion status --shell bash
 *
 * # Get detailed installation information
 * my-cli completion status --verbose
 * ```
 *
 * @example
 * ```bash
 * # Uninstall completion from current shell
 * my-cli completion uninstall
 *
 * # Uninstall from specific shell
 * my-cli completion uninstall --shell zsh
 *
 * # Uninstall globally (requires admin privileges)
 * my-cli completion uninstall --global
 * ```
 *
 * @example
 * ```typescript
 * // Programmatic usage in CLI creation
 * import { createCLI } from '@caedonai/lord-commander';
 *
 * await createCLI({
 *   name: 'my-cli',
 *   version: '1.0.0',
 *   description: 'My CLI with autocomplete',
 *   autocomplete: {
 *     enabled: true,
 *     autoInstall: true,          // Auto-install on first run
 *     shells: ['bash', 'zsh'],    // Target specific shells
 *     enableFileCompletion: true  // Enable file/directory completion
 *   },
 *   builtinCommands: {
 *     completion: true            // Enable completion command
 *   }
 * });
 * ```
 *
 * @param program - Commander.js program instance
 * @param context - CLI context with logger and other utilities
 */

export default function (program: Command, context: CommandContext) {
  const { logger } = context;

  // Create a logger wrapper that matches the expected interface
  const log = {
    info: (msg: string) => logger.info(msg),
    success: (msg: string) => logger.success(msg),
    warn: (msg: string) => logger.warn(msg),
    error: (msg: string) => logger.error(msg),
    note: (msg: string, title?: string) => logger.note(msg, title),
    intro: (msg: string) => logger.intro(msg),
    outro: (msg: string) => logger.outro(msg),
    spinner: (msg: string) => {
      const spinner = logger.spinner(msg);
      return {
        success: (msg: string) => {
          spinner.stop(msg, 0);
          logger.success(msg);
        },
        fail: (msg: string) => {
          spinner.stop(msg, 1);
          logger.error(msg);
        },
      };
    },
  };

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
      log.intro('Installing shell completion...');

      try {
        const shell = options.shell || (await detectShell());
        const spinner = log.spinner(`Installing completion for ${shell}...`);

        const result = await installCompletion(program, {
          shell,
          global: options.global,
          force: options.force,
        });

        if (result.success) {
          spinner.success(`Completion installed successfully!`);

          if (result.restartRequired) {
            log.note('Restart your shell or run the following to activate:');
            log.info(`  ${result.activationCommand}`);
          }

          log.outro('Shell completion is now active! 🎉');
        } else {
          spinner.fail(`Installation failed: ${result.error}`);
        }
      } catch (error) {
        log.error(
          `Failed to install completion: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

  // Uninstall completion
  completionCmd
    .command('uninstall')
    .description('Remove shell completion')
    .option('-s, --shell <shell>', 'Target shell (bash, zsh, fish, powershell)')
    .option('-g, --global', 'Remove from global installation')
    .action(async (options) => {
      log.intro('Removing shell completion...');

      try {
        const shell = options.shell || (await detectShell());
        const spinner = log.spinner(`Removing completion for ${shell}...`);

        const result = await uninstallCompletion(program, {
          shell,
          global: options.global,
        });

        if (result.success) {
          spinner.success('Completion removed successfully!');
          log.outro('Shell completion has been disabled.');
        } else {
          spinner.fail(`Removal failed: ${result.error}`);
        }
      } catch (error) {
        log.error(
          `Failed to remove completion: ${error instanceof Error ? error.message : String(error)}`
        );
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
        const shell = options.shell || (await detectShell());
        const script = await generateCompletion(program, shell);

        if (options.output) {
          const fs = await import('node:fs/promises');
          await fs.writeFile(options.output, script, 'utf-8');
          log.success(`Completion script written to ${options.output}`);
        } else {
          console.log(script);
        }
      } catch (error) {
        log.error(
          `Failed to generate completion: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

  // Show status
  completionCmd
    .command('status')
    .description('Show completion installation status')
    .option('-s, --shell <shell>', 'Check status for specific shell (bash, zsh, fish, powershell)')
    .action(async (options) => {
      log.intro('Checking completion status...');

      try {
        const detectedShell = await detectShell();
        const targetShell = options.shell || detectedShell;

        const status = await checkCompletionStatus(program, targetShell as string);

        // Display basic information
        log.info(`CLI Name: ${status.cliName}`);
        log.info(`Detected Shell: ${detectedShell}`);
        if (options.shell && options.shell !== detectedShell) {
          log.info(`Checking Shell: ${status.shell} (specified)`);
        } else {
          log.info(`Checking Shell: ${status.shell}`);
        }

        // Display installation status
        if (status.installed) {
          log.success('✓ Completion is installed');
          log.info(`  Installation Path: ${status.installationPath}`);
          log.info(`  Installation Type: ${status.installationType}`);

          if (status.isActive === true) {
            log.success('  Status: Active and working');
          } else if (status.isActive === false) {
            log.warn('  Status: Installed but may not be active');
          } else {
            log.note('  Status: Cannot determine if active (manual verification needed)');
          }
        } else {
          log.warn('✗ Completion is not installed');
          log.note('Run `completion install` to set up shell completion');
        }

        // Show error message if any
        if (status.errorMessage) {
          log.warn(`Note: ${status.errorMessage}`);
        }

        // Provide helpful next steps
        if (!status.installed) {
          log.outro('To install completion, run: completion install');
        } else if (status.isActive === false) {
          log.outro('Completion installed but may need shell restart. Try: exec $SHELL');
        } else {
          log.outro('Completion status check complete');
        }
      } catch (error) {
        log.error(
          `Failed to check status: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
}
