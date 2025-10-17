import { describe, it, expect } from 'vitest';
import { createCLI, ErrorHandlerValidationError } from '../../core/createCLI.js';

describe('Error Handler Security Integration', () => {
  describe('CLI Creation with Error Handler Validation', () => {
    it('should validate error handlers during CLI creation', async () => {
      const dangerousHandler = (_error: Error) => {
        eval('malicious code');
      };

      await expect(createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI with dangerous handler',
        skipArgvParsing: true,
        errorHandler: dangerousHandler
      })).rejects.toThrow(ErrorHandlerValidationError);
    });

    it('should allow safe error handlers during CLI creation', async () => {
      const safeHandler = (error: Error) => {
        console.error('Safe error:', error.message);
      };

      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI with safe handler',
        skipArgvParsing: true,
        errorHandler: safeHandler
      });

      expect(program).toBeDefined();
      expect(program.name()).toBe('test-cli');
    });

    it('should work without error handler (backward compatibility)', async () => {
      const program = await createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI without handler',
        skipArgvParsing: true
      });

      expect(program).toBeDefined();
      expect(program.name()).toBe('test-cli');
    });

    it('should provide detailed validation error messages', async () => {
      const complexDangerousHandler = (_error: Error) => {
        eval('malicious code');
        require('fs').writeFileSync('/tmp/bad', 'data');
        process.exit(1);
      };

      try {
        await createCLI({
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI',
          skipArgvParsing: true,
          errorHandler: complexDangerousHandler
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(ErrorHandlerValidationError);
        expect(error.message).toContain('eval');
        expect(error.message).toContain('fs');
        expect(error.message).toContain('process');
        expect(error.violations).toHaveLength(3);
      }
    });
  });
});
