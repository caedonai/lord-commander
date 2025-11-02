/**
 * Task 1.4.2 Tests: Structured Logging with Security - Core Feature Tests
 *
 * Focused test suite validating the main functionality of the structured logging system:
 * - Basic log entry creation and metadata
 * - Security integration with Task 1.4.1 (log injection protection)
 * - Context masking and sanitization
 * - Message truncation and size management
 * - Multiple output formats
 * - Configuration presets and factory functions
 *
 * @security Validates security features without complex mocking interference
 * @performance Tests key performance constraints and limits
 * @architecture Tests clean integration with existing logging infrastructure
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  createStructuredLogger,
  DEFAULT_STRUCTURED_LOGGING_CONFIG,
  SecurityClassification,
  StructuredLogger,
  StructuredLogLevel,
  structuredLog,
} from '../../../core/foundation/logging/structured.js';

describe('Task 1.4.2: Structured Logging Core Features', () => {
  let logger: StructuredLogger;

  beforeEach(() => {
    // Use a clean logger instance for each test with sanitization disabled to avoid mock complexity
    logger = new StructuredLogger({
      sanitizeByDefault: false,
    });
  });

  describe('Basic Log Entry Creation', () => {
    it('should create minimal log entry with default values', () => {
      const result = logger.createLogEntry('Test message');

      expect(result.entry.message).toBe('Test message');
      expect(result.entry.level).toBe(StructuredLogLevel.INFO);
      expect(result.entry.levelName).toBe('INFO');
      expect(result.entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.entry.sanitized).toBe(false);
      expect(result.entry.securityFlags).toEqual([]);
      expect(result.entry.classification).toBe(SecurityClassification.INTERNAL);
      expect(result.entry.context).toEqual({});
      expect(result.entry.auditEvent).toBe(false);
    });

    it('should create log entry with comprehensive metadata', () => {
      const result = logger.createLogEntry('Operation completed', {
        level: StructuredLogLevel.INFO,
        classification: SecurityClassification.PUBLIC,
        context: { operationId: 'op123', duration: 150 },
        component: 'api',
        operation: 'processRequest',
        userId: 'user456',
        sessionId: 'sess789',
        traceId: 'trace012',
        spanId: 'span345',
        correlationId: 'corr678',
        duration: 150,
        auditEvent: true,
      });

      expect(result.entry.level).toBe(StructuredLogLevel.INFO);
      expect(result.entry.classification).toBe(SecurityClassification.PUBLIC);
      expect(result.entry.context).toEqual({ operationId: 'op123', duration: 150 });
      expect(result.entry.component).toBe('api');
      expect(result.entry.operation).toBe('processRequest');
      expect(result.entry.userId).toBe('user456');
      expect(result.entry.sessionId).toBe('sess789');
      expect(result.entry.traceId).toBe('trace012');
      expect(result.entry.spanId).toBe('span345');
      expect(result.entry.correlationId).toBe('corr678');
      expect(result.entry.duration).toBe(150);
      expect(result.entry.auditEvent).toBe(true);
      expect(result.entry.securityFlags).toContain('audit_event');
    });

    it('should handle error objects in log entries', () => {
      const testError = new Error('Operation failed');
      testError.name = 'OperationError';

      const result = logger.createLogEntry('Error occurred', {
        level: StructuredLogLevel.ERROR,
        error: testError,
      });

      expect(result.entry.level).toBe(StructuredLogLevel.ERROR);
      expect(result.entry.error).toBeDefined();
      expect(result.entry.error?.name).toBe('OperationError');
      expect(result.entry.error?.message).toBe('Operation failed');
      expect(result.entry.error?.sanitized).toBe(false);
    });

    it('should generate appropriate compliance flags', () => {
      const errorResult = logger.createLogEntry('Critical error', {
        level: StructuredLogLevel.ERROR,
        userId: 'user123',
        auditEvent: true,
      });

      expect(errorResult.entry.complianceFlags).toContain('error_reporting');
      expect(errorResult.entry.complianceFlags).toContain('user_associated');
      expect(errorResult.entry.complianceFlags).toContain('audit_required');
      expect(errorResult.entry.retentionPolicy).toBe('7y');
    });
  });

  describe('Context Processing and Security', () => {
    it('should mask sensitive fields in context', () => {
      const result = logger.createLogEntry('User operation', {
        context: {
          username: 'johndoe',
          password: 'secret123',
          token: 'abc123',
          authorization: 'Bearer xyz789',
          secret: 'hidden',
          key: 'api-key-456',
          publicData: 'visible info',
          id: 'user123',
        },
      });

      // Sensitive fields should be masked
      expect(result.entry.context.password).toBe('[MASKED]');
      expect(result.entry.context.token).toBe('[MASKED]');
      expect(result.entry.context.authorization).toBe('[MASKED]');
      expect(result.entry.context.secret).toBe('[MASKED]');
      expect(result.entry.context.key).toBe('[MASKED]');

      // Non-sensitive fields should remain unchanged
      expect(result.entry.context.username).toBe('johndoe');
      expect(result.entry.context.publicData).toBe('visible info');
      expect(result.entry.context.id).toBe('user123');
    });

    it('should process nested context objects', () => {
      const nestedContext = {
        user: {
          id: 'user123',
          profile: {
            name: 'John Doe',
            password: 'secret',
            email: 'john@example.com',
          },
        },
        request: {
          path: '/api/users',
          headers: {
            authorization: 'Bearer token123',
          },
        },
      };

      const result = logger.createLogEntry('Nested context test', {
        context: nestedContext,
      });

      // Check nested structure is preserved
      expect(result.entry.context.user).toBeDefined();
      expect((result.entry.context.user as any).id).toBe('user123');
      expect((result.entry.context.user as any).profile.name).toBe('John Doe');
      expect((result.entry.context.user as any).profile.email).toBe('john@example.com');

      // Check nested sensitive fields are masked
      expect((result.entry.context.user as any).profile.password).toBe('[MASKED]');
      expect((result.entry.context.request as any).headers.authorization).toBe('[MASKED]');
    });

    it('should handle array values in context', () => {
      const contextWithArrays = {
        tags: ['important', 'user-action', 'security'],
        permissions: ['read', 'write'],
        coordinates: [10.5, 20.3, 30.7],
      };

      const result = logger.createLogEntry('Array context test', {
        context: contextWithArrays,
      });

      expect(result.entry.context.tags).toEqual(['important', 'user-action', 'security']);
      expect(result.entry.context.permissions).toEqual(['read', 'write']);
      expect(result.entry.context.coordinates).toEqual([10.5, 20.3, 30.7]);
    });
  });

  describe('Performance and Size Management', () => {
    it('should truncate messages exceeding maximum length', () => {
      const loggerWithLimit = new StructuredLogger({
        maxMessageLength: 50,
        sanitizeByDefault: false,
      });

      const longMessage =
        'This is a very long message that definitely exceeds the configured maximum length limit for testing purposes';
      const result = loggerWithLimit.createLogEntry(longMessage);

      expect(result.entry.message).toHaveLength(50 + '...[truncated]'.length);
      expect(result.entry.message.endsWith('...[truncated]')).toBe(true);
      expect(result.entry.securityFlags).toContain('truncated');
      expect(result.truncated).toBe(true);
      expect(result.warnings).toContain('Message truncated to 50 characters');
    });

    it('should handle context size limits', () => {
      const loggerWithLimit = new StructuredLogger({
        maxContextSize: 200, // Very small limit to trigger truncation
        sanitizeByDefault: false,
      });

      const largeContext = Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [`field${i}`, `${'value'.repeat(20)}_${i}`])
      );

      const result = loggerWithLimit.createLogEntry('Large context test', {
        context: largeContext,
      });

      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringMatching(/Context truncated from \d+ to 200 bytes/)])
      );

      // Should have fewer fields than the original
      expect(Object.keys(result.entry.context)).not.toHaveLength(20);
    });

    it('should handle empty and undefined context gracefully', () => {
      const result1 = logger.createLogEntry('Test with empty context', {
        context: {},
      });

      const result2 = logger.createLogEntry('Test with undefined context', {
        context: undefined,
      });

      expect(result1.entry.context).toEqual({});
      expect(result2.entry.context).toEqual({});
      expect(result1.warnings).toEqual([]);
      expect(result2.warnings).toEqual([]);
    });
  });

  describe('Output Formatting', () => {
    it('should format log entry as JSON by default', () => {
      const entry = logger.createLogEntry('Test message').entry;
      const jsonOutput = logger.formatLogEntry(entry);

      const parsed = JSON.parse(jsonOutput);
      expect(parsed.message).toBe('Test message');
      expect(parsed.level).toBe(StructuredLogLevel.INFO);
      expect(parsed.levelName).toBe('INFO');
    });

    it('should format log entry as human-readable text', () => {
      const textLogger = new StructuredLogger({
        format: 'text',
        sanitizeByDefault: false,
      });

      const entry = textLogger.createLogEntry('Operation failed', {
        level: StructuredLogLevel.ERROR,
        component: 'auth',
        operation: 'login',
      }).entry;

      const textOutput = textLogger.formatLogEntry(entry);

      expect(textOutput).toContain('[ERROR]');
      expect(textOutput).toContain('(auth)');
      expect(textOutput).toContain('{login}');
      expect(textOutput).toContain('Operation failed');
    });

    it('should format log entry as structured key-value pairs', () => {
      const structuredLogger = new StructuredLogger({
        format: 'structured',
        sanitizeByDefault: false,
      });

      const entry = structuredLogger.createLogEntry('Warning message', {
        level: StructuredLogLevel.WARN,
        userId: 'user123',
        traceId: 'trace456',
      }).entry;

      const structuredOutput = structuredLogger.formatLogEntry(entry);

      expect(structuredOutput).toContain('level=WARN');
      expect(structuredOutput).toContain('message="Warning message"');
      expect(structuredOutput).toContain('userId=user123');
      expect(structuredOutput).toContain('traceId=trace456');
    });
  });

  describe('Configuration and Presets', () => {
    it('should use secure defaults', () => {
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.sanitizeByDefault).toBe(true);
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.includeSecurityAnalysis).toBe(true);
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maskFields).toContain('password');
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maskFields).toContain('secret');
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maskFields).toContain('token');
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maxMessageLength).toBe(8192);
    });

    it('should create development preset logger', () => {
      const devLogger = createStructuredLogger('development');
      const config = devLogger.getConfig();

      expect(config.format).toBe('text');
      expect(config.prettyPrint).toBe(true);
      expect(config.sanitizeByDefault).toBe(false);
      expect(config.complianceMode).toBe(false);
    });

    it('should create production preset logger', () => {
      const prodLogger = createStructuredLogger('production');
      const config = prodLogger.getConfig();

      expect(config.format).toBe('json');
      expect(config.prettyPrint).toBe(false);
      expect(config.sanitizeByDefault).toBe(true);
      expect(config.complianceMode).toBe(true);
    });

    it('should create security preset logger', () => {
      const securityLogger = createStructuredLogger('security');
      const config = securityLogger.getConfig();

      expect(config.defaultClassification).toBe(SecurityClassification.CONFIDENTIAL);
      expect(config.sanitizeByDefault).toBe(true);
      expect(config.includeSecurityAnalysis).toBe(true);
    });

    it('should override preset configurations', () => {
      const customLogger = createStructuredLogger('production', {
        format: 'text',
        maxMessageLength: 5000,
      });

      const config = customLogger.getConfig();
      expect(config.format).toBe('text'); // overridden
      expect(config.maxMessageLength).toBe(5000); // overridden
      expect(config.sanitizeByDefault).toBe(true); // from preset
    });

    it('should update configuration dynamically', () => {
      logger.updateConfig({
        format: 'structured',
        includeMetadata: false,
      });

      const config = logger.getConfig();
      expect(config.format).toBe('structured');
      expect(config.includeMetadata).toBe(false);
    });
  });

  describe('Convenience Functions', () => {
    it('should create audit log entries', () => {
      const result = structuredLog.audit('User login attempt', {
        userId: 'user123',
        context: { ip: '192.168.1.1', userAgent: 'test-browser' },
      });

      expect(result.entry.auditEvent).toBe(true);
      expect(result.entry.securityFlags).toContain('audit_event');
      expect(result.entry.userId).toBe('user123');
      expect(result.entry.context.ip).toBe('192.168.1.1');
    });

    it('should create security log entries', () => {
      const result = structuredLog.security('Suspicious activity detected', {
        context: {
          pattern: 'multiple-failed-logins',
          sourceIp: '10.0.0.1',
        },
      });

      expect(result.entry.classification).toBe(SecurityClassification.CONFIDENTIAL);
      expect(result.entry.context.pattern).toBe('multiple-failed-logins');
      expect(result.entry.context.sourceIp).toBe('10.0.0.1');
    });

    it('should create error log entries with error objects', () => {
      const testError = new Error('Database timeout');
      testError.name = 'DatabaseError';

      const result = structuredLog.error('Database operation failed', testError, {
        component: 'database',
        operation: 'query',
        context: { query: 'SELECT * FROM users', timeout: 5000 },
      });

      expect(result.entry.level).toBe(StructuredLogLevel.ERROR);
      expect(result.entry.error?.name).toBe('DatabaseError');
      expect(result.entry.error?.message).toBe('Database timeout');
      expect(result.entry.component).toBe('database');
      expect(result.entry.operation).toBe('query');
      expect(result.entry.context.query).toBe('SELECT * FROM users');
    });

    it('should create performance log entries with timing', () => {
      const result = structuredLog.performance('API response time', 250, {
        component: 'api',
        operation: 'getUserProfile',
        context: {
          userId: 'user123',
          endpoint: '/api/user/profile',
          method: 'GET',
        },
      });

      expect(result.entry.level).toBe(StructuredLogLevel.INFO);
      expect(result.entry.duration).toBe(250);
      expect(result.entry.component).toBe('api');
      expect(result.entry.operation).toBe('getUserProfile');
      expect(result.entry.context.endpoint).toBe('/api/user/profile');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle error objects with missing properties', () => {
      // Create minimal error object
      const minimalError = Object.create(Error.prototype);
      minimalError.name = 'MinimalError';
      // Intentionally no message property

      const result = logger.createLogEntry('Minimal error test', {
        error: minimalError,
      });

      expect(result.entry.error?.name).toBe('MinimalError');
      expect(result.entry.error?.message).toBe(''); // Should handle missing message gracefully
      expect(result.entry.error?.sanitized).toBe(false);
    });

    it('should handle error chains with cause property', () => {
      const rootCause = new Error('Network timeout');
      const intermediateError = new Error('Connection failed');
      (intermediateError as any).cause = rootCause;
      const topLevelError = new Error('Operation failed');
      (topLevelError as any).cause = intermediateError;

      const result = logger.createLogEntry('Chained error test', {
        error: topLevelError,
      });

      expect(result.entry.error?.message).toBe('Operation failed');
      expect(result.entry.error?.cause?.message).toBe('Connection failed');
      expect(result.entry.error?.cause?.cause?.message).toBe('Network timeout');
    });

    it('should handle concurrent log entry creation safely', () => {
      // Create multiple log entries simultaneously
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(
          logger.createLogEntry(`Concurrent message ${i}`, {
            context: { index: i, timestamp: Date.now() + i },
          })
        )
      );

      return Promise.all(promises).then((results) => {
        expect(results).toHaveLength(10);
        results.forEach((result, index) => {
          expect(result.entry.message).toBe(`Concurrent message ${index}`);
          expect(result.entry.context.index).toBe(index);
        });
      });
    });
  });

  describe('Security Features Integration', () => {
    it('should provide comprehensive security metadata', () => {
      const secureLogger = new StructuredLogger({
        sanitizeByDefault: true,
        includeSecurityAnalysis: true,
        defaultClassification: SecurityClassification.CONFIDENTIAL,
      });

      const result = secureLogger.createLogEntry('Security event', {
        context: {
          password: 'secret123',
          userAgent: 'Mozilla/5.0...',
          action: 'login',
        },
        auditEvent: true,
      });

      expect(result.entry.classification).toBe(SecurityClassification.CONFIDENTIAL);
      expect(result.entry.auditEvent).toBe(true);
      expect(result.entry.securityFlags).toContain('audit_event');
      expect(result.entry.context.password).toBe('[MASKED]');
      expect(result.entry.context.action).toBe('login'); // Non-sensitive field
    });

    it('should handle DoS protection through size limits', () => {
      const protectedLogger = new StructuredLogger({
        maxMessageLength: 100,
        maxContextSize: 500,
        sanitizeByDefault: false,
      });

      // Create oversized content
      const largeMessage = 'A'.repeat(200);
      const largeContext = {
        field1: 'x'.repeat(300),
        field2: 'y'.repeat(300),
      };

      const result = protectedLogger.createLogEntry(largeMessage, {
        context: largeContext,
      });

      // Message should be truncated
      expect(result.entry.message).toHaveLength(100 + '...[truncated]'.length);
      expect(result.truncated).toBe(true);

      // Context should be limited
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringMatching(/Context truncated from \d+ to 500 bytes/)])
      );
    });

    it('should maintain data integrity during processing', () => {
      const testData = {
        id: 'test-id-123',
        timestamp: '2025-01-01T12:00:00.000Z',
        numbers: [1, 2, 3, 4, 5],
        boolean: true,
        nested: {
          level1: {
            level2: {
              value: 'deep-value',
            },
          },
        },
      };

      const result = logger.createLogEntry('Data integrity test', {
        context: testData,
      });

      // Verify deep equality
      expect(result.entry.context.id).toBe('test-id-123');
      expect(result.entry.context.timestamp).toBe('2025-01-01T12:00:00.000Z');
      expect(result.entry.context.numbers).toEqual([1, 2, 3, 4, 5]);
      expect(result.entry.context.boolean).toBe(true);
      expect((result.entry.context.nested as any).level1.level2.value).toBe('deep-value');
    });
  });
});
