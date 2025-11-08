/**
 * Core Logger Tests
 *
 * Comprehensive tests for the Logger class covering all methods,
 * configuration options, and edge cases to improve UI module coverage.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @clack/prompts
vi.mock('@clack/prompts', async () => {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    note: vi.fn(),
    log: {
      message: vi.fn(),
    },
    spinner: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn(),
    })),
  };
});

// Mock figures
vi.mock('figures', () => ({
  default: {
    tick: '✓',
    cross: '✗',
    warning: '⚠',
    info: 'ℹ',
    bullet: '•',
    arrowRight: '→',
  },
}));

// Mock foundation modules
vi.mock('../../core/foundation/core/constants.js', () => ({
  BRANDING: {
    asciiArt: 'Mock ASCII Art',
    tagline: 'Mock Tagline',
  },
}));

vi.mock('../../core/foundation/errors/errors.js', () => ({
  formatError: vi.fn((error, options) => {
    if (options?.colorize) {
      return `\u001b[31mFormatted: ${error.message}\u001b[39m`;
    }
    return `Formatted: ${error.message}`;
  }),
}));

vi.mock('../../core/foundation/logging/security.js', () => ({
  analyzeLogSecurity: vi.fn((_message) => ({
    isSecure: true,
    violations: [],
    riskScore: 0,
  })),
  sanitizeLogOutputAdvanced: vi.fn((message) => message),
}));

// Mock icons module
vi.mock('../../core/ui/icons.js', () => ({
  IconProvider: {
    getIcons: vi.fn(() => ({
      tick: '✓',
      cross: '✗',
      warning: '⚠',
      info: 'ℹ',
      rocket: '🚀',
      folder: '📁',
    })),
    get: vi.fn((name) => {
      const icons: Record<string, string> = {
        tick: '✓',
        cross: '✗',
        warning: '⚠',
        info: 'ℹ',
        rocket: '🚀',
        folder: '📁',
      };
      return icons[name] || '?';
    }),
    reset: vi.fn(),
  },
  IconSecurity: {
    sanitizeIcon: vi.fn((icon) => icon),
    isValidIcon: vi.fn(() => true),
    analyzeIconSecurity: vi.fn((text) => ({
      isSecure: true,
      violations: [],
      sanitizedText: text,
    })),
  },
  PlatformCapabilities: {
    getInfo: vi.fn(() => ({
      platform: 'test',
      termProgram: 'test-terminal',
      supportsUnicode: true,
      supportsEmoji: true,
    })),
    reset: vi.fn(),
  },
}));

import {
  intro as clackIntro,
  log as clackLog,
  note as clackNote,
  outro as clackOutro,
  spinner as clackSpinner,
} from '@clack/prompts';
import { createLogger, Logger, LogLevel } from '../../core/ui/logger.js';

// Type definitions for proper typing
interface MockSpinner {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  message: ReturnType<typeof vi.fn>;
  success: ReturnType<typeof vi.fn>;
  fail: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  [key: string]: ReturnType<typeof vi.fn>;
}

interface MockIconProvider {
  getIcons: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
}

describe('Logger Core Functionality', () => {
  let logger: Logger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = createLogger({ level: LogLevel.VERBOSE });
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Logger Configuration', () => {
    it('should create logger with default options', () => {
      const defaultLogger = createLogger();
      expect(defaultLogger).toBeInstanceOf(Logger);
    });

    it('should create logger with custom log level', () => {
      const debugLogger = createLogger({ level: LogLevel.DEBUG });
      debugLogger.debug('test debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create logger with custom prefix', () => {
      const prefixLogger = createLogger({ prefix: 'TEST', level: LogLevel.INFO });
      prefixLogger.info('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[TEST]'));
    });

    it('should create logger with timestamp enabled', () => {
      const timestampLogger = createLogger({ timestamp: true, level: LogLevel.INFO });
      timestampLogger.info('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/\[.*T.*Z\]/));
    });

    it('should create logger with custom theme', () => {
      const customLogger = createLogger({
        level: LogLevel.INFO,
        theme: {
          info: (text: string) => `CUSTOM-${text}`,
        },
      });
      customLogger.info('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('CUSTOM-'));
    });

    it('should handle partial theme overrides correctly', () => {
      const partialThemeLogger = createLogger({
        level: LogLevel.INFO,
        theme: {
          success: (text: string) => `SUCCESS-${text}`,
          // Other theme properties should remain default
        },
      });
      
      partialThemeLogger.success('success message');
      partialThemeLogger.info('info message'); // Should use default theme
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SUCCESS-'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('\u001b[34m')); // Default blue for info
    });
  });

  describe('Log Level Management', () => {
    it('should set log level', () => {
      logger.setLevel(LogLevel.ERROR);
      logger.info('info message'); // Should not log
      logger.error('error message'); // Should log
      
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('info message'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('error message'));
    });

    it('should enable verbose logging', () => {
      logger.enableVerbose();
      logger.verbose('verbose message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('verbose message'));
    });

    it('should enable debug logging', () => {
      logger.enableDebug();
      logger.debug('debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('debug message'));
    });

    it('should respect log levels hierarchy', () => {
      logger.setLevel(LogLevel.WARN);
      
      logger.verbose('verbose'); // Should not log
      logger.debug('debug');     // Should not log
      logger.info('info');       // Should not log
      logger.warn('warn');       // Should log
      logger.error('error');     // Should log
      
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('verbose'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('debug'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('info'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('warn'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('error'));
    });
  });

  describe('Basic Logging Methods', () => {
    it('should log info messages', () => {
      logger.info('info message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('info message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ'));
    });

    it('should log success messages', () => {
      logger.success('success message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('success message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
    });

    it('should log warning messages', () => {
      logger.warn('warning message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('warning message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
    });

    it('should log error messages as string', () => {
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('error message'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
    });

    it('should log error messages as Error objects', () => {
      const error = new Error('test error');
      logger.error(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Formatted: test error'));
    });

    it('should log debug messages', () => {
      logger.debug('debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('debug message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('•'));
    });

    it('should log debug messages with data', () => {
      const data = { key: 'value', number: 42 };
      logger.debug('debug with data', data);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('debug with data'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"key": "value"'));
    });

    it('should log verbose messages', () => {
      logger.verbose('verbose message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('verbose message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('→'));
    });

    it('should log verbose messages with data', () => {
      const data = { verbose: true, count: 1 };
      logger.verbose('verbose with data', data);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('verbose with data'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"verbose": true'));
    });
  });

  describe('Advanced Logging Methods', () => {
    it('should display intro messages', () => {
      logger.intro('Welcome message');
      expect(clackIntro).toHaveBeenCalledWith(expect.stringContaining('Welcome message'));
    });

    it('should display intro with branding', () => {
      logger.intro('Welcome message', true);
      expect(clackIntro).toHaveBeenCalledWith(expect.stringContaining('Welcome message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mock ASCII Art'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mock Tagline'));
    });

    it('should display outro messages', () => {
      logger.outro('Goodbye message');
      expect(clackOutro).toHaveBeenCalledWith(expect.stringContaining('Goodbye message'));
    });

    it('should display note messages', () => {
      logger.note('note message');
      expect(clackNote).toHaveBeenCalledWith(expect.stringContaining('note message'), undefined);
    });

    it('should display note messages with title', () => {
      logger.note('note message', 'Note Title');
      expect(clackNote).toHaveBeenCalledWith(
        expect.stringContaining('note message'),
        expect.stringContaining('Note Title')
      );
    });

    it('should display step information', () => {
      logger.step('step message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('step message'));
    });

    it('should display step with numbers', () => {
      logger.step('step message', 2, 5);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('(2/5)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('step message'));
    });

    it('should use clack log method', () => {
      logger.log('clack message');
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('clack message'));
    });
  });

  describe('Spinner Management', () => {
    it('should create and manage spinners', () => {
      // Mock the spinner function to return a proper mock
      vi.mocked(clackSpinner).mockReturnValueOnce({
        start: vi.fn(),
        stop: vi.fn(),
        message: vi.fn(),
      } as MockSpinner);
      
      const spinner = logger.spinner('loading...');
      expect(clackSpinner).toHaveBeenCalled();
      expect(spinner.start).toHaveBeenCalledWith(expect.stringContaining('loading...'));
    });

    it('should wrap spinner methods for tracking', () => {
      const startSpy = vi.fn();
      const stopSpy = vi.fn();
      const messageSpy = vi.fn();
      
      const mockSpinner = {
        start: startSpy,
        stop: stopSpy,
        message: messageSpy,
      };
      vi.mocked(clackSpinner).mockReturnValueOnce(mockSpinner as MockSpinner);
      
      const spinner = logger.spinner('loading...');
      
      // Test enhanced methods
      (spinner as MockSpinner).success('completed');
      (spinner as MockSpinner).fail('failed');
      (spinner as MockSpinner).warn('warning');
      
      expect(stopSpy).toHaveBeenCalledTimes(3);
    });

    it('should stop all spinners', () => {
      const stop1Spy = vi.fn();
      const stop2Spy = vi.fn();
      
      const mockSpinner1 = {
        start: vi.fn(),
        stop: stop1Spy,
        message: vi.fn(),
      };
      const mockSpinner2 = {
        start: vi.fn(),
        stop: stop2Spy,
        message: vi.fn(),
      };
      
      vi.mocked(clackSpinner)
        .mockReturnValueOnce(mockSpinner1 as MockSpinner)
        .mockReturnValueOnce(mockSpinner2 as MockSpinner);
      
      logger.spinner('loading 1');
      logger.spinner('loading 2');
      
      logger.stopAllSpinners('Stopped all');
      
      expect(stop1Spy).toHaveBeenCalledWith('Stopped all', undefined);
      expect(stop2Spy).toHaveBeenCalledWith('Stopped all', undefined);
    });
  });

  describe('Data Display Methods', () => {
    it('should display table data', () => {
      const data = {
        name: 'Test',
        version: '1.0.0',
        active: true,
        count: 42,
      };
      
      logger.table(data);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('name'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1.0.0'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('true'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('42'));
    });

    it('should display lists with default bullet', () => {
      const items = ['item1', 'item2', 'item3'];
      logger.list(items);
      
      items.forEach(item => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(item));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('•'));
      });
    });

    it('should display lists with custom bullet', () => {
      const items = ['item1', 'item2'];
      logger.list(items, '→');
      
      items.forEach(item => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(item));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('→'));
      });
    });

    it('should display box messages', () => {
      logger.box('box message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('┌'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('box message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('└'));
    });

    it('should display box messages with title', () => {
      logger.box('box message', 'Box Title');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('┌'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Box Title'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('├'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('box message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('└'));
    });

    it('should handle multiline box messages', () => {
      logger.box('line 1\\nline 2\\nline 3');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('line 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('line 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('line 3'));
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with additional prefix', () => {
      const childLogger = logger.child('child');
      childLogger.info('child message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[child]'));
    });

    it('should create nested child loggers', () => {
      const parentLogger = createLogger({ prefix: 'parent' });
      const childLogger = parentLogger.child('child');
      childLogger.info('nested message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[parent:child]'));
    });

    it('should inherit parent logger settings', () => {
      const parentLogger = createLogger({ level: LogLevel.ERROR, timestamp: true });
      const childLogger = parentLogger.child('child');
      
      childLogger.info('info message'); // Should not log due to parent level
      childLogger.error('error message'); // Should log
      
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('info message'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('error message'));
    });

    it('should override parent settings when specified', () => {
      const parentLogger = createLogger({ level: LogLevel.ERROR });
      const childLogger = parentLogger.child('child', { level: LogLevel.INFO });
      
      childLogger.info('child info'); // Should log due to child override
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('child info'));
    });
  });

  describe('Theme Management', () => {
    it('should update theme', () => {
      logger.setTheme({ info: (text) => `UPDATED-${text}` });
      logger.info('themed message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('UPDATED-'));
    });

    it('should get current theme', () => {
      const theme = logger.getTheme();
      expect(theme).toHaveProperty('info');
      expect(theme).toHaveProperty('success');
      expect(theme).toHaveProperty('warning');
      expect(theme).toHaveProperty('error');
    });

    it('should preserve theme immutability', () => {
      const theme1 = logger.getTheme();
      logger.setTheme({ info: (text) => `MODIFIED-${text}` });
      const theme2 = logger.getTheme();
      
      expect(theme1.info).not.toBe(theme2.info);
    });
  });

  describe('Log Injection Protection', () => {
    it('should set log injection protection config', () => {
      const config = {
        enableProtection: true,
        protectionLevel: 'strict' as const,
        detectTerminalManipulation: true,
        preserveFormatting: false,
        allowControlChars: false,
      };
      
      logger.setLogInjectionProtection(config);
      const retrieved = logger.getLogInjectionProtection();
      
      expect(retrieved.enableProtection).toBe(true);
      expect(retrieved.protectionLevel).toBe('strict');
    });

    it('should get log injection protection config', () => {
      const config = logger.getLogInjectionProtection();
      expect(config).toHaveProperty('enableProtection');
      expect(config).toHaveProperty('protectionLevel');
    });

    it('should analyze message security', () => {
      const analysis = logger.analyzeMessage('test message');
      expect(analysis).toHaveProperty('isSecure');
      expect(analysis).toHaveProperty('violations');
      expect(analysis).toHaveProperty('riskScore');
    });
  });

  describe('Icon Methods', () => {
    it('should get available icons', () => {
      const icons = logger.getIcons();
      expect(icons).toHaveProperty('tick');
      expect(icons).toHaveProperty('cross');
      expect(icons).toHaveProperty('warning');
    });

    it('should get platform info', () => {
      const info = logger.getPlatformInfo();
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('supportsUnicode');
      expect(info).toHaveProperty('supportsEmoji');
    });

    it('should log with custom icons', () => {
      logger.withIcon('rocket', 'launch message');
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('🚀'));
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('launch message'));
    });

    it('should handle invalid icons gracefully', async () => {
      const { IconProvider: MockIconProvider } = await vi.importMock('../../core/ui/icons.js') as { IconProvider: MockIconProvider };
      const originalGet = MockIconProvider.get;
      
      MockIconProvider.get = vi.fn().mockImplementationOnce(() => {
        throw new Error('Icon not found');
      });
      
      logger.withIcon('invalid' as never, 'fallback message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting icon'));
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('fallback message'));
      
      // Restore original function
      MockIconProvider.get = originalGet;
    });

    it('should analyze icon security', () => {
      const analysis = logger.analyzeIconSecurity('🚀');
      expect(analysis).toHaveProperty('isSecure');
      expect(analysis).toHaveProperty('violations');
    });

    it('should get safe icons', () => {
      const safeIcon = logger.getSafeIcon('rocket');
      expect(typeof safeIcon).toBe('string');
    });
  });

  describe('Convenience Icon Methods', () => {
    const iconMethods = [
      'rocket', 'cloud', 'package', 'deploy', 'server', 'database', 'api', 'network', 'globe',
      'folder', 'file', 'upload', 'download', 'sync',
      'shield', 'key', 'lock', 'gear',
      'build', 'lightning', 'pending', 'skip',
      'successWithIcon', 'failureWithIcon',
      'sparkle', 'diamond', 'crown', 'trophy'
    ];

    iconMethods.forEach(method => {
      it(`should have ${method} method`, () => {
        const loggerMethods = logger as unknown as Record<string, (message: string) => void>;
        expect(typeof loggerMethods[method]).toBe('function');
        loggerMethods[method]('test message');
        expect(clackLog.message).toHaveBeenCalled();
      });
    });
  });

  describe('Icon Testing and Debugging', () => {
    it('should test icon display', () => {
      logger.testIcons();
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('Platform Icon Test'));
      expect(clackLog.message).toHaveBeenCalledWith(expect.stringContaining('Available Icons'));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle SILENT log level', () => {
      logger.setLevel(LogLevel.SILENT);
      logger.error('should not log');
      logger.warn('should not log');
      logger.info('should not log');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined data in debug/verbose', () => {
      logger.debug('debug without data', undefined);
      logger.verbose('verbose without data', undefined);
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('undefined'));
    });

    it('should handle empty prefix gracefully', () => {
      const emptyPrefixLogger = createLogger({ prefix: '' });
      emptyPrefixLogger.info('message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('message'));
    });

    it('should handle malformed theme functions', () => {
      // This tests the theme merging logic handles undefined values
      const partialTheme = {
        info: undefined,
        success: (text: string) => `SUCCESS: ${text}`,
      };
      
      const themeLogger = createLogger({ theme: partialTheme });
      themeLogger.info('info message'); // Should use default theme
      themeLogger.success('success message'); // Should use custom theme
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('\u001b[34m')); // Default blue
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SUCCESS:'));
    });
  });
});