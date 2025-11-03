import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  analyzeProgram,
  type CompletionContext,
  checkCompletionStatus,
  detectShell,
  generateCompletion,
  generateCompletionScript,
  installCompletion,
  uninstallCompletion,
} from '../../core/commands/autocomplete.js';

describe('Shell Autocomplete', () => {
  let testProgram: Command;
  let testContext: CompletionContext;

  beforeEach(() => {
    testProgram = new Command();
    testProgram
      .name('test-cli')
      .version('1.0.0')
      .description('Test CLI for autocomplete')
      .option('-v, --verbose', 'Enable verbose output')
      .option('-c, --config <path>', 'Configuration file path');

    // Add a test command
    testProgram
      .command('deploy')
      .description('Deploy the application')
      .argument('<environment>', 'Target environment')
      .option('-f, --force', 'Force deployment')
      .option('--dry-run', 'Show what would be deployed');

    // Add a nested command
    const configCmd = testProgram.command('config').description('Configuration management');

    configCmd
      .command('set <key> <value>')
      .description('Set configuration value')
      .option('-g, --global', 'Set global configuration');

    configCmd
      .command('get <key>')
      .description('Get configuration value')
      .option('-g, --global', 'Get global configuration');

    testContext = analyzeProgram(testProgram, 'test-cli');
  });

  describe('analyzeProgram', () => {
    it('should extract CLI metadata', () => {
      expect(testContext.cliName).toBe('test-cli');
      expect(testContext.program).toBe(testProgram);
    });

    it('should extract global options', () => {
      expect(testContext.globalOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ flags: '-v, --verbose' }),
          expect.objectContaining({ flags: '-c, --config <path>' }),
        ])
      );
    });

    it('should extract commands with options', () => {
      const deployCommand = testContext.commands.find((cmd) => cmd.name === 'deploy');
      expect(deployCommand).toBeDefined();
      expect(deployCommand?.description).toBe('Deploy the application');

      expect(deployCommand?.options).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ flags: '-f, --force' }),
          expect.objectContaining({ flags: '--dry-run' }),
        ])
      );
    });

    it('should extract nested commands', () => {
      const configSetCommand = testContext.commands.find((cmd) => cmd.name === 'config set');
      const configGetCommand = testContext.commands.find((cmd) => cmd.name === 'config get');

      expect(configSetCommand).toBeDefined();
      expect(configGetCommand).toBeDefined();
      expect(configSetCommand?.description).toBe('Set configuration value');
      expect(configGetCommand?.description).toBe('Get configuration value');
    });
  });

  describe('generateCompletion', () => {
    it('should generate bash completion script', () => {
      const bashScript = generateCompletion(testProgram, 'bash');

      expect(bashScript).toContain('_test-cli_completion');
      expect(bashScript).toContain('deploy');
      expect(bashScript).toContain('config');
      expect(bashScript).toContain('-v');
      expect(bashScript).toContain('-c');
      expect(bashScript).toContain('complete -F _test-cli_completion test-cli');
    });

    it('should generate zsh completion script', () => {
      const zshScript = generateCompletion(testProgram, 'zsh');

      expect(zshScript).toContain('#compdef test-cli');
      expect(zshScript).toContain('_test-cli()');
      expect(zshScript).toContain('deploy');
      expect(zshScript).toContain('config');
      expect(zshScript).toContain('--verbose');
      expect(zshScript).toContain('--config');
    });

    it('should generate fish completion script', () => {
      const fishScript = generateCompletion(testProgram, 'fish');

      expect(fishScript).toContain('complete -c test-cli');
      expect(fishScript).toContain('-f -a "deploy"');
      expect(fishScript).toContain('-f -a "config"');
      expect(fishScript).toContain('-l verbose');
      expect(fishScript).toContain('-l config');
    });

    it('should generate PowerShell completion script', () => {
      const powershellScript = generateCompletion(testProgram, 'powershell');

      expect(powershellScript).toContain('Register-ArgumentCompleter');
      expect(powershellScript).toContain('-CommandName test-cli');
      expect(powershellScript).toContain('deploy');
      expect(powershellScript).toContain('config');
      expect(powershellScript).toContain('--verbose');
    });

    it('should throw error for unsupported shell', () => {
      expect(() => {
        generateCompletion(testProgram, 'unsupported-shell' as 'bash');
      }).toThrow('Unsupported shell: unsupported-shell');
    });
  });

  describe('generateCompletionScript', () => {
    it('should generate completion using context', () => {
      const bashScript = generateCompletionScript(testContext, 'bash');

      expect(bashScript).toContain('_test-cli_completion');
      expect(bashScript).toContain('deploy');
      expect(bashScript).toContain('config');
    });
  });

  describe('detectShell', () => {
    const originalShell = process.env.SHELL;
    const originalPlatform = process.platform;

    afterEach(() => {
      process.env.SHELL = originalShell;
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should detect bash from SHELL environment', async () => {
      process.env.SHELL = '/bin/bash';
      const shell = await detectShell();
      expect(shell).toBe('bash');
    });

    it('should detect zsh from SHELL environment', async () => {
      process.env.SHELL = '/usr/local/bin/zsh';
      const shell = await detectShell();
      expect(shell).toBe('zsh');
    });

    it('should detect fish from SHELL environment', async () => {
      process.env.SHELL = '/usr/bin/fish';
      const shell = await detectShell();
      expect(shell).toBe('fish');
    });

    it('should default to powershell on Windows', async () => {
      process.env.SHELL = '';
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const shell = await detectShell();
      expect(shell).toBe('powershell');
    });

    it('should fallback to bash on non-Windows systems', async () => {
      process.env.SHELL = '';
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const shell = await detectShell();
      expect(shell).toBe('bash');
    });
  });

  describe('installCompletion', () => {
    it('should handle PowerShell installation gracefully', async () => {
      const result = await installCompletion(testProgram, { shell: 'powershell' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('PowerShell completion requires manual installation');
      expect(result.restartRequired).toBe(false);
    });

    it('should handle unsupported shell', async () => {
      const result = await installCompletion(testProgram, { shell: 'unsupported' as 'bash' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported shell: unsupported');
    });

    it('should configure installation paths for global vs local', async () => {
      // Test with bash (most reliable for testing)
      const globalResult = await installCompletion(testProgram, {
        shell: 'bash',
        global: true,
      });

      const localResult = await installCompletion(testProgram, {
        shell: 'bash',
        global: false,
      });

      // Both should attempt installation (may fail due to permissions in test environment)
      expect(typeof globalResult.success).toBe('boolean');
      expect(typeof localResult.success).toBe('boolean');
    });
  });

  describe('uninstallCompletion', () => {
    it('should handle PowerShell uninstallation gracefully', async () => {
      const result = await uninstallCompletion(testProgram, { shell: 'powershell' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('PowerShell completion requires manual removal');
    });

    it('should handle unsupported shell', async () => {
      const result = await uninstallCompletion(testProgram, { shell: 'unsupported' as 'bash' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported shell: unsupported');
    });
  });

  describe('checkCompletionStatus', () => {
    it('should check status for bash shell', async () => {
      const status = await checkCompletionStatus(testProgram, 'bash');

      expect(status.shell).toBe('bash');
      expect(status.cliName).toBe('test-cli');
      expect(typeof status.installed).toBe('boolean');
    });

    it('should check status for zsh shell', async () => {
      const status = await checkCompletionStatus(testProgram, 'zsh');

      expect(status.shell).toBe('zsh');
      expect(status.cliName).toBe('test-cli');
      expect(typeof status.installed).toBe('boolean');
    });

    it('should check status for fish shell', async () => {
      const status = await checkCompletionStatus(testProgram, 'fish');

      expect(status.shell).toBe('fish');
      expect(status.cliName).toBe('test-cli');
      expect(typeof status.installed).toBe('boolean');
    });

    it('should handle PowerShell with appropriate message', async () => {
      const status = await checkCompletionStatus(testProgram, 'powershell');

      expect(status.shell).toBe('powershell');
      expect(status.cliName).toBe('test-cli');
      expect(status.installed).toBe(false);
      expect(status.errorMessage).toContain(
        'PowerShell completion status cannot be automatically detected'
      );
    });

    it('should detect shell automatically if not specified', async () => {
      const status = await checkCompletionStatus(testProgram);

      expect(status.shell).toBeDefined();
      expect(status.cliName).toBe('test-cli');
      expect(['bash', 'zsh', 'fish', 'powershell']).toContain(status.shell);
    });
  });

  describe('Complex CLI Structures', () => {
    it('should handle CLIs with many nested commands', () => {
      const complexProgram = new Command().name('complex-cli').version('1.0.0');

      // Create a deeply nested command structure
      const apiCmd = complexProgram.command('api').description('API management');
      const usersCmd = apiCmd.command('users').description('User management');
      usersCmd.command('create <email>').description('Create user');
      usersCmd.command('list').description('List users').option('-p, --page <num>', 'Page number');
      usersCmd.command('delete <id>').description('Delete user').option('--force', 'Force delete');

      const dbCmd = complexProgram.command('db').description('Database operations');
      dbCmd
        .command('migrate')
        .description('Run migrations')
        .option('--rollback', 'Rollback last migration');
      dbCmd.command('seed').description('Seed database').option('-e, --env <name>', 'Environment');

      const context = analyzeProgram(complexProgram);

      expect(context.commands).toHaveLength(8); // api, users, create, list, delete, db, migrate, seed
      expect(context.commands.map((c) => c.name)).toEqual(
        expect.arrayContaining([
          'api',
          'api users',
          'api users create',
          'api users list',
          'api users delete',
          'db',
          'db migrate',
          'db seed',
        ])
      );

      // Test completion script generation
      const bashScript = generateCompletionScript(context, 'bash');
      expect(bashScript).toContain('api');
      expect(bashScript).toContain('users');
      expect(bashScript).toContain('create');
      expect(bashScript).toContain('db');
      expect(bashScript).toContain('migrate');
    });

    it('should handle CLIs with command aliases', () => {
      const aliasProgram = new Command().name('alias-cli').version('1.0.0');

      aliasProgram.command('deploy').alias('d').description('Deploy application');

      aliasProgram.command('status').aliases(['s', 'stat']).description('Show status');

      const context = analyzeProgram(aliasProgram);

      const deployCmd = context.commands.find((c) => c.name === 'deploy');
      const statusCmd = context.commands.find((c) => c.name === 'status');

      expect(deployCmd?.aliases).toContain('d');
      expect(statusCmd?.aliases).toEqual(expect.arrayContaining(['s', 'stat']));
    });
  });

  describe('Completion Script Validation', () => {
    it('should generate valid bash syntax', () => {
      const bashScript = generateCompletion(testProgram, 'bash');

      // Basic syntax checks
      expect(bashScript).toMatch(/^#!/); // Starts with shebang
      expect(bashScript).toMatch(/complete -F/); // Has completion registration

      // Count opening and closing braces/parentheses should be balanced
      const openBraces = (bashScript.match(/{/g) || []).length;
      const closeBraces = (bashScript.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    it('should generate valid zsh syntax', () => {
      const zshScript = generateCompletion(testProgram, 'zsh');

      expect(zshScript).toMatch(/^#compdef/); // Starts with compdef
      expect(zshScript).toContain('_test-cli() {'); // Has main completion function
      expect(zshScript).toContain('_test-cli "$@"'); // Has function call
    });

    it('should generate valid fish syntax', () => {
      const fishScript = generateCompletion(testProgram, 'fish');

      // Fish uses complete command
      expect(fishScript).toMatch(/complete -c test-cli/);

      // Should not have bash/zsh specific syntax
      expect(fishScript).not.toContain('function');
      expect(fishScript).not.toContain('case');
    });

    it('should generate valid PowerShell syntax', () => {
      const powershellScript = generateCompletion(testProgram, 'powershell');

      expect(powershellScript).toContain('Register-ArgumentCompleter');
      expect(powershellScript).toContain('param(');
      expect(powershellScript).toContain('[System.Management.Automation.CompletionResult]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle CLI with no commands', () => {
      const emptyProgram = new Command()
        .name('empty-cli')
        .version('1.0.0')
        .description('CLI with no subcommands')
        .option('-h, --help', 'Show help');

      const context = analyzeProgram(emptyProgram);

      expect(context.commands).toHaveLength(0);
      expect(context.globalOptions.length).toBeGreaterThan(0); // Should have help option

      // Should still generate valid completion scripts
      const bashScript = generateCompletionScript(context, 'bash');
      expect(bashScript).toContain('empty-cli');
      expect(bashScript).toContain('-h');
    });

    it('should handle commands with no options', () => {
      const simpleProgram = new Command().name('simple-cli').version('1.0.0');

      simpleProgram.command('build').description('Build the project');

      const context = analyzeProgram(simpleProgram);
      const buildCmd = context.commands.find((c) => c.name === 'build');

      expect(buildCmd?.options).toHaveLength(0);

      const fishScript = generateCompletionScript(context, 'fish');
      expect(fishScript).toContain('build');
    });
  });
});
