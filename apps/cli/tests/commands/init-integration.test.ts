import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';

// Define the types we need locally to avoid import issues
interface CommandContext {
  logger: any;
  prompts: any;
  execa: any;
  fs: any;
}

// Mock the init command
import initCommand from '../../commands/init';

describe('Init Command - Integration Tests (Simplified)', () => {
  let testDir: string;
  let mockContext: CommandContext;
  let mockProgram: any;
  let mockLogger: any;

  beforeEach(async () => {
    // Create temporary directory for each test
    testDir = await mkdtemp(join(tmpdir(), 'lord-commander-test-'));
    
    // Mock logger with simple implementations
    mockLogger = {
      intro: vi.fn(),
      outro: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      spinner: vi.fn().mockReturnValue({
        stop: vi.fn(),
        start: vi.fn(),
        message: vi.fn()
      })
    };

    // Mock program (commander)
    mockProgram = {
      command: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      action: vi.fn()
    };

    // Create simplified mock context
    mockContext = {
      logger: mockLogger,
      prompts: {
        text: vi.fn(),
        select: vi.fn(),
        confirm: vi.fn(),
        clack: { isCancel: vi.fn().mockReturnValue(false) }
      },
      execa: {
        execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
      },
      fs: {
        exists: vi.fn().mockReturnValue(false),
        ensureDir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
        copy: vi.fn().mockResolvedValue(undefined)
      }
    };
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
    vi.clearAllMocks();
  });

  describe('Command Registration', () => {
    it('should register the init command with correct structure', () => {
      initCommand(mockProgram, mockContext);

      expect(mockProgram.command).toHaveBeenCalledWith('init');
      expect(mockProgram.description).toHaveBeenCalledWith(
        'Initialize Lord Commander setup (CLI-only, CLI+API, or Full-stack with Dashboard)'
      );
      expect(mockProgram.option).toHaveBeenCalledTimes(4); // --quick, --global, --type, --pm
      expect(mockProgram.action).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Library Mode Execution', () => {
    it('should execute library mode and log appropriate messages', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // Verify basic flow
      expect(mockLogger.intro).toHaveBeenCalledWith('🚀 Lord Commander CLI Initialization');
      expect(mockLogger.outro).toHaveBeenCalledWith('✨ Lord Commander CLI setup complete!');
      
      // Should show library-related messages
      expect(mockLogger.info).toHaveBeenCalledWith('Using quick setup: library configuration...');
    });

    it('should show development mode message when NODE_ENV is development', async () => {
      // Set development mode
      vi.stubEnv('NODE_ENV', 'development');
      
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // Should show development mode messages
      expect(mockLogger.info).toHaveBeenCalledWith('🚧 Development Mode: Package not yet published');
      
      vi.unstubAllEnvs();
    });
  });

  describe('CLI-Only Mode Execution', () => {
    it('should execute CLI-only mode and show correct messages', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'cli-only',
        pm: 'pnpm',
        global: false
      });

      expect(mockLogger.intro).toHaveBeenCalledWith('🚀 Lord Commander CLI Initialization');
      expect(mockLogger.info).toHaveBeenCalledWith('Using quick setup: cli-only configuration...');
      expect(mockLogger.outro).toHaveBeenCalledWith('✨ Lord Commander CLI setup complete!');
    });
  });

  describe('Configuration Display', () => {
    it('should display configuration summary for different modes', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'cli-api',
        pm: 'yarn',
        global: true
      });

      // Should show configuration summary
      expect(mockLogger.info).toHaveBeenCalledWith('📋 Configuration Summary:');
      expect(mockLogger.info).toHaveBeenCalledWith('Project Name: my-cli-project');
      expect(mockLogger.info).toHaveBeenCalledWith('Installation: global');
      expect(mockLogger.info).toHaveBeenCalledWith('Package Manager: yarn');
    });
  });

  describe('Error Handling', () => {
    it('should handle process.exit calls in tests without actually exiting', async () => {
      // Mock process.exit to prevent actual exit during tests
      const mockExit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`Process exit called with code: ${code}`);
      });

      mockContext.prompts.text.mockResolvedValue('test-project');
      mockContext.prompts.select.mockResolvedValue('cli-only');
      mockContext.prompts.confirm.mockResolvedValue(false); // User cancels

      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await expect(actionCallback({
        quick: false,
        pm: 'npm'
      })).rejects.toThrow('Process exit called with code: 0');

      expect(mockLogger.outro).toHaveBeenCalledWith('Operation cancelled.');
      mockExit.mockRestore();
    });
  });

  describe('Package Manager Support', () => {
    const packageManagers = ['npm', 'pnpm', 'yarn'];
    
    packageManagers.forEach(pm => {
      it(`should accept ${pm} as package manager option`, async () => {
        initCommand(mockProgram, mockContext);
        const actionCallback = mockProgram.action.mock.calls[0][0];
        
        await actionCallback({
          quick: true,
          type: 'library',
          pm,
          global: false
        });

        expect(mockLogger.info).toHaveBeenCalledWith(`Package Manager: ${pm}`);
      });
    });
  });

  describe('Installation Location Options', () => {
    it('should support global installation option', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: true
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Installation: global');
    });

    it('should default to local installation', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Installation: local');
    });
  });
});