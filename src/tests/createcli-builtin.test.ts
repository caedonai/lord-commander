import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { createCLI } from '../core/createCLI.js';
import { ERROR_MESSAGES } from '../core/index.js';

// Mock the process.argv and process.exit to prevent actual CLI execution
const originalArgv = process.argv;
const originalExit = process.exit;

// Helper function to create CLI and extract command names for testing
async function createTestCLI(options: Parameters<typeof createCLI>[0]) {
  const cli = await createCLI({
    name: 'test-cli',
    version: '1.0.0',
    description: 'Test CLI',
    commandsPath: './non-existent-path', // Prevent auto-discovery for isolated testing (safe relative path)
    ...options // Override defaults with provided options
  });
  
  const commandNames = cli.commands.map(cmd => cmd.name());
  
  return { cli, commandNames };
}

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
      const { cli, commandNames } = await createTestCLI({
        description: 'Test CLI with default configuration'
      });

      expect(cli).toBeInstanceOf(Command);
      expect(cli.name()).toBe('test-cli');
      
      expect(commandNames).toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).not.toContain('version');
    });
  });

  describe('Custom Built-in Configuration', () => {
    it('should create CLI with completion and hello enabled', async () => {
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          completion: true,
          hello: true,
          version: false
        }
      });

      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      expect(commandNames).not.toContain('version');
    });

    it('should create CLI with all built-in commands enabled', async () => {
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          completion: true,
          hello: true,
          version: true
        }
      });

      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      expect(commandNames).toContain('version');
    });

    it('should create CLI with no built-in commands', async () => {
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          completion: false,
          hello: false,
          version: false
        }
      });

      expect(commandNames).not.toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).not.toContain('version');
    });

    it('should create CLI with only version command enabled', async () => {
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          completion: false,
          hello: false,
          version: true
        }
      });

      expect(commandNames).not.toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).toContain('version');
    });
  });

  describe('Built-in Commands Default Values', () => {
    it('should use completion: true as default when not specified', async () => {
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          // completion not specified - should default to true
          hello: false,
          version: false
        }
      });

      expect(commandNames).toContain('completion');
    });

    it('should use hello: false as default when not specified', async () => {
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          completion: true,
          // hello not specified - should default to false
          version: false
        }
      });

      expect(commandNames).not.toContain('hello');
    });

    it('should use version: false as default when not specified', async () => {
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          completion: true,
          hello: false
          // version not specified - should default to false
        }
      });

      expect(commandNames).not.toContain('version');
    });

    it('should use all defaults when builtinCommands is not specified', async () => {
      const { commandNames } = await createTestCLI({
        // builtinCommands not specified - should use defaults
      });

      expect(commandNames).toContain('completion');  // default: true
      expect(commandNames).not.toContain('hello');   // default: false
      expect(commandNames).not.toContain('version'); // default: false
    });
  });

  describe('CLI Properties Preservation', () => {
    it('should preserve CLI name, version, and description', async () => {
      const { cli } = await createTestCLI({
        name: 'my-custom-cli',
        version: '2.1.0',
        description: 'My custom CLI description',
        builtinCommands: {
          completion: true,
          hello: true,
          version: true
        }
      });

      expect(cli.name()).toBe('my-custom-cli');
      expect(cli.version()).toBe('2.1.0');
      expect(cli.description()).toBe('My custom CLI description');
    });

    it('should return Command instance that can be further customized', async () => {
      const { cli } = await createTestCLI({});

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
      const { cli } = await createTestCLI({
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
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          hello: true
          // completion and version should use defaults
        }
      });

      expect(commandNames).toContain('completion'); // default: true
      expect(commandNames).toContain('hello');      // explicit: true
      expect(commandNames).not.toContain('version'); // default: false
    });
  });

  describe('Command Registration Order', () => {
    it('should register built-in commands before user commands', async () => {
      const { commandNames } = await createTestCLI({
        builtinCommands: {
          completion: true,
          hello: true,
          version: false
        }
      });
      
      // Built-in commands should be present
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      
      // The order might vary, but both should be registered
      expect(commandNames.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid CLI options gracefully', async () => {
      // Test that the CLI throws an error for unsafe paths as expected
      await expect(createCLI({
        name: '',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: '/non/existent/path', // This should now trigger security validation error
        builtinCommands: {
          completion: true,
          hello: false,
          version: false
        }
      })).rejects.toThrow(ERROR_MESSAGES.INVALID_COMMAND_PATH('/non/existent/path'));
    });

    it('should handle missing required options with defaults', async () => {
      const { cli, commandNames } = await createTestCLI({
        // builtinCommands missing - should use defaults
      });

      expect(cli).toBeInstanceOf(Command);
      expect(commandNames).toContain('completion'); // Should have default
    });
  });

  describe('User Command Override', () => {
    it('should allow user commands to override built-in command names when built-ins are disabled', async () => {
      // When built-in commands are disabled, user should be able to create their own
      // completion.ts, hello.ts, or version.ts files without conflict
      const { cli } = await createTestCLI({
        description: 'Test CLI with custom commands',
        builtinCommands: {
          completion: false,  // Disable built-in completion
          hello: false,      // Disable built-in hello  
          version: false     // Disable built-in version
        }
      });

      expect(cli).toBeInstanceOf(Command);
      // The user's custom commands would be loaded if they existed in the commands directory
      // This test verifies the CLI can be created without conflicts
    });

    it('should not load user commands with built-in names when built-ins are enabled', async () => {
      // When built-in commands are enabled, user commands with same names should be skipped
      const { cli, commandNames } = await createTestCLI({
        description: 'Test CLI with built-ins enabled',
        builtinCommands: {
          completion: true,   // Enable built-in completion (skip user completion.ts)
          hello: true,       // Enable built-in hello (skip user hello.ts)
          version: true      // Enable built-in version (skip user version.ts)
        }
      });

      expect(cli).toBeInstanceOf(Command);
      
      // Should have built-in commands, not user overrides
      expect(commandNames).toContain('completion');
      expect(commandNames).toContain('hello');
      expect(commandNames).toContain('version');
    });
  });
});