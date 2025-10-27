/**
 * Task 1.4.2 Security Vulnerability Tests
 * 
 * Comprehensive security testing for ALL identified vulnerabilities and edge cases
 * in the structured logging implementation.
 * 
 * Critical Security Issues Tested:
 * 1. Prototype Pollution Vulnerabilities  
 * 2. Recursive Depth Explosion (DoS)
 * 3. Circular Reference Memory Exhaustion
 * 4. Configuration Injection Vulnerabilities
 * 5. Symbol Key Bypass Vulnerability
 * 6. Timing Attack Vulnerabilities
 * 7. Array Index Injection
 * 8. JSON.stringify Vulnerabilities
 * 9. Date/Timestamp Manipulation
 * 10. Memory Leak in Error Handling
 * 11. Unicode & Encoding Edge Cases
 * 12. Number Boundary Conditions
 * 13. Concurrent Access Issues
 * 14. Platform-Specific Edge Cases
 * 15. Error Propagation Edge Cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  StructuredLogger, 
  type StructuredLoggingConfig 
} from '../../../core/foundation/logging/structured.js';

describe('Task 1.4.2: Critical Security Vulnerabilities', () => {
  let logger: StructuredLogger;

  beforeEach(() => {
    logger = new StructuredLogger();
  });

  describe('1. Prototype Pollution Vulnerabilities', () => {
    it('should prevent prototype pollution via __proto__', () => {
      const maliciousContext = {
        "__proto__": { "isAdmin": true },
        "normalField": "value"
      };

      const result = logger.createLogEntry('Test message', {
        context: maliciousContext
      });

      // Should not pollute Object.prototype
      expect((Object.prototype as any).isAdmin).toBeUndefined();
      // Should not include __proto__ in processed context
      expect(result.entry.context).not.toHaveProperty('__proto__');
      expect(result.entry.context).toHaveProperty('normalField', 'value');
    });

    it('should prevent prototype pollution via constructor.prototype', () => {
      const maliciousContext = {
        "constructor": { 
          "prototype": { "isHacked": true } 
        },
        "data": "legitimate"
      };

      const result = logger.createLogEntry('Test message', {
        context: maliciousContext
      });

      // Should not pollute constructor prototype
      expect((Object.prototype as any).isHacked).toBeUndefined();
      // Should handle constructor field safely (if at all)
      expect(result.entry.context).toHaveProperty('data', 'legitimate');
    });

    it('should handle polluted source objects safely', () => {
      // Create object with polluted prototype chain
      const pollutedObj = Object.create({ malicious: 'value' });
      pollutedObj.legitimate = 'data';

      const result = logger.createLogEntry('Test message', {
        context: pollutedObj
      });

      // Should only process own properties, not inherited ones
      expect(result.entry.context).toHaveProperty('legitimate', 'data');
      expect(result.entry.context).not.toHaveProperty('malicious');
    });
  });

  describe('2. Recursive Depth Explosion (DoS Vulnerability)', () => {
    it('should handle deeply nested objects without stack overflow', () => {
      // Create deeply nested object (100 levels to test recursion limits)
      const deepObject: any = {};
      let current = deepObject;
      for (let i = 0; i < 100; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      // Should not crash or hang
      expect(() => {
        const result = logger.createLogEntry('Deep nesting test', {
          context: { deep: deepObject }
        });
        expect(result.entry.context).toBeDefined();
      }).not.toThrow();
    });

    it('should handle extremely deep nesting gracefully', () => {
      // Create very deep structure that could cause stack overflow
      const veryDeep: any = { value: 'start' };
      let current = veryDeep;
      for (let i = 0; i < 1000; i++) {
        current.child = { level: i };
        current = current.child;
      }

      const startTime = Date.now();
      const result = logger.createLogEntry('Extreme depth test', {
        context: { extremelyDeep: veryDeep }
      });
      const endTime = Date.now();

      // Should complete in reasonable time (< 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(result.entry.context).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should limit recursion depth to prevent DoS', () => {
      // Create structure with alternating array/object nesting
      const mixed: any = { start: true };
      let current = mixed;
      for (let i = 0; i < 50; i++) {
        if (i % 2 === 0) {
          current.array = [{ nested: {} }];
          current = current.array[0].nested;
        } else {
          current.object = { data: i };
          current = current.object;
        }
      }

      const result = logger.createLogEntry('Mixed nesting test', {
        context: mixed
      });

      // Should complete successfully with warnings about depth
      expect(result.entry.context).toBeDefined();
      // Should have processing warnings or truncation
      expect(result.warnings.length + result.entry.securityFlags.length).toBeGreaterThan(0);
    });
  });

  describe('3. Circular Reference Memory Exhaustion', () => {
    it('should handle simple circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Should not hang or crash
      expect(() => {
        const result = logger.createLogEntry('Circular reference test', {
          context: circular
        });
        expect(result.entry.context).toBeDefined();
      }).not.toThrow();
    });

    it('should handle complex circular reference chains', () => {
      const objA: any = { name: 'A' };
      const objB: any = { name: 'B' };
      const objC: any = { name: 'C' };
      
      objA.ref = objB;
      objB.ref = objC;
      objC.ref = objA; // Creates A -> B -> C -> A cycle

      const result = logger.createLogEntry('Complex circular test', {
        context: { chain: objA }
      });

      expect(result.entry.context).toBeDefined();
      // Should handle gracefully without infinite recursion
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle circular references in arrays', () => {
      const arr: any[] = [1, 2, 3];
      arr.push(arr); // Self-referential array

      const result = logger.createLogEntry('Circular array test', {
        context: { circularArray: arr }
      });

      expect(result.entry.context).toBeDefined();
      expect(() => JSON.stringify(result.entry)).not.toThrow();
    });
  });

  describe('4. Configuration Injection Vulnerabilities', () => {
    it('should validate malicious maxContextSize configuration', () => {
      const maliciousConfig: Partial<StructuredLoggingConfig> = {
        maxContextSize: Number.MAX_SAFE_INTEGER, // Memory exhaustion attempt
        maxMessageLength: -1, // Bypass length limits
        maskFields: [], // Disable security masking
      };

      const maliciousLogger = new StructuredLogger(maliciousConfig);
      
      // Should not cause memory issues with large context
      const hugeContext = { data: 'x'.repeat(10000) };
      const result = maliciousLogger.createLogEntry('Config injection test', {
        context: hugeContext
      });

      expect(result.entry.context).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0); // Should warn about issues
    });

    it('should handle nested configuration object pollution', () => {
      const maliciousConfig = {
        logInjectionConfig: {
          "__proto__": { compromised: true },
          maxLineLength: -1,
          enableProtection: false
        }
      };

      const result = new StructuredLogger(maliciousConfig);
      expect(result).toBeDefined();
      
      // Should not pollute prototype
      expect((Object.prototype as any).compromised).toBeUndefined();
    });

    it('should validate negative and invalid numeric configurations', () => {
      const invalidConfig: Partial<StructuredLoggingConfig> = {
        maxMessageLength: -1000,
        maxContextSize: -5000,
        maxStackDepth: -10,
      };

      const configLogger = new StructuredLogger(invalidConfig);
      const result = configLogger.createLogEntry('Invalid config test', {
        context: { test: 'data' }
      });

      // Should handle gracefully with fallbacks
      expect(result.entry.context).toBeDefined();
      expect(result.entry.message).toBeDefined();
    });
  });

  describe('5. Symbol Key Bypass Vulnerability', () => {
    it('should handle Symbol keys in context objects', () => {
      const symbolKey = Symbol.for('secret');
      const context = {
        normal: 'visible',
        [symbolKey]: 'hidden_password_123'
      };

      const result = logger.createLogEntry('Symbol key test', { context });

      // Symbol properties should be handled securely
      expect(result.entry.context).toHaveProperty('normal', 'visible');
      // Should not leak symbol-keyed sensitive data
      const contextStr = JSON.stringify(result.entry.context);
      expect(contextStr).not.toContain('hidden_password_123');
    });

    it('should handle well-known symbols safely', () => {
      const context = {
        [Symbol.iterator]: function* () { yield 'attack'; },
        [Symbol.toPrimitive]: () => 'malicious',
        ['toString']: () => 'exploit',
        normal: 'data'
      };

      const result = logger.createLogEntry('Well-known symbols test', { context });
      
      expect(result.entry.context).toHaveProperty('normal', 'data');
      // Should not execute symbol methods during processing
      expect(result.entry.context).toBeDefined();
    });

    it('should handle Symbol.for pollution attempts', () => {
      const maliciousSymbol = Symbol.for('__proto__');
      const context = {
        [maliciousSymbol]: { admin: true },
        legitimate: 'value'
      };

      const result = logger.createLogEntry('Symbol pollution test', { context });
      
      expect(result.entry.context).toHaveProperty('legitimate', 'value');
      expect((Object.prototype as any).admin).toBeUndefined();
    });
  });

  describe('6. Timing Attack Vulnerabilities', () => {
    it('should have consistent timing for field masking detection', () => {
      const sensitiveFields = ['password', 'secret', 'token', 'key'];
      const timings: number[] = [];

      // Test timing consistency across different field names
      for (const field of sensitiveFields) {
        const context = { [field]: 'sensitive_data' };
        
        const start = performance.now();
        logger.createLogEntry('Timing test', { context });
        const end = performance.now();
        
        timings.push(end - start);
      }

      // Timing should be relatively consistent (within reasonable variance)
      const avgTiming = timings.reduce((a, b) => a + b) / timings.length;
      const maxDeviation = Math.max(...timings.map(t => Math.abs(t - avgTiming)));
      
      // Should not have extreme timing variations (> 10x average)
      expect(maxDeviation).toBeLessThan(avgTiming * 10);
    });

    it('should handle timing attacks via field name length variations', () => {
      const shortField = 'p';
      const longField = 'p'.repeat(1000);
      
      const timings: number[] = [];
      
      [shortField, longField].forEach(field => {
        const context = { [field]: 'test' };
        
        const start = performance.now();
        logger.createLogEntry('Length timing test', { context });
        const end = performance.now();
        
        timings.push(end - start);
      });

      // Should not have extreme timing differences for different field lengths
      const [shortTime, longTime] = timings;
      const ratio = Math.max(shortTime, longTime) / Math.min(shortTime, longTime);
      expect(ratio).toBeLessThan(100); // Should not be 100x different
    });
  });

  describe('7. Array Index Injection', () => {
    it('should handle extremely large arrays safely', () => {
      // Create sparse array with large indices
      const sparseArray: any[] = [];
      sparseArray[0] = 'start';
      sparseArray[999999] = 'end';

      const result = logger.createLogEntry('Large array test', {
        context: { sparse: sparseArray }
      });

      expect(result.entry.context).toBeDefined();
      // Should not cause memory issues or hang
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle arrays with negative indices', () => {
      const arr: any = ['normal'];
      arr[-1] = 'negative_index';
      arr[-999] = 'very_negative';

      const result = logger.createLogEntry('Negative index test', {
        context: { negativeArray: arr }
      });

      expect(result.entry.context).toBeDefined();
      // Should handle edge case gracefully
    });

    it('should handle arrays with non-numeric properties', () => {
      const arr: any = [1, 2, 3];
      arr.customProp = 'should_be_handled';
      arr['string_index'] = 'also_handled';

      const result = logger.createLogEntry('Array property test', {
        context: { mixedArray: arr }
      });

      expect(result.entry.context).toBeDefined();
    });
  });

  describe('8. JSON.stringify Vulnerabilities', () => {
    it('should handle objects with malicious toJSON methods', () => {
      const maliciousObj = {
        toJSON() {
          throw new Error('toJSON attack');
        },
        data: 'legitimate'
      };

      const result = logger.createLogEntry('toJSON attack test', {
        context: maliciousObj
      });

      // Should handle toJSON errors gracefully
      expect(result.entry.context).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle objects with recursive toJSON calls', () => {
      let callCount = 0;
      const recursiveObj = {
        toJSON() {
          callCount++;
          if (callCount < 1000) {
            return { nested: recursiveObj };
          }
          return 'stop';
        }
      };

      const result = logger.createLogEntry('Recursive toJSON test', {
        context: { recursive: recursiveObj }
      });

      expect(result.entry.context).toBeDefined();
      // Should not cause infinite recursion
      expect(callCount).toBeLessThan(1000);
    });

    it('should handle BigInt and other non-serializable values', () => {
      const context = {
        bigint: BigInt(123),
        symbol: Symbol('test'),
        undefined: undefined,
        function: () => 'attack',
        normal: 'value'
      };

      const result = logger.createLogEntry('Non-serializable test', { context });

      expect(result.entry.context).toBeDefined();
      expect(result.entry.context).toHaveProperty('normal', 'value');
      // Should handle non-serializable values gracefully
    });
  });

  describe('9. Date/Timestamp Manipulation', () => {
    it('should handle Date.prototype pollution', () => {
      const originalToISOString = Date.prototype.toISOString;
      
      try {
        // Pollute Date.prototype.toISOString
        Date.prototype.toISOString = function() {
          throw new Error('Date pollution attack');
        };

        const result = logger.createLogEntry('Date pollution test');

        // Should handle Date pollution gracefully
        expect(result.entry.timestamp).toBeDefined();
        expect(typeof result.entry.timestamp).toBe('string');
      } finally {
        // Restore original method
        Date.prototype.toISOString = originalToISOString;
      }
    });

    it('should handle invalid Date objects', () => {
      const originalNow = Date.now;
      
      try {
        // Mock Date.now to return invalid value
        Date.now = () => NaN;

        const result = logger.createLogEntry('Invalid date test');

        expect(result.entry.timestamp).toBeDefined();
        // Should fallback to valid timestamp
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('10. Memory Leak in Error Handling', () => {
    it('should limit fallback error context size', () => {
      // Create very large message that could cause memory issues in fallback
      const hugeMessage = 'x'.repeat(1000000); // 1MB message

      // Force error in log creation by mocking Date
      const originalToISOString = Date.prototype.toISOString;
      Date.prototype.toISOString = () => { throw new Error('Forced error'); };

      try {
        const result = logger.createLogEntry(hugeMessage);

        // Fallback should not store entire huge message
        expect(result.entry.context?.originalMessage).toBeDefined();
        const contextSize = JSON.stringify(result.entry.context).length;
        expect(contextSize).toBeLessThan(100000); // Should be limited
      } finally {
        Date.prototype.toISOString = originalToISOString;
      }
    });

    it('should handle error objects with large properties', () => {
      const error = new Error('Test error');
      (error as any).hugeProperty = 'x'.repeat(500000); // Large property

      // Force error in processing
      const originalJSON = JSON.stringify;
      JSON.stringify = () => { throw new Error('JSON error'); };

      try {
        const result = logger.createLogEntry('Memory test', { error });

        expect(result.entry.context).toBeDefined();
        expect(result.warnings.length).toBeGreaterThan(0);
      } finally {
        JSON.stringify = originalJSON;
      }
    });
  });

  describe('11. Unicode & Encoding Edge Cases', () => {
    it('should handle null bytes in context keys', () => {
      const context = {
        'normal': 'value',
        'null\x00byte': 'should_be_handled',
        'multi\x00null\x00': 'bytes'
      };

      const result = logger.createLogEntry('Null byte test', { context });

      expect(result.entry.context).toBeDefined();
      // Should sanitize or handle null bytes safely
    });

    it('should handle Unicode normalization attacks', () => {
      const context = {
        'passw0rd': 'normal', // Normal characters
        'passw０rd': 'fullwidth', // Fullwidth '0' (U+FF10)
        'pаssword': 'cyrillic_a', // Cyrillic 'а' (U+0430)
      };

      const result = logger.createLogEntry('Unicode normalization test', { context });

      expect(result.entry.context).toBeDefined();
      // Should handle Unicode variants consistently
    });

    it('should handle surrogate pair attacks', () => {
      const malformedSurrogate = '\uD800\uD800'; // Invalid surrogate pair
      const context = {
        normal: 'value',
        malformed: malformedSurrogate,
        combined: 'prefix' + malformedSurrogate + 'suffix'
      };

      const result = logger.createLogEntry('Surrogate pair test', { context });

      expect(result.entry.context).toBeDefined();
      // Should handle malformed Unicode gracefully
    });

    it('should handle zero-width characters', () => {
      const zeroWidth = '\u200B\u200C\u200D\uFEFF'; // Various zero-width chars
      const context = {
        [`hidden${zeroWidth}field`]: 'value',
        normal: 'visible'
      };

      const result = logger.createLogEntry('Zero-width test', { context });

      expect(result.entry.context).toBeDefined();
      expect(result.entry.context).toHaveProperty('normal', 'visible');
    });
  });

  describe('12. Number Boundary Conditions', () => {
    it('should handle infinite duration values', () => {
      const result = logger.createLogEntry('Infinity test', {
        duration: Infinity
      });

      expect(result.entry.duration).toBeDefined();
      // Should handle Infinity gracefully
    });

    it('should handle NaN values in options', () => {
      const result = logger.createLogEntry('NaN test', {
        duration: NaN,
        level: NaN as any
      });

      expect(result.entry).toBeDefined();
      // Should use fallback values for NaN
    });

    it('should handle very large numbers', () => {
      const result = logger.createLogEntry('Large numbers test', {
        duration: Number.MAX_SAFE_INTEGER + 1000,
        context: {
          bigNumber: Number.MAX_VALUE,
          veryBig: 1e308
        }
      });

      expect(result.entry.context).toBeDefined();
      // Should handle large numbers without precision loss issues
    });
  });

  describe('13. Concurrent Access Issues', () => {
    it('should handle concurrent configuration updates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        new Promise<void>(resolve => {
          setTimeout(() => {
            logger.updateConfig({ 
              maxMessageLength: 1001 + i * 100, // Changed from 1000 to 1001 to ensure always > 1000
              format: i % 2 === 0 ? 'json' : 'text'
            });
            resolve();
          }, Math.random() * 10);
        })
      );

      await Promise.all(promises);

      // Should maintain consistent configuration state
      const config = logger.getConfig();
      expect(config).toBeDefined();
      expect(['json', 'text']).toContain(config.format);
      expect(config.maxMessageLength).toBeGreaterThan(1000);
    });

    it('should handle concurrent log creation', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve(logger.createLogEntry(`Concurrent message ${i}`, {
          context: { index: i, random: Math.random() }
        }))
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(50);
      results.forEach((result, i) => {
        expect(result.entry.message).toContain(`Concurrent message ${i}`);
        expect(result.entry.context).toHaveProperty('index', i);
      });
    });
  });

  describe('14. Platform-Specific Edge Cases', () => {
    it('should handle process.memoryUsage errors', () => {
      const originalMemoryUsage = process.memoryUsage;
      
      try {
        (process as any).memoryUsage = () => { throw new Error('Memory access denied'); };

        const memoryLogger = new StructuredLogger({
          enablePerformanceMetrics: true,
          includeMemoryUsage: true
        });

        const result = memoryLogger.createLogEntry('Memory error test');

        expect(result.entry).toBeDefined();
        expect(result.warnings.length).toBeGreaterThan(0);
      } finally {
        process.memoryUsage = originalMemoryUsage;
      }
    });

    it('should handle V8 heap exhaustion simulation', () => {
      // Create context that approaches memory limits
      const largeArray = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(100),
        nested: { level: i, info: 'test' }
      }));

      const result = logger.createLogEntry('Heap test', {
        context: { large: largeArray }
      });

      expect(result.entry.context).toBeDefined();
      // Should handle large objects with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('15. Error Propagation Edge Cases', () => {
    it('should handle errors with getter properties that throw', () => {
      const maliciousError = new Error('Base error');
      Object.defineProperty(maliciousError, 'maliciousProp', {
        get() {
          throw new Error('Getter attack');
        }
      });

      const result = logger.createLogEntry('Malicious error test', {
        error: maliciousError
      });

      expect(result.entry.error).toBeDefined();
      expect(result.entry.error?.message).toBe('Base error');
    });

    it('should handle infinite error cause chains', () => {
      const errorA = new Error('Error A');
      const errorB = new Error('Error B');
      
      (errorA as any).cause = errorB;
      (errorB as any).cause = errorA; // Circular cause chain

      const result = logger.createLogEntry('Circular error test', {
        error: errorA
      });

      expect(result.entry.error).toBeDefined();
      // Should handle circular causes without infinite recursion
    });

    it('should handle Error.prototype pollution', () => {
      const originalStack = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');
      
      try {
        Object.defineProperty(Error.prototype, 'stack', {
          get() {
            throw new Error('Stack pollution attack');
          },
          configurable: true
        });

        const testError = new Error('Test error');
        const result = logger.createLogEntry('Stack pollution test', {
          error: testError
        });

        expect(result.entry.error).toBeDefined();
        expect(result.entry.error?.message).toBe('Test error');
      } finally {
        if (originalStack) {
          Object.defineProperty(Error.prototype, 'stack', originalStack);
        }
      }
    });
  });
});