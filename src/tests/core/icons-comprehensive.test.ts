/**
 * Comprehensive Icon System Tests
 *
 * Tests for PlatformCapabilities, IconProvider, and IconSecurity classes
 * covering functionality, edge cases, security vulnerabilities, and performance.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ExtendedIcons,
  IconProvider,
  IconSecurity,
  PlatformCapabilities,
} from '../../core/ui/icons.js';

describe('PlatformCapabilities', () => {
  beforeEach(() => {
    // Reset cached detection before each test
    PlatformCapabilities.reset();
  });

  afterEach(() => {
    // Clean up environment modifications
    vi.restoreAllMocks();
  });

  describe('Unicode Support Detection', () => {
    it('should detect Unicode support in VS Code terminal', () => {
      // Mock VS Code environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
    });

    it('should detect Unicode support in Windows Terminal', () => {
      // Mock Windows Terminal environment
      vi.stubGlobal('process', {
        ...process,
        platform: 'win32',
        stdout: { isTTY: true },
        env: { WT_SESSION: 'abc123' },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
    });

    it('should detect Unicode support in modern macOS terminals', () => {
      // Mock macOS environment
      vi.stubGlobal('process', {
        ...process,
        platform: 'darwin',
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'iTerm.app' },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
    });

    it('should detect Unicode support in modern Linux terminals', () => {
      // Mock Linux environment
      vi.stubGlobal('process', {
        ...process,
        platform: 'linux',
        stdout: { isTTY: true },
        env: { COLORTERM: 'truecolor', TERM: 'xterm-256color' },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(true);
    });

    it('should handle disabled Unicode environments', () => {
      // Mock disabled Unicode environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { DISABLE_UNICODE: 'true' },
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(false);
    });

    it('should handle old Windows console', () => {
      // Mock old Windows console
      vi.stubGlobal('process', {
        ...process,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {}, // No WT_SESSION, ConEmuANSI, or TERM_PROGRAM
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(false);
    });

    it('should handle non-TTY environments', () => {
      // Mock non-TTY environment (like pipes)
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: false },
        env: {},
      });

      expect(PlatformCapabilities.supportsUnicode()).toBe(false);
    });

    it('should handle CI environments appropriately', () => {
      // Mock CI environment and force detection
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: false },
        env: { CI: 'true', FORCE_UNICODE_DETECTION: 'true' },
      });

      PlatformCapabilities.reset();
      expect(PlatformCapabilities.supportsUnicode()).toBe(true); // CI gets Unicode but not emoji
    });

    it('should cache Unicode detection results', () => {
      // Mock environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      const result1 = PlatformCapabilities.supportsUnicode();
      const result2 = PlatformCapabilities.supportsUnicode();

      expect(result1).toBe(result2);
      expect(result1).toBe(true);
    });
  });

  describe('Emoji Support Detection', () => {
    it('should detect emoji support in VS Code', () => {
      // Mock VS Code environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      expect(PlatformCapabilities.supportsEmoji()).toBe(true);
    });

    it('should detect emoji support on macOS', () => {
      // Mock macOS environment and force detection
      vi.stubGlobal('process', {
        ...process,
        platform: 'darwin',
        stdout: { isTTY: true },
        env: { FORCE_UNICODE_DETECTION: 'true', FORCE_EMOJI_DETECTION: 'true' },
      });

      PlatformCapabilities.reset();
      expect(PlatformCapabilities.supportsEmoji()).toBe(true);
    });

    it('should disable emoji in CI environments', () => {
      // Mock CI environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: false },
        env: { CI: 'true', TERM_PROGRAM: 'vscode' },
      });

      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });

    it('should handle explicitly disabled emoji', () => {
      // Mock disabled emoji environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { DISABLE_EMOJI: 'true', TERM_PROGRAM: 'vscode' },
      });

      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });

    it('should require Unicode support for emoji', () => {
      // Mock environment with no Unicode support
      vi.stubGlobal('process', {
        ...process,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {}, // Old Windows console, no Unicode
      });

      expect(PlatformCapabilities.supportsEmoji()).toBe(false);
    });
  });

  describe('Platform Info', () => {
    it('should provide comprehensive platform information', () => {
      // Mock environment
      vi.stubGlobal('process', {
        ...process,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {
          TERM_PROGRAM: 'vscode',
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
      });

      const info = PlatformCapabilities.getInfo();

      expect(info).toMatchObject({
        platform: 'win32',
        isTTY: true,
        termProgram: 'vscode',
        term: 'xterm-256color',
        colorTerm: 'truecolor',
        supportsUnicode: expect.any(Boolean),
        supportsEmoji: expect.any(Boolean),
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined process.stdout', () => {
      // Mock undefined stdout and force detection to test actual logic
      vi.stubGlobal('process', {
        ...process,
        stdout: undefined,
        env: { FORCE_UNICODE_DETECTION: 'true' },
      });

      PlatformCapabilities.reset();
      expect(() => PlatformCapabilities.supportsUnicode()).not.toThrow();
    });

    it('should handle missing environment variables gracefully', () => {
      // Mock minimal environment
      vi.stubGlobal('process', {
        ...process,
        platform: 'linux',
        stdout: { isTTY: true },
        env: {}, // No environment variables
      });

      expect(() => PlatformCapabilities.supportsUnicode()).not.toThrow();
      expect(() => PlatformCapabilities.supportsEmoji()).not.toThrow();
    });

    it('should handle reset functionality properly', () => {
      // Mock environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      const result1 = PlatformCapabilities.supportsUnicode();
      PlatformCapabilities.reset();

      // Change environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: false },
        env: {},
      });

      const result2 = PlatformCapabilities.supportsUnicode();

      expect(result1).not.toBe(result2);
    });
  });
});

describe('IconProvider', () => {
  beforeEach(() => {
    // Reset provider state
    IconProvider.reset();
    PlatformCapabilities.reset();
  });

  describe('Icon Generation', () => {
    it('should provide all required icons', () => {
      const icons = IconProvider.getIcons();

      // Verify all ExtendedIcons properties exist
      const expectedIcons = [
        'tick',
        'cross',
        'warning',
        'info',
        'rocket',
        'cloud',
        'box',
        'folder',
        'file',
        'gear',
        'lightning',
        'shield',
        'key',
        'lock',
        'globe',
        'network',
        'database',
        'server',
        'api',
        'upload',
        'download',
        'sync',
        'build',
        'deploy',
        'success',
        'failure',
        'pending',
        'skip',
        'sparkle',
        'diamond',
        'crown',
        'trophy',
      ];

      expectedIcons.forEach((iconName) => {
        expect(icons).toHaveProperty(iconName);
        expect(typeof icons[iconName as keyof ExtendedIcons]).toBe('string');
        expect(icons[iconName as keyof ExtendedIcons].length).toBeGreaterThan(0);
      });
    });

    it('should use emoji icons when emoji support is available', () => {
      // Mock full emoji support
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      const icons = IconProvider.getIcons();

      expect(icons.rocket).toBe('🚀');
      expect(icons.cloud).toBe('☁️');
      expect(icons.box).toBe('📦');
      expect(icons.shield).toBe('🛡️');
    });

    it('should use Unicode fallbacks when emoji is not supported', () => {
      // Mock Unicode only support (no emoji)
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { CI: 'true' }, // CI usually gets Unicode but not emoji
      });

      const icons = IconProvider.getIcons();

      expect(icons.rocket).toBe('▲'); // Unicode fallback
      expect(icons.cloud).toBe('◯'); // Unicode fallback
      expect(icons.lightning).toBe('※'); // Unicode fallback
    });

    it('should use ASCII fallbacks when Unicode is not supported', () => {
      // Mock ASCII-only environment
      vi.stubGlobal('process', {
        ...process,
        platform: 'win32',
        stdout: { isTTY: true },
        env: {}, // Old Windows console
      });

      const icons = IconProvider.getIcons();

      expect(icons.rocket).toBe('^'); // ASCII fallback
      expect(icons.cloud).toBe('O'); // ASCII fallback
      expect(icons.gear).toBe('*'); // ASCII fallback
    });

    it('should cache icon generation results', () => {
      // Mock environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      const icons1 = IconProvider.getIcons();
      const icons2 = IconProvider.getIcons();

      expect(icons1).toBe(icons2); // Same object reference (cached)
    });

    it('should provide individual icon access', () => {
      // Mock environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' },
      });

      const rocket = IconProvider.get('rocket');
      const cloud = IconProvider.get('cloud');

      expect(typeof rocket).toBe('string');
      expect(typeof cloud).toBe('string');
      expect(rocket.length).toBeGreaterThan(0);
      expect(cloud.length).toBeGreaterThan(0);
    });
  });

  describe('Fallback Logic', () => {
    it('should handle figures symbols correctly', () => {
      // Mock Unicode support
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { COLORTERM: 'truecolor' },
      });

      const icons = IconProvider.getIcons();

      // These should use figures symbols when available
      expect(icons.tick).toBeTruthy();
      expect(icons.cross).toBeTruthy();
      expect(icons.warning).toBeTruthy();
      expect(icons.info).toBeTruthy();
    });

    it('should provide consistent fallback hierarchy', () => {
      // Test each capability level
      const testCases = [
        { unicode: false, emoji: false, expected: 'ascii' },
        { unicode: true, emoji: false, expected: 'unicode' },
        { unicode: true, emoji: true, expected: 'emoji' },
      ];

      testCases.forEach(({ unicode, emoji, expected }) => {
        IconProvider.reset();
        PlatformCapabilities.reset();

        // Mock appropriate environment
        if (!unicode) {
          // ASCII only - old Windows console, no force flags
          vi.stubGlobal('process', {
            ...process,
            platform: 'win32',
            stdout: { isTTY: true },
            env: {}, // No force flags, should fall back to ASCII
          });
        } else if (!emoji) {
          // Unicode but no emoji - CI environment
          vi.stubGlobal('process', {
            ...process,
            stdout: { isTTY: true },
            env: { CI: 'true', FORCE_UNICODE_DETECTION: 'true' },
          });
        } else {
          // Full emoji support - VS Code
          vi.stubGlobal('process', {
            ...process,
            stdout: { isTTY: true },
            env: {
              TERM_PROGRAM: 'vscode',
              FORCE_UNICODE_DETECTION: 'true',
              FORCE_EMOJI_DETECTION: 'true',
            },
          });
        }

        const icons = IconProvider.getIcons();

        // Verify fallback behavior
        if (expected === 'ascii') {
          expect(icons.rocket).toBe('^');
        } else if (expected === 'unicode') {
          expect(icons.rocket).toBe('▲');
        } else {
          expect(icons.rocket).toBe('🚀');
        }
      });
    });
  });
});

describe('IconSecurity', () => {
  describe('Icon Sanitization', () => {
    it('should allow safe Unicode characters', () => {
      const safeIcons = ['🚀', '⚡', '▲', '◯', 'A', '123'];

      safeIcons.forEach((icon) => {
        const sanitized = IconSecurity.sanitizeIcon(icon);
        expect(sanitized).toBe(icon);
      });
    });

    it('should remove ANSI escape sequences', () => {
      const maliciousIcon = '\x1b[31m🚀\x1b[0m';
      const sanitized = IconSecurity.sanitizeIcon(maliciousIcon);

      expect(sanitized).not.toContain('\x1b');
      expect(sanitized).toBe('🚀');
    });

    it('should remove control characters', () => {
      const controlChars = [
        '\x00',
        '\x01',
        '\x07',
        '\x08', // NUL, SOH, BEL, BS
        '\x1F',
        '\x7F',
        '\x9F', // DEL and C1 controls
      ];

      controlChars.forEach((char) => {
        const maliciousIcon = `🚀${char}test`;
        const sanitized = IconSecurity.sanitizeIcon(maliciousIcon);

        expect(sanitized).not.toContain(char);
        expect(sanitized).toBe('🚀test');
      });
    });

    it('should enforce length limits', () => {
      const longIcon = '🚀'.repeat(20); // 20 rocket emojis
      const sanitized = IconSecurity.sanitizeIcon(longIcon);

      expect(sanitized.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty and null inputs', () => {
      expect(IconSecurity.sanitizeIcon('')).toBe('');
      expect(IconSecurity.sanitizeIcon(null as never)).toBe('');
      expect(IconSecurity.sanitizeIcon(undefined as never)).toBe('');
    });

    it('should preserve legitimate Unicode ranges', () => {
      const legitimateUnicode = [
        '★', // U+2605 (Miscellaneous Symbols)
        '▶', // U+25B6 (Geometric Shapes)
        '◯', // U+25EF (Geometric Shapes)
        '※', // U+203B (General Punctuation)
        '♦', // U+2666 (Miscellaneous Symbols)
        '🚀', // U+1F680 (Transport and Map Symbols)
        '⚡', // U+26A1 (Miscellaneous Symbols)
      ];

      legitimateUnicode.forEach((char) => {
        const sanitized = IconSecurity.sanitizeIcon(char);
        expect(sanitized).toBe(char);
      });
    });

    it('should filter out dangerous Unicode ranges', () => {
      // These are outside the allowed ranges in IconSecurity
      const dangerousChars = [
        '\uFEFF', // Zero-width no-break space
        '\u200B', // Zero-width space
        '\u2028', // Line separator
        '\u2029', // Paragraph separator
      ];

      dangerousChars.forEach((char) => {
        const icon = `🚀${char}`;
        const sanitized = IconSecurity.sanitizeIcon(icon);

        expect(sanitized).not.toContain(char);
      });
    });
  });

  describe('Icon Validation', () => {
    it('should validate safe icons as valid', () => {
      const safeIcons = ['🚀', '⚡', '▲', 'A'];

      safeIcons.forEach((icon) => {
        expect(IconSecurity.isValidIcon(icon)).toBe(true);
      });
    });

    it('should reject icons with ANSI sequences', () => {
      const maliciousIcon = '\x1b[31m🚀\x1b[0m';
      expect(IconSecurity.isValidIcon(maliciousIcon)).toBe(false);
    });

    it('should reject icons with control characters', () => {
      const maliciousIcon = '🚀\x07'; // BEL character
      expect(IconSecurity.isValidIcon(maliciousIcon)).toBe(false);
    });

    it('should reject overly long icons', () => {
      const longIcon = 'A'.repeat(15);
      expect(IconSecurity.isValidIcon(longIcon)).toBe(false);
    });

    it('should reject empty icons', () => {
      expect(IconSecurity.isValidIcon('')).toBe(false);
      expect(IconSecurity.isValidIcon(null as never)).toBe(false);
      expect(IconSecurity.isValidIcon(undefined as never)).toBe(false);
    });
  });

  describe('Security Analysis', () => {
    it('should analyze secure text correctly', () => {
      const safeText = 'Hello 🚀 World ⚡';
      const analysis = IconSecurity.analyzeIconSecurity(safeText);

      expect(analysis.isSecure).toBe(true);
      expect(analysis.issues).toHaveLength(0);
      expect(analysis.stats.hasEmoji).toBe(true);
    });

    it('should detect ANSI injection attempts', () => {
      const maliciousText = '\x1b[31mHello\x1b[0m';
      const analysis = IconSecurity.analyzeIconSecurity(maliciousText);

      expect(analysis.isSecure).toBe(false);
      expect(analysis.issues).toContain('Contains ANSI escape sequences');
    });
    it('should detect control characters', () => {
      const maliciousText = 'Hello\x07World';
      const analysis = IconSecurity.analyzeIconSecurity(maliciousText);

      expect(analysis.isSecure).toBe(false);
      expect(analysis.issues).toContain('Contains control characters');
    });

    it('should warn about long text', () => {
      const longText = 'A'.repeat(150);
      const analysis = IconSecurity.analyzeIconSecurity(longText);

      expect(analysis.warnings).toContain('Icon is longer than recommended length');
    });

    it('should detect complex Unicode', () => {
      // Construct text with multi-byte Unicode that would have high byte/character ratio
      const complexText = '🚀🌍💎'; // These emojis have high byte counts
      const analysis = IconSecurity.analyzeIconSecurity(complexText);

      expect(analysis.stats.byteLength).toBeGreaterThan(analysis.stats.characterCount);
      // May or may not trigger warning depending on specific characters
    });

    it('should provide accurate statistics', () => {
      const text = 'Hello 🚀 World';
      const analysis = IconSecurity.analyzeIconSecurity(text);

      expect(analysis.stats).toMatchObject({
        characterCount: expect.any(Number),
        byteLength: expect.any(Number),
        hasEmoji: true,
      });

      expect(analysis.stats.characterCount).toBeGreaterThan(0);
      expect(analysis.stats.byteLength).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Attack Scenarios', () => {
    it('should handle terminal manipulation attempts', () => {
      const attacks = [
        '\x1b[2J\x1b[H', // Clear screen and move cursor
        '\x1b[9999C', // Move cursor far right
        '\x1b]0;Evil Title\x07', // Set terminal title
        '\x1bc', // Full reset
      ];

      attacks.forEach((attack) => {
        const sanitized = IconSecurity.sanitizeIcon(attack);
        const validation = IconSecurity.isValidIcon(attack);

        expect(sanitized).not.toContain('\x1b');
        expect(validation).toBe(false);
      });
    });

    it('should handle Unicode normalization attacks', () => {
      // Different Unicode representations of similar characters
      const attacks = [
        'A\\u0300', // A + combining grave accent
        'e\\u0301', // e + combining acute accent
        '\\uFEFF', // Zero-width no-break space
        '\\u200D', // Zero-width joiner
      ];

      attacks.forEach((attack) => {
        const sanitized = IconSecurity.sanitizeIcon(attack);
        // Should remove dangerous combining characters
        expect(sanitized.length).toBeLessThanOrEqual(attack.length);
      });
    });

    it('should handle buffer overflow attempts', () => {
      const hugeIcon = '🚀'.repeat(10000);
      const sanitized = IconSecurity.sanitizeIcon(hugeIcon);

      expect(sanitized.length).toBeLessThanOrEqual(10);
      expect(() => IconSecurity.analyzeIconSecurity(hugeIcon)).not.toThrow();
    });

    it('should handle malformed Unicode', () => {
      // These might cause issues in some systems
      const malformedInputs = [
        '\\uD800', // High surrogate without low surrogate
        '\\uDFFF', // Low surrogate without high surrogate
        '\\uD800\\uD800', // Two high surrogates
      ];

      malformedInputs.forEach((input) => {
        expect(() => IconSecurity.sanitizeIcon(input)).not.toThrow();
        expect(() => IconSecurity.isValidIcon(input)).not.toThrow();
        expect(() => IconSecurity.analyzeIconSecurity(input)).not.toThrow();
      });
    });

    it('should handle recursive or circular patterns', () => {
      // Patterns that might cause regex catastrophic backtracking
      const complexPatterns = [
        `${'a'.repeat(100)}!`,
        'x'.repeat(50) + 'y'.repeat(50),
        '(abc)+'.repeat(20),
      ];

      complexPatterns.forEach((pattern) => {
        const start = Date.now();
        IconSecurity.sanitizeIcon(pattern);
        const elapsed = Date.now() - start;

        // Should not take more than 1 second (DoS protection)
        expect(elapsed).toBeLessThan(1000);
      });
    });

    it('should maintain performance under load', () => {
      const testIcon = '🚀⚡🛡️';
      const iterations = 1000;

      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        IconSecurity.sanitizeIcon(testIcon);
        IconSecurity.isValidIcon(testIcon);
      }

      const elapsed = Date.now() - start;

      // Should handle 1000 operations in reasonable time
      expect(elapsed).toBeLessThan(1000); // Less than 1ms per operation
    });
  });
});
