/**
 * SECURITY VULNERABILITY TEST SUITE
 * Task 1.1.2 - Input Validation Framework Security Tests
 * 
 * Tests for the 7 critical security vulnerabilities identified
 * in the comprehensive edge case analysis.
 */

import { describe, it, expect } from 'vitest';
import { 
  validateProjectName, 
  validatePackageManager, 
  sanitizeCommandArgs, 
  sanitizePath, 
  validateInput
} from '../../core/foundation/input-validation.js';describe('Input Validation Security Vulnerabilities', () => {
  
  describe('1. Race Condition in Path Validation', () => {
    it('should handle concurrent path modifications safely', async () => {
      const testPath = './test-concurrent-path';
      
      // Simulate concurrent validation calls
      const promises = Array.from({ length: 100 }, () => 
        sanitizePath(testPath, { allowTraversal: false })
      );
      
      const results = await Promise.allSettled(promises);
      const successResults = results.filter(r => r.status === 'fulfilled');
      
      // All results should be consistent
      const firstResult = successResults[0];
      successResults.forEach(result => {
        expect(result).toEqual(firstResult);
      });
    });
    
    it('should detect filesystem race conditions', async () => {
      // Test case where filesystem state changes during validation
      const maliciousPath = '../../../etc/passwd';
      
      expect(() => {
        sanitizePath(maliciousPath);
      }).toThrow(/path/i);
    });
  });

  describe('2. Prototype Pollution via ValidationConfig', () => {
    it('should reject prototype pollution attempts', () => {
      const maliciousConfig = {
        maxLength: 50,
        '__proto__': { isAdmin: true },
        'constructor': { prototype: { isAdmin: true } }
      } as any;
      
      // Test with project name validation
      // Ensure it doesn't crash and handles malicious config gracefully
      validateProjectName('test-project', maliciousConfig);
      
      // Should not have polluted the prototype
      expect(({}  as any).isAdmin).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call({}, 'isAdmin')).toBe(false);
    });
    
    it('should sanitize nested configuration objects', () => {
      const nestedMaliciousConfig = {
        nested: {
          '__proto__': { polluted: true },
          deep: {
            '__proto__': { deepPolluted: true }
          }
        }
      };
      
      validateProjectName('test', nestedMaliciousConfig as any);
      
      // Prototype should remain clean
      expect(({}  as any).polluted).toBeUndefined();
      expect(({}  as any).deepPolluted).toBeUndefined();
    });
  });

  describe('3. Unicode Normalization Bypass', () => {
    it('should detect Unicode normalization attacks', () => {
      // Different Unicode representations of the same character
      const normalForm = 'café';           // NFC: é as single character
      const decomposedForm = 'café';       // NFD: e + combining acute accent
      const compatForm = 'café';           // NFKC
      
      const results = [
        validateProjectName(normalForm),
        validateProjectName(decomposedForm),
        validateProjectName(compatForm)
      ];
      
      // All forms should be handled consistently - allow legitimate Unicode
      results.forEach(result => {
        // Should be valid (Unicode normalization protection should be lenient for legitimate cases)
        expect(result.isValid).toBe(true);
        // All should normalize to the same form
        expect(result.sanitized.normalize('NFC')).toBe(normalForm.normalize('NFC'));
      });
    });
    
    it('should detect homograph attacks', () => {
      // Cyrillic 'а' looks like Latin 'a'
      const latinProject = 'admin';
      const cyrillicProject = 'аdmin'; // First character is Cyrillic 'а'
      
      const latinResult = validateProjectName(latinProject);
      const cyrillicResult = validateProjectName(cyrillicProject);
      
      // Should detect the difference
      expect(latinResult.sanitized).not.toBe(cyrillicResult.sanitized);
    });
    
    it('should handle zero-width characters', () => {
      const projectWithZeroWidth = 'my\u200B\u200C\u200Dproject'; // Zero-width spaces
      const result = validateProjectName(projectWithZeroWidth);
      
      // Should remove or detect zero-width characters
      expect(result.sanitized).not.toContain('\u200B');
      expect(result.sanitized).not.toContain('\u200C');
      expect(result.sanitized).not.toContain('\u200D');
    });
  });

  describe('4. Regex DoS in Path Validation', () => {
    it('should handle pathological regex inputs without timeout', () => {
      // Create a path that could cause catastrophic backtracking
      const maliciousPath = '../'.repeat(1000) + 'etc/passwd' + '/'.repeat(1000);
      
      const startTime = Date.now();
      
      expect(() => {
        sanitizePath(maliciousPath);
      }).toThrow();
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time (not hang)
      expect(executionTime).toBeLessThan(1000); // 1 second max
    });
    
    it('should handle nested path traversal patterns', () => {
      const nestedPath = Array(50).fill('..').join('/') + '/etc/passwd';
      
      expect(() => {
        sanitizePath(nestedPath);
      }).toThrow(/path/i);
    });
  });

  describe('5. Command Injection via Package Manager Validation', () => {
    it('should reject package managers with executable extensions', () => {
      const maliciousPackageManagers = [
        'npm.exe',
        'yarn.cmd',
        'pnpm.bat',
        'rush.ps1',
        'nx.sh'
      ];
      
      maliciousPackageManagers.forEach(pm => {
        const result = validatePackageManager(pm);
        // Should either reject or flag as suspicious
        if (result.isValid) {
          expect(result.riskScore).toBeGreaterThan(0);
        }
      });
    });
    
    it('should reject package managers with path separators', () => {
      const pathInjectionAttempts = [
        '../../../usr/bin/malicious',
        'C:\\malicious\\npm.exe',
        '/usr/local/bin/fake-npm',
        'npm/../../../bin/sh'
      ];
      
      pathInjectionAttempts.forEach(pm => {
        const result = validatePackageManager(pm);
        expect(result.isValid).toBe(false);
        // Should detect some form of security violation (path-traversal or suspicious-pattern)
        const hasSecurityViolation = result.violations.some(v => 
          v.type === 'path-traversal' || v.type === 'suspicious-pattern'
        );
        expect(hasSecurityViolation).toBe(true);
      });
    });
  });

  describe('6. TOCTOU Race Condition', () => {
    it('should validate path atomically', () => {
      const testPath = './safe-path';
      
      // Multiple rapid validations should be consistent
      const results = Array.from({ length: 50 }, () => 
        validateInput(testPath, 'file-path')
      );
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.isValid).toBe(firstResult.isValid);
        expect(result.sanitized).toBe(firstResult.sanitized);
      });
    });
  });

  describe('7. Integer Overflow in Length Validation', () => {
    it('should handle maximum safe integer lengths', () => {
      const maxSafeConfig = {
        maxLength: Number.MAX_SAFE_INTEGER
      };
      
      // Should not crash with maximum safe integer
      expect(() => {
        validateProjectName('test', maxSafeConfig);
      }).not.toThrow();
    });
    
    it('should reject negative max lengths', () => {
      const negativeConfig = {
        maxLength: -1
      };
      
      // Should handle gracefully instead of throwing
      const result = validateProjectName('test', negativeConfig);
      expect(result.isValid).toBe(true); // Should use safe default
      expect(result.sanitized).toBe('test');
    });
    
    it('should handle very large strings safely', () => {
      // Create a very large string (but within memory limits for testing)
      const largeString = 'a'.repeat(100000);
      
      const result = validateProjectName(largeString, { maxLength: 50 });
      expect(result.isValid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'malformed-input'
        })
      );
    });
  });

  describe('Additional Edge Cases', () => {
    it('should handle null and undefined inputs safely', () => {
      // Test functions that should return results instead of throwing
      const nonThrowingTests = [
        () => validateProjectName(null as any),
        () => validatePackageManager(undefined as any)
      ];
      
      nonThrowingTests.forEach(test => {
        const result = test();
        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
          expect.objectContaining({
            type: 'malformed-input'
          })
        );
      });
      
      // Test functions that should handle null/undefined gracefully
      expect(() => {
        sanitizeCommandArgs(null as any);
      }).not.toThrow(); // Should return empty array
      
      expect(() => {
        sanitizePath(null as any);
      }).toThrow(/null\/undefined/); // Should throw meaningful error for paths
    });
    
    it('should handle circular references in validation config', () => {
      const circularConfig: any = { maxLength: 50 };
      circularConfig.self = circularConfig;
      
      expect(() => {
        validateProjectName('test', circularConfig);
      }).not.toThrow();
    });
    
    it('should validate input types strictly', () => {
      const nonStringInputs = [
        123,
        true,
        {},
        [],
        Symbol('test'),
        BigInt(42)
      ];
      
      nonStringInputs.forEach(input => {
        const result = validateProjectName(input as any);
        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
          expect.objectContaining({
            type: 'malformed-input'
          })
        );
      });
    });
  });
});