# AI Agent Instructions for lord-commander-poc

This document provides essential context for AI agents working with the lord-commander-poc codebase.

## 📋 Task Completion Reminder
**After completing any task, always remind the user to consider updating this copilot-instructions.md file to reflect:**
- New modules, features, or architectural changes
- Updated usage patterns or examples
- Performance improvements or optimization results
- New SDK capabilities or plugin functionality

## Project Overview

**Goal:** Identify and modularize reusable abstractions found across advanced CLIs (like Vercel CLI, create-next-app, next-forge, and Nx CLI) into a developer-friendly SDK for scaffolding, updating, and maintaining projects.

This is a CLI SDK framework built with TypeScript that provides a comprehensive toolkit for building professional-grade command-line tools. The project aims to extract and systematize patterns from industry-leading CLIs into composable, reusable modules.

## Core SDK Architecture

The SDK follows a modular architecture with two main layers:

### Core Modules (`src/core/`)
Essential utilities that form the foundation:
- `exec.ts` - Process execution wrapper (async, cancelable shell commands)
- `fs.ts` - File system utilities (safe file operations, directory management)
- `prompts.ts` - Interactive prompt helpers using @clack/prompts
- `logger.ts` - Unified logging system with spinners and colors
- `constants.ts` - Global constants and paths
- `errors.ts` - Error and cancellation handling
- `createCLI.ts` - Main CLI creation and initialization
- `registerCommands.ts` - Automatic command discovery and registration
- `autocomplete.ts` - Shell completion support (bash, zsh, fish, PowerShell)

### Plugin Modules (`src/plugins/`)
Extended functionality for specific use cases:
- `git.ts` - Repository management and Git operations (clone, commit, diff, tags)
- `updater.ts` - Version management and update system (semver, diffs, plans, application)
- `workspace.ts` - Monorepo workspace utilities (Nx, Lerna, Rush, pnpm, yarn workspaces)

## Key SDK Features

### 1. Tree-shaking Optimization
- **97% bundle size reduction** for selective imports (71KB → 1.78KB)
- Explicit named exports for maximum tree-shaking efficiency
- Granular import control: import only what you need
- Bundle size: Core (~1.78KB), Plugins (~1.33KB), Full SDK (~71KB)

### 2. Zero-Config Setup
- Automatically detects project type, config files, and commands
- Smart project detection for frameworks (Next.js, Remix, Astro, etc.)
- Auto command registration by scanning `/commands` folder

### 3. Interactive Experience
- Built-in @clack/prompts flows for setup (region, project name, env vars)
- Loading spinners with Ora for async tasks
- Graceful Ctrl+C handling with cleanup

### 4. Advanced Logging & Theming
- Centralized logger with colorized output using Chalk
- Real-time streaming output for builds/deploys
- Customizable color system with global theme config
- Help message theming with visual hierarchy

### 5. Comprehensive Monorepo Support
- **Workspace Plugin**: Full support for Nx, Lerna, Rush, Turborepo, pnpm, yarn, npm workspaces
- Package discovery, dependency graphs, batch operations
- Workspace validation and configuration loading

### 6. Professional Version Management
- **Updater Plugin**: Semantic version parsing, diff analysis, update planning
- Git tag management, breaking change detection
- Safe update application with multiple strategies (merge, overwrite, selective)

### 7. Shell Autocomplete System
- **Multi-shell Support**: Comprehensive tab completion for bash, zsh, fish, and PowerShell
- **Auto-installation**: Seamless setup during CLI creation with `autoInstall: true`
- **Command Discovery**: Tab completion for all commands, options, and arguments
- **File Completion**: Automatic file/directory completion for command arguments
- **Manual Control**: Built-in `completion` command for install/uninstall/generate operations
- **Custom Logic**: Support for shell-specific customizations and completion behavior

### 8. Professional CLI Features
- Error handling with recovery suggestions
- Automatic update notifications
- Command aliases and advanced help formatting
- Debug & verbose modes with structured logging
- Dependency abstraction (no need to import commander directly)

## Command Definition Pattern

Commands follow this enhanced structure:
```typescript
export default function(program: Command, context: CommandContext) {
  const { logger, config, prompts, exec, fs } = context;
  
  program
    .command('name')
    .description('command description')
    .argument('[args]', 'argument description')
    .option('-f, --flag', 'flag description')
    .option('--verbose', 'enable verbose logging')
    .action(async (args, options) => {
      logger.intro('Starting operation...');
      
      if (options.verbose) logger.enableVerbose();
      
      const spinner = logger.spinner('Processing...');
      try {
        // Command implementation with SDK utilities
        await exec('some-command', { cwd: process.cwd() });
        await fs.copy('template', 'output');
        spinner.success('Operation completed');
        logger.outro('Done!');
      } catch (error) {
        spinner.fail('Operation failed');
        logger.error(error.message);
      }
    });
}
```

## Common CLI Patterns Abstracted

The SDK systematizes these patterns found across professional CLIs:

| Pattern | SDK Module | Examples |
|---------|------------|----------|
| File System Operations | `core/fs.ts` | Copy templates, ensure directories, clean temp files |
| Process Execution | `core/exec.ts` | `git init`, `npm install`, build commands |
| Interactive Setup | `core/prompts.ts` | Project name, package manager selection |
| Structured Tasks | Command modules | `cloneRepo()`, `setupEnv()`, `installDeps()` |
| Environment Management | `plugins/config-loader.ts` | Auto-create `.env.local` from templates |
| Git Operations | `plugins/git.ts` | Initialize repos, commit, diff between versions |
| Error Handling | `core/errors.ts` | Graceful exits, user-friendly messages |

## Development Workflows

### Project Dependencies
- Package Manager: pnpm (required version >=10.18.1)
- Core Libraries:
  - commander - CLI framework
  - chalk - Terminal styling
  - @clack/prompts - Interactive prompts and spinners
  - execa - Process execution
  - semver - Version management

### Setup & Development
```bash
pnpm install
```

### Adding New Core Modules
1. Create module in `src/core/` or `src/plugins/`
2. Export utilities following established patterns
3. Add to main SDK exports
4. Update types in `src/types/`

### Adding New Commands
1. Create file in `src/commands/`
2. Export default function with CommandContext
3. Use SDK utilities from context
4. Commands auto-register via file system scanning

### SDK Usage Examples

#### Simple CLI Creation
```typescript
import { createCLI } from "@caedonai/sdk/core";

await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool'
});
```

#### Tree-shakeable Imports (Recommended)
```typescript
import { exec, createLogger, intro, outro } from "@caedonai/sdk/core";
import { parseVersion, getVersionDiff } from "@caedonai/sdk/plugins";

async function upgradeProject() {
  const logger = createLogger();
  intro("Updating your project...");
  
  const diff = await getVersionDiff("v1.0.0", "v2.0.0");
  await exec('npm install');
  
  outro(`Upgraded successfully!`);
}
```

#### Shell Autocomplete Setup
```typescript
import { createCLI } from "@caedonai/sdk/core";

await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My CLI with autocomplete',
  autocomplete: {
    enabled: true,        // Enable shell completion
    autoInstall: true,    // Auto-install on first run
    shells: ['bash', 'zsh'], // Target specific shells
    enableFileCompletion: true // File/directory completion
  }
});
```

#### Manual Completion Management
```typescript
import { generateCompletion, installCompletion, detectShell } from "@caedonai/sdk/core";

// Generate completion script
const shell = await detectShell();
const script = generateCompletion(program, shell);

// Install completion programmatically
const result = await installCompletion(program, {
  shell: 'bash',
  global: false
});
```

#### Advanced CLI Control
```typescript
import { Command, registerCommands, createLogger } from "@caedonai/sdk/core";
import { isWorkspace } from "@caedonai/sdk/plugins";

const program = new Command();
const logger = createLogger();

// Conditional command loading
if (await isWorkspace()) {
  await registerCommands(program, { logger }, './workspace-commands');
} else {
  await registerCommands(program, { logger }, './single-project-commands');
}
```

## Integration Points & Context

- **CommandContext Interface**: Provides unified access to all SDK utilities
- **Plugin System**: Extensible with `.use(plugin)` for custom functionality  
- **Telemetry**: Optional analytics with clear opt-out mechanisms
- **Error Boundaries**: Comprehensive error handling with suggestions and recovery
- **State Management**: Persistent CLI session state for user preferences

## Target CLI Complexity Levels

The SDK scales from simple utilities to enterprise-grade tools:
- **Simple CLIs**: `npm init my-app` style tools
- **Advanced CLIs**: create-t3-app, Vercel CLI, next-forge equivalents  
- **Enterprise Tools**: Internal DevOps and project management CLIs

Each module is independent, typed, and composable for maximum flexibility and maintainability.

## Current Implementation Status

### Test Coverage & Performance
- **Total Tests**: 121 comprehensive tests passing (28 new autocomplete tests)
- **Test Types**: Unit tests, integration tests, tree-shaking validation, autocomplete functionality
- **Performance**: Optimized test suite (~17s for comprehensive Git integration tests)
- **Manual Testing**: `pnpm test-cli` for interactive development testing

### Bundle Optimization Results
- **Tree-shaking**: 97% size reduction for selective imports
- **Core Only**: 1.78KB (basic CLI functionality)
- **Plugins Only**: 1.33KB (specialized tools)  
- **Full SDK**: 71KB (complete feature set)

### Module Completion Status
- ✅ **Core**: Complete (exec, fs, prompts, logger, createCLI, registerCommands, autocomplete)
- ✅ **Shell Autocomplete**: Complete (bash, zsh, fish, PowerShell completion with auto-install)
- ✅ **Git Plugin**: Complete (repository operations, tagging, diffing)
- ✅ **Updater Plugin**: Complete (version management, update planning/application)
- ✅ **Workspace Plugin**: Complete (Nx, Lerna, Rush, Turborepo, pnpm, yarn, npm support)
- ✅ **Tree-shaking**: Complete (optimal bundle splitting and selective imports)