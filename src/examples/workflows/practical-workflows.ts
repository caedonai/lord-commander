#!/usr/bin/env node

/**
 * Practical CLI Workflows
 * 
 * Demonstrates real-world CLI workflows using available SDK features.
 * Shows project setup, development tasks, and deployment patterns.
 */

import { createCLI, type CommandContext } from '../../index.js';
import type { Command } from 'commander';

/**
 * Simple Project Setup Workflow
 * Uses basic prompts and logger for professional output
 */
export async function projectSetupWorkflow(context: CommandContext): Promise<void> {
  const { logger } = context;
  
  logger.intro('🚀 Project Setup');
  
  // Basic project information gathering
  logger.info('Setting up a new project...');
  
  // Simulate project setup steps
  const spinner1 = logger.spinner('Creating project structure...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner1.success('Project structure created');
  
  const spinner2 = logger.spinner('Installing dependencies...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  spinner2.success('Dependencies installed');
  
  const spinner3 = logger.spinner('Configuring development environment...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  spinner3.success('Environment configured');
  
  logger.success('✅ Project setup completed successfully!');
  logger.outro('Your project is ready for development 🎉');
}

/**
 * Build and Test Workflow
 * Demonstrates a typical CI/CD-style workflow
 */
export async function buildAndTestWorkflow(context: CommandContext): Promise<void> {
  const { logger } = context;
  
  logger.intro('🔧 Build & Test Pipeline');
  
  // Type checking
  const typeCheck = logger.spinner('Running TypeScript type check...');
  await new Promise(resolve => setTimeout(resolve, 800));
  typeCheck.success('Type check passed');
  
  // Linting
  const lint = logger.spinner('Running ESLint...');
  await new Promise(resolve => setTimeout(resolve, 600));
  lint.success('Linting passed');
  
  // Testing
  const test = logger.spinner('Running test suite...');
  await new Promise(resolve => setTimeout(resolve, 2500));
  test.success('All tests passed (1412/1412)');
  
  // Building
  const build = logger.spinner('Building application...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  build.success('Build completed');
  
  // Bundle analysis
  const analyze = logger.spinner('Analyzing bundle size...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  analyze.success('Bundle analysis complete (1.78KB core)');
  
  logger.success('🎯 Pipeline completed successfully!');
  logger.outro('Ready for deployment 🚀');
}

/**
 * Database Migration Workflow
 * Shows how to handle database operations safely
 */
export async function databaseMigrationWorkflow(context: CommandContext): Promise<void> {
  const { logger } = context;
  
  logger.intro('🗃️ Database Migration');
  
  // Check database connection
  const connection = logger.spinner('Checking database connection...');
  await new Promise(resolve => setTimeout(resolve, 500));
  connection.success('Database connection verified');
  
  // Backup current state
  const backup = logger.spinner('Creating database backup...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  backup.success('Backup created: backup_20231029_142030.sql');
  
  // Run migrations
  const migrations = logger.spinner('Running pending migrations...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  migrations.success('3 migrations applied successfully');
  
  // Verify integrity
  const verify = logger.spinner('Verifying database integrity...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  verify.success('Database integrity verified');
  
  logger.success('✅ Migration completed successfully!');
  logger.outro('Database is up to date 📊');
}

/**
 * Deployment Workflow
 * Professional deployment process with safety checks
 */
export async function deploymentWorkflow(context: CommandContext, environment: string = 'staging'): Promise<void> {
  const { logger } = context;
  
  logger.intro(`🚀 Deploying to ${environment}`);
  
  if (environment === 'production') {
    logger.warn('⚠️  Production deployment requires extra caution');
  }
  
  // Pre-deployment checks
  const checks = logger.spinner('Running pre-deployment checks...');
  await new Promise(resolve => setTimeout(resolve, 1200));
  checks.success('All pre-deployment checks passed');
  
  // Build for production
  const build = logger.spinner('Building for production...');
  await new Promise(resolve => setTimeout(resolve, 2500));
  build.success('Production build complete');
  
  // Upload files
  const upload = logger.spinner('Uploading files to server...');
  await new Promise(resolve => setTimeout(resolve, 4000));
  upload.success('Files uploaded successfully');
  
  // Update configuration
  const config = logger.spinner('Updating server configuration...');
  await new Promise(resolve => setTimeout(resolve, 800));
  config.success('Configuration updated');
  
  // Health check
  const health = logger.spinner('Running health check...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  health.success('Application is healthy');
  
  logger.success(`🎉 Successfully deployed to ${environment}!`);
  logger.outro('Deployment complete 🌟');
}

/**
 * Security Audit Workflow
 * Demonstrates security validation workflow
 */
export async function securityAuditWorkflow(context: CommandContext): Promise<void> {
  const { logger } = context;
  
  logger.intro('🛡️ Security Audit');
  
  // Dependency audit
  const deps = logger.spinner('Auditing dependencies...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  deps.success('No vulnerable dependencies found');
  
  // Security tests
  const secTests = logger.spinner('Running security tests...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  secTests.success('All 974 security tests passed');
  
  // Input validation check
  const validation = logger.spinner('Checking input validation...');
  await new Promise(resolve => setTimeout(resolve, 800));
  validation.success('Input validation is comprehensive');
  
  // Error handling audit
  const errors = logger.spinner('Auditing error handling...');
  await new Promise(resolve => setTimeout(resolve, 600));
  errors.success('Error sanitization is active');
  
  logger.success('🔒 Security audit completed!');
  logger.outro('Your application is secure 🛡️');
}

/**
 * Commands that demonstrate these workflows
 */
export function setupWorkflowCommands(program: Command, context: CommandContext): void {
  
  program
    .command('setup')
    .description('Run project setup workflow')
    .action(async () => {
      try {
        await projectSetupWorkflow(context);
      } catch (error) {
        context.logger.error(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  
  program
    .command('build')
    .description('Run build and test workflow')
    .action(async () => {
      try {
        await buildAndTestWorkflow(context);
      } catch (error) {
        context.logger.error(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  
  program
    .command('migrate')
    .description('Run database migration workflow')
    .action(async () => {
      try {
        await databaseMigrationWorkflow(context);
      } catch (error) {
        context.logger.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  
  program
    .command('deploy')
    .description('Run deployment workflow')
    .argument('[environment]', 'Target environment', 'staging')
    .action(async (environment: string) => {
      try {
        await deploymentWorkflow(context, environment);
      } catch (error) {
        context.logger.error(`Deployment failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  
  program
    .command('audit')
    .description('Run security audit workflow')
    .action(async () => {
      try {
        await securityAuditWorkflow(context);
      } catch (error) {
        context.logger.error(`Audit failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}

/**
 * Create CLI with workflow commands
 */
export async function createWorkflowCLI() {
  return await createCLI({
    name: 'workflow-cli',
    version: '1.0.0',
    description: 'CLI demonstrating professional workflows',
    builtinCommands: {
      completion: true,
      hello: false,
      version: false
    }
  });
}

/**
 * Demo runner that shows all available workflows
 */
export async function runWorkflowDemo() {
  console.log('🎯 Lord Commander SDK - Practical Workflow Examples\n');
  
  console.log('Available workflows:');
  console.log('1. 🚀 setup     - Project initialization');
  console.log('2. 🔧 build     - Build and test pipeline');
  console.log('3. 🗃️  migrate   - Database migration');
  console.log('4. 🚀 deploy    - Application deployment');
  console.log('5. 🛡️  audit     - Security audit');
  
  console.log('\nThese workflows demonstrate:');
  console.log('• Professional loading spinners');
  console.log('• Clear status reporting');
  console.log('• Error handling patterns');
  console.log('• Multi-step process management');
  console.log('• Production-ready CLI experiences\n');
  
  console.log('Each workflow uses the SDK\'s logger system for');
  console.log('consistent, professional output formatting.\n');
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runWorkflowDemo().catch(console.error);
}