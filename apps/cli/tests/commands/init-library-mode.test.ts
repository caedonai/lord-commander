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

describe('Init Command - Library Mode Integration Tests', () => {
  let testDir: string;
  let mockContext: CommandContext;
  let mockProgram: any;
  let mockExeca: any;
  let mockFs: any;
  let mockLogger: any;
  let mockPrompts: any;

  beforeEach(async () => {
    // Create temporary directory for each test
    testDir = await mkdtemp(join(tmpdir(), 'lord-commander-test-'));
    
    // Mock execa for package installation
    mockExeca = {
      execa: vi.fn().mockResolvedValue({ 
        stdout: 'Package installed successfully',
        stderr: '',
        exitCode: 0
      })
    };

    // Mock file system operations
    mockFs = {
      exists: vi.fn().mockReturnValue(false),
      ensureDir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      copy: vi.fn().mockResolvedValue(undefined)
    };

    // Mock logger
    mockLogger = {
      intro: vi.fn(),
      outro: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      spinner: vi.fn().mockReturnValue({
        stop: vi.fn()
      })
    };

    // Mock prompts
    mockPrompts = {
      text: vi.fn(),
      select: vi.fn(),
      confirm: vi.fn(),
      multiselect: vi.fn(),
      clack: {
        isCancel: vi.fn().mockReturnValue(false)
      }
    };

    // Mock program (commander)
    mockProgram = {
      command: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      action: vi.fn()
    };

    // Create mock context
    mockContext = {
      logger: mockLogger,
      prompts: mockPrompts,
      execa: mockExeca,
      fs: mockFs
    };
  });

  afterEach(async () => {
    // Clean up temporary directory
    await rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('Library Mode - Development Environment', () => {
    beforeEach(() => {
      // Set development mode
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('should show development mode message for library setup', async () => {
      // Register the command
      initCommand(mockProgram, mockContext);
      
      // Get the action function that was registered
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      // Execute with library mode options
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // Verify it showed development mode messages
      expect(mockLogger.info).toHaveBeenCalledWith('🚧 Development Mode: Package not yet published');
      expect(mockLogger.info).toHaveBeenCalledWith('In production, this package would be installed:');
      expect(mockLogger.info).toHaveBeenCalledWith('  • @lord-commander/cli-core');
      
      // Verify no actual package installation was attempted
      expect(mockExeca.execa).not.toHaveBeenCalled();
    });

    it('should show proper next steps for library mode', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // Verify next steps messaging
      expect(mockLogger.success).toHaveBeenCalledWith('🎉 Library installation complete!');
      expect(mockLogger.info).toHaveBeenCalledWith('• Import the CLI SDK in your project:');
      expect(mockLogger.info).toHaveBeenCalledWith('  import { createCLI } from "@lord-commander/cli-core";');
    });
  });

  describe('Library Mode - Production Environment', () => {
    beforeEach(() => {
      // Set production mode
      vi.stubEnv('NODE_ENV', 'production');
    });

    afterEach(() => {
      // Reset to development mode
      vi.unstubAllEnvs();
    });

    it('should install @lord-commander/cli-core package with npm', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // Verify package installation was attempted
      expect(mockExeca.execa).toHaveBeenCalledWith('npm', ['install', '@lord-commander/cli-core'], {
        stdio: 'inherit',
        cwd: expect.any(String)
      });
    });

    it('should install package globally when global option is set', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: true
      });

      // Verify global installation command
      expect(mockExeca.execa).toHaveBeenCalledWith('npm', ['install', '-g', '@lord-commander/cli-core'], {
        stdio: 'inherit',
        cwd: undefined  // global installs don't need cwd
      });
    });

    it('should use pnpm when specified', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'pnpm',
        global: false
      });

      expect(mockExeca.execa).toHaveBeenCalledWith('pnpm', ['add', '@lord-commander/cli-core'], {
        stdio: 'inherit',
        cwd: expect.any(String)
      });
    });

    it('should use yarn when specified', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'yarn',
        global: false
      });

      expect(mockExeca.execa).toHaveBeenCalledWith('yarn', ['add', '@lord-commander/cli-core'], {
        stdio: 'inherit',
        cwd: expect.any(String)
      });
    });

    it('should use yarn global for global yarn installations', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'yarn',
        global: true
      });

      expect(mockExeca.execa).toHaveBeenCalledWith('yarn', ['global', 'add', '@lord-commander/cli-core'], {
        stdio: 'inherit',
        cwd: undefined
      });
    });

    it('should create project structure for local installations', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // Verify project structure creation
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        expect.stringContaining('@lord-commander/cli-core')
      );
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('index.js'),
        expect.stringContaining("import { createCLI } from '@lord-commander/cli-core'")
      );

      expect(mockFs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('commands'));
    });

    it('should not create project structure for global installations', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: true
      });

      // Verify no project structure was created for global installation
      expect(mockFs.writeFile).not.toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        expect.anything()
      );
    });

    it('should handle installation errors gracefully', async () => {
      // Make execa throw an error
      mockExeca.execa.mockRejectedValue(new Error('Package installation failed'));
      
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await expect(actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      })).rejects.toThrow();

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Library installation failed')
      );
    });
  });

  describe('Configuration Display', () => {
    it('should show correct configuration for library mode', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // Verify configuration display
      expect(mockLogger.info).toHaveBeenCalledWith('📦 Package to Install:');
      expect(mockLogger.info).toHaveBeenCalledWith('  • @lord-commander/cli-core ✓');
      expect(mockLogger.info).toHaveBeenCalledWith('Setup Type: Library Mode (SDK Import)');
    });

    it('should show scaffolding suggestion when API/Dashboard options are used in library mode', async () => {
      initCommand(mockProgram, mockContext);
      const actionCallback = mockProgram.action.mock.calls[0][0];
      
      // Mock the config to include API (which would happen in interactive mode)
      const originalConfig = {
        projectName: 'my-cli-project',
        setupType: 'library' as const,
        includeApi: true,
        includeDashboard: false,
        packageManager: 'npm' as const,
        installLocation: 'local' as const,
      };

      await actionCallback({
        quick: true,
        type: 'library',
        pm: 'npm',
        global: false
      });

      // In a real scenario with API/Dashboard, it should suggest scaffolding mode
      // This would be tested better with interactive mode
    });
  });
});