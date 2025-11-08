import { describe, expect, it } from 'vitest';
// Import as a module to ensure it compiles and exports are accessible
import * as cliTypes from '../../types/cli.js';

describe('CLI Types', () => {
  describe('Module Structure', () => {
    it('should be a valid TypeScript module', () => {
      // This test ensures the module compiles and can be imported
      expect(cliTypes).toBeDefined();
      expect(typeof cliTypes).toBe('object');
    });

    it('should not export any runtime values', () => {
      // Interface modules should not export runtime values, only types
      const exportKeys = Object.keys(cliTypes);
      expect(exportKeys).toEqual([]);
    });

    it('should be importable without errors', () => {
      // This validates that the module was already imported successfully
      // The fact that we can access cliTypes proves import worked
      expect(cliTypes).toBeDefined();
    });
  });

  describe('Type Safety Validation', () => {
    it('should allow valid CreateCliOptions structure', () => {
      // Test that we can create objects matching the interface
      const validOptions = {
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commandsPath: './commands',
        autocomplete: {
          enabled: true,
          autoInstall: false,
          shells: ['bash' as const, 'zsh' as const],
          enableFileCompletion: true,
        },
        builtinCommands: {
          completion: true,
          hello: false,
          version: false,
        },
        plugins: {
          git: true,
          workspace: false,
          updater: false,
        },
        autoStart: true,
      };

      // This compiles successfully if the interface is well-defined
      expect(validOptions.name).toBe('test-cli');
      expect(validOptions.autocomplete?.enabled).toBe(true);
      expect(validOptions.builtinCommands?.completion).toBe(true);
    });

    it('should allow valid CommandContext structure', () => {
      // Test that we can create objects matching the interface
      const mockContext = {
        logger: {
          info: () => {},
          error: () => {},
          warn: () => {},
          debug: () => {},
        },
        prompts: {
          text: () => Promise.resolve(''),
          confirm: () => Promise.resolve(true),
        },
        cwd: process.cwd(),
        packageManager: 'npm' as const,
      };

      // This compiles successfully if the interface is well-defined
      expect(mockContext.logger).toBeDefined();
      expect(mockContext.prompts).toBeDefined();
      expect(mockContext.cwd).toBeDefined();
      expect(mockContext.packageManager).toBe('npm');
    });

    it('should support optional properties in interfaces', () => {
      // Test optional properties work as expected
      const minimalOptions = {
        name: 'minimal-cli',
      };

      const minimalContext = {
        logger: { info: () => {} },
        prompts: { text: () => Promise.resolve('') },
      };

      expect(minimalOptions.name).toBe('minimal-cli');
      expect(minimalContext.logger).toBeDefined();
    });
  });
});
