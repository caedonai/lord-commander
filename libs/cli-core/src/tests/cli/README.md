# CLI Test Suite

This directory contains comprehensive Vitest tests for the Lord Commander CLI functionality.

## Test Files

### `build-validation.test.ts`
**Vitest Test Suite** for CLI build integrity:
- Validates required dist files exist with proper structure
- Verifies CLI shebang configuration and executable format
- Tests basic command execution (help, version, hello)
- Validates package.json configuration (bin, files, entry points)

### `integration.test.ts`
**Vitest Test Suite** for end-to-end CLI testing:
- Parameterized tests for multiple command scenarios
- Output validation and error handling verification
- Shell integration and completion functionality testing
- Performance characteristics validation

### `performance.test.ts`
**Vitest Test Suite** for CLI performance validation:
- Startup time measurement with statistical analysis
- Command execution speed tests with multiple iterations
- Bundle size analysis and resource usage validation
- Memory performance and consistency testing

## Usage

Run individual test suites:
```bash
# Build validation tests
pnpm test:cli-build

# Integration tests
pnpm test:cli-integration

# Performance tests
pnpm test:cli-performance

# All CLI tests
pnpm test:cli-all

# Watch mode for development
pnpm test:watch src/tests/cli/
```

## Test Strategy

These Vitest tests ensure the CLI:

1. **Builds correctly** - All artifacts present, configured, and executable
2. **Functions properly** - Commands execute with expected output and behavior
3. **Performs well** - Startup time and execution speed within performance limits
4. **Handles errors** - Graceful error handling with proper exit codes
5. **Integrates seamlessly** - Shell completion and environment detection

## Vitest Advantages

- **Structured Testing**: Proper `describe`/`it` blocks with clear test organization
- **Better Assertions**: Rich expectation API with detailed error messages
- **Parameterized Tests**: `it.each()` for testing multiple scenarios efficiently
- **IDE Integration**: Full TypeScript support with autocomplete and debugging
- **Parallel Execution**: Tests can run in parallel for faster feedback
- **Coverage Reports**: Built-in coverage analysis and reporting
- **Watch Mode**: Automatic re-running during development

## Requirements

- CLI must be built (`pnpm build`) before running tests
- Tests require the `dist/` directory to exist with proper CLI artifacts
- Performance tests have configurable time thresholds for different environments
- Integration tests validate against actual command outputs using child processes

The tests use Node.js child processes to execute the built CLI as end users would, providing realistic integration testing with proper Vitest structure and assertions.