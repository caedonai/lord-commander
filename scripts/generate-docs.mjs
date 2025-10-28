#!/usr/bin/env node

/**
 * Documentation Generator Script
 * 
 * Generates comprehensive documentation for the Lord Commander CLI SDK
 * including API docs, examples, and usage guides.
 */

import { execa } from 'execa';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '..');
const docsPath = resolve(rootPath, 'docs');

console.log('📚 Lord Commander SDK Documentation Generator');
console.log('═'.repeat(50));

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

function generateApiDocs() {
  console.log('📖 Generating API Documentation...');
  
  const apiDocs = `# Lord Commander CLI SDK API Reference

## Overview

The Lord Commander CLI SDK provides a comprehensive framework for building professional-grade command-line tools with minimal boilerplate.

## Core Exports

### \`createCLI(options)\`

Creates and configures a new CLI application.

\`\`\`typescript
import { createCLI } from '@caedonai/sdk/core'

await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool',
  commandsPath: './commands',
  autoStart: true
})
\`\`\`

**Options:**
- \`name\` (string): CLI name
- \`version\` (string): CLI version
- \`description\` (string): CLI description
- \`commandsPath\` (string | string[]): Path(s) to command directories
- \`autoStart\` (boolean): Auto-execute CLI (default: true)
- \`builtinCommands\` (object): Configure built-in commands
- \`autocomplete\` (object): Shell completion configuration
- \`errorHandler\` (function): Custom error handler

### Utility Functions

#### \`createLogger()\`
Creates a styled logger with spinners and colors.

\`\`\`typescript
import { createLogger } from '@caedonai/sdk/core'

const logger = createLogger()
logger.intro('Starting...')
logger.success('Done!')
\`\`\`

#### \`execa(command, args, options)\`
Execute shell commands with proper error handling.

\`\`\`typescript
import { execa } from '@caedonai/sdk/core'

await execa('npm', ['install'], { cwd: './project' })
\`\`\`

#### File System Utilities

\`\`\`typescript
import { fs } from '@caedonai/sdk/core'

await fs.copy('./template', './output')
await fs.ensureDir('./dist')
await fs.readJson('./package.json')
\`\`\`

## Plugin System

### Git Plugin

\`\`\`typescript
import { git } from '@caedonai/sdk/plugins'

await git.clone('https://github.com/user/repo.git', './local')
await git.commit('feat: new feature')
const tags = await git.getTags()
\`\`\`

### Workspace Plugin

\`\`\`typescript
import { workspace } from '@caedonai/sdk/plugins'

const isWorkspace = await workspace.detect()
const packages = await workspace.getPackages()
\`\`\`

### Updater Plugin

\`\`\`typescript
import { updater } from '@caedonai/sdk/plugins'

const diff = await updater.getVersionDiff('1.0.0', '2.0.0')
await updater.applyUpdate(diff)
\`\`\`

## Command Definition

Commands are automatically discovered and registered:

\`\`\`typescript
// commands/build.ts
export default function(program: Command, context: CommandContext) {
  const { logger, config, prompts, execa, fs } = context
  
  program
    .command('build')
    .description('Build the project')
    .option('-w, --watch', 'Watch for changes')
    .action(async (options) => {
      logger.intro('Building project...')
      
      const spinner = logger.spinner('Compiling...')
      await execa('tsc', ['--build'])
      spinner.success('Build completed!')
      
      logger.outro('Done!')
    })
}
\`\`\`

## Security Features

The SDK includes comprehensive security validation:

- Path traversal protection
- Command injection prevention
- Error message sanitization
- Input validation framework
- Memory exhaustion protection

## Tree-shaking Optimization

Import only what you need for optimal bundle size:

\`\`\`typescript
// Import specific utilities (recommended)
import { createCLI, createLogger } from '@caedonai/sdk/core'
import { git, workspace } from '@caedonai/sdk/plugins'

// Import everything (larger bundle)
import * as SDK from '@caedonai/sdk'
\`\`\`

Bundle sizes:
- Core only: ~1.78KB
- With plugins: ~3.11KB  
- Full SDK: ~71KB

## Environment Configuration

\`\`\`typescript
// lord.config.ts
export default {
  commands: {
    directory: './src/commands',
    autoRegister: true
  },
  plugins: ['git', 'workspace'],
  security: {
    enableValidation: true,
    strictMode: true
  }
}
\`\`\`

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

\`\`\`typescript
import type { 
  CLIOptions, 
  CommandContext, 
  LoggerOptions 
} from '@caedonai/sdk/types'
\`\`\`
`;

  ensureDir(docsPath);
  writeFileSync(join(docsPath, 'api.md'), apiDocs);
  console.log('   ✅ API documentation generated');
}

function generateExamples() {
  console.log('💡 Generating Usage Examples...');
  
  const examples = `# Lord Commander CLI SDK Examples

## Basic CLI

\`\`\`typescript
import { createCLI } from '@caedonai/sdk/core'

await createCLI({
  name: 'my-tool',
  version: '1.0.0',
  description: 'My development tool'
})
\`\`\`

## Advanced CLI with Custom Commands

\`\`\`typescript
// cli.ts
import { createCLI } from '@caedonai/sdk/core'

await createCLI({
  name: 'dev-tools',
  version: '1.2.0',
  description: 'Development utilities',
  commandsPath: ['./commands/core', './commands/deploy'],
  builtinCommands: {
    completion: true,
    hello: false,
    version: true
  },
  autocomplete: {
    enabled: true,
    autoInstall: true
  }
})
\`\`\`

\`\`\`typescript
// commands/core/build.ts
export default function(program, { logger, execa, fs }) {
  program
    .command('build')
    .description('Build the project')
    .option('-w, --watch', 'Watch mode')
    .option('--prod', 'Production build')
    .action(async (options) => {
      logger.intro('🔨 Building project...')
      
      const config = options.prod ? 'production' : 'development'
      await execa('vite', ['build', '--mode', config])
      
      logger.success('Build completed!')
    })
}
\`\`\`

## Interactive Setup Wizard

\`\`\`typescript
// commands/init.ts
import { PromptFlow } from '@caedonai/sdk/core'

export default function(program, { logger, prompts, fs }) {
  program
    .command('init')
    .description('Initialize new project')
    .action(async () => {
      const flow = new PromptFlow('Project Setup', 4)
      
      const name = await flow.text('Project name:')
      const framework = await flow.select('Framework:', [
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue.js' },
        { value: 'svelte', label: 'Svelte' }
      ])
      const typescript = await flow.confirm('Use TypeScript?')
      const git = await flow.confirm('Initialize git repository?')
      
      logger.intro(\`Creating \${name} project...\`)
      
      // Create project structure
      await fs.ensureDir(name)
      await fs.copy(\`./templates/\${framework}\`, \`.//\${name}\`)
      
      if (typescript) {
        await fs.copy('./templates/typescript', \`.//\${name}\`)
      }
      
      if (git) {
        await execa('git', ['init'], { cwd: name })
      }
      
      flow.complete('Project created successfully!')
    })
}
\`\`\`

## File Operations

\`\`\`typescript
import { fs, execa } from '@caedonai/sdk/core'

// Copy templates
await fs.copy('./templates/react', './my-project')

// Ensure directories exist
await fs.ensureDir('./dist/assets')

// Read/write JSON files
const pkg = await fs.readJson('./package.json')
pkg.scripts.build = 'vite build'
await fs.writeJson('./package.json', pkg)

// Execute commands safely
await execa('npm', ['install'], { 
  cwd: './my-project',
  stdio: 'inherit'
})
\`\`\`

## Git Integration

\`\`\`typescript
import { git } from '@caedonai/sdk/plugins'

// Clone repository
await git.clone('https://github.com/user/template.git', './project')

// Get version history
const tags = await git.getTags()
const latest = tags[0]

// Compare versions
const diff = await git.getDiff('v1.0.0', 'v2.0.0')
console.log(\`Changes: \${diff.files.length} files modified\`)
\`\`\`

## Workspace Management

\`\`\`typescript
import { workspace } from '@caedonai/sdk/plugins'

// Detect workspace type
const isWorkspace = await workspace.detect()

if (isWorkspace) {
  // Get all packages
  const packages = await workspace.getPackages()
  
  // Run command in all packages
  for (const pkg of packages) {
    await execa('npm', ['test'], { cwd: pkg.path })
  }
}
\`\`\`

## Error Handling

\`\`\`typescript
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'CLI with custom error handling',
  errorHandler: async (error) => {
    // Log to external service
    await logToAnalytics(error)
    
    // Show user-friendly message
    console.error(\`❌ Something went wrong: \${error.message}\`)
    
    // Custom exit code
    process.exit(2)
  }
})
\`\`\`

## Performance Optimization

\`\`\`typescript
// Tree-shake imports for optimal bundle size
import { createCLI, createLogger } from '@caedonai/sdk/core'
import { git } from '@caedonai/sdk/plugins'

// Use selective command loading
await createCLI({
  name: 'optimized-cli',
  version: '1.0.0',
  description: 'Optimized CLI',
  builtinCommands: {
    completion: false,  // Skip if not needed
    hello: false,       // Skip example commands
    version: true       // Include only what you need
  }
})
\`\`\`
`;

  writeFileSync(join(docsPath, 'examples.md'), examples);
  console.log('   ✅ Examples generated');
}

function generateReadme() {
  console.log('📝 Updating README...');
  
  const packageJson = JSON.parse(readFileSync(resolve(rootPath, 'package.json'), 'utf-8'));
  
  const readme = `# ${packageJson.name}

${packageJson.description}

[![npm version](https://badge.fury.io/js/${packageJson.name}.svg)](https://badge.fury.io/js/${packageJson.name})
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

\`\`\`bash
npm install -g ${packageJson.name}
# or
npx ${packageJson.name}
\`\`\`

\`\`\`typescript
import { createCLI } from '@caedonai/sdk/core'

await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool'
})
\`\`\`

## ✨ Features

- 🎯 **Zero-config setup** - Auto-discovery of commands and configuration
- 🔒 **Production-ready security** - Comprehensive validation and sanitization
- 🌳 **Tree-shaking optimized** - Import only what you need (1.78KB minimum)
- 🎨 **Beautiful UX** - Interactive prompts, spinners, and styled output
- 🔧 **TypeScript first** - Full type safety and IntelliSense
- ⚡ **High performance** - Optimized bundle size and startup time
- 🔌 **Extensible** - Plugin system for git, workspaces, and more
- 🐚 **Shell completion** - Auto-complete for bash, zsh, fish, PowerShell

## 📚 Documentation

- [API Reference](./docs/api.md)
- [Usage Examples](./docs/examples.md)
- [Security Guide](./docs/security.md)
- [Performance Guide](./docs/performance.md)

## 🎯 Use Cases

- **Scaffolding Tools** - Project generators and templates
- **Build Tools** - Custom build and deployment pipelines  
- **Dev Tools** - Development utilities and automation
- **CI/CD Tools** - Continuous integration and deployment
- **System Administration** - Server management and configuration
- **Enterprise CLIs** - Internal developer tooling

## 📦 Bundle Sizes

| Import | Size | Use Case |
|--------|------|----------|
| Core only | ~1.78KB | Basic CLI functionality |
| With plugins | ~3.11KB | Git, workspace, updater features |  
| Full SDK | ~71KB | Complete feature set |

## 🔧 Development

\`\`\`bash
# Setup development environment
pnpm install
pnpm run setup-dev

# Build and test
pnpm build
pnpm test
pnpm test:cli-all

# Release
pnpm run release patch
\`\`\`

## 📄 License

MIT © 2025 ${packageJson.author || 'Lord Commander SDK Contributors'}

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 🆘 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](${packageJson.bugs?.url || '#'})
- 💬 [Discussions](${packageJson.repository?.url || '#'}/discussions)
`;

  writeFileSync(resolve(rootPath, 'README.md'), readme);
  console.log('   ✅ README updated');
}

function generateContributing() {
  console.log('🤝 Generating Contributing Guide...');
  
  const contributing = `# Contributing to Lord Commander CLI SDK

Thank you for your interest in contributing! This guide will help you get started.

## 🛠️ Development Setup

1. **Fork and Clone**
   \`\`\`bash
   git clone https://github.com/your-username/lord-commander-poc.git
   cd lord-commander-poc
   \`\`\`

2. **Setup Development Environment**
   \`\`\`bash
   pnpm install
   pnpm run scripts/setup-dev.mjs
   \`\`\`

3. **Build and Test**
   \`\`\`bash
   pnpm build
   pnpm test
   pnpm test:cli-all
   \`\`\`

## 📝 Code Standards

### TypeScript
- Use strict TypeScript configuration
- Prefer type safety over \`any\`
- Document complex types with JSDoc

### Testing
- Write tests for new features
- Maintain 100% test coverage for security features
- Use descriptive test names

### Security
- All user inputs must be validated
- Follow security patterns in existing code
- Add security tests for new attack vectors

## 🧪 Testing

### Unit Tests
\`\`\`bash
pnpm test                    # Run all unit tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report
\`\`\`

### CLI Tests
\`\`\`bash
pnpm test:cli-build         # Build validation
pnpm test:cli-integration   # E2E testing
pnpm test:cli-performance   # Performance testing
pnpm test:cli-all          # All CLI tests
\`\`\`

## 📦 Adding Features

### New Core Features
1. Add to appropriate \`src/core/\` subdirectory
2. Export from subfolder \`index.ts\`
3. Add comprehensive tests
4. Update tree-shaking configuration

### New Plugins
1. Create in \`src/plugins/\`
2. Follow existing plugin patterns
3. Add plugin tests
4. Document usage examples

### New Commands
1. Add to \`src/commands/\`
2. Use CommandContext pattern
3. Test with CLI test suite
4. Document command options

## 🔒 Security Guidelines

### Input Validation
- Validate all user inputs
- Use existing validation utilities
- Test edge cases and attack vectors
- Follow principle of least privilege

### Error Handling
- Sanitize error messages in production
- Use centralized error constants
- Provide helpful error recovery suggestions
- Test error scenarios

## 📊 Performance

### Bundle Size
- Keep core bundle under 2KB
- Use tree-shaking friendly patterns
- Avoid heavy dependencies in core
- Test bundle impact

### Startup Time
- Lazy load heavy operations
- Optimize command registration
- Profile CLI startup performance
- Maintain < 200ms startup target

## 🔄 Release Process

1. **Create Feature Branch**
   \`\`\`bash
   git checkout -b feature/my-feature
   \`\`\`

2. **Make Changes**
   - Write code following guidelines
   - Add tests and documentation
   - Ensure all tests pass

3. **Submit Pull Request**
   - Describe changes clearly
   - Reference any related issues
   - Include test results

4. **Review Process**
   - Automated tests must pass
   - Code review by maintainers
   - Address feedback promptly

## 🏷️ Commit Convention

Use conventional commits for clear history:

\`\`\`
feat: add new command registration system
fix: resolve path traversal vulnerability  
docs: update API documentation
test: add security validation tests
refactor: improve tree-shaking exports
\`\`\`

## 🐛 Bug Reports

Include in bug reports:
- Clear description of issue
- Steps to reproduce
- Expected vs actual behavior
- System information
- Minimal reproducible example

## 💡 Feature Requests

For feature requests:
- Clear use case description
- Proposed API or interface
- Alternative solutions considered
- Willingness to contribute implementation

## 📞 Getting Help

- 📖 Check documentation first
- 🔍 Search existing issues
- 💬 Start a discussion for questions
- 🐛 Create issue for bugs

## 🎉 Recognition

Contributors are recognized in:
- CHANGELOG.md for releases
- README.md contributors section
- Git history and commit messages

Thank you for contributing to Lord Commander CLI SDK! 🚀
`;

  writeFileSync(resolve(rootPath, 'CONTRIBUTING.md'), contributing);
  console.log('   ✅ Contributing guide generated');
}

function main() {
  ensureDir(docsPath);
  
  generateApiDocs();
  generateExamples();
  generateReadme();
  generateContributing();
  
  console.log('\n📊 Documentation Statistics:');
  console.log(`   📖 Files generated: 4`);
  console.log(`   📁 Output directory: ${docsPath}`);
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Review generated documentation');
  console.log('   2. Commit changes to repository');
  console.log('   3. Consider setting up automated docs generation');
  console.log('\n✅ Documentation generation completed!');
}

main().catch(error => {
  console.error('\n💥 Documentation generation failed:', error.message);
  process.exit(1);
});