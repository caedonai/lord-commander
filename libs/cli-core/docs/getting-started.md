# Getting Started with Lord Commander CLI SDK

Welcome to the Lord Commander CLI SDK! This guide will help you create your first professional CLI application in just a few minutes.

## 🎯 What You'll Build

By the end of this guide, you'll have a fully functional CLI with:

- Interactive prompts and beautiful output
- Shell autocomplete support
- Built-in help system
- Professional error handling

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add @lord-commander/cli-core

# Using npm
npm install @lord-commander/cli-core

# Using yarn
yarn add @lord-commander/cli-core
```

## ⚡ Quick Start

### 1. Create Your First CLI

```typescript
// cli.ts
import { createCLI } from "@lord-commander/cli-core";

await createCLI({
  name: "my-cli",
  version: "1.0.0",
  description: "My awesome CLI tool",
});
```

### 2. Add Your First Command

```typescript
// commands/greet.ts
import { Command } from "commander";
import type { CommandContext } from "@lord-commander/cli-core";

export default function (program: Command, context: CommandContext) {
  const { logger, prompts } = context;

  program
    .command("greet [name]")
    .description("Greet someone warmly")
    .option("-e, --enthusiastic", "Add extra excitement")
    .action(async (name, options) => {
      logger.intro("👋 Greeting Generator");

      if (!name) {
        name = await prompts.text({
          message: "What's your name?",
          placeholder: "Enter your name",
        });
      }

      const greeting = `Hello, ${name}!${options.enthusiastic ? " 🎉" : ""}`;
      logger.success(greeting);
      logger.outro("Have a great day! ✨");
    });
}
```

### 3. Run Your CLI

```bash
# Build your project
npm run build

# Run your CLI
node dist/cli.js greet
node dist/cli.js greet --enthusiastic Alice
node dist/cli.js --help
```

## 🎨 Enhanced Features

### Interactive Prompts

```typescript
import { core } from "@lord-commander/cli-core";

// Multi-step workflow with progress tracking
const flow = new PromptFlow("Project Setup", 3);

const projectType = await flow.select("Project type:", [
  { value: "next", label: "Next.js App" },
  { value: "express", label: "Express API" },
]);

const useTypeScript = await flow.confirm("Use TypeScript?");
const packageManager = await flow.select("Package manager:", [
  { value: "pnpm", label: "pnpm (recommended)" },
  { value: "npm", label: "npm" },
  { value: "yarn", label: "yarn" },
]);

flow.complete("Project configured successfully! 🚀");
```

### Shell Autocomplete

```typescript
await createCLI({
  name: "my-cli",
  version: "1.0.0",
  description: "My CLI with autocomplete",
  autocomplete: {
    enabled: true,
    autoInstall: true,
    shells: ["bash", "zsh", "fish"],
  },
});
```

### Security & Validation

```typescript
import { core } from "@lord-commander/cli-core";

// Secure input validation
const result = validateProjectName(userInput, {
  autoSanitize: true,
  strictMode: false,
});

if (result.isValid) {
  console.log(`Using project: ${result.sanitized}`);
} else {
  console.error(`Invalid name: ${result.errors.join(", ")}`);
}
```

## 📱 CLI Readability

The SDK includes built-in tools for professional CLI output:

```typescript
import { core } from "@lord-commander/cli-core";

// Visual separation and progress
printSeparator("Configuration Setup", "double");
printSection("Environment", "Configuring deployment target");

printTaskStart("Installing dependencies");
// ... perform task
printTaskComplete("Dependencies installed successfully");
```

## 🔧 Advanced Configuration

```typescript
await createCLI({
  name: "advanced-cli",
  version: "2.0.0",
  description: "Advanced CLI with all features",

  // Multiple command directories
  commandsPath: ["./commands/core", "./commands/utils"],

  // Built-in commands
  builtinCommands: {
    completion: true,
    hello: false,
    version: true,
  },

  // Caching for performance
  cache: {
    enabled: true,
    ttl: 86400, // 24 hours
    maxSize: 100 * 1024 * 1024, // 100MB
  },

  // Custom error handling
  errorHandler: async (error) => {
    console.error(`🚨 Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  },
});
```

## 📂 Project Structure

```
my-cli/
├── src/
│   ├── cli.ts              # Main CLI entry point
│   └── commands/           # Your CLI commands
│       ├── greet.ts
│       ├── deploy.ts
│       └── config.ts
├── dist/                   # Built output
├── package.json
└── tsconfig.json
```

## 🎯 Next Steps

- [Explore Examples](examples/) - See real-world CLI implementations
- [API Reference](api/) - Dive deep into available functions
- [Security Guide](security.md) - Learn about production security
- [Performance Optimization](performance.md) - Make your CLI lightning fast

## 🚀 Pro Tips

1. **Tree Shaking**: Use selective imports for smaller bundles

   ```typescript
   import { core, plugins } from "@lord-commander/cli-core";
   ```

2. **TypeScript**: Enable strict mode for better development experience
3. **Testing**: Use the built-in CLI testing utilities
4. **Documentation**: Add JSDoc comments for auto-generated docs

Ready to build something amazing? Check out our [examples](examples/) for inspiration! 🚀
