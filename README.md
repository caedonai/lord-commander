# Lord Commander SDK

A comprehensive toolkit for building professional-grade command-line tools. Extracts and systematizes patterns from industry-leading CLIs into composable, reusable modules.

## 🚀 Quick Start

### Installation

Install the CLI globally:

```bash
npm install -g lord-commander-poc
```

Or use with npx:

```bash
npx lord-commander-poc
```

### Usage

The CLI comes with built-in commands and demonstrates the SDK capabilities:

```bash
# Show help
lord-commander --help

# Say hello
lord-commander hello "Developer"

# Run with verbose logging  
lord-commander hello --verbose

# Show system information
lord-commander hello --info

# Run demo command
lord-commander demo --framework react --verbose

# Interactive project initialization
lord-commander init
lord-commander init --quick

# Scaffold new project
lord-commander scaffold my-new-cli --template typescript --git

# Analyze project structure
lord-commander analyze --depth 3 --json

# Manage shell completions
lord-commander completion install
lord-commander completion status
```

### Available Commands

- **`hello [name]`** - Greeting command with system information
- **`demo [options]`** - Demonstrates SDK capabilities with framework selection
- **`init [options]`** - Interactive project initialization wizard with prompts
- **`scaffold <name> [options]`** - Scaffold new CLI projects with templates
- **`analyze [options]`** - Analyze project structure and dependencies
- **`completion`** - Manage shell autocomplete (bash, zsh, fish, PowerShell)
- **`version`** - Advanced version management utilities

## 🛠 SDK Usage

Use the Lord Commander SDK to build your own CLI tools:

```typescript
import { createCLI } from 'lord-commander-poc/core';

await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool',
  commandsPath: './commands',
  builtinCommands: {
    completion: true,
    hello: true,
    version: true
  }
});
```

## 🏗 Development

```bash
# Clone the repository
git clone https://github.com/caedonai/lord-commander-poc.git

# Install dependencies
pnpm install

# Build the project
pnpm build

# Test the CLI
pnpm dev --help
node dist/cli.js --help

# Run tests
pnpm test
```

## 📦 Key Features

- **Zero-config setup** with automatic project detection
- **Interactive prompts** with @clack/prompts integration
- **Shell completion** for bash, zsh, fish, and PowerShell
- **Tree-shaking optimization** (97% bundle size reduction)
- **Security-first design** with comprehensive input validation
- **Professional logging** with colors and spinners
- **Modular architecture** for maximum flexibility

## 📖 Documentation

For complete documentation, see the [project repository](https://github.com/caedonai/lord-commander-poc).

## 🤝 Contributing

Contributions are welcome! Please check the project repository for guidelines.

## 📄 License

ISC License - see LICENSE file for details.