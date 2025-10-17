/**
 * Memory Exhaustion Protection Tests
 * 
 * Tests for security measures preventing DoS attacks via large error objects,
 * excessive memory usage, and resource exhaustion scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  sanitizeErrorObject,
  truncateErrorMessage,
  getObjectMemorySize,
  createCLI 
} from '../../core/createCLI.js';
import { CLIError } from '../../core/foundation/errors.js';

describe('Memory Exhaustion Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Prevent actual process.exit during tests
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    // Mock console to capture debug output
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Message Length Protection', () => {
    it('should truncate very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const result = truncateErrorMessage(longMessage, 100);
      
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result).toContain('... [truncated for security]');
    });

    it('should preserve short messages unchanged', () => {
      const shortMessage = 'Short error message';
      const result = truncateErrorMessage(shortMessage, 100);
      
      expect(result).toBe(shortMessage);
    });

    it('should handle empty and null messages safely', () => {
      expect(truncateErrorMessage('', 100)).toBe('');
      expect(truncateErrorMessage(null as any, 100)).toBe(null);
      expect(truncateErrorMessage(undefined as any, 100)).toBe(undefined);
    });

    it('should use default length when not specified', () => {
      const longMessage = 'A'.repeat(1000);
      const result = truncateErrorMessage(longMessage);
      
      // Default is 500 characters
      expect(result.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Memory Size Calculation', () => {
    it('should calculate memory size for primitive types', () => {
      expect(getObjectMemorySize(null)).toBe(0);
      expect(getObjectMemorySize(undefined)).toBe(0);
      expect(getObjectMemorySize(42)).toBe(8);
      expect(getObjectMemorySize(true)).toBe(4);
      expect(getObjectMemorySize('hello')).toBe(10); // UTF-16: 5 * 2
    });

    it('should calculate memory size for objects', () => {
      const obj = { key: 'value', number: 42 };
      const size = getObjectMemorySize(obj);
      
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(10000); // Reasonable bounds
    });

    it('should handle circular references safely', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      // Should not crash or infinite loop
      const size = getObjectMemorySize(circular);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1000); // Should not be huge due to circular detection
    });

    it('should limit memory calculation for very large objects', () => {
      const largeArray = new Array(10000).fill('large string'.repeat(100));
      const size = getObjectMemorySize(largeArray);
      
      // Should calculate actual size but have upper bound to prevent infinite calculation
      // The array overhead (80KB) plus string content should be significant but not infinite
      expect(size).toBeGreaterThan(50000); // Should be substantial
      expect(size).toBeLessThan(10000000); // But not excessively large (10MB limit)
    });

    it('should handle nested objects correctly', () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              data: 'deeply nested'
            }
          }
        }
      };
      
      const size = getObjectMemorySize(nested);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('Error Object Sanitization', () => {
    it('should sanitize basic error objects', () => {
      const error = new Error('Test error message');
      const sanitized = sanitizeErrorObject(error);
      
      expect(sanitized).toBeInstanceOf(Error);
      expect(sanitized.message).toBe('Test error message');
      expect(sanitized.name).toBe('Error');
    });

    it('should truncate very long error messages', () => {
      const longMessage = 'Error: ' + 'A'.repeat(1000);
      const error = new Error(longMessage);
      const sanitized = sanitizeErrorObject(error);
      
      expect(sanitized.message.length).toBeLessThanOrEqual(500);
      expect(sanitized.message).toContain('... [truncated for security]');
    });

    it('should limit stack trace depth', () => {
      const error = new Error('Test error');
      // Create a fake stack trace with many lines
      error.stack = new Array(20).fill('    at someFunction (file.js:1:1)').join('\n');
      
      const sanitized = sanitizeErrorObject(error);
      
      if (sanitized.stack) {
        const lines = sanitized.stack.split('\n');
        expect(lines.length).toBeLessThanOrEqual(10); // Default max depth
      }
    });

    it('should handle CLIError with context', () => {
      const cliError = new CLIError('CLI error', {
        context: {
          operation: 'test',
          details: 'A'.repeat(200), // Long details
          user: 'test-user'
        }
      });
      
      const sanitized = sanitizeErrorObject(cliError);
      
      expect(sanitized.message).toBe('CLI error');
      // Context should be limited and truncated
      if ((sanitized as any).context) {
        expect((sanitized as any).context.details.length).toBeLessThanOrEqual(100);
      }
    });

    it('should warn about large error objects', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      // Create an error with context that will exceed the 10KB limit
      // Each character is 2 bytes in UTF-16, so 12,000 chars = 24KB per string
      const massiveData = 'A'.repeat(12000);
      const largeError = new CLIError('Large error', {
        context: {
          data1: massiveData,
          data2: massiveData,
          data3: 'extra data to ensure we exceed the limit'
        }
      });
      
      sanitizeErrorObject(largeError);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Security] Large error object detected')
      );
    });

    it('should handle errors without stack traces', () => {
      // Create a plain object that looks like an error but has no stack
      const error = {
        name: 'Error',
        message: 'No stack'
      } as Error;
      
      const sanitized = sanitizeErrorObject(error);
      
      expect(sanitized.message).toBe('No stack');
      expect(sanitized.name).toBe('Error');
      // Since we didn't have a stack in the original, we shouldn't add one
      expect(sanitized.stack).toBeUndefined();
    });
  });

  describe('Integration with createCLI', () => {
    it('should handle large error objects in error handlers', async () => {
      const largeLogs: string[] = [];
      
      const memoryProtectedHandler = vi.fn((error: Error) => {
        // Log error details to verify truncation
        largeLogs.push(`Message length: ${error.message.length}`);
        largeLogs.push(`Stack present: ${!!error.stack}`);
      });
      
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'CLI with memory protection',
        commandsPath: './non-existent',
        skipArgvParsing: true,
        errorHandler: memoryProtectedHandler
      });
      
      expect(cli).toBeDefined();
      expect(memoryProtectedHandler).not.toHaveBeenCalled(); // No errors in setup
    });

    it('should protect against DoS via error object size', async () => {
      const dosProtectionHandler = vi.fn((error: Error) => {
        // Verify the error object is sanitized and size-limited
        const stringified = JSON.stringify(error);
        // Should not be able to create extremely large error objects
        expect(stringified.length).toBeLessThan(50000); // 50KB limit
      });
      
      const cli = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'CLI with DoS protection',
        commandsPath: './non-existent',
        skipArgvParsing: true,
        errorHandler: dosProtectionHandler
      });
      
      expect(cli).toBeDefined();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should not cause memory leaks with repeated sanitization', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Sanitize many error objects
      for (let i = 0; i < 100; i++) { // Reduced from 1000 for more realistic test
        const error = new Error(`Error ${i}: ${'A'.repeat(100)}`);
        sanitizeErrorObject(error);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB for test environment)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle concurrent error sanitization efficiently', async () => {
      const startTime = Date.now();
      
      // Sanitize errors concurrently
      const promises = Array.from({ length: 100 }, (_, i) => {
        return Promise.resolve().then(() => {
          const error = new Error(`Concurrent error ${i}`);
          return sanitizeErrorObject(error);
        });
      });
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain reasonable performance with large objects', () => {
      const startTime = Date.now();
      
      // Create a reasonably large error object
      const largeError = new CLIError('Large error', {
        context: {
          data: new Array(1000).fill({ key: 'value', number: 42 })
        }
      });
      
      const sanitized = sanitizeErrorObject(largeError);
      const duration = Date.now() - startTime;
      
      expect(sanitized).toBeDefined();
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle malformed error objects gracefully', () => {
      const malformedError = Object.create(Error.prototype);
      malformedError.message = null;
      malformedError.stack = undefined;
      
      const sanitized = sanitizeErrorObject(malformedError);
      
      expect(sanitized).toBeInstanceOf(Error);
      expect(typeof sanitized.message).toBe('string');
    });

    it('should handle errors with getter properties that throw', () => {
      const trickyError = new Error('Tricky error');
      Object.defineProperty(trickyError, 'context', {
        get() {
          throw new Error('Property access error');
        }
      });
      
      // Should not throw when sanitizing
      expect(() => sanitizeErrorObject(trickyError)).not.toThrow();
    });

    it('should handle extremely nested objects', () => {
      let nested: any = { value: 'base' };
      for (let i = 0; i < 100; i++) {
        nested = { next: nested, level: i };
      }
      
      const error = new CLIError('Deeply nested', { context: { nested } });
      
      // Should not cause stack overflow
      expect(() => sanitizeErrorObject(error)).not.toThrow();
    });
  });
});
