import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetCommandTracking } from '../../../core/commands/registerCommands.js';
import { createCLI } from '../../../core/createCLI.js';
import { ERROR_MESSAGES } from '../../../core/index.js';

/**
 * Helper function to create a matcher for invalid path error messages
 */
function expectInvalidPathError(path?: string) {
  if (path) {
    return ERROR_MESSAGES.INVALID_COMMAND_PATH(path);
  }
  // For cases where we want to match any invalid path error
  return /Invalid or unsafe commands directory path/;
}

describe('Security Edge Cases - Multiple Command Paths', () => {
  const tempDir = join(process.cwd(), 'temp-security-test');

  beforeEach(async () => {
    resetCommandTracking();
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    resetCommandTracking();
  });

  describe('Path Traversal Protection', () => {
    it('should block simple path traversal attempts', async () => {
      await expect(async () => {
        await createCLI({
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI',
          commandsPath: ['../../../..'],
          builtinCommands: { completion: false, hello: false, version: false },
          autoStart: false,
        });
      }).rejects.toThrow(ERROR_MESSAGES.INVALID_COMMAND_PATH('../../../..'));
    });

    it('should block complex path traversal attempts', async () => {
      const maliciousPaths = [
        '../../../../../../etc',
        '../../../Windows/System32',
        '..\\..\\..\\..\\',
        '../../../../Program Files',
        '../../../Users',
      ];

      for (const maliciousPath of maliciousPaths) {
        await expect(async () => {
          await createCLI({
            name: 'test-cli',
            version: '1.0.0',
            description: 'Test CLI',
            commandsPath: [maliciousPath],
            builtinCommands: { completion: false, hello: false, version: false },
            autoStart: false,
          });
        }).rejects.toThrow(expectInvalidPathError());
      }
    });

    it('should block absolute path attempts', async () => {
      const absolutePaths = [
        'C:\\Windows\\System32',
        '/etc/passwd',
        'C:\\',
        '/bin',
        'C:\\Program Files',
      ];

      for (const absolutePath of absolutePaths) {
        await expect(async () => {
          await createCLI({
            name: 'test-cli',
            version: '1.0.0',
            description: 'Test CLI',
            commandsPath: [absolutePath],
            builtinCommands: { completion: false, hello: false, version: false },
            autoStart: false,
          });
        }).rejects.toThrow(expectInvalidPathError());
      }
    });

    it('should block mixed safe and unsafe paths', async () => {
      // Even if one path is safe, if any path is unsafe, it should fail
      await expect(async () => {
        await createCLI({
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI',
          commandsPath: ['./safe-path', '../../../unsafe'],
          builtinCommands: { completion: false, hello: false, version: false },
          autoStart: false,
        });
      }).rejects.toThrow(ERROR_MESSAGES.INVALID_COMMAND_PATH('../../../unsafe'));
    });
  });

  describe('Valid Path Acceptance', () => {
    it('should allow valid relative paths', async () => {
      const validPaths = ['./commands', 'src/commands', './src/nested/commands', 'commands/admin'];

      for (const validPath of validPaths) {
        // Should not throw an error (even if directory doesn't exist, it just warns)
        await expect(
          createCLI({
            name: 'test-cli',
            version: '1.0.0',
            description: 'Test CLI',
            commandsPath: [validPath],
            builtinCommands: { completion: false, hello: false, version: false },
            autoStart: false,
          })
        ).resolves.not.toThrow();
      }
    });

    it('should allow current directory reference without conflicts', async () => {
      // Create a clean test directory to avoid node_modules conflicts
      const cleanDir = join(tempDir, 'clean-commands');
      await mkdir(cleanDir, { recursive: true });

      await writeFile(
        join(cleanDir, 'test.mjs'),
        `
        export default function(program, context) {
          program.command('clean-test').description('Clean test command');
        }
      `
      );

      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: [cleanDir],
        builtinCommands: { completion: false, hello: false, version: false },
        autoStart: false,
      });

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('clean-test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array gracefully', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: [],
        builtinCommands: { completion: false, hello: false, version: false },
        autoStart: false,
      });

      expect(program.commands).toHaveLength(0);
    });

    it('should filter out null/undefined values and validate remaining paths', async () => {
      await expect(async () => {
        await createCLI({
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI',
          commandsPath: [null, './safe', undefined, '../unsafe'] as string[],
          builtinCommands: { completion: false, hello: false, version: false },
          autoStart: false,
        });
      }).rejects.toThrow(ERROR_MESSAGES.INVALID_COMMAND_PATH('../unsafe'));
    });

    it('should handle special characters in valid paths', async () => {
      // Create directory with special chars
      const specialDir = join(tempDir, 'commands-with-spaces and (symbols)');
      await mkdir(specialDir, { recursive: true });

      // Create a valid command file
      await writeFile(
        join(specialDir, 'test.mjs'),
        `
        export default function(program, context) {
          program.command('test').description('Test command');
        }
      `
      );

      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: [specialDir],
        builtinCommands: { completion: false, hello: false, version: false },
        autoStart: false,
      });

      const commandNames = program.commands.map((cmd) => cmd.name());
      expect(commandNames).toContain('test');
    });

    it('should handle very long but valid paths', async () => {
      // Create a deeply nested valid directory
      const deepPath = join(tempDir, 'a'.repeat(50), 'b'.repeat(50), 'commands');
      await mkdir(deepPath, { recursive: true });

      await expect(
        createCLI({
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI',
          commandsPath: [deepPath],
          builtinCommands: { completion: false, hello: false, version: false },
          autoStart: false,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Windows-specific Security Tests', () => {
    it('should block UNC path attempts', async () => {
      const uncPaths = ['\\\\server\\share', '\\\\localhost\\c$', '\\\\?\\C:\\Windows'];

      for (const uncPath of uncPaths) {
        await expect(async () => {
          await createCLI({
            name: 'test-cli',
            version: '1.0.0',
            description: 'Test CLI',
            commandsPath: [uncPath],
            builtinCommands: { completion: false, hello: false, version: false },
            autoStart: false,
          });
        }).rejects.toThrow(expectInvalidPathError());
      }
    });

    it('should block drive root access attempts', async () => {
      const driveRoots = ['C:\\', 'D:\\', 'C:/', 'D:/'];

      for (const driveRoot of driveRoots) {
        await expect(async () => {
          await createCLI({
            name: 'test-cli',
            version: '1.0.0',
            description: 'Test CLI',
            commandsPath: [driveRoot],
            builtinCommands: { completion: false, hello: false, version: false },
            autoStart: false,
          });
        }).rejects.toThrow(expectInvalidPathError());
      }
    });
  });
});
