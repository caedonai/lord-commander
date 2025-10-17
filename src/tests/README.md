# Tests

This directory contains test files for the lord-commander-poc CLI SDK.

## Files

### `test-cli.ts`
Manual testing CLI that allows developers to test the SDK functionality during development.

**Usage:**
```bash
# Via npm script (recommended)
pnpm test-cli hello
pnpm test-cli hello --git
pnpm test-cli hello "Developer" --uppercase

# Direct execution
pnpm tsx src/tests/test-cli.ts hello
```

**Auto-Discovery**: Commands are automatically discovered from `src/commands/` without any manual configuration!

### `basic.test.ts`
Automated unit tests for the SDK components.

**Usage:**
```bash
# Run automated tests (when implemented)
pnpm test
```

## Testing Strategy

- **Manual Testing**: Use `test-cli.ts` for interactive testing and validation
- **Integration Tests**: Test complete workflows and command interactions
- **Development Testing**: Validate new features before committing

## Adding New Tests

1. **New Commands**: Add test cases to `test-cli.ts` or create new manual test scenarios
2. **Integration Tests**: Create comprehensive workflow tests for complex scenarios