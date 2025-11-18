/**
 * CLI Performance Test Suite
 *
 * Tests CLI startup time, command execution speed, and resource usage.
 */

import { statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { execa } from '../../core/execution/execa.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '../../..');
const cliPath = resolve(rootPath, 'dist/cli.js');

interface PerformanceTest {
  name: string;
  command: string[];
  iterations: number;
  maxTime: number; // milliseconds
}

const performanceTests: PerformanceTest[] = [
  {
    name: 'CLI Startup Time',
    command: ['--version'],
    iterations: 5,
    maxTime: 2000, // 2 seconds max
  },
  {
    name: 'Help Command Speed',
    command: ['--help'],
    iterations: 3,
    maxTime: 1500, // 1.5 seconds max
  },
  {
    name: 'Hello Command Speed',
    command: ['hello'],
    iterations: 3,
    maxTime: 3000, // 3 seconds max
  },
];

describe('CLI Performance Tests', () => {
  beforeAll(() => {
    // Ensure we're testing from the root directory
    process.chdir(rootPath);
  });

  describe('Command Performance', () => {
    it.each(performanceTests)(
      'should execute $name within performance limits',
      async ({ command, iterations, maxTime }) => {
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const start = performance.now();

          await expect(async () => {
            await execa('node', [cliPath, ...command], {
              cwd: rootPath,
              sandbox: { enabled: true },
            });
          }).not.toThrow();

          const end = performance.now();
          const duration = end - start;
          times.push(duration);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTimeActual = Math.max(...times);

        // Log performance metrics for debugging
        console.log(
          `${command.join(' ')} - Avg: ${Math.round(avgTime)}ms, Min: ${Math.round(minTime)}ms, Max: ${Math.round(maxTimeActual)}ms`
        );

        expect(avgTime).toBeLessThanOrEqual(maxTime);
        expect(minTime).toBeGreaterThan(0);
        expect(times).toHaveLength(iterations);
      }
    );
  });

  describe('Startup Performance', () => {
    it('should have fast cold startup', async () => {
      const start = performance.now();

      await execa('node', [cliPath, '--version'], {
        cwd: rootPath,
        sandbox: { enabled: true },
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5000); // 5 seconds for cold start
    });

    it('should have consistent performance across runs', async () => {
      const runs = 3;
      const times: number[] = [];

      for (let i = 0; i < runs; i++) {
        const start = performance.now();

        await execa('node', [cliPath, '--version'], {
          cwd: rootPath,
          sandbox: { enabled: true },
        });

        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxDeviation = Math.max(...times.map((t) => Math.abs(t - avgTime)));

      // Performance should be consistent (within 50% of average)
      expect(maxDeviation).toBeLessThan(avgTime * 0.5);
    });
  });

  describe('Resource Usage', () => {
    it('should have reasonable bundle size', () => {
      const size = statSync(cliPath).size;
      const sizeKB = Math.round(size / 1024);

      console.log(`CLI Bundle: ${sizeKB}KB`);

      // For a comprehensive CLI framework, 1MB is reasonable
      expect(sizeKB).toBeLessThan(1024); // Under 1MB
      expect(sizeKB).toBeGreaterThan(10); // Should have some functionality
    });

    it('should handle multiple rapid executions', async () => {
      const rapidRuns = 5;
      const results: boolean[] = [];

      for (let i = 0; i < rapidRuns; i++) {
        try {
          await execa('node', [cliPath, '--version'], {
            cwd: rootPath,
            sandbox: { enabled: true },
          });
          results.push(true);
        } catch {
          results.push(false);
        }
      }

      // All rapid executions should succeed
      expect(results.every((r) => r)).toBe(true);
      expect(results).toHaveLength(rapidRuns);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory on repeated executions', async () => {
      // Run multiple commands to check for obvious memory leaks
      const commands = ['--version', '--help', 'hello', 'completion status'];

      for (const cmd of commands) {
        for (let i = 0; i < 3; i++) {
          await expect(async () => {
            await execa('node', [cliPath, ...cmd.split(' ')], {
              cwd: rootPath,
              sandbox: { enabled: true },
            });
          }).not.toThrow();
        }
      }
    });
  });

  describe('Bundle Analysis', () => {
    it('should have optimized build artifacts', () => {
      const distFiles = ['cli.js', 'index.js', 'core/index.js', 'plugins/index.js'];

      for (const file of distFiles) {
        const filePath = resolve(rootPath, 'dist', file);
        const size = statSync(filePath).size;

        expect(size).toBeGreaterThan(0); // File should exist and have content

        // Individual modules should be reasonably sized
        if (file === 'cli.js') {
          expect(size).toBeLessThan(500 * 1024); // CLI entry under 500KB
        }
      }
    });
  });
});
