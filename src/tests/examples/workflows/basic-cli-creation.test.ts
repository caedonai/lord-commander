import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as indexModule from '../../../index.js';
import * as workflowModule from '../../../examples/workflows/basic-cli-creation.js';

// Mock the main index module
vi.mock('../../../index.js', () => ({
  createCLI: vi.fn(() => Promise.resolve({
    name: vi.fn(),
    version: vi.fn(),
    description: vi.fn(),
    command: vi.fn(() => ({
      description: vi.fn(),
      argument: vi.fn(),
      option: vi.fn(),
      action: vi.fn(),
    })),
    parseAsync: vi.fn(),
    run: vi.fn(),
  })),
}));

describe('Basic CLI Creation Workflow - Fixed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createMinimalCLI', () => {
    it('should create a minimal CLI with basic configuration', async () => {
      const cli = await workflowModule.createMinimalCLI();

      expect(indexModule.createCLI).toHaveBeenCalledWith({
        name: 'simple-cli',
        version: '1.0.0',
        description: 'A simple CLI application',
      });

      expect(cli).toBeDefined();
    });

    it('should return CLI instance', async () => {
      const cli = await workflowModule.createMinimalCLI();
      
      expect(cli).toBeDefined();
      expect(typeof cli.name).toBe('function');
      expect(typeof cli.version).toBe('function');
    });
  });

  describe('createCLIWithBuiltins', () => {
    it('should create CLI with built-in commands enabled', async () => {
      await workflowModule.createCLIWithBuiltins();

      expect(indexModule.createCLI).toHaveBeenCalledWith({
        name: 'enhanced-cli',
        version: '1.2.0',
        description: 'Enhanced CLI with built-in features',
        builtinCommands: {
          completion: true,
          hello: true,
          version: false,
        },
      });
    });

    it('should enable specific built-in commands', async () => {
      await workflowModule.createCLIWithBuiltins();

      const callArgs = vi.mocked(indexModule.createCLI).mock.calls[0][0];
      expect(callArgs.builtinCommands?.completion).toBe(true);
      expect(callArgs.builtinCommands?.hello).toBe(true);
      expect(callArgs.builtinCommands?.version).toBe(false);
    });
  });

  describe('createOrganizedCLI', () => {
    it('should create CLI with multiple command paths', async () => {
      await workflowModule.createOrganizedCLI();

      expect(indexModule.createCLI).toHaveBeenCalledWith({
        name: 'organized-cli',
        version: '2.0.0',
        description: 'Well-organized CLI with multiple command groups',
        commandsPath: [
          './commands/core',
          './commands/admin',
          './commands/utilities',
        ],
        builtinCommands: {
          completion: true,
          hello: false,
          version: true,
        },
      });
    });

    it('should specify multiple command directories', async () => {
      await workflowModule.createOrganizedCLI();

      const callArgs = vi.mocked(indexModule.createCLI).mock.calls[0][0];
      expect(Array.isArray(callArgs.commandsPath)).toBe(true);
      expect(callArgs.commandsPath).toHaveLength(3);
    });
  });

  describe('createProductionCLI', () => {
    it('should create CLI with production configuration', async () => {
      await workflowModule.createProductionCLI();

      const callArgs = vi.mocked(indexModule.createCLI).mock.calls[0][0];
      expect(callArgs.name).toBe('production-cli');
      expect(callArgs.version).toBe('3.1.0');
      expect(callArgs.autocomplete?.enabled).toBe(true);
      expect(callArgs.errorHandler).toBeTypeOf('function');
    });

    it('should include autocomplete configuration', async () => {
      await workflowModule.createProductionCLI();

      const callArgs = vi.mocked(indexModule.createCLI).mock.calls[0][0];
      expect(callArgs.autocomplete?.shells).toEqual(['bash', 'zsh', 'fish', 'powershell']);
      expect(callArgs.autocomplete?.enableFileCompletion).toBe(true);
    });

    it('should include custom error handler', async () => {
      await workflowModule.createProductionCLI();

      const callArgs = vi.mocked(indexModule.createCLI).mock.calls[0][0];
      expect(typeof callArgs.errorHandler).toBe('function');
    });
  });

  describe('createManualControlCLI', () => {
    it('should create CLI with autoStart disabled', async () => {
      // Mock process.env.API_KEY for this test
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = 'test-key';

      await workflowModule.createManualControlCLI();

      const callArgs = vi.mocked(indexModule.createCLI).mock.calls[0][0];
      expect(callArgs.name).toBe('manual-cli');
      expect(callArgs.autoStart).toBe(false);

      // Restore original API_KEY
      process.env.API_KEY = originalApiKey;
    });

    it('should handle missing API_KEY environment variable', async () => {
      // Mock console.error to capture error output
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called');
      }) as never);

      // Remove API_KEY temporarily
      const originalApiKey = process.env.API_KEY;
      delete process.env.API_KEY;

      await expect(workflowModule.createManualControlCLI()).rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith('❌ API_KEY environment variable required');
      expect(mockProcessExit).toHaveBeenCalledWith(1);

      // Restore original API_KEY and mocks
      process.env.API_KEY = originalApiKey;
      mockConsoleError.mockRestore();
      mockProcessExit.mockRestore();
    });
  });

  describe('runBasicCLIDemo', () => {
    it('should execute demo function without errors', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      await workflowModule.runBasicCLIDemo();

      expect(mockConsoleLog).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Lord Commander SDK'));

      mockConsoleLog.mockRestore();
    });

    it('should display example descriptions', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      await workflowModule.runBasicCLIDemo();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Minimal CLI setup'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('CLI with built-in commands'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Production-ready CLI'));

      mockConsoleLog.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should validate CLI configuration', async () => {
      await workflowModule.createProductionCLI();

      // Verify configuration structure
      const callArgs = vi.mocked(indexModule.createCLI).mock.calls[0][0];
      expect(callArgs).toHaveProperty('name');
      expect(callArgs).toHaveProperty('version');
      expect(callArgs).toHaveProperty('description');
    });
  });

  describe('TypeScript Integration', () => {
    it('should handle proper types for CLI creation', () => {
      // This test ensures that the functions can be called with proper TypeScript types
      expect(typeof workflowModule.createMinimalCLI).toBe('function');
      expect(typeof workflowModule.createCLIWithBuiltins).toBe('function');
      expect(typeof workflowModule.createOrganizedCLI).toBe('function');
      expect(typeof workflowModule.createProductionCLI).toBe('function');
      expect(typeof workflowModule.createManualControlCLI).toBe('function');
    });
  });

  describe('Configuration Patterns', () => {
    it('should demonstrate different CLI configuration patterns', async () => {
      await workflowModule.createMinimalCLI();
      await workflowModule.createCLIWithBuiltins();
      await workflowModule.createOrganizedCLI();
      await workflowModule.createProductionCLI();

      // Verify that createCLI was called 4 times with different configurations
      expect(vi.mocked(indexModule.createCLI)).toHaveBeenCalledTimes(4);

      const calls = vi.mocked(indexModule.createCLI).mock.calls;
      expect(calls[0][0].name).toBe('simple-cli');
      expect(calls[1][0].name).toBe('enhanced-cli');
      expect(calls[2][0].name).toBe('organized-cli');
      expect(calls[3][0].name).toBe('production-cli');
    });

    it('should show progression from simple to advanced', async () => {
      await workflowModule.createMinimalCLI();
      await workflowModule.createProductionCLI();

      const [simpleConfig, advancedConfig] = vi.mocked(indexModule.createCLI).mock.calls.map(call => call[0]);

      // Simple config should be minimal
      expect(Object.keys(simpleConfig)).toHaveLength(3);
      
      // Advanced config should have more features
      expect(Object.keys(advancedConfig).length).toBeGreaterThan(5);
      expect(advancedConfig.autocomplete).toBeDefined();
      expect(advancedConfig.errorHandler).toBeDefined();
    });
  });

  describe('Module Exports and Structure', () => {
    it('should export all workflow functions', () => {
      expect(typeof workflowModule.createMinimalCLI).toBe('function');
      expect(typeof workflowModule.createCLIWithBuiltins).toBe('function');
      expect(typeof workflowModule.createOrganizedCLI).toBe('function');
      expect(typeof workflowModule.createProductionCLI).toBe('function');
      expect(typeof workflowModule.createManualControlCLI).toBe('function');
      expect(typeof workflowModule.runBasicCLIDemo).toBe('function');
      expect(typeof workflowModule.exampleCommand).toBe('function');
    });

    it('should maintain consistent function signatures', () => {
      expect(workflowModule.createMinimalCLI.constructor.name).toBe('AsyncFunction');
      expect(workflowModule.createCLIWithBuiltins.constructor.name).toBe('AsyncFunction');
      expect(workflowModule.createOrganizedCLI.constructor.name).toBe('AsyncFunction');
      expect(workflowModule.createProductionCLI.constructor.name).toBe('AsyncFunction');
      expect(workflowModule.createManualControlCLI.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('CLI Execution and Process Integration', () => {
    it('should handle process arguments correctly', async () => {
      // Mock process.argv
      const originalArgv = process.argv;
      process.env.API_KEY = 'test-key';
      process.argv = ['node', 'cli.js', '--version'];
      
      await workflowModule.createManualControlCLI();
      
      expect(indexModule.createCLI).toHaveBeenCalled();
      
      // Restore process.argv
      process.argv = originalArgv;
      delete process.env.API_KEY;
    });

    it('should handle empty arguments', async () => {
      const originalArgv = process.argv;
      process.env.API_KEY = 'test-key';
      process.argv = ['node', 'cli.js'];
      
      await workflowModule.createManualControlCLI();
      
      // Should still execute successfully
      expect(indexModule.createCLI).toHaveBeenCalled();
      
      // Restore process.argv  
      process.argv = originalArgv;
      delete process.env.API_KEY;
    });
  });
});