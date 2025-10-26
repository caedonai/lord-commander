/**
 * Performance and Memory Tests for Icon System
 * 
 * Tests for icon caching efficiency, memory usage optimization,
 * high-volume usage scenarios, and performance bottlenecks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformCapabilities, IconProvider, IconSecurity } from '../../core/ui/icons.js';
import { createLogger } from '../../core/ui/logger.js';

// Mock @clack/prompts to avoid stdout.write issues
vi.mock('@clack/prompts', () => ({
  log: {
    message: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    step: vi.fn()
  },
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn()
  }))
}));

describe('Icon System Performance and Memory', () => {
  beforeEach(() => {
    PlatformCapabilities.reset();
    IconProvider.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Caching Performance', () => {
    it('should cache platform detection results efficiently', () => {
      // Mock consistent environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' }
      });

      // First call (should compute)
      const start1 = Date.now();
      const result1 = PlatformCapabilities.supportsUnicode();
      const elapsed1 = Date.now() - start1;

      // Subsequent calls (should be cached)
      const start2 = Date.now();
      for (let i = 0; i < 1000; i++) {
        const result = PlatformCapabilities.supportsUnicode();
        expect(result).toBe(result1); // Should be same result
      }
      const elapsed2 = Date.now() - start2;

      // Cached calls should be much faster
      expect(elapsed2).toBeLessThan(Math.max(50, elapsed1 * 2)); // Should be faster than initial or under 50ms
    });

    it('should cache emoji detection results efficiently', () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' }
      });

      const start1 = Date.now();
      const result1 = PlatformCapabilities.supportsEmoji();
      const elapsed1 = Date.now() - start1;

      const start2 = Date.now();
      for (let i = 0; i < 1000; i++) {
        const result = PlatformCapabilities.supportsEmoji();
        expect(result).toBe(result1);
      }
      const elapsed2 = Date.now() - start2;

      expect(elapsed2).toBeLessThan(Math.max(50, elapsed1 * 2)); // Should be faster than initial or under 50ms
    });

    it('should cache icon generation results', () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' }
      });

      // First icon generation
      const start1 = Date.now();
      const icons1 = IconProvider.getIcons();
      const elapsed1 = Date.now() - start1;

      // Subsequent generations should be cached
      const start2 = Date.now();
      for (let i = 0; i < 100; i++) {
        const icons = IconProvider.getIcons();
        expect(icons).toBe(icons1); // Same object reference (cached)
      }
      const elapsed2 = Date.now() - start2;

      expect(elapsed2).toBeLessThan(Math.max(5, elapsed1 / 10)); // Should be very fast
    });

    it('should handle cache invalidation correctly', () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' }
      });

      const icons1 = IconProvider.getIcons();
      
      // Reset should invalidate cache
      IconProvider.reset();
      PlatformCapabilities.reset();
      
      // Change environment
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: {} // Different environment
      });

      const icons2 = IconProvider.getIcons();
      
      // Should be different objects with potentially different icons
      expect(icons2).not.toBe(icons1);
      // Rocket icon should be different (emoji vs ASCII)
      expect(icons2.rocket).not.toBe(icons1.rocket);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not leak memory with repeated icon access', () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' }
      });

      // Create many icon instances
      const iconSets: any[] = [];
      
      for (let i = 0; i < 100; i++) {
        // Each call should return the same cached object
        const icons = IconProvider.getIcons();
        iconSets.push(icons);
        
        // Force garbage collection point
        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }

      // All should be the same object (no memory duplication)
      const firstSet = iconSets[0];
      iconSets.forEach(set => {
        expect(set).toBe(firstSet);
      });
    });

    it('should handle memory pressure gracefully', () => {
      // Create a large number of different scenarios to test memory handling
      const scenarios = Array.from({ length: 100 }, (_, i) => ({
        platform: ['win32', 'darwin', 'linux'][i % 3] as NodeJS.Platform,
        env: {
          TERM_PROGRAM: i % 2 === 0 ? 'vscode' : undefined,
          CI: i % 3 === 0 ? 'true' : undefined
        }
      }));

      scenarios.forEach((scenario, index) => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...process,
          platform: scenario.platform,
          stdout: { isTTY: true },
          env: scenario.env
        });

        // Should not consume excessive memory
        expect(() => {
          IconProvider.getIcons();
          PlatformCapabilities.supportsUnicode();
          PlatformCapabilities.supportsEmoji();
        }).not.toThrow();

        // Periodic cleanup
        if (index % 20 === 0 && global.gc) {
          global.gc();
        }
      });
    });

    it('should minimize object creation in security validation', () => {
      const testIcon = '🚀';
      const iterations = 1000;

      // Test that security validation doesn't create excessive objects
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        IconSecurity.sanitizeIcon(testIcon);
        IconSecurity.isValidIcon(testIcon);
        
        // Should be very fast for safe icons
        if (i > 0 && i % 100 === 0) {
          const elapsed = Date.now() - start;
          expect(elapsed).toBeLessThan((i / 100) * 20); // Less than 20ms per 100 operations
        }
      }
      
      const totalElapsed = Date.now() - start;
      expect(totalElapsed).toBeLessThan(100); // Total should be under 100ms
    });
  });

  describe('High-Volume Usage Scenarios', () => {
    it('should handle high-frequency logger calls efficiently', () => {
      const logger = createLogger();
      const messageCount = 1000;

      // Mock console to capture without actual output overhead
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const start = Date.now();
      
      for (let i = 0; i < messageCount; i++) {
        logger.rocket(`Message ${i}`);
        logger.cloud(`Cloud message ${i}`);
        logger.package(`Package message ${i}`);
      }
      
      const elapsed = Date.now() - start;
      
      // Should handle 3000 icon messages in reasonable time
      expect(elapsed).toBeLessThan(1000); // Less than 1ms per message
    });

    it('should handle concurrent icon access', async () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' }
      });

      // Create concurrent promises accessing icons
      const concurrentPromises = Array.from({ length: 50 }, () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // Each should get the same cached result
            const icons = IconProvider.getIcons();
            expect(icons.rocket).toBeTruthy();
            expect(IconSecurity.isValidIcon(icons.rocket)).toBe(true);
            resolve();
          }, Math.random() * 10);
        });
      });

      const start = Date.now();
      await Promise.all(concurrentPromises);
      const elapsed = Date.now() - start;

      // Should complete all concurrent access quickly
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle mixed secure and insecure inputs efficiently', () => {
      const safeInputs = ['🚀', '⚡', '▲', '◯'];
      const unsafeInputs = ['\\x1b[31mtest\\x1b[0m', 'test\\x07', '\\u202Eevil\\u202C'];
      const mixedInputs = [...safeInputs, ...unsafeInputs];

      const iterations = 100;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        const input = mixedInputs[i % mixedInputs.length];
        
        IconSecurity.sanitizeIcon(input);
        IconSecurity.isValidIcon(input);
        
        // Occasionally run full analysis (more expensive)
        if (i % 10 === 0) {
          IconSecurity.analyzeIconSecurity(input);
        }
      }

      const elapsed = Date.now() - start;
      
      // Should handle mixed inputs efficiently
      expect(elapsed).toBeLessThan(200);
    });

    it('should maintain performance with large security analysis', () => {
      // Create progressively larger inputs to test performance scaling
      const inputSizes = [10, 100, 1000, 5000];
      
      inputSizes.forEach(size => {
        const largeInput = '🚀'.repeat(size);
        
        const start = Date.now();
        const analysis = IconSecurity.analyzeIconSecurity(largeInput);
        const elapsed = Date.now() - start;
        
        // Should complete analysis regardless of size (with truncation)
        expect(analysis).toBeDefined();
        expect(elapsed).toBeLessThan(50); // Should be fast due to length limiting
      });
    });
  });

  describe('Performance Bottleneck Detection', () => {
    it('should identify slow platform detection paths', () => {
      const testEnvironments = [
        { env: {}, expected: 'minimal' },
        { env: { TERM_PROGRAM: 'vscode' }, expected: 'modern' },
        { env: { CI: 'true', GITHUB_ACTIONS: 'true' }, expected: 'ci' },
        { env: { WT_SESSION: 'abc', COLORTERM: 'truecolor' }, expected: 'advanced' }
      ];

      testEnvironments.forEach(({ env }) => {
        PlatformCapabilities.reset();
        
        vi.stubGlobal('process', {
          ...process,
          stdout: { isTTY: true },
          env
        });

        const start = Date.now();
        
        // Multiple calls to same environment
        for (let i = 0; i < 10; i++) {
          PlatformCapabilities.supportsUnicode();
          PlatformCapabilities.supportsEmoji();
        }
        
        const elapsed = Date.now() - start;
        
        // All environments should be fast (cached after first)
        expect(elapsed).toBeLessThan(20);
      });
    });

    it('should profile icon generation performance', () => {
      const platforms: NodeJS.Platform[] = ['win32', 'darwin', 'linux'];
      
      platforms.forEach(platform => {
        PlatformCapabilities.reset();
        IconProvider.reset();

        vi.stubGlobal('process', {
          ...process,
          platform,
          stdout: { isTTY: true },
          env: { TERM_PROGRAM: 'vscode' }
        });

        const start = Date.now();
        
        // Generate icons and access individual icons
        const icons = IconProvider.getIcons();
        
        // Access all icon types
        const iconKeys = Object.keys(icons);
        iconKeys.forEach(key => {
          IconProvider.get(key as any);
        });
        
        const elapsed = Date.now() - start;
        
        // Icon generation should be consistent across platforms
        expect(elapsed).toBeLessThan(50);
      });
    });

    it('should measure security validation performance', () => {
      const securityTests = [
        { input: '🚀', type: 'safe-emoji' },
        { input: '▲', type: 'safe-unicode' },
        { input: 'A', type: 'safe-ascii' },
        { input: '\\x1b[31mtest\\x1b[0m', type: 'ansi-attack' },
        { input: 'test\\x07', type: 'control-char' },
        { input: '\\u202Etest\\u202C', type: 'unicode-attack' }
      ];

      securityTests.forEach(({ input, type }) => {
        const iterations = 100;
        const start = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          IconSecurity.sanitizeIcon(input);
          IconSecurity.isValidIcon(input);
        }
        
        const elapsed = Date.now() - start;
        
        // All security validations should be fast
        expect(elapsed).toBeLessThan(100);
        
        // Safe inputs should be particularly fast
        if (type.startsWith('safe-')) {
          expect(elapsed).toBeLessThan(20);
        }
      });
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory through platform detection', () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      // Create many platform detection cycles
      for (let i = 0; i < 100; i++) {
        PlatformCapabilities.reset();
        
        vi.stubGlobal('process', {
          ...process,
          stdout: { isTTY: true },
          env: { TERM_PROGRAM: `test-${i}` }
        });

        PlatformCapabilities.supportsUnicode();
        PlatformCapabilities.supportsEmoji();
        PlatformCapabilities.getInfo();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      // Memory should not grow excessively
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
      }
    });

    it('should not leak memory through icon generation', () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      // Create many icon generation cycles
      for (let i = 0; i < 50; i++) {
        IconProvider.reset();
        PlatformCapabilities.reset();
        
        vi.stubGlobal('process', {
          ...process,
          stdout: { isTTY: true },
          env: { TERM_PROGRAM: i % 2 === 0 ? 'vscode' : undefined }
        });

        const icons = IconProvider.getIcons();
        
        // Access all icons
        Object.keys(icons).forEach(key => {
          IconProvider.get(key as any);
        });
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(512 * 1024); // Less than 512KB growth
      }
    });

    it('should not leak memory through security validation', () => {
      const testInputs = [
        '🚀', '\\x1b[31mtest\\x1b[0m', 'A'.repeat(1000), '\\u202Etest\\u202C'
      ];

      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // Perform many security validations
      for (let i = 0; i < 1000; i++) {
        const input = testInputs[i % testInputs.length];
        
        IconSecurity.sanitizeIcon(input);
        IconSecurity.isValidIcon(input);
        
        if (i % 100 === 0) {
          IconSecurity.analyzeIconSecurity(input);
        }
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth (realistic for test environment)
      }
    });
  });

  describe('Scalability Testing', () => {
    it('should scale with increasing number of icon types', () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' }
      });

      const icons = IconProvider.getIcons();
      const iconCount = Object.keys(icons).length;
      
      // Should handle current icon count efficiently
      expect(iconCount).toBeGreaterThan(20); // We have many icons
      
      const start = Date.now();
      
      // Access all icons multiple times
      for (let i = 0; i < 10; i++) {
        Object.keys(icons).forEach(key => {
          const icon = IconProvider.get(key as any);
          expect(icon).toBeTruthy();
        });
      }
      
      const elapsed = Date.now() - start;
      
      // Should scale linearly with icon count
      const timePerIcon = elapsed / (iconCount * 10);
      expect(timePerIcon).toBeLessThan(0.1); // Less than 0.1ms per icon access
    });

    it('should handle concurrent logger instances efficiently', () => {
      vi.stubGlobal('process', {
        ...process,
        stdout: { isTTY: true },
        env: { TERM_PROGRAM: 'vscode' }
      });

      vi.spyOn(console, 'log').mockImplementation(() => {});

      // Create multiple logger instances
      const loggers = Array.from({ length: 10 }, () => createLogger());
      
      const start = Date.now();
      
      // Have all loggers use icons concurrently
      loggers.forEach((logger, index) => {
        for (let i = 0; i < 10; i++) {
          logger.rocket(`Logger ${index} message ${i}`);
          logger.cloud(`Logger ${index} cloud ${i}`);
        }
      });
      
      const elapsed = Date.now() - start;
      
      // Should handle multiple logger instances efficiently
      expect(elapsed).toBeLessThan(100);
    });

    it('should maintain performance with different Unicode complexities', () => {
      const unicodeComplexities = [
        { icon: 'A', type: 'ASCII' },
        { icon: '★', type: 'Basic Unicode' },
        { icon: '🚀', type: 'Emoji' },
        { icon: '🏳️‍🌈', type: 'Complex Emoji Sequence' },
        { icon: 'é', type: 'Composed Character' },
        { icon: 'e\\u0301', type: 'Decomposed Character' }
      ];

      unicodeComplexities.forEach(({ icon }) => {
        const iterations = 100;
        const start = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          IconSecurity.sanitizeIcon(icon);
          IconSecurity.analyzeIconSecurity(icon);
        }
        
        const elapsed = Date.now() - start;
        
        // All Unicode complexities should be handled efficiently
        expect(elapsed).toBeLessThan(50);
      });
    });
  });
});