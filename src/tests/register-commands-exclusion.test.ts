import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { registerCommands } from '../core/registerCommands.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('registerCommands Built-in Exclusion', () => {
  let program: Command;
  let mockContext: any;
  let tempDir: string;

  beforeEach(async () => {
    program = new Command();
    program.name('test-cli').version('1.0.0');
    
    mockContext = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    };

    // Create a temporary directory for test commands
    tempDir = join(tmpdir(), `lord-commander-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await rm(tempDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Built-in Command Exclusion', () => {
    it('should skip completion.ts during user command registration', async () => {
      // Create completion.ts in temp commands directory
      const completionPath = join(tempDir, 'completion.ts');
      await writeFile(completionPath, `
        export default function(program, context) {
          program.command('completion').description('Should be skipped');
        }
      `);

      // Create a regular user command
      const userCmdPath = join(tempDir, 'deploy.ts');
      await writeFile(userCmdPath, `
        export default function(program, context) {
          program.command('deploy').description('User command');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('deploy');
      expect(commandNames).not.toContain('completion'); // Should be skipped
    });

    it('should skip hello.ts during user command registration', async () => {
      // Create hello.ts in temp commands directory
      const helloPath = join(tempDir, 'hello.ts');
      await writeFile(helloPath, `
        export default function(program, context) {
          program.command('hello').description('Should be skipped');
        }
      `);

      // Create a regular user command
      const userCmdPath = join(tempDir, 'build.ts');
      await writeFile(userCmdPath, `
        export default function(program, context) {
          program.command('build').description('User command');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('build');
      expect(commandNames).not.toContain('hello'); // Should be skipped
    });

    it('should skip version.ts during user command registration', async () => {
      // Create version.ts in temp commands directory
      const versionPath = join(tempDir, 'version.ts');
      await writeFile(versionPath, `
        export default function(program, context) {
          program.command('version').description('Should be skipped');
        }
      `);

      // Create a regular user command
      const userCmdPath = join(tempDir, 'init.ts');
      await writeFile(userCmdPath, `
        export default function(program, context) {
          program.command('init').description('User command');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('init');
      expect(commandNames).not.toContain('version'); // Should be skipped
    });

    it('should skip all built-in commands but register user commands', async () => {
      // Create all built-in command files
      await writeFile(join(tempDir, 'completion.ts'), `
        export default function(program, context) {
          program.command('completion').description('Should be skipped');
        }
      `);
      
      await writeFile(join(tempDir, 'hello.ts'), `
        export default function(program, context) {
          program.command('hello').description('Should be skipped');
        }
      `);
      
      await writeFile(join(tempDir, 'version.ts'), `
        export default function(program, context) {
          program.command('version').description('Should be skipped');
        }
      `);

      // Create user commands
      await writeFile(join(tempDir, 'deploy.ts'), `
        export default function(program, context) {
          program.command('deploy').description('Deploy command');
        }
      `);
      
      await writeFile(join(tempDir, 'build.ts'), `
        export default function(program, context) {
          program.command('build').description('Build command');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      
      // User commands should be registered
      expect(commandNames).toContain('deploy');
      expect(commandNames).toContain('build');
      
      // Built-in commands should be skipped
      expect(commandNames).not.toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).not.toContain('version');
      
      expect(commandNames).toHaveLength(2);
    });

    it('should register user commands with similar names but different extensions', async () => {
      // Create user commands that have similar names but are not exact matches
      await writeFile(join(tempDir, 'completion-status.ts'), `
        export default function(program, context) {
          program.command('completion-status').description('User completion status command');
        }
      `);
      
      await writeFile(join(tempDir, 'hello-world.ts'), `
        export default function(program, context) {
          program.command('hello-world').description('User hello world command');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('completion-status');
      expect(commandNames).toContain('hello-world');
      expect(commandNames).toHaveLength(2);
    });

    it('should handle JavaScript files as well as TypeScript', async () => {
      // Create built-in commands as .js files (should still be skipped)
      await writeFile(join(tempDir, 'completion.js'), `
        export default function(program, context) {
          program.command('completion').description('Should be skipped');
        }
      `);
      
      await writeFile(join(tempDir, 'hello.js'), `
        export default function(program, context) {
          program.command('hello').description('Should be skipped');
        }
      `);

      // Create user command
      await writeFile(join(tempDir, 'test.js'), `
        export default function(program, context) {
          program.command('test').description('User test command');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('test');
      expect(commandNames).not.toContain('completion');
      expect(commandNames).not.toContain('hello');
      expect(commandNames).toHaveLength(1);
    });
  });

  describe('Normal Command Registration', () => {
    it('should still register non-built-in commands normally', async () => {
      // Create various user commands
      await writeFile(join(tempDir, 'deploy.ts'), `
        export default function(program, context) {
          program.command('deploy').description('Deploy application');
        }
      `);
      
      await writeFile(join(tempDir, 'build.ts'), `
        export default function(program, context) {
          program.command('build').description('Build application');
        }
      `);
      
      await writeFile(join(tempDir, 'test.ts'), `
        export default function(program, context) {
          program.command('test').description('Run tests');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('deploy');
      expect(commandNames).toContain('build');
      expect(commandNames).toContain('test');
      expect(commandNames).toHaveLength(3);
    });

    it('should skip invalid files as before', async () => {
      // Create files that should be skipped (same as before)
      await writeFile(join(tempDir, 'deploy.test.ts'), 'test file'); // test file
      await writeFile(join(tempDir, 'build.spec.ts'), 'spec file'); // spec file
      await writeFile(join(tempDir, 'index.ts'), 'index file'); // index file
      await writeFile(join(tempDir, 'types.d.ts'), 'types file'); // declaration file
      await writeFile(join(tempDir, 'readme.md'), 'readme'); // non-js/ts file

      // Create valid user command
      await writeFile(join(tempDir, 'valid.ts'), `
        export default function(program, context) {
          program.command('valid').description('Valid command');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      expect(commandNames).toEqual(['valid']);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing commands directory gracefully', async () => {
      const nonExistentDir = join(tempDir, 'non-existent');
      
      await expect(registerCommands(program, mockContext, nonExistentDir)).resolves.not.toThrow();
      
      expect(program.commands).toHaveLength(0);
      // When a specified directory doesn't exist, it logs a warning and returns early
      expect(mockContext.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Specified commands directory not found')
      );
    });

    it('should handle malformed command files gracefully', async () => {
      // Create a malformed command file
      await writeFile(join(tempDir, 'malformed.ts'), 'this is not valid javascript');
      
      // Create a valid command
      await writeFile(join(tempDir, 'valid.ts'), `
        export default function(program, context) {
          program.command('valid').description('Valid command');
        }
      `);

      await registerCommands(program, mockContext, tempDir);

      const commandNames = program.commands.map(cmd => cmd.name());
      expect(commandNames).toContain('valid');
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load command from malformed.ts')
      );
    });
  });
});