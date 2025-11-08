import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { demonstrateIconSystem, demonstrateErrorScenarios, runDemo } from '../../examples/logger-icons-demo.js';
import * as coreModule from '../../core/index.js';

// Mock the core module
vi.mock('../../core/index.js', () => ({
  createLogger: vi.fn(() => ({
    // Basic logger methods
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    // Enhanced icon methods that actually exist on the Logger class
    intro: vi.fn(),
    outro: vi.fn(),
    sparkle: vi.fn(),
    gear: vi.fn(),
    withIcon: vi.fn(),
    shield: vi.fn(),
    server: vi.fn(),
    folder: vi.fn(),
    build: vi.fn(),
    trophy: vi.fn(),
    diamond: vi.fn(),
    lightning: vi.fn(),
    warning: vi.fn(),
    failureWithIcon: vi.fn(),
    successWithIcon: vi.fn(),
    testIcons: vi.fn(),
    rocket: vi.fn(),
    cloud: vi.fn(),
    box: vi.fn(),
    database: vi.fn(),
    api: vi.fn(),
    network: vi.fn(),
    globe: vi.fn(),
    file: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    sync: vi.fn(),
    key: vi.fn(),
    lock: vi.fn(),
    pending: vi.fn(),
    skip: vi.fn(),
    crown: vi.fn(),
  })),
}));

describe('Logger Icons Demo', () => {
  let mockLogger: Record<string, ReturnType<typeof vi.fn>>;
  let mockConsole: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a comprehensive mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      intro: vi.fn(),
      outro: vi.fn(),
      sparkle: vi.fn(),
      gear: vi.fn(),
      withIcon: vi.fn(),
      shield: vi.fn(),
      server: vi.fn(),
      folder: vi.fn(),
      build: vi.fn(),
      trophy: vi.fn(),
      diamond: vi.fn(),
      lightning: vi.fn(),
      warning: vi.fn(),
      failureWithIcon: vi.fn(),
      successWithIcon: vi.fn(),
      testIcons: vi.fn(),
      rocket: vi.fn(),
      cloud: vi.fn(),
      box: vi.fn(),
      database: vi.fn(),
      api: vi.fn(),
      network: vi.fn(),
      globe: vi.fn(),
      file: vi.fn(),
      upload: vi.fn(),
      download: vi.fn(),
      sync: vi.fn(),
      key: vi.fn(),
      lock: vi.fn(),
      pending: vi.fn(),
      skip: vi.fn(),
      crown: vi.fn(),
    };

    // Mock createLogger to return our comprehensive mock logger
    vi.mocked(coreModule.createLogger).mockReturnValue(mockLogger as unknown as ReturnType<typeof coreModule.createLogger>);

    // Mock console methods
    mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
    };
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);

    // Mock global setTimeout to execute immediately
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: Function) => {
      fn();
      return 1 as unknown as NodeJS.Timeout;
    });

    // Mock process properties for platform tests
    Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    process.env.TERM_PROGRAM = 'vscode';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('demonstrateIconSystem', () => {
    it('should initialize and run complete icon demonstration', async () => {
      await demonstrateIconSystem();

      // Since the implementation checks for method existence and all methods exist in our mock,
      // it should use the enhanced methods
      expect(mockLogger.intro).toHaveBeenCalledWith('🚀 Enhanced Logger Icon System Demo');
      expect(mockLogger.sparkle).toHaveBeenCalledWith('Welcome to the comprehensive icon demonstration!');
    });

    it('should analyze platform capabilities', async () => {
      await demonstrateIconSystem();

      // Verify platform analysis section
      expect(mockLogger.gear).toHaveBeenCalledWith('Platform Capability Analysis');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('shield', 'platform: darwin');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('network', 'termProgram: vscode');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('lightning', 'isTTY: true');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('diamond', 'supportsUnicode: true');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('crown', 'supportsEmoji: true');
    });

    it('should handle missing enhanced icon methods gracefully', async () => {
      // Create a logger without enhanced methods to test fallback
      const basicMockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        success: vi.fn(),
      };
      vi.mocked(coreModule.createLogger).mockReturnValue(basicMockLogger as unknown as ReturnType<typeof coreModule.createLogger>);

      await demonstrateIconSystem();

      // Should fall back to basic info method
      expect(basicMockLogger.info).toHaveBeenCalledWith('🚀 Enhanced Logger Icon System Demo');
      expect(basicMockLogger.info).toHaveBeenCalledWith('✨ Welcome to the comprehensive icon demonstration!');
    });

    it('should demonstrate infrastructure icons', async () => {
      await demonstrateIconSystem();

      // Verify infrastructure icon demonstrations
      expect(mockLogger.server).toHaveBeenCalledWith('Infrastructure & Deployment Icons');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('rocket', 'Deploying application to production...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('cloud', 'Connecting to cloud infrastructure...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('server', 'Starting web server on port 3000...');
    });

    it('should demonstrate file operations', async () => {
      await demonstrateIconSystem();

      // Verify file operation demonstrations
      expect(mockLogger.folder).toHaveBeenCalledWith('File & Directory Operations');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('folder', 'Creating project directory structure...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('upload', 'Uploading assets to S3...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('download', 'Downloading dependencies...');
    });

    it('should demonstrate security and configuration', async () => {
      await demonstrateIconSystem();

      // Verify security demonstrations
      expect(mockLogger.shield).toHaveBeenCalledWith('Security & Configuration');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('shield', 'Initializing security protocols...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('key', 'Generating API keys...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('lock', 'Encrypting sensitive data...');
    });

    it('should demonstrate process status indicators', async () => {
      await demonstrateIconSystem();

      // Verify process status demonstrations
      expect(mockLogger.build).toHaveBeenCalledWith('Process & Status Indicators');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('build', 'Building TypeScript project...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('lightning', 'Running performance optimization...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('pending', 'Waiting for database migration...');
    });

    it('should run real-world deployment scenario', async () => {
      await demonstrateIconSystem();

      // Verify deployment scenario
      expect(mockLogger.trophy).toHaveBeenCalledWith('Real-world Deployment Scenario');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('gear', 'Initializing deployment pipeline...');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('trophy', 'Deployment successful!');
    });

    it('should run performance tests', async () => {
      await demonstrateIconSystem();

      // Verify performance testing
      expect(mockLogger.lightning).toHaveBeenCalledWith('Performance & Compatibility Test');
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Icon retrieval performance: 1000 iterations in'));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Average per icon:'));
    });

    it('should handle performance timing correctly', async () => {
      // Mock performance.now to return predictable values
      const mockPerformanceNow = vi.spyOn(performance, 'now');
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1050); // 50ms difference

      await demonstrateIconSystem();

      // Verify timing calculation - should see 50.00ms in performance output
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('50.00ms'));
    });

    it('should call testIcons when available', async () => {
      await demonstrateIconSystem();

      // Verify testIcons method is called
      expect(mockLogger.testIcons).toHaveBeenCalled();
    });
  });

  describe('demonstrateErrorScenarios', () => {
    it('should demonstrate error handling with icons', async () => {
      await demonstrateErrorScenarios();

      // Verify error handling demonstration
      expect(mockLogger.warning).toHaveBeenCalledWith('Error Handling with Icons');
      expect(mockLogger.withIcon).toHaveBeenCalledWith('warning', 'This demonstrates icon system resilience');
    });

    it('should handle icon errors gracefully', async () => {
      // Mock withIcon to throw an error
      mockLogger.withIcon = vi.fn().mockImplementationOnce(() => {
        throw new Error('Icon render failed');
      });

      await demonstrateErrorScenarios();

      // Should catch and handle the error
      expect(mockLogger.failureWithIcon).toHaveBeenCalledWith(expect.stringContaining('Caught error'));
    });

    it('should demonstrate icon sanitization', async () => {
      await demonstrateErrorScenarios();
      
      // Verify sanitization demonstration
      expect(mockLogger.shield).toHaveBeenCalledWith(expect.stringContaining('Sanitized malicious input:'));
    });

    it('should handle non-Error objects', async () => {
      // Mock an error scenario that throws a string instead of Error object
      mockLogger.withIcon = vi.fn().mockImplementationOnce(() => {
        throw 'String error';
      });

      await demonstrateErrorScenarios();

      // Should handle non-Error objects
      expect(mockLogger.failureWithIcon).toHaveBeenCalledWith(expect.stringContaining('String error'));
    });
  });

  describe('runDemo (main function)', () => {
    it('should execute complete demo sequence', async () => {
      await runDemo();

      // Verify both main demo functions are called
      expect(mockLogger.intro).toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalled();
    });
  });

  describe('Utility functions and type safety', () => {
    it('should handle platform detection correctly', async () => {
      // Set specific platform for testing
      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });

      await demonstrateIconSystem();

      // Verify platform info is gathered correctly
      const mockLogger = coreModule.createLogger();
      expect(mockLogger.withIcon).toHaveBeenCalledWith('shield', expect.stringContaining('darwin'));
    });

    it('should handle different terminal environments', async () => {
      // Test Windows environment
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true });
      process.env.WT_SESSION = '1'; // Windows Terminal

      await demonstrateIconSystem();

      const mockLogger = coreModule.createLogger();
      expect(mockLogger.withIcon).toHaveBeenCalledWith('shield', expect.stringContaining('win32'));
    });

    it('should sanitize icons correctly', async () => {
      await demonstrateErrorScenarios();

      // Test the sanitization logic through demonstration
      const mockLogger = coreModule.createLogger();
      expect(mockLogger.shield).toHaveBeenCalledWith(expect.stringContaining('malicious input'));
    });

    it('should handle TypeScript interfaces correctly', async () => {
      await demonstrateIconSystem();

      // Verify interface properties work (through successful execution)
      const mockLogger = coreModule.createLogger();
      expect(mockLogger.withIcon).toHaveBeenCalled();
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Windows platform', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true });

      await demonstrateIconSystem();

      const mockLogger = coreModule.createLogger();
      expect(mockLogger.withIcon).toHaveBeenCalledWith('shield', expect.stringContaining('win32'));
    });

    it('should handle Linux platform', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true });

      await demonstrateIconSystem();

      const mockLogger = coreModule.createLogger();
      expect(mockLogger.withIcon).toHaveBeenCalledWith('shield', expect.stringContaining('linux'));
    });

    it('should handle missing environment variables', async () => {
      delete process.env.TERM_PROGRAM;
      
      await demonstrateIconSystem();

      const mockLogger = coreModule.createLogger();
      expect(mockLogger.withIcon).toHaveBeenCalledWith('network', expect.stringContaining('unknown'));
    });
  });

  describe('Performance and stress testing', () => {
    it('should handle performance measurement correctly', async () => {
      // Mock performance.now for consistent test results
      const mockPerformanceNow = vi.spyOn(performance, 'now');
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1025); // 25ms difference

      await demonstrateIconSystem();

      // Verify performance measurement shows expected timing
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('25.00ms'));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Average per icon:'));
    });

    it('should handle high iteration counts', async () => {
      await demonstrateIconSystem();

      // Verify 1000 iterations are mentioned in performance testing
      const mockLogger = coreModule.createLogger();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('1000 iterations'));
    });
  });
});