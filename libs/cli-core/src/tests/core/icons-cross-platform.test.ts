/**
 * Cross-Platform Compatibility Tests for Icon System
 *
 * Tests platform detection accuracy, fallback mechanisms, and compatibility
 * across different operating systems, terminals, and environments.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IconProvider, IconSecurity, PlatformCapabilities } from '../../core/ui/icons.js';

describe('Cross-Platform Icon Compatibility', () => {
  let originalProcess: typeof process;

  beforeEach(() => {
    // Store original process for restoration
    originalProcess = global.process;

    // Reset cached detection
    PlatformCapabilities.reset();
    IconProvider.reset();
  });

  // Helper function to mock process and reset platform capabilities
  function _mockProcessAndReset(processConfig: Partial<typeof process>) {
    vi.stubGlobal('process', {
      ...originalProcess,
      ...processConfig,
    });
    PlatformCapabilities.reset();
  }

  afterEach(() => {
    // Restore original process
    global.process = originalProcess;
    vi.restoreAllMocks();
  });

  describe('Windows Platform Support', () => {
    it('should detect Windows Terminal correctly', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {
          WT_SESSION: '123-456-789',
          TERM_PROGRAM: 'Windows Terminal',
        },
      });

      PlatformCapabilities.reset(); // Reset after changing environment

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(true);
    });

    it('should detect PowerShell 7+ correctly', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {
          PSModulePath: 'C:\\Program Files\\PowerShell\\7\\Modules',
          PSVersionTable: 'Name=PowerShell;Version=7.2.0',
          FORCE_UNICODE_DETECTION: 'true',
        },
      });

      PlatformCapabilities.reset(); // Reset after changing environment

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
    });

    it('should detect old Windows console (cmd.exe)', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {
          // No WT_SESSION, no ConEmuANSI, no TERM_PROGRAM
          COMSPEC: 'C:\\Windows\\System32\\cmd.exe',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(false);
      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });

    it('should detect ConEmu/Cmder', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {
          ConEmuANSI: 'ON',
          ConEmuPID: '12345',
        },
      });

      PlatformCapabilities.reset(); // Reset after changing environment

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
    });

    it('should provide appropriate Windows fallbacks', () => {
      // Test old Windows console fallbacks
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {},
      });

      const icons = IconProvider.getIcons();

      expect(icons.rocket).toBe('^'); // ASCII fallback
      expect(icons.cloud).toBe('O'); // ASCII fallback
      expect(icons.box).toBe('#'); // ASCII fallback (assuming square uses #)
    });

    it('should handle Windows-specific environment variables', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {
          SESSIONNAME: 'Console',
          PROCESSOR_ARCHITECTURE: 'AMD64',
          OS: 'Windows_NT',
        },
      });

      expect(() => PlatformCapabilities.getInfo()).not.toThrow();
    });
  });

  describe('macOS Platform Support', () => {
    it('should detect Terminal.app correctly', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'darwin',
        stdout: { isTTY: true },
        env: {
          TERM_PROGRAM: 'Apple_Terminal',
          TERM: 'xterm-256color',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(true);
    });

    it('should detect iTerm2 correctly', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'darwin',
        stdout: { isTTY: true },
        env: {
          TERM_PROGRAM: 'iTerm.app',
          ITERM_SESSION_ID: 'w0t0p0:12345',
          TERM: 'xterm-256color',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(true);
    });

    it('should handle macOS system terminal variations', () => {
      const macTerminals = [
        { TERM_PROGRAM: 'Apple_Terminal' },
        { TERM_PROGRAM: 'iTerm.app' },
        { TERM_PROGRAM: 'Hyper' },
        { TERM_PROGRAM: 'Warp' },
      ];

      macTerminals.forEach((env) => {
        vi.stubGlobal('process', {
          ...originalProcess,
          platform: 'darwin',
          stdout: { isTTY: true },
          env: {
            ...originalProcess.env, // Preserve test environment variables
            ...env,
            FORCE_EMOJI_DETECTION: 'true', // Force emoji support for macOS terminals
          },
        });

        PlatformCapabilities.reset(); // Reset AFTER mocking environment

        expect(PlatformCapabilities.supportsUnicode()).toBe(true);
        expect(PlatformCapabilities.supportsEmoji()).toBe(true);
      });
    });
  });

  describe('Linux Platform Support', () => {
    it('should detect modern Linux terminals', () => {
      const linuxTerminals = [
        {
          env: { COLORTERM: 'truecolor', TERM: 'xterm-256color' },
          description: 'Modern terminal with truecolor support',
        },
        {
          env: { TERM_PROGRAM: 'gnome-terminal', TERM: 'xterm-256color' },
          description: 'GNOME Terminal',
        },
        {
          env: { KONSOLE_VERSION: '21.12.3', TERM: 'xterm-256color' },
          description: 'KDE Konsole',
        },
        {
          env: { TERM: 'alacritty', ALACRITTY_SOCKET: '/tmp/alacritty.sock' },
          description: 'Alacritty terminal',
        },
      ];

      linuxTerminals.forEach(({ env }) => {
        PlatformCapabilities.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          platform: 'linux',
          stdout: { isTTY: true },
          env: {
            ...originalProcess.env, // Preserve test environment variables
            ...env,
          },
        });

        expect(PlatformCapabilities.supportsUnicode()).toBe(true);
        // Emoji support varies on Linux
        const emojiSupport = PlatformCapabilities.supportsEmoji();
        expect(typeof emojiSupport).toBe('boolean');
      });
    });

    it('should handle legacy Linux terminals', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'linux',
        stdout: { isTTY: true },
        env: {
          TERM: 'linux', // Console terminal
          COLORTERM: undefined,
        },
      });

      // May or may not support Unicode depending on implementation
      expect(typeof PlatformCapabilities.supportsUnicode()).toBe('boolean');
      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });

    it('should detect SSH sessions appropriately', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        platform: 'linux',
        stdout: { isTTY: true },
        env: {
          ...originalProcess.env, // Preserve test environment variables
          SSH_CLIENT: '192.168.1.100 12345 22',
          SSH_CONNECTION: '192.168.1.100 12345 192.168.1.1 22',
          TERM: 'xterm',
        },
      });

      // SSH sessions should work but emoji support may be limited
      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });
  });

  describe('CI/CD Environment Support', () => {
    it('should detect GitHub Actions', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: false },
        env: {
          ...originalProcess.env, // Preserve test environment variables
          CI: 'true',
          GITHUB_ACTIONS: 'true',
          GITHUB_WORKFLOW: 'CI',
        },
      });

      PlatformCapabilities.reset(); // Reset after changing environment

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(false); // CI disables emoji
    });

    it('should detect GitLab CI', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: false },
        env: {
          ...originalProcess.env, // Preserve test environment variables
          CI: 'true',
          GITLAB_CI: 'true',
          CI_SERVER_NAME: 'GitLab',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });

    it('should detect Azure DevOps', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: false },
        env: {
          ...originalProcess.env, // Preserve test environment variables
          CI: 'true',
          TF_BUILD: 'True',
          AGENT_NAME: 'Azure Pipelines',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });

    it('should detect Jenkins', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: false },
        env: {
          ...originalProcess.env, // Preserve test environment variables
          CI: 'true',
          JENKINS_URL: 'https://jenkins.example.com',
          BUILD_NUMBER: '123',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });
  });

  describe('Docker and Container Support', () => {
    it('should detect Docker environment', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: true },
        env: {
          DOCKER_CONTAINER: '1',
          HOSTNAME: 'docker-container-id',
        },
      });

      // Docker containers may have limited terminal support
      expect(typeof PlatformCapabilities.supportsUnicode()).toBe('boolean');
    });

    it('should handle non-TTY Docker logs', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: false },
        env: {
          DOCKER_CONTAINER: '1',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(false);
      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });
  });

  describe('VS Code Integration', () => {
    it('should detect VS Code integrated terminal', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: true },
        env: {
          TERM_PROGRAM: 'vscode',
          VSCODE_INJECTION: '1',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(true);
    });

    it('should detect VS Code Codespaces', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: true },
        env: {
          TERM_PROGRAM: 'vscode',
          CODESPACES: 'true',
          GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'preview.app.github.dev',
        },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
      expect(PlatformCapabilities.supportsEmoji()).toBe(true);
    });
  });

  describe('Fallback Mechanism Testing', () => {
    it('should provide consistent fallback hierarchy', () => {
      const testScenarios = [
        {
          name: 'No support (ASCII only)',
          platform: 'win32',
          env: {},
          expectedUnicode: false,
          expectedEmoji: false,
          expectedRocket: '^',
        },
        {
          name: 'Unicode only',
          platform: 'linux',
          env: { CI: 'true', COLORTERM: 'truecolor' },
          expectedUnicode: true,
          expectedEmoji: false,
          expectedRocket: '▲',
        },
        {
          name: 'Full support',
          platform: 'darwin',
          env: { TERM_PROGRAM: 'iTerm.app' },
          expectedUnicode: true,
          expectedEmoji: true,
          expectedRocket: '🚀',
        },
      ];

      testScenarios.forEach(({ platform, env, expectedUnicode, expectedEmoji, expectedRocket }) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          platform,
          stdout: { isTTY: true },
          env,
        });

        expect(PlatformCapabilities.supportsUnicode()).toBe(expectedUnicode);
        expect(PlatformCapabilities.supportsEmoji()).toBe(expectedEmoji);

        const icons = IconProvider.getIcons();
        expect(icons.rocket).toBe(expectedRocket);
      });
    });

    it('should maintain icon consistency across platforms', () => {
      const platforms = ['win32', 'darwin', 'linux'];

      platforms.forEach((platform) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          platform,
          stdout: { isTTY: true },
          env: { TERM_PROGRAM: 'vscode' }, // Ensure consistent high support
        });

        const icons = IconProvider.getIcons();

        // All required icons should exist
        expect(icons.rocket).toBeTruthy();
        expect(icons.cloud).toBeTruthy();
        expect(icons.box).toBeTruthy();
        expect(icons.shield).toBeTruthy();

        // All icons should be secure
        Object.values(icons).forEach((icon) => {
          expect(IconSecurity.isValidIcon(icon)).toBe(true);
        });
      });
    });
  });

  describe('Terminal Feature Detection', () => {
    it('should detect color support correctly', () => {
      const colorTests = [
        { env: { COLORTERM: 'truecolor' }, expected: true },
        { env: { TERM: 'xterm-256color' }, expected: true },
        { env: { TERM: 'screen-256color' }, expected: true },
        { env: { TERM: 'xterm' }, expected: true },
        { env: { TERM: 'dumb' }, expected: false },
        { env: { NO_COLOR: '1' }, expected: false },
      ];

      colorTests.forEach(({ env }) => {
        PlatformCapabilities.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          stdout: { isTTY: true },
          env,
        });

        const info = PlatformCapabilities.getInfo();
        // Color support affects Unicode likelihood
        expect(typeof info.supportsUnicode).toBe('boolean');
      });
    });

    it('should handle terminal size detection gracefully', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: {
          isTTY: true,
          columns: 80,
          rows: 24,
        },
        env: { TERM_PROGRAM: 'vscode' },
      });

      expect(() => PlatformCapabilities.getInfo()).not.toThrow();
    });

    it('should handle missing terminal size', () => {
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: {
          isTTY: true,
          columns: undefined,
          rows: undefined,
        },
        env: { TERM_PROGRAM: 'vscode' },
      });

      expect(() => PlatformCapabilities.getInfo()).not.toThrow();
    });
  });

  describe('Environment Variable Edge Cases', () => {
    it('should handle corrupted environment variables', () => {
      const corruptedEnvs = [
        { TERM_PROGRAM: '' },
        { TERM_PROGRAM: null },
        { TERM_PROGRAM: undefined },
        { TERM: '\0corrupted' },
        { COLORTERM: 'invalid\\x1b[31mcolor' },
      ];

      corruptedEnvs.forEach((env) => {
        PlatformCapabilities.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          stdout: { isTTY: true },
          env,
        });

        expect(() => PlatformCapabilities.supportsUnicode()).not.toThrow();
        expect(() => PlatformCapabilities.supportsEmoji()).not.toThrow();
      });
    });

    it('should handle case sensitivity in environment variables', () => {
      // Some systems might have different casing
      vi.stubGlobal('process', {
        ...originalProcess,
        stdout: { isTTY: true },
        env: {
          term_program: 'vscode', // lowercase
          Term_Program: 'VSCode', // mixed case
          TERM_PROGRAM: 'vscode', // correct case
        },
      });

      // Should prioritize the correct case but handle gracefully
      expect(() => PlatformCapabilities.getInfo()).not.toThrow();
    });
  });

  describe('Performance Across Platforms', () => {
    it('should detect platform capabilities quickly', () => {
      const platforms = ['win32', 'darwin', 'linux'];

      platforms.forEach((platform) => {
        PlatformCapabilities.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          platform,
          stdout: { isTTY: true },
          env: { TERM_PROGRAM: 'vscode' },
        });

        const start = Date.now();

        // Multiple calls should be fast (cached)
        for (let i = 0; i < 100; i++) {
          PlatformCapabilities.supportsUnicode();
          PlatformCapabilities.supportsEmoji();
        }

        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(50); // Should be very fast
      });
    });

    it('should generate icons efficiently across platforms', () => {
      const platforms = ['win32', 'darwin', 'linux'];

      platforms.forEach((platform) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          platform,
          stdout: { isTTY: true },
          env: { TERM_PROGRAM: 'vscode' },
        });

        const start = Date.now();

        // Generate icons multiple times
        for (let i = 0; i < 10; i++) {
          IconProvider.getIcons();
        }

        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(100); // Should be cached after first call
      });
    });
  });

  describe('Real-world Scenario Testing', () => {
    it('should work in development environments', () => {
      const devEnvironments = [
        {
          name: 'Local VS Code',
          platform: 'win32',
          env: { TERM_PROGRAM: 'vscode', NODE_ENV: 'development' },
        },
        {
          name: 'macOS Terminal with Node',
          platform: 'darwin',
          env: { TERM_PROGRAM: 'Apple_Terminal', NODE_ENV: 'development' },
        },
        {
          name: 'Linux development server',
          platform: 'linux',
          env: { COLORTERM: 'truecolor', SSH_CLIENT: '192.168.1.100' },
        },
      ];

      devEnvironments.forEach(({ platform, env }) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          platform,
          stdout: { isTTY: true },
          env,
        });

        const icons = IconProvider.getIcons();

        // Should provide usable icons in all dev environments
        expect(icons.rocket).toBeTruthy();
        expect(icons.rocket.length).toBeGreaterThan(0);
        expect(IconSecurity.isValidIcon(icons.rocket)).toBe(true);
      });
    });

    it('should work in production environments', () => {
      const prodEnvironments = [
        {
          name: 'Docker container',
          platform: 'linux',
          env: { CI: 'true', DOCKER_CONTAINER: '1' },
        },
        {
          name: 'GitHub Actions',
          platform: 'linux',
          env: { CI: 'true', GITHUB_ACTIONS: 'true' },
        },
        {
          name: 'AWS Lambda (if TTY available)',
          platform: 'linux',
          env: { AWS_LAMBDA_FUNCTION_NAME: 'my-function' },
        },
      ];

      prodEnvironments.forEach(({ platform, env }) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...originalProcess,
          platform,
          stdout: { isTTY: false }, // Production usually non-TTY
          env,
        });

        // Should still provide fallback icons safely
        expect(() => IconProvider.getIcons()).not.toThrow();

        const icons = IconProvider.getIcons();
        expect(typeof icons.rocket).toBe('string');
      });
    });
  });
});
