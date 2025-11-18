#!/usr/bin/env node

/**
 * Lord Commander CLI Application
 *
 * Thin wrapper around the CLI core library that handles process lifecycle
 * and provides the command-line interface.
 */

import { exit } from 'node:process';
import { createCLI } from '@lord-commander/cli-core';

/**
 * Main CLI application function
 * Handles initialization, execution, and graceful shutdown
 */
async function main(): Promise<void> {
  try {
    await createCLI({
      name: 'lord-commander',
      version: '1.0.0',
      description: 'Professional CLI SDK Framework for building advanced command-line tools',
      commandsPath: 'apps/cli/commands',
      builtinCommands: {
        completion: true,
        hello: true,
        version: true,
      },
      autocomplete: {
        enabled: true,
        autoInstall: false, // Don't auto-install on every run
        shells: ['bash', 'zsh', 'fish', 'powershell'],
        enableFileCompletion: true,
      },
    });
  } catch (error) {
    console.error('CLI execution failed:', error);
    exit(1);
  }
}

// Execute with proper error handling
main().catch((error) => {
  console.error('Unexpected error:', error);
  exit(1);
});
