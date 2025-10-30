# Type Definitions

No description available

**Module Path**: `src/types`  
**Total Exports**: 4

## 📋 Exports Overview

| Type | Count | Examples |
|------|-------|----------|
| **interface** | 4 | `CLIConfig`, `CLIPlugin`, `CommandContext`, ... |

## 📖 Detailed Documentation

## CLIConfig

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management / export interface CommandContext { // Core utilities fs?: any;      // File system operations (implemented) execa?: any;   // Process execution (implemented) logger: any;   // Logging and spinners (implemented) prompts: any;  // Interactive user input (implemented) temp?: any;    // Temporary workspace management (to be implemented) // Plugin utilities (all optional - only available when explicitly enabled) git?: any;     // Git operations (implemented, plugin) config?: any;  // Configuration management (to be implemented) telemetry?: any; // Analytics and tracking (to be implemented) // Configuration and state cwd?: string;  // Current working directory packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'; } /** Plugin interface for extending CLI functionality / export interface CLIPlugin { name: string; version?: string; setup?(context: CommandContext): Promise<void> | void; teardown?(context: CommandContext): Promise<void> | void; } /** Configuration for the CLI SDK

---

## CLIPlugin

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management / export interface CommandContext { // Core utilities fs?: any;      // File system operations (implemented) execa?: any;   // Process execution (implemented) logger: any;   // Logging and spinners (implemented) prompts: any;  // Interactive user input (implemented) temp?: any;    // Temporary workspace management (to be implemented) // Plugin utilities (all optional - only available when explicitly enabled) git?: any;     // Git operations (implemented, plugin) config?: any;  // Configuration management (to be implemented) telemetry?: any; // Analytics and tracking (to be implemented) // Configuration and state cwd?: string;  // Current working directory packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'; } /** Plugin interface for extending CLI functionality

---

## CommandContext

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management

---

## CreateCliOptions

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

## 📁 Source Files

- [`src/types/cli.ts`](../../../src/types/cli.ts)

---

*Generated on 2025-10-29T21:38:06.356Z*
