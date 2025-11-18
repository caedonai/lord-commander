# Enhanced CLI Control Architecture

## Overview

The Enhanced CLI Control system provides manual execution control for CLI applications through the `EnhancedCommand` interface and `run()` method. This architecture enables developers to control when and how their CLI executes, offering better integration with testing frameworks and advanced use cases.

## Key Components

### EnhancedCommand Interface

```typescript
export interface EnhancedCommand extends Command {
    run(argv?: string[]): Promise<void>;
    _cliState?: {
        hasBeenExecuted: boolean;
        autoStartEnabled: boolean;
        options: CreateCliOptions;
    };
}
```

**Purpose**: Extends Commander.js Command with manual execution control and state tracking.

### State Management

- **hasBeenExecuted**: Prevents double execution
- **autoStartEnabled**: Tracks if CLI was configured for automatic startup
- **options**: Stores original CLI configuration for error handling

### Execution Control Options

#### AutoStart Configuration
- `autoStart: true` (default): CLI executes automatically via `parseAsync(process.argv)`
- `autoStart: false`: CLI returns without execution, manual control via `run()` method

#### Double Execution Prevention
- Optimized logic using ternary operator for clean conditional checks
- Different warning messages for autoStart vs manual execution scenarios
- State tracking prevents multiple executions regardless of execution method

## Architecture Benefits

### 1. **Testing Integration**
- Manual control enables comprehensive testing without process.exit() issues
- State inspection allows verification of CLI configuration
- Isolated execution environments for unit testing

### 2. **Backward Compatibility** 
- All existing `createCLI` functionality preserved
- Default behavior unchanged (autoStart: true)
- Existing applications continue working without modifications

### 3. **Error Handling Integration**
- Manual execution uses same `handleCLIError` function as automatic execution
- Custom error handlers work with both execution modes
- Comprehensive security validation maintained

### 4. **Type Safety**
- Full TypeScript integration with proper interface extensions
- Type-safe state tracking and configuration options
- Enhanced IntelliSense and development experience

## Usage Patterns

### Development & Testing
```typescript
// Test environments
const program = await createCLI({
  name: 'test-cli',
  autoStart: false
});

// Full control over execution timing and arguments
await program.run(['node', 'cli', 'test-command']);
```

### Production Deployment
```typescript
// Production environments (default behavior)
await createCLI({
  name: 'prod-cli',
  version: '1.0.0'
  // autoStart: true (default) - immediate execution
});
```

### Advanced Integration
```typescript
// Custom execution logic
const program = await createCLI({
  name: 'advanced-cli',
  autoStart: false,
  errorHandler: customErrorHandler
});

// Conditional execution based on environment
if (shouldExecute()) {
  await program.run(customArgv);
}
```

## Implementation Details

### Optimized Logic
The implementation uses clean ternary operators instead of nested if statements:

```typescript
// Prevent double execution with optimized logic
if (state.hasBeenExecuted) {
    const message = state.autoStartEnabled 
        ? 'CLI has already been executed automatically (autoStart: true). Set autoStart: false if you want manual control via run().'
        : 'CLI has already been executed. Multiple calls to run() are not supported.';
    logger.warn(message);
    return;
}
```

### Centralized Error Handling
Both automatic and manual execution use the same error handling pipeline:

```typescript
try {
    await this.parseAsync(argv);
} catch (error) {
    await handleCLIError(error as Error, state.options);
}
```

## Security Considerations

- Manual execution maintains all security validations
- Error handlers are validated before CLI creation
- State tracking prevents manipulation of execution flow
- Input arguments are processed through same security pipeline

## Performance Impact

- Minimal overhead: Only adds state tracking object
- No performance impact on existing automatic execution
- Lazy loading of manual execution logic
- Optimized conditional checks

## Future Enhancements

- **Execution Hooks**: Pre/post execution lifecycle hooks
- **Execution Middleware**: Plugin system for execution pipeline
- **Advanced State Management**: More granular execution state tracking
- **Execution Analytics**: Built-in metrics and performance monitoring