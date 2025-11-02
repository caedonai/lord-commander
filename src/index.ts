/**
 * Lord Commander - CLI SDK Framework
 *
 * A comprehensive toolkit for building professional-grade command-line tools.
 * Extracts and systematizes patterns from industry-leading CLIs into
 * composable, reusable modules.
 */

// Core SDK modules - Essential utilities (includes createCLI)
export * as core from './core';
// Main CLI creation function (for convenience)
export { createCLI } from './core/createCLI.js';

// Plugin SDK modules - Extended functionality
export * as plugins from './plugins';

// TypeScript interfaces and types
export * from './types';
