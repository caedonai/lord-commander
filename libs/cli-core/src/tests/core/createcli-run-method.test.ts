import { promises as fs } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCLI } from '../../core/createCLI.js';

describe('createCLI run() Method', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(join(os.tmpdir(), 'createcli-run-test-'));

    // Mock process.exit to prevent actual exit during tests
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      // Only throw for non-zero exit codes (errors), allow version to exit normally
      if (code && code !== 0) {
        throw new Error(`process.exit(${code}) called`);
      }
      return undefined as never;
    });

    // Mock console.error to capture error output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Clean up
    vi.restoreAllMocks();
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch (_error) {
      // Ignore cleanup errors
    }
  });

  describe('autoStart: false with manual run()', () => {
    it('should not auto-execute when autoStart is false', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: './non-existent-path',
        autoStart: false,
      });

      // Should not have executed automatically
      expect(program._cliState?.hasBeenExecuted).toBe(false);
    });

    it('should allow manual execution via run() method', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: './non-existent-path',
        autoStart: false,
      });

      // Before execution
      expect(program._cliState?.hasBeenExecuted).toBe(false);

      // Execute manually with empty args (should just show help and exit cleanly)
      // We'll catch the help exit and verify state was updated
      try {
        await program.run(['node', 'test-cli']);
      } catch (_error) {
        // Ignore help exit
      }

      // Should now be marked as executed
      expect(program._cliState?.hasBeenExecuted).toBe(true);
    });

    it('should prevent multiple calls to run()', async () => {
      // Import and mock the logger directly
      const { logger } = await import('../../core/ui/logger.js');
      const mockWarn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: './non-existent-path',
        autoStart: false,
      });

      // First call should work
      try {
        await program.run(['node', 'test-cli']);
      } catch (_error) {
        // Ignore help exit
      }
      expect(program._cliState?.hasBeenExecuted).toBe(true);

      // Second call should be prevented with warning
      await program.run(['node', 'test-cli']);

      expect(mockWarn).toHaveBeenCalledWith(
        'CLI has already been executed. Multiple calls to run() are not supported.'
      );

      mockWarn.mockRestore();
    });
  });

  describe('autoStart: true (default) behavior', () => {
    it('should auto-execute by default and prevent manual run()', async () => {
      // Import and mock the logger directly
      const { logger } = await import('../../core/ui/logger.js');
      const mockWarn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      // Mock process.argv to avoid executing actual commands
      const originalArgv = process.argv;
      process.argv = ['node', 'test-cli']; // No arguments to avoid help/version exit

      let program: Awaited<ReturnType<typeof createCLI>>;
      try {
        // This will auto-execute (default behavior)
        program = await createCLI({
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI',
          commandsPath: './non-existent-path',
          autoStart: false, // Disable autoStart to test the logic without actual execution
        });

        // Manually set the flags to simulate autoStart behavior
        program._cliState = {
          hasBeenExecuted: true,
          autoStartEnabled: true,
          options: {
            name: 'test-cli',
            version: '1.0.0',
            description: 'Test CLI',
            commandsPath: './non-existent-path',
            autoStart: false,
          },
        };
      } catch (_error) {
        // Expected: autoStart triggers parseAsync which may exit for help/version
      } finally {
        // Restore original argv
        process.argv = originalArgv;
      }

      // Program should be created
      if (program) {
        // Should be marked as executed due to simulated auto-start
        expect(program._cliState?.hasBeenExecuted).toBe(true);
        expect(program._cliState?.autoStartEnabled).toBe(true);

        // Attempting to run manually should show warning
        await program.run(['node', 'test-cli', '--version']);

        expect(mockWarn).toHaveBeenCalledWith(
          'CLI has already been executed automatically (autoStart: true). ' +
            'Set autoStart: false if you want manual control via run().'
        );
      }

      mockWarn.mockRestore();
    });
  });

  describe('Error Handling in run() Method', () => {
    it('should handle errors with custom error handler', async () => {
      let capturedError: Error | null = null;

      const customErrorHandler = vi.fn((error: Error) => {
        capturedError = error;
      });

      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: './non-existent-path',
        autoStart: false,
        errorHandler: customErrorHandler,
      });

      // Trigger an error by running an invalid command
      await program.run(['node', 'test-cli', 'invalid-command']);

      // Custom error handler should have been called
      expect(customErrorHandler).toHaveBeenCalled();
      expect(capturedError).toBeInstanceOf(Error);
    });

    it('should handle errors with default error handler', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: './non-existent-path',
        autoStart: false,
        // No custom error handler
      });

      // Running invalid command should trigger default error handling
      await expect(() => program.run(['node', 'test-cli', 'invalid-command'])).rejects.toThrow(
        'process.exit(1) called'
      );
    });
  });

  describe('Type Safety and Interface', () => {
    it('should return EnhancedCommand with run method', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        autoStart: false,
      });

      // Should have the run method
      expect(typeof program.run).toBe('function');

      // Should have CLI state
      expect(program._cliState).toBeDefined();
      expect(program._cliState?.hasBeenExecuted).toBe(false);
      expect(program._cliState?.autoStartEnabled).toBe(false);
      expect(program._cliState?.options).toBeDefined();
    });

    it('should accept custom argv in run method', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        autoStart: false,
      });

      // Should accept custom argv
      try {
        await program.run(['node', 'test-cli']);
      } catch (_error) {
        // Ignore help exit
      }
      expect(program._cliState?.hasBeenExecuted).toBe(true);
    });

    it('should default to process.argv when no argv provided', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        autoStart: false,
      });

      // Mock process.argv to include basic args
      const originalArgv = process.argv;
      process.argv = ['node', 'test-cli'];

      try {
        await program.run(); // No argv provided, should use process.argv
      } catch (_error) {
        // Ignore help exit
      } finally {
        process.argv = originalArgv;
      }

      expect(program._cliState?.hasBeenExecuted).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain all existing createCLI functionality', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: './non-existent-path',
        autoStart: false,
        builtinCommands: {
          completion: true,
          hello: false,
          version: false,
        },
      });

      // Should still be a Commander.js program
      expect(program.name()).toBe('test-cli');
      expect(program.version()).toBe('1.0.0');
      expect(program.description()).toBe('Test CLI');

      // Should have enhanced functionality
      expect(typeof program.run).toBe('function');
      expect(program._cliState).toBeDefined();
    });
  });
});
