/**
 * Icon System Security Vulnerability Tests
 * 
 * Comprehensive security testing for icon functionality including:
 * - ANSI injection attacks
 * - Control character injection
 * - Unicode exploitation attempts
 * - Buffer overflow protection
 * - Input validation security
 * - Terminal manipulation attempts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IconSecurity, IconProvider, PlatformCapabilities } from '../../core/ui/icons.js';
import { createLogger } from '../../core/ui/logger.js';

describe('Icon System Security Vulnerabilities', () => {
  beforeEach(() => {
    IconProvider.reset();
    PlatformCapabilities.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ANSI Injection Attacks', () => {
    const ansiAttacks = [
      {
        name: 'Basic color injection',
        payload: '\x1b[31mRED\x1b[0m',
        description: 'Should remove ANSI color codes'
      },
      {
        name: 'Cursor manipulation',
        payload: '\x1b[H\x1b[2J🚀',
        description: 'Should remove cursor positioning commands'
      },
      {
        name: 'Screen clearing attempt',
        payload: '\x1b[2J\x1b[3J\x1b[H',
        description: 'Should remove screen clearing sequences'
      },
      {
        name: 'Terminal title injection',
        payload: '\x1b]0;Malicious Title\x07',
        description: 'Should remove terminal title setting'
      },
      {
        name: 'Alternative screen buffer',
        payload: '\x1b[?1049h',
        description: 'Should remove alternative screen buffer commands'
      },
      {
        name: 'Complex ANSI sequence',
        payload: '\x1b[38;2;255;0;0m\x1b[48;2;0;255;0mCOMPLEX\x1b[0m',
        description: 'Should remove complex 24-bit color sequences'
      },
      {
        name: 'Hyperlink injection',
        payload: '\x1b]8;;http://evil.com\x1b\\LINK\x1b]8;;\x1b\\',
        description: 'Should remove hyperlink sequences'
      },
      {
        name: 'Bracketed paste mode',
        payload: '\x1b[?2004h',
        description: 'Should remove bracketed paste mode sequences'
      }
    ];

    ansiAttacks.forEach(({ name, payload }) => {
      it(`should prevent ${name}`, () => {
        const sanitized = IconSecurity.sanitizeIcon(payload);
        
        // Should not contain any ANSI escape sequences
        expect(sanitized).not.toMatch(/\x1b\[/);
        expect(sanitized).not.toMatch(/\x1b\]/);
        expect(sanitized).not.toMatch(/\x1b\(/);
        expect(sanitized).not.toMatch(/\x1b\)/);
        
        // Security validation should fail for original payload
        expect(IconSecurity.isValidIcon(payload)).toBe(false);
        
        // Analysis should detect ANSI sequences
        const analysis = IconSecurity.analyzeIconSecurity(payload);
        expect(analysis.isSecure).toBe(false);
        expect(analysis.issues).toContain('Contains ANSI escape sequences');
      });
    });

    it('should handle nested ANSI sequences', () => {
      const nestedAnsi = '\x1b[31m\x1b[1m\x1b[4mNested\x1b[0m\x1b[0m\x1b[0m';
      const sanitized = IconSecurity.sanitizeIcon(nestedAnsi);
      
      expect(sanitized).not.toContain('\x1b');
      expect(sanitized).toBe('Nested');
    });

    it('should handle malformed ANSI sequences', () => {
      const malformed = [
        '\x1b[',        // Incomplete sequence
        '\x1b[999999m', // Invalid parameter
        '\x1b[;;;;;m',  // Multiple separators
        '\x1b[]m',      // Empty parameters
      ];

      malformed.forEach(sequence => {
        const sanitized = IconSecurity.sanitizeIcon(sequence);
        expect(sanitized).not.toContain('\x1b');
      });
    });
  });

  describe('Control Character Injection', () => {
    const controlCharAttacks = [
      {
        name: 'NULL byte injection',
        char: '\x00',
        code: 0x00,
        description: 'Should remove NULL bytes'
      },
      {
        name: 'Bell character (BEL)',
        char: '\x07',
        code: 0x07,
        description: 'Should remove bell characters that could cause audio alerts'
      },
      {
        name: 'Backspace (BS)',
        char: '\x08',
        code: 0x08,
        description: 'Should remove backspace characters'
      },
      {
        name: 'Form feed (FF)',
        char: '\x0C',
        code: 0x0C,
        description: 'Should remove form feed characters'
      },
      {
        name: 'Carriage return (CR)',
        char: '\x0D',
        code: 0x0D,
        description: 'Should remove carriage return outside normal use'
      },
      {
        name: 'Shift Out (SO)',
        char: '\x0E',
        code: 0x0E,
        description: 'Should remove character set switching'
      },
      {
        name: 'Shift In (SI)',
        char: '\x0F',
        code: 0x0F,
        description: 'Should remove character set switching'
      },
      {
        name: 'Device Control 1 (DC1/XON)',
        char: '\x11',
        code: 0x11,
        description: 'Should remove flow control characters'
      },
      {
        name: 'Device Control 3 (DC3/XOFF)',
        char: '\x13',
        code: 0x13,
        description: 'Should remove flow control characters'
      },
      {
        name: 'Substitute (SUB)',
        char: '\x1A',
        code: 0x1A,
        description: 'Should remove substitute character'
      },
      {
        name: 'Delete (DEL)',
        char: '\x7F',
        code: 0x7F,
        description: 'Should remove delete character'
      },
      // C1 Control Characters (0x80-0x9F)
      {
        name: 'String Terminator (ST)',
        char: '\x9C',
        code: 0x9C,
        description: 'Should remove C1 control characters'
      }
    ];

    controlCharAttacks.forEach(({ name, char, code }) => {
      it(`should prevent ${name} (${char})`, () => {
        const payload = `🚀${char}test`;
        const sanitized = IconSecurity.sanitizeIcon(payload);
        
        // Should not contain the control character
        expect(sanitized).not.toContain(String.fromCharCode(code));
        expect(sanitized).toBe('🚀test');
        
        // Validation should fail
        expect(IconSecurity.isValidIcon(payload)).toBe(false);
        
        // Analysis should detect control characters
        const analysis = IconSecurity.analyzeIconSecurity(payload);
        expect(analysis.isSecure).toBe(false);
        expect(analysis.issues).toContain('Contains control characters');
      });
    });

    it('should handle multiple control characters', () => {
      const payload = '🚀\x07\x08\x0C\x7Ftest';
      const sanitized = IconSecurity.sanitizeIcon(payload);
      
      expect(sanitized).toBe('🚀test');
      expect(IconSecurity.isValidIcon(payload)).toBe(false);
    });

    it('should preserve legitimate whitespace', () => {
      const legitimateWhitespace = '🚀 test\ttab\nline';
      const sanitized = IconSecurity.sanitizeIcon(legitimateWhitespace);
      
      // Should preserve space, but may remove tab and newline depending on implementation
      expect(sanitized).toContain('🚀');
      expect(sanitized).toContain('test');
    });
  });

  describe('Unicode Exploitation Attacks', () => {
    const unicodeAttacks = [
      {
        name: 'Zero-width characters',
        payload: '🚀\u200B\u200C\u200D\uFEFFtest',
        description: 'Should remove zero-width characters that could hide content'
      },
      {
        name: 'Bidirectional text override (LTR)',
        payload: '🚀\u202Dtest\u202C',
        description: 'Should remove bidirectional text controls'
      },
      {
        name: 'Bidirectional text override (RTL)',
        payload: '🚀\u202Etest\u202C',
        description: 'Should remove right-to-left override'
      },
      {
        name: 'Line separator injection',
        payload: '🚀\u2028test',
        description: 'Should remove Unicode line separators'
      },
      {
        name: 'Paragraph separator injection',
        payload: '🚀\u2029test',
        description: 'Should remove Unicode paragraph separators'
      },
      {
        name: 'Combining character abuse',
        payload: 'A\u0300\u0301\u0302\u0303\u0304',
        description: 'Should limit excessive combining characters'
      },
      {
        name: 'Homograph attack (Cyrillic)',
        payload: '🚀а', // Cyrillic 'а' (U+0430) looks like Latin 'a'
        description: 'Should handle homograph characters appropriately'
      },
      {
        name: 'Surrogate pair manipulation',
        payload: '\uD83D\uDE80', // Valid emoji surrogate pair
        description: 'Should handle surrogate pairs correctly'
      },
      {
        name: 'Invalid surrogate pairs',
        payload: '\uD83D\uD83D', // Two high surrogates
        description: 'Should handle invalid surrogate pairs'
      },
      {
        name: 'Isolated surrogates',
        payload: '\uD83D', // High surrogate without low
        description: 'Should handle isolated surrogates'
      }
    ];

    unicodeAttacks.forEach(({ name, payload }) => {
      it(`should handle ${name}`, () => {
        expect(() => {
          const sanitized = IconSecurity.sanitizeIcon(payload);
          const isValid = IconSecurity.isValidIcon(payload);
          const analysis = IconSecurity.analyzeIconSecurity(payload);
          
          // Should not throw errors
          expect(sanitized).toBeDefined();
          expect(typeof isValid).toBe('boolean');
          expect(analysis).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should handle Unicode normalization attacks', () => {
      // Different Unicode representations of the same character
      const attacks = [
        'é',              // Precomposed (U+00E9)
        'e\u0301',       // Base + combining acute accent
        '\u0065\u0301'  // Explicit base + combining
      ];

      attacks.forEach(attack => {
        expect(() => IconSecurity.sanitizeIcon(attack)).not.toThrow();
      });
    });

    it('should handle extremely long Unicode sequences', () => {
      const longUnicode = '\u1F680'.repeat(1000); // 1000 rocket emojis
      
      const start = Date.now();
      const sanitized = IconSecurity.sanitizeIcon(longUnicode);
      const elapsed = Date.now() - start;
      
      // Should complete quickly and enforce length limits
      expect(elapsed).toBeLessThan(100); // Should be very fast
      expect(sanitized.length).toBeLessThanOrEqual(10); // Length limit enforced
    });
  });

  describe('Buffer Overflow Protection', () => {
    it('should protect against memory exhaustion via large inputs', () => {
      const sizes = [1000, 10000, 100000, 1000000];
      
      sizes.forEach(size => {
        const largeInput = 'A'.repeat(size);
        
        const start = Date.now();
        const sanitized = IconSecurity.sanitizeIcon(largeInput);
        const elapsed = Date.now() - start;
        
        // Should complete quickly regardless of input size
        expect(elapsed).toBeLessThan(100);
        
        // Should enforce reasonable output size
        expect(sanitized.length).toBeLessThanOrEqual(10);
      });
    });

    it('should handle nested object structures safely', () => {
      // Test with object that could cause issues if improperly handled
      const complexInput = JSON.stringify({
        nested: { deep: { very: { much: 'value' } } }
      });
      
      expect(() => {
        IconSecurity.sanitizeIcon(complexInput);
        IconSecurity.analyzeIconSecurity(complexInput);
      }).not.toThrow();
    });

    it('should protect against algorithmic complexity attacks', () => {
      // Patterns that could cause regex catastrophic backtracking
      const complexPatterns = [
        'a'.repeat(100) + '!',                    // Long string with terminator
        '(a+)+b',                                 // Nested quantifiers
        'a'.repeat(50) + 'x'.repeat(50) + '!',   // Mixed pattern
        '((a*)*)b',                               // Double nested quantifiers
      ];

      complexPatterns.forEach(pattern => {
        const start = Date.now();
        IconSecurity.sanitizeIcon(pattern);
        const elapsed = Date.now() - start;
        
        // Should not take excessive time (DoS protection)
        expect(elapsed).toBeLessThan(1000);
      });
    });

    it('should handle circular references safely', () => {
      // Create circular reference (if input was an object)
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const stringified = '[Circular Reference]';
      
      expect(() => {
        IconSecurity.sanitizeIcon(stringified);
      }).not.toThrow();
    });
  });

  describe('Terminal Manipulation Attempts', () => {
    const terminalAttacks = [
      {
        name: 'Terminal reset',
        payload: '\x1bc',
        description: 'Should prevent full terminal reset'
      },
      {
        name: 'Cursor save/restore',
        payload: '\x1b7\x1b8',
        description: 'Should prevent cursor manipulation'
      },
      {
        name: 'Scroll region manipulation',
        payload: '\x1b[1;10r',
        description: 'Should prevent scroll region changes'
      },
      {
        name: 'Tab stop manipulation',
        payload: '\x1bH\x1b[3g',
        description: 'Should prevent tab stop changes'
      },
      {
        name: 'Character set manipulation',
        payload: '\x1b(B\x1b)0',
        description: 'Should prevent character set changes'
      },
      {
        name: 'Application keypad mode',
        payload: '\x1b=\x1b>',
        description: 'Should prevent keypad mode changes'
      },
      {
        name: 'Cursor visibility',
        payload: '\x1b[?25l\x1b[?25h',
        description: 'Should prevent cursor visibility changes'
      },
      {
        name: 'Mouse tracking',
        payload: '\x1b[?1000h\x1b[?1000l',
        description: 'Should prevent mouse tracking changes'
      }
    ];

    terminalAttacks.forEach(({ name, payload }) => {
      it(`should prevent ${name}`, () => {
        const sanitized = IconSecurity.sanitizeIcon(payload);
        
        expect(sanitized).not.toContain('\x1b');
        expect(IconSecurity.isValidIcon(payload)).toBe(false);
        
        const analysis = IconSecurity.analyzeIconSecurity(payload);
        expect(analysis.isSecure).toBe(false);
      });
    });
  });

  describe('Input Validation Security', () => {
    it('should validate input types safely', () => {
      const invalidInputs = [
        null,
        undefined,
        123,
        {},
        [],
        Symbol('test'),
        function() {},
        new Date(),
        /regex/,
        true,
        false
      ];

      invalidInputs.forEach(input => {
        expect(() => {
          IconSecurity.sanitizeIcon(input as any);
          IconSecurity.isValidIcon(input as any);
          IconSecurity.analyzeIconSecurity(input as any);
        }).not.toThrow();
      });
    });

    it('should handle prototype pollution attempts', () => {
      const pollutionAttempts = [
        '__proto__',
        'constructor',
        'prototype',
        'constructor.prototype',
        '__proto__.constructor'
      ];

      pollutionAttempts.forEach(attempt => {
        expect(() => {
          IconSecurity.sanitizeIcon(attempt);
        }).not.toThrow();
      });
    });

    it('should prevent code injection through string inputs', () => {
      const codeInjectionAttempts = [
        'eval("alert(1)")',
        'constructor.constructor("alert(1)")()',
        '${alert(1)}',
        '#{alert(1)}',
        '{{alert(1)}}',
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>'
      ];

      codeInjectionAttempts.forEach(attempt => {
        const sanitized = IconSecurity.sanitizeIcon(attempt);
        
        // Should not execute or contain dangerous patterns
        expect(sanitized).not.toContain('script');
        expect(sanitized).not.toContain('eval');
        expect(sanitized).not.toContain('javascript:');
      });
    });
  });

  describe('Integration Security Tests', () => {
    it('should maintain security when integrated with logger', () => {
      const logger = createLogger();
      const maliciousInputs = [
        '\x1b[31mRED\x1b[0m',
        '🚀\x07',
        '\u202E\u200Btest\u202C'
      ];

      maliciousInputs.forEach(input => {
        // Should not throw errors when using malicious inputs
        expect(() => {
          // Mock IconProvider.get to return malicious input
          const originalGet = IconProvider.get;
          vi.spyOn(IconProvider, 'get').mockReturnValue(input);
          
          logger.rocket('Test message');
          
          // Restore original method
          IconProvider.get = originalGet;
        }).not.toThrow();
      });
    });

    it('should maintain security across different platform capabilities', () => {
      const platforms = [
        { unicode: false, emoji: false },
        { unicode: true, emoji: false },
        { unicode: true, emoji: true }
      ];

      platforms.forEach(({ unicode, emoji }) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        // Mock platform capabilities
        vi.spyOn(PlatformCapabilities, 'supportsUnicode').mockReturnValue(unicode);
        vi.spyOn(PlatformCapabilities, 'supportsEmoji').mockReturnValue(emoji);

        const icons = IconProvider.getIcons();
        
        // All icons should be secure regardless of platform
        Object.values(icons).forEach(icon => {
          expect(IconSecurity.isValidIcon(icon)).toBe(true);
          
          const analysis = IconSecurity.analyzeIconSecurity(icon);
          expect(analysis.isSecure).toBe(true);
        });
      });
    });

    it('should handle concurrent security validation', async () => {
      const concurrentTests = Array.from({ length: 100 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const input = `test${i}\x1b[31m`;
            IconSecurity.sanitizeIcon(input);
            IconSecurity.isValidIcon(input);
            IconSecurity.analyzeIconSecurity(input);
            resolve();
          }, Math.random() * 10);
        });
      });

      // All concurrent operations should complete without errors
      await expect(Promise.all(concurrentTests)).resolves.toBeDefined();
    });
  });

  describe('Security Regression Tests', () => {
    it('should prevent previously discovered vulnerabilities', () => {
      // Add specific vulnerability patterns discovered during security reviews
      const knownVulnerabilities = [
        // Example patterns that might have been discovered
        '\x1b]52;c;\x07', // Clipboard manipulation
        '\x1b[6n',         // Device status report
        '\x1b[0c',         // Device attributes
        '\x1b[>c',         // Secondary device attributes
      ];

      knownVulnerabilities.forEach(vuln => {
        const sanitized = IconSecurity.sanitizeIcon(vuln);
        expect(sanitized).not.toContain('\x1b');
        expect(IconSecurity.isValidIcon(vuln)).toBe(false);
      });
    });

    it('should maintain backward compatibility for legitimate icons', () => {
      const legitimateIcons = [
        '🚀', '⚡', '🛡️', '⚙️', '💾', '🔑',
        '★', '▶', '◯', '※', '♦', '■',
        'A', '123', '!', '@', '#'
      ];

      legitimateIcons.forEach(icon => {
        const sanitized = IconSecurity.sanitizeIcon(icon);
        expect(sanitized).toBe(icon); // Should remain unchanged
        expect(IconSecurity.isValidIcon(icon)).toBe(true);
        
        const analysis = IconSecurity.analyzeIconSecurity(icon);
        expect(analysis.isSecure).toBe(true);
      });
    });
  });
});