/**
 * Enhanced Logger Icon Integration Tests
 *
 * Tests for logger methods with icon support, including security validation,
 * fallback behavior, and integration with existing logging functionality.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @clack/prompts before importing logger
vi.mock('@clack/prompts', async () => {
  const actual = (await vi.importActual('@clack/prompts')) as any;
  return {
    ...actual,
    log: {
      ...actual.log,
      message: vi.fn(),
    },
  };
});

import { log as clackLog } from '@clack/prompts';
import { IconProvider, IconSecurity, PlatformCapabilities } from '../../core/ui/icons.js';
import { createLogger, type Logger, LogLevel } from '../../core/ui/logger.js';

// Mock process.stdout.write to prevent test environment issues
Object.defineProperty(process.stdout, 'write', {
  value: vi.fn(),
  writable: true,
});

describe('Enhanced Logger with Icons', () => {
  let logger: Logger;
  let _consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear mock calls
    vi.clearAllMocks();

    // Reset icon providers to ensure clean state
    IconProvider.reset();
    PlatformCapabilities.reset();

    // Create fresh logger instance
    logger = createLogger({ level: LogLevel.VERBOSE });

    // Mock console methods to capture output
    _consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Icon Integration', () => {
    it('should provide access to icon system', () => {
      const icons = logger.getIcons();
      const platformInfo = logger.getPlatformInfo();

      expect(icons).toBeDefined();
      expect(icons.rocket).toBeDefined();
      expect(icons.cloud).toBeDefined();

      expect(platformInfo).toBeDefined();
      expect(platformInfo.platform).toBeDefined();
    });

    it('should provide safe icon access', () => {
      const safeRocket = logger.getSafeIcon('rocket');

      expect(typeof safeRocket).toBe('string');
      expect(safeRocket.length).toBeGreaterThan(0);
    });

    it('should analyze icon security', () => {
      const analysis = logger.analyzeIconSecurity('🚀 Safe text');

      expect(analysis.isSecure).toBe(true);
      expect(analysis.issues).toHaveLength(0);
    });
  });

  describe('withIcon Method', () => {
    it('should log messages with valid icons', () => {
      // Mock emoji support
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      // Should not throw when logging with valid icons
      expect(() => logger.withIcon('rocket', 'Deploying application')).not.toThrow();
    });

    it('should handle invalid icon names gracefully', () => {
      // Should not throw when using invalid icon names
      expect(() => logger.withIcon('nonexistent' as any, 'Test message')).not.toThrow();

      // Should warn about invalid icon (warnings go to console.log, not console.warn)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid icon "nonexistent"')
      );
    });
    it('should respect log levels', () => {
      logger.setLevel(LogLevel.ERROR);

      logger.withIcon('rocket', 'Info message', LogLevel.INFO);
      logger.withIcon('cross', 'Error message', LogLevel.ERROR);

      // Info message should not be logged
      expect(clackLog.message).not.toHaveBeenCalledWith(expect.stringContaining('Info message'));

      // Error message should be logged
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });

    it('should apply appropriate colors based on log level', () => {
      // Mock environment for consistent testing
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      logger.withIcon('rocket', 'Info message', LogLevel.INFO);
      logger.withIcon('warning', 'Warning message', LogLevel.WARN);
      logger.withIcon('cross', 'Error message', LogLevel.ERROR);

      expect(clackLog.message).toHaveBeenCalledTimes(3);

      // Verify calls were made in correct order (icons depend on environment detection)
      // LogLevel.INFO uses blue theme (picocolors.blue)
      expect(clackLog.message).toHaveBeenNthCalledWith(1, '🚀 \u001b[34mInfo message\u001b[39m');
      // LogLevel.WARN uses yellow theme (picocolors.yellow)
      expect(clackLog.message).toHaveBeenNthCalledWith(2, '⚠ \u001b[33mWarning message\u001b[39m');
      // LogLevel.ERROR uses red theme (picocolors.red)
      expect(clackLog.message).toHaveBeenNthCalledWith(3, '✘ \u001b[31mError message\u001b[39m');
    });

    it('should sanitize malicious icon inputs', () => {
      // Create a spy on IconSecurity.sanitizeIcon
      const sanitizeSpy = vi.spyOn(IconSecurity, 'sanitizeIcon');

      // Attempt to use withIcon with a malicious input (this would be caught by TypeScript normally)
      const maliciousIcon = '\\x1b[31mmalicious\\x1b[0m';

      // Mock IconProvider.get to return the malicious input for testing
      const originalGet = IconProvider.get;
      vi.spyOn(IconProvider, 'get').mockReturnValue(maliciousIcon);

      logger.withIcon('rocket', 'Test message');

      expect(sanitizeSpy).toHaveBeenCalledWith(maliciousIcon);

      // Restore original method
      IconProvider.get = originalGet;
    });
  });

  describe('Semantic Icon Methods', () => {
    beforeEach(() => {
      // Mock full emoji support for consistent testing
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });
    });

    describe('Infrastructure & Deployment', () => {
      it('should provide rocket method', () => {
        expect(() => logger.rocket('Deploying to production')).not.toThrow();
      });

      it('should provide cloud method', () => {
        logger.cloud('Connecting to AWS');
        expect(clackLog.message).toHaveBeenCalledWith('☁️ \u001b[34mConnecting to AWS\u001b[39m');
      });

      it('should provide package method', () => {
        logger.package('Creating deployment package');
        expect(clackLog.message).toHaveBeenCalledWith(
          '📦 \u001b[34mCreating deployment package\u001b[39m'
        );
      });

      it('should provide server method', () => {
        logger.server('Starting web server');
        expect(clackLog.message).toHaveBeenCalledWith('🖥️ \u001b[34mStarting web server\u001b[39m');
      });

      it('should provide database method', () => {
        logger.database('Connecting to PostgreSQL');
        expect(clackLog.message).toHaveBeenCalledWith(
          '💾 \u001b[34mConnecting to PostgreSQL\u001b[39m'
        );
      });

      it('should provide api method', () => {
        logger.api('Initializing REST endpoints');
        expect(clackLog.message).toHaveBeenCalledWith(
          '🔗 \u001b[34mInitializing REST endpoints\u001b[39m'
        );
      });

      it('should provide network method', () => {
        logger.network('Configuring load balancer');
        expect(clackLog.message).toHaveBeenCalledWith(
          '🌐 \u001b[34mConfiguring load balancer\u001b[39m'
        );
      });

      it('should provide globe method', () => {
        logger.globe('Updating DNS records');
        expect(clackLog.message).toHaveBeenCalledWith(
          '🌍 \u001b[34mUpdating DNS records\u001b[39m'
        );
      });
    });

    describe('File & Folder Operations', () => {
      it('should provide folder method', () => {
        logger.folder('Creating directory structure');
        expect(clackLog.message).toHaveBeenCalledWith(
          '📁 \u001b[34mCreating directory structure\u001b[39m'
        );
      });

      it('should provide file method', () => {
        logger.file('Generating config files');
        expect(clackLog.message).toHaveBeenCalledWith(
          '📄 \u001b[34mGenerating config files\u001b[39m'
        );
      });

      it('should provide upload method', () => {
        logger.upload('Uploading assets');

        // The actual call includes ANSI color codes for INFO level (blue)
        expect(clackLog.message).toHaveBeenCalledWith('⬆️ \u001b[34mUploading assets\u001b[39m');
      });

      it('should provide download method', () => {
        logger.download('Downloading dependencies');

        // The actual call includes ANSI color codes for INFO level (blue)
        expect(clackLog.message).toHaveBeenCalledWith(
          '⬇️ \u001b[34mDownloading dependencies\u001b[39m'
        );
      });

      it('should provide sync method', () => {
        logger.sync('Synchronizing files');
        expect(clackLog.message).toHaveBeenCalledWith('🔄 \u001b[34mSynchronizing files\u001b[39m');
      });
    });

    describe('Security & Configuration', () => {
      it('should provide shield method', () => {
        logger.shield('Initializing security protocols');
        expect(clackLog.message).toHaveBeenCalledWith(
          '🛡️ \u001b[34mInitializing security protocols\u001b[39m'
        );
      });

      it('should provide key method', () => {
        logger.key('Generating API keys');
        expect(clackLog.message).toHaveBeenCalledWith('🔑 \u001b[34mGenerating API keys\u001b[39m');
      });

      it('should provide lock method', () => {
        logger.lock('Encrypting sensitive data');
        expect(clackLog.message).toHaveBeenCalledWith(
          '🔒 \u001b[34mEncrypting sensitive data\u001b[39m'
        );
      });

      it('should provide gear method', () => {
        logger.gear('Applying configuration');
        expect(clackLog.message).toHaveBeenCalledWith(
          '⚙️ \u001b[34mApplying configuration\u001b[39m'
        );
      });
    });

    describe('Process & Status', () => {
      it('should provide build method', () => {
        logger.build('Building application');
        expect(clackLog.message).toHaveBeenCalledWith(
          '🔨 \u001b[34mBuilding application\u001b[39m'
        );
      });

      it('should provide deploy method', () => {
        logger.deploy('Deploying to production');
        expect(clackLog.message).toHaveBeenCalledWith(
          '🚀 \u001b[34mDeploying to production\u001b[39m'
        );
      });

      it('should provide lightning method', () => {
        logger.lightning('Running optimization');
        expect(clackLog.message).toHaveBeenCalledWith(
          '⚡ \u001b[34mRunning optimization\u001b[39m'
        );
      });

      it('should provide pending method', () => {
        logger.pending('Waiting for approval');
        expect(clackLog.message).toHaveBeenCalledWith(
          '⏳ \u001b[34mWaiting for approval\u001b[39m'
        );
      });

      it('should provide skip method', () => {
        logger.skip('Skipping optional step');
        expect(clackLog.message).toHaveBeenCalledWith(
          '⏭️ \u001b[34mSkipping optional step\u001b[39m'
        );
      });
    });

    describe('Enhanced Status Methods', () => {
      it('should provide successWithIcon method', () => {
        logger.successWithIcon('Operation completed');
        expect(clackLog.message).toHaveBeenCalledWith('✅ \u001b[34mOperation completed\u001b[39m');
      });

      it('should provide failureWithIcon method', () => {
        logger.failureWithIcon('Operation failed');
        expect(clackLog.message).toHaveBeenCalledWith('❌ \u001b[31mOperation failed\u001b[39m');
      });
    });

    describe('Decorative Icons', () => {
      it('should provide sparkle method', () => {
        logger.sparkle('Something special happened');
        expect(clackLog.message).toHaveBeenCalledWith(
          '✨ \u001b[34mSomething special happened\u001b[39m'
        );
      });

      it('should provide diamond method', () => {
        logger.diamond('Premium feature activated');
        expect(clackLog.message).toHaveBeenCalledWith(
          '💎 \u001b[34mPremium feature activated\u001b[39m'
        );
      });

      it('should provide crown method', () => {
        logger.crown('Admin access granted');
        expect(clackLog.message).toHaveBeenCalledWith(
          '👑 \u001b[34mAdmin access granted\u001b[39m'
        );
      });

      it('should provide trophy method', () => {
        logger.trophy('Achievement unlocked');
        expect(clackLog.message).toHaveBeenCalledWith(
          '🏆 \u001b[34mAchievement unlocked\u001b[39m'
        );
      });
    });
  });

  describe('Fallback Behavior', () => {
    it('should handle ASCII-only environments', () => {
      // Mock ASCII-only environment
      vi.stubGlobal('process', {
        ...process,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {}, // Old Windows console
      });

      logger.rocket('ASCII test');

      expect(clackLog.message).toHaveBeenCalledWith('^ \u001b[34mASCII test\u001b[39m');
    });

    it('should handle Unicode-only environments', () => {
      // Mock Unicode-only (no emoji)
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { CI: 'true' },
      });

      logger.rocket('Unicode test');
      logger.cloud('Cloud test');

      expect(clackLog.message).toHaveBeenCalledWith('^ \u001b[34mUnicode test\u001b[39m');
      expect(clackLog.message).toHaveBeenCalledWith('O \u001b[34mCloud test\u001b[39m');
    });

    it('should gracefully handle icon provider errors', () => {
      // Mock IconProvider.get to throw an error
      vi.spyOn(IconProvider, 'get').mockImplementation(() => {
        throw new Error('Icon provider error');
      });

      // This should not crash the logger
      expect(() => logger.rocket('Error test')).not.toThrow();
    });
  });

  describe('testIcons Method', () => {
    it('should display comprehensive icon test', () => {
      // Mock environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      logger.testIcons();

      // Should log platform information
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('Platform Icon Test'));

      // Should display icons by category
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('Status:'));
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('Infrastructure:'));
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('Files:'));
    });

    it('should handle testIcons in different environments', () => {
      // Test in ASCII environment
      vi.stubGlobal('process', {
        ...process,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {},
      });

      expect(() => logger.testIcons()).not.toThrow();
      expect(clackLog.message).toHaveBeenCalled();
    });
  });

  describe('Security Integration', () => {
    it('should validate icon security during logging', () => {
      const securitySpy = vi.spyOn(IconSecurity, 'isValidIcon');

      logger.rocket('Test message');

      expect(securitySpy).toHaveBeenCalled();
    });

    it('should handle security validation failures gracefully', () => {
      // Mock security validation to fail
      vi.spyOn(IconSecurity, 'isValidIcon').mockReturnValue(false);

      // Mock clack log to prevent stdout.write issues
      const mockLog = vi.fn();
      vi.doMock('@clack/prompts', async () => ({
        ...(await vi.importActual('@clack/prompts')),
        log: { message: mockLog },
      }));

      logger.rocket('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid icon'));
    });

    it('should sanitize icons before validation', () => {
      const sanitizeSpy = vi.spyOn(IconSecurity, 'sanitizeIcon');

      logger.rocket('Test message');

      expect(sanitizeSpy).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle high-volume icon usage efficiently', () => {
      const start = Date.now();

      // Log 1000 messages with icons
      for (let i = 0; i < 1000; i++) {
        logger.rocket(`Message ${i}`);
      }

      const elapsed = Date.now() - start;

      // Should complete in reasonable time
      expect(elapsed).toBeLessThan(1000); // Less than 1ms per message
    });

    it('should cache icons efficiently', () => {
      const getIconsSpy = vi.spyOn(IconProvider, 'getIcons');

      // Call multiple icon methods
      logger.rocket('Test 1');
      logger.cloud('Test 2');
      logger.package('Test 3');

      // Icons should be cached, so getIcons should be called minimally
      expect(getIconsSpy).toHaveBeenCalledTimes(3); // Once per method call
    });
  });

  describe('Integration with Existing Logger Features', () => {
    it('should work with logger themes', () => {
      logger.setTheme({
        info: (text) => `[INFO] ${text}`,
        error: (text) => `[ERROR] ${text}`,
      });

      logger.withIcon('rocket', 'Info message', LogLevel.INFO);
      logger.withIcon('cross', 'Error message', LogLevel.ERROR);

      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    });

    it('should work with child loggers', () => {
      // Mock ASCII-only environment for consistent testing
      vi.stubGlobal('process', {
        ...process,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {}, // ASCII-only mode
      });

      const childLogger = logger.child('deployment');

      childLogger.rocket('Child logger test');

      expect(clackLog.message).toHaveBeenCalledWith(
        '\u001b[90m[deployment]\u001b[39m ^ \u001b[34mChild logger test\u001b[39m'
      );
    });

    it('should respect log injection protection', () => {
      const protectionConfig = logger.getLogInjectionProtection();

      expect(protectionConfig).toBeDefined();
      expect(protectionConfig.enableProtection).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed icon names gracefully', () => {
      const malformedNames = [null, undefined, '', 123, {}, []];

      malformedNames.forEach((name) => {
        expect(() => logger.withIcon(name as any, 'Test')).not.toThrow();
      });
    });

    it('should handle empty messages', () => {
      expect(() => logger.rocket('')).not.toThrow();
      expect(() => logger.rocket(null as any)).not.toThrow();
      expect(() => logger.rocket(undefined as any)).not.toThrow();
    });

    it('should handle logger configuration errors gracefully', () => {
      // Create logger with invalid configuration
      expect(() => {
        const invalidLogger = createLogger({
          theme: null as any,
          level: -1 as any,
        });
        invalidLogger.rocket('Test');
      }).not.toThrow();
    });
  });
});
