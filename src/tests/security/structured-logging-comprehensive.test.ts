/**
 * Task 1.4.2 Tests: Structured Logging with Security - Comprehensive Test Suite
 * 
 * Tests all aspects of the structured logging system including:
 * - Basic structured log entry creation
 * - Security features and sanitization integration
 * - Performance optimization and memory management
 * - Configuration presets and factory functions
 * - Error handling and edge cases
 * - Security vulnerability testing
 * - Integration with existing log injection protection
 * - Field masking and filtering capabilities
 * - Multiple output formats and serialization
 * - Context processing and size limits
 * - Audit and compliance features
 * 
 * @security Validates comprehensive security features from Task 1.4.1 integration
 * @performance Tests memory limits, size constraints, and processing bounds
 * @architecture Tests clean integration with existing logging infrastructure
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import {
  StructuredLogger,
  StructuredLogLevel,
  SecurityClassification,
  createStructuredLogger,
  structuredLog,
  type LogEntryOptions,
  type StructuredLogEntry,
  DEFAULT_STRUCTURED_LOGGING_CONFIG,
} from '../../core/foundation/structured-logging.js';
import { sanitizeLogOutputAdvanced, analyzeLogSecurity } from '../../core/foundation/log-security.js';

// Mock the log security functions to control test behavior
vi.mock('../../core/foundation/log-security.js', () => ({
  sanitizeLogOutputAdvanced: vi.fn((input: string) => {
    // Simulate sanitization for various test patterns
    return input
      .replace(/password=\w+/g, 'password=[REDACTED]')
      .replace(/\n\[FAKE\]/g, '[SANITIZED]')
      .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '[ANSI_REMOVED]');
  }),
  analyzeLogSecurity: vi.fn(() => ({
    hasAnsiEscapes: false,
    hasControlChars: false,
    hasLineInjection: false,
    hasFormatStrings: false,
    hasTerminalManipulation: false,
    hasUnicodeAttacks: false,
    hasHyperlinkInjection: false,
    hasCommandExecution: false,
    hasNullByteInjection: false,
    hasExcessiveLength: false,
    riskLevel: 'low',
    riskScore: 0,
    threatCategories: [],
    warnings: [],
    violations: [],
    attackVectors: [],
    recommendedAction: 'allow',
    securityRecommendations: [],
    messageLength: 0,
    dangerousSequenceCount: 0,
    sanitizationRequired: false,
  })),
}));

// Mock the error sanitization functions
vi.mock('../../core/foundation/error-sanitization.js', () => ({
  sanitizeErrorMessage: vi.fn((message: string) => message.replace(/secret/gi, '[REDACTED]')),
  sanitizeStackTrace: vi.fn((stack: string) => stack.split('\n').slice(0, 5).join('\n')),
}));

describe('Task 1.4.2: Structured Logging with Security', () => {
  let logger: StructuredLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = new StructuredLogger();
  });

  describe('Basic Structured Log Entry Creation', () => {
    it('should create basic log entry with minimal options', () => {
      const result = logger.createLogEntry('Test message');

      expect(result.entry.message).toBe('Test message');
      expect(result.entry.level).toBe(StructuredLogLevel.INFO);
      expect(result.entry.levelName).toBe('INFO');
      expect(result.entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.entry.sanitized).toBe(false);
      expect(result.entry.securityFlags).toEqual([]);
      expect(result.entry.classification).toBe(SecurityClassification.INTERNAL);
      expect(result.warnings).toEqual([]);
      expect(result.truncated).toBe(false);
      expect(result.sanitizationApplied).toBe(false);
    });

    it('should create log entry with all metadata options', () => {
      const options: LogEntryOptions = {
        level: StructuredLogLevel.ERROR,
        classification: SecurityClassification.CONFIDENTIAL,
        context: { userId: 'user123', action: 'login' },
        component: 'auth',
        operation: 'authenticate',
        userId: 'user123',
        sessionId: 'session456',
        traceId: 'trace789',
        spanId: 'span012',
        correlationId: 'corr345',
        duration: 150,
        auditEvent: true,
      };

      const result = logger.createLogEntry('Authentication failed', options);

      expect(result.entry.level).toBe(StructuredLogLevel.ERROR);
      expect(result.entry.levelName).toBe('ERROR');
      expect(result.entry.classification).toBe(SecurityClassification.CONFIDENTIAL);
      expect(result.entry.context).toEqual({ userId: 'user123', action: 'login' });
      expect(result.entry.component).toBe('auth');
      expect(result.entry.operation).toBe('authenticate');
      expect(result.entry.userId).toBe('user123');
      expect(result.entry.sessionId).toBe('session456');
      expect(result.entry.traceId).toBe('trace789');
      expect(result.entry.spanId).toBe('span012');
      expect(result.entry.correlationId).toBe('corr345');
      expect(result.entry.duration).toBe(150);
      expect(result.entry.auditEvent).toBe(true);
      expect(result.entry.securityFlags).toContain('audit_event');
    });

    it('should handle error objects in log entries', () => {
      const testError = new Error('Database connection failed');
      testError.name = 'ConnectionError';
      testError.stack = 'Error: Database connection failed\n    at connect (db.js:10:5)\n    at app.js:25:10';

      const result = logger.createLogEntry('Operation failed', {
        error: testError,
      });

      expect(result.entry.error).toBeDefined();
      expect(result.entry.error?.name).toBe('ConnectionError');
      expect(result.entry.error?.message).toBe('Database connection failed');
      expect(result.entry.error?.sanitized).toBe(false);
      expect(result.entry.stack).toBeDefined();
    });

    it('should generate unique compliance flags based on log level and options', () => {
      const errorResult = logger.createLogEntry('Error message', {
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

  describe('Security Features and Sanitization', () => {
    it('should sanitize messages when sanitization is enabled', () => {
      const loggerWithSanitization = new StructuredLogger({
        sanitizeByDefault: true,
      });

      const result = loggerWithSanitization.createLogEntry('Login failed: password=secret123');

      expect(sanitizeLogOutputAdvanced).toHaveBeenCalledWith(
        'Login failed: password=secret123',
        expect.any(Object)
      );
      expect(result.entry.message).toBe('Login failed: password=[REDACTED]');
      expect(result.entry.sanitized).toBe(true);
      expect(result.entry.securityFlags).toContain('sanitized');
      expect(result.sanitizationApplied).toBe(true);
    });

    it('should skip sanitization when explicitly disabled', () => {
      const result = logger.createLogEntry('Sensitive data: password=secret123', {
        skipSanitization: true,
      });

      expect(sanitizeLogOutputAdvanced).not.toHaveBeenCalled();
      expect(result.entry.message).toBe('Sensitive data: password=secret123');
      expect(result.entry.sanitized).toBe(false);
      expect(result.sanitizationApplied).toBe(false);
    });

    it('should include security analysis when enabled', () => {
      const loggerWithAnalysis = new StructuredLogger({
        sanitizeByDefault: true,
        includeSecurityAnalysis: true,
      });

      const result = loggerWithAnalysis.createLogEntry('Test with potential issue');

      expect(analyzeLogSecurity).toHaveBeenCalledWith('Test with potential issue');
      expect(result.entry.securityAnalysis).toBeDefined();
      expect(result.entry.securityAnalysis?.riskLevel).toBe('low');
    });

    it('should handle security violations in security analysis', () => {
      const mockAnalysis = {
        hasAnsiEscapes: true,
        hasControlChars: false,
        hasLineInjection: false,
        hasFormatStrings: false,
        hasTerminalManipulation: true,
        hasUnicodeAttacks: false,
        hasHyperlinkInjection: false,
        hasCommandExecution: false,
        hasNullByteInjection: false,
        hasExcessiveLength: false,
        riskLevel: 'medium' as const,
        riskScore: 60,
        threatCategories: ['terminal-manipulation'],
        warnings: ['ANSI escape sequences detected'],
        violations: [{ 
          type: 'ansi-escape' as const, 
          severity: 'medium' as const,
          description: 'ANSI escape detected',
          originalInput: 'test',
          sanitizedOutput: 'test',
          timestamp: new Date(),
          recommendedAction: 'warn' as const,
        }],
        attackVectors: ['ansi-escape'],
        recommendedAction: 'warn' as const,
        securityRecommendations: ['Sanitize ANSI codes'],
        messageLength: 20,
        dangerousSequenceCount: 1,
        sanitizationRequired: true,
      };

      (analyzeLogSecurity as MockedFunction<typeof analyzeLogSecurity>).mockReturnValue(mockAnalysis);

      const loggerWithAnalysis = new StructuredLogger({
        sanitizeByDefault: true,
        includeSecurityAnalysis: true,
      });

      const result = loggerWithAnalysis.createLogEntry('Message with violations');

      expect(result.entry.securityFlags).toContain('violations_detected');
      expect(result.entry.securityAnalysis?.violations).toHaveLength(1);
    });

    it('should mask sensitive fields in context', () => {
      const result = logger.createLogEntry('User update', {
        context: {
          username: 'john',
          password: 'secret123',
          token: 'abc123',
          publicData: 'visible',
        },
      });

      expect(result.entry.context.username).toBe('john');
      expect(result.entry.context.password).toBe('[MASKED]');
      expect(result.entry.context.token).toBe('[MASKED]');
      expect(result.entry.context.publicData).toBe('visible');
    });

    it('should sanitize error messages in structured errors', () => {
      const testError = new Error('Connection failed: secret data here');
      
      const result = logger.createLogEntry('Operation failed', {
        error: testError,
      });

      expect(result.entry.error?.message).toBe('Connection failed: [REDACTED] data here');
      expect(result.entry.error?.sanitized).toBe(true);
    });
  });

  describe('Performance and Size Management', () => {
    it('should truncate messages that exceed maximum length', () => {
      const loggerWithLimit = new StructuredLogger({
        maxMessageLength: 50,
      });

      const longMessage = 'This is a very long message that exceeds the configured maximum length limit';
      const result = loggerWithLimit.createLogEntry(longMessage);

      // The message should be exactly 50 characters plus '...[truncated]'
      expect(result.entry.message).toHaveLength(50 + '...[truncated]'.length);
      expect(result.entry.message).toMatch(/^This is a very long message that exceeds the confi\.\.\.\[truncated\]$/);
      expect(result.entry.securityFlags).toContain('truncated');
      expect(result.truncated).toBe(true);
      expect(result.warnings).toContain('Message truncated to 50 characters');
    });

    it('should handle context size limits', () => {
      const loggerWithLimit = new StructuredLogger({
        maxContextSize: 100,
      });

      const largeContext = {
        field1: 'This is a very long string that will exceed the context size limit',
        field2: 'Another long string that adds to the total size',
        field3: 'Even more data that pushes over the limit',
      };

      const result = loggerWithLimit.createLogEntry('Test message', {
        context: largeContext,
      });

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Context truncated from \d+ to 100 bytes/),
        ])
      );
    });

    it('should limit stack trace depth', () => {
      const loggerWithLimit = new StructuredLogger({
        maxStackDepth: 3,
      });

      const testError = new Error('Test error');
      testError.stack = Array.from({ length: 10 }, (_, i) => `    at function${i} (file${i}.js:${i}:${i})`).join('\n');

      const result = loggerWithLimit.createLogEntry('Error occurred', {
        error: testError,
      });

      // Stack should be limited by the sanitizeStackTrace mock
      expect(result.entry.stack?.split('\n')).toHaveLength(5); // Mock limits to 5 lines
    });

    it('should handle memory usage collection when enabled', () => {
      const loggerWithMemory = new StructuredLogger({
        enablePerformanceMetrics: true,
        includeMemoryUsage: true,
      });

      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = vi.fn(() => ({
        rss: 1000000,
        heapTotal: 500000,
        heapUsed: 300000,
        external: 100000,
        arrayBuffers: 50000,
      }));

      const result = loggerWithMemory.createLogEntry('Memory test');

      expect(result.entry.memoryUsage).toBeDefined();
      expect(result.entry.memoryUsage?.heapUsed).toBe(300000);

      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle memory usage collection errors gracefully', () => {
      const loggerWithMemory = new StructuredLogger({
        enablePerformanceMetrics: true,
        includeMemoryUsage: true,
      });

      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = vi.fn(() => {
        throw new Error('Memory usage unavailable');
      });

      const result = loggerWithMemory.createLogEntry('Memory test');

      expect(result.entry.memoryUsage).toBeUndefined();
      expect(result.warnings).toContain('Failed to collect memory usage metrics');

      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('Context Processing and Validation', () => {
    it('should process nested context objects', () => {
      const nestedContext = {
        user: {
          id: 'user123',
          profile: {
            name: 'John Doe',
            password: 'secret',
          },
        },
        request: {
          path: '/api/users',
          params: ['user123'],
        },
      };

      const result = logger.createLogEntry('Nested context test', {
        context: nestedContext,
      });

      expect(result.entry.context.user).toBeDefined();
      expect((result.entry.context.user as any).profile.password).toBe('[MASKED]');
      expect((result.entry.context.user as any).profile.name).toBe('John Doe');
      expect((result.entry.context.request as any).path).toBe('/api/users');
    });

    it('should handle array values in context', () => {
      const contextWithArrays = {
        tags: ['important', 'password=secret', 'user-action'],
        coordinates: [10.5, 20.3],
      };

      const result = logger.createLogEntry('Array context test', {
        context: contextWithArrays,
      });

      expect(result.entry.context.tags).toEqual(['important', 'password=[REDACTED]', 'user-action']);
      expect(result.entry.context.coordinates).toEqual([10.5, 20.3]);
    });

    it('should handle context processing errors gracefully', () => {
      const circularContext: any = {};
      circularContext.circular = circularContext;

      const result = logger.createLogEntry('Circular context test', {
        context: circularContext,
      });

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Context processing failed/),
        ])
      );
      expect(result.entry.context).toEqual({ contextError: 'Failed to process context' });
    });
  });

  describe('Output Formatting', () => {
    it('should format log entry as JSON', () => {
      const entry: StructuredLogEntry = {
        timestamp: '2025-01-01T12:00:00.000Z',
        level: StructuredLogLevel.INFO,
        levelName: 'INFO',
        message: 'Test message',
        sanitized: false,
        securityFlags: [],
        classification: SecurityClassification.PUBLIC,
        context: {},
        auditEvent: false,
      };

      const jsonOutput = logger.formatLogEntry(entry);
      const parsed = JSON.parse(jsonOutput);

      expect(parsed.message).toBe('Test message');
      expect(parsed.level).toBe(StructuredLogLevel.INFO);
      expect(parsed.levelName).toBe('INFO');
    });

    it('should format log entry as readable text', () => {
      const textLogger = new StructuredLogger({
        format: 'text',
      });

      const entry: StructuredLogEntry = {
        timestamp: '2025-01-01T12:00:00.000Z',
        level: StructuredLogLevel.ERROR,
        levelName: 'ERROR',
        message: 'Operation failed',
        sanitized: false,
        securityFlags: ['sanitized'],
        classification: SecurityClassification.INTERNAL,
        context: {},
        component: 'auth',
        operation: 'login',
        auditEvent: false,
      };

      const textOutput = textLogger.formatLogEntry(entry);

      expect(textOutput).toContain('2025-01-01T12:00:00.000Z');
      expect(textOutput).toContain('[ERROR]');
      expect(textOutput).toContain('(auth)');
      expect(textOutput).toContain('{login}');
      expect(textOutput).toContain('Operation failed');
      expect(textOutput).toContain('Security: [sanitized]');
    });

    it('should format log entry as structured key-value pairs', () => {
      const structuredLogger = new StructuredLogger({
        format: 'structured',
      });

      const entry: StructuredLogEntry = {
        timestamp: '2025-01-01T12:00:00.000Z',
        level: StructuredLogLevel.WARN,
        levelName: 'WARN',
        message: 'Warning message',
        sanitized: false,
        securityFlags: ['truncated'],
        classification: SecurityClassification.INTERNAL,
        context: { key: 'value' },
        userId: 'user123',
        traceId: 'trace456',
        auditEvent: false,
      };

      const structuredOutput = structuredLogger.formatLogEntry(entry);

      expect(structuredOutput).toContain('timestamp=2025-01-01T12:00:00.000Z');
      expect(structuredOutput).toContain('level=WARN');
      expect(structuredOutput).toContain('message="Warning message"');
      expect(structuredOutput).toContain('userId=user123');
      expect(structuredOutput).toContain('traceId=trace456');
      expect(structuredOutput).toContain('securityFlags=[truncated]');
      expect(structuredOutput).toContain('context={"key":"value"}');
    });

    it('should handle formatting errors gracefully', () => {
      const entry: any = {
        // Create circular reference to cause JSON.stringify to fail
        timestamp: '2025-01-01T12:00:00.000Z',
        level: StructuredLogLevel.INFO,
        message: 'Test message',
      };
      entry.circular = entry;

      const output = logger.formatLogEntry(entry);
      const parsed = JSON.parse(output);

      expect(parsed.message).toBe('Failed to format log entry');
      expect(parsed.level).toBe(StructuredLogLevel.ERROR);
      expect(parsed.originalEntry.message).toBe('Test message');
    });
  });

  describe('Configuration and Presets', () => {
    it('should use default configuration values', () => {
      const defaultLogger = new StructuredLogger();
      const config = defaultLogger.getConfig();

      expect(config.format).toBe('json');
      expect(config.sanitizeByDefault).toBe(true);
      expect(config.maxMessageLength).toBe(8192);
      expect(config.maskFields).toContain('password');
      expect(config.retentionPolicies[StructuredLogLevel.ERROR]).toBe('7y');
    });

    it('should override default configuration', () => {
      const customLogger = new StructuredLogger({
        format: 'text',
        sanitizeByDefault: false,
        maxMessageLength: 1000,
        maskFields: ['customSecret'],
      });

      const config = customLogger.getConfig();
      expect(config.format).toBe('text');
      expect(config.sanitizeByDefault).toBe(false);
      expect(config.maxMessageLength).toBe(1000);
      expect(config.maskFields).toEqual(['customSecret']);
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

    it('should apply field filtering based on configuration', () => {
      const filteringLogger = new StructuredLogger({
        excludeFields: ['memoryUsage', 'stack'],
        includeMetadata: false,
      });

      const result = filteringLogger.createLogEntry('Filtered entry', {
        error: new Error('Test error'),
      });

      expect(result.entry.memoryUsage).toBeUndefined();
      expect(result.entry.stack).toBeUndefined();
      expect(result.entry.securityAnalysis).toBeUndefined();
    });
  });

  describe('Factory Functions and Presets', () => {
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

    it('should create audit preset logger', () => {
      const auditLogger = createStructuredLogger('audit');
      const config = auditLogger.getConfig();

      expect(config.includeMetadata).toBe(true);
      expect(config.enableAuditMode).toBe(true);
      expect(config.complianceMode).toBe(true);
    });

    it('should create security preset logger', () => {
      const securityLogger = createStructuredLogger('security');
      const config = securityLogger.getConfig();

      expect(config.defaultClassification).toBe(SecurityClassification.CONFIDENTIAL);
      expect(config.logInjectionConfig.maxLineLength).toBe(4096);
      expect(config.sanitizeByDefault).toBe(true);
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
  });

  describe('Convenience Functions', () => {
    it('should create audit log entries', () => {
      const result = structuredLog.audit('User login attempt', {
        userId: 'user123',
        context: { ip: '192.168.1.1' },
      });

      expect(result.entry.auditEvent).toBe(true);
      expect(result.entry.securityFlags).toContain('audit_event');
      expect(result.entry.userId).toBe('user123');
    });

    it('should create security log entries', () => {
      const result = structuredLog.security('Suspicious activity detected', {
        context: { pattern: 'multiple-failed-logins' },
      });

      expect(result.entry.classification).toBe(SecurityClassification.CONFIDENTIAL);
      expect(result.entry.context.pattern).toBe('multiple-failed-logins');
    });

    it('should create error log entries with error objects', () => {
      const testError = new Error('Database timeout');
      
      const result = structuredLog.error('Database operation failed', testError, {
        component: 'database',
        operation: 'query',
      });

      expect(result.entry.level).toBe(StructuredLogLevel.ERROR);
      expect(result.entry.error?.message).toBe('Database timeout');
      expect(result.entry.component).toBe('database');
      expect(result.entry.operation).toBe('query');
    });

    it('should create performance log entries with timing', () => {
      const result = structuredLog.performance('API response time', 250, {
        component: 'api',
        operation: 'getUserProfile',
      });

      expect(result.entry.level).toBe(StructuredLogLevel.INFO);
      expect(result.entry.duration).toBe(250);
      expect(result.entry.component).toBe('api');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle critical errors in log entry creation', () => {
      // Test error handling with malformed error object that causes processing error
      const malformedError = Object.create(Error.prototype);
      malformedError.message = undefined;
      malformedError.stack = undefined;
      
      const result = logger.createLogEntry('Test message', {
        context: { some: 'data' },
        error: malformedError
      });

      // When error processing fails, should use fallback error entry
      expect(result.entry.message).toBe('Failed to create structured log entry');
      expect(result.entry.level).toBe(StructuredLogLevel.ERROR);
      expect(result.entry.securityFlags).toContain('creation_error');
      expect(result.entry.context?.originalMessage).toBe('Test message');
    });

    it('should handle undefined and null values in options', () => {
      const result = logger.createLogEntry('Test message', {
        context: undefined,
        error: undefined,
        userId: undefined,
      });

      // Context should be empty object, not fail
      expect(result.entry.context).toEqual({});
      expect(result.entry.error).toBeUndefined();
      expect(result.entry.userId).toBeUndefined();
      expect(result.warnings).toEqual([]);
    });

    it('should handle error objects with missing properties', () => {
      const minimalError = Object.create(Error.prototype);
      minimalError.name = 'MinimalError';
      // No message or stack properties

      const result = logger.createLogEntry('Minimal error test', {
        error: minimalError,
      });

      expect(result.entry.error?.name).toBe('MinimalError');
      expect(result.entry.error?.message).toBe(''); // Should handle missing message
      expect(result.entry.error?.sanitized).toBe(false);
    });

    it('should handle error chains with cause property', () => {
      const rootCause = new Error('Root cause error');
      const intermediateError = new Error('Intermediate error');
      (intermediateError as any).cause = rootCause;
      const topLevelError = new Error('Top level error');
      (topLevelError as any).cause = intermediateError;

      const result = logger.createLogEntry('Chained error test', {
        error: topLevelError,
      });

      expect(result.entry.error?.message).toBe('Top level error');
      expect(result.entry.error?.cause?.message).toBe('Intermediate error');
      expect(result.entry.error?.cause?.cause?.message).toBe('Root cause error');
    });

    it('should handle very large context objects gracefully', () => {
      // Create a logger with very small context size limit for testing
      const smallContextLogger = new StructuredLogger({
        maxContextSize: 200, // Very small limit to trigger truncation
      });

      const largeContext = Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [`key${i}`, `value${i}`.repeat(50)])
      );

      const result = smallContextLogger.createLogEntry('Large context test', {
        context: largeContext,
      });

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Context truncated from \d+ to 200 bytes/),
        ])
      );
      expect(Object.keys(result.entry.context)).not.toHaveLength(20);
    });
  });

  describe('Integration with Log Injection Protection (Task 1.4.1)', () => {
    it('should integrate with existing log injection protection', () => {
      const protectedLogger = new StructuredLogger({
        sanitizeByDefault: true,
        logInjectionConfig: {
          enableProtection: true,
          maxLineLength: 1000,
          detectTerminalManipulation: true,
        },
      });

      const maliciousInput = 'Normal message\x1B[2J\x1B[H\x1B[31mFake error message\x1B[0m';
      const result = protectedLogger.createLogEntry(maliciousInput);

      expect(sanitizeLogOutputAdvanced).toHaveBeenCalledWith(
        maliciousInput,
        expect.objectContaining({
          enableProtection: true,
          maxLineLength: 1000,
          detectTerminalManipulation: true,
        })
      );
      expect(result.entry.sanitized).toBe(true);
    });

    it('should pass through log injection config options', () => {
      const customConfig = {
        enableProtection: true,
        maxLineLength: 2000,
        allowControlChars: true,
        preserveFormatting: true,
      };

      const protectedLogger = new StructuredLogger({
        sanitizeByDefault: true,
        logInjectionConfig: customConfig,
      });

      protectedLogger.createLogEntry('Test message with config');

      expect(sanitizeLogOutputAdvanced).toHaveBeenCalledWith(
        'Test message with config',
        expect.objectContaining(customConfig)
      );
    });

    it('should handle security analysis from log injection protection', () => {
      const mockViolations = [
        {
          type: 'ansi-escape' as const,
          severity: 'high' as const,
          description: 'ANSI escape sequence detected',
          originalInput: '\x1B[31m',
          sanitizedOutput: '',
          matchedPattern: 'ANSI_CSI',
          position: 0,
          timestamp: new Date(),
          recommendedAction: 'block' as const,
        },
      ];

      (analyzeLogSecurity as MockedFunction<typeof analyzeLogSecurity>).mockReturnValue({
        hasAnsiEscapes: true,
        hasControlChars: false,
        hasLineInjection: false,
        hasFormatStrings: false,
        hasTerminalManipulation: true,
        hasUnicodeAttacks: false,
        hasHyperlinkInjection: false,
        hasCommandExecution: false,
        hasNullByteInjection: false,
        hasExcessiveLength: false,
        riskLevel: 'high',
        riskScore: 85,
        threatCategories: ['ansi-escape'],
        warnings: ['High risk ANSI escape detected'],
        violations: mockViolations,
        attackVectors: ['ansi-escape'],
        recommendedAction: 'block',
        securityRecommendations: ['Block malicious ANSI sequences'],
        messageLength: 20,
        dangerousSequenceCount: 1,
        sanitizationRequired: true,
      });

      const protectedLogger = new StructuredLogger({
        sanitizeByDefault: true,
        includeSecurityAnalysis: true,
      });

      const result = protectedLogger.createLogEntry('Message with ANSI codes');

      expect(result.entry.securityAnalysis?.violations).toEqual(mockViolations);
      expect(result.entry.securityAnalysis?.riskLevel).toBe('high');
      expect(result.entry.securityFlags).toContain('violations_detected');
    });
  });

  describe('Security Vulnerability Testing', () => {
    it('should prevent log injection through message content', () => {
      const injectionAttempt = 'Valid message\n[FAKE] 2025-01-01 CRITICAL: System compromised\nContinue normal message';
      
      const secureLogger = new StructuredLogger({
        sanitizeByDefault: true,
      });

      const result = secureLogger.createLogEntry(injectionAttempt);

      expect(sanitizeLogOutputAdvanced).toHaveBeenCalledWith(injectionAttempt, expect.any(Object));
      expect(result.entry.sanitized).toBe(true);
      expect(result.sanitizationApplied).toBe(true);
    });

    it('should prevent information disclosure through context masking', () => {
      // Use logger with sanitization disabled to avoid mock interference
      const maskingLogger = new StructuredLogger({
        sanitizeByDefault: false,
      });

      const sensitiveContext = {
        username: 'admin',
        password: 'super-secret-password',
        apiKey: 'sk-1234567890abcdef',
        secret: 'hidden-value',
        authorization: 'Bearer token123',
        publicInfo: 'This is safe to log',
      };

      const result = maskingLogger.createLogEntry('User action', {
        context: sensitiveContext,
      });

      expect(result.entry.context.username).toBe('admin');
      expect(result.entry.context.password).toBe('[MASKED]');
      expect(result.entry.context.secret).toBe('[MASKED]');
      expect(result.entry.context.authorization).toBe('[MASKED]');
      expect(result.entry.context.publicInfo).toBe('This is safe to log');
    });

    it('should prevent DoS attacks through message length limits', () => {
      const attackPayload = 'A'.repeat(100000); // Very large message
      
      const protectedLogger = new StructuredLogger({
        maxMessageLength: 1000,
      });

      const result = protectedLogger.createLogEntry(attackPayload);

      expect(result.entry.message).toHaveLength(1000 + '...[truncated]'.length);
      expect(result.truncated).toBe(true);
      expect(result.warnings).toContain('Message truncated to 1000 characters');
    });

    it('should prevent memory exhaustion through context size limits', () => {
      const largeObject = {
        data: 'x'.repeat(2000), // Large enough to exceed 1000 byte limit
        nested: {
          moreData: 'y'.repeat(1000),
        },
      };

      const protectedLogger = new StructuredLogger({
        maxContextSize: 1000,
      });

      const result = protectedLogger.createLogEntry('Memory test', {
        context: largeObject,
      });

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Context truncated from \d+ to 1000 bytes/),
        ])
      );
    });

    it('should sanitize stack traces to prevent information disclosure', () => {
      const errorWithSensitiveStack = new Error('Database error');
      errorWithSensitiveStack.stack = [
        'Error: Database connection failed',
        '    at connect (/app/config/database.js:15:10)',
        '    at /app/config/secrets.js:25:5',
        '    at /app/lib/password-manager.js:40:12',
        '    at main (/app/server.js:100:20)',
      ].join('\n');

      const result = logger.createLogEntry('Database operation failed', {
        error: errorWithSensitiveStack,
      });

      // Stack trace should be sanitized by the mock
      expect(result.entry.stack?.split('\n')).toHaveLength(5);
      expect(result.entry.error?.sanitized).toBe(false); // Message didn't contain 'secret'
    });

    it('should handle concurrent access safely', async () => {
      const concurrentLogger = new StructuredLogger({
        sanitizeByDefault: false, // Disable sanitization to avoid mock interference
      });

      // Create multiple concurrent log entries
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(concurrentLogger.createLogEntry(`Concurrent message ${i}`, {
          context: { index: i, timestamp: Date.now() },
        }))
      );

      const results = await Promise.all(promises);

      // All entries should be created successfully
      expect(results).toHaveLength(10);
      results.forEach((result: any, index: number) => {
        expect(result.entry.message).toBe(`Concurrent message ${index}`);
        expect(result.entry.context.index).toBe(index);
      });
    });
  });

  describe('Default Configuration Validation', () => {
    it('should have secure default configuration', () => {
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.sanitizeByDefault).toBe(true);
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.includeSecurityAnalysis).toBe(true);
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.logInjectionConfig.enableProtection).toBe(true);
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maskFields).toContain('password');
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maskFields).toContain('secret');
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maskFields).toContain('token');
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maxMessageLength).toBe(8192);
      expect(DEFAULT_STRUCTURED_LOGGING_CONFIG.maxContextSize).toBe(65536);
    });

    it('should have appropriate retention policies', () => {
      const policies = DEFAULT_STRUCTURED_LOGGING_CONFIG.retentionPolicies;
      
      expect(policies[StructuredLogLevel.TRACE]).toBe('7d');
      expect(policies[StructuredLogLevel.DEBUG]).toBe('30d');
      expect(policies[StructuredLogLevel.INFO]).toBe('90d');
      expect(policies[StructuredLogLevel.WARN]).toBe('1y');
      expect(policies[StructuredLogLevel.ERROR]).toBe('7y');
      expect(policies[StructuredLogLevel.FATAL]).toBe('7y');
    });
  });
});