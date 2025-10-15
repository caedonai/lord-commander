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
  '.lordcommander.json',
  '.lordcommander.yaml',
  '.lordcommander.yml',
  'lordcommander.config.js',
  'lordcommander.config.ts',
  join(homedir(), '.lordcommander', 'config.json'),
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