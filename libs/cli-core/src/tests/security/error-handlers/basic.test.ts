import { describe, expect, it } from 'vitest';
import {
  ErrorHandlerValidationError,
  executeErrorHandlerSafely,
  validateErrorHandler,
} from '../../../core/createCLI.js';

describe('Basic Error Handler Security Validation', () => {
  describe('Function Type Validation', () => {
    it('should accept valid synchronous error handler', () => {
      const handler = (error: Error) => {
        console.error(error.message);
      };

      expect(() => validateErrorHandler(handler)).not.toThrow();
    });

    it('should reject non-function values', () => {
      const invalidHandlers = [null, undefined, 'string', 123, {}, []];

      invalidHandlers.forEach((handler) => {
        expect(() => validateErrorHandler(handler)).toThrow(ErrorHandlerValidationError);
        expect(() => validateErrorHandler(handler)).toThrow(/must be a function/);
      });
    });

    it('should reject functions with wrong parameter count', () => {
      const noParams = () => {};
      const tooManyParams = (_error: Error, _extra1: unknown, _extra2: unknown) => {};

      expect(() => validateErrorHandler(noParams)).toThrow(ErrorHandlerValidationError);
      expect(() => validateErrorHandler(tooManyParams)).toThrow(ErrorHandlerValidationError);
      expect(() => validateErrorHandler(noParams)).toThrow(/must accept exactly one parameter/);
      expect(() => validateErrorHandler(tooManyParams)).toThrow(
        /must accept exactly one parameter/
      );
    });
  });

  describe('Dangerous Code Detection', () => {
    it('should detect eval usage', () => {
      const evilHandler = (_error: Error) => {
        // biome-ignore lint/security/noGlobalEval: Testing security detection
        eval('console.log("injected code")');
      };

      expect(() => validateErrorHandler(evilHandler)).toThrow(ErrorHandlerValidationError);
      expect(() => validateErrorHandler(evilHandler)).toThrow(
        /contains potentially dangerous operations/
      );
    });

    it('should detect dangerous process operations', () => {
      const dangerousHandler = (_error: Error) => {
        process.exit(1);
      };

      expect(() => validateErrorHandler(dangerousHandler)).toThrow(ErrorHandlerValidationError);
      expect(() => validateErrorHandler(dangerousHandler)).toThrow(
        /contains potentially dangerous operations/
      );
    });
  });

  describe('Safe Handler Execution', () => {
    it('should execute safe handlers without errors', async () => {
      const safeHandler = (error: Error) => {
        console.error('Safe error:', error.message);
      };

      const testError = new Error('Test error message');

      await expect(executeErrorHandlerSafely(safeHandler, testError)).resolves.not.toThrow();
    });

    it('should sanitize error messages before passing to handler', async () => {
      let receivedMessage = '';

      const handler = (error: Error) => {
        receivedMessage = error.message;
      };

      // Force production mode for this test to ensure sanitization occurs
      const originalNodeEnv = process.env.NODE_ENV;
      const originalDebug = process.env.DEBUG;
      process.env.NODE_ENV = 'production';
      delete process.env.DEBUG;

      try {
        const dangerousError = new Error('password=secret123 and token=abc456');
        await executeErrorHandlerSafely(handler, dangerousError);

        // Message should be sanitized in production
        expect(receivedMessage).not.toContain('secret123');
        expect(receivedMessage).not.toContain('abc456');
        expect(receivedMessage).toContain('***');
      } finally {
        // Restore environment
        if (originalNodeEnv) {
          process.env.NODE_ENV = originalNodeEnv;
        } else {
          delete process.env.NODE_ENV;
        }
        if (originalDebug) {
          process.env.DEBUG = originalDebug;
        }
      }
    });
  });
});
