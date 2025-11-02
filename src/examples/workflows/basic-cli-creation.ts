#!/usr/bin/env node

/**
 * Basic CLI Creation Workflow
 *
 * Demonstrates the most common CLI creation patterns using the Lord Commander SDK.
 * This example shows how to create a simple CLI with automatic command discovery.
 */

import type { Command } from 'commander';
import { type CommandContext, createCLI } from '../../index.js';

/**
 * Example 1: Minimal CLI Setup
 * Perfect for getting started quickly
 */
export async function createMinimalCLI() {
  return await createCLI({
    name: 'simple-cli',
    version: '1.0.0',
    description: 'A simple CLI application',
  });
}

/**
 * Example 2: CLI with Built-in Commands
 * Includes shell completion and example commands
 */
export async function createCLIWithBuiltins() {
  return await createCLI({
    name: 'enhanced-cli',
    version: '1.2.0',
    description: 'Enhanced CLI with built-in features',
    builtinCommands: {
      completion: true, // Shell autocomplete
      hello: true, // Example greeting command
      version: false, // Disable advanced version command
    },
  });
}

/**
 * Example 3: CLI with Multiple Command Directories
 * Organized command structure for larger projects
 */
export async function createOrganizedCLI() {
  return await createCLI({
    name: 'organized-cli',
    version: '2.0.0',
    description: 'Well-organized CLI with multiple command groups',
    commandsPath: [
      './commands/core', // Core business commands
      './commands/admin', // Administrative commands
      './commands/utilities', // Helper utilities
    ],
    builtinCommands: {
      completion: true,
      hello: false,
      version: true,
    },
  });
}

/**
 * Example 4: Production CLI with Full Configuration
 * Complete setup for production applications
 */
export async function createProductionCLI() {
  return await createCLI({
    name: 'production-cli',
    version: '3.1.0',
    description: 'Production-ready CLI with comprehensive features',

    // Command organization
    commandsPath: ['./commands'],

    // Shell integration
    autocomplete: {
      enabled: true,
      autoInstall: true,
      shells: ['bash', 'zsh', 'fish', 'powershell'],
      enableFileCompletion: true,
    },

    // Note: Cache configuration would be added when available in future versions

    // Built-in features
    builtinCommands: {
      completion: true,
      hello: false,
      version: true,
    },

    // Custom error handling
    errorHandler: async (error: Error) => {
      // Log to analytics service
      console.error(`🚨 CLI Error: ${error.message}`);

      // Show debug info in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', error.stack);
      }

      // Suggest common solutions
      if (error.message.includes('command not found')) {
        console.error('💡 Try running with --help to see available commands');
      }

      process.exit(1);
    },
  });
}

/**
 * Example 5: Manual CLI Control
 * For advanced use cases requiring manual execution
 */
export async function createManualControlCLI() {
  const program = await createCLI({
    name: 'manual-cli',
    version: '1.0.0',
    description: 'CLI with manual execution control',
    autoStart: false, // Don't execute automatically
  });

  // Custom pre-execution logic
  console.log('🔧 Performing pre-execution checks...');

  // Validate environment
  if (!process.env.API_KEY) {
    console.error('❌ API_KEY environment variable required');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');

  // Execute the CLI
  await program.run();
}

/**
 * Example Command Implementation
 * Shows how to create a proper command with the SDK utilities
 */
export function exampleCommand(program: Command, context: CommandContext) {
  const { logger, prompts, fs } = context;

  program
    .command('example')
    .description('Example command showing SDK features')
    .argument('[name]', 'Optional name parameter')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-f, --format <type>', 'Output format', 'text')
    .action(async (name: string, options: { verbose?: boolean }) => {
      // Enhanced logging
      logger.intro('🚀 Example Command');

      if (options.verbose) {
        logger.enableVerbose();
      }

      // Interactive prompts if no name provided
      if (!name) {
        name = await prompts.text({
          message: "What's your name?",
          placeholder: 'Enter your name',
          validate: (value: string) => {
            if (value.length < 2) return 'Name must be at least 2 characters';
            return true;
          },
        });
      }

      // Process execution with spinner
      const spinner = logger.spinner('Processing request...');

      try {
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // File system operations
        const tempDir = './temp';
        await fs.ensureDir(tempDir);

        spinner.success('Processing completed');

        // Formatted output
        switch (options.format) {
          case 'json':
            console.log(JSON.stringify({ name, status: 'success' }, null, 2));
            break;
          default:
            logger.success(`Hello, ${name}! Command executed successfully.`);
        }

        logger.outro('✨ Example command completed');
      } catch (error) {
        spinner.fail('Processing failed');
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
}

/**
 * Demo function to showcase different CLI creation patterns
 */
export async function runBasicCLIDemo() {
  console.log('🎯 Lord Commander SDK - Basic CLI Examples\n');

  console.log('1. Minimal CLI setup');
  console.log('2. CLI with built-in commands');
  console.log('3. Organized multi-directory CLI');
  console.log('4. Production-ready CLI');
  console.log('5. Manual control CLI');

  console.log('\nEach example demonstrates different CLI creation patterns.');
  console.log('See the source code for implementation details.\n');
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicCLIDemo().catch(console.error);
}
