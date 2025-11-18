import { Command } from 'commander';

export default function(program, context) {
  const { logger, fs, execa } = context;
  
  program
    .command('scaffold')
    .description('Scaffold a new project using Lord Commander patterns')
    .argument('<project-name>', 'Name of the project to create')
    .option('-t, --template <name>', 'Project template', 'typescript')
    .option('-p, --package-manager <name>', 'Package manager to use', 'pnpm')
    .option('--git', 'Initialize git repository', false)
    .action(async (projectName, options) => {
      logger.intro(`🏗️ Scaffolding ${projectName}`);
      
      try {
        // Create project directory
        logger.info('Creating project directory...');
        await fs.ensureDir(projectName);
        
        // Create basic project structure
        const structure = [
          `${projectName}/src`,
          `${projectName}/tests`,
          `${projectName}/docs`
        ];
        
        for (const dir of structure) {
          await fs.ensureDir(dir);
          logger.debug(`Created directory: ${dir}`);
        }
        
        // Create package.json
        const packageJson = {
          name: projectName,
          version: '0.1.0',
          description: `${projectName} - Built with Lord Commander SDK`,
          type: 'module',
          main: 'dist/index.js',
          scripts: {
            build: 'tsc',
            dev: 'tsx src/index.ts',
            test: 'vitest'
          },
          dependencies: {
            'lord-commander-poc': '^1.0.0'
          }
        };
        
        await fs.writeFile(
          `${projectName}/package.json`,
          JSON.stringify(packageJson, null, 2)
        );
        
        // Create basic CLI entry point
        const cliTemplate = `import { createCLI } from 'lord-commander-poc/core';

async function main() {
  await createCLI({
    name: '${projectName}',
    version: '0.1.0',
    description: '${projectName} - Built with Lord Commander SDK',
    commandsPath: './commands'
  });
}

main();`;
        
        await fs.writeFile(`${projectName}/src/index.ts`, cliTemplate);
        
        // Initialize git if requested
        if (options.git) {
          logger.info('Initializing git repository...');
          await execa('git', ['init'], { cwd: projectName });
          await fs.writeFile(`${projectName}/.gitignore`, `node_modules/
dist/
*.log
.env
`);
        }
        
        logger.success(`Project ${projectName} scaffolded successfully!`);
        logger.info(`Next steps:`);
        logger.info(`  cd ${projectName}`);
        logger.info(`  ${options.packageManager} install`);
        logger.info(`  ${options.packageManager} dev`);
        
      } catch (error) {
        logger.error(`Failed to scaffold project: ${error.message}`);
        process.exit(1);
      }
      
      logger.outro('Scaffolding completed!');
    });
}