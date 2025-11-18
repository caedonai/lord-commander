import { describe, expect, it } from 'vitest';
import { createCLI } from '../core/createCLI.js';

describe('CLI Integration Tests', () => {
  describe('Basic CLI Creation', () => {
    it('should create a minimal CLI successfully', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        description: 'Test CLI',
        version: '1.0.0',
        autoStart: false,
      });

      expect(cli).toBeDefined();
      expect(typeof cli.name).toBe('function'); // Commander.js methods
    });

    it('should create CLI with custom commands path', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        description: 'Test CLI',
        version: '1.0.0',
        commandsPath: './commands',
        autoStart: false,
      });

      expect(cli).toBeDefined();
    });
  });

  describe('Built-in Commands', () => {
    it('should include completion command by default', async () => {
      const cli = await createCLI({
        name: 'test-cli',
        description: 'Test CLI',
        version: '1.0.0',
        autoStart: false,
        builtinCommands: { completion: true },
      });

      expect(cli).toBeDefined();
      expect(cli.commands).toBeDefined();
    });
  });
});
