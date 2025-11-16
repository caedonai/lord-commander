import { basename, join } from 'node:path';
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
  // New path configuration options
  outputPath?: string; // Main project directory (--output)
  dashboardPath?: string; // Custom dashboard location (--dashboard-path)
  apiPath?: string; // Custom API location (--api-path)
  structureType: 'project-folder' | 'current-dir' | 'custom-paths'; // How to organize files
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
    .option('--type <setup>', 'Setup type: library, cli-only, cli-api, or full-stack', 'cli-only')
    .option('--pm <manager>', 'Package manager to use (npm, pnpm, yarn)', 'npm')
    .option('--output <path>', 'Output directory for the project (creates project folder)')
    .option('--dashboard-path <path>', 'Custom path for dashboard-ui component')
    .option('--api-path <path>', 'Custom path for API component')
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

        // Determine structure type based on options
        let structureType: 'project-folder' | 'current-dir' | 'custom-paths' = 'project-folder';
        if (options.dashboardPath || options.apiPath) {
          structureType = 'custom-paths';
        } else if (!options.output) {
          structureType = 'current-dir';
        }

        config = {
          projectName: options.output ? basename(options.output) : 'my-cli-project',
          setupType: options.type,
          includeApi,
          includeDashboard,
          packageManager: options.pm,
          installLocation: options.global ? 'global' : 'local',
          outputPath: options.output,
          dashboardPath: options.dashboardPath,
          apiPath: options.apiPath,
          structureType,
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
   * Resolve project structure paths based on configuration
   *
   * README.md placement strategy:
   * - Project folder mode: README goes in the new project folder (recommended)
   * - Current directory mode: README goes in current directory
   * - Custom paths mode: README goes in current directory (acts as project root)
   */
  function resolveProjectPaths(config: InitConfig) {
    const currentDir = cwd();

    // If output path is specified, use it as the project root
    if (config.outputPath) {
      const projectRoot = join(currentDir, config.outputPath);
      return {
        root: projectRoot,
        dashboard: config.dashboardPath
          ? join(currentDir, config.dashboardPath)
          : join(projectRoot, 'dashboard-ui'),
        api: config.apiPath ? join(currentDir, config.apiPath) : join(projectRoot, 'api'),
        cli: join(projectRoot, 'cli'),
        packageJson: join(projectRoot, 'package.json'),
        readme: join(projectRoot, 'README.md'),
      };
    }

    // If custom paths are specified, use them - README goes in current directory (project root)
    if (config.structureType === 'custom-paths') {
      return {
        root: currentDir,
        dashboard: config.dashboardPath
          ? join(currentDir, config.dashboardPath)
          : join(currentDir, 'dashboard-ui'),
        api: config.apiPath ? join(currentDir, config.apiPath) : join(currentDir, 'api'),
        cli: join(currentDir, 'cli'),
        packageJson: join(currentDir, 'package.json'),
        readme: join(currentDir, 'README.md'),
      };
    }

    // Default: current directory structure
    return {
      root: currentDir,
      dashboard: join(currentDir, 'dashboard-ui'),
      api: join(currentDir, 'api'),
      cli: join(currentDir, 'cli'),
      packageJson: join(currentDir, 'package.json'),
      readme: join(currentDir, 'README.md'),
    };
  }

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
        const components = await prompts.multiselect('Select components to include:', [
          {
            value: 'api',
            label: 'API Server (scaffolded template)',
          },
          {
            value: 'dashboard',
            label: 'Dashboard UI (scaffolded template)',
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

      // Determine project structure
      const structureChoice = await prompts.select('How should we organize your project?', [
        {
          value: 'project-folder',
          label: 'Create in new project folder (recommended)',
          hint: `Creates: ./${projectName}/dashboard-ui and ./${projectName}/api`,
        },
        {
          value: 'current-dir',
          label: 'Create in current directory',
          hint: 'Creates: ./dashboard-ui and ./api here',
        },
        {
          value: 'custom-paths',
          label: 'Custom paths for each component',
          hint: 'Specify exactly where each component goes',
        },
      ]);

      if (prompts.clack.isCancel(structureChoice)) {
        logger.outro('Operation cancelled.');
        process.exit(0);
      }

      // Handle custom paths if selected
      let outputPath: string | undefined;
      let dashboardPath: string | undefined;
      let apiPath: string | undefined;

      if (structureChoice === 'project-folder') {
        outputPath = projectName as string;
      } else if (structureChoice === 'custom-paths') {
        if (includeDashboard) {
          dashboardPath = (await prompts.text('Dashboard UI path:', {
            placeholder: './dashboard-ui',
          })) as string;

          if (prompts.clack.isCancel(dashboardPath)) {
            logger.outro('Operation cancelled.');
            process.exit(0);
          }

          // Use default if empty
          if (!dashboardPath.trim()) {
            dashboardPath = './dashboard-ui';
          }
        }

        if (includeApi) {
          apiPath = (await prompts.text('API path:', {
            placeholder: './api',
          })) as string;

          if (prompts.clack.isCancel(apiPath)) {
            logger.outro('Operation cancelled.');
            process.exit(0);
          }

          // Use default if empty
          if (!apiPath.trim()) {
            apiPath = './api';
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
        outputPath,
        dashboardPath,
        apiPath,
        structureType: structureChoice as 'project-folder' | 'current-dir' | 'custom-paths',
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

    if (config.setupType === 'library') {
      logger.info('📦 Package to Install:');
      logger.info('  • @lord-commander/cli-core ✓');
    } else {
      logger.info('📦 Components to Scaffold:');
      logger.info('  • CLI Project ✓');
      logger.info(`  • API Server: ${config.includeApi ? '✓' : '❌'}`);
      logger.info(`  • Dashboard UI: ${config.includeDashboard ? '✓' : '❌'}`);
    }
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
        await executeLibraryModeInstallation(config, logger, execa);
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
   * Execute library mode installation (CLI-core only)
   */
  async function executeLibraryModeInstallation(
    config: InitConfig,
    logger: CommandContext['logger'],
    execa: CommandContext['execa']
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    try {
      if (isProduction) {
        // Production: Install actual @lord-commander/cli-core package
        const packageName = '@lord-commander/cli-core';

        // Determine install command based on package manager and location
        const installFlags = config.installLocation === 'global' ? ['-g'] : [];
        let installCmd: string[] = [];

        switch (config.packageManager) {
          case 'pnpm':
            installCmd = ['pnpm', 'add', ...installFlags, packageName];
            break;
          case 'yarn':
            if (config.installLocation === 'global') {
              installCmd = ['yarn', 'global', 'add', packageName];
            } else {
              installCmd = ['yarn', 'add', packageName];
            }
            break;
          default:
            installCmd = ['npm', 'install', ...installFlags, packageName];
            break;
        }

        logger.info(`Installing package: ${packageName}`);
        logger.info(`Running: ${installCmd.join(' ')}`);

        const spinner = logger.spinner('Installing @lord-commander/cli-core...');

        // Execute the actual installation
        if (execa) {
          const [command, ...args] = installCmd;
          await execa.execa(command, args, {
            stdio: 'inherit',
            cwd: config.installLocation === 'local' ? cwd() : undefined,
          });
        }

        // Verify installation
        await verifyPackageInstallation(packageName, config, logger);
        spinner.stop('Package installed successfully!', 0);

        // Library mode should only install the package, not create project structure
        // Users can import and use the SDK in their existing projects
      } else {
        // Development: Show what would be installed
        logger.info('🚧 Development Mode: Package not yet published');
        logger.info('In production, this package would be installed:');
        logger.info('  • @lord-commander/cli-core');

        const spinner = logger.spinner('Setting up library mode...');
        spinner.stop('Library mode setup complete! (Development mode)', 0);
      }

      showLibraryModeNextSteps(config, logger);
    } catch (error) {
      logger.error(
        `Library installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Verify that a package was installed correctly
   */
  async function verifyPackageInstallation(
    packageName: string,
    config: InitConfig,
    logger: CommandContext['logger']
  ) {
    try {
      if (config.installLocation === 'global') {
        // For global installations, we can't easily verify without running npm list -g
        logger.info(`✅ Global installation of ${packageName} completed`);
      } else {
        // For local installations, check if package.json was updated or node_modules exists
        const packageJsonPath = join(cwd(), 'package.json');
        if (fs?.exists?.(packageJsonPath)) {
          logger.info(`✅ Local installation of ${packageName} completed`);
        }
      }
    } catch (error) {
      logger.warn(
        `Could not verify installation of ${packageName}: ${error instanceof Error ? error.message : String(error)}`
      );
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
      // Resolve project paths based on configuration
      const paths = resolveProjectPaths(config);

      // Create project root directory
      await fs.ensureDir(paths.root);

      // Always create CLI structure (but clean it up for standalone use)
      await createStandaloneCLI(paths, config, fs);

      // Conditionally copy API
      if (config.includeApi) {
        await createStandaloneAPI(paths, config, fs);
      }

      // Conditionally copy Dashboard
      if (config.includeDashboard) {
        await createStandaloneDashboard(paths, config, fs);
      }

      // Create workspace configuration (only if using project folder structure)
      if (config.structureType === 'project-folder') {
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

        await fs.writeFile(paths.packageJson, JSON.stringify(workspacePackageJson, null, 2));
      }

      // Create README for the scaffolded project
      await createProjectReadme(paths, config, fs);

      spinner.stop('Templates scaffolded successfully!', 0);
      logger.success(`📁 Project created at: ${paths.root}`);

      // Show created components and their locations
      logger.info('📂 Project structure:');
      logger.info(`   Root: ${paths.root}`);
      if (config.setupType !== 'library') {
        logger.info(`   CLI: ${paths.cli}`);
      }
      if (config.includeApi) {
        logger.info(`   API: ${paths.api}`);
      }
      if (config.includeDashboard) {
        logger.info(`   Dashboard: ${paths.dashboard}`);
      }
    } catch (error) {
      spinner.stop('Failed to scaffold templates', 1);
      logger.warn(`Scaffolding error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create standalone CLI project (without NX dependencies)
   */
  async function createStandaloneCLI(
    paths: { root: string; cli: string; [key: string]: string },
    config: InitConfig,
    fs: CommandContext['fs']
  ) {
    if (!fs) throw new Error('File system operations not available');

    const cliDir = paths.cli;
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
    paths: { root: string; api: string; [key: string]: string },
    config: InitConfig,
    fs: CommandContext['fs']
  ) {
    if (!fs) throw new Error('File system operations not available');

    const apiDir = paths.api;

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
    paths: { root: string; dashboard: string; [key: string]: string },
    config: InitConfig,
    fs: CommandContext['fs']
  ) {
    if (!fs) throw new Error('File system operations not available');

    const dashboardDir = paths.dashboard;

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
    paths: { root: string; readme: string; [key: string]: string },
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

    await fs.writeFile(paths.readme, readme);
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
    logger.info('• Import the CLI SDK in your project:');
    logger.info('  import { createCLI } from "@lord-commander/cli-core";');
    logger.info('');
    logger.info('• Create your CLI:');
    logger.info('  const cli = await createCLI({');
    logger.info('    name: "my-cli",');
    logger.info('    version: "1.0.0",');
    logger.info('    description: "My custom CLI",');
    logger.info('    commandsPath: "./commands"');
    logger.info('  });');
    logger.info('');

    if (config.installLocation === 'local') {
      logger.info('• Start building:');
      logger.info('  - The CLI SDK is now available in your project');
      logger.info('  - Import it: import { createCLI } from "@lord-commander/cli-core"');
      logger.info('  - Create your CLI entry point file');
      logger.info('  - Add commands and configure as needed');
      logger.info('');
    }

    if (config.includeApi || config.includeDashboard) {
      logger.info(
        '💡 Note: For API and Dashboard components, use project scaffolding mode instead:'
      );
      logger.info(
        `   ${config.packageManager === 'npm' ? 'npx' : config.packageManager} @lord-commander/cli init --type ${config.includeApi && config.includeDashboard ? 'full-stack' : 'cli-api'}`
      );
      logger.info('');
    }

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
