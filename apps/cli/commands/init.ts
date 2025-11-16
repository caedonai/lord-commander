import { join } from 'node:path';
import { cwd } from 'node:process';
import type { CommandContext } from '@lord-commander/cli-core';
import type { Command } from 'commander';

interface InitConfig {
  projectName: string;
  setupType: 'library' | 'cli-only' | 'cli-api' | 'full-stack';
  includeApi: boolean;
  includeDashboard: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  installLocation: 'global' | 'local';
}

export default function (program: Command, context: CommandContext) {
  const { logger, prompts, execa, fs } = context;

  program
    .command('init')
    .description(
      'Initialize Lord Commander setup (CLI-only, CLI+API, or Full-stack with Dashboard)'
    )
    .option('--quick', 'Skip interactive mode and install CLI-only setup', false)
    .option('--global', 'Install globally instead of in current directory', false)
    .option('--type <setup>', 'Setup type: cli-only, cli-api, or full-stack', 'cli-only')
    .option('--pm <manager>', 'Package manager to use (npm, pnpm, yarn)', 'npm')
    .action(async (options) => {
      logger.intro('🚀 Lord Commander CLI Initialization');

      let config: InitConfig;

      // Auto-detect if we're being run during npm install
      const isBeingInstalled = await detectInstallationContext();
      if (isBeingInstalled) {
        logger.info('🔄 Detected CLI installation via package manager');
      }

      if (options.quick) {
        // Determine components based on setup type
        let includeApi = false;
        let includeDashboard = false;

        switch (options.type) {
          case 'cli-api':
            includeApi = true;
            break;
          case 'full-stack':
            includeApi = true;
            includeDashboard = true;
            break;
          default:
            // cli-only or any other case - no additional components
            break;
        }

        config = {
          projectName: 'my-cli-project',
          setupType: options.type,
          includeApi,
          includeDashboard,
          packageManager: options.pm,
          installLocation: options.global ? 'global' : 'local',
        };
        logger.info(`Using quick setup: ${options.type} configuration...`);
      } else {
        config = await runInteractiveSetup(prompts, logger, options);
      }

      // Display configuration summary
      await displayConfigSummary(config, logger);

      if (!options.quick) {
        const confirm = await prompts.confirm('Proceed with this configuration?');

        if (prompts.clack.isCancel(confirm) || !confirm) {
          logger.outro('Operation cancelled.');
          process.exit(0);
        }
      }

      // Execute installation
      await executeInstallation(config, logger, execa, fs);

      logger.outro('✨ Lord Commander CLI setup complete!');
    });

  /**
   * Detect if we're being run during npm install (postinstall script)
   */
  async function detectInstallationContext(): Promise<boolean> {
    try {
      // Check if npm_lifecycle_event is set to 'postinstall'
      return process.env.npm_lifecycle_event === 'postinstall';
    } catch {
      return false;
    }
  }

  /**
   * Run interactive setup prompts
   */
  async function runInteractiveSetup(
    prompts: CommandContext['prompts'],
    logger: CommandContext['logger'],
    _options: unknown
  ): Promise<InitConfig> {
    try {
      // Project name
      const projectName = await prompts.text('What is your project name?', {
        placeholder: 'my-awesome-cli',
        validate: (value: string) => {
          if (!value) return 'Project name is required';
          if (!/^[a-z0-9-_@/]+$/.test(value)) {
            return 'Project name must contain only lowercase letters, numbers, hyphens, underscores, @, and /';
          }
          return undefined;
        },
      });

      if (prompts.clack.isCancel(projectName)) {
        logger.outro('Operation cancelled.');
        process.exit(0);
      }

      // Installation location
      const installLocation = await prompts.select('Where would you like to install?', [
        { value: 'local', label: 'Local project' },
        { value: 'global', label: 'Global installation' },
      ]);

      if (prompts.clack.isCancel(installLocation)) {
        logger.outro('Operation cancelled.');
        process.exit(0);
      }

      // Package manager selection
      const detectedPM = await detectPackageManager(execa);
      const packageManager = await prompts.select('Choose package manager:', [
        {
          value: 'pnpm',
          label:
            detectedPM === 'pnpm' ? 'pnpm (detected - fast, efficient)' : 'pnpm (fast, efficient)',
        },
        {
          value: 'npm',
          label: detectedPM === 'npm' ? 'npm (detected - default)' : 'npm (default Node.js PM)',
        },
        {
          value: 'yarn',
          label: detectedPM === 'yarn' ? 'yarn (detected)' : 'yarn (alternative PM)',
        },
      ]);

      if (prompts.clack.isCancel(packageManager)) {
        logger.outro('Operation cancelled.');
        process.exit(0);
      }

      // Component selection with smart dependency handling
      const setupType = await prompts.select('Choose your setup type:', [
        {
          value: 'library',
          label: 'Library Mode (Import SDK in existing project)',
        },
        {
          value: 'cli-only',
          label: 'CLI Project (Command-line tool scaffold)',
        },
        {
          value: 'cli-api',
          label: 'CLI + API (Backend with CLI)',
        },
        {
          value: 'full-stack',
          label: 'Full Stack (CLI + API + Dashboard UI)',
        },
      ]);

      if (prompts.clack.isCancel(setupType)) {
        logger.outro('Operation cancelled.');
        process.exit(0);
      }

      // Determine components based on setup type
      let includeApi = false;
      let includeDashboard = false;

      switch (setupType) {
        case 'library':
          // Library mode - just install the SDK package
          break;
        case 'cli-api':
          includeApi = true;
          break;
        case 'full-stack':
          includeApi = true;
          includeDashboard = true;
          break;
        default:
          // cli-only or any other case - no additional components
          break;
      }

      // Allow advanced users to customize (optional)
      const customizeComponents = await prompts.confirm(
        'Would you like to customize component selection?'
      );

      if (prompts.clack.isCancel(customizeComponents)) {
        logger.outro('Operation cancelled.');
        process.exit(0);
      }

      if (customizeComponents) {
        const components = await prompts.multiselect('Select components to install:', [
          {
            value: 'api',
            label: 'API Server (@caedonai/lord-commander-api)',
          },
          {
            value: 'dashboard',
            label: 'Dashboard UI (@caedonai/lord-commander-dashboard)',
          },
        ]);

        if (prompts.clack.isCancel(components)) {
          logger.outro('Operation cancelled.');
          process.exit(0);
        }

        const selectedComponents = components as string[];
        includeApi = selectedComponents.includes('api');
        includeDashboard = selectedComponents.includes('dashboard');

        // Smart dependency handling
        if (includeDashboard && !includeApi) {
          logger.warn('⚠️  Dashboard UI requires API Server to function properly.');
          const addApi = await prompts.confirm('Would you like to include the API Server as well?');

          if (prompts.clack.isCancel(addApi)) {
            logger.outro('Operation cancelled.');
            process.exit(0);
          }

          if (addApi) {
            includeApi = true;
            logger.info('✅ API Server added to ensure Dashboard UI works correctly.');
          } else {
            logger.warn(
              '⚠️  Dashboard UI will be installed but may not function without API Server.'
            );
          }
        }
      }

      return {
        projectName: projectName as string,
        setupType: setupType as 'library' | 'cli-only' | 'cli-api' | 'full-stack',
        includeApi,
        includeDashboard,
        packageManager: packageManager as 'npm' | 'pnpm' | 'yarn',
        installLocation: installLocation as 'global' | 'local',
      };
    } catch (error) {
      logger.error(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  /**
   * Detect the package manager being used
   */
  async function detectPackageManager(_execa: CommandContext['execa']): Promise<string> {
    try {
      // Check for lock files in current directory
      const currentDir = cwd();
      if (fs?.exists?.(join(currentDir, 'pnpm-lock.yaml'))) return 'pnpm';
      if (fs?.exists?.(join(currentDir, 'yarn.lock'))) return 'yarn';
      if (fs?.exists?.(join(currentDir, 'package-lock.json'))) return 'npm';

      // Check npm_config_user_agent
      if (process.env.npm_config_user_agent) {
        if (process.env.npm_config_user_agent.includes('pnpm')) return 'pnpm';
        if (process.env.npm_config_user_agent.includes('yarn')) return 'yarn';
        if (process.env.npm_config_user_agent.includes('npm')) return 'npm';
      }

      // Default to npm
      return 'npm';
    } catch {
      return 'npm';
    }
  }

  /**
   * Display configuration summary
   */
  async function displayConfigSummary(config: InitConfig, logger: CommandContext['logger']) {
    logger.info('📋 Configuration Summary:');
    logger.info(`Project Name: ${config.projectName}`);
    logger.info(`Installation: ${config.installLocation}`);
    logger.info(`Package Manager: ${config.packageManager}`);

    // Determine setup type for display
    let setupType = 'CLI Only';
    switch (config.setupType) {
      case 'library':
        setupType = 'Library Mode (SDK Import)';
        break;
      case 'cli-only':
        setupType = 'CLI Project';
        break;
      case 'cli-api':
        setupType = 'CLI + API Server';
        break;
      case 'full-stack':
        setupType = 'Full Stack (CLI + API + Dashboard)';
        break;
    }

    logger.info(`Setup Type: ${setupType}`);
    logger.info('');
    logger.info('📦 Components:');
    logger.info(`  • CLI Core: @lord-commander/cli-core ✓`);
    logger.info(`  • API Server: ${config.includeApi ? '@caedonai/lord-commander-api ✓' : '❌'}`);
    logger.info(
      `  • Dashboard UI: ${config.includeDashboard ? '@caedonai/lord-commander-dashboard ✓' : '❌'}`
    );
  }

  /**
   * Execute the installation process
   */
  async function executeInstallation(
    config: InitConfig,
    logger: CommandContext['logger'],
    execa: CommandContext['execa'],
    fs: CommandContext['fs']
  ) {
    try {
      // Handle library mode vs project scaffolding
      if (config.setupType === 'library') {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
          // Production: Install actual published packages
          const packages = ['@lord-commander/cli-core'];

          if (config.includeApi) {
            packages.push('@caedonai/lord-commander-api');
          }
          if (config.includeDashboard) {
            packages.push('@caedonai/lord-commander-dashboard');
          }

          const spinner = logger.spinner('Installing packages...');
          // [Installation code would go here for library mode]
          spinner.stop(`Installed ${packages.join(', ')}`, 0);
        } else {
          // Development: Show what would be installed in library mode
          logger.info('🚧 Development Mode: Packages not yet published');
          logger.info('In production, these packages would be installed globally:');
          logger.info('  • @lord-commander/cli-core');

          if (config.includeApi) {
            logger.info('  • @caedonai/lord-commander-api');
          }
          if (config.includeDashboard) {
            logger.info('  • @caedonai/lord-commander-dashboard');
          }

          const spinner = logger.spinner('Setting up library mode...');
          spinner.stop('Library mode setup complete! (Development mode)', 0);
        }

        showLibraryModeNextSteps(config, logger);
        return;
      }

      // For project scaffolding: Handle package installation vs scaffolding
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction) {
        // Production: Install actual published packages
        const packages = ['@lord-commander/cli-core'];

        if (config.includeApi) {
          packages.push('@caedonai/lord-commander-api');
        }
        if (config.includeDashboard) {
          packages.push('@caedonai/lord-commander-dashboard');
        }

        // [Installation code would go here]
      } else {
        // Development: Show what would be installed and offer to scaffold templates
        logger.info('🚧 Development Mode: Packages not yet published');
        logger.info('In production, these packages would be installed:');
        logger.info('  • @lord-commander/cli-core');

        if (config.includeApi) {
          logger.info('  • @caedonai/lord-commander-api');
        }
        if (config.includeDashboard) {
          logger.info('  • @caedonai/lord-commander-dashboard');
        }

        const shouldScaffold = await prompts.confirm(
          'Would you like to scaffold template projects instead?'
        );

        if (prompts.clack.isCancel(shouldScaffold)) {
          logger.outro('Operation cancelled.');
          process.exit(0);
        }

        if (shouldScaffold) {
          await scaffoldTemplates(config, logger, fs);
        }

        const setupSpinner = logger.spinner('Finalizing setup...');
        setupSpinner.stop('Setup complete! (Development mode)', 0);
        showNextSteps(config, logger);
        return;
      }

      // Production package installation logic
      const packages = ['@lord-commander/cli-core'];

      // Add optional components
      if (config.includeApi) {
        packages.push('@caedonai/lord-commander-api');
      }
      if (config.includeDashboard) {
        packages.push('@caedonai/lord-commander-dashboard');
      }

      // Prepare install command
      const installFlags = config.installLocation === 'global' ? ['-g'] : [];
      let installCmd: string[] = [];

      switch (config.packageManager) {
        case 'pnpm':
          installCmd = ['pnpm', 'add', ...installFlags, ...packages];
          break;
        case 'yarn':
          if (config.installLocation === 'global') {
            installCmd = ['yarn', 'global', 'add', ...packages];
          } else {
            installCmd = ['yarn', 'add', ...packages];
          }
          break;
        default:
          installCmd = ['npm', 'install', ...installFlags, ...packages];
          break;
      }

      logger.info(`Running: ${installCmd.join(' ')}`);

      // Execute installation
      const installSpinner = logger.spinner('Installing packages...');
      if (execa) {
        const [command, ...args] = installCmd;
        await execa.execa(command, args, {
          stdio: 'inherit',
          cwd: config.installLocation === 'local' ? cwd() : undefined,
        });
      }

      installSpinner.stop('Packages installed successfully!', 0);

      // Create basic project structure if local installation
      if (config.installLocation === 'local') {
        await createProjectStructure(config, logger, fs);
      }

      // Show next steps
      showNextSteps(config, logger);
    } catch (error) {
      logger.error(
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Scaffold template projects from the monorepo (development mode)
   */
  async function scaffoldTemplates(
    config: InitConfig,
    logger: CommandContext['logger'],
    fs: CommandContext['fs']
  ) {
    if (!fs?.writeFile || !fs?.ensureDir || !fs?.copy) {
      logger.warn('File system utilities not available, skipping template scaffolding');
      return;
    }

    const spinner = logger.spinner('Scaffolding project templates...');

    try {
      const projectDir = join(cwd(), config.projectName);
      await fs.ensureDir(projectDir);

      // Always create CLI structure (but clean it up for standalone use)
      await createStandaloneCLI(projectDir, config, fs);

      // Conditionally copy API
      if (config.includeApi) {
        await createStandaloneAPI(projectDir, config, fs);
      }

      // Conditionally copy Dashboard
      if (config.includeDashboard) {
        await createStandaloneDashboard(projectDir, config, fs);
      }

      // Create workspace configuration
      const workspacePackageJson = {
        name: config.projectName,
        version: '1.0.0',
        private: true,
        workspaces: [
          'cli',
          ...(config.includeApi ? ['api'] : []),
          ...(config.includeDashboard ? ['dashboard-ui'] : []),
        ],
        scripts: {
          'dev:cli': 'cd cli && npm run dev',
          'build:cli': 'cd cli && npm run build',
          'test:cli': 'cd cli && npm test',
          ...(config.includeApi && {
            'dev:api': 'cd api && npm run dev',
            'build:api': 'cd api && npm run build',
            'test:api': 'cd api && npm test',
          }),
          ...(config.includeDashboard && {
            'dev:dashboard': 'cd dashboard-ui && npm run dev',
            'build:dashboard': 'cd dashboard-ui && npm run build',
            'test:dashboard': 'cd dashboard-ui && npm test',
          }),
          'install:all': 'npm install && npm run install:workspaces',
          'install:workspaces': 'npm install --workspaces',
          'build:all': 'npm run build --workspaces',
          'test:all': 'npm run test --workspaces',
        },
      };

      await fs.writeFile(
        join(projectDir, 'package.json'),
        JSON.stringify(workspacePackageJson, null, 2)
      );

      // Create README for the scaffolded project
      await createProjectReadme(projectDir, config, fs);

      spinner.stop('Templates scaffolded successfully!', 0);
      logger.success(`📁 Project created at: ${projectDir}`);
    } catch (error) {
      spinner.stop('Failed to scaffold templates', 1);
      logger.warn(`Scaffolding error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create standalone CLI project (without NX dependencies)
   */
  async function createStandaloneCLI(
    projectDir: string,
    config: InitConfig,
    fs: CommandContext['fs']
  ) {
    if (!fs) throw new Error('File system operations not available');

    const cliDir = join(projectDir, 'cli');
    await fs.ensureDir(cliDir);

    // Copy source files (excluding NX configs)
    const sourceFiles = ['src/', 'commands/'];
    for (const file of sourceFiles) {
      const sourcePath = `/Users/fabiomarcellus/Documents/GitHub/lord-commander-poc/apps/cli/${file}`;
      const targetPath = join(cliDir, file);
      await fs.copy(sourcePath, targetPath);
    }

    // Create standalone package.json (without monorepo links)
    const standalonePackageJson = {
      name: `${config.projectName}-cli`,
      version: '1.0.0',
      type: 'module',
      description: `CLI for ${config.projectName}`,
      main: './dist/main.js',
      bin: {
        [`${config.projectName}`]: './dist/main.js',
      },
      scripts: {
        build: 'tsc',
        dev: 'tsx src/main.ts',
        start: 'node dist/main.js',
        test: 'vitest',
        lint: 'eslint src commands --ext .ts,.js,.mjs',
      },
      dependencies: {
        '@lord-commander/cli-core': '^1.0.0', // Published version
        commander: '^12.0.0',
        tsx: '^4.0.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        typescript: '^5.0.0',
        vitest: '^1.0.0',
        eslint: '^8.0.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
      },
      files: ['dist'],
      keywords: ['cli', config.projectName],
      author: '',
      license: 'ISC',
    };

    await fs.writeFile(
      join(cliDir, 'package.json'),
      JSON.stringify(standalonePackageJson, null, 2)
    );

    // Create tsconfig.json for standalone build
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: './dist',
        declaration: true,
        sourceMap: true,
      },
      include: ['src/**/*', 'commands/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts'],
    };

    await fs.writeFile(join(cliDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
  }

  /**
   * Create standalone API project
   */
  async function createStandaloneAPI(
    projectDir: string,
    config: InitConfig,
    fs: CommandContext['fs']
  ) {
    if (!fs) throw new Error('File system operations not available');

    const apiDir = join(projectDir, 'api');

    // Copy API source (excluding NX configs)
    const sourceFiles = ['src/', 'apps/', 'webpack.config.js'];
    for (const file of sourceFiles) {
      const sourcePath = `/Users/fabiomarcellus/Documents/GitHub/lord-commander-poc/apps/api/${file}`;
      const targetPath = join(apiDir, file);

      if (fs.exists?.(sourcePath)) {
        await fs.copy(sourcePath, targetPath);
      }
    }

    // Create standalone API package.json
    const apiPackageJson = {
      name: `${config.projectName}-api`,
      version: '1.0.0',
      description: `API server for ${config.projectName}`,
      main: 'dist/main.js',
      scripts: {
        build: 'tsc',
        dev: 'tsx src/main.ts',
        start: 'node dist/main.js',
        test: 'vitest',
      },
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.5',
        helmet: '^7.0.0',
      },
      devDependencies: {
        '@types/express': '^4.17.0',
        '@types/cors': '^2.8.0',
        '@types/node': '^20.0.0',
        typescript: '^5.0.0',
        tsx: '^4.0.0',
        vitest: '^1.0.0',
      },
      keywords: ['api', config.projectName],
      author: '',
      license: 'ISC',
    };

    await fs.writeFile(join(apiDir, 'package.json'), JSON.stringify(apiPackageJson, null, 2));
  }

  /**
   * Create standalone Dashboard project
   */
  async function createStandaloneDashboard(
    projectDir: string,
    config: InitConfig,
    fs: CommandContext['fs']
  ) {
    if (!fs) throw new Error('File system operations not available');

    const dashboardDir = join(projectDir, 'dashboard-ui');

    // Copy Dashboard source (excluding NX configs)
    const sourceFiles = ['src/', 'public/', 'next.config.mjs', 'tailwind.config.js'];
    for (const file of sourceFiles) {
      const sourcePath = `/Users/fabiomarcellus/Documents/GitHub/lord-commander-poc/apps/dashboard-ui/${file}`;
      const targetPath = join(dashboardDir, file);

      if (fs.exists?.(sourcePath)) {
        await fs.copy(sourcePath, targetPath);
      }
    }

    // Create standalone Dashboard package.json
    const dashboardPackageJson = {
      name: `${config.projectName}-dashboard`,
      version: '1.0.0',
      description: `Dashboard UI for ${config.projectName}`,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        test: 'vitest',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        tailwindcss: '^3.0.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        typescript: '^5.0.0',
        eslint: '^8.0.0',
        'eslint-config-next': '^14.0.0',
        vitest: '^1.0.0',
      },
      keywords: ['dashboard', 'ui', config.projectName],
      author: '',
      license: 'ISC',
    };

    await fs.writeFile(
      join(dashboardDir, 'package.json'),
      JSON.stringify(dashboardPackageJson, null, 2)
    );
  }

  /**
   * Create project README with setup instructions
   */
  async function createProjectReadme(
    projectDir: string,
    config: InitConfig,
    fs: CommandContext['fs']
  ) {
    if (!fs) throw new Error('File system operations not available');

    const readme = `# ${config.projectName}

Generated by Lord Commander CLI SDK

## Project Structure

${
  config.includeApi && config.includeDashboard
    ? `
- \`cli/\` - Command-line interface
- \`api/\` - Backend API server  
- \`dashboard-ui/\` - Web dashboard interface
`
    : config.includeApi
      ? `
- \`cli/\` - Command-line interface
- \`api/\` - Backend API server
`
      : `
- \`cli/\` - Command-line interface
`
}

## Quick Start

\`\`\`bash
# Install all dependencies
npm run install:all

# Development
npm run dev:cli${config.includeApi ? '\nnpm run dev:api' : ''}${config.includeDashboard ? '\nnpm run dev:dashboard' : ''}

# Build all projects
npm run build:all

# Test all projects  
npm run test:all
\`\`\`

## Individual Project Commands

### CLI
\`\`\`bash
cd cli
npm install
npm run dev        # Development mode
npm run build      # Build for production
npm run test       # Run tests
\`\`\`
${
  config.includeApi
    ? `
### API Server
\`\`\`bash
cd api
npm install
npm run dev        # Development server
npm run build      # Build for production  
npm run start      # Production server
npm run test       # Run tests
\`\`\`
`
    : ''
}${
  config.includeDashboard
    ? `
### Dashboard UI
\`\`\`bash
cd dashboard-ui
npm install
npm run dev        # Development server
npm run build      # Build for production
npm run start      # Production server
npm run test       # Run tests
\`\`\`
`
    : ''
}

## Documentation

- [Lord Commander CLI SDK](https://docs.lord-commander.dev)
- [Getting Started Guide](https://docs.lord-commander.dev/quickstart)

## Support

- [GitHub Issues](https://github.com/caedonai/lord-commander/issues)
- [Documentation](https://docs.lord-commander.dev)
`;

    await fs.writeFile(join(projectDir, 'README.md'), readme);
  }

  /**
   * Create basic project structure for local installations
   */
  async function createProjectStructure(
    config: InitConfig,
    logger: CommandContext['logger'],
    fs: CommandContext['fs']
  ) {
    if (!fs?.writeFile || !fs?.ensureDir) {
      logger.warn('File system utilities not available, skipping project structure creation');
      return;
    }

    const spinner = logger.spinner('Creating project structure...');

    try {
      // Create package.json if it doesn't exist
      const packageJsonPath = join(cwd(), 'package.json');
      const packageJsonExists = fs.exists ? fs.exists(packageJsonPath) : false;

      if (!packageJsonExists) {
        const dependencies: Record<string, string> = {
          '@lord-commander/cli-core': '^1.0.0',
        };

        if (config.includeApi) {
          dependencies['@caedonai/lord-commander-api'] = '^1.0.0';
        }
        if (config.includeDashboard) {
          dependencies['@caedonai/lord-commander-dashboard'] = '^1.0.0';
        }

        const packageJson = {
          name: config.projectName,
          version: '1.0.0',
          type: 'module',
          description: 'CLI project built with Lord Commander SDK',
          main: 'index.js',
          scripts: {
            start: 'node index.js',
            dev: 'node --watch index.js',
          },
          dependencies,
          keywords: ['cli', 'lord-commander'],
          author: '',
          license: 'ISC',
        };

        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }

      // Create basic CLI entry point
      const indexPath = join(cwd(), 'index.js');
      const indexExists = fs.exists ? fs.exists(indexPath) : false;

      if (!indexExists) {
        const cliTemplate = `#!/usr/bin/env node

import { createCLI } from '@lord-commander/cli-core';

await createCLI({
  name: '${config.projectName}',
  version: '1.0.0',
  description: 'CLI built with Lord Commander SDK',
  commandsPath: './commands',
  builtinCommands: {
    completion: true,
    hello: true,
    version: true,
  },
  autocomplete: {
    enabled: true,
    autoInstall: false,
    shells: ['bash', 'zsh', 'fish', 'powershell'],
    enableFileCompletion: true,
  },
});
`;
        await fs.writeFile(indexPath, cliTemplate);
      }

      // Create commands directory
      await fs.ensureDir(join(cwd(), 'commands'));

      spinner.stop('Project structure created!', 0);
    } catch (error) {
      spinner.stop('Failed to create project structure', 1);
      logger.warn(
        `Structure creation error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Show next steps to the user
   */
  function showLibraryModeNextSteps(config: InitConfig, logger: CommandContext['logger']) {
    logger.success('🎉 Library installation complete!');
    logger.info('');
    logger.info('📚 Next steps:');
    logger.info('• Import SDK functions in your project:');
    logger.info('  import { createCLI } from "@lord-commander/cli-core";');

    if (config.includeApi) {
      logger.info('  import { createServer } from "@caedonai/lord-commander-api";');
    }

    if (config.includeDashboard) {
      logger.info('  import { Dashboard } from "@caedonai/lord-commander-dashboard";');
    }

    logger.info('');
    logger.info('• Example usage:');
    logger.info('  const cli = await createCLI({');
    logger.info('    name: "my-cli",');
    logger.info('    version: "1.0.0",');
    logger.info('    description: "My custom CLI"');
    logger.info('  });');
    logger.info('');
    logger.info('📖 Documentation: https://docs.lord-commander.dev');
    logger.info('🐛 Issues: https://github.com/caedonai/lord-commander/issues');
  }

  function showNextSteps(config: InitConfig, logger: CommandContext['logger']) {
    logger.success('🎉 Installation complete!');
    logger.info('');
    logger.info('📚 Next steps:');

    if (config.installLocation === 'global') {
      logger.info("• Your CLI is now available globally as 'lord-commander'");
      logger.info("• Run 'lord-commander --help' to see available commands");
      logger.info("• Use 'lord-commander completion install' to set up shell completion");
    } else {
      logger.info(
        `• Navigate to your project: cd ${config.projectName !== 'my-cli-project' ? config.projectName : '.'}`
      );
      logger.info(`• Start developing: ${config.packageManager} run dev`);
      logger.info("• Add commands in the 'commands/' directory");
      logger.info("• Run 'node index.js --help' to test your CLI");
    }

    if (config.includeApi) {
      logger.info("• API server available at '@caedonai/lord-commander-api'");
      logger.info('• Check API documentation for setup instructions');
    }

    if (config.includeDashboard) {
      logger.info("• Dashboard UI available at '@caedonai/lord-commander-dashboard'");
      logger.info('• Check Dashboard documentation for setup instructions');
    }

    logger.info('');
    logger.info('📖 Documentation: https://docs.lord-commander.dev');
    logger.info('🐛 Issues: https://github.com/caedonai/lord-commander/issues');
  }
}
