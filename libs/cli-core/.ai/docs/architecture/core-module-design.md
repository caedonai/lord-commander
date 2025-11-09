# Core Module Design Architecture

## Overview

The lord-commander-poc CLI SDK follows a carefully designed modular architecture that prioritizes tree-shaking optimization, security, and developer experience. This document outlines the core design decisions and architectural patterns that enable 97% bundle size reduction while maintaining comprehensive functionality.

## Architecture Principles

### 1. **Logical Separation of Concerns**
The `src/core/` directory is organized into four logical subfolders, each with distinct responsibilities:

```
src/core/
├── foundation/     # Core infrastructure & shared utilities
├── commands/       # Command registration & discovery
├── execution/      # Process execution & file system operations
├── ui/            # User interface & interaction components
└── index.ts       # Main export coordination
```

### 2. **Tree-shaking First Design**
Every module is designed with selective imports in mind:
- **Explicit Named Exports**: All exports are explicitly named for maximum tree-shaking efficiency
- **No Barrel Exports**: Avoided `export * from` patterns that can confuse bundlers
- **Granular Modules**: Each module has a single, well-defined responsibility
- **Index File Strategy**: Each subfolder maintains its own `index.ts` for clean organization

### 3. **Plugin-Core Separation**
Clear boundary between core functionality and extended features:
- **Core (`src/core/`)**: Essential CLI utilities (1.78KB when tree-shaken)
- **Plugins (`src/plugins/`)**: Specialized tools like Git, Updater, Workspace (1.33KB when tree-shaken)
- **Commands (`src/commands/`)**: Built-in commands with configurable loading

## Core Module Breakdown

### Foundation Layer (`src/core/foundation/`)

**Purpose**: Shared infrastructure and security primitives

#### `constants.ts`
```typescript
// Centralized configuration and error messages
export const ERROR_MESSAGES = {
  INVALID_COMMAND_PATH: (path: string) => `Invalid or unsafe commands directory path: ${path}`,
  COMMAND_CONFLICT: (name: string, existing: string, new: string) => 
    `Command name conflict: "${name}" already registered from ${existing}, cannot register from ${new}`
};

export const FRAMEWORK_PATTERNS = {
  NEXT_JS: ['next.config.js', 'next.config.ts'],
  ASTRO: ['astro.config.js', 'astro.config.ts'],
  // ... more patterns
};
```

**Design Rationale**: 
- Single source of truth for all constants
- Type-safe error message functions
- Framework detection patterns for smart CLI behavior

#### `errors.ts`
```typescript
// Custom error classes with recovery suggestions
export class CLIError extends Error {
  constructor(message: string, public suggestions?: string[]) {
    super(message);
  }
}

export class SecurityError extends CLIError {
  constructor(path: string) {
    super(ERROR_MESSAGES.INVALID_COMMAND_PATH(path), [
      'Use relative paths like "./commands" or "src/commands"',
      'Ensure paths are within your project directory'
    ]);
  }
}
```

**Design Rationale**:
- Rich error context with actionable suggestions
- Security-first error handling
- Consistent error formatting across the SDK

#### `log-security.ts`
```typescript
// Comprehensive log injection protection
export function sanitizeLogOutput(input: string, config?: LogInjectionConfig): string {
  // Remove ANSI escape sequences, control characters
  // Prevent terminal manipulation attacks
}

export function analyzeLogSecurity(input: string): LogSecurityAnalysis {
  // Detailed security analysis with threat detection
}
```

**Design Rationale**:
- Prevents terminal manipulation attacks
- Configurable security levels for dev/prod
- Integration with Logger without circular dependencies

### Commands Layer (`src/core/commands/`)

**Purpose**: Command discovery, registration, and shell completion

#### `registerCommands.ts`
```typescript
// Command registration with conflict detection
const commandTracking = new Map<string, string>();

export async function registerCommands(
  program: Command, 
  context: CommandContext, 
  commandsPath: string | string[]
): Promise<void> {
  // Security validation
  // Duplicate detection
  // Graceful error handling
}

export function resetCommandTracking(): void {
  commandTracking.clear();
}
```

**Design Rationale**:
- Map-based tracking for O(1) conflict detection
- Support for multiple command directories
- Comprehensive security validation
- Test isolation support

#### `autocomplete.ts`
```typescript
// Multi-shell completion support
export async function generateCompletion(program: Command, shell: string): Promise<string> {
  // Generate shell-specific completion scripts
}

export async function installCompletion(program: Command, options: CompletionOptions): Promise<boolean> {
  // Auto-install completion for bash, zsh, fish, PowerShell
}
```

**Design Rationale**:
- Cross-platform shell support
- Auto-installation capabilities
- Status monitoring and diagnostics

### Execution Layer (`src/core/execution/`)

**Purpose**: Safe process execution and file system operations

#### `execa.ts`
```typescript
// Secure process execution wrapper
export async function execa(
  command: string, 
  options?: ExecOptions
): Promise<ExecResult> {
  // Async, cancelable shell commands
  // Security validation
  // Structured output handling
}
```

**Design Rationale**:
- Security-first process execution
- Cancelable operations for better UX
- Consistent error handling

#### `fs.ts`
```typescript
// Safe file system utilities
export async function copy(source: string, destination: string): Promise<void> {
  // Path validation
  // Safe file operations
}

export async function ensureDir(dirPath: string): Promise<void> {
  // Recursive directory creation
  // Permission handling
}
```

**Design Rationale**:
- Path traversal protection
- Consistent API across operations
- Error recovery suggestions

### UI Layer (`src/core/ui/`)

**Purpose**: User interaction and visual feedback

#### `logger.ts`
```typescript
// Unified logging system
export function createLogger(): Logger {
  return {
    intro: (message: string) => void,
    outro: (message: string) => void,
    spinner: (message: string) => Spinner,
    error: (message: string) => void,
    // ... more methods
  };
}
```

**Design Rationale**:
- Consistent visual language
- Spinner integration for async operations
- Color theming support

#### `prompts.ts`
```typescript
// Interactive prompt helpers
export async function confirmAction(message: string): Promise<boolean> {
  // @clack/prompts integration
  // Graceful Ctrl+C handling
}
```

**Design Rationale**:
- Consistent prompt styling
- Cancellation support
- Type-safe responses

## Bundle Optimization Strategy

### Tree-shaking Results
- **Core Only**: 1.78KB (97% reduction from 71KB)
- **Plugins Only**: 1.33KB
- **Full SDK**: 71KB (when importing everything)

### Key Techniques

#### 1. **Explicit Named Exports**
```typescript
// ❌ Barrel exports (harder to tree-shake)
export * from './module';

// ✅ Explicit exports (optimal tree-shaking)
export { specificFunction, SpecificClass } from './module';
```

#### 2. **Modular Import Patterns**
```typescript
// ✅ Tree-shakeable imports (recommended)
import { execa, createLogger } from "@caedonai/sdk/core";
import { parseVersion } from "@caedonai/sdk/plugins";

// ❌ Full SDK import (includes everything)
import { execa, createLogger, parseVersion } from "@caedonai/sdk";
```

#### 3. **Conditional Module Loading**
```typescript
// Only load modules when actually needed
export async function createCLI(options: CLIOptions) {
  if (options.builtinCommands?.completion) {
    const { default: completion } = await import('../commands/completion.js');
    completion(program, context);
  }
}
```

## Security Architecture

### Defense in Depth
1. **Input Validation**: All paths validated against traversal attacks
2. **Process Isolation**: Secure execution boundaries
3. **Memory Protection**: DoS prevention through resource limits
4. **Log Sanitization**: Terminal manipulation protection
5. **Error Sanitization**: Information disclosure prevention

### Security Layers
```typescript
// Path validation
function validateCommandPath(path: string): void {
  if (isUnsafePath(path)) {
    throw new SecurityError(path);
  }
}

// Error sanitization
function sanitizeErrorMessage(message: string): string {
  // Remove sensitive information
  // Sanitize paths and credentials
}

// Memory protection
function sanitizeErrorObject(error: any): any {
  // Prevent memory exhaustion
  // Limit object size and depth
}
```

## Plugin System Design

### Plugin Interface
```typescript
interface Plugin {
  name: string;
  version: string;
  init(context: PluginContext): Promise<void>;
  commands?: Command[];
  hooks?: PluginHooks;
}
```

### Plugin Loading Strategy
- **Lazy Loading**: Plugins loaded only when needed
- **Dependency Injection**: Context provided to plugins
- **Error Isolation**: Plugin failures don't crash CLI
- **Version Compatibility**: Semantic version checking

## Testing Architecture

### Test Organization
- **Unit Tests**: Individual module testing
- **Integration Tests**: Cross-module interaction
- **Security Tests**: 88 comprehensive security validations
- **Performance Tests**: Bundle size and startup time
- **Data-driven Tests**: Configuration-based test generation

### Security Test Methodology
```typescript
// Centralized test patterns
const SECURITY_TEST_CASES = [
  { path: '../../../etc', expected: 'error', type: 'traversal' },
  { path: 'C:\\Windows\\System32', expected: 'error', type: 'absolute' },
  // ... more cases
];
```

## Future Architecture Considerations

### Scalability
- **Module Federation**: Support for external plugins
- **Micro-CLI Architecture**: Composable CLI building blocks
- **Registry System**: Plugin discovery and distribution

### Performance
- **Code Splitting**: Further bundle optimization
- **Caching Layer**: Command result caching
- **Parallel Execution**: Concurrent operation support

### Enterprise Features
- **Policy Engine**: Compliance and governance
- **Audit Logging**: Security event tracking
- **Role-based Access**: Permission system

## Metrics & Validation

### Bundle Analysis
- 71 core exports validated
- 37 plugin exports validated
- 97% size reduction achieved
- Tree-shaking compatibility confirmed

### Test Coverage
- 367 total tests passing
- 88 security tests
- Data-driven test configuration
- 90% boilerplate reduction in tree-shaking tests

### Performance Benchmarks
- Startup time: <100ms
- Memory usage: <50MB baseline
- Bundle parse time: <10ms

---

## Conclusion

The core module design prioritizes developer experience through tree-shaking optimization while maintaining enterprise-grade security and reliability. The modular architecture enables selective feature adoption and ensures long-term maintainability as the SDK evolves.

The foundation → commands → execution → ui layering provides clear separation of concerns while enabling rich composition patterns for complex CLI tools.