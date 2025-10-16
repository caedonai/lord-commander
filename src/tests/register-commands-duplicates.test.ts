import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { registerCommands, resetCommandTracking } from '../core/registerCommands.js';
import { createLogger } from '../core/logger.js';
import type { CommandContext } from '../types/cli.js';
import fs from 'fs';
import path from 'path';

describe('registerCommands Duplicate Detection', () => {
  let program: Command;
  let context: CommandContext;
  let tempDir1: string;
  let tempDir2: string;

  beforeEach(async () => {
    // Reset command tracking before each test
    resetCommandTracking();
    
    program = new Command('test-cli');
    context = {
      logger: createLogger(),
      prompts: {} as any,
      fs: {} as any,
      exec: {} as any,
      git: {} as any,
      config: {},
      cwd: process.cwd()
    };

    // Create temporary directories for testing
    const tmpBase = path.join(process.cwd(), 'temp-test-commands');
    tempDir1 = path.join(tmpBase, 'dir1');
    tempDir2 = path.join(tmpBase, 'dir2');
    
    // Create directories if they don't exist
    fs.mkdirSync(tempDir1, { recursive: true });
    fs.mkdirSync(tempDir2, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directories
    try {
      const tmpBase = path.join(process.cwd(), 'temp-test-commands');
      fs.rmSync(tmpBase, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    resetCommandTracking();
  });

  it('should skip duplicate registration from same path silently', async () => {
    // Create a simple command file
    const commandFile = path.join(tempDir1, 'deploy.ts');
    const commandContent = `
export default function(program, context) {
  program.command('deploy').description('Deploy application');
}`;
    fs.writeFileSync(commandFile, commandContent);

    const warnSpy = vi.spyOn(context.logger, 'warn');
    const debugSpy = vi.spyOn(context.logger, 'debug');

    // Register commands from same path twice
    await registerCommands(program, context, tempDir1);
    await registerCommands(program, context, tempDir1);

    // Should have only one command registered
    expect(program.commands.length).toBe(1);
    expect(program.commands[0].name()).toBe('deploy');
    
    // Should have logged debug message about skipping
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('Skipping already processed commands directory')
    );
    
    // Should not have warned about duplicates
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('already registered')
    );
  });

  it('should throw error when same command name exists in different paths', async () => {
    // Create command files with same name in different directories
    const deployCommand = `
export default function(program, context) {
  program.command('deploy').description('Deploy from directory');
}`;
    
    fs.writeFileSync(path.join(tempDir1, 'deploy.ts'), deployCommand);
    fs.writeFileSync(path.join(tempDir2, 'deploy.ts'), deployCommand);

    // Register first path (should succeed)
    await registerCommands(program, context, tempDir1);
    expect(program.commands.length).toBe(1);

    // Register second path with conflicting command (should throw)
    await expect(
      registerCommands(program, context, tempDir2)
    ).rejects.toThrow(/Command name conflict.*deploy.*is defined in both/);
  });

  it('should handle mixed scenarios with some conflicts and some unique commands', async () => {
    // Create files in first directory
    fs.writeFileSync(path.join(tempDir1, 'deploy.ts'), `
export default function(program, context) {
  program.command('deploy').description('Deploy app');
}`);
    
    fs.writeFileSync(path.join(tempDir1, 'build.ts'), `
export default function(program, context) {
  program.command('build').description('Build app');
}`);

    // Create files in second directory (one conflict, one unique)
    fs.writeFileSync(path.join(tempDir2, 'deploy.ts'), `
export default function(program, context) {
  program.command('deploy').description('Deploy from dir2');
}`);
    
    fs.writeFileSync(path.join(tempDir2, 'test.ts'), `
export default function(program, context) {
  program.command('test').description('Run tests');
}`);

    // Register first directory
    await registerCommands(program, context, tempDir1);
    expect(program.commands.length).toBe(2);

    // Register second directory should fail on conflict
    await expect(
      registerCommands(program, context, tempDir2)
    ).rejects.toThrow(/Command name conflict.*deploy/);
    
    // Should still only have commands from first directory
    expect(program.commands.length).toBe(2);
    const commandNames = program.commands.map(cmd => cmd.name());
    expect(commandNames).toContain('deploy');
    expect(commandNames).toContain('build');
    expect(commandNames).not.toContain('test');
  });

  it('should handle malformed command files gracefully', async () => {
    // Create a valid command
    fs.writeFileSync(path.join(tempDir1, 'valid.ts'), `
export default function(program, context) {
  program.command('valid').description('Valid command');
}`);

    // Create a malformed command file
    fs.writeFileSync(path.join(tempDir1, 'invalid.ts'), `
export default function(program, context) {
  throw new Error('Intentional error in command file');
}`);

    const errorSpy = vi.spyOn(context.logger, 'error');

    // Should register valid command and log error for invalid one
    await registerCommands(program, context, tempDir1);
    
    expect(program.commands.length).toBe(1);
    expect(program.commands[0].name()).toBe('valid');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load command from invalid.ts')
    );
  });

  it('should provide detailed conflict information', async () => {
    // Create conflicting commands
    fs.writeFileSync(path.join(tempDir1, 'config.ts'), `
export default function(program, context) {
  program.command('config').description('Config from dir1');
}`);
    
    fs.writeFileSync(path.join(tempDir2, 'config.ts'), `
export default function(program, context) {
  program.command('config').description('Config from dir2');
}`);

    await registerCommands(program, context, tempDir1);

    let error: Error | null = null;
    try {
      await registerCommands(program, context, tempDir2);
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeDefined();
    expect(error!.message).toContain('Command name conflict');
    expect(error!.message).toContain('config');
    expect(error!.message).toContain(tempDir1);
    expect(error!.message).toContain(tempDir2);
    expect(error!.message).toContain('Please rename one of the commands');
  });

  it('should reset tracking when resetCommandTracking is called', async () => {
    // Create command
    fs.writeFileSync(path.join(tempDir1, 'reset-test.ts'), `
export default function(program, context) {
  program.command('reset-test').description('Test reset');
}`);

    await registerCommands(program, context, tempDir1);
    expect(program.commands.length).toBe(1);

    // Reset tracking
    resetCommandTracking();

    // Create new program (simulating fresh start)
    program = new Command('test-cli-2');
    
    // Should be able to register again without conflicts
    await registerCommands(program, context, tempDir1);
    expect(program.commands.length).toBe(1);
  });
});