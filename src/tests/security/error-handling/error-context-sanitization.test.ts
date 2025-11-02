/**
 * Comprehensive test suite for Error Context Sanitization (Task 1.3.3)
 *
 * This test suite validates the error context sanitization functionality
 * including selective redaction, secure ID generation, and safe forwarding.
 *
 * @see Task 1.3.3: Error Context Sanitization
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  analyzeErrorContextSecurity,
  createSafeErrorForForwarding,
  sanitizeErrorContext,
} from '../../../core/foundation/errors/sanitization.js';

describe('Error Context Sanitization (Task 1.3.3)', () => {
  let testError: Error;
  let sensitiveContext: Record<string, unknown>;
  let safeContext: Record<string, unknown>;

  beforeEach(() => {
    testError = new Error('Test error message');
    testError.name = 'TestError';
    (testError as any).code = 'TEST_001';

    sensitiveContext = {
      operation: 'user-login',
      timestamp: '2024-10-18T10:00:00Z',
      user: {
        email: 'user@example.com',
        password: 'secret123',
        apiKey: 'sk-1234567890abcdef',
      },
      database: {
        host: '192.168.1.100',
        connectionString: 'mongodb://admin:secret@cluster.example.com:27017/mydb',
      },
      filePath: '/home/user/.env',
      internalId: 'internal-id-12345',
    };

    safeContext = {
      operation: 'user-login',
      timestamp: '2024-10-18T10:00:00Z',
      component: 'auth-service',
      requestId: 'req-123456',
    };
  });

  describe('sanitizeErrorContext()', () => {
    it('should generate secure error IDs', () => {
      const result = sanitizeErrorContext(testError, {});

      expect(result.errorId).toMatch(/^ERR_\d{4}_[A-F0-9]{8}$/);
      expect(result.errorId).toContain('2025'); // Current year
    });

    it('should preserve error codes when enabled', () => {
      const result = sanitizeErrorContext(
        testError,
        {},
        {
          preserveErrorCodes: true,
        }
      );

      expect(result.code).toBe('TEST_001');
    });

    it('should not preserve error codes when disabled', () => {
      const result = sanitizeErrorContext(
        testError,
        {},
        {
          preserveErrorCodes: false,
        }
      );

      expect(result.code).toBeUndefined();
    });

    it('should preserve timestamps when enabled', () => {
      const result = sanitizeErrorContext(
        testError,
        {},
        {
          preserveTimestamps: true,
        }
      );

      expect(result.timestamp).toBeDefined();
      if (result.timestamp) {
        expect(new Date(result.timestamp).getTime()).toBeGreaterThan(Date.now() - 1000);
      }
    });

    it('should apply "none" redaction level correctly', () => {
      const result = sanitizeErrorContext(testError, sensitiveContext, {
        redactionLevel: 'none',
      });

      expect(result.context.user).toEqual(sensitiveContext.user);
      expect(result.context.database).toEqual(sensitiveContext.database);
      expect(result.redactedProperties).toHaveLength(0);
    });

    it('should apply "partial" redaction level correctly', () => {
      const result = sanitizeErrorContext(testError, sensitiveContext, {
        redactionLevel: 'partial',
      });

      // Should remove detected sensitive properties
      expect(result.context.user).toBeUndefined();
      expect(result.context.database).toBeUndefined();
      expect(result.context.filePath).toBeUndefined();

      // Should preserve non-sensitive properties
      expect(result.context.operation).toBe('user-login');
      expect(result.context.timestamp).toBe('2024-10-18T10:00:00Z');

      expect(result.redactedProperties.length).toBeGreaterThan(0);
      expect(result.hadSensitiveData).toBe(true);
    });

    it('should apply "full" redaction level correctly', () => {
      const result = sanitizeErrorContext(testError, sensitiveContext, {
        redactionLevel: 'full',
        allowedProperties: ['operation', 'timestamp'],
      });

      // Should only preserve explicitly allowed properties
      expect(result.context.operation).toBe('user-login');
      expect(result.context.timestamp).toBe('2024-10-18T10:00:00Z');

      // Should remove everything else
      expect(result.context.user).toBeUndefined();
      expect(result.context.database).toBeUndefined();
      expect(result.context.filePath).toBeUndefined();
      expect(result.context.internalId).toBeUndefined();

      expect(result.redactedProperties.length).toBeGreaterThan(2);
    });

    it('should provide redaction hints when enabled', () => {
      const result = sanitizeErrorContext(testError, sensitiveContext, {
        redactionLevel: 'partial',
        includeContextHints: true,
      });

      expect(Object.keys(result.redactionHints).length).toBeGreaterThan(0);
      expect(result.redactionHints).toHaveProperty('user');
      expect(result.redactionHints).toHaveProperty('database');
    });

    it('should not provide redaction hints when disabled', () => {
      const result = sanitizeErrorContext(testError, sensitiveContext, {
        redactionLevel: 'partial',
        includeContextHints: false,
      });

      expect(Object.keys(result.redactionHints)).toHaveLength(0);
    });

    it('should handle nested object sanitization', () => {
      const nestedContext = {
        user: {
          profile: {
            email: 'user@example.com',
            settings: {
              apiKey: 'sk-secret',
            },
          },
        },
        metadata: {
          safe: 'value',
        },
      };

      const result = sanitizeErrorContext(testError, nestedContext, {
        redactionLevel: 'partial',
        sanitizeNestedObjects: true,
      });

      // Should remove the entire user object due to sensitive nested content
      expect(result.context.user).toBeUndefined();
      // Should preserve safe nested content
      expect(result.context.metadata).toEqual({ safe: 'value' });
    });

    it('should handle array sanitization', () => {
      const arrayContext = {
        users: [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'jane@example.com' },
        ],
        operations: ['login', 'logout'],
      };

      const result = sanitizeErrorContext(testError, arrayContext, {
        redactionLevel: 'partial',
        sanitizeNestedObjects: true,
      });

      // Should remove sensitive arrays
      expect(result.context.users).toBeUndefined();
      // Should preserve non-sensitive arrays
      expect(result.context.operations).toEqual(['login', 'logout']);
    });

    it('should apply DoS protection for large contexts', () => {
      const largeValue = 'x'.repeat(5000);
      const largeContext = {
        data1: largeValue,
        data2: largeValue,
        data3: largeValue,
      };

      const result = sanitizeErrorContext(testError, largeContext, {
        maxContextLength: 1000,
      });

      expect(
        result.securityWarnings.some((warning) =>
          warning.toLowerCase().includes('large context detected')
        )
      ).toBe(true);

      // Should truncate large values
      Object.values(result.context).forEach((value) => {
        if (typeof value === 'string') {
          expect(value.length).toBeLessThan(500);
        }
      });
    });

    it('should detect and warn about performance issues', () => {
      // Create a complex nested object that might cause performance issues
      const complexContext: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        complexContext[`key${i}`] = {
          nested: {
            deeply: {
              value: `test-value-${i}`,
              email: `user${i}@example.com`,
            },
          },
        };
      }

      const result = sanitizeErrorContext(testError, complexContext, {
        redactionLevel: 'partial',
      });

      // Should complete without hanging and may include performance warnings
      expect(result.errorId).toBeDefined();
      expect(result.context).toBeDefined();
    });

    it('should handle custom context patterns', () => {
      const customContext = {
        customSecret: 'custom-secret-123',
        internalToken: 'internal-tok-456',
        normalData: 'safe-value',
      };

      const result = sanitizeErrorContext(testError, customContext, {
        redactionLevel: 'partial',
        customContextPatterns: [/custom-secret-\w+/gi, /internal-tok-\w+/gi],
      });

      expect(result.context.customSecret).toBeUndefined();
      expect(result.context.internalToken).toBeUndefined();
      expect(result.context.normalData).toBe('safe-value');
    });
  });

  describe('createSafeErrorForForwarding()', () => {
    it('should create safe error objects for external systems', () => {
      const safeError = createSafeErrorForForwarding(testError, sensitiveContext);

      expect(safeError.errorId).toMatch(/^ERR_\d{4}_[A-F0-9]{8}$/);
      expect(safeError.message).toBe('Test error message');
      expect(safeError.type).toBe('TestError');
      expect(safeError.timestamp).toBeDefined();
      expect(safeError.severity).toBeOneOf(['low', 'medium', 'high']);

      // Metadata should be included
      expect(safeError.metadata.hadSensitiveData).toBe(true);
      expect(safeError.metadata.redactedCount).toBeGreaterThan(0);
      expect(Array.isArray(safeError.metadata.securityWarnings)).toBe(true);
    });

    it('should apply restrictive defaults for external forwarding', () => {
      const safeError = createSafeErrorForForwarding(testError, sensitiveContext);

      // Should have more aggressive sanitization for external systems
      expect(safeError.context.user).toBeUndefined();
      expect(safeError.context.database).toBeUndefined();
      expect(safeError.metadata.redactedCount).toBeGreaterThan(0);
    });

    it('should detect high severity for security errors', () => {
      const securityError = new Error('Security violation detected');
      securityError.name = 'SecurityError';

      const safeError = createSafeErrorForForwarding(securityError, {});

      expect(safeError.severity).toBe('high');
    });

    it('should sanitize error messages for external forwarding', () => {
      const errorWithSensitiveMessage = new Error(
        'Database error: password=secret123 at user@example.com'
      );

      const safeError = createSafeErrorForForwarding(errorWithSensitiveMessage, {});

      expect(safeError.message).not.toContain('secret123');
      expect(safeError.message).not.toContain('user@example.com');
    });

    it('should respect custom forwarding configuration', () => {
      const safeError = createSafeErrorForForwarding(testError, sensitiveContext, {
        redactionLevel: 'full',
        allowedProperties: ['operation'],
        maxContextLength: 200,
      });

      expect(safeError.context.operation).toBe('user-login');
      expect(Object.keys(safeError.context)).toHaveLength(1);
    });
  });

  describe('analyzeErrorContextSecurity()', () => {
    it('should analyze context security without modification', () => {
      const analysis = analyzeErrorContextSecurity(sensitiveContext);

      expect(analysis.riskLevel).toBeOneOf(['low', 'medium', 'high', 'critical']);
      expect(Array.isArray(analysis.sensitiveDetections)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(typeof analysis.estimatedRedactionPercentage).toBe('number');
    });

    it('should detect critical security risks', () => {
      const analysis = analyzeErrorContextSecurity(sensitiveContext);

      expect(analysis.riskLevel).toBeOneOf(['high', 'critical']);
      expect(analysis.sensitiveDetections.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide accurate redaction percentage estimates', () => {
      const analysis = analyzeErrorContextSecurity(sensitiveContext);

      expect(analysis.estimatedRedactionPercentage).toBeGreaterThan(0);
      expect(analysis.estimatedRedactionPercentage).toBeLessThanOrEqual(100);
    });

    it('should categorize detection severity correctly', () => {
      const analysis = analyzeErrorContextSecurity(sensitiveContext);

      const criticalDetections = analysis.sensitiveDetections.filter(
        (d) => d.severity === 'critical'
      );
      const highDetections = analysis.sensitiveDetections.filter((d) => d.severity === 'high');

      expect(criticalDetections.length).toBeGreaterThan(0); // Should detect passwords, API keys
      expect(highDetections.length).toBeGreaterThan(0); // Should detect emails
    });

    it('should generate relevant security recommendations', () => {
      const analysis = analyzeErrorContextSecurity(sensitiveContext);

      const recommendations = analysis.recommendations.join(' ').toLowerCase();
      expect(recommendations).toContain('password');
      expect(recommendations).toContain('api');
      expect(recommendations).toMatch(/remove|redact|sanitize/);
    });

    it('should handle safe contexts correctly', () => {
      const analysis = analyzeErrorContextSecurity(safeContext);

      expect(analysis.riskLevel).toBe('low');
      expect(analysis.sensitiveDetections).toHaveLength(0);
      expect(analysis.estimatedRedactionPercentage).toBe(0);
    });

    it('should handle empty contexts', () => {
      const analysis = analyzeErrorContextSecurity({});

      expect(analysis.riskLevel).toBe('low');
      expect(analysis.sensitiveDetections).toHaveLength(0);
      expect(analysis.estimatedRedactionPercentage).toBe(0);
      expect(analysis.recommendations).toHaveLength(0);
    });
  });

  describe('Edge Cases and Security Scenarios', () => {
    it('should handle null and undefined values safely', () => {
      const contextWithNulls = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zeroNumber: 0,
        falseBoolean: false,
      };

      const result = sanitizeErrorContext(testError, contextWithNulls);

      expect(result.errorId).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.securityWarnings).not.toContain(expect.stringMatching(/error|crash|fail/i));
    });

    it('should handle circular references safely', () => {
      const circularContext: any = {
        name: 'test',
      };
      circularContext.self = circularContext;

      expect(() => {
        sanitizeErrorContext(testError, circularContext);
      }).not.toThrow();
    });

    it('should prevent context injection attacks', () => {
      const maliciousContext = {
        normal: 'value',
        __proto__: { malicious: 'value' },
        constructor: { prototype: { evil: 'value' } },
      };

      const result = sanitizeErrorContext(testError, maliciousContext, {
        redactionLevel: 'partial',
      });

      expect(result.context).not.toHaveProperty('__proto__');
      expect(result.context).not.toHaveProperty('constructor');
      expect(result.context.normal).toBe('value');
    });

    it('should handle very deep nesting without stack overflow', () => {
      // Create deeply nested object
      let deep: any = { level: 0 };
      for (let i = 1; i < 50; i++) {
        deep.next = { level: i };
        deep = deep.next;
      }
      deep.email = 'user@example.com'; // Add sensitive data at the end

      const result = sanitizeErrorContext(
        testError,
        { deepObject: deep },
        {
          redactionLevel: 'partial',
          sanitizeNestedObjects: true,
        }
      );

      expect(result.errorId).toBeDefined();
      expect(result.context).toBeDefined();
    });

    it('should handle special characters and encoding attacks', () => {
      const encodingContext = {
        utf8: 'Test with émojis 🔥 and üñíçødé',
        nullByte: 'test\0hidden',
        controlChars: 'test\x00\x01\x02\x03\x04',
        unicodeAttack: '\u202e\u202d\u202c', // Bidirectional override attack
        normalText: 'regular text',
      };

      const result = sanitizeErrorContext(testError, encodingContext);

      expect(result.errorId).toBeDefined();
      expect(result.context.normalText).toBe('regular text');
      // Should handle special characters without crashing
    });

    it('should respect maximum processing time limits', () => {
      // Create a context that could cause performance issues
      const performanceContext: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        performanceContext[`key${i}`] = {
          data: 'x'.repeat(100),
          nested: {
            email: `user${i}@example.com`,
            secret: `secret-${i}`,
          },
        };
      }

      const startTime = Date.now();
      const result = sanitizeErrorContext(testError, performanceContext);
      const processingTime = Date.now() - startTime;

      // Should complete in reasonable time (less than 5 seconds)
      expect(processingTime).toBeLessThan(5000);
      expect(result.errorId).toBeDefined();
    });

    it('should generate unique error IDs for different errors', () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');

      const result1 = sanitizeErrorContext(error1, {});
      const result2 = sanitizeErrorContext(error2, {});

      expect(result1.errorId).not.toBe(result2.errorId);
    });

    it('should maintain consistent behavior across multiple calls', () => {
      const context = { operation: 'test', apiKey: 'sk-123' };

      const result1 = sanitizeErrorContext(testError, context, { redactionLevel: 'partial' });
      const result2 = sanitizeErrorContext(testError, context, { redactionLevel: 'partial' });

      // IDs should be different (they include timestamp)
      expect(result1.errorId).not.toBe(result2.errorId);

      // But sanitization behavior should be consistent
      expect(result1.hadSensitiveData).toBe(result2.hadSensitiveData);
      expect(result1.redactedProperties.sort()).toEqual(result2.redactedProperties.sort());
    });
  });

  describe('Integration with Logging and Telemetry', () => {
    it('should create telemetry-ready error objects', () => {
      const telemetryError = createSafeErrorForForwarding(testError, sensitiveContext);

      // Should have all required fields for telemetry systems
      expect(telemetryError).toHaveProperty('errorId');
      expect(telemetryError).toHaveProperty('message');
      expect(telemetryError).toHaveProperty('type');
      expect(telemetryError).toHaveProperty('timestamp');
      expect(telemetryError).toHaveProperty('context');
      expect(telemetryError).toHaveProperty('severity');
      expect(telemetryError).toHaveProperty('metadata');

      // Should not expose sensitive data in the context or metadata descriptions
      const safeString = JSON.stringify(telemetryError);
      expect(safeString).not.toMatch(/secret123|sk-1234567890abcdef/); // Actual sensitive values
      expect(safeString).not.toMatch(/admin:secret@/); // Connection string credentials
    });

    it('should provide correlation IDs for distributed tracing', () => {
      const result = sanitizeErrorContext(testError, { traceId: 'trace-123' });

      expect(result.errorId).toBeDefined();
      expect(result.context.traceId).toBe('trace-123');

      // Error ID should be suitable for correlation
      expect(result.errorId).toMatch(/^ERR_\d{4}_[A-F0-9]{8}$/);
    });

    it('should handle high-frequency error scenarios efficiently', () => {
      const errors = Array.from({ length: 100 }, (_, i) => new Error(`Error ${i}`));
      const contexts = errors.map((_, i) => ({ operation: `op-${i}`, data: `data-${i}` }));

      const startTime = Date.now();
      const results = errors.map((error, i) =>
        sanitizeErrorContext(error, contexts[i], { redactionLevel: 'partial' })
      );
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(results.every((r) => r.errorId)).toBe(true);
      expect(totalTime).toBeLessThan(2000); // Should handle 100 errors in under 2 seconds
    });
  });

  describe('Configuration Validation', () => {
    it('should use default configuration when none provided', () => {
      const result = sanitizeErrorContext(testError, {});

      expect(result.errorId).toBeDefined();
      expect(result.timestamp).toBeDefined(); // preserveTimestamps: true by default
    });

    it('should merge partial configurations with defaults', () => {
      const result = sanitizeErrorContext(
        testError,
        {},
        {
          redactionLevel: 'full',
          // Other values should use defaults
        }
      );

      expect(result.errorId).toBeDefined();
      expect(result.timestamp).toBeDefined(); // Should still preserve timestamps
    });

    it('should validate configuration boundaries', () => {
      // Should handle extreme configuration values gracefully
      const result = sanitizeErrorContext(testError, sensitiveContext, {
        maxContextLength: 1, // Very small limit
        allowedProperties: [], // No allowed properties
        redactionLevel: 'full',
      });

      expect(result.errorId).toBeDefined();
      expect(Object.keys(result.context)).toHaveLength(0);
    });
  });
});
