/**
 * Security tests for Error Message Content Disclosure mitigation
 * Tests protection against sensitive information leakage in error messages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createCLI,
  sanitizeErrorMessage,
  sanitizeStackTrace,
  isDebugMode,
  shouldShowDetailedErrors,
  formatErrorForDisplay
} from '../../core/createCLI.js';

describe('Error Message Content Disclosure Security', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalNodeEnv = process.env.NODE_ENV;
    
    // Prevent actual process.exit during tests
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    // Mock console to capture output
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original environment
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Direct Sanitization Function Tests', () => {
    describe('Password and Secret Sanitization', () => {
      it('should sanitize various password patterns', () => {
        const testCases = [
          { input: 'Connection failed: password=secret123', pattern: 'secret123' },
          { input: 'Error: passwd=mypassword and more', pattern: 'mypassword' },
          { input: 'Config: PASSWORD:admin123', pattern: 'admin123' },
          { input: 'Auth failed: secret=topsecret', pattern: 'topsecret' },
          { input: 'Key error: private_key=rsa-key-data', pattern: 'rsa-key-data' },
          { input: 'SSH: private-key:ssh-content', pattern: 'ssh-content' }
        ];

        testCases.forEach(({ input, pattern }) => {
          const result = sanitizeErrorMessage(input);
          expect(result).toContain('***');
          expect(result).not.toContain(pattern);
        });
      });

      it('should sanitize API keys and tokens', () => {
        const sensitiveMessage = `API Error: 
          token=abc-xyz-789 
          api_key=sk-1234567890 
          access_token=bearer-token-data 
          bearer=jwt-token-here 
          authorization=Basic YWRtaW46cGFzc3dvcmQ=`;

        const result = sanitizeErrorMessage(sensitiveMessage);
        
        // Should not contain actual token values
        expect(result).not.toContain('abc-xyz-789');
        expect(result).not.toContain('sk-1234567890');
        expect(result).not.toContain('bearer-token-data');
        expect(result).not.toContain('jwt-token-here');
        expect(result).not.toContain('YWRtaW46cGFzc3dvcmQ=');
        
        // Should contain sanitized versions
        expect(result).toContain('token=***');
        expect(result).toContain('api_key=***');
        expect(result).toContain('access_token=***');
        expect(result).toContain('bearer=***');
        expect(result).toContain('authorization=***');
      });
    });

    describe('Database Connection Sanitization', () => {
      it('should sanitize database connection strings', () => {
        const dbUrls = [
          'mongodb://user:pass@host:27017/database',
          'mysql://admin:secret@localhost:3306/mydb',
          'postgres://user:password@db.example.com:5432/app',
          'redis://user:pass@cache.internal:6379/0'
        ];

        dbUrls.forEach(dbUrl => {
          const errorMessage = `Database connection failed: ${dbUrl}`;
          const result = sanitizeErrorMessage(errorMessage);
          
          // Should not contain actual credentials
          expect(result).not.toContain('user:pass@');
          expect(result).not.toContain('admin:secret@');
          expect(result).not.toContain('user:password@');
          
          // Should sanitize to generic pattern
          expect(result).toContain('://***');
        });
      });

      it('should sanitize individual database credentials', () => {
        const dbConfigError = 'Config error: host=db.internal database=production_db user=admin port=5432';
        const result = sanitizeErrorMessage(dbConfigError);
        
        // Should sanitize individual components
        expect(result).toContain('host=***');
        expect(result).toContain('database=***');
        expect(result).toContain('user=***');
        expect(result).toContain('port=***');
      });
    });

    describe('File Path Sanitization', () => {
      it('should sanitize user home directory paths', () => {
        const pathErrors = [
          'File not found: /Users/john.doe/secret-project/config.json',
          'Access denied: C:\\Users\\Administrator\\sensitive\\data.txt',
          'Permission error: /home/admin/private/keys.pem'
        ];

        pathErrors.forEach(pathError => {
          const result = sanitizeErrorMessage(pathError);
          
          // Should not expose actual usernames
          expect(result).not.toContain('john.doe');
          expect(result).not.toContain('Administrator');
          expect(result).not.toContain('admin');
          
          // Should use generic placeholders
          const hasUserPlaceholder = result.includes('/Users/***/') ||
                                   result.includes('C:\\Users\\***\\') ||
                                   result.includes('/home/***/');
          expect(hasUserPlaceholder).toBe(true);
        });
      });
    });

    describe('Personal Information Sanitization', () => {
      it('should sanitize email addresses', () => {
        const emailError = 'Authentication failed for user john.doe@company.com and admin@internal.local';
        const result = sanitizeErrorMessage(emailError);
        
        // Should not contain actual email addresses
        expect(result).not.toContain('john.doe@company.com');
        expect(result).not.toContain('admin@internal.local');
        
        // Should contain sanitized versions
        expect(result).toContain('***@***.***');
      });

      it('should sanitize financial information', () => {
        const financialError = 'Payment failed for card 4532 1234 5678 9012 and SSN 123-45-6789';
        const result = sanitizeErrorMessage(financialError);
        
        // Should not contain actual card or SSN numbers
        expect(result).not.toContain('4532 1234 5678 9012');
        expect(result).not.toContain('123-45-6789');
        
        // Should contain sanitized versions
        expect(result).toContain('****-****-****-****');
        expect(result).toContain('***-**-****');
      });

      it('should sanitize IP addresses and network information', () => {
        const networkError = 'Connection timeout to 192.168.1.100 on port=22';
        const result = sanitizeErrorMessage(networkError);
        
        // Should not contain actual IP addresses or ports
        expect(result).not.toContain('192.168.1.100');
        expect(result).not.toContain('port=22');
        
        // Should contain sanitized versions
        expect(result).toContain('***.***.***.***');
        expect(result).toContain('port=***');
      });
    });

    describe('Injection Attack Protection', () => {
      it('should remove HTML/XML tags from error messages', () => {
        const injectionError = 'Error: <script>alert("XSS")</script> and <img src="x" onerror="alert(1)">';
        const result = sanitizeErrorMessage(injectionError);
        
        // Should not contain HTML tags
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('<img');
        expect(result).not.toContain('onerror=');
        expect(result).not.toContain('alert("XSS")');
        expect(result).not.toContain('alert(1)');
      });

      it('should remove control characters from error messages', () => {
        const controlCharError = 'Error with \x00null byte and \x1b[31mANSI escape\x1b[0m';
        const result = sanitizeErrorMessage(controlCharError);
        
        // Should not contain control characters
        expect(result).not.toContain('\x00');
        expect(result).not.toContain('\x1b[31m');
        expect(result).not.toContain('\x1b[0m');
      });
    });

    describe('Message Length Protection', () => {
      it('should limit error message length to prevent DoS', () => {
        // Create extremely long error message
        const longMessage = 'Error: ' + 'A'.repeat(10000);
        const result = sanitizeErrorMessage(longMessage);
        
        // Should be truncated to reasonable length (500 chars max)
        expect(result.length).toBeLessThanOrEqual(500);
      });
    });

    describe('Generic Sensitive Pattern Detection', () => {
      it('should detect and sanitize generic sensitive patterns', () => {
        const genericError = 'Config error: "sk-live-abc123" and \'pk-test-xyz789\' not found';
        const result = sanitizeErrorMessage(genericError);
        
        // Should sanitize quoted keys/tokens
        expect(result).not.toContain('sk-live-abc123');
        expect(result).not.toContain('pk-test-xyz789');
        expect(result).toContain('"***"');
      });

      it('should handle mixed case and various separators', () => {
        const mixedCaseError = 'Error: API_KEY=secret TOKEN:value SECRET-data pwd=pass';
        const result = sanitizeErrorMessage(mixedCaseError);
        
        // Should sanitize regardless of case and separators
        expect(result).not.toContain('secret');
        expect(result).not.toContain('value');
        expect(result).not.toContain('data');
        expect(result).not.toContain('pass');
        
        expect(result).toContain('API_KEY=***');
        expect(result).toContain('TOKEN=***');
        expect(result).toContain('SECRET=***');
        expect(result).toContain('pwd=***');
      });
    });
  });

  describe('Environment Mode Detection', () => {
    it('should detect debug mode correctly', () => {
      process.env.NODE_ENV = 'development';
      process.env.DEBUG = '1';
      expect(isDebugMode()).toBe(true);

      process.env.NODE_ENV = 'production';
      delete process.env.DEBUG;
      expect(isDebugMode()).toBe(false);
    });

    it('should determine when to show detailed errors', () => {
      process.env.NODE_ENV = 'development';
      expect(shouldShowDetailedErrors()).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(shouldShowDetailedErrors()).toBe(false);
    });
  });

  describe('Stack Trace Sanitization', () => {
    it('should sanitize file paths in stack traces', () => {
      const stackTrace = `Error: Test
        at Object.test (/Users/john.doe/project/src/file.js:10:5)
        at process.processTicksAndRejections (node:internal/process/task_queues.js:93:5)
        at C:\\Users\\Administrator\\project\\src\\main.js:15:10`;
      
      const result = sanitizeStackTrace(stackTrace);
      
      // Should not contain actual user paths
      expect(result).not.toContain('john.doe');
      expect(result).not.toContain('Administrator');
      
      // Should use generic placeholders
      expect(result).toContain('/Users/***/');
      expect(result).toContain('C:\\Users\\***\\');
    });

    it('should limit stack trace depth in production', () => {
      process.env.NODE_ENV = 'production';
      
      const longStackTrace = Array.from({ length: 20 }, (_, i) => 
        `    at function${i} (/path/to/file${i}.js:${i}:${i})`
      ).join('\n');
      
      const result = sanitizeStackTrace(`Error: Test\n${longStackTrace}`);
      
      // Should limit stack trace lines
      const lines = result.split('\n');
      expect(lines.length).toBeLessThanOrEqual(10); // Reasonable limit
    });
  });

  describe('Integration Tests', () => {
    it('should create CLI without exposing implementation details in help', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI for security validation',
        commandsPath: './non-existent',
        skipArgvParsing: true
      });

      const helpText = program.helpInformation();
      
      // Should not contain internal function names or file paths
      expect(helpText).not.toContain('sanitizeErrorMessage');
      expect(helpText).not.toContain('formatErrorForDisplay');
      expect(helpText).not.toContain(__filename);
    });

    it('should handle error formatting consistently', () => {
      process.env.NODE_ENV = 'production';
      
      const testError = new Error('Database connection failed: postgres://admin:secret@db.internal:5432/prod');
      const formatted = formatErrorForDisplay(testError);
      
      // Should sanitize sensitive information in formatted output
      expect(formatted).not.toContain('admin:secret@');
      expect(formatted).toContain('://***');
    });
  });
});
