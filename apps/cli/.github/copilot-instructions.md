# Copilot Instructions for Lord Commander CLI

## Context

This is the main CLI application for Lord Commander SDK. When working on this app, focus on creating excellent developer experience through intuitive commands, helpful output, and robust error handling.

## CLI-Specific Guidelines

### Command Design Philosophy

- **Discoverability**: Commands should be intuitive and self-documenting
- **Consistency**: Use consistent patterns across all commands
- **Helpfulness**: Provide clear help text and examples
- **Safety**: Include confirmations for destructive operations
- **Performance**: Optimize for fast startup and execution

### Command Structure

**Base Commands:**
- `init` - Initialize new CLI projects
- `create` - Generate components and files
- `build` - Compile and bundle CLI applications
- `dev` - Development mode with hot reloading
- `test` - Run test suites

**Command Patterns:**
```typescript
// Use Commander.js patterns consistently
program
  .command('init [projectName]')
  .description('Initialize a new CLI project')
  .option('-t, --template <type>', 'Project template', 'basic')
  .option('-f, --force', 'Overwrite existing files')
  .action(async (projectName, options) => {
    // Implementation
  });
```

### User Experience Guidelines

**Output Standards:**
- Use colors and symbols for visual hierarchy
- Show progress indicators for long operations
- Provide clear success/error messages
- Include helpful next steps in output

**Interactive Prompts:**
- Use inquirer.js for consistent prompt experience
- Validate user input properly
- Provide sensible defaults
- Allow keyboard navigation

**Error Handling:**
- Show user-friendly error messages
- Include actionable troubleshooting steps
- Log detailed errors for debugging
- Exit with appropriate codes (0 = success, 1+ = error)

### Output Formatting

**Terminal Output:**
```typescript
// Use consistent styling
import { success, error, info, warning } from '../lib/logger';

success('✅ Project created successfully!');
error('❌ Failed to create project');
info('ℹ️  Running initial setup...');
warning('⚠️  This will overwrite existing files');
```

**Progress Indicators:**
- Use spinners for network operations
- Show progress bars for file operations
- Display step-by-step progress for multi-stage commands

### File System Operations

**Path Handling:**
- Always use `path.resolve()` for absolute paths
- Handle Windows/Unix path differences
- Validate paths before operations
- Use proper error handling for file operations

**Template Processing:**
- Support multiple template engines (handlebars, ejs)
- Allow dynamic variable replacement
- Maintain file permissions during copying
- Handle binary files appropriately

### Configuration Management

**Config Files:**
- Support both JSON and YAML configuration
- Provide schema validation for config files
- Use sensible defaults for missing config
- Allow environment variable overrides

**Global vs Local Config:**
- Global: `~/.lord-commander/config.json`
- Local: `./lord-commander.config.json`
- Merge configurations with proper precedence

### Testing CLI Applications

**Testing Strategies:**
- Mock file system operations
- Test command parsing and validation
- Verify output formatting and colors
- Test interactive prompts programmatically

**Integration Tests:**
- Test complete workflows end-to-end
- Verify generated files and structure
- Test error scenarios and recovery
- Validate cross-platform compatibility

### Performance Considerations

**Startup Time:**
- Lazy-load heavy dependencies
- Cache expensive computations
- Minimize initial imports
- Use dynamic imports where possible

**Memory Usage:**
- Stream large files instead of loading in memory
- Clean up temporary files and resources
- Avoid memory leaks in long-running operations

### Cross-Platform Support

**Platform Differences:**
- Handle different shell environments (bash, zsh, PowerShell)
- Support Windows, macOS, and Linux file systems
- Test on multiple Node.js versions
- Handle different terminal capabilities

### Development Workflow

**Local Development:**
```bash
# Link CLI for testing
pnpx nx run cli:build
npm link dist/apps/cli

# Test commands locally
lord-commander init test-project

# Run tests
pnpx nx test cli

# Build for distribution
pnpx nx build cli --prod
```

### Command Implementation Pattern

```typescript
// Standard command structure
export async function initCommand(
  projectName: string,
  options: InitOptions
): Promise<void> {
  try {
    // 1. Validate input
    validateProjectName(projectName);
    
    // 2. Show progress
    const spinner = createSpinner('Initializing project...');
    
    // 3. Perform operations
    await createProject(projectName, options);
    
    // 4. Show success
    spinner.succeed('Project created successfully!');
    
    // 5. Show next steps
    showNextSteps(projectName);
  } catch (error) {
    // 6. Handle errors gracefully
    handleError(error);
  }
}
```

### Help and Documentation

**Help Text:**
- Include usage examples in help output
- Show common option combinations
- Provide links to full documentation
- Include troubleshooting tips

**Auto-completion:**
- Support shell auto-completion
- Include command and option completion
- Provide context-aware suggestions

## Code Quality Standards

- Follow the root workspace guidelines
- Use TypeScript strict mode
- Implement comprehensive error handling
- Add JSDoc for complex CLI logic
- Test all commands thoroughly
- Optimize for CLI startup performance

## File Structure

```
apps/cli/
├── src/
│   ├── commands/     # Command implementations
│   ├── lib/          # Shared utilities
│   ├── templates/    # Project templates
│   └── main.ts       # CLI entry point
└── package.json      # CLI-specific dependencies
```

## Quality Checklist

- [ ] Commands have clear help text and examples
- [ ] Error messages are user-friendly and actionable
- [ ] Interactive prompts validate input properly
- [ ] Output uses consistent formatting and colors
- [ ] File operations handle errors gracefully
- [ ] Commands work across different platforms
- [ ] Performance is optimized for quick startup
- [ ] Auto-completion works in supported shells