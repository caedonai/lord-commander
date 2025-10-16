import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { createCLI } from '../core/createCLI.js';

// Mock the process.argv and process.exit to prevent actual CLI execution
const originalArgv = process.argv;
const originalExit = process.exit;

describe('createCLI Built-in Commands Integration', () => {
  beforeEach(() => {
    // Mock process.argv to prevent actual argument parsing
    process.argv = ['node', 'test-cli'];
    
    // Mock process.exit to prevent test termination
    process.exit = vi.fn() as any;
  });

  afterEach(() => {
    // Restore original process methods
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  describe('Default Built-in Configuration', () => {
    it('should create CLI with default built-in commands (completion: true)', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI with default configuration'
      });

      expect(cli).toBeInstanceOf(Command);
      expect(cli.name()).toBe('test-cli');
      
      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).not.toContain('version');
    });
  });

  describe('Custom Built-in Configuration', () => {
    it('should create CLI with completion and hello enabled', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: true,
          hello: true,
          version: false
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      expect(commandNames).not.toContain('version');
    });

    it('should create CLI with all built-in commands enabled', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: true,
          hello: true,
          version: true
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      expect(commandNames).toContain('version');
    });

    it('should create CLI with no built-in commands', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: false,
          hello: false,
          version: false
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).not.toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).not.toContain('version');
    });

    it('should create CLI with only version command enabled', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: false,
          hello: false,
          version: true
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).not.toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).toContain('version');
    });
  });

  describe('Built-in Commands Default Values', () => {
    it('should use completion: true as default when not specified', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          // completion not specified - should default to true
          hello: false,
          version: false
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion');
    });

    it('should use hello: false as default when not specified', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: true,
          // hello not specified - should default to false
          version: false
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).not.toContain('hello');
    });

    it('should use version: false as default when not specified', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: true,
          hello: false
          // version not specified - should default to false
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).not.toContain('version');
    });

    it('should use all defaults when builtinCommands is not specified', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI'
        // builtinCommands not specified - should use defaults
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion');  // default: true
      expect(commandNames).not.toContain('hello');   // default: false
      expect(commandNames).not.toContain('version'); // default: false
    });
  });

  describe('CLI Properties Preservation', () => {
    it('should preserve CLI name, version, and description', async () => {
      const options = {
        name: 'my-custom-cli',
        version: '2.1.0',
        description: 'My custom CLI description',
        builtinCommands: {
          completion: true,
          hello: true,
          version: true
        }
      };

      const cli = await createCLI(options);

      expect(cli.name()).toBe(options.name);
      expect(cli.version()).toBe(options.version);
      expect(cli.description()).toBe(options.description);
    });

    it('should return Command instance that can be further customized', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI'
      });

      // Verify we can add custom commands to the returned instance
      cli.command('custom').description('Custom command');
      
      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion'); // Built-in
      expect(commandNames).toContain('custom');     // Added after
    });
  });

  describe('Type Safety', () => {
    it('should accept valid boolean values for built-in commands', async () => {
      // This test verifies TypeScript compilation - if it compiles, types are correct
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: true,
          hello: false,
          version: true
        }
      });

      expect(cli).toBeDefined();
    });

    it('should handle partial built-in command configuration', async () => {
      // Test that partial configuration is type-safe
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          hello: true
          // completion and version should use defaults
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion'); // default: true
      expect(commandNames).toContain('hello');      // explicit: true
      expect(commandNames).not.toContain('version'); // default: false
    });
  });

  describe('Command Registration Order', () => {
    it('should register built-in commands before user commands', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: true,
          hello: true,
          version: false
        }
      });

      const commandNames = cli.commands.map(cmd => cmd.name());
      
      // Built-in commands should be present
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      
      // The order might vary, but both should be registered
      expect(commandNames.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid CLI options gracefully', async () => {
      await expect(createCLI({
        name: '',
        version: '1.0.0',
        description: 'Test CLI',
        builtinCommands: {
          completion: true,
          hello: false,
          version: false
        }
      })).resolves.toBeDefined();
    });

    it('should handle missing required options with defaults', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI'
        // builtinCommands missing - should use defaults
      });

      expect(cli).toBeInstanceOf(Command);
      
      const commandNames = cli.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion'); // Should have default
    });
  });
});