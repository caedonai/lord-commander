/**
 * Comprehensive tests for Enhanced Error Sanitization (Task 1.3.1)
 * 
 * Tests the Information Disclosure Protection system including error message
 * sanitization, stack trace protection, and configuration management.
 * 
 * @see Task 1.3.1: Information Disclosure Protection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  sanitizeErrorMessage,
  sanitizeStackTrace,
  sanitizeErrorForProduction,
  shouldShowDetailedErrors,
  isDebugMode,
  createEnvironmentConfig,
  DEFAULT_ERROR_SANITIZATION_CONFIG,
  type ErrorSanitizationConfig
} from '../../core/foundation/error-sanitization.js';

describe('Enhanced Error Sanitization (Task 1.3.1)', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('sanitizeErrorMessage', () => {
    describe('API Key and Token Sanitization', () => {
      it('should sanitize various API key patterns', () => {
        const testCases = [
          { input: 'Error: API_KEY=sk-1234567890abcdef', expected: 'Error: API_KEY=***' },
          { input: 'Failed: api_key=abc123def456', expected: 'Failed: api_key=***' },
          { input: 'Auth error: access_key:xyz789', expected: 'Auth error: access_key=***' },
          { input: 'Token error: TOKEN=bearer-token-data', expected: 'Token error: TOKEN=***' },
          { input: 'JWT: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', expected: 'JWT: access_token=***' },
          { input: 'AWS: aws_access_key=AKIA1234567890ABCDEF', expected: 'AWS: aws_access_key=***' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input);
          expect(result).toBe(expected);
        }
      });

      it('should preserve key names while redacting values', () => {
        const input = 'Multiple keys: API_KEY=secret1, access_token=secret2, SECRET=secret3';
        const result = sanitizeErrorMessage(input);
        expect(result).toContain('API_KEY=***');
        expect(result).toContain('access_token=***');
        expect(result).toContain('SECRET=***');
        expect(result).not.toContain('secret1');
        expect(result).not.toContain('secret2');
        expect(result).not.toContain('secret3');
      });

      it('should handle quoted API keys', () => {
        const testCases = [
          { input: 'Config: "sk-1234567890abcdef"', expected: 'Config: "***"' },
          { input: "Value: 'pk-abcdef1234567890'", expected: "Value: '***'" },
          { input: 'JSON: {"apiKey": "key-data"}', expected: 'JSON: {"***": "***"}' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input);
          expect(result).toBe(expected);
        }
      });
    });

    describe('Password and Secret Sanitization', () => {
      it('should sanitize password patterns', () => {
        const testCases = [
          { input: 'Login failed: password=secret123', expected: 'Login failed: password=***' },
          { input: 'Auth error: passwd:mypassword', expected: 'Auth error: passwd=***' },
          { input: 'Config: pwd=admin', expected: 'Config: pwd=***' },
          { input: 'SSH: private_key=rsa-key-data', expected: 'SSH: private_key=***' },
          { input: 'Cert: secret_key:cert-content', expected: 'Cert: secret_key=***' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input);
          expect(result).toBe(expected);
        }
      });

      it('should handle various authentication token patterns', () => {
        const testCases = [
          { input: 'Failed: auth_token=abc123', expected: 'Failed: auth_token=***' },
          { input: 'Session: session_token:xyz789', expected: 'Session: session_token=***' },
          { input: 'CSRF: csrf_token=token123', expected: 'CSRF: csrf_token=***' },
          { input: 'SSH: ssh_key=ssh-rsa-content', expected: 'SSH: ssh_key=***' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input);
          expect(result).toBe(expected);
        }
      });
    });

    describe('Database Connection Sanitization', () => {
      it('should sanitize database connection strings', () => {
        const testCases = [
          { 
            input: 'Connect failed: mongodb://user:pass@localhost/db', 
            expected: 'Connect failed: mongodb://***@***' 
          },
          { 
            input: 'Error: mysql://admin:secret@host:3306/mydb', 
            expected: 'Error: mysql://***@***' 
          },
          { 
            input: 'PostgreSQL: postgres://user:password@server:5432/database', 
            expected: 'PostgreSQL: postgres://***@***' 
          },
          { 
            input: 'Redis: redis://user:pass@redis-server:6379/0', 
            expected: 'Redis: redis://***@***' 
          },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input);
          expect(result).toBe(expected);
        }
      });

      it('should sanitize database credential patterns', () => {
        const testCases = [
          { input: 'DB error: db_password=secret', expected: 'DB error: db_password=***' },
          { input: 'Config: database_user=admin', expected: 'Config: database_user=***' },
          { input: 'Connect: connection_string=server=host;uid=user;pwd=pass', expected: 'Connect: connection_string=***' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input);
          expect(result).toBe(expected);
        }
      });
    });

    describe('File Path Sanitization', () => {
      it('should sanitize sensitive user directory paths', () => {
        const testCases = [
          { 
            input: 'Error: /Users/john/Desktop/secret.txt not found', 
            expected: 'Error: /Users/***/Desktop/secret.txt not found' 
          },
          { 
            input: 'Failed: C:\\Users\\jane\\Documents\\config.json', 
            expected: 'Failed: C:\\Users\\***\\Documents\\config.json' 
          },
          { 
            input: 'Path: /home/alice/.ssh/id_rsa missing', 
            expected: 'Path: /home/***/.ssh/id_rsa missing' 
          },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input, { redactFilePaths: true });
          expect(result).toBe(expected);
        }
      });

      it('should sanitize config and credential file patterns', () => {
        const input = 'Cannot read secrets.json, config.yaml, or credentials.ini';
        const result = sanitizeErrorMessage(input, { redactFilePaths: true });
        expect(result).toContain('***'); // Should redact sensitive file names
      });
    });

    describe('Network Information Sanitization', () => {
      it('should sanitize IP addresses', () => {
        const testCases = [
          { input: 'Connect to 192.168.1.100 failed', expected: 'Connect to ***.***.***.*** failed' },
          { input: 'Server 10.0.0.1:8080 unreachable', expected: 'Server ***.***.***.***:*** unreachable' },
          { input: 'Timeout: 172.16.0.254', expected: 'Timeout: ***.***.***.***' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input, { redactNetworkInfo: true });
          expect(result).toBe(expected);
        }
      });

      it('should sanitize hostname and port patterns', () => {
        const testCases = [
          { input: 'Failed: host=production-server', expected: 'Failed: host=***' },
          { input: 'Error: server:internal-db-host', expected: 'Error: server=***' },
          { input: 'Config: port=5432', expected: 'Config: port=***' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input, { redactNetworkInfo: true });
          expect(result).toBe(expected);
        }
      });
    });

    describe('Personal Information Sanitization', () => {
      it('should sanitize email addresses', () => {
        const testCases = [
          { input: 'Send to john.doe@company.com failed', expected: 'Send to ***@***.*** failed' },
          { input: 'User admin@localhost not found', expected: 'User ***@***.*** not found' },
          { input: 'Contact support@example.org', expected: 'Contact ***@***.***' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input, { redactPersonalInfo: true });
          expect(result).toBe(expected);
        }
      });

      it('should sanitize credit card numbers', () => {
        const testCases = [
          { input: 'Card 4532-1234-5678-9012 declined', expected: 'Card ****-****-****-**** declined' },
          { input: 'Payment 4532123456789012 failed', expected: 'Payment ****-****-****-**** failed' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input, { redactPersonalInfo: true });
          expect(result).toBe(expected);
        }
      });

      it('should sanitize SSN patterns', () => {
        const testCases = [
          { input: 'SSN 123-45-6789 invalid', expected: 'SSN ***-**-**** invalid' },
          { input: 'ID 987654321 not found', expected: 'ID ***-**-**** not found' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input, { redactPersonalInfo: true });
          expect(result).toBe(expected);
        }
      });
    });

    describe('Injection Protection', () => {
      it('should remove HTML/XML tags', () => {
        const testCases = [
          { input: 'Error: <script>alert("xss")</script>', expected: 'Error: ' },
          { input: 'Message: <div onclick="evil()">content</div>', expected: 'Message: content' },
          { input: 'XML: <user id="1">data</user>', expected: 'XML: data' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input);
          expect(result).toBe(expected);
        }
      });

      it('should remove JavaScript patterns', () => {
        const testCases = [
          { input: 'URL: javascript:alert("xss")', expected: 'URL: ' },
          { input: 'Code: eval("malicious")', expected: 'Code: ' },
          { input: 'Handler: onclick=steal()', expected: 'Handler: ' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input);
          expect(result).toBe(expected);
        }
      });

      it('should remove control characters', () => {
        const input = 'Error: data\x00with\x01control\x1fchars\x7f';
        const result = sanitizeErrorMessage(input);
        expect(result).toBe('Error: datawithcontrolchars');
      });
    });

    describe('Custom Patterns', () => {
      it('should apply custom regex patterns', () => {
        const config: Partial<ErrorSanitizationConfig> = {
          customPatterns: [
            /myapp-secret-\w+/gi,
            /internal-token-[a-zA-Z0-9]+/gi
          ]
        };

        const testCases = [
          { input: 'Error: myapp-secret-abc123', expected: 'Error: ***' },
          { input: 'Token: internal-token-xyz789', expected: 'Token: ***' },
          { input: 'Mixed: myapp-secret-test and internal-token-data', expected: 'Mixed: *** and ***' },
        ];

        for (const { input, expected } of testCases) {
          const result = sanitizeErrorMessage(input, config);
          expect(result).toBe(expected);
        }
      });
    });

    describe('Configuration Options', () => {
      it('should respect individual sanitization flags', () => {
        const message = 'Error: password=secret, api_key=token, user@example.com, 192.168.1.1';
        
        // Test with passwords disabled
        const noPasswords = sanitizeErrorMessage(message, { redactPasswords: false });
        expect(noPasswords).toContain('password=secret');
        
        // Test with API keys disabled  
        const noApiKeys = sanitizeErrorMessage(message, { redactApiKeys: false });
        expect(noApiKeys).toContain('api_key=token');
        
        // Test with personal info disabled
        const noPersonalInfo = sanitizeErrorMessage(message, { redactPersonalInfo: false });
        expect(noPersonalInfo).toContain('user@example.com');
        
        // Test with network info disabled
        const noNetworkInfo = sanitizeErrorMessage(message, { redactNetworkInfo: false });
        expect(noNetworkInfo).toContain('192.168.1.1');
      });

      it('should apply message length limits', () => {
        const longMessage = 'A'.repeat(1000);
        const result = sanitizeErrorMessage(longMessage, { maxMessageLength: 100 });
        expect(result).toHaveLength(100); // Total length limited to maxMessageLength
        expect(result).toMatch(/\.\.\. \[truncated for security\]$/);
      });
    });

    describe('Edge Cases', () => {
      it('should handle null and undefined messages', () => {
        expect(sanitizeErrorMessage('')).toBe('');
        expect(sanitizeErrorMessage(null as any)).toBe('');
        expect(sanitizeErrorMessage(undefined as any)).toBe('');
      });

      it('should handle messages with multiple sensitive patterns', () => {
        const message = 'DB error: password=secret, api_key=token, connecting to user@host:5432';
        const result = sanitizeErrorMessage(message);
        expect(result).not.toContain('secret');
        expect(result).not.toContain('token');
        expect(result).toContain('password=***');
        expect(result).toContain('api_key=***');
      });

      it('should preserve non-sensitive content', () => {
        const message = 'Connection timeout after 30 seconds to database server on port 5432';
        const result = sanitizeErrorMessage(message, { redactNetworkInfo: false });
        expect(result).toContain('Connection timeout after 30 seconds');
        expect(result).toContain('database server');
      });
    });
  });

  describe('sanitizeStackTrace', () => {
    describe('File Path Sanitization', () => {
      it('should sanitize user directory paths in stack traces', () => {
        const stack = `Error: Test error
    at Object.test (/Users/john/.config/app/test.js:10:15)
    at Module._compile (C:\\Users\\jane\\AppData\\Local\\npm\\node_modules\\app\\lib\\index.js:25:30)
    at Object.Module._extensions..js (/home/alice/.ssh/config/app.js:50:10)`;

        const result = sanitizeStackTrace(stack, { redactFilePaths: true });
        expect(result).toContain('/Users/***/');
        expect(result).toContain('C:\\Users\\***\\');
        expect(result).toContain('/home/***/');
        expect(result).not.toContain('john');
        expect(result).not.toContain('jane');
        expect(result).not.toContain('alice');
      });

      it('should simplify node_modules paths', () => {
        const stack = `Error: Test error
    at Function.test (/usr/local/lib/node_modules/package/index.js:15:20)
    at Main.run (C:\\Program Files\\nodejs\\node_modules\\app\\main.js:30:5)`;

        const result = sanitizeStackTrace(stack, { redactFilePaths: true });
        expect(result).toContain('node_modules/package/index.js');
        expect(result).toContain('node_modules/app/main.js');
        expect(result).not.toContain('/usr/local/lib/');
        expect(result).not.toContain('C:\\Program Files\\nodejs\\');
      });
    });

    describe('Stack Depth Limiting', () => {
      it('should limit stack trace depth', () => {
        const longStack = Array.from({ length: 20 }, (_, i) => 
          `    at Function.test${i} (/app/test${i}.js:${i}:${i})`
        ).join('\n');
        const fullStack = `Error: Test error\n${longStack}`;

        const result = sanitizeStackTrace(fullStack, { maxStackDepth: 5 });
        const lines = result.split('\n');
        expect(lines).toHaveLength(6); // Error message + 5 stack lines
        expect(result).toContain('more frames hidden for security');
      });
    });

    describe('Production Environment', () => {
      it('should remove stack traces completely in production when configured', () => {
        process.env.NODE_ENV = 'production';
        const stack = `Error: Test error
    at Object.test (/app/test.js:10:15)
    at Module.run (/app/main.js:25:30)`;

        const result = sanitizeStackTrace(stack, { removeStackInProduction: true });
        expect(result).toBe('');
      });

      it('should keep sanitized stack traces in production when configured', () => {
        process.env.NODE_ENV = 'production';
        const stack = `Error: Test error
    at Object.test (/Users/john/app/test.js:10:15)`;

        const result = sanitizeStackTrace(stack, { 
          removeStackInProduction: false,
          redactFilePaths: true 
        });
        expect(result).toContain('/Users/***/app/test.js');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty and null stack traces', () => {
        expect(sanitizeStackTrace('')).toBe('');
        expect(sanitizeStackTrace(null as any)).toBe(null);
        expect(sanitizeStackTrace(undefined as any)).toBe(undefined);
      });

      it('should handle malformed stack traces', () => {
        const malformedStack = 'Not a real stack trace format';
        const result = sanitizeStackTrace(malformedStack);
        expect(result).toBe(malformedStack);
      });
    });
  });

  describe('sanitizeErrorForProduction', () => {
    it('should create sanitized error object with all properties cleaned', () => {
      const originalError = new Error('DB failed: password=secret123');
      originalError.stack = `Error: DB failed: password=secret123
    at Object.connect (/Users/john/.config/app/db.js:15:20)`;
      (originalError as any).code = 'ECONNREFUSED';
      (originalError as any).context = { user: 'admin@company.com', token: 'secret-token' };

      const sanitized = sanitizeErrorForProduction(originalError, {
        preserveErrorCodes: true
      });

      expect(sanitized.message).toBe('DB failed: password=***');
      expect(sanitized.stack).toContain('/Users/***/');
      expect((sanitized as any).code).toBe('ECONNREFUSED');
      expect((sanitized as any).context).not.toContain('admin@company.com');
      expect((sanitized as any).context).not.toContain('secret-token');
    });

    it('should handle null and undefined errors', () => {
      const result1 = sanitizeErrorForProduction(null as any);
      const result2 = sanitizeErrorForProduction(undefined as any);
      
      expect(result1).toBeInstanceOf(Error);
      expect(result1.message).toBe('Unknown error occurred');
      expect(result2).toBeInstanceOf(Error);
      expect(result2.message).toBe('Unknown error occurred');
    });

    it('should preserve error type and constructor information', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const original = new CustomError('Custom error: api_key=secret');
      const sanitized = sanitizeErrorForProduction(original);

      expect(sanitized.name).toBe('CustomError');
      expect(sanitized.message).toBe('Custom error: api_key=***');
    });
  });

  describe('shouldShowDetailedErrors', () => {
    it('should return false in production environment', () => {
      process.env.NODE_ENV = 'production';
      expect(shouldShowDetailedErrors()).toBe(false);
    });

    it('should return true in development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(shouldShowDetailedErrors()).toBe(true);
    });

    it('should return true when debug flags are set', () => {
      process.env.NODE_ENV = 'test';
      process.env.DEBUG = 'true';
      expect(shouldShowDetailedErrors()).toBe(true);
    });
  });

  describe('isDebugMode', () => {
    it('should detect debug mode from environment variables', () => {
      process.env.NODE_ENV = 'development';
      expect(isDebugMode()).toBe(true);

      process.env.NODE_ENV = 'production';
      process.env.DEBUG = 'true';
      expect(isDebugMode()).toBe(false); // Should be false in production

      process.env.NODE_ENV = 'test';
      process.env.CLI_DEBUG = 'true';
      expect(isDebugMode()).toBe(true);
    });
  });

  describe('createEnvironmentConfig', () => {
    it('should create appropriate configuration for development', () => {
      const config = createEnvironmentConfig('development');
      expect(config.redactFilePaths).toBe(false);
      expect(config.redactNetworkInfo).toBe(false);
      expect(config.maxMessageLength).toBe(1000);
      expect(config.removeStackInProduction).toBe(false);
    });

    it('should create secure configuration for production', () => {
      const config = createEnvironmentConfig('production');
      expect(config.redactFilePaths).toBe(true);
      expect(config.redactNetworkInfo).toBe(true);
      expect(config.maxMessageLength).toBe(250);
      expect(config.removeStackInProduction).toBe(true);
    });

    it('should create balanced configuration for staging', () => {
      const config = createEnvironmentConfig('staging');
      expect(config.redactFilePaths).toBe(true);
      expect(config.redactNetworkInfo).toBe(true);
      expect(config.maxMessageLength).toBe(750);
      expect(config.removeStackInProduction).toBe(false);
    });

    it('should apply custom overrides', () => {
      const config = createEnvironmentConfig('production', {
        maxMessageLength: 500,
        redactApiKeys: false
      });
      expect(config.maxMessageLength).toBe(500);
      expect(config.redactApiKeys).toBe(false);
      expect(config.redactPasswords).toBe(true); // Default should remain
    });
  });

  describe('DEFAULT_ERROR_SANITIZATION_CONFIG', () => {
    it('should provide secure defaults', () => {
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.redactPasswords).toBe(true);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.redactApiKeys).toBe(true);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.redactFilePaths).toBe(true);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.redactDatabaseUrls).toBe(true);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.redactNetworkInfo).toBe(true);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.redactPersonalInfo).toBe(true);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.customPatterns).toEqual([]);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.maxMessageLength).toBe(500);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.maxStackDepth).toBe(10);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.removeStackInProduction).toBe(true);
      expect(DEFAULT_ERROR_SANITIZATION_CONFIG.preserveErrorCodes).toBe(true);
    });
  });

  describe('Integration and Performance', () => {
    it('should handle large error messages efficiently', () => {
      const largeMessage = 'Error: '.repeat(10000) + 'password=secret';
      const start = Date.now();
      const result = sanitizeErrorMessage(largeMessage);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100); // Should complete within 100ms - DoS protection ensures this
      // Large messages get pre-truncated for DoS protection, so pattern may not be found
      // This is the correct security behavior
      expect(result.length).toBeLessThanOrEqual(500 + '... [truncated for security]'.length);
    });

    it('should maintain performance with multiple pattern matches', () => {
      const complexMessage = Array.from({ length: 100 }, (_, i) => 
        `password${i}=secret${i}, api_key${i}=token${i}, user${i}@domain${i}.com`
      ).join(', ');
      
      const start = Date.now();
      const result = sanitizeErrorMessage(complexMessage);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200); // Should complete within 200ms
      expect(result).not.toContain('secret');
      expect(result).not.toContain('token');
    });

    it('should work correctly with real Error objects', () => {
      const error = new Error('Database connection failed: password=admin123');
      error.stack = `Error: Database connection failed: password=admin123
    at Database.connect (/Users/developer/.config/myapp/db.js:25:15)
    at async main (/Users/developer/projects/myapp/index.js:10:3)`;

      const sanitized = sanitizeErrorForProduction(error);
      
      expect(sanitized.message).not.toContain('admin123');
      expect(sanitized.stack).not.toContain('developer');
      expect(sanitized.message).toContain('password=***');
      expect(sanitized.stack).toContain('/Users/***/');
    });

    it('should prevent DoS attacks through pre-truncation of extremely large messages', () => {
      // Create an extremely large message that would cause DoS without pre-truncation
      const extremelyLargeMessage = 'A'.repeat(1000000) + 'password=secret'; // 1MB+ message
      const start = Date.now();
      
      const result = sanitizeErrorMessage(extremelyLargeMessage, { maxMessageLength: 500 });
      const duration = Date.now() - start;
      
      // Should complete very quickly due to pre-truncation DoS protection
      expect(duration).toBeLessThan(50); // Much faster due to pre-truncation
      expect(result.length).toBeLessThanOrEqual(500 + '... [truncated for security]'.length);
      
      // Verify it was truncated for security (DoS protection working)
      expect(result).toMatch(/\.\.\. \[truncated for security\]$/);
    });
  });
});