/**
 * Core constants and configuration for the CLI SDK
 * 
 * These constants define the supported technologies, file patterns,
 * and framework detection logic used throughout the SDK.
 */

import { join } from 'path';
import { homedir } from 'os';

/**
 * Supported package managers for project detection and commands
 */
export const SUPPORTED_PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
export type PackageManager = typeof SUPPORTED_PACKAGE_MANAGERS[number];

/**
 * Default file and directory patterns to ignore during operations
 */
export const DEFAULT_IGNORE_PATTERNS = [
  // Version control
  '.git',
  '.gitignore',
  
  // Dependencies
  'node_modules',
  '.pnpm-store',
  '.yarn',
  
  // Build outputs
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.output',
  '.vercel',
  '.netlify',
  
  // Cache and temp files
  '.cache',
  '.temp',
  '.tmp',
  'coverage',
  
  // IDE and editor files
  '.vscode',
  '.idea',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  
  // Environment and config
  '.env',
  '.env.local',
  '.env.*.local',
] as const;

/**
 * Prefix for temporary directories created by the SDK
 */
export const TEMP_DIR_PREFIX = 'lord-commander-';

/**
 * Paths where CLI configuration files can be found
 */
export const CLI_CONFIG_PATHS = [
  'lord.config.js',
  'lord.config.ts',
  join(homedir(), '.lord', 'config.json'),
] as const;

/**
 * Framework detection patterns for smart project detection
 * Each framework has file indicators and optional package.json dependencies
 */
export const FRAMEWORK_PATTERNS = {
  'next.js': {
    files: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
    dependencies: ['next'],
    devDependencies: ['@next/env'],
    directories: ['pages', 'app'],
  },
  
  'remix': {
    files: ['remix.config.js', 'remix.config.ts'],
    dependencies: ['@remix-run/node', '@remix-run/react', '@remix-run/serve'],
    directories: ['app/routes'],
  },
  
  'astro': {
    files: ['astro.config.js', 'astro.config.ts', 'astro.config.mjs'],
    dependencies: ['astro'],
    directories: ['src/pages'],
  },
  
  'vite': {
    files: ['vite.config.js', 'vite.config.ts'],
    dependencies: ['vite'],
    devDependencies: ['vite'],
  },
  
  'nuxt': {
    files: ['nuxt.config.js', 'nuxt.config.ts'],
    dependencies: ['nuxt', 'nuxt3'],
    directories: ['pages', 'components'],
  },
  
  'sveltekit': {
    files: ['svelte.config.js'],
    dependencies: ['@sveltejs/kit'],
    directories: ['src/routes'],
  },
  
  'express': {
    files: ['server.js', 'app.js', 'index.js'],
    dependencies: ['express'],
  },
  
  'fastify': {
    dependencies: ['fastify'],
  },
  
  'react': {
    dependencies: ['react'],
    devDependencies: ['@types/react'],
  },
  
  'vue': {
    dependencies: ['vue'],
    devDependencies: ['@vue/cli-service'],
  },
  
  'angular': {
    files: ['angular.json'],
    dependencies: ['@angular/core'],
    devDependencies: ['@angular/cli'],
  },
} as const;

export type Framework = keyof typeof FRAMEWORK_PATTERNS;

/**
 * Common file extensions for different file types
 */
export const FILE_EXTENSIONS = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs'],
  config: ['.json', '.yaml', '.yml', '.toml'],
  template: ['.hbs', '.ejs', '.mustache'],
  style: ['.css', '.scss', '.sass', '.less'],
} as const;

/**
 * Default ports commonly used by development servers
 */
export const DEFAULT_PORTS = {
  next: 3000,
  remix: 3000,
  astro: 3000,
  vite: 5173,
  nuxt: 3000,
  sveltekit: 5173,
  express: 3000,
  fastify: 3000,
} as const;

/**
 * Package manager specific commands and configurations
 */
export const PACKAGE_MANAGER_COMMANDS = {
  npm: {
    install: 'npm install',
    installDev: 'npm install --save-dev',
    run: 'npm run',
    create: 'npm create',
    lockFile: 'package-lock.json',
  },
  pnpm: {
    install: 'pnpm install',
    installDev: 'pnpm install --save-dev', 
    run: 'pnpm run',
    create: 'pnpm create',
    lockFile: 'pnpm-lock.yaml',
  },
  yarn: {
    install: 'yarn install',
    installDev: 'yarn add --dev',
    run: 'yarn run',
    create: 'yarn create',
    lockFile: 'yarn.lock',
  },
  bun: {
    install: 'bun install',
    installDev: 'bun add --dev',
    run: 'bun run',
    create: 'bun create',
    lockFile: 'bun.lockb',
  },
} as const;

/**
 * Git configuration and patterns
 */
export const GIT_PATTERNS = {
  defaultBranch: 'main',
  commonBranches: ['main', 'master', 'develop', 'dev'],
  ignorePatterns: DEFAULT_IGNORE_PATTERNS,
  defaultCommitMessage: '✨ Initial commit from Lord Commander',
} as const;

/**
 * Telemetry and analytics configuration
 */
export const TELEMETRY_CONFIG = {
  defaultEndpoint: 'https://analytics.lordcommander.dev',
  optOutFile: join(homedir(), '.lordcommander', 'telemetry-opt-out'),
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Error message constants for consistent error handling across the SDK
 * 
 * These functions provide type-safe, parameterized error messages that maintain
 * consistency across the entire CLI framework. Each function returns a formatted
 * string with contextual information to help developers debug issues.
 * 
 * @example
 * ```typescript
 * // Security-focused error
 * throw new Error(ERROR_MESSAGES.SUSPICIOUS_INPUT_DETECTED('$(rm -rf /)', 'command-injection'));
 * 
 * // Path validation error  
 * throw new Error(ERROR_MESSAGES.INVALID_COMMAND_PATH('../../../etc'));
 * 
 * // Command conflict error
 * throw new Error(ERROR_MESSAGES.COMMAND_NAME_CONFLICT(
 *   'deploy', 
 *   '/path/to/commands/deploy.ts', 
 *   'commands',
 *   '/path/to/other/deploy.ts', 
 *   'other-commands'
 * ));
 * ```
 */
export const ERROR_MESSAGES = {
  /**
   * Error message for invalid or unsafe command directory paths
   * @param path - The invalid path that was rejected
   * @returns Formatted error message with security context
   */
  INVALID_COMMAND_PATH: (path: string) => 
    `Invalid or unsafe commands directory path: ${path}. Command paths must be within the current working directory for security.`,
    
  /**
   * Error message for command name conflicts during registration
   * @param name - The conflicting command name
   * @param existingPath - Path to the existing command file
   * @param existingSource - Source directory of the existing command
   * @param newPath - Path to the new conflicting command file
   * @param newSource - Source directory of the new command
   * @returns Formatted error message with conflict details
   */
  COMMAND_NAME_CONFLICT: (name: string, existingPath: string, existingSource: string, newPath: string, newSource: string) =>
    `Command name conflict: '${name}' is defined in both:\n` +
    `  - ${existingPath} (from ${existingSource})\n` +
    `  - ${newPath} (from ${newSource})\n` +
    `Please rename one of the commands to avoid conflicts.`,
    
  /**
   * Error message for suspicious input that matches security patterns
   * @param input - The suspicious input that was detected
   * @param pattern - The security pattern that was matched
   * @returns Formatted error message with input and pattern details
   */
  SUSPICIOUS_INPUT_DETECTED: (input: string, pattern: string) => 
    `Suspicious input detected: "${input}" matches security pattern: ${pattern}. This input has been rejected for security reasons.`,
    
  /**
   * Error message for privilege escalation attempts
   * @returns Formatted error message with escalation warning
   */
  PRIVILEGE_ESCALATION_ATTEMPT: () => 
    'Refusing to run with elevated privileges. Use --allow-root flag if intentional and you understand the security risks.',
    
  /**
   * Error message for unsafe template sources
   * @param url - The untrusted template source URL
   * @returns Formatted error message with allowlist guidance
   */
  UNSAFE_TEMPLATE_SOURCE: (url: string) => 
    `Template source not whitelisted: ${url}. Only verified sources allowed. Please use official templates or add this source to your allowlist.`,
    
  /**
   * Error message for blocked script execution
   * @param script - The script that was blocked
   * @returns Formatted error message with script details and override option
   */
  SCRIPT_EXECUTION_BLOCKED: (script: string) => 
    `Script execution blocked for security: ${script}. Use --allow-scripts if needed and you trust the script source.`,
    
  /**
   * Error message for malicious path detection
   * @param path - The malicious path that was detected
   * @param reason - The reason why the path is considered malicious
   * @returns Formatted error message with path and reason
   */
  MALICIOUS_PATH_DETECTED: (path: string, reason: string) =>
    `Malicious path detected: "${path}" (${reason}). Operation blocked for security.`,
    
  /**
   * Error message for command injection attempts
   * @param input - The input containing injection attempt
   * @returns Formatted error message with injection details
   */
  COMMAND_INJECTION_ATTEMPT: (input: string) =>
    `Command injection attempt detected in input: "${input}". Operation blocked.`,
    
  /**
   * Error message for malformed arguments
   * @param argument - The malformed argument
   * @param index - The index of the argument in the array
   * @returns Formatted error message with argument details
   */
  MALFORMED_ARGUMENT: (argument: string, index: number) =>
    `Malformed argument at index ${index}: "${argument}". Arguments must be valid strings.`,
    
  /**
   * Error message for unsafe file operations
   * @param operation - The file operation that was blocked
   * @param path - The unsafe path for the operation
   * @returns Formatted error message with operation and path details
   */
  UNSAFE_FILE_OPERATION: (operation: string, path: string) =>
    `Unsafe file operation "${operation}" blocked for path: "${path}". Path must be within project directory.`,
    
  /**
   * Error message for configuration tampering detection
   * @param config - The configuration file that shows tampering
   * @param issue - The specific tampering issue detected
   * @returns Formatted error message with config and issue details
   */
  CONFIGURATION_TAMPERING: (config: string, issue: string) =>
    `Configuration tampering detected in ${config}: ${issue}. Using safe defaults instead.`,
} as const;

/**
 * CLI branding and theming constants
 */
export const BRANDING = {
  name: 'Lord Commander',
  tagline: 'Professional CLI toolkit for modern development',
  asciiArt: `
██      ██████  ██████  ██████      ██████  ██████  ███    ███ ███    ███  █████  ███    ██ ██████  ███████ ██████  
██     ██    ██ ██   ██ ██   ██    ██      ██    ██ ████  ████ ████  ████ ██   ██ ████   ██ ██   ██ ██      ██   ██ 
██     ██    ██ ██████  ██   ██    ██      ██    ██ ██ ████ ██ ██ ████ ██ ███████ ██ ██  ██ ██   ██ █████   ██████  
██     ██    ██ ██   ██ ██   ██    ██      ██    ██ ██  ██  ██ ██  ██  ██ ██   ██ ██  ██ ██ ██   ██ ██      ██   ██ 
███████ ██████  ██   ██ ██████      ██████  ██████  ██      ██ ██      ██ ██   ██ ██   ████ ██████  ███████ ██   ██
`,
  colors: {
    primary: '#3b82f6',    // Blue
    success: '#10b981',    // Green
    warning: '#f59e0b',    // Yellow
    error: '#ef4444',      // Red
    info: '#6b7280',       // Gray
    muted: '#9ca3af',      // Light gray
  },
} as const;