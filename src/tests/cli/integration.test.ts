/**
 * CLI Integration Test Suite
 *
 * Performs end-to-end testing of CLI functionality including command execution,
 * output validation, and error handling.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { execa } from '../../core/execution/execa.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '../../..');
const cliPath = resolve(rootPath, 'dist/cli.js');

interface TestCase {
  name: string;
  command: string[];
  shouldContain: string[];
  shouldNotContain: string[];
  expectSuccess?: boolean;
}

const testCases: TestCase[] = [
  {
    name: 'Help Command',
    command: ['--help'],
    shouldContain: ['Usage:', 'Commands:', 'Options:'],
    shouldNotContain: ['Error:', 'Failed:'],
    expectSuccess: true,
  },
  {
    name: 'Version Command',
    command: ['--version'],
    shouldContain: ['1.0.0'],
    shouldNotContain: ['Error:', 'undefined'],
    expectSuccess: true,
  },
  {
    name: 'Hello Command',
    command: ['hello'],
    shouldContain: ['Hello'],
    shouldNotContain: ['Error:', 'Failed:'],
    expectSuccess: true,
  },
  {
    name: 'Completion Status',
    command: ['completion', 'status'],
    shouldContain: ['Shell:', 'powershell'], // Adjust based on shell
    shouldNotContain: ['Error:', 'Failed:'],
    expectSuccess: true,
  },
];

describe('CLI Integration Tests', () => {
  beforeAll(() => {
    // Ensure we're testing from the root directory
    process.chdir(rootPath);
  });

  describe('Command Execution', () => {
    it.each(testCases)(
      'should execute $name successfully',
      async ({ command, shouldContain, shouldNotContain, expectSuccess = true }) => {
        let output: string;
        let error: (Error & { stdout?: Buffer | string; stderr?: Buffer | string }) | undefined;

        try {
          const result = await execa('node', [cliPath, ...command], {
            cwd: rootPath,
            sandbox: { enabled: true },
          });
          output = result.stdout;
        } catch (e) {
          error = e as Error & { stdout?: Buffer | string; stderr?: Buffer | string };
          if (expectSuccess) {
            throw new Error(`Command failed unexpectedly: ${e}`);
          }
          output = error.stdout?.toString() || '';
        }

        // Check required content
        for (const content of shouldContain) {
          expect(output).toContain(content);
        }

        // Check forbidden content
        for (const content of shouldNotContain) {
          expect(output).not.toContain(content);
        }

        if (expectSuccess) {
          expect(error).toBeUndefined();
        }
      }
    );
  });

  describe('Command Output Format', () => {
    it('should have consistent help output format', async () => {
      const result = await execa('node', [cliPath, '--help'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      expect(result.stdout).toMatch(/Usage:\s+lord-commander/);
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('Options:');
    });

    it('should have semantic version format', async () => {
      const result = await execa('node', [cliPath, '--version'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      // Extract version from output that may contain completion setup messages
      const lines = result.stdout.split('\n');
      const versionLine = lines.find((line: string) => /^\d+\.\d+\.\d+/.test(line.trim()));

      expect(versionLine).toBeDefined();
      expect(versionLine?.trim()).toMatch(/^\d+\.\d+\.\d+(-\w+)?(\.\d+)?$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      await expect(
        execa('node', [cliPath, 'invalid-command-that-does-not-exist'], {
          cwd: rootPath,
          sandbox: { enabled: true },
        })
      ).rejects.toThrow();
    });

    it('should handle invalid options gracefully', async () => {
      await expect(
        execa('node', [cliPath, 'hello', '--invalid-option'], {
          cwd: rootPath,
          sandbox: { enabled: true },
        })
      ).rejects.toThrow();
    });
  });

  describe('Shell Integration', () => {
    it('should detect shell environment', async () => {
      const result = await execa('node', [cliPath, 'completion', 'status'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      // Should detect some shell (bash, zsh, fish, powershell)
      expect(result.stdout).toMatch(/Shell:|powershell|bash|zsh|fish/);
    });

    it('should provide completion functionality', async () => {
      const result = await execa('node', [cliPath, 'completion', '--help'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      expect(result.stdout).toContain('completion');
      expect(result.stdout).toMatch(/install|status|generate/);
    });
  });

  describe('Performance Characteristics', () => {
    it('should start up quickly (under 3 seconds)', async () => {
      const startTime = Date.now();

      await execa('node', [cliPath, '--version'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // 3 seconds
    });

    it('should handle rapid command execution', async () => {
      const commands = ['--version', '--help', 'hello'];

      for (const cmd of commands) {
        const result = await execa('node', [cliPath, cmd], {
          cwd: rootPath,
          sandbox: { enabled: true },
        });
        expect(result.exitCode).toBe(0);
      }
    });
  });
});
