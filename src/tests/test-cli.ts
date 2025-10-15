#!/usr/bin/env node
/**
 * Test CLI for development and manual testing
 * 
 * This file provides a way to manually test the CLI SDK during development.
 * It creates a CLI instance with all available commands and can be used to:
 * - Test new features and commands
 * - Validate SDK functionality
 * - Demonstrate usage patterns
 * 
 * Usage:
 *   pnpm test-cli <command> [options]
 *   pnpm tsx src/tests/test-cli.ts <command> [options]
 * 
 * Examples:
 *   pnpm test-cli hello
 *   pnpm test-cli hello --git
 *   pnpm test-cli hello "World" --uppercase
 */

import { createCLI } from '../cli/createCLI.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this test file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsPath = join(__dirname, '../commands');

await createCLI({
    name: 'test-cli',
    description: 'Test CLI for lord-commander-poc SDK',
    version: '0.1.0',
    commandsPath
});