#!/usr/bin/env node
/**
 * Manual Test CLI for Development
 * 
 * This is a MANUAL testing tool, not an automated test.
 * It provides interactive testing of the CLI SDK during development.
 * 
 * Purpose:
 * - Interactive testing of commands and options
 * - Quick validation during development
 * - Demo/example of SDK usage
 * - Debug tool for CLI behavior
 * 
 * Note: For automated testing, see cli-integration.test.ts
 * 
 * Usage:
 *   pnpm test-cli <command> [options]
 *   pnpm tsx src/tests/test-cli.ts <command> [options]
 * 
 * Examples:
 *   pnpm test-cli hello
 *   pnpm test-cli hello --git  
 *   pnpm test-cli hello "World" --uppercase
 *   pnpm test-cli --help
 */

import { createCLI } from '../core/createCLI.js';

await createCLI({
    name: 'test-cli',
    description: 'Test CLI for lord-commander-poc SDK',
    version: '0.1.0'
    // commandsPath is automatically discovered from src/commands
});