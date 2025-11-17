# Type Definitions

No description available

**Module Path**: `src/types`  
**Total Exports**: 51

## 📋 Exports Overview

| Type | Count | Examples |
|------|-------|----------|
| **interface** | 12 | `CLIConfig`, `CLIPlugin`, `CommandContext`, ... |
| **type** | 36 | `CommandArguments`, `CommandOptions`, `CompletionData`, ... |
| **function** | 3 | `isConfigValue`, `isJsonValue`, `isSanitizableValue` |

## 📖 Detailed Documentation

## CLIConfig

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management / export interface CommandContext { // Core utilities fs?: FSModule; // File system operations (implemented) execa?: ExecaModule; // Process execution (implemented) logger: Logger; // Logging and spinners (implemented) prompts: PromptsModule; // Interactive user input (implemented) temp?: TempModule; // Temporary workspace management (to be implemented) // Plugin utilities (all optional - only available when explicitly enabled) git?: GitModule; // Git operations (implemented, plugin) config?: import('../utils/config.js').ConfigType; // Configuration data (loaded config object) telemetry?: TelemetryModule; // Analytics and tracking (to be implemented) // Configuration and state cwd?: string; // Current working directory packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'; } /** Plugin interface for extending CLI functionality / export interface CLIPlugin { name: string; version?: string; setup?(context: CommandContext): Promise<void> | void; teardown?(context: CommandContext): Promise<void> | void; } /** Configuration for the CLI SDK

---

## CLIPlugin

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management / export interface CommandContext { // Core utilities fs?: FSModule; // File system operations (implemented) execa?: ExecaModule; // Process execution (implemented) logger: Logger; // Logging and spinners (implemented) prompts: PromptsModule; // Interactive user input (implemented) temp?: TempModule; // Temporary workspace management (to be implemented) // Plugin utilities (all optional - only available when explicitly enabled) git?: GitModule; // Git operations (implemented, plugin) config?: import('../utils/config.js').ConfigType; // Configuration data (loaded config object) telemetry?: TelemetryModule; // Analytics and tracking (to be implemented) // Configuration and state cwd?: string; // Current working directory packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'; } /** Plugin interface for extending CLI functionality

---

## CommandArguments

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## CommandContext

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management

---

## CommandOptions

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## CompletionData

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ConfigArray

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ConfigModule

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management / export interface CommandContext { // Core utilities fs?: FSModule; // File system operations (implemented) execa?: ExecaModule; // Process execution (implemented) logger: Logger; // Logging and spinners (implemented) prompts: PromptsModule; // Interactive user input (implemented) temp?: TempModule; // Temporary workspace management (to be implemented) // Plugin utilities (all optional - only available when explicitly enabled) git?: GitModule; // Git operations (implemented, plugin) config?: import('../utils/config.js').ConfigType; // Configuration data (loaded config object) telemetry?: TelemetryModule; // Analytics and tracking (to be implemented) // Configuration and state cwd?: string; // Current working directory packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'; } /** Plugin interface for extending CLI functionality / export interface CLIPlugin { name: string; version?: string; setup?(context: CommandContext): Promise<void> | void; teardown?(context: CommandContext): Promise<void> | void; } /** Configuration for the CLI SDK / export interface CLIConfig { theme?: { primary?: string; success?: string; warning?: string; error?: string; }; telemetry?: { enabled: boolean; endpoint?: string; }; verbose?: boolean; } /** Configuration module interface for CommandContext

---

## ConfigObject

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ConfigValue

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## CreateCliOptions

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

---

## ErrorContext

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ErrorHandler

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## EventListener

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## EventMap

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ExecOptions

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## FileSystemData

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## FileSystemOperations

**Type**: `interface`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

Common utility types for the lord-commander-poc project These types replace `any` usage with more specific, type-safe alternatives / // Generic utility types export type JsonValue = string | number | boolean | null | JsonObject | JsonArray; export type JsonObject = { [key: string]: JsonValue }; export type JsonArray = JsonValue[]; // Error handling types export type ErrorContext = Record<string, JsonValue>; export type ErrorHandler = (error: Error) => void | Promise<void>; // Configuration types export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray; export type ConfigObject = { [key: string]: ConfigValue }; export type ConfigArray = ConfigValue[]; // File system types export type FileSystemData = JsonValue; export type PackageJsonExports = Record<string, string | { [key: string]: string }>; // Memory sanitization types export type SanitizableValue = | string | number | boolean | null | undefined | SanitizableObject | SanitizableArray | Date | RegExp | Buffer | Error | Function; export type SanitizableObject = { [key: string]: SanitizableValue }; export type SanitizableArray = SanitizableValue[]; // Process/execution types export type ProcessEnv = Record<string, string | undefined>; export type ExecOptions = { cwd?: string; env?: ProcessEnv; shell?: boolean | string; timeout?: number; } & Record<string, ConfigValue>; // Test types export type TestSpy = { mockImplementation: (fn: (...args: unknown[]) => unknown) => void; mockReturnValue: (value: unknown) => void; [key: string]: unknown; }; export type MockFunction< T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown, > = { (...args: Parameters<T>): ReturnType<T>; mockImplementation: (fn: T) => void; mockReturnValue: (value: ReturnType<T>) => void; [key: string]: unknown; }; // UI/Logger types export type LoggerMethod = (...args: (string | number | boolean)[]) => void; export type PromptMethod = (options: { message: string; [key: string]: ConfigValue; }) => Promise<unknown>; // Command types export type CommandOptions = Record<string, ConfigValue>; export type CommandArguments = string[]; // Generic object types with constraints export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>; export type StrictRecord<K extends string | number | symbol, T> = Record<K, T>; // Event/callback types export type EventListener = (...args: unknown[]) => void | Promise<void>; export type EventMap = Record<string, EventListener>; // Validation types export type ValidationResult<T = unknown> = { isValid: boolean; value?: T; errors?: string[]; }; // HTTP/Network types (if needed) export type HttpHeaders = Record<string, string>; export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'; // Shell/completion types export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd'; export type CompletionData = { name: string; description?: string; options?: string[]; } & Record<string, ConfigValue>; // Plugin types export type PluginOptions = ConfigObject; export type PluginResult<T = ConfigValue> = { success: boolean; result?: T; error?: string; }; // Workspace types export type WorkspacePackage = { name: string; version: string; path: string; dependencies?: Record<string, string>; } & Record<string, ConfigValue>; // Git types export type GitTag = { name: string; hash: string; date: Date; message?: string; }; export type GitCommit = { hash: string; message: string; author: string; date: Date; } & Record<string, ConfigValue>; // Utility type for gradual migration from any export type TODO_REPLACE_ANY = unknown; /** File system operations interface

---

## GitCommit

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## GitOperations

**Type**: `interface`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

Common utility types for the lord-commander-poc project These types replace `any` usage with more specific, type-safe alternatives / // Generic utility types export type JsonValue = string | number | boolean | null | JsonObject | JsonArray; export type JsonObject = { [key: string]: JsonValue }; export type JsonArray = JsonValue[]; // Error handling types export type ErrorContext = Record<string, JsonValue>; export type ErrorHandler = (error: Error) => void | Promise<void>; // Configuration types export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray; export type ConfigObject = { [key: string]: ConfigValue }; export type ConfigArray = ConfigValue[]; // File system types export type FileSystemData = JsonValue; export type PackageJsonExports = Record<string, string | { [key: string]: string }>; // Memory sanitization types export type SanitizableValue = | string | number | boolean | null | undefined | SanitizableObject | SanitizableArray | Date | RegExp | Buffer | Error | Function; export type SanitizableObject = { [key: string]: SanitizableValue }; export type SanitizableArray = SanitizableValue[]; // Process/execution types export type ProcessEnv = Record<string, string | undefined>; export type ExecOptions = { cwd?: string; env?: ProcessEnv; shell?: boolean | string; timeout?: number; } & Record<string, ConfigValue>; // Test types export type TestSpy = { mockImplementation: (fn: (...args: unknown[]) => unknown) => void; mockReturnValue: (value: unknown) => void; [key: string]: unknown; }; export type MockFunction< T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown, > = { (...args: Parameters<T>): ReturnType<T>; mockImplementation: (fn: T) => void; mockReturnValue: (value: ReturnType<T>) => void; [key: string]: unknown; }; // UI/Logger types export type LoggerMethod = (...args: (string | number | boolean)[]) => void; export type PromptMethod = (options: { message: string; [key: string]: ConfigValue; }) => Promise<unknown>; // Command types export type CommandOptions = Record<string, ConfigValue>; export type CommandArguments = string[]; // Generic object types with constraints export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>; export type StrictRecord<K extends string | number | symbol, T> = Record<K, T>; // Event/callback types export type EventListener = (...args: unknown[]) => void | Promise<void>; export type EventMap = Record<string, EventListener>; // Validation types export type ValidationResult<T = unknown> = { isValid: boolean; value?: T; errors?: string[]; }; // HTTP/Network types (if needed) export type HttpHeaders = Record<string, string>; export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'; // Shell/completion types export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd'; export type CompletionData = { name: string; description?: string; options?: string[]; } & Record<string, ConfigValue>; // Plugin types export type PluginOptions = ConfigObject; export type PluginResult<T = ConfigValue> = { success: boolean; result?: T; error?: string; }; // Workspace types export type WorkspacePackage = { name: string; version: string; path: string; dependencies?: Record<string, string>; } & Record<string, ConfigValue>; // Git types export type GitTag = { name: string; hash: string; date: Date; message?: string; }; export type GitCommit = { hash: string; message: string; author: string; date: Date; } & Record<string, ConfigValue>; // Utility type for gradual migration from any export type TODO_REPLACE_ANY = unknown; /** File system operations interface / export interface FileSystemOperations { exists: (filePath: string) => boolean; stat: (filePath: string) => Promise<unknown>; ensureDir: (dirPath: string) => Promise<void>; remove: (targetPath: string, options?: { recursive?: boolean }) => Promise<void>; readFile: (filePath: string, encoding?: string) => Promise<string>; writeFile: (filePath: string, data: string, encoding?: string) => Promise<void>; readJSON: <T = JsonValue>(filePath: string) => Promise<T>; writeJSON: (filePath: string, data: JsonValue, options?: unknown) => Promise<void>; copyFile: (src: string, dest: string, options?: unknown) => Promise<void>; copyDir: (src: string, dest: string, options?: unknown) => Promise<void>; copy: (src: string, dest: string, options?: unknown) => Promise<void>; readDir: (dirPath: string, options?: unknown) => Promise<unknown[]>; findFiles: (dirPath: string, pattern: string, options?: unknown) => Promise<string[]>; cleanDir: (dirPath: string) => Promise<void>; getSize: (targetPath: string) => Promise<number>; move: (src: string, dest: string, options?: unknown) => Promise<void>; } /** Process execution interface / export interface ProcessExecution { (command: string, args?: string[], options?: unknown): Promise<unknown>; sync: (command: string, args?: string[], options?: unknown) => unknown; stream: (command: string, args?: string[], options?: unknown) => Promise<unknown>; withOutput: (command: string, args?: string[], options?: unknown) => Promise<unknown>; commandExists: (command: string) => Promise<boolean>; detectPackageManager: (cwd?: string) => Promise<unknown>; runPackageManager: ( action: string, packageOrScript?: string, options?: unknown ) => Promise<unknown>; git: (subcommand: string, args?: string[], options?: unknown) => Promise<unknown>; createCancellable: () => unknown; sequence: (commands: unknown[], options?: unknown) => Promise<unknown[]>; parallel: (commands: unknown[], options?: unknown) => Promise<unknown[]>; } /** Logger interface / export interface LoggerInterface { intro: (message: string, showBrand?: boolean) => void; outro: (message: string) => void; info: (message: string) => void; success: (message: string) => void; warn: (message: string) => void; error: (message: string | Error) => void; debug: (message: string, data?: unknown) => void; verbose: (message: string, data?: unknown) => void; spinner: (message: string) => unknown; enableVerbose: () => void; enableDebug: () => void; setLevel: (level: string) => void; step: (message: string, stepNumber?: number, totalSteps?: number) => void; note: (message: string, title?: string) => void; log: (message: string) => void; table: (data: Record<string, string | number | boolean>) => void; stopAllSpinners: (message?: string) => void; } /** Prompts interface / export interface PromptsInterface { text: (message: string, options?: unknown) => Promise<string>; confirm: (message: string, options?: unknown) => Promise<boolean>; select: <T = string>(message: string, options: unknown) => Promise<T>; multiselect: <T = string>(message: string, options: unknown) => Promise<T[]>; enhancedText: (options: unknown) => Promise<string>; enhancedConfirm: (options: unknown) => Promise<boolean>; enhancedSelect: <T = string>(options: unknown) => Promise<T>; intro: (message: string, options?: unknown) => void; outro: (message: string, options?: unknown) => void; printSeparator: (title?: string, style?: string) => void; printSection: (title: string, content?: string) => void; printTaskStart: (task: string) => void; printTaskComplete: (task: string, success?: boolean) => void; printSpacing: (lines?: number) => void; setTheme: (theme: unknown) => void; getTheme: () => unknown; PromptFlow: new (title: string, totalSteps: number) => unknown; } /** Git operations interface

---

## GitTag

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## HttpHeaders

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## HttpMethod

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## isConfigValue

**Type**: `function`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

```typescript
export function isConfigValue(value: unknown): value is ConfigValue
```

---

## isJsonValue

**Type**: `function`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

```typescript
export function isJsonValue(value: unknown): value is JsonValue
```

---

## isSanitizableValue

**Type**: `function`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

```typescript
export function isSanitizableValue(value: unknown): value is SanitizableValue
```

---

## JsonArray

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## JsonObject

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## JsonValue

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## LoggerInterface

**Type**: `interface`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

Common utility types for the lord-commander-poc project These types replace `any` usage with more specific, type-safe alternatives / // Generic utility types export type JsonValue = string | number | boolean | null | JsonObject | JsonArray; export type JsonObject = { [key: string]: JsonValue }; export type JsonArray = JsonValue[]; // Error handling types export type ErrorContext = Record<string, JsonValue>; export type ErrorHandler = (error: Error) => void | Promise<void>; // Configuration types export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray; export type ConfigObject = { [key: string]: ConfigValue }; export type ConfigArray = ConfigValue[]; // File system types export type FileSystemData = JsonValue; export type PackageJsonExports = Record<string, string | { [key: string]: string }>; // Memory sanitization types export type SanitizableValue = | string | number | boolean | null | undefined | SanitizableObject | SanitizableArray | Date | RegExp | Buffer | Error | Function; export type SanitizableObject = { [key: string]: SanitizableValue }; export type SanitizableArray = SanitizableValue[]; // Process/execution types export type ProcessEnv = Record<string, string | undefined>; export type ExecOptions = { cwd?: string; env?: ProcessEnv; shell?: boolean | string; timeout?: number; } & Record<string, ConfigValue>; // Test types export type TestSpy = { mockImplementation: (fn: (...args: unknown[]) => unknown) => void; mockReturnValue: (value: unknown) => void; [key: string]: unknown; }; export type MockFunction< T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown, > = { (...args: Parameters<T>): ReturnType<T>; mockImplementation: (fn: T) => void; mockReturnValue: (value: ReturnType<T>) => void; [key: string]: unknown; }; // UI/Logger types export type LoggerMethod = (...args: (string | number | boolean)[]) => void; export type PromptMethod = (options: { message: string; [key: string]: ConfigValue; }) => Promise<unknown>; // Command types export type CommandOptions = Record<string, ConfigValue>; export type CommandArguments = string[]; // Generic object types with constraints export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>; export type StrictRecord<K extends string | number | symbol, T> = Record<K, T>; // Event/callback types export type EventListener = (...args: unknown[]) => void | Promise<void>; export type EventMap = Record<string, EventListener>; // Validation types export type ValidationResult<T = unknown> = { isValid: boolean; value?: T; errors?: string[]; }; // HTTP/Network types (if needed) export type HttpHeaders = Record<string, string>; export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'; // Shell/completion types export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd'; export type CompletionData = { name: string; description?: string; options?: string[]; } & Record<string, ConfigValue>; // Plugin types export type PluginOptions = ConfigObject; export type PluginResult<T = ConfigValue> = { success: boolean; result?: T; error?: string; }; // Workspace types export type WorkspacePackage = { name: string; version: string; path: string; dependencies?: Record<string, string>; } & Record<string, ConfigValue>; // Git types export type GitTag = { name: string; hash: string; date: Date; message?: string; }; export type GitCommit = { hash: string; message: string; author: string; date: Date; } & Record<string, ConfigValue>; // Utility type for gradual migration from any export type TODO_REPLACE_ANY = unknown; /** File system operations interface / export interface FileSystemOperations { exists: (filePath: string) => boolean; stat: (filePath: string) => Promise<unknown>; ensureDir: (dirPath: string) => Promise<void>; remove: (targetPath: string, options?: { recursive?: boolean }) => Promise<void>; readFile: (filePath: string, encoding?: string) => Promise<string>; writeFile: (filePath: string, data: string, encoding?: string) => Promise<void>; readJSON: <T = JsonValue>(filePath: string) => Promise<T>; writeJSON: (filePath: string, data: JsonValue, options?: unknown) => Promise<void>; copyFile: (src: string, dest: string, options?: unknown) => Promise<void>; copyDir: (src: string, dest: string, options?: unknown) => Promise<void>; copy: (src: string, dest: string, options?: unknown) => Promise<void>; readDir: (dirPath: string, options?: unknown) => Promise<unknown[]>; findFiles: (dirPath: string, pattern: string, options?: unknown) => Promise<string[]>; cleanDir: (dirPath: string) => Promise<void>; getSize: (targetPath: string) => Promise<number>; move: (src: string, dest: string, options?: unknown) => Promise<void>; } /** Process execution interface / export interface ProcessExecution { (command: string, args?: string[], options?: unknown): Promise<unknown>; sync: (command: string, args?: string[], options?: unknown) => unknown; stream: (command: string, args?: string[], options?: unknown) => Promise<unknown>; withOutput: (command: string, args?: string[], options?: unknown) => Promise<unknown>; commandExists: (command: string) => Promise<boolean>; detectPackageManager: (cwd?: string) => Promise<unknown>; runPackageManager: ( action: string, packageOrScript?: string, options?: unknown ) => Promise<unknown>; git: (subcommand: string, args?: string[], options?: unknown) => Promise<unknown>; createCancellable: () => unknown; sequence: (commands: unknown[], options?: unknown) => Promise<unknown[]>; parallel: (commands: unknown[], options?: unknown) => Promise<unknown[]>; } /** Logger interface

---

## LoggerMethod

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## MockFunction

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## PackageJsonExports

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## PartialRecord

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## PluginOptions

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## PluginResult

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ProcessEnv

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ProcessExecution

**Type**: `interface`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

Common utility types for the lord-commander-poc project These types replace `any` usage with more specific, type-safe alternatives / // Generic utility types export type JsonValue = string | number | boolean | null | JsonObject | JsonArray; export type JsonObject = { [key: string]: JsonValue }; export type JsonArray = JsonValue[]; // Error handling types export type ErrorContext = Record<string, JsonValue>; export type ErrorHandler = (error: Error) => void | Promise<void>; // Configuration types export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray; export type ConfigObject = { [key: string]: ConfigValue }; export type ConfigArray = ConfigValue[]; // File system types export type FileSystemData = JsonValue; export type PackageJsonExports = Record<string, string | { [key: string]: string }>; // Memory sanitization types export type SanitizableValue = | string | number | boolean | null | undefined | SanitizableObject | SanitizableArray | Date | RegExp | Buffer | Error | Function; export type SanitizableObject = { [key: string]: SanitizableValue }; export type SanitizableArray = SanitizableValue[]; // Process/execution types export type ProcessEnv = Record<string, string | undefined>; export type ExecOptions = { cwd?: string; env?: ProcessEnv; shell?: boolean | string; timeout?: number; } & Record<string, ConfigValue>; // Test types export type TestSpy = { mockImplementation: (fn: (...args: unknown[]) => unknown) => void; mockReturnValue: (value: unknown) => void; [key: string]: unknown; }; export type MockFunction< T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown, > = { (...args: Parameters<T>): ReturnType<T>; mockImplementation: (fn: T) => void; mockReturnValue: (value: ReturnType<T>) => void; [key: string]: unknown; }; // UI/Logger types export type LoggerMethod = (...args: (string | number | boolean)[]) => void; export type PromptMethod = (options: { message: string; [key: string]: ConfigValue; }) => Promise<unknown>; // Command types export type CommandOptions = Record<string, ConfigValue>; export type CommandArguments = string[]; // Generic object types with constraints export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>; export type StrictRecord<K extends string | number | symbol, T> = Record<K, T>; // Event/callback types export type EventListener = (...args: unknown[]) => void | Promise<void>; export type EventMap = Record<string, EventListener>; // Validation types export type ValidationResult<T = unknown> = { isValid: boolean; value?: T; errors?: string[]; }; // HTTP/Network types (if needed) export type HttpHeaders = Record<string, string>; export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'; // Shell/completion types export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd'; export type CompletionData = { name: string; description?: string; options?: string[]; } & Record<string, ConfigValue>; // Plugin types export type PluginOptions = ConfigObject; export type PluginResult<T = ConfigValue> = { success: boolean; result?: T; error?: string; }; // Workspace types export type WorkspacePackage = { name: string; version: string; path: string; dependencies?: Record<string, string>; } & Record<string, ConfigValue>; // Git types export type GitTag = { name: string; hash: string; date: Date; message?: string; }; export type GitCommit = { hash: string; message: string; author: string; date: Date; } & Record<string, ConfigValue>; // Utility type for gradual migration from any export type TODO_REPLACE_ANY = unknown; /** File system operations interface / export interface FileSystemOperations { exists: (filePath: string) => boolean; stat: (filePath: string) => Promise<unknown>; ensureDir: (dirPath: string) => Promise<void>; remove: (targetPath: string, options?: { recursive?: boolean }) => Promise<void>; readFile: (filePath: string, encoding?: string) => Promise<string>; writeFile: (filePath: string, data: string, encoding?: string) => Promise<void>; readJSON: <T = JsonValue>(filePath: string) => Promise<T>; writeJSON: (filePath: string, data: JsonValue, options?: unknown) => Promise<void>; copyFile: (src: string, dest: string, options?: unknown) => Promise<void>; copyDir: (src: string, dest: string, options?: unknown) => Promise<void>; copy: (src: string, dest: string, options?: unknown) => Promise<void>; readDir: (dirPath: string, options?: unknown) => Promise<unknown[]>; findFiles: (dirPath: string, pattern: string, options?: unknown) => Promise<string[]>; cleanDir: (dirPath: string) => Promise<void>; getSize: (targetPath: string) => Promise<number>; move: (src: string, dest: string, options?: unknown) => Promise<void>; } /** Process execution interface

---

## PromptMethod

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## PromptsInterface

**Type**: `interface`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

Common utility types for the lord-commander-poc project These types replace `any` usage with more specific, type-safe alternatives / // Generic utility types export type JsonValue = string | number | boolean | null | JsonObject | JsonArray; export type JsonObject = { [key: string]: JsonValue }; export type JsonArray = JsonValue[]; // Error handling types export type ErrorContext = Record<string, JsonValue>; export type ErrorHandler = (error: Error) => void | Promise<void>; // Configuration types export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray; export type ConfigObject = { [key: string]: ConfigValue }; export type ConfigArray = ConfigValue[]; // File system types export type FileSystemData = JsonValue; export type PackageJsonExports = Record<string, string | { [key: string]: string }>; // Memory sanitization types export type SanitizableValue = | string | number | boolean | null | undefined | SanitizableObject | SanitizableArray | Date | RegExp | Buffer | Error | Function; export type SanitizableObject = { [key: string]: SanitizableValue }; export type SanitizableArray = SanitizableValue[]; // Process/execution types export type ProcessEnv = Record<string, string | undefined>; export type ExecOptions = { cwd?: string; env?: ProcessEnv; shell?: boolean | string; timeout?: number; } & Record<string, ConfigValue>; // Test types export type TestSpy = { mockImplementation: (fn: (...args: unknown[]) => unknown) => void; mockReturnValue: (value: unknown) => void; [key: string]: unknown; }; export type MockFunction< T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown, > = { (...args: Parameters<T>): ReturnType<T>; mockImplementation: (fn: T) => void; mockReturnValue: (value: ReturnType<T>) => void; [key: string]: unknown; }; // UI/Logger types export type LoggerMethod = (...args: (string | number | boolean)[]) => void; export type PromptMethod = (options: { message: string; [key: string]: ConfigValue; }) => Promise<unknown>; // Command types export type CommandOptions = Record<string, ConfigValue>; export type CommandArguments = string[]; // Generic object types with constraints export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>; export type StrictRecord<K extends string | number | symbol, T> = Record<K, T>; // Event/callback types export type EventListener = (...args: unknown[]) => void | Promise<void>; export type EventMap = Record<string, EventListener>; // Validation types export type ValidationResult<T = unknown> = { isValid: boolean; value?: T; errors?: string[]; }; // HTTP/Network types (if needed) export type HttpHeaders = Record<string, string>; export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'; // Shell/completion types export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd'; export type CompletionData = { name: string; description?: string; options?: string[]; } & Record<string, ConfigValue>; // Plugin types export type PluginOptions = ConfigObject; export type PluginResult<T = ConfigValue> = { success: boolean; result?: T; error?: string; }; // Workspace types export type WorkspacePackage = { name: string; version: string; path: string; dependencies?: Record<string, string>; } & Record<string, ConfigValue>; // Git types export type GitTag = { name: string; hash: string; date: Date; message?: string; }; export type GitCommit = { hash: string; message: string; author: string; date: Date; } & Record<string, ConfigValue>; // Utility type for gradual migration from any export type TODO_REPLACE_ANY = unknown; /** File system operations interface / export interface FileSystemOperations { exists: (filePath: string) => boolean; stat: (filePath: string) => Promise<unknown>; ensureDir: (dirPath: string) => Promise<void>; remove: (targetPath: string, options?: { recursive?: boolean }) => Promise<void>; readFile: (filePath: string, encoding?: string) => Promise<string>; writeFile: (filePath: string, data: string, encoding?: string) => Promise<void>; readJSON: <T = JsonValue>(filePath: string) => Promise<T>; writeJSON: (filePath: string, data: JsonValue, options?: unknown) => Promise<void>; copyFile: (src: string, dest: string, options?: unknown) => Promise<void>; copyDir: (src: string, dest: string, options?: unknown) => Promise<void>; copy: (src: string, dest: string, options?: unknown) => Promise<void>; readDir: (dirPath: string, options?: unknown) => Promise<unknown[]>; findFiles: (dirPath: string, pattern: string, options?: unknown) => Promise<string[]>; cleanDir: (dirPath: string) => Promise<void>; getSize: (targetPath: string) => Promise<number>; move: (src: string, dest: string, options?: unknown) => Promise<void>; } /** Process execution interface / export interface ProcessExecution { (command: string, args?: string[], options?: unknown): Promise<unknown>; sync: (command: string, args?: string[], options?: unknown) => unknown; stream: (command: string, args?: string[], options?: unknown) => Promise<unknown>; withOutput: (command: string, args?: string[], options?: unknown) => Promise<unknown>; commandExists: (command: string) => Promise<boolean>; detectPackageManager: (cwd?: string) => Promise<unknown>; runPackageManager: ( action: string, packageOrScript?: string, options?: unknown ) => Promise<unknown>; git: (subcommand: string, args?: string[], options?: unknown) => Promise<unknown>; createCancellable: () => unknown; sequence: (commands: unknown[], options?: unknown) => Promise<unknown[]>; parallel: (commands: unknown[], options?: unknown) => Promise<unknown[]>; } /** Logger interface / export interface LoggerInterface { intro: (message: string, showBrand?: boolean) => void; outro: (message: string) => void; info: (message: string) => void; success: (message: string) => void; warn: (message: string) => void; error: (message: string | Error) => void; debug: (message: string, data?: unknown) => void; verbose: (message: string, data?: unknown) => void; spinner: (message: string) => unknown; enableVerbose: () => void; enableDebug: () => void; setLevel: (level: string) => void; step: (message: string, stepNumber?: number, totalSteps?: number) => void; note: (message: string, title?: string) => void; log: (message: string) => void; table: (data: Record<string, string | number | boolean>) => void; stopAllSpinners: (message?: string) => void; } /** Prompts interface

---

## SanitizableArray

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## SanitizableObject

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## SanitizableValue

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ShellType

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## StrictRecord

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## TelemetryModule

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management / export interface CommandContext { // Core utilities fs?: FSModule; // File system operations (implemented) execa?: ExecaModule; // Process execution (implemented) logger: Logger; // Logging and spinners (implemented) prompts: PromptsModule; // Interactive user input (implemented) temp?: TempModule; // Temporary workspace management (to be implemented) // Plugin utilities (all optional - only available when explicitly enabled) git?: GitModule; // Git operations (implemented, plugin) config?: import('../utils/config.js').ConfigType; // Configuration data (loaded config object) telemetry?: TelemetryModule; // Analytics and tracking (to be implemented) // Configuration and state cwd?: string; // Current working directory packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'; } /** Plugin interface for extending CLI functionality / export interface CLIPlugin { name: string; version?: string; setup?(context: CommandContext): Promise<void> | void; teardown?(context: CommandContext): Promise<void> | void; } /** Configuration for the CLI SDK / export interface CLIConfig { theme?: { primary?: string; success?: string; warning?: string; error?: string; }; telemetry?: { enabled: boolean; endpoint?: string; }; verbose?: boolean; } /** Configuration module interface for CommandContext / export interface ConfigModule { loadConfig: typeof import('../utils/config.js').loadConfig; getPackageJSON: typeof import('../utils/config.js').getPackageJSON; // Future configuration methods will be added here } /** Temporary workspace module interface for CommandContext / export interface TempModule { // Temporary workspace management methods (to be implemented) createTempDir: (prefix?: string) => Promise<string>; cleanupTempDir: (path: string) => Promise<void>; createTempFile: (content: string, extension?: string) => Promise<string>; // Future temp workspace methods will be added here } /** Telemetry module interface for CommandContext

---

## TempModule

**Type**: `interface`  
**Source**: [`src/types/cli.ts`](../../../src/types/cli.ts)

CommandContext provides unified access to all SDK utilities This interface will be passed to all commands, giving them access to: - Core utilities (fs, exec, logger, prompts) - Plugin functionality (git, config, telemetry) - Configuration and state management / export interface CommandContext { // Core utilities fs?: FSModule; // File system operations (implemented) execa?: ExecaModule; // Process execution (implemented) logger: Logger; // Logging and spinners (implemented) prompts: PromptsModule; // Interactive user input (implemented) temp?: TempModule; // Temporary workspace management (to be implemented) // Plugin utilities (all optional - only available when explicitly enabled) git?: GitModule; // Git operations (implemented, plugin) config?: import('../utils/config.js').ConfigType; // Configuration data (loaded config object) telemetry?: TelemetryModule; // Analytics and tracking (to be implemented) // Configuration and state cwd?: string; // Current working directory packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'; } /** Plugin interface for extending CLI functionality / export interface CLIPlugin { name: string; version?: string; setup?(context: CommandContext): Promise<void> | void; teardown?(context: CommandContext): Promise<void> | void; } /** Configuration for the CLI SDK / export interface CLIConfig { theme?: { primary?: string; success?: string; warning?: string; error?: string; }; telemetry?: { enabled: boolean; endpoint?: string; }; verbose?: boolean; } /** Configuration module interface for CommandContext / export interface ConfigModule { loadConfig: typeof import('../utils/config.js').loadConfig; getPackageJSON: typeof import('../utils/config.js').getPackageJSON; // Future configuration methods will be added here } /** Temporary workspace module interface for CommandContext

---

## TestSpy

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## TODO_REPLACE_ANY

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## ValidationResult

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

---

## WorkspacePackage

**Type**: `type`  
**Source**: [`src/types/common.ts`](../../../src/types/common.ts)

## 📁 Source Files

- [`src/types/cli.ts`](../../../src/types/cli.ts)
- [`src/types/common.ts`](../../../src/types/common.ts)

---

*Generated on 2025-11-17T03:51:25.275Z*
