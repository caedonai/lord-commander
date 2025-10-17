# AI Agent Instructions for lord-commander-poc

This document provides essential context for AI agents working with the lord-commander-poc codebase.

## 📋 Task Completion Reminder
**After completing any coding task, always ask the user in brief sentences:**
1. "Should I update copilot-instructions.md to reflect this change?"
2. "Should I create tests for this implementation?"
3. "Should I check for edge cases or error scenarios?"

**Also remind to consider updating this file for:**
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
Essential utilities organized into logical subfolders:

#### Foundation (`src/core/foundation/`)
- `constants.ts` - Global constants, framework patterns, and configuration paths
- `errors.ts` - Error classes, cancellation handling, and recovery suggestions

#### Commands (`src/core/commands/`)
- `registerCommands.ts` - Automatic command discovery and registration with duplicate detection
- `autocomplete.ts` - Shell completion support (bash, zsh, fish, PowerShell)

#### Execution (`src/core/execution/`)
- `exec.ts` - Process execution wrapper (async, cancelable shell commands)
- `fs.ts` - File system utilities (safe file operations, directory management)

#### UI (`src/core/ui/`)
- `logger.ts` - Unified logging system with spinners and colors
- `prompts.ts` - Interactive prompt helpers using @clack/prompts
- `helpFormatter.ts` - CLI help message formatting and theming

#### Main (`src/core/`)
- `createCLI.ts` - Main CLI creation and initialization
- `index.ts` - Core module exports with tree-shaking optimization

### Plugin Modules (`src/plugins/`)
Extended functionality for specific use cases:
- `git.ts` - Repository management and Git operations (clone, commit, diff, tags)
- `updater.ts` - Version management and update system (semver, diffs, plans, application)
- `workspace.ts` - Monorepo workspace utilities (Nx, Lerna, Rush, pnpm, yarn workspaces)

### Command Modules (`src/commands/`)
Built-in commands that demonstrate SDK capabilities:
- `hello.ts` - Simple example command showcasing basic patterns
- `completion.ts` - Shell completion management (install, uninstall, generate, status)

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

### 7. Professional Version Management
- **Updater Plugin**: Semantic version parsing, diff analysis, update planning
- Git tag management, breaking change detection
- Safe update application with multiple strategies (merge, overwrite, selective)

### 8. Configurable Built-in Commands
- **Selective Command Loading**: Choose which SDK commands to include in your CLI
- **Default Configuration**: `completion: true`, `hello: false`, `version: false`
- **Flexible Options**: Enable/disable completion management, example commands, and advanced version tools
- **Tree-shaking Compatible**: Only bundles commands that are actually enabled
- **No Conflicts**: Built-in commands are separated from user command auto-discovery

### 9. Shell Autocomplete System
- **Multi-shell Support**: Comprehensive tab completion for bash, zsh, fish, and PowerShell
- **Auto-installation**: Seamless setup during CLI creation with `autoInstall: true`
- **Command Discovery**: Tab completion for all commands, options, and arguments
- **File Completion**: Automatic file/directory completion for command arguments
- **Manual Control**: Built-in `completion` command for install/uninstall/generate/status operations
- **Status Monitoring**: Real-time completion installation status checking with detailed diagnostics
- **Custom Logic**: Support for shell-specific customizations and completion behavior

### 10. Robust Command Registration System
- **Duplicate Detection**: Map-based tracking prevents command name conflicts
- **Smart Conflict Resolution**: Different paths throw detailed errors, same paths skip silently
- **State Management**: `resetCommandTracking()` for clean test isolation
- **Conditional Exclusion**: Built-in commands won't load conflicting user commands
- **Error Recovery**: Graceful handling of malformed command files

### 11. Comprehensive Security Validation System
- **Path Traversal Protection**: Blocks directory traversal attacks (`../../../..`, `../../../../etc`)
- **Absolute Path Protection**: Prevents access to system directories (`C:\Windows\System32`, `/etc/passwd`)
- **UNC Path Protection**: Blocks Windows network path attempts (`\\server\share`, `\\localhost\c$`)
- **Drive Root Protection**: Prevents access to drive roots (`C:\`, `D:\`, etc.)
- **Windows-specific Security**: Handles Windows UNC paths and drive access attempts
- **Security Error Messages**: Clear, detailed error messages for security violations
- **Working Directory Validation**: All command paths must be within the current working directory
- **Safe Relative Paths**: Allows legitimate relative paths like `./commands`, `src/commands`

### 12. Professional CLI Features
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
| File System Operations | `core/execution/fs.ts` | Copy templates, ensure directories, clean temp files |
| Process Execution | `core/execution/exec.ts` | `git init`, `npm install`, build commands |
| Interactive Setup | `core/ui/prompts.ts` | Project name, package manager selection |
| Shell Completion | `core/commands/autocomplete.ts` | Tab completion, status checking, multi-shell support |
| Structured Tasks | Command modules | `cloneRepo()`, `setupEnv()`, `installDeps()` |
| Environment Management | `plugins/config-loader.ts` | Auto-create `.env.local` from templates |
| Git Operations | `plugins/git.ts` | Initialize repos, commit, diff between versions |
| Error Handling | `core/foundation/errors.ts` | Graceful exits, user-friendly messages |
| Command Conflict Detection | `core/commands/registerCommands.ts` | Prevent duplicate commands, detailed error messages |

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
1. Create module in appropriate `src/core/` subfolder or `src/plugins/`
   - **Foundation**: Constants, errors, shared infrastructure (`src/core/foundation/`)
   - **Commands**: Command registration, autocomplete (`src/core/commands/`)
   - **Execution**: Process execution, file system (`src/core/execution/`)
   - **UI**: Logging, prompts, formatting (`src/core/ui/`)
2. Export utilities following established patterns
3. Add to relevant subfolder `index.ts` using `export * from './module.js'`
4. Update main `src/core/index.ts` if needed (usually auto-exported via subfolder)
5. Update types in `src/types/`
6. **Update tree-shaking tests**: Add new exports to `EXPECTED_EXPORTS` in `tree-shaking.test.ts`

### Adding New Commands
1. Create file in `src/commands/`
2. Export default function with CommandContext
3. Use SDK utilities from context
4. Commands auto-register via file system scanning

### Test Maintenance Best Practices
- **Tree-shaking Tests**: Use data-driven approach with `EXPECTED_EXPORTS` configuration
- **Export Validation**: Run `pnpm test tree-shaking` when adding new exports
- **Module Boundaries**: Ensure core/plugin separation is maintained in tests
- **Test Structure**: Prefer configuration-driven tests over hardcoded expect statements
- **Security Tests**: Use `security-multiple-paths.test.ts` as template for path validation scenarios
- **Command Path Tests**: `multiple-command-paths.test.ts` covers array support and conflict detection
- **Built-in Tests**: `createcli-builtin.test.ts` validates built-in command integration

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

#### Multiple Command Directories
```typescript
import { createCLI } from "@caedonai/sdk/core";

// Register commands from multiple directories
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'CLI with organized commands',
  commandsPath: [
    './src/commands/core',     // Core business commands
    './src/commands/admin',    // Administrative commands
    './src/commands/utils'     // Utility commands
  ]
});

// Single directory (backward compatible)
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'CLI with single command directory',
  commandsPath: './commands'
});

// Array with mixed existing/non-existing paths (safely handled)
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'CLI with mixed paths',
  commandsPath: [
    './src/commands',      // Loads commands if exists
    './optional-commands'  // Warns if doesn't exist, continues safely
  ]
});
```

#### Security Validation Examples
```typescript
import { createCLI } from "@caedonai/sdk/core";

// ✅ Safe relative paths (allowed)
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'CLI with safe paths',
  commandsPath: [
    './commands',              // Safe relative path
    'src/commands',            // Safe relative path
    './src/nested/commands'    // Safe nested relative path
  ]
});

// ❌ Unsafe paths (blocked with security errors)
try {
  await createCLI({
    name: 'my-cli',
    version: '1.0.0',
    description: 'CLI with unsafe paths',
    commandsPath: [
      '../../../etc',          // Path traversal - BLOCKED
      'C:\\Windows\\System32', // Absolute path - BLOCKED
      '\\\\server\\share',     // UNC path - BLOCKED
      '/etc/passwd'            // Absolute path - BLOCKED
    ]
  });
} catch (error) {
  // Error: Invalid or unsafe commands directory path: ../../../etc
  // Command paths must be within the current working directory for security.
}
```

#### Configurable Built-in Commands
```typescript
import { createCLI } from "@caedonai/sdk/core";

// Default: completion enabled, hello/version disabled
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'CLI with default built-ins'
});

// Custom configuration
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'CLI with custom built-ins',
  builtinCommands: {
    completion: true,    // Shell autocomplete management
    hello: true,         // Example command for learning
    version: false       // Advanced version tools (conflicts with -V)
  }
});

// Minimal CLI with no built-ins
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'Minimal CLI',
  builtinCommands: {
    completion: false,
    hello: false,
    version: false
  }
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
import { generateCompletion, installCompletion, detectShell, checkCompletionStatus } from "@caedonai/sdk/core";

// Generate completion script
const shell = await detectShell();
const script = generateCompletion(program, shell);

// Install completion programmatically
const result = await installCompletion(program, {
  shell: 'bash',
  global: false
});

// Check installation status
const status = await checkCompletionStatus(program, 'bash');
console.log(`Installed: ${status.installed}, Path: ${status.installationPath}`);
```

#### CLI Completion Commands
```bash
# Install completion for current shell
my-cli completion install

# Install completion globally
my-cli completion install --global

# Generate completion script for manual installation
my-cli completion generate --shell zsh --output ~/.zshrc

# Check completion status
my-cli completion status
my-cli completion status --shell bash

# Uninstall completion
my-cli completion uninstall
```

#### Advanced CLI Control
```typescript
import { Command, registerCommands, createLogger, resetCommandTracking } from "@caedonai/sdk/core";
import { isWorkspace } from "@caedonai/sdk/plugins";

const program = new Command();
const logger = createLogger();

// Reset tracking state for clean registration
resetCommandTracking();

// Conditional command loading
if (await isWorkspace()) {
  await registerCommands(program, { logger }, './workspace-commands');
} else {
  await registerCommands(program, { logger }, './single-project-commands');
}
```

#### Duplicate Detection and Conflict Resolution
```typescript
import { registerCommands, resetCommandTracking } from "@caedonai/sdk/core";

// Reset tracking state (useful for tests or re-initialization)
resetCommandTracking();

try {
  // Register commands from multiple sources
  await registerCommands(program, context, './commands');
  await registerCommands(program, context, './plugins/commands');
} catch (error) {
  // Handle command name conflicts
  if (error.message.includes('Command name conflict')) {
    console.error('Conflict detected:', error.message);
    // Detailed error shows conflicting paths and suggestions
  }
}

// Safe to run multiple times on same directory (silently skipped)
await registerCommands(program, context, './commands');
await registerCommands(program, context, './commands'); // No error, skipped
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
- **Total Tests**: 204 comprehensive tests passing (10 tree-shaking tests, 6 duplicate detection tests, 33 autocomplete tests, 14 built-in exclusion tests, 12 security validation tests, 18 createCLI built-in tests, 5 multiple command paths tests)
- **Test Types**: Unit tests, integration tests, data-driven tree-shaking validation, autocomplete functionality, duplicate detection, conflict resolution, comprehensive security validation
- **Security Test Coverage**: 12 comprehensive security tests covering path traversal, absolute paths, UNC paths, edge cases, and Windows-specific attacks
- **Performance**: Optimized test suite (~18s for comprehensive Git integration tests)
- **Manual Testing**: `pnpm test-cli` for interactive development testing
- **Tree-shaking Tests**: Data-driven approach with 90% reduction in test boilerplate

### Bundle Optimization Results
- **Tree-shaking**: 97% size reduction for selective imports
- **Core Only**: 1.78KB (basic CLI functionality)
- **Plugins Only**: 1.33KB (specialized tools)  
- **Full SDK**: 71KB (complete feature set)

### Module Completion Status
- ✅ **Core**: Complete (exec, fs, prompts, logger, createCLI, registerCommands with duplicate detection, autocomplete)
- ✅ **Multiple Command Paths**: Complete (string | string[] support, array iteration, security validation integration)
- ✅ **Security Validation**: Complete (path traversal protection, absolute path blocking, UNC path blocking, Windows-specific security)
- ✅ **Shell Autocomplete**: Complete (bash, zsh, fish, PowerShell completion with auto-install)
- ✅ **Built-in Commands**: Complete (configurable completion, hello, version commands with conditional exclusion)
- ✅ **Duplicate Detection**: Complete (command conflict detection, state management, error recovery)
- ✅ **Git Plugin**: Complete (repository operations, tagging, diffing)
- ✅ **Updater Plugin**: Complete (version management, update planning/application)
- ✅ **Workspace Plugin**: Complete (Nx, Lerna, Rush, Turborepo, pnpm, yarn, npm support)
- ✅ **Tree-shaking**: Complete (optimal bundle splitting, selective imports, data-driven test validation)

### Recent Major Enhancements

#### Multiple Command Paths & Security Validation System (Latest)
- **Multiple Directory Support**: Enhanced `commandsPath` to support both `string` and `string[]` for organizing commands across directories
- **Security-First Design**: Comprehensive path validation prevents directory traversal attacks (`../../../..`) and absolute path access
- **Windows Security**: Specialized protection against UNC paths (`\\server\share`) and drive root access (`C:\`, `D:\`)
- **Backward Compatibility**: Single string paths continue to work seamlessly alongside new array support
- **Error Recovery**: Mixed arrays with safe/unsafe paths handled gracefully with clear error messages
- **Test Coverage**: 12 comprehensive security tests covering all attack vectors and edge cases
- **Production Ready**: All 204 tests passing with robust security validation in place

#### Data-Driven Tree-shaking Test System
- **Maintainable Configuration**: Replaced 129 lines of hardcoded expect statements with organized data structure
- **90% Boilerplate Reduction**: Tests generated dynamically from `EXPECTED_EXPORTS` configuration object
- **Accurate Export Validation**: Tests match exactly what's exported from built modules (71 core, 37 plugin exports)
- **Category Organization**: Exports grouped by logical categories (constants, UI, CLI, autocomplete, etc.)
- **Better Error Messages**: Each test includes category context and proper type checking
- **Future-proof Scalability**: Adding new exports only requires updating the data structure
- **Comprehensive Coverage**: Module boundary validation, tree-shaking compatibility, selective imports

#### Core Module Reorganization
- **Logical Folder Structure**: Reorganized `src/core/` into foundation/, commands/, execution/, and ui/ subfolders
- **Improved Scalability**: Clear separation of concerns for 30+ future modules
- **Maintained Tree-shaking**: `export *` patterns preserve optimal bundling performance
- **Updated Import Paths**: All 25+ files updated to use new folder structure
- **Index File Strategy**: Each subfolder has its own index.ts for clean exports
- **Backward Compatibility**: External API unchanged, only internal organization improved

#### Duplicate Detection & Conflict Resolution System
- **Map-based Tracking**: Comprehensive command registration state management
- **Smart Conflict Detection**: Differentiates between same-path duplicates (safe) vs cross-path conflicts (error)
- **Detailed Error Messages**: Shows conflicting file paths, source directories, and resolution guidance
- **Test Isolation**: `resetCommandTracking()` ensures clean state between test runs
- **Error Recovery**: Graceful handling of malformed command files with proper logging
- **Backward Compatibility**: Existing functionality completely preserved

#### Key Conflict Scenarios Handled:
1. **Same Path Duplication**: Silent skip (prevents crashes on re-runs)
2. **Cross-Path Conflicts**: Detailed error with conflicting file information
3. **Mixed Scenarios**: Partial registration with conflict reporting
4. **Malformed Files**: Graceful error handling with appropriate logging
5. **Built-in Exclusion**: Conditional loading prevents user/built-in conflicts
6. **State Reset**: Clean tracking state for testing and re-initialization