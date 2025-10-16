# Shell Autocomplete Support

The Lord Commander CLI SDK provides comprehensive shell autocomplete (tab completion) support for bash, zsh, fish, and PowerShell shells. This enables users to quickly discover commands, options, and arguments by pressing the Tab key.

## Features

- ✅ **Multi-shell Support**: Works with bash, zsh, fish, and PowerShell
- ✅ **Command Completion**: Tab completion for all CLI commands and subcommands  
- ✅ **Option Completion**: Tab completion for command options and flags
- ✅ **Argument Completion**: File/directory completion for command arguments
- ✅ **Auto-installation**: Seamless setup during CLI creation
- ✅ **Manual Control**: Full command-line interface for managing completions

## Quick Start

### Automatic Setup (Recommended)

Enable autocomplete when creating your CLI:

```typescript
import { createCLI } from "@caedonai/sdk/core";

await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool',
  autocomplete: {
    enabled: true,        // Enable autocomplete support
    autoInstall: true,    // Automatically install on first run
    shells: ['bash', 'zsh'], // Target specific shells (optional)
    enableFileCompletion: true // Enable file/directory completion
  }
});
```

### Manual Installation

Your users can install completions manually using the built-in `completion` command:

```bash
# Install completion for current shell
my-cli completion install

# Install for specific shell
my-cli completion install --shell bash

# Install globally (system-wide)
my-cli completion install --global

# Generate completion script to stdout
my-cli completion generate --shell zsh

# Check installation status
my-cli completion status

# Remove completion
my-cli completion uninstall
```

## Shell-Specific Setup

### Bash

Completions are installed to:
- **User**: `~/.local/share/bash-completion/completions/`
- **Global**: `/etc/bash_completion.d/`

Activate completion:
```bash
# Restart shell or reload config
exec bash
# OR source the completion file
source ~/.local/share/bash-completion/completions/my-cli
```

### Zsh

Completions are installed to:
- **User**: `~/.zsh/completions/`
- **Global**: `/usr/local/share/zsh/site-functions/`

Activate completion:
```bash
# Restart shell or reload config
exec zsh
# OR reload completions
autoload -U compinit && compinit
```

### Fish

Completions are installed to:
- **User**: `~/.config/fish/completions/`  
- **Global**: `/usr/share/fish/completions/`

Fish automatically loads completions - no additional setup required.

### PowerShell

PowerShell completion requires manual installation. Add the generated completion script to your PowerShell profile:

```powershell
# Show profile location
$PROFILE

# Generate completion and add to profile
my-cli completion generate --shell powershell >> $PROFILE

# Reload profile
. $PROFILE
```

## Advanced Usage

### Custom Completion Logic

Add custom completion behavior for specific arguments:

```typescript
import { 
  createCLI, 
  analyzeProgram, 
  generateCompletion 
} from "@caedonai/sdk/core";

const program = new Command();
program
  .command('deploy <environment>')
  .description('Deploy to environment')
  .action((env) => {
    console.log(`Deploying to ${env}`);
  });

// Generate custom completion with environment-specific logic
const completionScript = generateCompletion(program, 'bash');

await createCLI({
  name: 'deploy-cli',
  autocomplete: {
    enabled: true,
    enableFileCompletion: true,
    shellCustomizations: {
      bash: `
        # Custom completion for deploy command environments
        if [[ "\${COMP_WORDS[1]}" == "deploy" ]]; then
          COMPREPLY+=( $(compgen -W "production staging development" -- \${cur}) )
        fi
      `
    }
  }
});
```

### Programmatic Completion Generation

Generate completion scripts programmatically:

```typescript
import { 
  Command,
  analyzeProgram, 
  generateCompletionScript,
  installCompletion
} from "@caedonai/sdk/core";

const program = new Command()
  .name('example-cli')
  .command('build').description('Build project')
  .command('test').description('Run tests');

// Analyze CLI structure
const context = analyzeProgram(program);

// Generate shell-specific completions
const bashScript = generateCompletionScript(context, 'bash');
const zshScript = generateCompletionScript(context, 'zsh');
const fishScript = generateCompletionScript(context, 'fish');

// Install completion programmatically
const result = await installCompletion(program, {
  shell: 'bash',
  global: false
});

if (result.success) {
  console.log('Completion installed successfully!');
}
```

## Tree-Shakeable Imports

Import only the autocomplete functionality you need:

```typescript
// Import specific completion functions
import { 
  generateCompletion, 
  installCompletion, 
  detectShell 
} from "@caedonai/sdk/core";

// Generate completion for current shell
const shell = await detectShell();
const script = generateCompletion(myProgram, shell);

// Install completion
await installCompletion(myProgram, { shell });
```

## Troubleshooting

### Completion Not Working

1. **Check installation**:
   ```bash
   my-cli completion status
   ```

2. **Verify shell support**:
   ```bash
   echo $SHELL  # Should show your current shell
   ```

3. **Reload shell configuration**:
   ```bash
   exec $SHELL  # Restart current shell
   ```

### Permission Issues

If global installation fails, try user installation:
```bash
my-cli completion install  # User installation (default)
```

Or fix permissions:
```bash
sudo my-cli completion install --global
```

### PowerShell Issues

1. Check execution policy:
   ```powershell
   Get-ExecutionPolicy
   Set-ExecutionPolicy RemoteSigned -CurrentUser
   ```

2. Verify profile exists:
   ```powershell
   Test-Path $PROFILE
   New-Item -Path $PROFILE -Type File -Force
   ```

## Implementation Details

### Completion Context

The autocomplete system analyzes your CLI structure automatically:

```typescript
interface CompletionContext {
  program: Command;      // Original Commander program
  cliName: string;       // CLI executable name
  commands: Array<{      // Parsed command structure
    name: string;
    aliases: string[];
    description: string;
    options: Array<{
      flags: string;
      description: string;
      required: boolean;
    }>;
    arguments: Array<{
      name: string;
      required: boolean;
      variadic: boolean;
    }>;
  }>;
  globalOptions: Array<{ // Global options available to all commands
    flags: string;
    description: string;
  }>;
}
```

### Script Generation

Each shell uses a different completion syntax:

- **Bash**: Uses `complete -F` with custom completion functions
- **Zsh**: Uses `#compdef` with `_arguments` specification  
- **Fish**: Uses `complete -c` with condition-based completion
- **PowerShell**: Uses `Register-ArgumentCompleter` with scriptblocks

### Installation Paths

The system follows standard completion conventions:

| Shell | User Location | Global Location |
|-------|---------------|-----------------|
| Bash | `~/.local/share/bash-completion/completions/` | `/etc/bash_completion.d/` |
| Zsh | `~/.zsh/completions/` | `/usr/local/share/zsh/site-functions/` |
| Fish | `~/.config/fish/completions/` | `/usr/share/fish/completions/` |
| PowerShell | User profile | System profile |

## Best Practices

### CLI Design for Autocomplete

1. **Use descriptive command names**:
   ```typescript
   .command('deploy')  // ✅ Clear action
   .command('d')       // ❌ Cryptic abbreviation
   ```

2. **Group related commands**:
   ```typescript
   program.command('config set <key> <value>');
   program.command('config get <key>');
   program.command('config list');
   ```

3. **Provide good descriptions**:
   ```typescript
   .command('build')
   .description('Build the application for production') // ✅ Helpful
   .description('Build stuff')                          // ❌ Vague
   ```

### User Experience

1. **Enable by default**: Most users expect tab completion
2. **Provide installation commands**: Make setup discoverable
3. **Handle edge cases**: Graceful fallbacks for unsupported shells
4. **Document shell-specific setup**: Include shell instructions in README

### Development Testing

Test completion during development:

```bash
# Generate and test completion script
my-cli completion generate --shell bash > /tmp/test-completion
source /tmp/test-completion

# Test tab completion
my-cli <TAB><TAB>
my-cli deploy --<TAB><TAB>
```

## Integration Examples

### Next.js Style CLI

```typescript
import { createCLI } from "@caedonai/sdk/core";

await createCLI({
  name: 'next-app',
  autocomplete: {
    enabled: true,
    autoInstall: true,
    enableFileCompletion: true
  }
});

// Commands: next-app build, next-app dev, next-app start
// Completion: next-app <TAB> shows available commands
//            next-app build --<TAB> shows build options
```

### Git Style CLI

```typescript
const gitClone = program
  .command('clone <repository> [directory]')
  .option('-b, --branch <name>', 'Clone specific branch')
  .option('--depth <num>', 'Shallow clone with history depth');

// Completion provides:
// git-tool clone <TAB> -> file/directory completion for paths
// git-tool clone repo --<TAB> -> --branch, --depth options
```

This comprehensive autocomplete system enhances developer productivity by making CLI discovery and usage more intuitive and efficient.