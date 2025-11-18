import { describe, expect, it } from 'vitest';
import { createCLI } from '../../core/createCLI.js';
import type { CreateCliOptions } from '../../types/cli.js';

// Simple focused tests
describe('createCLI focused tests', () => {
  it('should create CLI with minimal options', async () => {
    const options: CreateCliOptions = {
      name: 'test',
      version: '1.0.0',
      description: 'Test CLI',
      autoStart: false,
    };

    const program = await createCLI(options);
    expect(program).toBeDefined();
    expect(program.name()).toBe('test');
    expect(program.version()).toBe('1.0.0');
    expect(program.description()).toBe('Test CLI');
  });

  it('should have run method when autoStart is false', async () => {
    const options: CreateCliOptions = {
      name: 'test',
      version: '1.0.0',
      description: 'Test CLI',
      autoStart: false,
    };

    const program = await createCLI(options);
    expect(typeof program.run).toBe('function');
  });
});

describe('ErrorHandlerValidationError', () => {
  it('should create error instance', async () => {
    const { ErrorHandlerValidationError } = await import('../../core/createCLI.js');

    const error = new ErrorHandlerValidationError('test message');
    expect(error.name).toBe('ErrorHandlerValidationError');
    expect(error.message).toBe('test message');
    expect(error.violations).toEqual([]);
  });

  it('should store violations array', async () => {
    const { ErrorHandlerValidationError } = await import('../../core/createCLI.js');

    const violations = ['VIOLATION_1', 'VIOLATION_2'];
    const error = new ErrorHandlerValidationError('test', violations);
    expect(error.violations).toEqual(violations);
  });
});

describe('validateErrorHandler', () => {
  it('should validate proper error handler', async () => {
    const { validateErrorHandler } = await import('../../core/createCLI.js');

    const handler = (error: Error) => {
      console.log(error.message);
    };

    expect(() => validateErrorHandler(handler)).not.toThrow();
  });

  it('should reject non-function handler', async () => {
    const { validateErrorHandler, ErrorHandlerValidationError } = await import(
      '../../core/createCLI.js'
    );

    expect(() => validateErrorHandler('invalid' as never)).toThrow(ErrorHandlerValidationError);
    expect(() => validateErrorHandler(null as never)).toThrow(ErrorHandlerValidationError);
  });
});
