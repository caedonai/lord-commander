import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  sanitizeLogOutput, 
  sanitizeLogOutputAdvanced, 
  analyzeLogSecurity,
  type LogInjectionConfig 
} from '../../core/createCLI.js';
import { createLogger, type LoggerOptions } from '../../core/ui/logger.js';

describe('Log Injection Protection', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic Log Sanitization', () => {
    it('should remove ANSI escape sequences', () => {
      const maliciousInput = 'Hello \x1B[31mRED TEXT\x1B[0m World';
      const result = sanitizeLogOutput(maliciousInput);
      
      expect(result).not.toContain('\x1B[31m');
      expect(result).not.toContain('\x1B[0m');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should remove dangerous control characters', () => {
      const maliciousInput = 'Hello\x00\x08\x0B\x0C\x0E\x1F\x7FWorld';
      const result = sanitizeLogOutput(maliciousInput);
      
      expect(result).toBe('HelloWorld');
    });

    it('should handle line injection attempts', () => {
      const maliciousInput = 'Normal log\r\nFAKE ERROR: System compromised\nAnother fake line';
      const result = sanitizeLogOutput(maliciousInput);
      
      expect(result).toContain('[CRLF]');
      expect(result).toContain('[LF]');
      expect(result).not.toContain('\r\n');
      expect(result).not.toContain('\n');
    });

    it('should remove terminal manipulation sequences', () => {
      const maliciousInput = 'Hello\x07\x1B\x5B\x32\x4A\x1B\x63World';
      const result = sanitizeLogOutput(maliciousInput);
      
      expect(result).toBe('HelloWorld');
    });

    it('should prevent Unicode bidirectional override attacks', () => {
      const maliciousInput = 'Hello\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069World';
      const result = sanitizeLogOutput(maliciousInput);
      
      expect(result).toBe('HelloWorld');
    });

    it('should handle format string specifiers', () => {
      const maliciousInput = 'User input: %s %d %x %n';
      const result = sanitizeLogOutput(maliciousInput);
      
      expect(result).toContain('[FORMAT]');
      expect(result).not.toContain('%s');
      expect(result).not.toContain('%d');
    });

    it('should truncate extremely long messages', () => {
      const longMessage = 'A'.repeat(3000);
      const result = sanitizeLogOutput(longMessage);
      
      expect(result.length).toBeLessThanOrEqual(2000);
    });

    it('should handle null and undefined inputs safely', () => {
      expect(sanitizeLogOutput(null as any)).toBe('');
      expect(sanitizeLogOutput(undefined as any)).toBe('');
      expect(sanitizeLogOutput('')).toBe('');
    });

    it('should limit excessive whitespace', () => {
      const input = 'Hello' + ' '.repeat(20) + 'World';
      const result = sanitizeLogOutput(input);
      
      expect(result).toContain('[WHITESPACE]');
      expect(result).not.toContain(' '.repeat(15));
    });
  });

  describe('Advanced Log Sanitization', () => {
    it('should respect enableProtection flag', () => {
      const maliciousInput = 'Hello\\x1B[31mRED\\x1B[0m';
      const config: LogInjectionConfig = { enableProtection: false };
      
      const result = sanitizeLogOutputAdvanced(maliciousInput, config);
      expect(result).toBe(maliciousInput);
    });

    it('should allow control characters when configured', () => {
      const input = 'Hello\\x1B[31mRED\\x1B[0m';
      const config: LogInjectionConfig = { 
        enableProtection: true,
        allowControlChars: true 
      };
      
      const result = sanitizeLogOutputAdvanced(input, config);
      expect(result).toContain('\\x1B[31m');
    });

    it('should preserve formatting when configured', () => {
      const input = 'Line 1\\nLine 2\\r\\nLine 3';
      const config: LogInjectionConfig = { 
        enableProtection: true,
        preserveFormatting: true 
      };
      
      const result = sanitizeLogOutputAdvanced(input, config);
      expect(result).toContain('\\n');
      expect(result).toContain('\\r\\n');
    });

    it('should respect custom length limits', () => {
      const longMessage = 'A'.repeat(1000);
      const config: LogInjectionConfig = { 
        enableProtection: true,
        maxLineLength: 500 
      };
      
      const result = sanitizeLogOutputAdvanced(longMessage, config);
      expect(result.length).toBeLessThanOrEqual(500 + '[TRUNCATED]'.length);
      expect(result).toContain('[TRUNCATED]');
    });

    it('should warn about large messages', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const longMessage = 'A'.repeat(1500);
      const config: LogInjectionConfig = { 
        enableProtection: true,
        warningThreshold: 1000 
      };
      
      sanitizeLogOutputAdvanced(longMessage, config);
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Large log message detected')
      );
      
      warnSpy.mockRestore();
    });
  });

  describe('Log Security Analysis', () => {
    it('should detect ANSI escape sequences', () => {
      const input = 'Hello \x1B[31mRED\x1B[0m';
      const analysis = analyzeLogSecurity(input);
      
      expect(analysis.hasAnsiEscapes).toBe(true);
      expect(analysis.riskLevel).toBe('medium');
      expect(analysis.warnings).toContain('ANSI escape sequences detected');
    });

    it('should detect control characters', () => {
      const input = 'Hello\x00\x08World';
      const analysis = analyzeLogSecurity(input);
      
      expect(analysis.hasControlChars).toBe(true);
      expect(analysis.riskLevel).toBe('medium');
      expect(analysis.warnings).toContain('Control characters detected');
    });

    it('should detect line injection as high risk', () => {
      const input = 'Hello\nFake log entry';
      const analysis = analyzeLogSecurity(input);
      
      expect(analysis.hasLineInjection).toBe(true);
      expect(analysis.riskLevel).toBe('high');
      expect(analysis.warnings).toContain('Line injection patterns detected');
    });

    it('should detect format strings', () => {
      const input = 'User: %s, ID: %d';
      const analysis = analyzeLogSecurity(input);
      
      expect(analysis.hasFormatStrings).toBe(true);
      expect(analysis.riskLevel).toBe('medium');
      expect(analysis.warnings).toContain('Format string specifiers detected');
    });

    it('should escalate risk for extremely long messages', () => {
      const input = 'A'.repeat(6000);
      const analysis = analyzeLogSecurity(input);
      
      expect(analysis.riskLevel).toBe('medium');
      expect(analysis.warnings).toContain('Extremely long message detected');
    });

    it('should report low risk for safe messages', () => {
      const input = 'Hello, this is a safe log message';
      const analysis = analyzeLogSecurity(input);
      
      expect(analysis.riskLevel).toBe('low');
      expect(analysis.warnings).toHaveLength(0);
      expect(analysis.hasAnsiEscapes).toBe(false);
      expect(analysis.hasControlChars).toBe(false);
      expect(analysis.hasLineInjection).toBe(false);
      expect(analysis.hasFormatStrings).toBe(false);
    });
  });

  describe('Logger Integration', () => {
    it('should apply log injection protection by default', () => {
      const logger = createLogger();
      const maliciousMessage = 'Hello\x1B[31mRED\x1B[0m\nFake log';
      
      logger.info(maliciousMessage);
      
      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).not.toContain('\x1B[31m');
      expect(loggedMessage).not.toContain('\n');
    });

    it('should allow custom log injection configuration', () => {
      const loggerOptions: LoggerOptions = {
        logInjectionProtection: {
          enableProtection: false
        }
      };
      
      const logger = createLogger(loggerOptions);
      const maliciousMessage = 'Hello\x1B[31mRED\x1B[0m';
      
      logger.info(maliciousMessage);
      
      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('\x1B[31m');
    });

    it('should allow runtime configuration updates', () => {
      const logger = createLogger();
      
      logger.setLogInjectionProtection({ enableProtection: false });
      const config = logger.getLogInjectionProtection();
      
      expect(config.enableProtection).toBe(false);
    });

    it('should provide message analysis capabilities', () => {
      const logger = createLogger();
      const maliciousMessage = 'Hello\x1B[31mRED\x1B[0m\nFake';
      
      const analysis = logger.analyzeMessage(maliciousMessage);
      
      expect(analysis.hasAnsiEscapes).toBe(true);
      expect(analysis.hasLineInjection).toBe(true);
      expect(analysis.riskLevel).toBe('high');
    });

    it('should protect error logs as well', () => {
      const logger = createLogger();
      const maliciousError = 'Error\x1B[31mCRITICAL\x1B[0m\nFake system failure';
      
      logger.error(maliciousError);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).not.toContain('\x1B[31m');
      expect(loggedMessage).not.toContain('\n');
    });

    it('should handle various log levels consistently', () => {
      const logger = createLogger();
      const maliciousMessage = 'Test\x1B[31mRED\x1B[0m';
      
      // Test different log levels
      logger.info(maliciousMessage);
      logger.warn(maliciousMessage);
      logger.success(maliciousMessage);
      logger.debug(maliciousMessage);
      
      // All should be sanitized
      const allCalls = consoleSpy.mock.calls.concat(consoleErrorSpy.mock.calls);
      for (const call of allCalls) {
        expect(call[0]).not.toContain('\x1B[31m');
      }
    });
  });

  describe('Real-world Attack Scenarios', () => {
    it('should prevent terminal hijacking via ANSI sequences', () => {
      // Sequence that could clear screen and show fake content
      const attack = '\x1B[2J\x1B[H\x1B[31mSYSTEM COMPROMISED\x1B[0m';
      const result = sanitizeLogOutput(attack);
      
      expect(result).not.toContain('\x1B[2J');
      expect(result).not.toContain('\x1B[H');
      expect(result).not.toContain('\x1B[31m');
    });

    it('should prevent log file corruption via null bytes', () => {
      const attack = 'Valid log entry\x00\x00\x00HIDDEN MALICIOUS CONTENT';
      const result = sanitizeLogOutput(attack);
      
      expect(result).not.toContain('\x00');
      expect(result).toBe('Valid log entryHIDDEN MALICIOUS CONTENT');
    });

    it('should prevent fake log injection via CRLF', () => {
      const attack = 'User login successful\r\n[ERROR] System breach detected\r\n[ALERT] Shutting down';
      const result = sanitizeLogOutput(attack);
      
      expect(result).toContain('[CRLF]');
      expect(result).not.toContain('\r\n');
      expect(result).toContain('User login successful');
    });

    it('should prevent DoS via extremely long log messages', () => {
      const attack = 'DoS attempt: ' + 'A'.repeat(50000);
      const result = sanitizeLogOutput(attack);
      
      expect(result.length).toBeLessThanOrEqual(2000);
      expect(result).toContain('DoS attempt:');
    });

    it('should prevent format string attacks', () => {
      const attack = 'User input: %n%n%n%s%s%s%d%d%d';
      const result = sanitizeLogOutput(attack);
      
      expect(result).not.toContain('%n');
      expect(result).not.toContain('%s');
      expect(result).not.toContain('%d');
      expect(result).toContain('[FORMAT]');
    });

    it('should prevent Unicode bidirectional text attacks', () => {
      // Attack that could reverse text direction to hide malicious content
      const attack = 'Safe content\u202Emalicious hidden text\u202D';
      const result = sanitizeLogOutput(attack);
      
      expect(result).not.toContain('\u202E');
      expect(result).not.toContain('\u202D');
      expect(result).toBe('Safe contentmalicious hidden text');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle very large inputs efficiently', () => {
      const largeInput = 'A'.repeat(100000);
      const startTime = Date.now();
      
      const result = sanitizeLogOutput(largeInput);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(result.length).toBeLessThanOrEqual(2000);
    });

    it('should handle mixed attacks in single message', () => {
      const mixedAttack = '\x1B[31mCOLOR\x1B[0m\r\nNEWLINE\x00NULL%s%d[FORMAT]';
      const result = sanitizeLogOutput(mixedAttack);
      
      expect(result).not.toContain('\x1B');
      expect(result).not.toContain('\r\n');
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('%s');
      expect(result).toContain('[FORMAT]');
    });

    it('should preserve legitimate content while removing attacks', () => {
      const mixedContent = 'Legitimate log: user login successful \x1B[31mCOLOR_ATTACK\x1B[0m normal content continues';
      const result = sanitizeLogOutput(mixedContent);
      
      expect(result).toContain('Legitimate log: user login successful');
      expect(result).toContain('normal content continues');
      expect(result).not.toContain('\x1B[31m');
    });
  });
});
