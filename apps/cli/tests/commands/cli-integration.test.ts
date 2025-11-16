import { describe, it, expect, beforeEach, vi } from 'vitest';

// Define the types we need locally to avoid import issues
interface CommandContext {
  logger: any;
  prompts: any;
  execa: any;
  fs: any;
}

// Mock the commands
import initCommand from '../../commands/init';
import statusCommand from '../../commands/status';

describe('CLI Commands Integration Tests', () => {
  let mockContext: CommandContext;
  let mockProgram: any;
  let mockLogger: any;

  beforeEach(() => {
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

    vi.clearAllMocks();
  });

  describe('Init Command Integration', () => {
    it('should register the init command with all required options', () => {
      initCommand(mockProgram, mockContext);

      expect(mockProgram.command).toHaveBeenCalledWith('init');
      expect(mockProgram.description).toHaveBeenCalledWith(
        'Initialize Lord Commander setup (CLI-only, CLI+API, or Full-stack with Dashboard)'
      );
      
      // Should have 9 options: --quick, --global, --type, --pm, --output, --cli-path, --dashboard-path, --api-path, --readme-path
      expect(mockProgram.option).toHaveBeenCalledTimes(9);
      expect(mockProgram.action).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should execute library mode setup successfully', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // Verify basic execution flow
      expect(mockLogger.intro).toHaveBeenCalledWith('🚀 Lord Commander CLI Initialization');
      expect(mockLogger.info).toHaveBeenCalledWith('Using quick setup: library configuration...');
      expect(mockLogger.outro).toHaveBeenCalledWith('✨ Lord Commander CLI setup complete!');
    });

    it('should handle different package managers correctly', async () => {
      const packageManagers = ['npm', 'pnpm', 'yarn'];
      
      for (const pm of packageManagers) {
        vi.clearAllMocks();
        initCommand(mockProgram, mockContext);
        const actionCallback = mockProgram.action.mock.calls[0][0];
        
        await actionCallback({
          quick: true,
          type: 'library',
          pm,
          global: false
        });

        expect(mockLogger.info).toHaveBeenCalledWith(`Package Manager: ${pm}`);
      }
    });

    it('should handle global vs local installation options', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      // Test global
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: true
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Installation: global');

      vi.clearAllMocks();
      initCommand(mockProgram, mockContext);
      const actionCallback2 = mockProgram.action.mock.calls[0][0];
      
      // Test local
      await actionCallback2({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Installation: local');
    });

    it('should support all setup types', async () => {
      const setupTypes = ['library', 'cli-only', 'cli-api', 'full-stack'];
      
      for (const type of setupTypes) {
        vi.clearAllMocks();
        initCommand(mockProgram, mockContext);
        const actionCallback = mockProgram.action.mock.calls[0][0];
        
        await actionCallback({
          quick: true,
          type,
          pm: 'npm',
          global: false
        });

        expect(mockLogger.info).toHaveBeenCalledWith(`Using quick setup: ${type} configuration...`);
      }
    });

    it('should show development mode messages when in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      expect(mockLogger.info).toHaveBeenCalledWith('🚧 Development Mode: Package not yet published');
      
      vi.unstubAllEnvs();
    });
  });

  describe('Status Command Integration', () => {
    it('should register the status command correctly', () => {
      statusCommand(mockProgram, mockContext);

      expect(mockProgram.command).toHaveBeenCalledWith('status');
      expect(mockProgram.description).toHaveBeenCalledWith('Show CLI status and configuration');
      expect(mockProgram.action).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should execute status command and show required information', async () => {
      statusCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback();

      // Verify the command runs and shows the expected intro/outro
      expect(mockLogger.intro).toHaveBeenCalledWith('📊 CLI Status');
      expect(mockLogger.outro).toHaveBeenCalledWith('✨ Status check complete!');
      
      // Should show CLI name and system info (we can't easily mock version reading)
      expect(mockLogger.info).toHaveBeenCalledWith('CLI Name: lord-commander');
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Working Directory:'));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Node.js Version:'));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Platform:'));
    });

    it('should execute quickly and handle multiple calls', async () => {
      statusCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      const startTime = Date.now();
      
      // Run multiple times to test performance and stability
      await actionCallback();
      await actionCallback();
      await actionCallback();
      
      const executionTime = Date.now() - startTime;
      
      // Should execute quickly
      expect(executionTime).toBeLessThan(200);
      
      // Should have been called 3 times
      expect(mockLogger.intro).toHaveBeenCalledTimes(3);
      expect(mockLogger.outro).toHaveBeenCalledTimes(3);
    });
  });

  describe('Command Integration (Both Commands)', () => {
    it('should not interfere with each other when registered on same program', () => {
      // Register both commands
      initCommand(mockProgram, mockContext);
      statusCommand(mockProgram, mockContext);
      
      // Should have called command twice (once for each)
      expect(mockProgram.command).toHaveBeenCalledWith('init');
      expect(mockProgram.command).toHaveBeenCalledWith('status');
      
      // Should have registered actions for both
      expect(mockProgram.action).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully without crashing', async () => {
      // Test error handling by making fs operations fail
      mockContext.fs.ensureDir.mockRejectedValue(new Error('Mock error'));
      
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      // Should not crash even when internal operations fail
      await expect(actionCallback({
        quick: true,
        type: 'cli-only',
        pm: 'npm',
        global: false
      })).resolves.not.toThrow();
    });
  });

  describe('Real World Usage Simulation', () => {
    it('should handle typical user workflows', async () => {
      // Simulate: User runs status, then init
      statusCommand(mockProgram, mockContext);
      const statusAction = mockProgram.action.mock.calls[0][0];
      
      await statusAction();
      expect(mockLogger.intro).toHaveBeenCalledWith('📊 CLI Status');
      
      // Clear and run init
      vi.clearAllMocks();
      initCommand(mockProgram, mockContext);
      const initAction = mockProgram.action.mock.calls[0][0];
      
      await initAction({
        quick: true,
        type: 'library',
        pm: 'pnpm',
        global: false
      });
      
      expect(mockLogger.intro).toHaveBeenCalledWith('🚀 Lord Commander CLI Initialization');
      expect(mockLogger.info).toHaveBeenCalledWith('Package Manager: pnpm');
    });

    it('should maintain consistency in logging format', async () => {
      // Both commands should use consistent intro/outro patterns
      statusCommand(mockProgram, mockContext);
      const statusAction = mockProgram.action.mock.calls[0][0];
      await statusAction();
      
      const statusIntro = mockLogger.intro.mock.calls[0][0];
      const statusOutro = mockLogger.outro.mock.calls[0][0];
      
      vi.clearAllMocks();
      initCommand(mockProgram, mockContext);
      const initAction = mockProgram.action.mock.calls[0][0];
      await initAction({ quick: true, type: 'library', pm: 'npm', global: false });
      
      const initIntro = mockLogger.intro.mock.calls[0][0];
      const initOutro = mockLogger.outro.mock.calls[0][0];
      
      // Both should use emojis and consistent format
      expect(statusIntro).toMatch(/^[\p{Extended_Pictographic}]/u);
      expect(initIntro).toMatch(/^[\p{Extended_Pictographic}]/u);
      expect(statusOutro).toMatch(/^[\p{Extended_Pictographic}]/u);
      expect(initOutro).toMatch(/^[\p{Extended_Pictographic}]/u);
    });
  });
});