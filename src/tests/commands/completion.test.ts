import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import completionCommand from '../../commands/completion.js';
import type { CommandContext } from '../../types/cli.js';
import type { CompletionResult, CompletionStatus } from '../../core/commands/autocomplete.js';

// Mock the autocomplete module
vi.mock('../../core/commands/autocomplete.js', () => ({
  checkCompletionStatus: vi.fn(),
  detectShell: vi.fn(),
  generateCompletion: vi.fn(),
  installCompletion: vi.fn(),
  uninstallCompletion: vi.fn(),
}));

// Mock fs/promises for file operations
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
}));

describe('Completion Command', () => {
  let program: Command;
  let mockLogger: Record<string, ReturnType<typeof vi.fn>>;
  let context: CommandContext;
  let mockCheckCompletionStatus: ReturnType<typeof vi.fn>;
  let mockDetectShell: ReturnType<typeof vi.fn>;
  let mockGenerateCompletion: ReturnType<typeof vi.fn>;
  let mockInstallCompletion: ReturnType<typeof vi.fn>;
  let mockUninstallCompletion: ReturnType<typeof vi.fn>;
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;
  let mockPrompts: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    // Import mocked modules
    const {
      checkCompletionStatus,
      detectShell,
      generateCompletion,
      installCompletion,
      uninstallCompletion,
    } = await import('../../core/commands/autocomplete.js');

    // Store mocked functions
    mockCheckCompletionStatus = vi.mocked(checkCompletionStatus);
    mockDetectShell = vi.mocked(detectShell);
    mockGenerateCompletion = vi.mocked(generateCompletion);
    mockInstallCompletion = vi.mocked(installCompletion);
    mockUninstallCompletion = vi.mocked(uninstallCompletion);

    // Mock console.log for script output
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Create mock logger with spinner that returns stop() method
    const mockSpinnerInstance = {
      stop: vi.fn(),
    };

    mockLogger = {
      intro: vi.fn(),
      outro: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      note: vi.fn(),
      spinner: vi.fn(() => mockSpinnerInstance),
    };

    // Create mock prompts
    mockPrompts = {
      intro: vi.fn(),
      outro: vi.fn(),
      text: vi.fn().mockResolvedValue('test-input'),
      confirm: vi.fn().mockResolvedValue(true),
      select: vi.fn().mockResolvedValue('option1'),
      multiselect: vi.fn().mockResolvedValue(['option1']),
      spinner: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn(), message: vi.fn() }),
      note: vi.fn(),
    };

    // Create context
    context = {
      logger: mockLogger,
      prompts: mockPrompts,
    } as unknown as CommandContext;

    // Create fresh command program
    program = new Command();
    program.exitOverride();

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockConsoleLog.mockRestore();
  });

  describe('Command Registration', () => {
    it('should register completion command with correct name and description', () => {
      completionCommand(program, context);

      const commands = program.commands;
      const completionCmd = commands.find((cmd) => cmd.name() === 'completion');

      expect(completionCmd).toBeDefined();
      expect(completionCmd?.description()).toBe('Manage shell completions for this CLI');
    });

    it('should register all subcommands', () => {
      completionCommand(program, context);

      const completionCmd = program.commands.find((cmd) => cmd.name() === 'completion');
      const subcommands = completionCmd?.commands || [];
      const subcommandNames = subcommands.map((cmd) => cmd.name());

      expect(subcommandNames).toContain('install');
      expect(subcommandNames).toContain('uninstall');
      expect(subcommandNames).toContain('generate');
      expect(subcommandNames).toContain('status');
    });

    it('should register install subcommand with options', () => {
      completionCommand(program, context);

      const completionCmd = program.commands.find((cmd) => cmd.name() === 'completion');
      const installCmd = completionCmd?.commands.find((cmd) => cmd.name() === 'install');
      const options = installCmd?.options;

      expect(installCmd?.description()).toBe('Install shell completion for the current shell');
      expect(options?.some((opt) => opt.long === '--shell')).toBe(true);
      expect(options?.some((opt) => opt.short === '-s')).toBe(true);
      expect(options?.some((opt) => opt.long === '--global')).toBe(true);
      expect(options?.some((opt) => opt.short === '-g')).toBe(true);
      expect(options?.some((opt) => opt.long === '--force')).toBe(true);
    });

    it('should register uninstall subcommand with options', () => {
      completionCommand(program, context);

      const completionCmd = program.commands.find((cmd) => cmd.name() === 'completion');
      const uninstallCmd = completionCmd?.commands.find((cmd) => cmd.name() === 'uninstall');
      const options = uninstallCmd?.options;

      expect(uninstallCmd?.description()).toBe('Remove shell completion');
      expect(options?.some((opt) => opt.long === '--shell')).toBe(true);
      expect(options?.some((opt) => opt.short === '-s')).toBe(true);
      expect(options?.some((opt) => opt.long === '--global')).toBe(true);
      expect(options?.some((opt) => opt.short === '-g')).toBe(true);
    });

    it('should register generate subcommand with options', () => {
      completionCommand(program, context);

      const completionCmd = program.commands.find((cmd) => cmd.name() === 'completion');
      const generateCmd = completionCmd?.commands.find((cmd) => cmd.name() === 'generate');
      const options = generateCmd?.options;

      expect(generateCmd?.description()).toBe('Generate completion script for manual installation');
      expect(options?.some((opt) => opt.long === '--shell')).toBe(true);
      expect(options?.some((opt) => opt.short === '-s')).toBe(true);
      expect(options?.some((opt) => opt.long === '--output')).toBe(true);
      expect(options?.some((opt) => opt.short === '-o')).toBe(true);
    });

    it('should register status subcommand with options', () => {
      completionCommand(program, context);

      const completionCmd = program.commands.find((cmd) => cmd.name() === 'completion');
      const statusCmd = completionCmd?.commands.find((cmd) => cmd.name() === 'status');
      const options = statusCmd?.options;

      expect(statusCmd?.description()).toBe('Show completion installation status');
      expect(options?.some((opt) => opt.long === '--shell')).toBe(true);
      expect(options?.some((opt) => opt.short === '-s')).toBe(true);
    });
  });

  describe('Install Subcommand', () => {
    beforeEach(() => {
      completionCommand(program, context);
    });

    it('should install completion successfully with default shell', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockInstallCompletion.mockResolvedValue({
        success: true,
        restartRequired: false,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'install']);

      expect(mockLogger.intro).toHaveBeenCalledWith('Installing shell completion...');
      expect(mockDetectShell).toHaveBeenCalled();
      expect(mockLogger.spinner).toHaveBeenCalledWith('Installing completion for bash...');
      expect(mockInstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'bash',
        global: undefined,
        force: undefined,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion installed successfully!');
      expect(mockLogger.outro).toHaveBeenCalledWith('Shell completion is now active! 🎉');
    });

    it('should install completion with specific shell', async () => {
      mockInstallCompletion.mockResolvedValue({
        success: true,
        restartRequired: false,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'install', '--shell', 'zsh']);

      expect(mockDetectShell).not.toHaveBeenCalled();
      expect(mockLogger.spinner).toHaveBeenCalledWith('Installing completion for zsh...');
      expect(mockInstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'zsh',
        global: undefined,
        force: undefined,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion installed successfully!');
    });

    it('should install completion globally', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockInstallCompletion.mockResolvedValue({
        success: true,
        restartRequired: false,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'install', '--global']);

      expect(mockInstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'bash',
        global: true,
        force: undefined,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion installed successfully!');
    });

    it('should install completion with force flag', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockInstallCompletion.mockResolvedValue({
        success: true,
        restartRequired: false,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'install', '--force']);

      expect(mockInstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'bash',
        global: undefined,
        force: true,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion installed successfully!');
    });

    it('should handle installation requiring restart', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockInstallCompletion.mockResolvedValue({
        success: true,
        restartRequired: true,
        activationCommand: 'source ~/.bashrc',
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'install']);

      expect(mockLogger.success).toHaveBeenCalledWith('Completion installed successfully!');
      expect(mockLogger.note).toHaveBeenCalledWith('Restart your shell or run the following to activate:', undefined);
      expect(mockLogger.info).toHaveBeenCalledWith('  source ~/.bashrc');
    });

    it('should handle installation failure', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockInstallCompletion.mockResolvedValue({
        success: false,
        error: 'Permission denied',
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'install']);

      expect(mockLogger.error).toHaveBeenCalledWith('Installation failed: Permission denied');
    });

    it('should handle installation error exception', async () => {
      mockDetectShell.mockRejectedValue(new Error('Shell detection failed'));

      await program.parseAsync(['node', 'test', 'completion', 'install']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to install completion: Shell detection failed');
    });

    it('should handle non-error thrown during installation', async () => {
      mockDetectShell.mockRejectedValue('String error');

      await program.parseAsync(['node', 'test', 'completion', 'install']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to install completion: String error');
    });
  });

  describe('Uninstall Subcommand', () => {
    beforeEach(() => {
      completionCommand(program, context);
    });

    it('should uninstall completion successfully with default shell', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockUninstallCompletion.mockResolvedValue({
        success: true,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'uninstall']);

      expect(mockLogger.intro).toHaveBeenCalledWith('Removing shell completion...');
      expect(mockDetectShell).toHaveBeenCalled();
      expect(mockLogger.spinner).toHaveBeenCalledWith('Removing completion for bash...');
      expect(mockUninstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'bash',
        global: undefined,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion removed successfully!');
      expect(mockLogger.outro).toHaveBeenCalledWith('Shell completion has been disabled.');
    });

    it('should uninstall completion with specific shell', async () => {
      mockUninstallCompletion.mockResolvedValue({
        success: true,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'uninstall', '--shell', 'zsh']);

      expect(mockDetectShell).not.toHaveBeenCalled();
      expect(mockUninstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'zsh',
        global: undefined,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion removed successfully!');
    });

    it('should uninstall completion globally', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockUninstallCompletion.mockResolvedValue({
        success: true,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'uninstall', '--global']);

      expect(mockUninstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'bash',
        global: true,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion removed successfully!');
    });

    it('should handle uninstallation failure', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockUninstallCompletion.mockResolvedValue({
        success: false,
        error: 'File not found',
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'uninstall']);

      expect(mockLogger.error).toHaveBeenCalledWith('Removal failed: File not found');
    });

    it('should handle uninstallation error exception', async () => {
      mockDetectShell.mockRejectedValue(new Error('Shell detection failed'));

      await program.parseAsync(['node', 'test', 'completion', 'uninstall']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to remove completion: Shell detection failed');
    });

    it('should handle non-error thrown during uninstallation', async () => {
      mockDetectShell.mockRejectedValue('String error');

      await program.parseAsync(['node', 'test', 'completion', 'uninstall']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to remove completion: String error');
    });
  });

  describe('Generate Subcommand', () => {
    let mockWriteFile: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      completionCommand(program, context);
      
      // Import and mock fs/promises
      const fs = await import('node:fs/promises');
      mockWriteFile = vi.mocked(fs.writeFile);
    });

    it('should generate completion script to stdout with default shell', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockGenerateCompletion.mockReturnValue('completion script content');

      await program.parseAsync(['node', 'test', 'completion', 'generate']);

      expect(mockDetectShell).toHaveBeenCalled();
      expect(mockGenerateCompletion).toHaveBeenCalledWith(program, 'bash');
      expect(mockConsoleLog).toHaveBeenCalledWith('completion script content');
    });

    it('should generate completion script with specific shell', async () => {
      mockGenerateCompletion.mockReturnValue('zsh completion script');

      await program.parseAsync(['node', 'test', 'completion', 'generate', '--shell', 'zsh']);

      expect(mockDetectShell).not.toHaveBeenCalled();
      expect(mockGenerateCompletion).toHaveBeenCalledWith(program, 'zsh');
      expect(mockConsoleLog).toHaveBeenCalledWith('zsh completion script');
    });

    it('should generate completion script to file', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockGenerateCompletion.mockReturnValue('completion script content');
      mockWriteFile.mockResolvedValue(undefined);

      await program.parseAsync(['node', 'test', 'completion', 'generate', '--output', '/tmp/completion.sh']);

      expect(mockGenerateCompletion).toHaveBeenCalledWith(program, 'bash');
      expect(mockWriteFile).toHaveBeenCalledWith('/tmp/completion.sh', 'completion script content', 'utf-8');
      expect(mockLogger.success).toHaveBeenCalledWith('Completion script written to /tmp/completion.sh');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should generate completion script with short options', async () => {
      mockGenerateCompletion.mockReturnValue('fish completion script');
      mockWriteFile.mockResolvedValue(undefined);

      await program.parseAsync(['node', 'test', 'completion', 'generate', '-s', 'fish', '-o', 'output.fish']);

      expect(mockGenerateCompletion).toHaveBeenCalledWith(program, 'fish');
      expect(mockWriteFile).toHaveBeenCalledWith('output.fish', 'fish completion script', 'utf-8');
      expect(mockLogger.success).toHaveBeenCalledWith('Completion script written to output.fish');
    });

    it('should handle generation error', async () => {
      mockDetectShell.mockRejectedValue(new Error('Shell detection failed'));

      await program.parseAsync(['node', 'test', 'completion', 'generate']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to generate completion: Shell detection failed');
    });

    it('should handle file write error', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockGenerateCompletion.mockReturnValue('completion script');
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      await program.parseAsync(['node', 'test', 'completion', 'generate', '--output', '/root/completion.sh']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to generate completion: Permission denied');
    });

    it('should handle non-error thrown during generation', async () => {
      mockDetectShell.mockRejectedValue('String error');

      await program.parseAsync(['node', 'test', 'completion', 'generate']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to generate completion: String error');
    });
  });

  describe('Status Subcommand', () => {
    beforeEach(() => {
      completionCommand(program, context);
    });

    it('should show status for detected shell', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockCheckCompletionStatus.mockResolvedValue({
        cliName: 'test-cli',
        shell: 'bash',
        installed: true,
        installationPath: '/home/user/.local/share/bash-completion/completions/test-cli',
        installationType: 'local',
        isActive: true,
      } as CompletionStatus);

      await program.parseAsync(['node', 'test', 'completion', 'status']);

      expect(mockLogger.intro).toHaveBeenCalledWith('Checking completion status...');
      expect(mockDetectShell).toHaveBeenCalled();
      expect(mockCheckCompletionStatus).toHaveBeenCalledWith(program, 'bash');
      
      expect(mockLogger.info).toHaveBeenCalledWith('CLI Name: test-cli');
      expect(mockLogger.info).toHaveBeenCalledWith('Detected Shell: bash');
      expect(mockLogger.info).toHaveBeenCalledWith('Checking Shell: bash');
      expect(mockLogger.success).toHaveBeenCalledWith('✓ Completion is installed');
      expect(mockLogger.info).toHaveBeenCalledWith('  Installation Path: /home/user/.local/share/bash-completion/completions/test-cli');
      expect(mockLogger.info).toHaveBeenCalledWith('  Installation Type: local');
      expect(mockLogger.success).toHaveBeenCalledWith('  Status: Active and working');
      expect(mockLogger.outro).toHaveBeenCalledWith('Completion status check complete');
    });

    it('should show status for specific shell', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockCheckCompletionStatus.mockResolvedValue({
        cliName: 'test-cli',
        shell: 'zsh',
        installed: false,
      } as CompletionStatus);

      await program.parseAsync(['node', 'test', 'completion', 'status', '--shell', 'zsh']);

      expect(mockCheckCompletionStatus).toHaveBeenCalledWith(program, 'zsh');
      expect(mockLogger.info).toHaveBeenCalledWith('Detected Shell: bash');
      expect(mockLogger.info).toHaveBeenCalledWith('Checking Shell: zsh (specified)');
      expect(mockLogger.warn).toHaveBeenCalledWith('✗ Completion is not installed');
      expect(mockLogger.note).toHaveBeenCalledWith('Run `completion install` to set up shell completion', undefined);
      expect(mockLogger.outro).toHaveBeenCalledWith('To install completion, run: completion install');
    });

    it('should show status when completion is installed but not active', async () => {
      mockDetectShell.mockResolvedValue('zsh');
      mockCheckCompletionStatus.mockResolvedValue({
        cliName: 'test-cli',
        shell: 'zsh',
        installed: true,
        installationPath: '/home/user/.zsh/completions/_test-cli',
        installationType: 'local',
        isActive: false,
      } as CompletionStatus);

      await program.parseAsync(['node', 'test', 'completion', 'status']);

      expect(mockLogger.success).toHaveBeenCalledWith('✓ Completion is installed');
      expect(mockLogger.warn).toHaveBeenCalledWith('  Status: Installed but may not be active');
      expect(mockLogger.outro).toHaveBeenCalledWith('Completion installed but may need shell restart. Try: exec $SHELL');
    });

    it('should show status when completion status is unknown', async () => {
      mockDetectShell.mockResolvedValue('fish');
      mockCheckCompletionStatus.mockResolvedValue({
        cliName: 'test-cli',
        shell: 'fish',
        installed: true,
        installationPath: '/home/user/.config/fish/completions/test-cli.fish',
        installationType: 'local',
        isActive: undefined,
      } as CompletionStatus);

      await program.parseAsync(['node', 'test', 'completion', 'status']);

      expect(mockLogger.note).toHaveBeenCalledWith('  Status: Cannot determine if active (manual verification needed)', undefined);
    });

    it('should show error message when present', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockCheckCompletionStatus.mockResolvedValue({
        cliName: 'test-cli',
        shell: 'bash',
        installed: true,
        installationPath: '/etc/bash_completion.d/test-cli',
        installationType: 'global',
        isActive: true,
        errorMessage: 'Warning: Global installation detected',
      } as CompletionStatus);

      await program.parseAsync(['node', 'test', 'completion', 'status']);

      expect(mockLogger.warn).toHaveBeenCalledWith('Note: Warning: Global installation detected');
    });

    it('should handle status check error', async () => {
      mockDetectShell.mockRejectedValue(new Error('Shell detection failed'));

      await program.parseAsync(['node', 'test', 'completion', 'status']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to check status: Shell detection failed');
    });

    it('should handle non-error thrown during status check', async () => {
      mockDetectShell.mockRejectedValue('String error');

      await program.parseAsync(['node', 'test', 'completion', 'status']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to check status: String error');
    });
  });

  describe('Short Flag Support', () => {
    beforeEach(() => {
      completionCommand(program, context);
    });

    it('should support short flags for install command', async () => {
      mockInstallCompletion.mockResolvedValue({
        success: true,
        restartRequired: false,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'install', '-s', 'zsh', '-g']);

      expect(mockInstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'zsh',
        global: true,
        force: undefined,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion installed successfully!');
    });

    it('should support short flags for uninstall command', async () => {
      mockUninstallCompletion.mockResolvedValue({
        success: true,
      } as CompletionResult);

      await program.parseAsync(['node', 'test', 'completion', 'uninstall', '-s', 'fish', '-g']);

      expect(mockUninstallCompletion).toHaveBeenCalledWith(program, {
        shell: 'fish',
        global: true,
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Completion removed successfully!');
    });

    it('should support short flags for status command', async () => {
      mockDetectShell.mockResolvedValue('bash');
      mockCheckCompletionStatus.mockResolvedValue({
        cliName: 'test-cli',
        shell: 'powershell',
        installed: false,
      } as CompletionStatus);

      await program.parseAsync(['node', 'test', 'completion', 'status', '-s', 'powershell']);

      expect(mockCheckCompletionStatus).toHaveBeenCalledWith(program, 'powershell');
    });
  });
});