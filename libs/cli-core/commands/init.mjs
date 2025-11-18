import { Command } from 'commander';

export default function(program, context) {
  const { logger, prompts } = context;
  
  program
    .command('init')
    .description('Interactive project initialization wizard')
    .option('--quick', 'Skip interactive mode and use defaults', false)
    .action(async (options) => {
      logger.intro('⚡ Project Initialization Wizard');
      
      let config;
      
      if (options.quick) {
        config = {
          projectName: 'my-cli-project',
          framework: 'typescript',
          packageManager: 'pnpm',
          features: ['git', 'tests', 'linting']
        };
        logger.info('Using quick setup with defaults...');
      } else {
        try {
          // Interactive configuration
          const projectName = await prompts.text({
            message: 'What is your project name?',
            placeholder: 'my-awesome-cli',
            validate: (value) => {
              if (!value) return 'Project name is required';
              if (!/^[a-z0-9-_]+$/.test(value)) {
                return 'Project name must contain only lowercase letters, numbers, hyphens, and underscores';
              }
              return true;
            }
          });
          
          if (prompts.isCancel(projectName)) {
            prompts.cancel('Operation cancelled.');
            process.exit(0);
          }
          
          const framework = await prompts.select({
            message: 'Choose your framework:',
            options: [
              { value: 'typescript', label: 'TypeScript' },
              { value: 'javascript', label: 'JavaScript (ESM)' },
              { value: 'node', label: 'Node.js (CommonJS)' }
            ]
          });
          
          if (prompts.isCancel(framework)) {
            prompts.cancel('Operation cancelled.');
            process.exit(0);
          }
          
          const packageManager = await prompts.select({
            message: 'Choose package manager:',
            options: [
              { value: 'pnpm', label: 'pnpm (recommended)', hint: 'Fast, efficient' },
              { value: 'npm', label: 'npm', hint: 'Default Node.js package manager' },
              { value: 'yarn', label: 'yarn', hint: 'Alternative package manager' }
            ]
          });
          
          if (prompts.isCancel(packageManager)) {
            prompts.cancel('Operation cancelled.');
            process.exit(0);
          }
          
          const features = await prompts.multiselect({
            message: 'Select features to include:',
            options: [
              { value: 'git', label: 'Git repository', hint: 'Initialize git repo' },
              { value: 'tests', label: 'Testing setup', hint: 'Vitest configuration' },
              { value: 'linting', label: 'Linting', hint: 'ESLint + Prettier' },
              { value: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD workflows' },
              { value: 'docker', label: 'Docker', hint: 'Containerization' }
            ],
            initialValues: ['git', 'tests', 'linting']
          });
          
          if (prompts.isCancel(features)) {
            prompts.cancel('Operation cancelled.');
            process.exit(0);
          }
          
          config = {
            projectName,
            framework,
            packageManager,
            features
          };
          
        } catch (error) {
          logger.error(`Initialization failed: ${error.message}`);
          process.exit(1);
        }
      }
      
      // Display configuration summary
      logger.info('📋 Configuration Summary:');
      logger.info(`Project Name: ${config.projectName}`);
      logger.info(`Framework: ${config.framework}`);
      logger.info(`Package Manager: ${config.packageManager}`);
      logger.info(`Features: ${config.features.join(', ')}`);
      
      if (!options.quick) {
        const confirm = await prompts.confirm({
          message: 'Proceed with this configuration?'
        });
        
        if (prompts.isCancel(confirm) || !confirm) {
          prompts.cancel('Operation cancelled.');
          process.exit(0);
        }
      }
      
      // Simulate project creation
      const spinner = logger.spinner('Creating project...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.success('Project created successfully!');
      
      logger.success(`🎉 ${config.projectName} initialized successfully!`);
      logger.info('Next steps:');
      logger.info(`  cd ${config.projectName}`);
      logger.info(`  ${config.packageManager} install`);
      logger.info(`  ${config.packageManager} dev`);
      
      logger.outro('✨ Happy coding!');
    });
}