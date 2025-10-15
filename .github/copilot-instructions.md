# AI Agent Instructions for lord-commander-poc

This document provides essential context for AI agents working with the lord-commander-poc codebase.

## Project Overview

This is a CLI tool framework built with TypeScript, utilizing Commander.js for command-line argument parsing. The project follows a modular architecture for creating extensible command-line applications.

## Core Architecture

### Key Components

1. **CLI Core (`src/cli/`)**
   - `createCLI.ts` - Main factory function for initializing the CLI
   - `registerCommands.ts` - Dynamic command registration system

2. **Commands (`src/commands/`)**
   - Each command is a standalone module
   - Commands follow a consistent pattern (see example below)

3. **Utilities (`src/utils/`)**
   - `logger.ts` - Consistent logging with symbols and colors
   - `config.ts` - Configuration management
   - `prompts.ts` - Interactive user input and loading indicators

## Key Patterns

### Command Definition Pattern
Commands should follow this structure (from `src/commands/hello.ts`):
```typescript
export default function(program: Command, { logger, config }: CommandContext) {
  program
    .command('name')
    .description('command description')
    .argument('[args]', 'argument description')
    .option('-f, --flag', 'flag description')
    .action((args, options) => {
      // Command implementation
    });
}
```

### Logging Standards
Use the provided `logger` instance with appropriate severity levels:
- `logger.info()` - General information
- `logger.success()` - Successful operations
- `logger.warn()` - Warnings
- `logger.error()` - Errors

### Project Dependencies
- Package Manager: pnpm (required version >=10.18.1)
- Key Libraries:
  - commander - CLI framework
  - chalk - Terminal styling
  - @clack/prompts - Interactive prompts and spinners

## Developer Workflows

### Setup
```bash
pnpm install
```

### Development
- Commands are automatically loaded from `src/commands/`
- TypeScript configuration is in `tsconfig.json`
- Tests are written using Vitest

## Common Tasks
1. Adding a new command:
   - Create a new file in `src/commands/`
   - Export a default function following the command pattern
   - Command will be automatically registered

2. Using the logger:
   ```typescript
   import { logger } from '../utils/logger';
   logger.info('Informational message');
   logger.success('Operation completed');
   ```

## Integration Points
- Commands can access shared context through the `CommandContext` interface
- Configuration is loaded automatically and passed to commands
- External tools integration should use the prompts.spinner utility for progress indication