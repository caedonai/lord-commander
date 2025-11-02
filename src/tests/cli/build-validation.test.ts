/**
 * CLI Build Validation Test Suite
 *
 * Validates that the CLI was built correctly and all entry points work.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { execa } from '../../core/execution/execa.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '../../..');
const distPath = resolve(rootPath, 'dist');
const cliPath = resolve(distPath, 'cli.js');

describe('CLI Build Validation', () => {
  beforeAll(() => {
    // Ensure we're testing from the root directory
    process.chdir(rootPath);
  });

  describe('Build Files', () => {
    const requiredFiles = ['cli.js', 'index.js', 'core/index.js', 'plugins/index.js'];

    it.each(requiredFiles)('should have built file: %s', (file) => {
      const filePath = resolve(distPath, file);
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('CLI Executable', () => {
    it('should have correct shebang in CLI file', () => {
      const cliContent = readFileSync(cliPath, 'utf-8');
      expect(cliContent.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    it('should execute help command successfully', async () => {
      const result = await execa('node', ['dist/cli.js', '--help'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
    });

    it('should execute version command successfully', async () => {
      const result = await execa('node', ['dist/cli.js', '--version'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      expect(result.exitCode).toBe(0);

      // Extract version from output that may contain completion setup messages
      const lines = result.stdout.split('\n');
      const versionLine = lines.find((line: string) => /^\d+\.\d+\.\d+/.test(line.trim()));

      expect(versionLine).toBeDefined();
      expect(versionLine).toMatch(/^\d+\.\d+\.\d+/); // Should match semantic version
      expect(result.stdout).not.toContain('undefined');
    });

    it('should execute hello command successfully', async () => {
      const result = await execa('node', ['dist/cli.js', 'hello'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Hello');
    });
  });

  describe('Package Configuration', () => {
    let packageJson: any;

    beforeAll(() => {
      packageJson = JSON.parse(readFileSync(resolve(rootPath, 'package.json'), 'utf-8'));
    });

    it('should have binary entry points configured', () => {
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.bin['lord-commander']).toBeDefined();
      expect(packageJson.bin['lord-commander']).toBe('dist/cli.js');
    });

    it('should include dist in files array', () => {
      expect(packageJson.files).toBeDefined();
      expect(packageJson.files).toContain('dist');
    });

    it('should have correct main entry point', () => {
      expect(packageJson.main).toBe('dist/index.js');
    });

    it('should have correct module entry point', () => {
      // Module field is optional for ESM packages, main is sufficient
      expect(packageJson.main).toBe('dist/index.js');
    });

    it('should be marked as ESM', () => {
      expect(packageJson.type).toBe('module');
    });
  });
});
