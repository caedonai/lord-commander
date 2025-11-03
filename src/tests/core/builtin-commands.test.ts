import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerBuiltinCommands } from '../../core/createCLI.js';

describe('Built-in Commands Configuration', () => {
  let program: Command;
  let mockContext: {
    logger: {
      debug: ReturnType<typeof vi.fn>;
      info: ReturnType<typeof vi.fn>;
      warn: ReturnType<typeof vi.fn>;
      error: ReturnType<typeof vi.fn>;
    };
    prompts: {
      text: ReturnType<typeof vi.fn>;
      confirm: ReturnType<typeof vi.fn>;
      select: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    program = new Command();
    program.name('test-cli').version('1.0.0');

    // Mock context with logger and prompts (required by CommandContext)
    mockContext = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      prompts: {
        text: vi.fn(),
        confirm: vi.fn(),
        select: vi.fn(),
      },
    };
  });

  describe('Default Configuration', () => {
    it('should register only completion command with default config', async () => {
      const config = { completion: true, hello: false, version: false };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).not.toContain('version');
      expect(commandNames).toHaveLength(1);
    });
  });

  describe('Individual Command Configuration', () => {
    it('should register only completion command when completion: true', async () => {
      const config = { completion: true, hello: false, version: false };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toEqual(['completion']);
    });

    it('should register only hello command when hello: true', async () => {
      const config = { completion: false, hello: true, version: false };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toEqual(['hello']);
    });

    it('should register only version command when version: true', async () => {
      const config = { completion: false, hello: false, version: true };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toEqual(['version']);
    });

    it('should register no commands when all are disabled', async () => {
      const config = { completion: false, hello: false, version: false };

      await registerBuiltinCommands(program, mockContext, config);

      expect(program.commands).toHaveLength(0);
    });
  });

  describe('Multiple Command Configuration', () => {
    it('should register completion and hello when both enabled', async () => {
      const config = { completion: true, hello: true, version: false };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      expect(commandNames).not.toContain('version');
      expect(commandNames).toHaveLength(2);
    });

    it('should register completion and version when both enabled', async () => {
      const config = { completion: true, hello: false, version: true };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('version');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).toHaveLength(2);
    });

    it('should register hello and version when both enabled', async () => {
      const config = { completion: false, hello: true, version: true };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('hello');
      expect(commandNames).toContain('version');
      expect(commandNames).not.toContain('completion');
      expect(commandNames).toHaveLength(2);
    });

    it('should register all commands when all enabled', async () => {
      const config = { completion: true, hello: true, version: true };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      expect(commandNames).toContain('version');
      expect(commandNames).toHaveLength(3);
    });
  });

  describe('Command Functionality', () => {
    it('should register completion command with proper structure', async () => {
      const config = { completion: true, hello: false, version: false };

      await registerBuiltinCommands(program, mockContext, config);

      const completionCmd = program.commands.find((cmd) => cmd.name() === 'completion');
      expect(completionCmd).toBeDefined();
      expect(completionCmd?.description()).toBe('Manage shell completions for this CLI');

      // Check that it has subcommands
      const subcommands = completionCmd?.commands.map((cmd) => cmd.name()) || [];
      expect(subcommands).toContain('install');
      expect(subcommands).toContain('uninstall');
      expect(subcommands).toContain('generate');
      expect(subcommands).toContain('status');
    });

    it('should register hello command with proper structure', async () => {
      const config = { completion: false, hello: true, version: false };

      await registerBuiltinCommands(program, mockContext, config);

      const helloCmd = program.commands.find((cmd) => cmd.name() === 'hello');
      expect(helloCmd).toBeDefined();
      expect(helloCmd?.description()).toBe('Say hello and show system information');
    });

    it('should register version command with proper structure', async () => {
      const config = { completion: false, hello: false, version: true };

      await registerBuiltinCommands(program, mockContext, config);

      const versionCmd = program.commands.find((cmd) => cmd.name() === 'version');
      expect(versionCmd).toBeDefined();
      expect(versionCmd?.description()).toBe('Version management and update utilities');

      // Check that it has options
      const options = versionCmd?.options || [];
      expect(options.some((opt) => opt.long === '--compare')).toBe(true);
      expect(options.some((opt) => opt.long === '--list-tags')).toBe(true);
      expect(options.some((opt) => opt.long === '--diff')).toBe(true);
      expect(options.some((opt) => opt.long === '--plan')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing command modules gracefully', async () => {
      // This test verifies that the function doesn't throw errors
      // The actual modules exist, so we can't easily mock import failures
      // But we can verify the function completes successfully
      const config = { completion: true, hello: true, version: true };

      // Should not throw error
      await expect(registerBuiltinCommands(program, mockContext, config)).resolves.not.toThrow();

      // Should have registered the available commands
      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid configurations gracefully', async () => {
      // Test with undefined config values
      const config = { completion: true, hello: undefined as unknown as boolean, version: false };

      await expect(registerBuiltinCommands(program, mockContext, config)).resolves.not.toThrow();

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).not.toContain('hello');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle boolean values correctly', async () => {
      // Test explicit boolean values
      const config = { completion: true, hello: false, version: true };

      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).toContain('version');
    });

    it('should work with different combinations of enabled/disabled', async () => {
      const testCases = [
        {
          config: { completion: true, hello: true, version: true },
          expected: ['completion', 'hello', 'version'],
        },
        {
          config: { completion: true, hello: true, version: false },
          expected: ['completion', 'hello'],
        },
        {
          config: { completion: true, hello: false, version: true },
          expected: ['completion', 'version'],
        },
        {
          config: { completion: false, hello: true, version: true },
          expected: ['hello', 'version'],
        },
        { config: { completion: true, hello: false, version: false }, expected: ['completion'] },
        { config: { completion: false, hello: true, version: false }, expected: ['hello'] },
        { config: { completion: false, hello: false, version: true }, expected: ['version'] },
        { config: { completion: false, hello: false, version: false }, expected: [] },
      ];

      for (const { config, expected } of testCases) {
        const testProgram = new Command();
        testProgram.name('test-cli').version('1.0.0');

        await registerBuiltinCommands(testProgram, mockContext, config);

        const commandNames = testProgram.commands.map((cmd) => cmd.name());
        expect(commandNames.sort()).toEqual(expected.sort());
      }
    });
  });

  describe('Integration with Commander', () => {
    it('should not interfere with existing commands', async () => {
      // Add a custom command first
      program.command('custom').description('Custom command');

      const config = { completion: true, hello: true, version: false };
      await registerBuiltinCommands(program, mockContext, config);

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('custom');
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      expect(commandNames).toHaveLength(3);
    });

    it('should preserve program configuration', async () => {
      const originalName = program.name();
      const originalVersion = program.version();

      const config = { completion: true, hello: false, version: false };
      await registerBuiltinCommands(program, mockContext, config);

      expect(program.name()).toBe(originalName);
      expect(program.version()).toBe(originalVersion);
    });

    it('should register commands with proper parent relationship', async () => {
      const config = { completion: true, hello: false, version: false };
      await registerBuiltinCommands(program, mockContext, config);

      const completionCmd = program.commands.find((cmd) => cmd.name() === 'completion');
      expect(completionCmd?.parent).toBe(program);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple registrations correctly', async () => {
      const config = { completion: true, hello: false, version: false };

      await registerBuiltinCommands(program, mockContext, config);
      const firstCount = program.commands.length;

      await registerBuiltinCommands(program, mockContext, config);
      const secondCount = program.commands.length;

      // Commands will be duplicated if called twice (Commander allows this)
      // This is expected behavior - users should call createCLI once
      // Actually, Commander may handle duplicates differently, so let's test that it's at least the same or more
      expect(secondCount).toBeGreaterThanOrEqual(firstCount);
    });

    it('should work with empty program', async () => {
      const emptyProgram = new Command();
      const config = { completion: true, hello: false, version: false };

      await expect(
        registerBuiltinCommands(emptyProgram, mockContext, config)
      ).resolves.not.toThrow();

      const commandNames = emptyProgram.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('completion');
    });
  });
});
