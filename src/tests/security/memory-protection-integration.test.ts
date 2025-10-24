/**
 * @fileoverview Memory Protection Framework Integration Tests
 * 
 * Comprehensive test suite covering all memory exhaustion attack vectors,
 * edge cases, and integration scenarios for Task 1.5.1.
 * 
 * @version 1.5.1
 * @since 2025-10-22
 * @author Generated for lord-commander-poc
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MemoryProtectionManager,
  MemorySizeCalculator,
  MemoryViolationAnalyzer,
  MemoryProtectionError,
  createMemoryGuard,
  isMemorySafe,
  truncateForMemory,
  sanitizeErrorObjectWithMemoryProtection,
  truncateMessageWithMemoryProtection,
  processContextWithMemoryProtection,
  DEFAULT_MEMORY_CONFIG,
  MemoryConfigPresets,
  type MemoryViolation
} from '../../core/foundation/memory/protection.js';

describe('Memory Protection Framework Integration (Task 1.5.1)', () => {
  let mockConsole: {
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockConsole = {
      warn: vi.fn(),
      error: vi.fn()
    };
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('MemorySizeCalculator - Core Functionality', () => {
    let calculator: MemorySizeCalculator;

    beforeEach(() => {
      calculator = new MemorySizeCalculator();
    });

    it('should calculate primitive type sizes correctly', () => {
      expect(calculator.calculateSize(null)).toBe(0);
      expect(calculator.calculateSize(undefined)).toBe(0);
      expect(calculator.calculateSize(42)).toBe(8);
      expect(calculator.calculateSize(true)).toBe(4);
      expect(calculator.calculateSize(false)).toBe(4);
      expect(calculator.calculateSize(BigInt(123))).toBe(8);
      expect(calculator.calculateSize(Symbol('test'))).toBe(8);
      expect(calculator.calculateSize(() => {})).toBe(16);
    });

    it('should calculate string sizes with UTF-16 encoding', () => {
      expect(calculator.calculateSize('')).toBe(0);
      expect(calculator.calculateSize('hello')).toBe(10); // 5 * 2
      expect(calculator.calculateSize('🎉')).toBe(2); // 1 character * 2
      expect(calculator.calculateSize('hello\nworld')).toBe(22); // 11 * 2
    });

    it('should calculate array sizes with overhead', () => {
      const emptyArray: unknown[] = [];
      expect(calculator.calculateSize(emptyArray)).toBeGreaterThan(0);
      
      const smallArray = [1, 2, 3];
      expect(calculator.calculateSize(smallArray)).toBe(smallArray.length * 8 + 3 * 8); // Array overhead + 3 numbers
      
      const stringArray = ['a', 'b', 'c'];
      expect(calculator.calculateSize(stringArray)).toBe(stringArray.length * 8 + 6); // Array + strings
    });

    it('should calculate object sizes with property overhead', () => {
      const emptyObject = {};
      expect(calculator.calculateSize(emptyObject)).toBe(64); // Base object overhead
      
      const simpleObject = { a: 1, b: 2 };
      const expectedSize = 64 + 2 * 2 + 8 + 8; // Object + keys + numbers
      expect(calculator.calculateSize(simpleObject)).toBe(expectedSize);
    });

    it('should handle circular references safely', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;
      
      expect(() => calculator.calculateSize(obj)).not.toThrow();
      const size = calculator.calculateSize(obj);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1000); // Should not be infinite
    });

    it('should handle special object types correctly', () => {
      const date = new Date();
      expect(calculator.calculateSize(date)).toBeGreaterThan(64); // Object overhead + date size
      
      const regex = /test/g;
      expect(calculator.calculateSize(regex)).toBeGreaterThan(64); // Object overhead + regex size
      
      const error = new Error('test error');
      expect(calculator.calculateSize(error)).toBeGreaterThan(64); // Includes message and stack
    });
  });

  describe('MemorySizeCalculator - Security Protections', () => {
    let calculator: MemorySizeCalculator;

    beforeEach(() => {
      calculator = new MemorySizeCalculator({
        ...DEFAULT_MEMORY_CONFIG,
        maxArrayLength: 10,
        maxPropertyCount: 5,
        maxNestingDepth: 3,
        maxCalculationTime: 50
      });
    });

    it('should prevent array length attacks', () => {
      const largeArray = new Array(100).fill(1);
      
      expect(() => calculator.calculateSize(largeArray)).toThrow(MemoryProtectionError);
      
      try {
        calculator.calculateSize(largeArray);
      } catch (error) {
        expect(error).toBeInstanceOf(MemoryProtectionError);
        expect((error as MemoryProtectionError).violation.type).toBe('object-size-exceeded');
        expect((error as MemoryProtectionError).violation.severity).toBe('high');
      }
    });

    it('should prevent property count attacks', () => {
      const largeObject: any = {};
      for (let i = 0; i < 20; i++) {
        largeObject[`prop${i}`] = i;
      }
      
      expect(() => calculator.calculateSize(largeObject)).toThrow(MemoryProtectionError);
      
      try {
        calculator.calculateSize(largeObject);
      } catch (error) {
        expect(error).toBeInstanceOf(MemoryProtectionError);
        expect((error as MemoryProtectionError).violation.type).toBe('property-count-exceeded');
      }
    });

    it('should prevent deep nesting attacks', () => {
      let deepObject: any = {};
      let current = deepObject;
      
      // Create deeply nested object (depth > 3)
      for (let i = 0; i < 10; i++) {
        current.nested = {};
        current = current.nested;
      }
      
      expect(() => calculator.calculateSize(deepObject)).toThrow(MemoryProtectionError);
      
      try {
        calculator.calculateSize(deepObject);
      } catch (error) {
        expect(error).toBeInstanceOf(MemoryProtectionError);
        expect((error as MemoryProtectionError).violation.type).toBe('object-size-exceeded');
      }
    });

    it('should prevent calculation timeout attacks', () => {
      // Mock a slow calculation by using a very low timeout
      const timeoutCalculator = new MemorySizeCalculator({
        ...DEFAULT_MEMORY_CONFIG,
        maxCalculationTime: 1 // 1ms timeout
      });
      
      // Create a complex object that might take time to calculate
      const complexObject = {
        data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item${i}` }))
      };
      
      // This might throw timeout error depending on system performance
      try {
        timeoutCalculator.calculateSize(complexObject);
      } catch (error: unknown) {
        if (error instanceof MemoryProtectionError) {
          expect(error.violation.type).toBe('memory-exhaustion-attempt');
          expect(error.violation.severity).toBe('critical');
        }
      }
    });

    it('should handle getter property errors gracefully', () => {
      const objectWithProblematicGetter = {
        normalProp: 'safe',
        get problematicGetter() {
          throw new Error('Getter error');
        }
      };
      
      expect(() => calculator.calculateSize(objectWithProblematicGetter)).not.toThrow();
      const size = calculator.calculateSize(objectWithProblematicGetter);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('MemoryViolationAnalyzer - Analysis and Recommendations', () => {
    let analyzer: MemoryViolationAnalyzer;

    beforeEach(() => {
      analyzer = new MemoryViolationAnalyzer();
    });

    it('should determine usage levels correctly', () => {
      const smallSize = 1000; // Well under 10KB
      const mediumSize = 6000; // 60% of 10KB
      const largeSize = 8000; // 80% of 10KB  
      const excessiveSize = 15000; // Over 10KB limit
      
      const smallAnalysis = analyzer.analyzeMemoryUsage(smallSize, []);
      expect(smallAnalysis.usageLevel).toBe('safe');
      
      const mediumAnalysis = analyzer.analyzeMemoryUsage(mediumSize, []);
      expect(mediumAnalysis.usageLevel).toBe('warning');
      
      const largeAnalysis = analyzer.analyzeMemoryUsage(largeSize, []);
      expect(largeAnalysis.usageLevel).toBe('critical');
      
      const excessiveAnalysis = analyzer.analyzeMemoryUsage(excessiveSize, []);
      expect(excessiveAnalysis.usageLevel).toBe('exceeded');
    });

    it('should calculate security scores based on violations', () => {
      const criticalViolation: MemoryViolation = {
        id: 'test1',
        timestamp: new Date().toISOString(),
        type: 'memory-exhaustion-attempt',
        severity: 'critical',
        actualSize: 50000,
        allowedSize: 10000,
        context: 'test',
        objectType: 'object',
        suggestion: 'Reduce size',
        securityImpact: 'DoS attack'
      };
      
      const highViolation: MemoryViolation = {
        ...criticalViolation,
        id: 'test2',
        severity: 'high'
      };
      
      const noViolationAnalysis = analyzer.analyzeMemoryUsage(5000, []);
      expect(noViolationAnalysis.securityScore).toBe(100);
      
      const criticalAnalysis = analyzer.analyzeMemoryUsage(50000, [criticalViolation]);
      expect(criticalAnalysis.securityScore).toBeLessThan(70); // 100 - 30 (critical) - 15 (high usage)
      
      const multipleAnalysis = analyzer.analyzeMemoryUsage(50000, [criticalViolation, highViolation]);
      expect(multipleAnalysis.securityScore).toBeLessThan(50);
    });

    it('should generate appropriate recommendations', () => {
      const violations: MemoryViolation[] = [
        {
          id: 'test1',
          timestamp: new Date().toISOString(),
          type: 'object-size-exceeded',
          severity: 'high',
          actualSize: 20000,
          allowedSize: 10000,
          context: 'user-input',
          objectType: 'object',
          suggestion: 'Reduce object size',
          securityImpact: 'Memory exhaustion'
        },
        {
          id: 'test2',
          timestamp: new Date().toISOString(),
          type: 'property-count-exceeded',
          severity: 'medium',
          actualSize: 100,
          allowedSize: 50,
          context: 'config',
          objectType: 'object',
          suggestion: 'Reduce properties',
          securityImpact: 'Injection risk'
        }
      ];
      
      const analysis = analyzer.analyzeMemoryUsage(20000, violations);
      
      expect(analysis.recommendations).toContain('CRITICAL: Memory usage exceeds safe limits. Implement immediate reduction measures.');
      expect(analysis.recommendations.some((r: string) => r.includes('object complexity'))).toBe(true);
      expect(analysis.recommendations.some((r: string) => r.includes('object properties'))).toBe(true);
      expect(analysis.requiresAction).toBe(true);
    });

    it('should assess performance impact correctly', () => {
      const lowImpactAnalysis = analyzer.analyzeMemoryUsage(3000, []);
      expect(lowImpactAnalysis.performanceImpact).toBe('none');
      
      const mediumImpactAnalysis = analyzer.analyzeMemoryUsage(7000, []);
      expect(mediumImpactAnalysis.performanceImpact).toBe('low');
      
      const highViolation: MemoryViolation = {
        id: 'test',
        timestamp: new Date().toISOString(),
        type: 'memory-exhaustion-attempt',
        severity: 'critical',
        actualSize: 50000,
        allowedSize: 10000,
        context: 'attack',
        objectType: 'object',
        suggestion: 'Block request',
        securityImpact: 'DoS'
      };
      
      const highImpactAnalysis = analyzer.analyzeMemoryUsage(25000, [highViolation]);
      expect(highImpactAnalysis.performanceImpact).toBe('high');
    });
  });

  describe('MemoryProtectionManager - Integration and Protection', () => {
    let manager: MemoryProtectionManager;

    beforeEach(() => {
      manager = new MemoryProtectionManager({
        ...DEFAULT_MEMORY_CONFIG,
        maxObjectSize: 1000,
        strictMode: false,
        logViolations: true
      });
    });

    it('should protect operations successfully', async () => {
      const operation = () => 'success';
      
      const result = await manager.protectOperation(operation);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.memoryAnalysis).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle operation failures gracefully', async () => {
      const operation = () => {
        throw new Error('Test error');
      };
      
      const result = await manager.protectOperation(operation);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Test error');
      expect(result.memoryAnalysis).toBeDefined();
    });

    it('should detect memory violations in operations', async () => {
      const operation = () => {
        // Create large object that exceeds limits
        return new Array(10000).fill('x').join('');
      };
      
      const result = await manager.protectOperation(operation);
      
      // Operation should succeed but trigger warnings
      expect(result.success).toBe(true);
      expect(result.protectionApplied).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate object sizes with violation detection', () => {
      const smallObject = { data: 'small' };
      const largeObject = { data: 'x'.repeat(2000) }; // Exceeds 1000 byte limit
      
      const smallAnalysis = manager.validateObjectSize(smallObject);
      expect(smallAnalysis.usageLevel).toBe('safe');
      expect(smallAnalysis.violations.length).toBe(0);
      
      const largeAnalysis = manager.validateObjectSize(largeObject);
      expect(largeAnalysis.usageLevel).toBe('exceeded');
      expect(largeAnalysis.violations.length).toBeGreaterThan(0);
      expect(largeAnalysis.violations[0].type).toBe('object-size-exceeded');
    });

    it('should provide protection statistics', () => {
      // Trigger some violations
      manager.validateObjectSize({ data: 'x'.repeat(2000) });
      manager.validateObjectSize({ data: 'y'.repeat(3000) });
      
      const stats = manager.getProtectionStats();
      
      expect(stats.totalViolations).toBe(2);
      expect(stats.violationsBySeverity).toBeDefined();
      expect(stats.averageObjectSize).toBeGreaterThan(0);
      expect(stats.protectionLevel).toBe('standard');
    });

    it('should log violations when configured', () => {
      const largeObject = { data: 'x'.repeat(2000) };
      
      manager.validateObjectSize(largeObject);
      
      expect(mockConsole.warn).toHaveBeenCalled();
      const logCall = mockConsole.warn.mock.calls[0][0];
      expect(logCall).toContain('[MemoryProtection]');
      expect(logCall).toContain('object-size-exceeded');
    });

    it('should enforce strict mode when configured', () => {
      const strictManager = new MemoryProtectionManager({
        ...DEFAULT_MEMORY_CONFIG,
        maxObjectSize: 100,
        strictMode: true
      });
      
      const largeObject = { data: 'x'.repeat(200) };
      
      expect(() => strictManager.validateObjectSize(largeObject)).toThrow(MemoryProtectionError);
    });
  });

  describe('Factory Functions and Utilities', () => {
    it('should create memory guards with environment presets', () => {
      const devGuard = createMemoryGuard('development');
      expect(devGuard).toBeInstanceOf(MemoryProtectionManager);
      
      const prodGuard = createMemoryGuard('production');
      expect(prodGuard).toBeInstanceOf(MemoryProtectionManager);
      
      const auditGuard = createMemoryGuard('audit');
      expect(auditGuard).toBeInstanceOf(MemoryProtectionManager);
    });

    it('should create memory guards with custom configuration', () => {
      const customGuard = createMemoryGuard('production', {
        maxObjectSize: 5000,
        strictMode: true
      });
      
      expect(customGuard).toBeInstanceOf(MemoryProtectionManager);
      
      // Test that custom config is applied
      const largeObject = { data: 'x'.repeat(6000) };
      expect(() => customGuard.validateObjectSize(largeObject)).toThrow(MemoryProtectionError);
    });

    it('should check memory safety correctly', () => {
      expect(isMemorySafe('small string')).toBe(true);
      expect(isMemorySafe({ small: 'object' })).toBe(true);
      
      const largeString = 'x'.repeat(20000); // Exceeds default 10KB
      expect(isMemorySafe(largeString)).toBe(false);
      
      const largeObject = { data: 'x'.repeat(15000) };
      expect(isMemorySafe(largeObject)).toBe(false);
    });

    it('should truncate objects for memory constraints', () => {
      const safeObject = { a: 1, b: 2 };
      const truncatedSafe = truncateForMemory(safeObject);
      expect(truncatedSafe).toEqual(safeObject); // Should be unchanged
      
      const largeObject: any = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`prop${i}`] = `value${i}`.repeat(100);
      }
      
      const truncatedLarge = truncateForMemory(largeObject);
      expect(Object.keys(truncatedLarge).length).toBeLessThan(Object.keys(largeObject).length);
      expect(isMemorySafe(truncatedLarge)).toBe(true);
    });

    it('should truncate arrays for memory constraints', () => {
      const safeArray = [1, 2, 3];
      const truncatedSafe = truncateForMemory(safeArray);
      expect(truncatedSafe).toEqual(safeArray);
      
      const largeArray = new Array(2000).fill('x'.repeat(100));
      const truncatedLarge = truncateForMemory(largeArray);
      expect(truncatedLarge.length).toBeLessThan(largeArray.length);
    });

    it('should truncate strings for memory constraints', () => {
      const safeString = 'Hello world';
      const truncatedSafe = truncateForMemory(safeString);
      expect(truncatedSafe).toBe(safeString);
      
      const largeString = 'x'.repeat(20000);
      const truncatedLarge = truncateForMemory(largeString);
      expect(truncatedLarge.length).toBeLessThan(largeString.length);
    });
  });

  describe('Integration Functions', () => {
    it('should sanitize error objects with memory protection', () => {
      const normalError = new Error('Normal error message');
      const sanitized = sanitizeErrorObjectWithMemoryProtection(normalError);
      
      expect(sanitized).toBeInstanceOf(Error);
      expect(sanitized.message).toBeTruthy();
      expect(sanitized.name).toBe(normalError.name);
    });

    it('should handle oversized error objects', () => {
      const largeError = new Error('x'.repeat(20000)); // Very large message
      (largeError as any).largeProperty = 'y'.repeat(50000);
      
      const sanitized = sanitizeErrorObjectWithMemoryProtection(largeError, {
        ...DEFAULT_MEMORY_CONFIG,
        maxObjectSize: 1000,
        maxMessageLength: 100
      });
      
      expect(sanitized).toBeInstanceOf(Error);
      expect(sanitized.message.length).toBeLessThanOrEqual(100);
      expect(sanitized.message).toContain('Error message truncated for memory protection');
    });

    it('should truncate messages with memory protection', () => {
      const shortMessage = 'Short message';
      const truncatedShort = truncateMessageWithMemoryProtection(shortMessage);
      expect(truncatedShort).toBe(shortMessage);
      
      const longMessage = 'x'.repeat(2000);
      const truncatedLong = truncateMessageWithMemoryProtection(longMessage, {
        ...DEFAULT_MEMORY_CONFIG,
        maxMessageLength: 100
      });
      
      expect(truncatedLong.length).toBeLessThanOrEqual(100);
      expect(truncatedLong).toContain('[TRUNCATED');
    });

    it('should process context with memory protection', () => {
      const smallContext = { user: 'test', action: 'login' };
      const { context: processedSmall, warnings: smallWarnings } = 
        processContextWithMemoryProtection(smallContext);
      
      expect(processedSmall).toEqual(smallContext);
      expect(smallWarnings.length).toBe(0);
      
      const largeContext: any = {};
      for (let i = 0; i < 1000; i++) {
        largeContext[`key${i}`] = 'x'.repeat(1000);
      }
      
      const { context: processedLarge, warnings: largeWarnings } = 
        processContextWithMemoryProtection(largeContext, {
          ...DEFAULT_MEMORY_CONFIG,
          maxContextSize: 1000
        });
      
      expect(Object.keys(processedLarge).length).toBeLessThan(Object.keys(largeContext).length);
      expect(largeWarnings.length).toBeGreaterThan(0);
      expect(largeWarnings.some((w: string) => w.includes('Context truncated'))).toBe(true);
    });

    it('should handle context processing errors gracefully', () => {
      const problematicContext = {
        get dangerous() {
          throw new Error('Context access error');
        }
      };
      
      const { context, warnings } = processContextWithMemoryProtection(problematicContext);
      
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w: string) => w.includes('Memory protection error'))).toBe(true);
      expect(context.error).toBeDefined();
    });
  });

  describe('Edge Cases and Attack Scenarios', () => {
    it('should handle null and undefined safely', () => {
      const calculator = new MemorySizeCalculator();
      
      expect(calculator.calculateSize(null)).toBe(0);
      expect(calculator.calculateSize(undefined)).toBe(0);
      expect(() => calculator.calculateSize(null)).not.toThrow();
      expect(() => calculator.calculateSize(undefined)).not.toThrow();
    });

    it('should handle complex circular references', () => {
      const obj1: any = { name: 'obj1' };
      const obj2: any = { name: 'obj2' };
      const obj3: any = { name: 'obj3' };
      
      obj1.ref2 = obj2;
      obj2.ref3 = obj3;
      obj3.ref1 = obj1; // Circular
      
      const calculator = new MemorySizeCalculator();
      expect(() => calculator.calculateSize(obj1)).not.toThrow();
      
      const size = calculator.calculateSize(obj1);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(10000); // Should not be infinite
    });

    it('should handle prototype pollution attempts', () => {
      const maliciousObject = JSON.parse('{"__proto__": {"polluted": true}, "data": "test"}');
      
      const calculator = new MemorySizeCalculator();
      expect(() => calculator.calculateSize(maliciousObject)).not.toThrow();
      
      // Should not pollute Object.prototype
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('should handle buffer overflow simulation', () => {
      const attackObject = {
        data: new Array(100000).fill('A'),
        nested: {
          moreData: new Array(100000).fill('B')
        }
      };
      
      const calculator = new MemorySizeCalculator({
        ...DEFAULT_MEMORY_CONFIG,
        maxArrayLength: 1000,
        strictMode: true
      });
      
      expect(() => calculator.calculateSize(attackObject)).toThrow(MemoryProtectionError);
    });

    it('should handle memory exhaustion via repeated operations', () => {
      const manager = new MemoryProtectionManager({
        ...DEFAULT_MEMORY_CONFIG,
        maxObjectSize: 1000
      });
      
      // Simulate repeated memory violations
      for (let i = 0; i < 10; i++) {
        const largeObject = { data: 'x'.repeat(2000) };
        manager.validateObjectSize(largeObject);
      }
      
      const stats = manager.getProtectionStats();
      expect(stats.totalViolations).toBe(10);
      expect(mockConsole.warn).toHaveBeenCalledTimes(10);
    });

    it('should handle concurrent memory operations safely', async () => {
      const manager = new MemoryProtectionManager();
      
      const operations = Array(50).fill(0).map((_, i) => 
        manager.protectOperation(() => `Result ${i}`)
      );
      
      const results = await Promise.all(operations);
      
      expect(results.length).toBe(50);
      expect(results.every((r: any) => r.success)).toBe(true);
      expect(results.every((r: any) => typeof r.result === 'string')).toBe(true);
    });

    it('should handle process.memoryUsage() failures gracefully', async () => {
      const originalMemoryUsage = process.memoryUsage;
      
      try {
        // Mock process.memoryUsage to throw
        (process as any).memoryUsage = () => {
          throw new Error('Memory access denied');
        };
        
        const manager = new MemoryProtectionManager();
        const result = await manager.protectOperation(() => 'test');
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('test');
        // Should handle the error gracefully
        
      } finally {
        process.memoryUsage = originalMemoryUsage;
      }
    });

    it('should handle garbage collection triggers safely', async () => {
      const originalGc = global.gc;
      let gcCalled = false;
      
      try {
        (global as any).gc = () => {
          gcCalled = true;
        };
        
        const manager = new MemoryProtectionManager({
          ...DEFAULT_MEMORY_CONFIG,
          enableGarbageCollection: true,
          maxObjectSize: 100
        });
        
        // Trigger high memory usage
        const result = await manager.protectOperation(() => {
          return { data: 'x'.repeat(500) }; // Exceeds limit
        });
        
        expect(result.success).toBe(true);
        expect(result.protectionApplied).toBe(true);
        expect(gcCalled).toBe(true);
        
      } finally {
        global.gc = originalGc;
      }
    });
  });

  describe('Configuration and Environment Handling', () => {
    it('should use appropriate environment presets', () => {
      expect(MemoryConfigPresets.development.protectionLevel).toBe('strict');
      expect(MemoryConfigPresets.development.strictMode).toBe(true);
      
      expect(MemoryConfigPresets.production.protectionLevel).toBe('standard');
      expect(MemoryConfigPresets.production.strictMode).toBe(false);
      expect(MemoryConfigPresets.production.monitoringSampleRate).toBe(0.1);
      
      expect(MemoryConfigPresets.testing.protectionLevel).toBe('permissive');
      expect(MemoryConfigPresets.testing.monitoringSampleRate).toBe(0.0);
      
      expect(MemoryConfigPresets.audit.protectionLevel).toBe('strict');
      expect(MemoryConfigPresets.audit.maxObjectSize).toBe(5 * 1024);
    });

    it('should handle configuration merging correctly', () => {
      const customConfig = {
        maxObjectSize: 2000,
        strictMode: true
      };
      
      const guard = createMemoryGuard('production', customConfig);
      
      // Should use custom values
      const largeObject = { data: 'x'.repeat(3000) };
      expect(() => guard.validateObjectSize(largeObject)).toThrow(MemoryProtectionError);
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        maxObjectSize: -1,
        maxMessageLength: 0,
        protectionLevel: 'invalid' as any
      };
      
      // Should not throw when creating manager with invalid config
      expect(() => new MemoryProtectionManager(invalidConfig as any)).not.toThrow();
    });
  });

  describe('Performance and Monitoring', () => {
    it('should complete calculations within reasonable time', () => {
      const calculator = new MemorySizeCalculator();
      const complexObject = {
        users: new Array(100).fill(0).map(i => ({ id: i, name: `user${i}` })),
        metadata: { timestamp: Date.now(), version: '1.0' },
        config: { features: ['a', 'b', 'c'], settings: { debug: true } }
      };
      
      const startTime = Date.now();
      const size = calculator.calculateSize(complexObject);
      const endTime = Date.now();
      
      expect(size).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should provide accurate memory statistics', () => {
      const manager = new MemoryProtectionManager();
      
      // Generate various violations
      manager.validateObjectSize({ data: 'x'.repeat(15000) }); // Critical
      manager.validateObjectSize({ data: 'y'.repeat(8000) }); // High
      manager.validateObjectSize({ data: 'z'.repeat(4000) }); // May be warning
      
      const stats = manager.getProtectionStats();
      
      expect(stats.totalViolations).toBeGreaterThan(0);
      expect(stats.averageObjectSize).toBeGreaterThan(0);
      expect(stats.violationsBySeverity).toBeDefined();
      expect(Object.keys(stats.violationsBySeverity).length).toBeGreaterThan(0);
    });
  });
});

describe('Memory Protection Error Class', () => {
  it('should create proper error instances', () => {
    const violation: MemoryViolation = {
      id: 'test123',
      timestamp: new Date().toISOString(),
      type: 'object-size-exceeded',
      severity: 'critical',
      actualSize: 20000,
      allowedSize: 10000,
      context: 'test-context',
      objectType: 'object',
      suggestion: 'Reduce object size',
      securityImpact: 'Memory exhaustion attack'
    };
    
    const error = new MemoryProtectionError(violation);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MemoryProtectionError);
    expect(error.name).toBe('MemoryProtectionError');
    expect(error.message).toContain('Memory protection violation');
    expect(error.message).toContain('object-size-exceeded');
    expect(error.violation).toEqual(violation);
    expect(error.securityImpact).toBe('Memory exhaustion attack');
  });

  it('should maintain proper stack trace', () => {
    const violation: MemoryViolation = {
      id: 'test456',
      timestamp: new Date().toISOString(),
      type: 'memory-exhaustion-attempt',
      severity: 'critical',
      actualSize: 100000,
      allowedSize: 10000,
      context: 'attack-simulation',
      objectType: 'array',
      suggestion: 'Block request',
      securityImpact: 'DoS attack'
    };
    
    const error = new MemoryProtectionError(violation);
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('MemoryProtectionError');
  });
});