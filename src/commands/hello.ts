import type { Command } from 'commander';
import type { CommandContext } from '../types/cli';

export default function (program: Command, context: CommandContext) {
  const { logger, execa, fs } = context;

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

      // Show basic system and project info if requested
      if (options.info && execa && fs) {
        try {
          logger.info('Gathering system information...');

          // Show Node.js version using execa
          const nodeResult = await execa.execa('node', ['--version']);
          logger.info(`Node.js version: ${nodeResult.stdout}`);

          // Show npm version
          const npmResult = await execa.execa('npm', ['--version']);
          logger.info(`npm version: ${npmResult.stdout}`);

          // Show current working directory
          const cwd = process.cwd();
          logger.info(`Current directory: ${cwd}`);

          // Check if package.json exists
          const packageJsonExists = fs.exists('package.json');
          logger.info(`Has package.json: ${packageJsonExists ? '✅' : '❌'}`);

          if (packageJsonExists) {
            const packageJson = JSON.parse(await fs.readFile('package.json'));
            logger.info(`Project: ${packageJson.name || 'unnamed'}`);
            logger.info(`Version: ${packageJson.version || 'unknown'}`);

            if (packageJson.dependencies) {
              const depCount = Object.keys(packageJson.dependencies).length;
              logger.info(`Dependencies: ${depCount}`);
            }

            if (packageJson.scripts) {
              const scriptNames = Object.keys(packageJson.scripts);
              logger.info(`Available scripts: ${scriptNames.join(', ')}`);
            }
          }

          // Show environment info
          logger.info(`Platform: ${process.platform}`);
          logger.info(`Architecture: ${process.arch}`);
        } catch (error) {
          logger.error(
            `System info error: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      logger.outro('Command completed!');
    });
}
