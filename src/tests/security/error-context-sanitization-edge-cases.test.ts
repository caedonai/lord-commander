/**
 * Additional Edge Case Tests for Error Context Sanitization (Task 1.3.3)
 * 
 * This test file covers advanced edge cases and security scenarios that extend
 * the core test suite with more comprehensive validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeErrorContext,
  createSafeErrorForForwarding
} from '../../core/foundation/error-sanitization.js';

describe('Error Context Sanitization - Advanced Edge Cases', () => {
  let testError: Error;

  beforeEach(() => {
    testError = new Error('Test error message');
    testError.name = 'TestError';
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle extremely large string values without memory exhaustion', () => {
      // Use a string that won't trigger API key detection (mixed content with spaces and symbols)
      const largeString = 'Large test data with spaces and symbols!@#$%^&*()_+ '.repeat(200000); // ~10MB
      const context = {
        operation: 'test',
        largeData: largeString,
        normal: 'value'
      };

      const startTime = Date.now();
      const result = sanitizeErrorContext(testError, context, {
        redactionLevel: 'partial',
        maxContextLength: 1000 // Force truncation
      });
      const endTime = Date.now();

      expect(result.errorId).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
      // Check that security warnings contain a message about size limits
      const hasSizeLimitsWarning = result.securityWarnings.some(warning => 
        /size limits/i.test(warning)
      );
      expect(hasSizeLimitsWarning).toBe(true);
      expect(result.context.normal).toBe('value'); // Non-large values preserved
    });

    it('should handle objects with many properties without performance degradation', () => {
      const manyPropsContext: Record<string, unknown> = {};
      for (let i = 0; i < 10000; i++) {
        manyPropsContext[`prop${i}`] = `value${i}`;
        if (i % 100 === 0) {
          manyPropsContext[`email${i}`] = `user${i}@example.com`; // Scattered sensitive data
        }
      }

      const startTime = Date.now();
      const result = sanitizeErrorContext(testError, manyPropsContext, {
        redactionLevel: 'partial'
      });
      const endTime = Date.now();

      expect(result.errorId).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should handle within 5 seconds
      expect(result.hadSensitiveData).toBe(true);
    });

    it('should handle recursive object structures safely', () => {
      const recursiveObj: any = {
        level: 0,
        data: 'test data'
      };
      
      // Create a complex recursive structure
      let current = recursiveObj;
      for (let i = 1; i < 100; i++) {
        current.child = {
          level: i,
          data: `data-${i}`,
          parent: current // Back reference
        };
        current = current.child;
      }
      
      // Add sensitive data at various levels
      recursiveObj.apiKey = 'sk-123456789';
      recursiveObj.child.email = 'user@example.com';

      expect(() => {
        const result = sanitizeErrorContext(testError, { recursive: recursiveObj }, {
          redactionLevel: 'partial',
          sanitizeNestedObjects: true
        });
        expect(result.errorId).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Data Type Edge Cases', () => {
    it('should handle all JavaScript primitive types', () => {
      const primitiveContext = {
        string: 'test string',
        number: 42,
        bigint: BigInt(9007199254740991),
        boolean: true,
        undefined: undefined,
        null: null,
        symbol: Symbol('test').toString(), // Converted to string
        function: (() => {}).toString(), // Function source
      };

      const result = sanitizeErrorContext(testError, primitiveContext);
      
      expect(result.errorId).toBeDefined();
      expect(result.context.string).toBe('test string');
      expect(result.context.number).toBe(42);
      expect(result.context.boolean).toBe(true);
      expect(result.context.null).toBe(null);
    });

    it('should handle Date objects and timestamps', () => {
      const dateContext = {
        date: new Date('2024-10-18T10:00:00Z'),
        timestamp: Date.now(),
        isoString: new Date().toISOString(),
        invalidDate: new Date('invalid'),
        timestampString: '2024-10-18T10:00:00Z'
      };

      const result = sanitizeErrorContext(testError, dateContext);
      
      expect(result.errorId).toBeDefined();
      expect(result.context).toBeDefined();
      // Should handle without throwing errors
    });

    it('should handle RegExp objects safely', () => {
      const regexContext = {
        pattern: /test.*pattern/gi,
        sensitivePattern: /password=([^&]+)/gi, // Potentially sensitive regex
        normalData: 'regular text'
      };

      const result = sanitizeErrorContext(testError, regexContext);
      
      expect(result.errorId).toBeDefined();
      expect(result.context.normalData).toBe('regular text');
    });

    it('should handle Buffer and binary data', () => {
      const binaryContext = {
        buffer: Buffer.from('test data', 'utf8'),
        uint8Array: new Uint8Array([72, 101, 108, 108, 111]),
        arrayBuffer: new ArrayBuffer(16),
        sensitiveBuffer: Buffer.from('password=secret123', 'utf8'),
        normalText: 'normal data'
      };

      const result = sanitizeErrorContext(testError, binaryContext, {
        redactionLevel: 'partial'
      });
      
      expect(result.errorId).toBeDefined();
      expect(result.context.normalText).toBe('normal data');
      // Should handle binary data without crashing
    });
  });

  describe('Error Object Edge Cases', () => {
    it('should handle errors with non-standard properties', () => {
      const customError = new Error('Custom error') as any;
      customError.code = 'CUSTOM_CODE';
      customError.statusCode = 500;
      customError.details = { nested: { secret: 'hidden' } };
      customError.stack = 'CustomError: Custom error\n    at test.js:1:1';
      customError.cause = new Error('Root cause');

      const result = sanitizeErrorContext(customError, {}, {
        preserveErrorCodes: true,
        redactionLevel: 'partial'
      });
      
      expect(result.errorId).toBeDefined();
      expect(result.context.code).toBe('CUSTOM_CODE');
      expect(result.context.message).toBe('Custom error');
    });

    it('should handle errors with sensitive messages', () => {
      const sensitiveError = new Error('Database connection failed: postgresql://admin:password123@db.example.com:5432/mydb');
      
      const result = sanitizeErrorContext(sensitiveError, {}, {
        redactionLevel: 'partial'
      });
      
      expect(result.errorId).toBeDefined();
      expect(result.context.message).not.toContain('password123');
      expect(result.hadSensitiveData).toBe(true);
    });

    it('should handle error objects that throw during property access', () => {
      const problematicError = new Error('Test error') as any;
      Object.defineProperty(problematicError, 'problematic', {
        get() {
          throw new Error('Property access failed');
        }
      });
      problematicError.safe = 'safe value';

      expect(() => {
        const result = sanitizeErrorContext(problematicError, {});
        expect(result.errorId).toBeDefined();
        expect(result.context.safe).toBe('safe value');
      }).not.toThrow();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        redactionLevel: 'invalid' as any,
        maxContextLength: -1,
        allowedProperties: null as any,
        customContextPatterns: 'not-an-array' as any
      };

      expect(() => {
        const result = sanitizeErrorContext(testError, { test: 'value' }, invalidConfig);
        expect(result.errorId).toBeDefined();
      }).not.toThrow();
    });

    it('should handle zero/empty configuration limits', () => {
      const extremeConfig = {
        maxContextLength: 0,
        allowedProperties: [],
        redactionLevel: 'full' as const
      };

      const result = sanitizeErrorContext(testError, { 
        operation: 'test',
        secret: 'hidden' 
      }, extremeConfig);
      
      expect(result.errorId).toBeDefined();
      expect(Object.keys(result.context)).toHaveLength(0);
    });

    it('should handle configuration with circular references', () => {
      const circularConfig: any = {
        redactionLevel: 'partial' as const,
        maxContextLength: 1000
      };
      circularConfig.self = circularConfig;

      expect(() => {
        const result = sanitizeErrorContext(testError, { test: 'value' }, circularConfig);
        expect(result.errorId).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Security Attack Simulation', () => {
    it('should resist prototype pollution attempts', () => {
      const pollutionAttempt = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"prototype": {"evil": "value"}}}');
      
      const result = sanitizeErrorContext(testError, pollutionAttempt);
      
      expect(result.errorId).toBeDefined();
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect((Object.prototype as any).evil).toBeUndefined();
    });

    it('should handle malformed JSON-like strings', () => {
      const malformedContext = {
        jsonLike: '{"incomplete": "object"',
        validJson: '{"valid": "object"}',
        notJson: 'plain text',
        sensitiveJsonString: '{"password": "secret123", "api_key": "sk-abcdef"}'
      };

      const result = sanitizeErrorContext(testError, malformedContext, {
        redactionLevel: 'partial'
      });
      
      expect(result.errorId).toBeDefined();
      expect(result.context.notJson).toBe('plain text');
      expect(result.hadSensitiveData).toBe(true);
    });

    it('should handle unicode and encoding attacks', () => {
      const unicodeAttacks = {
        bidi: '\u202e\u202d\u202c', // Bidirectional text override
        zalgo: 'H̸̡̪̯ͨ͊̽̅̾̎Ȩ̬̩̾͛ͪ̈́̀́͘ ̶̧̨̱̹̭̯ͧ̾ͬC̷̙̲̝͖ͭ̏ͥͮ͟Oͮ͏̮̪̝͍M̲̖͊̒ͪͩͬ̚̚͜Ȇ̴̟̟͙̞ͩ͌͝S̨̥̫͎̭ͯ̿̔̀ͅ',
        homoglyph: 'аdmin', // Cyrillic 'а' instead of 'a'
        nullByte: 'test\0hidden\0more',
        formFeed: 'test\x0Chidden',
        backspace: 'test\x08\x08\x08hidden',
        normalText: 'regular content'
      };

      const result = sanitizeErrorContext(testError, unicodeAttacks);
      
      expect(result.errorId).toBeDefined();
      expect(result.context.normalText).toBe('regular content');
    });

    it('should handle extremely nested objects (potential stack overflow)', () => {
      let deepNest: any = { value: 'test' };
      for (let i = 0; i < 1000; i++) {
        deepNest = { level: i, nested: deepNest };
      }
      deepNest.secret = 'hidden-deep';

      expect(() => {
        const result = sanitizeErrorContext(testError, { deep: deepNest }, {
          redactionLevel: 'partial',
          sanitizeNestedObjects: true
        });
        expect(result.errorId).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('External System Integration Edge Cases', () => {
    it('should handle errors that occur during safe forwarding creation', () => {
      // Create an object that will cause JSON.stringify to fail
      const problematicContext: any = {
        normal: 'value'
      };
      problematicContext.circular = problematicContext;
      
      // Add a property that throws during access
      Object.defineProperty(problematicContext, 'throwing', {
        get() {
          throw new Error('Property access failed');
        }
      });

      expect(() => {
        const safeError = createSafeErrorForForwarding(testError, problematicContext);
        expect(safeError.errorId).toBeDefined();
        expect(safeError.metadata.securityWarnings.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should handle telemetry payloads with size constraints', () => {
      const largeTelemetryContext: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeTelemetryContext[`metric${i}`] = {
          value: Math.random(),
          timestamp: new Date().toISOString(),
          metadata: 'x'.repeat(1000) // 1KB per metric
        };
      }

      const safeError = createSafeErrorForForwarding(testError, largeTelemetryContext, {
        maxContextLength: 500 // Force aggressive truncation
      });
      
      expect(safeError.errorId).toBeDefined();
      expect(safeError.metadata.redactedCount).toBeGreaterThan(0);
      
      // Should be serializable for telemetry systems
      const serialized = JSON.stringify(safeError);
      expect(serialized.length).toBeLessThan(10000); // Reasonable size for telemetry
    });
  });

  describe('Concurrent Access Edge Cases', () => {
    it('should handle concurrent sanitization requests safely', async () => {
      const promises = Array.from({ length: 50 }, (_, i) => 
        Promise.resolve().then(() => {
          const error = new Error(`Concurrent error ${i}`);
          const context = {
            operation: `operation-${i}`,
            sensitive: `secret-${i}`,
            timestamp: Date.now()
          };
          
          return sanitizeErrorContext(error, context, {
            redactionLevel: 'partial'
          });
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(50);
      expect(results.every(r => r.errorId)).toBe(true);
      
      // All error IDs should be unique
      const errorIds = results.map(r => r.errorId);
      const uniqueIds = new Set(errorIds);
      expect(uniqueIds.size).toBe(50);
    });
  });
});