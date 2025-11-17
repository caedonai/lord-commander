# Quick Start Guide

> 🚀 Build your first CLI with the lord-commander SDK in just 5 minutes

## What You'll Build

A simple CLI tool with:
- Basic command structure
- Interactive prompts
- File operations
- Error handling
- Shell completion

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

## Installation

```bash
# Install the SDK
pnpm add @lord-commander/cli-core

# Or with npm
npm install @lord-commander/cli-core
```

## Your First CLI

Create `my-cli.ts`:

```typescript
import { createCLI } from '@lord-commander/cli-core';

// Create CLI with automatic command discovery
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My first CLI built with lord-commander SDK'
});
```

That's it! You now have a functional CLI with:
- `--help` and `--version` flags
- Shell completion support
- Error handling and graceful exits
- Colorized output and logging

## Adding Your First Command

Create `commands/greet.ts`:

```typescript
import { Command } from 'commander';
import { CommandContext } from '@caedonai/sdk/types';

export default function(program: Command, context: CommandContext) {
  const { logger, prompts } = context;
  
  program
    .command('greet')
    .description('Greet someone with a personalized message')
    .argument('[name]', 'Name to greet')
    .option('-e, --enthusiastic', 'Add enthusiasm to the greeting')
    .action(async (name, options) => {
      logger.intro('🎉 Greeting Generator');
      
      // Get name interactively if not provided
      if (!name) {
        name = await prompts.text({
          message: 'What\'s your name?',
          placeholder: 'Enter your name...'
        });
      }
      
      // Generate greeting
      const greeting = options.enthusiastic 
        ? `Hello there, ${name}! 🎉✨` 
        : `Hello, ${name}! 👋`;
        
      logger.success(greeting);
      logger.outro('Have a great day! 🌟');
    });
}
```

## Test Your CLI

```bash
# Run your CLI
node my-cli.ts greet

# With arguments
node my-cli.ts greet Alice --enthusiastic

# See help
node my-cli.ts --help
node my-cli.ts greet --help
```

## Add File Operations

Create `commands/init.ts`:

```typescript
import { Command } from 'commander';
import { CommandContext } from '@caedonai/sdk/types';
import path from 'path';

export default function(program: Command, context: CommandContext) {
  const { logger, prompts, fs, execa } = context;
  
  program
    .command('init')
    .description('Initialize a new project')
    .argument('[directory]', 'Project directory')
    .action(async (directory) => {
      logger.intro('📦 Project Initializer');
      
      // Get project details
      const projectName = directory || await prompts.text({
        message: 'Project name:',
        placeholder: 'my-awesome-project'
      });
      
      const packageManager = await prompts.select({
        message: 'Package manager:',
        options: [
          { value: 'pnpm', label: 'pnpm (recommended)' },
          { value: 'npm', label: 'npm' },
          { value: 'yarn', label: 'yarn' }
        ]
      });
      
      // Create project structure
      const projectPath = path.resolve(projectName);
      const spinner = logger.spinner('Creating project...');
      
      try {
        // Create directories
        await fs.ensureDir(projectPath);
        await fs.ensureDir(path.join(projectPath, 'src'));
        
        // Create package.json
        const packageJson = {
          name: projectName,
          version: '1.0.0',
          description: 'A new project',
          main: 'src/index.ts',
          scripts: {
            start: 'node src/index.ts',
            build: 'tsc',
            dev: 'ts-node src/index.ts'
          }
        };
        
        await fs.writeFile(
          path.join(projectPath, 'package.json'),
          JSON.stringify(packageJson, null, 2)
        );
        
        // Create entry file
        await fs.writeFile(
          path.join(projectPath, 'src', 'index.ts'),
          `console.log('Hello from ${projectName}!');\\n`
        );
        
        spinner.success(`Project created at ${projectPath}`);
        
        // Install dependencies
        const installSpinner = logger.spinner('Installing dependencies...');
        
        await execa(packageManager, ['install'], {
          cwd: projectPath,
          stdio: 'pipe'
        });
        
        installSpinner.success('Dependencies installed');
        
        logger.outro(`✨ Project ${projectName} is ready!`);
        logger.info(`\\nNext steps:`);
        logger.info(`  cd ${projectName}`);
        logger.info(`  ${packageManager} run dev`);
        
      } catch (error) {
        spinner.fail('Project creation failed');
        logger.error(error.message);
        process.exit(1);
      }
    });
}
```

## Add Shell Completion

Update your `my-cli.ts`:

```typescript
import { createCLI } from '@caedonai/sdk/core';

await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My first CLI built with lord-commander SDK',
  
  // Enable shell completion
  autocomplete: {
    enabled: true,
    autoInstall: true, // Install completion on first run
    shells: ['bash', 'zsh', 'fish'], // Target shells
    enableFileCompletion: true // File/directory completion
  }
});
```

Now your CLI has tab completion:

```bash
my-cli <TAB>           # Shows available commands
my-cli greet <TAB>     # Shows command options
my-cli init <TAB>      # Shows file/directory completion
```

## Make It Executable

Add to your `package.json`:

```json
{
  "name": "my-cli",
  "version": "1.0.0",
  "bin": {
    "my-cli": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node my-cli.ts"
  }
}
```

Build and link for global usage:

```bash
# Build TypeScript
pnpm build

# Link for global usage  
pnpm link --global

# Now use anywhere
my-cli greet --enthusiastic
```

## What You've Learned

In just 5 minutes, you've created a CLI with:

✅ **Automatic Command Discovery** - Commands are loaded from the `/commands` folder  
✅ **Interactive Prompts** - User-friendly input with validation  
✅ **File Operations** - Safe directory and file management  
✅ **Process Execution** - Running external commands with proper error handling  
✅ **Shell Completion** - Tab completion for commands and files  
✅ **Professional Logging** - Colorized output with spinners and progress  
✅ **Error Handling** - Graceful failures with helpful messages  

## Next Steps

🎯 **Ready for more?** Continue with:
- [**Basic CLI Patterns**](./02-basic-cli.md) - Core concepts and best practices
- [**Command Organization**](./03-command-registration.md) - Advanced command structure
- [**Interactive UI**](./04-interactive-prompts.md) - Rich user experiences
- [**Error Handling**](./05-error-handling.md) - Production-ready error management

## Full Example Code

<details>
<summary>Click to see complete example code</summary>

**my-cli.ts**
```typescript
import { createCLI } from '@caedonai/sdk/core';

await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My first CLI built with lord-commander SDK',
  autocomplete: {
    enabled: true,
    autoInstall: true,
    shells: ['bash', 'zsh', 'fish'],
    enableFileCompletion: true
  }
});
```

**commands/greet.ts**
```typescript
import { Command } from 'commander';
import { CommandContext } from '@caedonai/sdk/types';

export default function(program: Command, context: CommandContext) {
  const { logger, prompts } = context;
  
  program
    .command('greet')
    .description('Greet someone with a personalized message')
    .argument('[name]', 'Name to greet')
    .option('-e, --enthusiastic', 'Add enthusiasm to the greeting')
    .action(async (name, options) => {
      logger.intro('🎉 Greeting Generator');
      
      if (!name) {
        name = await prompts.text({
          message: 'What\'s your name?',
          placeholder: 'Enter your name...'
        });
      }
      
      const greeting = options.enthusiastic 
        ? `Hello there, ${name}! 🎉✨` 
        : `Hello, ${name}! 👋`;
        
      logger.success(greeting);
      logger.outro('Have a great day! 🌟');
    });
}
```

**commands/init.ts**
```typescript
import { Command } from 'commander';
import { CommandContext } from '@caedonai/sdk/types';
import path from 'path';

export default function(program: Command, context: CommandContext) {
  const { logger, prompts, fs, execa } = context;
  
  program
    .command('init')
    .description('Initialize a new project')
    .argument('[directory]', 'Project directory')
    .action(async (directory) => {
      logger.intro('📦 Project Initializer');
      
      const projectName = directory || await prompts.text({
        message: 'Project name:',
        placeholder: 'my-awesome-project'
      });
      
      const packageManager = await prompts.select({
        message: 'Package manager:',
        options: [
          { value: 'pnpm', label: 'pnpm (recommended)' },
          { value: 'npm', label: 'npm' },
          { value: 'yarn', label: 'yarn' }
        ]
      });
      
      const projectPath = path.resolve(projectName);
      const spinner = logger.spinner('Creating project...');
      
      try {
        await fs.ensureDir(projectPath);
        await fs.ensureDir(path.join(projectPath, 'src'));
        
        const packageJson = {
          name: projectName,
          version: '1.0.0',
          description: 'A new project',
          main: 'src/index.ts',
          scripts: {
            start: 'node src/index.ts',
            build: 'tsc',
            dev: 'ts-node src/index.ts'
          }
        };
        
        await fs.writeFile(
          path.join(projectPath, 'package.json'),
          JSON.stringify(packageJson, null, 2)
        );
        
        await fs.writeFile(
          path.join(projectPath, 'src', 'index.ts'),
          `console.log('Hello from ${projectName}!');\\n`
        );
        
        spinner.success(`Project created at ${projectPath}`);
        
        const installSpinner = logger.spinner('Installing dependencies...');
        await execa(packageManager, ['install'], {
          cwd: projectPath,
          stdio: 'pipe'
        });
        installSpinner.success('Dependencies installed');
        
        logger.outro(`✨ Project ${projectName} is ready!`);
        logger.info(`\\nNext steps:`);
        logger.info(`  cd ${projectName}`);
        logger.info(`  ${packageManager} run dev`);
        
      } catch (error) {
        spinner.fail('Project creation failed');
        logger.error(error.message);
        process.exit(1);
      }
    });
}
```

</details>

---

*🎉 **Congratulations!** You've built your first professional CLI. The lord-commander SDK handles the complex parts while you focus on your CLI's unique functionality.*