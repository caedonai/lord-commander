import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateErrorHandler, executeErrorHandlerSafely, ErrorHandlerValidationError } from '../core/createCLI.js';

describe('Error Handler Security Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Error Handler Validation', () => {
    describe('Function Type Validation', () => {
      it('should accept valid synchronous error handler', () => {
        const handler = (error: Error) => {
          console.error(error.message);
        };
        
        expect(() => validateErrorHandler(handler)).not.toThrow();
      });

      it('should accept valid asynchronous error handler', () => {
        const handler = async (error: Error) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.error(error.message);
        };
        
        expect(() => validateErrorHandler(handler)).not.toThrow();
      });

      it('should reject non-function values', () => {
        const invalidHandlers = [
          null,
          undefined,
          'string',
          123,
          {},
          [],
          Symbol('test'),
          new Date()
        ];

        invalidHandlers.forEach(handler => {
          expect(() => validateErrorHandler(handler)).toThrow(ErrorHandlerValidationError);
          expect(() => validateErrorHandler(handler)).toThrow(/must be a function/);
        });
      });

      it('should reject functions with wrong parameter count', () => {
        const noParams = () => {};
        const tooManyParams = (_error: Error, _extra1: any, _extra2: any) => {};
        
        expect(() => validateErrorHandler(noParams)).toThrow(ErrorHandlerValidationError);
        expect(() => validateErrorHandler(tooManyParams)).toThrow(ErrorHandlerValidationError);
        expect(() => validateErrorHandler(noParams)).toThrow(/must accept exactly one parameter/);
        expect(() => validateErrorHandler(tooManyParams)).toThrow(/must accept exactly one parameter/);
      });

      it('should reject arrow functions that access dangerous globals', () => {
        const dangerousHandlers = [
          // Process manipulation
          (_error: Error) => { process.exit(1); },
          (_error: Error) => { process.kill(process.pid); },
          
          // File system access  
          (_error: Error) => { require('fs').writeFileSync('/tmp/test', 'data'); },
          
          // Network access
          (_error: Error) => { require('http').get('http://evil.com'); },
          
          // Child process spawning
          (_error: Error) => { require('child_process').exec('rm -rf /'); }
        ];

        dangerousHandlers.forEach(handler => {
          expect(() => validateErrorHandler(handler)).toThrow(ErrorHandlerValidationError);
          expect(() => validateErrorHandler(handler)).toThrow(/contains potentially dangerous operations/);
        });
      });

      it('should allow safe operations', () => {
        const safeHandlers = [
          (error: Error) => console.log(error.message),
          (error: Error) => { 
            const sanitized = error.message.replace(/password/gi, '***');
            console.error(`Safe error: ${sanitized}`);
          },
          async (error: Error) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            console.error('Async safe error:', error.message);
          }
        ];

        safeHandlers.forEach(handler => {
          expect(() => validateErrorHandler(handler)).not.toThrow();
        });
      });
    });

    describe('Code Content Analysis', () => {
      it('should detect eval usage', () => {
        const evilHandler = (_error: Error) => {
          eval('console.log("injected code")');
        };
        
        expect(() => validateErrorHandler(evilHandler)).toThrow(ErrorHandlerValidationError);
        expect(() => validateErrorHandler(evilHandler)).toThrow(/contains potentially dangerous operations/);
      });

      it('should detect Function constructor usage', () => {
        const evilHandler = (_error: Error) => {
          new Function('return console.log("injected")')();
        };
        
        expect(() => validateErrorHandler(evilHandler)).toThrow(ErrorHandlerValidationError);
        expect(() => validateErrorHandler(evilHandler)).toThrow(/contains potentially dangerous operations/);
      });

      it('should detect dangerous require patterns', () => {
        const dangerousRequires = [
          (_error: Error) => require('child_process'),
          (_error: Error) => require('fs').unlinkSync,
          (_error: Error) => require('os').networkInterfaces(),
          (_error: Error) => require('crypto').randomBytes(1000000)
        ];

        dangerousRequires.forEach(handler => {
          expect(() => validateErrorHandler(handler)).toThrow(ErrorHandlerValidationError);
          expect(() => validateErrorHandler(handler)).toThrow(/contains potentially dangerous operations/);
        });
      });

      it('should allow safe require patterns', () => {
        const safeRequires = [
          (error: Error) => require('util').format('Error: %s', error.message),
          (error: Error) => require('path').basename(error.stack?.split('\\n')[0] || '')
        ];

        safeRequires.forEach(handler => {
          expect(() => validateErrorHandler(handler)).not.toThrow();
        });
      });
    });
  });

  describe('Safe Error Handler Execution', () => {
    describe('Timeout Protection', () => {
      it('should timeout long-running synchronous handlers', async () => {
        const hangingHandler = (_error: Error) => {
          // Infinite loop
          while (true) {
            // Simulate CPU-intensive work
            Math.random();
          }
        };

        const testError = new Error('Test error');
        const promise = executeErrorHandlerSafely(hangingHandler, testError, { timeout: 1000 });
        
        // Fast-forward time to trigger timeout
        vi.advanceTimersByTime(1500);
        
        await expect(promise).rejects.toThrow(/Error handler execution timed out/);
      });

      it('should timeout long-running asynchronous handlers', async () => {
        const hangingHandler = async (_error: Error) => {
          await new Promise(() => {}); // Never resolves
        };

        const testError = new Error('Test error');
        const promise = executeErrorHandlerSafely(hangingHandler, testError, { timeout: 1000 });
        
        // Fast-forward time to trigger timeout
        vi.advanceTimersByTime(1500);
        
        await expect(promise).rejects.toThrow(/Error handler execution timed out/);
      });

      it('should allow handlers that complete within timeout', async () => {
        const validHandler = async (error: Error) => {
          await new Promise(resolve => setTimeout(resolve, 500));
          console.error('Handler completed:', error.message);
        };

        const testError = new Error('Test error');
        const promise = executeErrorHandlerSafely(validHandler, testError, { timeout: 1000 });
        
        // Fast-forward time but not past timeout
        vi.advanceTimersByTime(600);
        
        await expect(promise).resolves.not.toThrow();
      });

      it('should use configurable timeout values', async () => {
        const slowHandler = async (_error: Error) => {
          await new Promise(resolve => setTimeout(resolve, 2500));
        };

        const testError = new Error('Test error');
        
        // Should timeout with short timeout
        const shortPromise = executeErrorHandlerSafely(slowHandler, testError, { timeout: 1000 });
        vi.advanceTimersByTime(1500);
        await expect(shortPromise).rejects.toThrow(/timed out/);
        
        vi.clearAllTimers();
        vi.useFakeTimers();
        
        // Should succeed with longer timeout
        const longPromise = executeErrorHandlerSafely(slowHandler, testError, { timeout: 5000 });
        vi.advanceTimersByTime(3000);
        await expect(longPromise).resolves.not.toThrow();
      });
    });

    describe('Error Isolation', () => {
      it('should catch and wrap handler exceptions', async () => {
        const throwingHandler = (error: Error) => {
          throw new Error('Handler failed');
        };

        const testError = new Error('Original error');
        
        await expect(executeErrorHandlerSafely(throwingHandler, testError))
          .rejects.toThrow(/Error handler failed:/);
      });

      it('should catch and wrap async handler rejections', async () => {
        const rejectingHandler = async (error: Error) => {
          throw new Error('Async handler failed');
        };

        const testError = new Error('Original error');
        
        await expect(executeErrorHandlerSafely(rejectingHandler, testError))
          .rejects.toThrow(/Error handler failed:/);
      });

      it('should preserve original error context', async () => {
        const throwingHandler = (_error: Error) => {
          throw new Error('Handler error');
        };

        const originalError = new Error('Original error');
        
        try {
          await executeErrorHandlerSafely(throwingHandler, originalError);
        } catch (wrappedError) {
          expect(wrappedError.message).toContain('Handler error');
          expect(wrappedError.message).toContain('Original error: Original error');
        }
      });
    });

    describe('Resource Protection', () => {
      it('should prevent excessive memory allocation', async () => {
        const memoryHog = (_error: Error) => {
          // Try to allocate huge arrays
          const bigArray = new Array(1000000).fill('x'.repeat(10000));
          return bigArray.length; // Use the variable to avoid unused warning
        };

        const testError = new Error('Test error');
        
        // This should be caught by our validation or timeout
        await expect(executeErrorHandlerSafely(memoryHog, testError, { timeout: 1000 }))
          .rejects.toThrow();
      });

      it('should clean up resources after handler execution', async () => {
        let cleanupCalled = false;
        
        const handlerWithCleanup = (_error: Error) => {
          // Simulate some resource that needs cleanup
          const timer = setTimeout(() => {}, 10000);
          
          // Handler should clean up its own resources
          clearTimeout(timer);
          cleanupCalled = true;
        };

        const testError = new Error('Test error');
        await executeErrorHandlerSafely(handlerWithCleanup, testError);
        
        expect(cleanupCalled).toBe(true);
      });
    });

    describe('Input Sanitization', () => {
      it('should sanitize error messages passed to handlers', async () => {
        let receivedMessage = '';
        
        const handler = (error: Error) => {
          receivedMessage = error.message;
        };

        const dangerousError = new Error('password=secret123 and token=abc456');
        await executeErrorHandlerSafely(handler, dangerousError);
        
        // Message should be sanitized before reaching handler
        expect(receivedMessage).not.toContain('secret123');
        expect(receivedMessage).not.toContain('abc456');
        expect(receivedMessage).toContain('***');
      });

      it('should sanitize stack traces passed to handlers', async () => {
        let receivedStack = '';
        
        const handler = (error: Error) => {
          receivedStack = error.stack || '';
        };

        const errorWithStack = new Error('Test error');
        errorWithStack.stack = `Error: Test error
    at Function.test (/Users/johndoe/secret/app.js:123:45)
    at Object.<anonymous> (/home/user/private/config.js:67:89)`;

        await executeErrorHandlerSafely(handler, errorWithStack);
        
        // Stack should be sanitized
        expect(receivedStack).not.toContain('/Users/johndoe');
        expect(receivedStack).not.toContain('/home/user');
        expect(receivedStack).toContain('/Users/***/');
        expect(receivedStack).toContain('/home/***/');
      });
    });
  });

  describe('Security Configuration', () => {
    it('should enforce strict mode by default', () => {
      const borderlineHandler = (_error: Error) => {
        // Borderline operations that might be suspicious
        console.log(process.env.HOME);
      };

      expect(() => validateErrorHandler(borderlineHandler, { strict: true }))
        .toThrow(ErrorHandlerValidationError);
    });

    it('should allow relaxed validation when explicitly configured', () => {
      const borderlineHandler = (_error: Error) => {
        console.log(process.env.NODE_ENV); // Should be ok in relaxed mode
      };

      expect(() => validateErrorHandler(borderlineHandler, { strict: false }))
        .not.toThrow();
    });

    it('should provide detailed violation reports', () => {
      const complexDangerousHandler = (_error: Error) => {
        eval('malicious code');
        require('fs').writeFileSync('/tmp/bad', 'data');
        process.exit(1);
      };

      try {
        validateErrorHandler(complexDangerousHandler);
      } catch (error: any) {
        expect(error.message).toContain('eval');
        expect(error.message).toContain('fs');
        expect(error.message).toContain('process');
        expect(error.violations).toHaveLength(3);
      }
    });
  });

  describe('Integration with createCLI', () => {
    it('should validate error handlers during CLI creation', async () => {
      const { createCLI } = await import('../core/createCLI.js');
      
      const dangerousHandler = (_error: Error) => {
        eval('malicious code');
      };

      await expect(createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        skipArgvParsing: true,
        errorHandler: dangerousHandler
      })).rejects.toThrow(ErrorHandlerValidationError);
    });

    it('should allow safe error handlers during CLI creation', async () => {
      const { createCLI } = await import('../core/createCLI.js');
      
      const safeHandler = (error: Error) => {
        console.error('Safe error:', error.message);
      };

      await expect(createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        skipArgvParsing: true,
        errorHandler: safeHandler
      })).resolves.toBeDefined();
    });
  });
});