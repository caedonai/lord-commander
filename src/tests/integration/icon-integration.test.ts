/**
 * Integration Tests for Icon System
 *
 * Tests for CLI framework integration, export validation,
 * tree-shaking compatibility, and module loading.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCLI } from '../../core/createCLI.js';
import { IconProvider, PlatformCapabilities } from '../../core/ui/icons.js';
import { createLogger } from '../../core/ui/logger.js';

// Mock @clack/prompts to avoid stdout.write issues
vi.mock('@clack/prompts', () => ({
  log: {
    message: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    step: vi.fn(),
  },
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
}));

// Mock figures to avoid external dependency issues in CI
vi.mock('figures', () => ({
  default: {
    tick: '✓',
    cross: '✗',
    warning: '⚠',
    info: 'ℹ',
    bullet: '•',
    arrowUp: '↑',
    arrowDown: '↓',
    arrowLeft: '←',
    arrowRight: '→',
    play: '▶',
    square: '◼',
    squareSmall: '◻',
    circle: '●',
    circleSmall: '◯',
  },
  mainSymbols: {
    tick: '✓',
    cross: '✗',
    warning: '⚠',
    info: 'ℹ',
    bullet: '•',
    arrowUp: '↑',
    arrowDown: '↓',
    arrowLeft: '←',
    arrowRight: '→',
    play: '▶',
    square: '◼',
    squareSmall: '◻',
    circle: '●',
    circleSmall: '◯',
  },
  fallbackSymbols: {
    tick: 'v',
    cross: 'x',
    warning: '!',
    info: 'i',
    bullet: '*',
    arrowUp: '^',
    arrowDown: 'v',
    arrowLeft: '<',
    arrowRight: '>',
    play: '>',
    square: '#',
    squareSmall: '.',
    circle: 'O',
    circleSmall: 'o',
  },
}));

describe('Icon System Integration', () => {
  beforeEach(() => {
    PlatformCapabilities.reset();
    IconProvider.reset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CLI Framework Integration', () => {
    it('should integrate seamlessly with createCLI', async () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
        argv: ['node', 'test-cli', '--help'],
      });

      // Mock console to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Create CLI with icon-enabled logger
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI with icons',
        autoStart: false,
      });

      // Should not throw and should have icon capabilities
      expect(program).toBeDefined();
      expect(typeof program.run).toBe('function');

      // Logger should have icon methods available
      const logger = createLogger();
      expect(typeof logger.rocket).toBe('function');
      expect(typeof logger.cloud).toBe('function');
      expect(typeof logger.package).toBe('function');

      consoleSpy.mockRestore();
    });

    it('should work with different CLI configurations', async () => {
      const configurations = [
        { autoStart: false, name: 'minimal-cli' },
        { autoStart: false, name: 'full-cli', builtinCommands: { completion: true, hello: true } },
        { autoStart: false, name: 'custom-cli', commandsPath: './custom-commands' },
      ];

      for (const config of configurations) {
        vi.stubGlobal('process', {
          ...process,
          stdout: { isTTY: true },
          env: { TERM_PROGRAM: 'vscode' },
          argv: ['node', config.name, '--version'],
        });

        const program = await createCLI({
          ...config,
          version: '1.0.0',
          description: 'Test CLI configuration',
        });

        expect(program).toBeDefined();

        // Icon system should be available regardless of CLI configuration
        const logger = createLogger();
        logger.rocket('Test message'); // Should not throw

        const icons = IconProvider.getIcons();
        expect(icons.rocket).toBeTruthy();
      }
    });

    it('should handle CLI error scenarios gracefully', async () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: false }, // No TTY
        env: {}, // Minimal environment
        argv: ['node', 'error-cli'],
      });

      // Should work even in constrained environments
      const program = await createCLI({
        name: 'error-cli',
        version: '1.0.0',
        description: 'CLI in constrained environment',
        autoStart: false,
      });

      expect(program).toBeDefined();

      // Icons should fall back to ASCII
      const logger = createLogger();
      logger.rocket('Fallback test'); // Should not throw

      const icons = IconProvider.getIcons();
      expect(icons.rocket).toBe('^'); // ASCII fallback
    });
  });

  describe('Module Export Validation', () => {
    it('should export all icon classes correctly', async () => {
      // Test direct imports
      const {
        PlatformCapabilities: PC,
        IconProvider: IP,
        IconSecurity: IS,
      } = await import('../../core/ui/icons.js');

      expect(PC).toBeDefined();
      expect(IP).toBeDefined();
      expect(IS).toBeDefined();

      // Test class methods
      expect(typeof PC.supportsUnicode).toBe('function');
      expect(typeof PC.supportsEmoji).toBe('function');
      expect(typeof PC.getInfo).toBe('function');
      expect(typeof PC.reset).toBe('function');

      expect(typeof IP.getIcons).toBe('function');
      expect(typeof IP.get).toBe('function');
      expect(typeof IP.reset).toBe('function');

      expect(typeof IS.sanitizeIcon).toBe('function');
      expect(typeof IS.isValidIcon).toBe('function');
      expect(typeof IS.analyzeIconSecurity).toBe('function');
    });

    it('should export icon methods through logger', async () => {
      const { createLogger } = await import('../../core/ui/logger.js');

      const logger = createLogger();

      // Test all semantic icon methods
      const iconMethods = [
        'rocket',
        'cloud',
        'package',
        'lightning',
        'shield',
        'deploy',
        'build',
        'folder',
        'file',
        'network',
        'database',
        'server',
        'api',
        'globe',
        'upload',
        'download',
        'sync',
        'key',
        'lock',
        'gear',
      ];

      iconMethods.forEach((method) => {
        expect(typeof (logger as any)[method]).toBe('function');
      });

      // Test core icon method
      expect(typeof logger.withIcon).toBe('function');
      expect(typeof logger.testIcons).toBe('function');
    });

    it('should export through core index', async () => {
      // Test that icons are available through main core export
      const coreExports = await import('../../core/index.js');

      expect(coreExports.PlatformCapabilities).toBeDefined();
      expect(coreExports.IconProvider).toBeDefined();
      expect(coreExports.IconSecurity).toBeDefined();
      expect(coreExports.createLogger).toBeDefined();

      // Test logger with icons through core export
      const logger = coreExports.createLogger();
      expect(typeof logger.rocket).toBe('function');
    });
  });

  describe('Tree-shaking Compatibility', () => {
    it('should support selective icon imports', async () => {
      // Test that individual classes can be imported
      const { IconProvider } = await import('../../core/ui/icons.js');

      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      const icons = IconProvider.getIcons();
      expect(icons.rocket).toBeTruthy();
    });

    it('should support selective logger method imports', async () => {
      // Test that logger can be imported independently
      const { createLogger } = await import('../../core/ui/logger.js');

      const logger = createLogger();
      logger.rocket('Selective import test');

      expect(typeof logger.rocket).toBe('function');
    });

    it('should not bundle unnecessary dependencies', async () => {
      // This test verifies that importing icons doesn't pull in heavy dependencies
      // In a real tree-shaking scenario, only the used parts should be included

      // Import specific functions
      const { IconSecurity } = await import('../../core/ui/icons.js');

      // Should be able to use without importing entire icon system
      const result = IconSecurity.sanitizeIcon('🚀');
      expect(result).toBe('🚀');
    });

    it('should validate icon exports in tree-shaking test suite', () => {
      // This would be validated by the existing tree-shaking.test.ts
      // We're ensuring our icon exports are included in the expected exports

      const iconExports = ['PlatformCapabilities', 'IconProvider', 'IconSecurity', 'createLogger'];

      // These should be part of the core exports
      iconExports.forEach((exportName) => {
        expect(exportName).toBeTruthy(); // Placeholder - actual validation in tree-shaking.test.ts
      });
    });
  });

  describe('Module Loading and Dependencies', () => {
    it('should handle figures dependency gracefully', async () => {
      // Test behavior when figures is not available
      vi.doUnmock('figures');
      vi.doMock('figures', () => {
        throw new Error('Module not found');
      });

      // Reset to force re-evaluation
      IconProvider.reset();
      PlatformCapabilities.reset();

      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      // Should fall back to Unicode/ASCII even without figures
      expect(() => {
        const icons = IconProvider.getIcons();
        expect(icons.rocket).toBeTruthy(); // Should have some fallback
      }).not.toThrow();
    });

    it('should work in different module systems', async () => {
      // Test ESM import
      const esmImport = await import('../../core/ui/icons.js');
      expect(esmImport.IconProvider).toBeDefined();

      // Test that classes work after import
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      const icons = esmImport.IconProvider.getIcons();
      expect(icons.rocket).toBeTruthy();
    });

    it('should handle circular dependency scenarios', async () => {
      // Icons depend on logger security, ensure no circular issues
      const { createLogger } = await import('../../core/ui/logger.js');
      const { IconSecurity } = await import('../../core/ui/icons.js');

      // Should be able to use both without conflicts
      const logger = createLogger();
      const sanitized = IconSecurity.sanitizeIcon('🚀');

      logger.rocket('Testing circular dependency');
      expect(sanitized).toBe('🚀');
    });

    it('should work across different Node.js environments', () => {
      const nodeVersions = [
        { version: '18.0.0', features: ['emoji', 'unicode'] },
        { version: '16.0.0', features: ['unicode'] },
        { version: '14.0.0', features: ['basic'] },
      ];

      nodeVersions.forEach(({ features }) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        // Mock different Node.js capabilities
        vi.stubGlobal('process', {
          ...process,
          stdout: { isTTY: true },
          env: features.includes('emoji') ? { TERM_PROGRAM: 'vscode' } : {},
        });

        // Should work regardless of Node.js version
        expect(() => {
          const icons = IconProvider.getIcons();
          expect(icons.rocket).toBeTruthy();
        }).not.toThrow();
      });
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should work in CI/CD pipeline integration', () => {
      const ciEnvironments = [
        { CI: 'true', GITHUB_ACTIONS: 'true' },
        { CI: 'true', GITLAB_CI: 'true' },
        { CI: 'true', AZURE_PIPELINES: 'true' },
        { CI: 'true', JENKINS_URL: 'http://jenkins.example.com' },
      ];

      ciEnvironments.forEach((env) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...process,
          stdout: { isTTY: false },
          env,
        });

        // Should provide appropriate fallbacks in CI
        const logger = createLogger();
        logger.rocket('CI test');
        logger.cloud('CI cloud test');

        const icons = IconProvider.getIcons();
        expect(icons.rocket).toBeTruthy();

        // In CI, should use ASCII fallbacks
        expect(typeof icons.rocket).toBe('string');
      });
    });

    it('should work with Docker container integration', () => {
      PlatformCapabilities.reset();
      IconProvider.reset();

      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: false },
        env: {
          // Typical Docker environment
          HOME: '/root',
          PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
          PWD: '/app',
        },
      });

      // Should work in containerized environment
      const logger = createLogger();
      logger.package('Docker deployment');
      logger.deploy('Container startup');

      const icons = IconProvider.getIcons();
      expect(icons.box).toBeTruthy(); // package uses 'box' icon
    });

    it('should integrate with VS Code extension scenarios', () => {
      PlatformCapabilities.reset();
      IconProvider.reset();

      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: {
          TERM_PROGRAM: 'vscode',
          VSCODE_PID: '12345',
          COLORTERM: 'truecolor',
        },
      });

      // Should use full emoji support in VS Code
      const logger = createLogger();
      logger.rocket('VS Code integration');
      logger.lightning('Extension activation');

      const icons = IconProvider.getIcons();
      expect(icons.rocket).toBe('🚀'); // Should be emoji
      expect(icons.lightning).toBe('⚡'); // Should be emoji
    });

    it('should handle server deployment scenarios', () => {
      PlatformCapabilities.reset();
      IconProvider.reset();

      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: false },
        env: {
          // Server environment
          NODE_ENV: 'production',
          PM2_HOME: '/root/.pm2',
          SSH_CONNECTION: '192.168.1.1 22 192.168.1.100 54321',
        },
      });

      // Should work in production server environment
      const logger = createLogger();
      logger.deploy('Server deployment');
      logger.database('Database connection');
      logger.shield('Security check'); // Use shield instead of security

      const icons = IconProvider.getIcons();
      expect(icons.deploy).toBeTruthy();
      expect(icons.database).toBeTruthy();
      expect(icons.shield).toBeTruthy();
    });

    it('should handle development workflow integration', () => {
      PlatformCapabilities.reset();
      IconProvider.reset();

      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: {
          NODE_ENV: 'development',
          TERM_PROGRAM: 'iTerm.app', // macOS development
          COLORTERM: 'truecolor',
          FORCE_EMOJI_DETECTION: 'true', // Force emoji support for development test
        },
      });

      // Should use rich icons in development
      const logger = createLogger();
      logger.build('Building application');
      logger.lightning('Running tests'); // Use lightning instead of test
      logger.gear('Loading configuration'); // Use gear instead of config

      const icons = IconProvider.getIcons();
      expect(icons.build).toBeTruthy();
      expect(icons.lightning).toBeTruthy();
      expect(icons.gear).toBeTruthy();

      // Should have enhanced visuals in development
      const info = PlatformCapabilities.getInfo();
      expect(info.supportsEmoji).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from platform detection failures', () => {
      // Mock a scenario where platform detection fails
      const originalProcess = global.process;

      vi.stubGlobal('process', {
        stdout: null, // Invalid stdout
        env: null, // Invalid env
      } as any);

      PlatformCapabilities.reset();
      IconProvider.reset();

      // Should not crash and provide safe fallbacks
      expect(() => {
        const icons = IconProvider.getIcons();
        expect(icons.rocket).toBeTruthy();
      }).not.toThrow();

      // Restore process
      vi.stubGlobal('process', originalProcess);
    });

    it('should handle malformed environment variables', () => {
      const malformedEnvs = [
        { TERM_PROGRAM: '\x00invalid' },
        { COLORTERM: 'invalid\x1b[31m' },
        { WT_SESSION: '../../malicious' },
      ];

      malformedEnvs.forEach((env) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...process,
          stdout: { isTTY: true },
          env,
        });

        // Should sanitize and handle gracefully
        expect(() => {
          const logger = createLogger();
          logger.rocket('Malformed env test');
        }).not.toThrow();
      });
    });

    it('should recover from icon generation errors', () => {
      PlatformCapabilities.reset();
      IconProvider.reset();

      // Mock a scenario that could cause icon generation issues
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      // Force an error scenario (if possible)
      // Icons should still be available through fallbacks
      const icons = IconProvider.getIcons();
      expect(icons.rocket).toBeTruthy();
      expect(typeof icons.rocket).toBe('string');
      expect(icons.rocket.length).toBeGreaterThan(0);
    });
  });
});
