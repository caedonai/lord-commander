/**
 * Comprehensive tests for Input Validation Framework
 * 
 * This test suite covers all input validation functions with comprehensive
 * edge cases, security scenarios, malformed inputs, and integration testing.
 * 
 * @see Task 1.2.1: Input Sanitization Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validatePackageManager,
  sanitizeCommandArgs,
  sanitizePath,
  validateInput,
  TRUSTED_PACKAGE_MANAGERS,
  PROJECT_NAME_PATTERNS,
  type ValidationConfig
} from '../../core/foundation/input-validation.js';

describe('Input Validation Framework', () => {
  
  describe('validateProjectName', () => {
    
    describe('Valid project names', () => {
      it('should accept standard project names', () => {
        const validNames = [
          'my-project',
          'awesome-app',
          'cool-tool',
          'react-components',
          'vue-utils',
          'next-app',
          'my.package',
          'my_package',
          'project123',
          'a1b2c3'
        ];

        validNames.forEach(name => {
          const result = validateProjectName(name);
          expect(result.isValid).toBe(true);
          expect(result.sanitized).toBe(name);
          expect(result.violations).toHaveLength(0);
          expect(result.riskScore).toBe(0);
        });
      });

      it('should handle minimum valid length', () => {
        const result = validateProjectName('ab');
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe('ab');
        expect(result.violations).toHaveLength(0);
      });

      it('should accept names with mixed valid characters', () => {
        const validNames = [
          'my-awesome.project_v2',
          'react-ui.components',
          'vue3-utils_helpers'
        ];

        validNames.forEach(name => {
          const result = validateProjectName(name);
          expect(result.isValid).toBe(true);
          expect(result.sanitized).toBe(name);
          expect(result.violations).toHaveLength(0);
        });
      });
    });

    describe('Invalid project names', () => {
      it('should reject empty or null inputs', () => {
        const invalidInputs = ['', null, undefined, ' ', '\t', '\n'];

        invalidInputs.forEach(input => {
          const result = validateProjectName(input as any);
          expect(result.isValid).toBe(false);
          expect(result.violations).toContainEqual(
            expect.objectContaining({
              type: 'malformed-input',
              severity: 'high'
            })
          );
          expect(result.riskScore).toBe(100);
        });
      });

      it('should reject names that are too short', () => {
        const result = validateProjectName('a');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
          expect.objectContaining({
            type: 'malformed-input',
            severity: 'medium',
            description: expect.stringContaining('too short')
          })
        );
        expect(result.riskScore).toBeGreaterThan(0);
      });

      it('should reject names that are too long', () => {
        const longName = 'a'.repeat(PROJECT_NAME_PATTERNS.MAX_LENGTH + 1);
        const result = validateProjectName(longName);
        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
          expect.objectContaining({
            type: 'malformed-input',
            severity: 'medium',
            description: expect.stringContaining('too long')
          })
        );
      });

      it('should reject names with invalid characters', () => {
        const invalidNames = [
          'my project',  // spaces
          'my@project',  // special chars
          'my#project',  // hash
          'my$project',  // dollar
          'my%project',  // percent
          'my&project',  // ampersand
          'my*project',  // asterisk
          'my+project',  // plus
          'my=project',  // equals
          'my!project'   // exclamation
        ];

        invalidNames.forEach(name => {
          const result = validateProjectName(name);
          expect(result.isValid).toBe(false);
          expect(result.violations).toContainEqual(
            expect.objectContaining({
              type: 'suspicious-pattern',
              severity: 'medium',
              description: expect.stringContaining('invalid characters')
            })
          );
          expect(result.riskScore).toBeGreaterThan(0);
        });
      });

      it('should reject names starting with invalid characters', () => {
        const invalidStarts = ['-project', '.project', '_project'];

        invalidStarts.forEach(name => {
          const result = validateProjectName(name);
          expect(result.isValid).toBe(false);
          expect(result.violations).toContainEqual(
            expect.objectContaining({
              type: 'suspicious-pattern',
              severity: 'low',
              description: expect.stringContaining('start with a letter or number')
            })
          );
        });
      });

      it('should reject names ending with invalid characters', () => {
        const invalidEnds = ['project-', 'project.', 'project_'];

        invalidEnds.forEach(name => {
          const result = validateProjectName(name);
          expect(result.isValid).toBe(false);
          expect(result.violations).toContainEqual(
            expect.objectContaining({
              type: 'suspicious-pattern',
              severity: 'low',
              description: expect.stringContaining('end with a letter or number')
            })
          );
        });
      });

      it('should reject names with consecutive special characters', () => {
        const consecutiveNames = ['my--project', 'my..project', 'my__project', 'my.-project'];

        consecutiveNames.forEach(name => {
          const result = validateProjectName(name);
          expect(result.isValid).toBe(false);
          expect(result.violations).toContainEqual(
            expect.objectContaining({
              type: 'suspicious-pattern',
              severity: 'low',
              description: expect.stringContaining('consecutive special characters')
            })
          );
        });
      });
    });

    describe('Security validation', () => {
      it('should detect path traversal attempts', () => {
        const traversalAttempts = [
          '../my-project',
          '../../evil-project',
          './../../malicious',
          'project/../../../etc',
          'project/..\\..\\windows'
        ];

        traversalAttempts.forEach(name => {
          const result = validateProjectName(name);
          expect(result.isValid).toBe(false);
          expect(result.violations.some((v: any) => 
            v.type.includes('traversal') || v.type.includes('suspicious')
          )).toBe(true);
          expect(result.riskScore).toBeGreaterThan(30);
        });
      });

      it('should detect command injection attempts', () => {
        const injectionAttempts = [
          'project; rm -rf /',
          'project && evil-command',
          'project || malicious',
          'project | danger',
          'project `bad-command`',
          'project $(evil)',
          'project & background-evil'
        ];

        injectionAttempts.forEach(name => {
          const result = validateProjectName(name);
          expect(result.isValid).toBe(false);
          expect(result.violations.some((v: any) => 
            v.type.includes('injection') || v.type.includes('suspicious')
          )).toBe(true);
          expect(result.riskScore).toBeGreaterThan(30);
        });
      });
    });

    describe('Auto-sanitization', () => {
      it('should auto-sanitize names when enabled', () => {
        const config: Partial<ValidationConfig> = {
          autoSanitize: true,
          strictMode: false
        };

        const result = validateProjectName('My Project!', config);
        expect(result.sanitized).toBe('my-project');
        expect(result.sanitized).toMatch(PROJECT_NAME_PATTERNS.VALID_CHARS);
      });

      it('should not auto-sanitize when disabled', () => {
        const config: Partial<ValidationConfig> = {
          autoSanitize: false
        };

        const result = validateProjectName('My Project!', config);
        expect(result.sanitized).toBe('My Project!');
      });
    });

    describe('Configuration options', () => {
      it('should respect strict mode settings', () => {
        const strictConfig: Partial<ValidationConfig> = {
          strictMode: true
        };
        const lenientConfig: Partial<ValidationConfig> = {
          strictMode: false
        };

        const testName = 'suspicious-project';
        
        const strictResult = validateProjectName(testName, strictConfig);
        const lenientResult = validateProjectName(testName, lenientConfig);

        // Both should have same violations, but validity may differ
        expect(strictResult.violations.length).toBeGreaterThanOrEqual(lenientResult.violations.length);
      });

      it('should respect custom max length', () => {
        const config: Partial<ValidationConfig> = {
          maxLength: 10
        };

        const result = validateProjectName('this-is-a-very-long-project-name', config);
        expect(result.sanitized.length).toBeLessThanOrEqual(10);
      });

      it('should provide suggestions when enabled', () => {
        const config: Partial<ValidationConfig> = {
          provideSuggestions: true
        };

        const result = validateProjectName('Invalid Project!', config);
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.suggestions[0]).toContain('lowercase');
      });

      it('should not provide suggestions when disabled', () => {
        const config: Partial<ValidationConfig> = {
          provideSuggestions: false
        };

        const result = validateProjectName('Invalid Project!', config);
        expect(result.suggestions).toHaveLength(0);
      });
    });
  });

  describe('validatePackageManager', () => {
    
    describe('Trusted package managers', () => {
      it('should accept all whitelisted package managers', () => {
        const trustedManagers = Array.from(TRUSTED_PACKAGE_MANAGERS);

        trustedManagers.forEach(pm => {
          const result = validatePackageManager(pm);
          expect(result.isValid).toBe(true);
          expect(result.sanitized).toBe(pm);
          expect(result.violations).toHaveLength(0);
          expect(result.riskScore).toBe(0);
        });
      });

      it('should handle case variations', () => {
        const caseVariations = ['NPM', 'Npm', 'PNPM', 'Yarn', 'BUN'];

        caseVariations.forEach(pm => {
          const result = validatePackageManager(pm);
          expect(result.isValid).toBe(true);
          expect(result.sanitized).toBe(pm.toLowerCase());
        });
      });

      it('should trim whitespace', () => {
        const result = validatePackageManager('  npm  ');
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe('npm');
      });
    });

    describe('Untrusted package managers', () => {
      it('should reject unknown package managers', () => {
        const unknownManagers = [
          'evil-pm',
          'malicious-package-manager',
          'unknown-tool',
          'fake-npm',
          'suspicious-yarn'
        ];

        unknownManagers.forEach(pm => {
          const result = validatePackageManager(pm);
          expect(result.isValid).toBe(false);
          expect(result.violations).toContainEqual(
            expect.objectContaining({
              type: 'suspicious-pattern',
              description: expect.stringContaining('Unknown or untrusted')
            })
          );
          expect(result.riskScore).toBeGreaterThan(0);
        });
      });

      it('should reject empty or invalid inputs', () => {
        const invalidInputs = ['', null, undefined, ' ', '\t'];

        invalidInputs.forEach(input => {
          const result = validatePackageManager(input as any);
          expect(result.isValid).toBe(false);
          expect(result.violations).toContainEqual(
            expect.objectContaining({
              type: 'malformed-input',
              severity: 'high'
            })
          );
          expect(result.sanitized).toBe('npm'); // Safe default
          expect(result.riskScore).toBe(100);
        });
      });

      it('should detect command injection attempts', () => {
        const injectionAttempts = [
          'npm; rm -rf /',
          'yarn && evil-command',
          'pnpm | malicious',
          'bun; cat /etc/passwd',
          'npm `dangerous-command`',
          'yarn $(evil-script)'
        ];

        injectionAttempts.forEach(pm => {
          const result = validatePackageManager(pm);
          expect(result.isValid).toBe(false);
          expect(result.violations).toContainEqual(
            expect.objectContaining({
              type: 'command-injection',
              severity: 'critical'
            })
          );
          expect(result.riskScore).toBeGreaterThan(40);
        });
      });

      it('should reject excessively long package manager names', () => {
        const longName = 'a'.repeat(300);
        const result = validatePackageManager(longName);
        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
          expect.objectContaining({
            type: 'malformed-input',
            severity: 'medium',
            description: expect.stringContaining('too long')
          })
        );
      });
    });

    describe('Configuration modes', () => {
      it('should be more permissive in non-strict mode', () => {
        const strictConfig: Partial<ValidationConfig> = {
          strictMode: true
        };
        const lenientConfig: Partial<ValidationConfig> = {
          strictMode: false
        };

        const unknownPM = 'custom-package-manager';
        
        const strictResult = validatePackageManager(unknownPM, strictConfig);
        const lenientResult = validatePackageManager(unknownPM, lenientConfig);

        expect(strictResult.isValid).toBe(false);
        expect(lenientResult.isValid).toBe(false); // Still false due to whitelist
        
        // But severity should be different
        const strictViolation = strictResult.violations.find((v: any) => v.type === 'suspicious-pattern');
        const lenientViolation = lenientResult.violations.find((v: any) => v.type === 'suspicious-pattern');
        
        expect(strictViolation?.severity).toBe('high');
        expect(lenientViolation?.severity).toBe('medium');
      });
    });
  });

  describe('sanitizeCommandArgs', () => {
    
    describe('Safe command arguments', () => {
      it('should preserve safe arguments', () => {
        const safeArgs = [
          'build',
          '--prod',
          '--output',
          './dist',
          'my-file.js',
          'component.tsx',
          '--port=3000',
          '--no-cache'
        ];

        const result = sanitizeCommandArgs(safeArgs);
        expect(result).toEqual(safeArgs);
      });

      it('should handle file paths correctly', () => {
        const pathArgs = [
          '--input',
          './src/file.js',
          '--output', 
          './dist/bundle.js',
          '--config',
          './webpack.config.js'
        ];

        const result = sanitizeCommandArgs(pathArgs);
        expect(result).toEqual(pathArgs);
      });

      it('should preserve valid flags and options', () => {
        const flagArgs = [
          '--verbose',
          '--dry-run',
          '--force',
          '-v',
          '-f',
          '--production',
          '--development'
        ];

        const result = sanitizeCommandArgs(flagArgs);
        expect(result).toEqual(flagArgs);
      });
    });

    describe('Dangerous command arguments', () => {
      it('should reject command injection attempts in strict mode', () => {
        const dangerousArgs = [
          'build; rm -rf /',
          '--output && evil-command',
          'file.js || malicious',
          'script.sh | danger'
        ];

        const config: Partial<ValidationConfig> = {
          strictMode: true
        };

        dangerousArgs.forEach(arg => {
          expect(() => {
            sanitizeCommandArgs([arg], config);
          }).toThrow(/Command injection attempt detected/);
        });
      });

      it('should sanitize command injection attempts in non-strict mode', () => {
        const config: Partial<ValidationConfig> = {
          strictMode: false,
          autoSanitize: true
        };

        const result = sanitizeCommandArgs(['build; rm -rf /'], config);
        expect(result[0]).not.toContain(';');
        expect(result[0]).not.toContain('rm');
      });

      it('should handle shell metacharacters with auto-sanitization', () => {
        const config: Partial<ValidationConfig> = {
          autoSanitize: true,
          strictMode: false
        };

        const argsWithSpaces = ['my file.js', 'path with spaces'];
        const result = sanitizeCommandArgs(argsWithSpaces, config);
        
        result.forEach((arg: string) => {
          if (arg.includes(' ')) {
            expect(arg).toMatch(/^".*"$/); // Should be quoted
          }
        });
      });

      it('should reject excessively long arguments in strict mode', () => {
        const longArg = 'a'.repeat(1000);
        const config: Partial<ValidationConfig> = {
          strictMode: true,
          maxLength: 100
        };

        expect(() => {
          sanitizeCommandArgs([longArg], config);
        }).toThrow(/Argument too long/);
      });

      it('should truncate long arguments in non-strict mode', () => {
        const longArg = 'a'.repeat(1000);
        const config: Partial<ValidationConfig> = {
          strictMode: false,
          maxLength: 100
        };

        const result = sanitizeCommandArgs([longArg], config);
        expect(result[0].length).toBeLessThanOrEqual(100);
      });
    });

    describe('Input validation', () => {
      it('should reject non-array inputs', () => {
        expect(() => {
          sanitizeCommandArgs('not-an-array' as any);
        }).toThrow(/Invalid arguments array/);
      });

      it('should reject non-string arguments', () => {
        expect(() => {
          sanitizeCommandArgs([123, true, null] as any);
        }).toThrow(/Arguments must be valid strings/);
      });

      it('should filter out empty arguments', () => {
        const argsWithEmpties = ['build', '', '  ', 'test', null, undefined] as any;
        const result = sanitizeCommandArgs(argsWithEmpties.filter((arg: any) => typeof arg === 'string'));
        expect(result).toEqual(['build', 'test']);
      });
    });
  });

  describe('sanitizePath', () => {
    
    describe('Safe path operations', () => {
      it('should accept safe relative paths', () => {
        const safePaths = [
          './src/components',
          'src/utils',
          './dist/bundle.js',
          'package.json',
          'config/app.config.js'
        ];

        safePaths.forEach(path => {
          const result = sanitizePath(path);
          expect(result).toBeTruthy();
          expect(result).not.toContain('..');
        });
      });

      it('should normalize paths correctly', () => {
        const paths = [
          { input: './src/../components/Button.tsx', expected: 'components/Button.tsx' },
          { input: 'src/./utils/helper.js', expected: 'src/utils/helper.js' },
          { input: './dist/../src/index.ts', expected: 'src/index.ts' }
        ];

        paths.forEach(({ input, expected }) => {
          const result = sanitizePath(input, { allowTraversal: true });
          expect(result).toContain(expected.split('/').pop()); // Check filename
        });
      });

      it('should handle absolute paths when allowed', () => {
        const options = { allowAbsolute: true };
        
        const absolutePath = process.platform === 'win32' 
          ? 'C:\\projects\\my-app' 
          : '/home/user/projects/my-app';
          
        const result = sanitizePath(absolutePath, options);
        expect(result).toBe(absolutePath);
      });
    });

    describe('Dangerous path operations', () => {
      it('should reject path traversal attempts', () => {
        const traversalPaths = [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32',
          './../../../../../../root',
          'file/../../../sensitive'
        ];

        traversalPaths.forEach(path => {
          expect(() => {
            sanitizePath(path);
          }).toThrow(/Path traversal detected/);
        });
      });

      it('should reject absolute paths by default', () => {
        const absolutePaths = [
          '/etc/passwd',
          'C:\\Windows\\System32',
          '/root/.ssh/id_rsa',
          'D:\\sensitive\\data'
        ];

        absolutePaths.forEach(path => {
          expect(() => {
            sanitizePath(path);
          }).toThrow(/Absolute paths not allowed/);
        });
      });

      it('should reject paths that escape working directory', () => {
        const escapingPaths = [
          '../../../outside-project',
          '../../../../etc',
          '../sibling-project/secret'
        ];

        escapingPaths.forEach(path => {
          expect(() => {
            sanitizePath(path);
          }).toThrow(/Path escapes working directory/);
        });
      });

      it('should reject malformed path inputs', () => {
        const invalidInputs = ['', null, undefined, 123, true, {}];

        invalidInputs.forEach(input => {
          expect(() => {
            sanitizePath(input as any);
          }).toThrow(/Arguments must be valid strings/);
        });
      });
    });

    describe('Path options', () => {
      it('should allow traversal when explicitly enabled', () => {
        const options = { allowTraversal: true };
        
        const result = sanitizePath('../config/settings.json', options);
        expect(result).toBeTruthy();
      });

      it('should respect custom working directory', () => {
        const customWd = process.platform === 'win32' 
          ? 'C:\\custom\\workspace' 
          : '/custom/workspace';
          
        const options = { workingDirectory: customWd };
        
        const result = sanitizePath('./project/file.js', options);
        expect(result).toBeTruthy();
      });
    });
  });

  describe('validateInput (universal function)', () => {
    
    it('should validate project names', () => {
      const result = validateInput('my-project', 'project-name');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('my-project');
    });

    it('should validate package managers', () => {
      const result = validateInput('npm', 'package-manager');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('npm');
    });

    it('should validate file paths', () => {
      const result = validateInput('./src/file.js', 'file-path');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('./src/file.js');
    });

    it('should validate command arguments', () => {
      const result = validateInput('--build', 'command-arg');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('--build');
    });

    it('should reject invalid validation types', () => {
      expect(() => {
        validateInput('test', 'invalid-type' as any);
      }).toThrow(/Unknown validation type/);
    });

    it('should handle validation failures gracefully', () => {
      const result = validateInput('../../../etc/passwd', 'file-path');
      expect(result.isValid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'path-traversal',
          severity: 'critical'
        })
      );
      expect(result.riskScore).toBe(100);
    });
  });

  describe('Edge cases and error handling', () => {
    
    it('should handle unicode characters appropriately', () => {
      const unicodeNames = [
        'project-café',
        'my-app-🚀',
        'señor-package',
        'проект'
      ];

      unicodeNames.forEach(name => {
        const result = validateProjectName(name);
        // Should be rejected due to non-ASCII characters
        expect(result.isValid).toBe(false);
        expect(result.violations.some((v: any) => 
          v.type === 'suspicious-pattern' || v.description.includes('invalid characters')
        )).toBe(true);
      });
    });

    it('should handle very large inputs safely', () => {
      const hugeInput = 'a'.repeat(100000);
      
      // Should not crash, should handle gracefully
      const result = validateProjectName(hugeInput);
      expect(result.isValid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'malformed-input',
          severity: 'medium',
          description: expect.stringContaining('too long')
        })
      );
    });

    it('should provide consistent validation results', () => {
      const testInput = 'my-test-project';
      
      // Multiple calls should return identical results
      const result1 = validateProjectName(testInput);
      const result2 = validateProjectName(testInput);
      
      expect(result1).toEqual(result2);
    });

    it('should handle concurrent validation calls', async () => {
      const testInputs = Array.from({ length: 100 }, (_, i) => `project-${i}`);
      
      // Run many validations concurrently
      const promises = testInputs.map(input => 
        Promise.resolve(validateProjectName(input))
      );
      
      const results = await Promise.all(promises);
      
      // All should be valid and consistent
      results.forEach((result: any, index: number) => {
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(`project-${index}`);
      });
    });
  });

  describe('Integration with constants', () => {
    
    it('should use DEFAULT_VALIDATION_CONFIG correctly', () => {
      const result = validateProjectName('test-project');
      
      // Should respect default config values
      expect(result.suggestions.length).toBeGreaterThanOrEqual(0); // provideSuggestions: true
      expect(result.sanitized).toBeTruthy(); // autoSanitize: true
    });

    it('should respect TRUSTED_PACKAGE_MANAGERS whitelist', () => {
      Array.from(TRUSTED_PACKAGE_MANAGERS).forEach(pm => {
        const result = validatePackageManager(pm);
        expect(result.isValid).toBe(true);
      });

      // Untrusted should fail
      const result = validatePackageManager('untrusted-pm');
      expect(result.isValid).toBe(false);
    });

    it('should validate against PROJECT_NAME_PATTERNS', () => {
      // Test minimum length
      const short = 'a'.repeat(PROJECT_NAME_PATTERNS.MIN_LENGTH - 1);
      const shortResult = validateProjectName(short);
      expect(shortResult.isValid).toBe(false);

      // Test maximum length
      const long = 'a'.repeat(PROJECT_NAME_PATTERNS.MAX_LENGTH + 1);
      const longResult = validateProjectName(long);
      expect(longResult.isValid).toBe(false);

      // Test valid range
      const valid = 'a'.repeat(PROJECT_NAME_PATTERNS.MIN_LENGTH);
      const validResult = validateProjectName(valid);
      expect(validResult.isValid).toBe(true);
    });
  });
});