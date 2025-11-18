# Copilot Instructions for Lord Commander CLI

## Context

This is the main CLI application for Lord Commander SDK. It uses the `@lord-commander/cli-core` library and loads commands from `libs/cli-core/commands/`. When working on this app, focus on leveraging the SDK's powerful CLI framework for excellent developer experience.

## Architecture Overview

**CLI Structure:**

- `apps/cli/src/main.ts`: Thin wrapper using `createCLI` from cli-core
- `apps/cli/commands/`: Custom command implementations (.mjs files) - auto-loaded
- `libs/cli-core/`: SDK library with built-in commands and example commands
- Auto-discovery: Commands auto-loaded from `./commands` relative to CLI working directory

**Available Commands:**

- Built-in commands from SDK: `completion`, `hello`, `version`
- Custom commands: Add `.mjs` files to `apps/cli/commands/`
- CLI-core examples: `init`, `scaffold`, `analyze`, `demo` (in `libs/cli-core/commands/` - for reference)

## CLI-Specific Guidelines

### Command Design Philosophy

- **SDK-First**: Leverage cli-core utilities (logger, prompts, fs, execa)
- **Interactive**: Use `@clack/prompts` for excellent UX
- **Consistent**: Follow established patterns in cli-core commands
- **Safe**: Validate inputs and confirm destructive operations
- **Fast**: Optimize for quick startup using SDK features

### Command Implementation Pattern

Commands can be either `.ts` (TypeScript) or `.mjs` (JavaScript) files that export a default function:

```typescript
// TypeScript command pattern (recommended for type safety)
import type { CommandContext } from "@lord-commander/cli-core";
import type { Command } from "commander";

export default function (program: Command, context: CommandContext) {
  const { logger, prompts, fs, execa } = context;

  program
    .command("command-name")
    .description("Command description")
    .argument("[arg]", "Optional argument")
    .option("-f, --flag", "Option flag")
    .action(async (arg, options) => {
      logger.intro("Command Title");

      // Interactive prompts with validation
      const input = await prompts.text({
        message: "Enter value:",
        validate: (value) => (value ? true : "Value required"),
      });

      // Handle cancellation
      if (prompts.isCancel(input)) {
        prompts.cancel("Operation cancelled.");
        process.exit(0);
      }

      // Show progress
      const spinner = logger.spinner("Processing...");
      // ... async work
      spinner.success("Complete!");

      logger.outro("✨ Done!");
    });
}
```

### SDK Context Utilities

All commands receive a `context` object with powerful utilities:

**Logger (from @clack/prompts):**

```javascript
const { logger } = context;

logger.intro("🚀 Starting operation"); // Beautiful intro
logger.info("Processing files..."); // Info message
logger.success("✅ Files processed!"); // Success message
logger.error("❌ Operation failed"); // Error message
logger.warn("⚠️ Warning message"); // Warning message
logger.debug("Debug info"); // Debug (if verbose)

const spinner = logger.spinner("Loading..."); // Progress spinner
spinner.success("Done!"); // Complete spinner
spinner.error("Failed!"); // Error spinner

logger.outro("✨ Operation complete!"); // Beautiful outro
```

**Prompts (from @clack/prompts):**

```javascript
const { prompts } = context;

// Text input with validation
const name = await prompts.text({
  message: "Project name?",
  placeholder: "my-project",
  validate: (value) => (value ? true : "Name required"),
});

// Select from options
const framework = await prompts.select({
  message: "Choose framework:",
  options: [
    { value: "ts", label: "TypeScript" },
    { value: "js", label: "JavaScript" },
  ],
});

// Multi-select
const features = await prompts.multiselect({
  message: "Features to include:",
  options: [
    { value: "git", label: "Git repository" },
    { value: "tests", label: "Testing setup" },
  ],
  initialValues: ["git"],
});

// Confirmation
const confirm = await prompts.confirm({
  message: "Proceed?",
});

// Always handle cancellation
if (prompts.isCancel(name)) {
  prompts.cancel("Operation cancelled.");
  process.exit(0);
}
```

**File System (enhanced fs utilities):**

```javascript
const { fs } = context;

await fs.ensureDir("path/to/dir"); // Create directory
await fs.writeFile("file.json", JSON.stringify(data, null, 2));
const content = await fs.readFile("file.txt");
const exists = fs.exists("path/to/file"); // Sync check
await fs.copy("src", "dest"); // Copy files/dirs
await fs.remove("path"); // Remove files/dirs
```

**Command Execution (execa wrapper):**

```javascript
const { execa } = context;

// Execute commands safely
const result = await execa("npm", ["--version"]);
console.log(result.stdout); // Command output

// With options
await execa("git", ["init"], { cwd: projectDir });
```

### Main CLI Configuration

The main CLI is configured in `apps/cli/src/main.ts` using `createCLI`:

```typescript
// Actual configuration from main.ts
import { createCLI } from "@lord-commander/cli-core";

const program = await createCLI({
  name: "lord-commander",
  version: "1.0.0",
  description:
    "Professional CLI SDK Framework for building advanced command-line tools",
  commandsPath: "./commands", // Loads from apps/cli/commands/
  builtinCommands: {
    completion: true, // Enable shell completion management
    hello: true, // Enable demo command
    version: true, // Enable version command
  },
  autocomplete: {
    enabled: true, // Enable shell completion
    autoInstall: true, // Auto-install completion on first run
    shells: ["bash", "zsh", "fish", "powershell"],
    enableFileCompletion: true,
  },
  autoStart: true, // Start immediately (default)
});
```

### Command Location and Loading

**Command Discovery:**

- Commands auto-load from `apps/cli/commands/` directory (via `./commands` path)
- Built-in commands from SDK: `completion`, `hello`, `version`
- Commands can be `.ts` (TypeScript) or `.mjs` files (ES modules) for dynamic import
- TypeScript files are compiled automatically and work with full type safety
- Must be copied to build output via assets configuration in `project.json`

**Command Registration:**

- Each command file exports a default function: `export default function(program, context)`
- Function receives `(program, context)` parameters
- Uses Commander.js for command definition
- Context provides logger, prompts, fs, execa utilities from SDK

**Build Configuration:**
Commands directory must be included in build assets:

```json
// apps/cli/project.json
"assets": [
  {
    "glob": "**/*",
    "input": "apps/cli/commands",
    "output": "./commands"
  }
]
```

### Development Workflow

**Local Development:**

```bash
# Build the CLI
pnpx nx build cli

# Run CLI commands locally (after build)
node dist/apps/cli/main.js init --help
node dist/apps/cli/main.js scaffold my-project

# Run in development mode
pnpx nx dev cli

# Test the CLI
pnpx nx test cli

# Lint the CLI code
pnpx nx lint cli
```

**Adding New Commands:**

1. Create new `.ts` or `.mjs` file in `apps/cli/commands/`
2. For TypeScript: Import `CommandContext` and `Command` types
3. Export default function that receives `(program, context)`
4. Use Commander.js patterns with SDK utilities
5. Update `project.json` assets if not already configured
6. Build and test from correct working directory

**Example New Command:**

```typescript
// apps/cli/commands/deploy.ts
import type { CommandContext } from "@lord-commander/cli-core";
import type { Command } from "commander";

export default function (program: Command, context: CommandContext) {
  const { logger, prompts, execa } = context;

  program
    .command("deploy")
    .description("Deploy application")
    .option("-e, --env <env>", "Environment", "production")
    .action(async (options) => {
      logger.intro("🚀 Deploying Application");

      const confirm = await prompts.confirm({
        message: `Deploy to ${options.env}?`,
      });

      if (prompts.isCancel(confirm) || !confirm) {
        prompts.cancel("Deployment cancelled.");
        return;
      }

      const spinner = logger.spinner("Deploying...");
      await execa("npm", ["run", "deploy"]);
      spinner.success("Deployed successfully!");

      logger.outro("✨ Deployment complete!");
    });
}
```

### Testing and Quality

**Testing Strategy:**

- Use the SDK's built-in testing utilities
- Mock context utilities (logger, prompts, fs, execa)
- Test command logic separately from Commander.js registration
- Verify interactive prompts and user flows

**Quality Standards:**

- Follow cli-core patterns consistently
- Use SDK context utilities exclusively
- Handle user cancellation gracefully
- Provide clear progress feedback
- Validate inputs thoroughly

### Error Handling Best Practices

```javascript
// Proper error handling in commands
export default function (program, context) {
  const { logger, prompts } = context;

  program.command("risky-operation").action(async () => {
    try {
      logger.intro("Risky Operation");

      // Validate prerequisites
      if (!someCondition) {
        logger.error("Prerequisites not met");
        process.exit(1);
      }

      // Confirm destructive operations
      const confirm = await prompts.confirm({
        message: "This will modify files. Continue?",
      });

      if (prompts.isCancel(confirm) || !confirm) {
        prompts.cancel("Operation cancelled.");
        return; // Exit gracefully
      }

      // Show progress for long operations
      const spinner = logger.spinner("Processing...");

      // Perform operation
      await performRiskyOperation();

      spinner.success("Operation completed!");
      logger.outro("✨ All done!");
    } catch (error) {
      logger.error(`Operation failed: ${error.message}`);
      logger.info("Please check the logs and try again.");
      process.exit(1);
    }
  });
}
```

### Built-in Features

**Shell Completion:**

- Enabled by default via `builtinCommands.completion: true`
- Users can install with `lord-commander completion install`
- Supports bash, zsh, fish, and PowerShell

**Plugin System:**

- Git operations: Enable with `plugins.git: true`
- Workspace management: Enable with `plugins.workspace: true`
- Auto-updater: Enable with `plugins.updater: true`
- Plugins add utilities to command context

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
├── .github/
│   └── copilot-instructions.md  # This file
├── commands/                    # Custom CLI command implementations
│   └── status.ts               # Example TypeScript command
├── src/
│   └── main.ts                  # CLI entry point (uses createCLI)
├── package.json                 # CLI app dependencies
└── project.json                 # NX project configuration (with assets config)

libs/cli-core/
├── commands/                    # Example command implementations (for reference)
│   ├── init.mjs                # Interactive project wizard example
│   ├── scaffold.mjs            # Project scaffolding example
│   ├── analyze.mjs             # Project analysis example
│   └── demo.mjs                # Demo command example
├── src/
│   ├── core/
│   │   └── createCLI.ts        # Main CLI factory function
│   ├── commands/               # Built-in SDK commands
│   │   ├── completion.ts       # Shell completion (built-in)
│   │   ├── hello.ts           # Demo command (built-in)
│   │   └── version.ts         # Version command (built-in)
│   └── types/
│       └── cli.ts             # TypeScript interfaces

dist/apps/cli/                   # Build output
├── commands/                    # Commands copied from source
│   └── status.js               # Compiled TypeScript commands
└── main.js                     # Bundled CLI executable
```

## Quality Checklist

- [ ] Use SDK context utilities exclusively (logger, prompts, fs, execa)
- [ ] Follow `.ts` (TypeScript) or `.mjs` (JavaScript) command file pattern with default export
- [ ] Handle user cancellation gracefully with `prompts.isCancel()`
- [ ] Provide clear progress feedback with intro/outro/spinners
- [ ] Validate inputs with proper error messages
- [ ] Use consistent @clack/prompts patterns
- [ ] Test commands work with SDK auto-discovery
- [ ] Commands integrate well with built-in completion system
