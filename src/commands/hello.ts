import type { Command } from 'commander';
import type { CommandContext } from '../types/cli';

export default function (program: Command, context: CommandContext) {
  const { logger, execa, fs } = context;
  const log = logger as any;
  const exec = execa as any;
  const fileSystem = fs as any;

  program
    .command('hello')
    .description('Say hello and show system information')
    .argument('[name]', 'Name of the person to greet')
    .option('-u, --uppercase', 'Convert the output to uppercase')
    .option('--verbose', 'Enable verbose logging')
    .option('-i, --info', 'Show system and project information')
    .action(async (name = 'World', options) => {
      // Enable verbose logging if requested
      if (options.verbose) {
        log.enableVerbose();
      }

      log.intro('Hello Command');
      log.info(`Greeting ${name}...`);

      let message = `Hello, ${name}!`;

      if (options.uppercase) {
        message = message.toUpperCase();
        log.debug('Message converted to uppercase');
      }

      log.success(message);

      // Show basic system and project info if requested
      if (options.info) {
        try {
          log.info('Gathering system information...');

          // Show Node.js version using execa
          const nodeResult = await exec('node', ['--version']);
          log.info(`Node.js version: ${nodeResult.stdout}`);

          // Show npm version
          const npmResult = await exec('npm', ['--version']);
          log.info(`npm version: ${npmResult.stdout}`);

          // Show current working directory using fs
          const cwd = process.cwd();
          log.info(`Current directory: ${cwd}`);

          // Check if package.json exists
          const packageJsonExists = await fileSystem.exists('package.json');
          log.info(`Has package.json: ${packageJsonExists ? '✅' : '❌'}`);

          if (packageJsonExists) {
            const packageJson = JSON.parse(await fileSystem.readFile('package.json', 'utf8'));
            log.info(`Project: ${packageJson.name || 'unnamed'}`);
            log.info(`Version: ${packageJson.version || 'unknown'}`);

            if (packageJson.dependencies) {
              const depCount = Object.keys(packageJson.dependencies).length;
              log.info(`Dependencies: ${depCount}`);
            }

            if (packageJson.scripts) {
              const scriptNames = Object.keys(packageJson.scripts);
              log.info(`Available scripts: ${scriptNames.join(', ')}`);
            }
          }

          // Show environment info
          log.info(`Platform: ${process.platform}`);
          log.info(`Architecture: ${process.arch}`);
        } catch (error) {
          log.error(
            `System info error: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      log.outro('Command completed!');
    });
}
