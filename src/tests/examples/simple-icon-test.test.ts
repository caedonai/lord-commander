import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as coreModule from '../../core/index.js';
import { runIconTest } from '../../examples/simple-icon-test.js';

// Mock the core module
vi.mock('../../core/index.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    // Enhanced icon methods
    rocket: vi.fn(),
    cloud: vi.fn(),
    withIcon: vi.fn(),
  })),
}));

describe('Simple Icon Test', () => {
  let mockLogger: Record<string, ReturnType<typeof vi.fn>>;
  let mockConsole: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock logger with the methods actually used in simple-icon-test.ts
    mockLogger = {
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      rocket: vi.fn(),
      cloud: vi.fn(),
      withIcon: vi.fn(),
    };

    // Mock createLogger to return our mock logger
    vi.mocked(coreModule.createLogger).mockReturnValue(
      mockLogger as unknown as ReturnType<typeof coreModule.createLogger>
    );

    // Mock console methods
    mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
    };
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);

    // Mock process.exit to prevent test termination
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Set up default process properties for consistent testing
    Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    process.env.TERM_PROGRAM = 'vscode';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runIconTest', () => {
    it('should test basic logger methods', async () => {
      await runIconTest();

      // Verify basic logging methods are called
      expect(mockLogger.info).toHaveBeenCalledWith('📝 Basic info message');
      expect(mockLogger.success).toHaveBeenCalledWith('🎉 Success message with semantic meaning');
      expect(mockLogger.warn).toHaveBeenCalledWith('⚠️ Warning message for attention');
    });

    it('should test enhanced icon methods when available', async () => {
      await runIconTest();

      // Since our mock has these methods, they should be called
      if (typeof mockLogger.rocket === 'function') {
        // Verify enhanced methods are called when available
        expect(mockLogger.rocket).toHaveBeenCalledWith('Rocket launch successful! 🚀');
        expect(mockLogger.cloud).toHaveBeenCalledWith('Cloud deployment ready ☁️');
      }
    });

    it('should test generic withIcon method when available', async () => {
      await runIconTest();

      // Since our mock has withIcon method, it should be called
      if (typeof mockLogger.withIcon === 'function') {
        // Verify withIcon method is called
        expect(mockLogger.withIcon).toHaveBeenCalledWith(
          'sparkle',
          'Generic icon method working! ✨'
        );
      }
    });

    it('should detect and report platform information', async () => {
      await runIconTest();

      // Since we set process.platform to 'darwin'
      if (typeof mockLogger.info === 'function') {
        // Verify platform detection - actual implementation calls these
        expect(mockLogger.info).toHaveBeenCalledWith('🖥️ Platform detected: darwin');
        expect(mockLogger.info).toHaveBeenCalledWith('🍎 OS-specific icon test');
      }
    });

    it('should handle different platforms correctly', async () => {
      // Test Windows platform
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true });

      await runIconTest();

      if (typeof mockLogger.info === 'function') {
        const mockLogger = vi.mocked(coreModule.createLogger)();
        expect(mockLogger.info).toHaveBeenCalledWith('🖥️ Platform detected: win32');
        expect(mockLogger.info).toHaveBeenCalledWith('🪟 OS-specific icon test');
      }
    });

    it('should handle terminal capability detection', async () => {
      await runIconTest();

      if (typeof mockLogger.info === 'function') {
        // Verify TTY and terminal program detection
        expect(mockLogger.info).toHaveBeenCalledWith('📟 TTY support: ✅');
        expect(mockLogger.info).toHaveBeenCalledWith('🔧 Terminal program: vscode');
      }
    });

    it('should handle missing environment variables', async () => {
      delete process.env.TERM_PROGRAM;
      // Also set isTTY to false to test the ❌ case
      Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });

      await runIconTest();

      // Should show no TTY support when isTTY is false
      expect(mockLogger.info).toHaveBeenCalledWith('📟 TTY support: ❌');
    });
  });

  describe('Type Safety and TypeScript Integration', () => {
    it('should handle EnhancedLogger type correctly', async () => {
      await runIconTest();

      // Since our mock has rocket method, it should be available
      if (typeof mockLogger.rocket === 'function') {
        // Verify type assertions work (through successful execution)
        const mockLogger = vi.mocked(coreModule.createLogger)();
        expect(mockLogger.rocket).toHaveBeenCalled();
      }
    });
  });

  describe('Platform-specific Behavior', () => {
    it('should handle macOS environment', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });

      await runIconTest();

      if (typeof mockLogger.info === 'function') {
        const mockLogger = vi.mocked(coreModule.createLogger)();
        expect(mockLogger.info).toHaveBeenCalledWith('🖥️ Platform detected: darwin');
        expect(mockLogger.info).toHaveBeenCalledWith('🍎 OS-specific icon test');
      }
    });

    it('should handle Linux environment', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true });

      await runIconTest();

      if (typeof mockLogger.info === 'function') {
        const mockLogger = vi.mocked(coreModule.createLogger)();
        expect(mockLogger.info).toHaveBeenCalledWith('🖥️ Platform detected: linux');
        expect(mockLogger.info).toHaveBeenCalledWith('🐧 OS-specific icon test');
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing stdout', async () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });

      // The function should complete normally, not throw an error
      await expect(runIconTest()).resolves.toBeUndefined();
    });

    it('should handle logger method failures', async () => {
      // Mock logger.info to throw an error
      mockLogger.info = vi.fn().mockImplementationOnce(() => {
        throw new Error('Logger method failed');
      });

      if (typeof mockLogger.info === 'function') {
        // Should propagate the error
        await expect(runIconTest()).rejects.toThrow('process.exit called');
      }
    });
  });

  describe('CLI Execution Path', () => {
    it('should log execution errors properly', async () => {
      // Force an error by mocking createLogger to throw
      vi.mocked(coreModule.createLogger).mockImplementationOnce(() => {
        throw new Error('Test execution error');
      });

      // Should catch and log the error, then exit
      await expect(() => runIconTest()).rejects.toThrow('process.exit called');
    });
  });
});
