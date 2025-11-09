import { describe, expect, it } from 'vitest';
import { createCLI, ErrorHandlerValidationError } from '../../../core/createCLI.js';

describe('Error Handler Security Integration', () => {
  describe('CLI Creation with Error Handler Validation', () => {
    it('should validate error handlers during CLI creation', async () => {
      const dangerousHandler = (_error: Error) => {
        // biome-ignore lint/security/noGlobalEval: Testing security detection
        eval('malicious code');
      };

      await expect(
        createCLI({
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI with dangerous handler',
          autoStart: false,
          errorHandler: dangerousHandler,
        })
      ).rejects.toThrow(ErrorHandlerValidationError);
    });

    it('should allow safe error handlers during CLI creation', async () => {
      const safeHandler = (error: Error) => {
        console.error('Safe error:', error.message);
      };

      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI with safe handler',
        autoStart: false,
        errorHandler: safeHandler,
      });

      expect(program).toBeDefined();
      expect(program.name()).toBe('test-cli');
    });

    it('should work without error handler (backward compatibility)', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI without handler',
        autoStart: false,
      });

      expect(program).toBeDefined();
      expect(program.name()).toBe('test-cli');
    });

    it('should provide detailed validation error messages', async () => {
      const complexDangerousHandler = (_error: Error) => {
        // biome-ignore lint/security/noGlobalEval: Testing security detection
        eval('malicious code');
        require('node:fs').writeFileSync('/tmp/bad', 'data');
        process.exit(1);
      };

      try {
        await createCLI({
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI',
          autoStart: false,
          errorHandler: complexDangerousHandler,
        });
      } catch (error: unknown) {
        const errorObj = error as Error & { violations: unknown[] };
        expect(errorObj).toBeInstanceOf(ErrorHandlerValidationError);
        expect(errorObj.message).toContain('eval');
        expect(errorObj.message).toContain('fs');
        expect(errorObj.message).toContain('process');
        expect(errorObj.violations).toHaveLength(3);
      }
    });
  });
});
