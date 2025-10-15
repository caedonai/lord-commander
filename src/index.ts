/**
 * Lord Commander - CLI SDK Framework
 * 
 * A comprehensive toolkit for building professional-grade command-line tools.
 * Extracts and systematizes patterns from industry-leading CLIs into 
 * composable, reusable modules.
 */

// Main CLI creation function
export { createCLI } from './cli/createCLI';

// Core SDK modules - Essential utilities
export * as core from './core';

// Plugin SDK modules - Extended functionality  
export * as plugins from './plugins';

// TypeScript interfaces and types
export * from './types';