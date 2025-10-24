/**
 * Stack Trace Security Validation Tests
 * 
 * Comprehensive tests for security edge cases and attack prevention
 * in the enhanced stack trace security system (Task 1.3.2).
 */

import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeStackTrace,
  analyzeStackTraceSecurity
} from '../../../core/foundation/errors/sanitization.js';describe('Stack Trace Security Validation', () => {
  
  describe('ReDoS Attack Prevention', () => {
    it('should handle pathological regex patterns without timeout', () => {
      // Create a string designed to cause exponential backtracking
      const maliciousStack = `Error: Test
    at function (${'a'.repeat(1000)}/${'b'.repeat(1000)}/node_modules/test.js:10:5)
    at main (/${'x'.repeat(500)}/${'y'.repeat(500)}/${'z'.repeat(500)}/app.js:20:10)`;
      
      const startTime = Date.now();
      const result = sanitizeStackTrace(maliciousStack, { 
        redactFilePaths: true,
        stackTraceLevel: 'sanitized'
      });
      const endTime = Date.now();
      
      // Should complete within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result).toContain('node_modules');
      expect(result).not.toContain('a'.repeat(100)); // Should be sanitized
    });
    
    it('should prevent ReDoS in security analysis function', () => {
      const maliciousStack = `Error: Test
    at /Users/${'a'.repeat(1000)}/${'b'.repeat(1000)}/project/file.js:10:5
    at /home/${'x'.repeat(500)}/${'y'.repeat(500)}/app.js:20:10`;
      
      const startTime = Date.now();
      const analysis = analyzeStackTraceSecurity(maliciousStack);
      const endTime = Date.now();
      
      // Should complete quickly and still detect patterns
      expect(endTime - startTime).toBeLessThan(50);
      expect(analysis.riskLevel).toBe('high');
      expect(analysis.risks).toContain('User home directory paths exposed');
    });
    
    it('should handle nested regex patterns safely', () => {
      const nestedPattern = `Error: Test
    at (((((${'/'.repeat(100)}node_modules${')'.repeat(100)}))))):10:5
    at C:\\${'\\'.repeat(50)}workspace\\app.js:20:10`;
      
      const startTime = Date.now();
      const result = sanitizeStackTrace(nestedPattern, { redactFilePaths: true });
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100);
      expect(result).toBeDefined();
    });
  });
  
  describe('DoS Attack Prevention', () => {
    it('should truncate extremely large stack traces', () => {
      // Create a 100KB stack trace
      const largeStack = 'Error: Large stack\n' + 
        'at function '.repeat(10000) + 
        '/very/long/path/that/repeats.js:10:5\n'.repeat(1000);
      
      expect(largeStack.length).toBeGreaterThan(50000);
      
      const result = sanitizeStackTrace(largeStack);
      
      // Should be truncated to safe size
      expect(result.length).toBeLessThanOrEqual(50100); // 50KB + some buffer
      expect(result).toContain('[Stack trace truncated for security]');
    });
    
    it('should limit security analysis input size', () => {
      const massiveStack = 'Error: Massive\n' + 
        ('    at /Users/admin/project/file.js:10:5\n'.repeat(1000));
      
      const analysis = analyzeStackTraceSecurity(massiveStack);
      
      // Should still work but with limited processing
      expect(analysis.riskLevel).toBe('high');
      expect(analysis.sensitivePatterns.length).toBeGreaterThan(0);
    });
    
    it('should handle memory exhaustion attempts via line count', () => {
      const manyLines = 'Error: Many lines\n' + 
        Array.from({ length: 10000 }, (_, i) => 
          `    at func${i} (/path/file${i}.js:${i}:${i})`
        ).join('\n');
      
      const startTime = Date.now();
      const analysis = analyzeStackTraceSecurity(manyLines);
      const endTime = Date.now();
      
      // Should limit processing to prevent excessive resource usage
      expect(endTime - startTime).toBeLessThan(200);
      expect(analysis).toBeDefined();
    });
  });
  
  describe('Configuration Validation', () => {
    it('should validate and fix invalid maxStackDepth', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result1 = sanitizeStackTrace('Error: Test\n    at func():10', { 
        maxStackDepth: -5 
      });
      const result2 = sanitizeStackTrace('Error: Test\n    at func():10', { 
        maxStackDepth: 9999 
      });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid maxStackDepth, using default: 20');
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      
      consoleWarnSpy.mockRestore();
    });
    
    it('should validate and fix invalid maxMessageLength', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      sanitizeStackTrace('Error: Test', { maxMessageLength: 5 });
      sanitizeStackTrace('Error: Test', { maxMessageLength: 200000 });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid maxMessageLength, using default: 500');
      
      consoleWarnSpy.mockRestore();
    });
    
    it('should handle malformed configuration objects', () => {
      const malformedConfig = {
        stackTraceLevel: 'invalid' as any,
        maxStackDepth: 'not-a-number' as any,
        redactFilePaths: 'maybe' as any
      };
      
      const result = sanitizeStackTrace('Error: Test\n    at func():10', malformedConfig);
      
      // Should use defaults and not crash
      expect(result).toBeDefined();
      expect(result).toContain('Error: Test');
    });
  });
  
  describe('Memory Protection', () => {
    it('should handle chunked processing for large stacks', () => {
      // Create a stack just over the chunk threshold (10KB)
      const largeStack = 'Error: Large\n' + 
        '    at /Users/test/project/file.js:10:5\n'.repeat(500);
      
      expect(largeStack.length).toBeGreaterThan(10000);
      
      const result = sanitizeStackTrace(largeStack, { 
        redactFilePaths: true,
        stackTraceLevel: 'sanitized'
      });
      
      // Should process successfully and sanitize paths
      expect(result).toBeDefined();
      expect(result).not.toContain('/Users/test');
      expect(result).toContain('/Users/***');
    });
    
    it('should prevent memory exhaustion via recursive patterns', () => {
      const recursiveStack = 'Error: Recursive\n' + 
        Array.from({ length: 100 }, (_, i) => {
          const depth = 'nested/'.repeat(i);
          return `    at func${i} (/${depth}file.js:${i}:${i})`;
        }).join('\n');
      
      const startTime = Date.now();
      const result = sanitizeStackTrace(recursiveStack, { redactFilePaths: true });
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(500);
      expect(result).toBeDefined();
    });
  });
  
  describe('Input Sanitization Edge Cases', () => {
    it('should handle null bytes and control characters', () => {
      const maliciousStack = `Error: Evil\x00\x01\x02
    at /Users/admin\x00/project\x01/file.js:10:5
    at evil\x1f\x7f():20`;
      
      const result = sanitizeStackTrace(maliciousStack, { redactFilePaths: true });
      
      expect(result).toBeDefined();
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x01');
    });
    
    it('should handle Unicode normalization attacks', () => {
      // Unicode normalization attack using different representations
      const unicodeStack = `Error: Unicode
    at /Users/\u006E\u0303/project/file.js:10:5
    at /Users/\u00F1/project/file.js:20:10`;
      
      const result = sanitizeStackTrace(unicodeStack, { redactFilePaths: true });
      
      expect(result).toBeDefined();
      expect(result).not.toContain('\u006E\u0303');
    });
    
    it('should handle extremely long individual lines', () => {
      const longLine = 'Error: Long line\n' +
        `    at func (/${'a'.repeat(10000)}/file.js:10:5)`;
      
      const analysis = analyzeStackTraceSecurity(longLine);
      
      // Should limit individual line processing
      expect(analysis).toBeDefined();
      expect(analysis.sensitivePatterns.some(p => 
        p.line.includes('...') || p.line.length <= 500
      )).toBe(true);
    });
  });
  
  describe('Cross-Platform Security Edge Cases', () => {
    it('should handle mixed path separator injection attacks', () => {
      const mixedPaths = `Error: Mixed paths
    at func (C:/Users\\\\admin/..\\\\..\\\\..\\\\etc/passwd:10:5)
    at main (/usr/local\\\\..\\\\..\\\\..\\\\root/.ssh/id_rsa:20:10)`;
      
      const result = sanitizeStackTrace(mixedPaths, { redactFilePaths: true });
      
      expect(result).not.toContain('etc/passwd');
      expect(result).not.toContain('root/.ssh');
      expect(result).not.toContain('admin');
    });
    
    it('should prevent Windows UNC path exploitation', () => {
      const uncAttack = `Error: UNC attack
    at func (\\\\\\\\server\\\\share\\\\admin\\\\secrets.txt:10:5)
    at main (\\\\\\\\?\\\\C:\\\\Windows\\\\System32\\\\config:20:10)`;
      
      const result = sanitizeStackTrace(uncAttack, { redactFilePaths: true });
      
      expect(result).not.toContain('server\\share');
      expect(result).not.toContain('System32\\config');
      expect(result).not.toContain('secrets.txt');
    });
    
    it('should handle device path attacks on Windows', () => {
      const devicePaths = `Error: Device paths
    at func (\\\\\\\\.\\\\PhysicalDrive0:10:5)
    at main (\\\\\\\\.\\\\GLOBALROOT\\\\Device:20:10)`;
      
      const result = sanitizeStackTrace(devicePaths, { redactFilePaths: true });
      
      expect(result).not.toContain('PhysicalDrive0');
      expect(result).not.toContain('GLOBALROOT');
    });
  });
  
  describe('Performance Under Attack Conditions', () => {
    it('should maintain reasonable performance with multiple attack vectors', () => {
      const complexAttack = Array.from({ length: 100 }, (_, i) => {
        const pathTraversal = '../'.repeat(i % 10);
        const longName = 'a'.repeat((i % 50) + 10);
        return `    at ${longName} (${pathTraversal}${longName}/${longName}.js:${i}:${i})`;
      }).join('\n');
      
      const fullAttack = `Error: Complex attack\n${complexAttack}`;
      
      const startTime = Date.now();
      const result = sanitizeStackTrace(fullAttack, { 
        redactFilePaths: true,
        stackTraceLevel: 'sanitized'
      });
      const endTime = Date.now();
      
      // Should complete within reasonable time despite complexity
      expect(endTime - startTime).toBeLessThan(300);
      expect(result).toBeDefined();
      expect(result.length).toBeLessThan(fullAttack.length * 2); // Shouldn't grow excessively
    });
    
    it('should handle concurrent processing safely', async () => {
      const maliciousStack = `Error: Concurrent attack
    at /Users/${'a'.repeat(100)}/project/file.js:10:5
    at /home/${'b'.repeat(100)}/app/main.js:20:10`;
      
      // Process multiple attacks concurrently
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(sanitizeStackTrace(maliciousStack, { 
          redactFilePaths: true,
          stackTraceLevel: 'sanitized'
        }))
      );
      
      const results = await Promise.all(promises);
      
      // All should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).not.toContain('a'.repeat(50));
        expect(result).toContain('/Users/***');
      });
    });
  });
});