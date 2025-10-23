import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { createCLI } from '../../core/createCLI.js';
import { resetCommandTracking } from '../../core/commands/registerCommands.js';
import { ERROR_MESSAGES } from '../../core/index.js';

describe('Multiple Command Paths', () => {
  const tempDir1 = join(process.cwd(), 'temp-multi-commands-1');
  const tempDir2 = join(process.cwd(), 'temp-multi-commands-2');
  
  beforeEach(async () => {
    // Reset command tracking to prevent state pollution between tests
    resetCommandTracking();
    
    // Create temp directories
    await mkdir(tempDir1, { recursive: true });
    await mkdir(tempDir2, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directories
    await rm(tempDir1, { recursive: true, force: true });
    await rm(tempDir2, { recursive: true, force: true });
  });

  it('should support single command path (backward compatibility)', async () => {
    // Create a command in first directory with ES modules
    const deployPath = join(tempDir1, 'deploy.mjs');
    await writeFile(deployPath, `
      export default function(program, context) {
        program.command('deploy').description('Deploy the application');
      }
    `);

    const program = await createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commandsPath: tempDir1,
      builtinCommands: { completion: false, hello: false, version: false },
      autoStart: false
    });

    const commandNames = program.commands.map(cmd => cmd.name());
    expect(commandNames).toContain('deploy');
    expect(commandNames).toHaveLength(1); // Only deploy command
  });

  it('should support multiple command paths as array', async () => {
    // Create commands in first directory
    const deployPath = join(tempDir1, 'deploy.mjs');
    await writeFile(deployPath, `
      export default function(program, context) {
        program.command('deploy').description('Deploy the application');
      }
    `);

    const buildPath = join(tempDir1, 'build.mjs');
    await writeFile(buildPath, `
      export default function(program, context) {
        program.command('build').description('Build the application');
      }
    `);

    // Create commands in second directory
    const configPath = join(tempDir2, 'config.mjs');
    await writeFile(configPath, `
      export default function(program, context) {
        program.command('config').description('Manage configuration');
      }
    `);

    const testPath = join(tempDir2, 'test.mjs');
    await writeFile(testPath, `
      export default function(program, context) {
        program.command('test').description('Run tests');
      }
    `);

    const program = await createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commandsPath: [tempDir1, tempDir2],
      builtinCommands: { completion: false, hello: false, version: false },
      autoStart: false
    });

    const commandNames = program.commands.map(cmd => cmd.name());
    expect(commandNames).toContain('deploy');
    expect(commandNames).toContain('build');
    expect(commandNames).toContain('config');
    expect(commandNames).toContain('test');
    expect(commandNames).toHaveLength(4); // All four commands from both directories
  });

  it('should handle mixed array with some non-existent paths', async () => {
    // Create command in first directory only
    const deployPath = join(tempDir1, 'deploy.mjs');
    await writeFile(deployPath, `
      export default function(program, context) {
        program.command('deploy').description('Deploy the application');
      }
    `);

    // This should now throw an error due to absolute path security validation
    await expect(async () => {
      await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: [tempDir1, '/non/existent/path', tempDir2],
        builtinCommands: { completion: false, hello: false, version: false },
        autoStart: false
      });
    }).rejects.toThrow(ERROR_MESSAGES.INVALID_COMMAND_PATH('/non/existent/path'));
  });

  it('should still detect conflicts across multiple paths', async () => {
    // Create same command name in both directories
    const deployPath1 = join(tempDir1, 'deploy.mjs');
    await writeFile(deployPath1, `
      export default function(program, context) {
        program.command('deploy').description('Deploy from dir1');
      }
    `);

    const deployPath2 = join(tempDir2, 'deploy.mjs');
    await writeFile(deployPath2, `
      export default function(program, context) {
        program.command('deploy').description('Deploy from dir2');
      }
    `);

    await expect(async () => {
      await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: [tempDir1, tempDir2],
        builtinCommands: { completion: false, hello: false, version: false },
        autoStart: false
      });
    }).rejects.toThrow(/Command name conflict.*deploy/);
  });

  it('should work with built-in commands and multiple paths', async () => {
    // Create user command
    const deployPath = join(tempDir1, 'deploy.mjs');
    await writeFile(deployPath, `
      export default function(program, context) {
        program.command('deploy').description('Deploy the application');
      }
    `);

    const program = await createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commandsPath: [tempDir1, tempDir2],
      builtinCommands: { completion: true, hello: true, version: false },
      autoStart: false
    });

    const commandNames = program.commands.map(cmd => cmd.name());
    expect(commandNames).toContain('deploy');     // User command
    expect(commandNames).toContain('completion'); // Built-in
    expect(commandNames).toContain('hello');      // Built-in
    expect(commandNames).not.toContain('version'); // Disabled built-in
  });
});
