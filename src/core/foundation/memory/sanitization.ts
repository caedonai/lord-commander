/**
 * @fileoverview Advanced Object Sanitization Enhancement (Task 1.5.2)
 *
 * This module provides comprehensive object sanitization with performance optimization,
 * security protection, and advanced edge case handling. It integrates with the existing
 * memory protection framework and security patterns to provide enterprise-grade
 * object processing capabilities.
 *
 * @module memory-sanitization
 * @version 1.5.2
 * @since 2025-10-26
 * @author Generated for lord-commander-poc
 *
 * @security Advanced object sanitization with prototype pollution protection
 * @performance Optimized sanitization algorithms with caching and batch processing
 * @architecture SOLID principles compliance with extensible design patterns
 *
 * @example
 * ```typescript
 * import { AdvancedObjectSanitizer, createObjectSanitizer } from '@caedonai/sdk/core';
 *
 * const sanitizer = createObjectSanitizer({
 *   maxDepth: 10,
 *   maxProperties: 100,
 *   enableCache: true
 * });
 *
 * const result = await sanitizer.sanitizeObject(userInput);
 * if (result.isValid) {
 *   console.log('Sanitized object:', result.sanitized);
 * }
 * ```
 */

import { sanitizeErrorMessage } from '../errors/sanitization.js';
import { analyzeLogSecurity, sanitizeLogOutputAdvanced } from '../logging/security.js';
import { analyzeInputSecurity } from '../security/patterns.js';
import { DEFAULT_MEMORY_CONFIG, type MemoryProtectionConfig } from './protection.js';

/**
 * Object sanitization levels for graduated response
 */
export type ObjectSanitizationLevel = 'minimal' | 'standard' | 'strict' | 'paranoid';

/**
 * Object type classification for sanitization strategies
 */
export type ObjectType =
  | 'primitive'
  | 'plain-object'
  | 'array'
  | 'date'
  | 'regex'
  | 'function'
  | 'class-instance'
  | 'buffer'
  | 'circular'
  | 'unknown';

/**
 * Sanitization strategy for different object types
 */
export type SanitizationStrategy =
  | 'preserve' // Keep as-is
  | 'sanitize' // Clean and validate
  | 'redact' // Replace with placeholder
  | 'remove' // Remove completely
  | 'truncate' // Limit size/depth
  | 'flatten'; // Convert to simple representation

/**
 * Advanced object sanitization configuration
 */
export interface ObjectSanitizationConfig extends MemoryProtectionConfig {
  // === Core Sanitization Settings ===
  /** Sanitization level for graduated response */
  readonly sanitizationLevel: ObjectSanitizationLevel;

  /** Maximum object depth for circular reference prevention */
  readonly maxDepth: number;

  /** Maximum number of properties per object */
  readonly maxProperties: number;

  /** Maximum array length for processing */
  readonly maxArrayLength: number;

  /** Maximum string length for properties */
  readonly maxStringLength: number;

  // === Security Settings ===
  /** Remove dangerous prototype properties */
  readonly removePrototypeProperties: boolean;

  /** Sanitize function properties */
  readonly sanitizeFunctions: boolean;

  /** Remove circular references */
  readonly removeCircularReferences: boolean;

  /** Validate against injection patterns */
  readonly enableInjectionProtection: boolean;

  /** Block dangerous object types */
  readonly blockDangerousTypes: boolean;

  // === Performance Settings ===
  /** Enable sanitization result caching */
  readonly enableCache: boolean;

  /** Cache TTL in milliseconds */
  readonly cacheTTL: number;

  /** Maximum cache size (number of entries) */
  readonly maxCacheSize: number;

  /** Enable batch processing for large collections */
  readonly enableBatchProcessing: boolean;

  /** Batch size for processing arrays/objects */
  readonly batchSize: number;

  /** Maximum processing time per object (ms) */
  readonly maxProcessingTime: number;

  // === Output Settings ===
  /** Preserve original object keys order */
  readonly preserveKeyOrder: boolean;

  /** Include metadata in sanitization result */
  readonly includeMetadata: boolean;

  /** Generate detailed sanitization report */
  readonly generateReport: boolean;

  /** Custom property name patterns to redact */
  readonly customRedactionPatterns: RegExp[];

  /** Custom sanitization strategies by object type */
  readonly customStrategies: Map<ObjectType, SanitizationStrategy>;
}

/**
 * Object sanitization result with comprehensive metadata
 */
export interface ObjectSanitizationResult {
  /** Whether sanitization was successful */
  readonly isValid: boolean;

  /** Sanitized object (if successful) */
  readonly sanitized?: any;

  /** Original object type classification */
  readonly originalType: ObjectType;

  /** Applied sanitization strategy */
  readonly strategy: SanitizationStrategy;

  /** Size reduction achieved (bytes) */
  readonly sizeReduction: number;

  /** Processing time taken (ms) */
  readonly processingTime: number;

  /** Security violations detected */
  readonly violations: ObjectSanitizationViolation[];

  /** Warnings generated during sanitization */
  readonly warnings: string[];

  /** Performance metrics */
  readonly metrics: SanitizationMetrics;

  /** Detailed sanitization report */
  readonly report?: SanitizationReport;
}

/**
 * Object sanitization violation details
 */
export interface ObjectSanitizationViolation {
  readonly id: string;
  readonly type: ObjectSanitizationViolationType;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly path: string;
  readonly description: string;
  readonly originalValue: any;
  readonly sanitizedValue: any;
  readonly recommendation: string;
}

/**
 * Object sanitization violation types
 */
export type ObjectSanitizationViolationType =
  | 'prototype-pollution'
  | 'circular-reference'
  | 'dangerous-function'
  | 'oversized-property'
  | 'injection-attempt'
  | 'deep-nesting'
  | 'suspicious-pattern'
  | 'buffer-overflow'
  | 'type-confusion'
  | 'memory-exhaustion';

/**
 * Sanitization performance metrics
 */
export interface SanitizationMetrics {
  readonly totalObjects: number;
  readonly processedObjects: number;
  readonly skippedObjects: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly memoryUsage: number;
  readonly processingRate: number; // objects per second
}

/**
 * Detailed sanitization report
 */
export interface SanitizationReport {
  readonly summary: {
    readonly originalSize: number;
    readonly finalSize: number;
    readonly compressionRatio: number;
    readonly securityImprovements: number;
  };
  readonly transformations: SanitizationTransformation[];
  readonly securityAnalysis: SecurityAnalysis;
  readonly performanceAnalysis: PerformanceAnalysis;
}

/**
 * Object transformation record
 */
export interface SanitizationTransformation {
  readonly path: string;
  readonly originalType: ObjectType;
  readonly finalType: ObjectType;
  readonly strategy: SanitizationStrategy;
  readonly reason: string;
}

/**
 * Security analysis for sanitized object
 */
export interface SecurityAnalysis {
  readonly riskScore: number; // 0-100, lower is safer
  readonly threatsMitigated: string[];
  readonly remainingRisks: string[];
  readonly complianceLevel: 'basic' | 'standard' | 'enhanced' | 'enterprise';
}

/**
 * Performance analysis for sanitization operation
 */
export interface PerformanceAnalysis {
  readonly efficiency: number; // 0-100, higher is better
  readonly bottlenecks: string[];
  readonly optimizations: string[];
  readonly scalabilityNotes: string[];
}

/**
 * Default object sanitization configuration
 */
export const DEFAULT_OBJECT_SANITIZATION_CONFIG: ObjectSanitizationConfig = {
  ...DEFAULT_MEMORY_CONFIG,

  // Core Sanitization Settings
  sanitizationLevel: 'standard',
  maxDepth: 10,
  maxProperties: 100,
  maxArrayLength: 1000,
  maxStringLength: 10000,

  // Security Settings
  removePrototypeProperties: true,
  sanitizeFunctions: true,
  removeCircularReferences: true,
  enableInjectionProtection: true,
  blockDangerousTypes: true,

  // Performance Settings
  enableCache: true,
  cacheTTL: 300000, // 5 minutes
  maxCacheSize: 1000,
  enableBatchProcessing: true,
  batchSize: 100,
  maxProcessingTime: 5000, // 5 seconds

  // Output Settings
  preserveKeyOrder: true,
  includeMetadata: true,
  generateReport: false, // Disabled by default for performance
  customRedactionPatterns: [],
  customStrategies: new Map(),
};

/**
 * Sanitization cache entry for performance optimization
 */
interface SanitizationCacheEntry {
  readonly result: ObjectSanitizationResult;
  readonly timestamp: number;
  readonly hitCount: number;
}

/**
 * Advanced object sanitizer with comprehensive security and performance features
 *
 * @class AdvancedObjectSanitizer
 * @since 1.5.2
 *
 * @principle Single Responsibility - Handles object sanitization operations
 * @principle Open/Closed - Extensible for new sanitization strategies
 * @principle Liskov Substitution - Can be substituted with specialized implementations
 * @principle Interface Segregation - Focused interface for object sanitization
 * @principle Dependency Inversion - Depends on configuration and security abstractions
 */
export class AdvancedObjectSanitizer {
  private readonly config: ObjectSanitizationConfig;
  private readonly cache = new Map<string, SanitizationCacheEntry>();
  private readonly processingStats = {
    totalOperations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageProcessingTime: 0,
  };

  constructor(config: Partial<ObjectSanitizationConfig> = {}) {
    this.config = { ...DEFAULT_OBJECT_SANITIZATION_CONFIG, ...config };

    // Start cache cleanup timer if caching is enabled
    if (this.config.enableCache) {
      this.startCacheCleanup();
    }
  }

  /**
   * Sanitize an object with comprehensive security and performance optimization
   *
   * @param obj - Object to sanitize
   * @param path - Current object path for violation reporting
   * @returns Sanitization result with metadata
   */
  public async sanitizeObject(obj: any, path: string = 'root'): Promise<ObjectSanitizationResult> {
    const startTime = performance.now();
    const violations: ObjectSanitizationViolation[] = [];
    const warnings: string[] = [];

    try {
      // Check cache first if enabled
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(obj, path);
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          this.processingStats.cacheHits++;
          return cached;
        }
        this.processingStats.cacheMisses++;
      }

      // Classify object type and generate warnings for special cases
      const originalType = this.classifyObjectType(obj);

      // Generate warning for circular references
      if (originalType === 'circular') {
        warnings.push('Circular reference detected and will be handled during sanitization');
      }

      // Check for immediate security violations
      const securityViolations = await this.detectSecurityViolations(obj, path, originalType);
      violations.push(...securityViolations);

      // Determine sanitization strategy
      const strategy = this.determineSanitizationStrategy(obj, originalType, violations);

      // Apply sanitization strategy
      const sanitizationResult = await this.applySanitizationStrategy(
        obj,
        originalType,
        strategy,
        path,
        violations,
        warnings
      );

      const processingTime = performance.now() - startTime;

      // Check processing time limits
      if (processingTime > this.config.maxProcessingTime) {
        warnings.push(
          `Processing time exceeded limit: ${processingTime}ms > ${this.config.maxProcessingTime}ms`
        );
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(obj, sanitizationResult.sanitized, processingTime);

      // Generate report if requested
      const report = this.config.generateReport
        ? await this.generateSanitizationReport(
            obj,
            sanitizationResult.sanitized,
            violations,
            metrics
          )
        : undefined;

      const result: ObjectSanitizationResult = {
        isValid: violations.filter((v) => v.severity === 'critical').length === 0,
        sanitized: sanitizationResult.sanitized,
        originalType,
        strategy,
        sizeReduction: sanitizationResult.sizeReduction,
        processingTime,
        violations,
        warnings,
        metrics,
        report,
      };

      // Cache result if enabled
      if (this.config.enableCache && result.isValid) {
        const cacheKey = this.generateCacheKey(obj, path);
        this.setCachedResult(cacheKey, result);
      }

      // Update processing statistics
      this.updateProcessingStats(processingTime);

      return result;
    } catch (error) {
      const processingTime = performance.now() - startTime;

      return {
        isValid: false,
        originalType: 'unknown',
        strategy: 'remove',
        sizeReduction: 0,
        processingTime,
        violations: [
          {
            id: `SANITIZE_ERROR_${Date.now()}`,
            type: 'memory-exhaustion',
            severity: 'critical',
            path,
            description: `Sanitization failed: ${sanitizeErrorMessage(error instanceof Error ? error.message : String(error))}`,
            originalValue: '[Error during processing]',
            sanitizedValue: null,
            recommendation: 'Review object structure and reduce complexity',
          },
        ],
        warnings: [`Sanitization failed for object at path '${path}'`],
        metrics: {
          totalObjects: 1,
          processedObjects: 0,
          skippedObjects: 1,
          cacheHits: 0,
          cacheMisses: 0,
          memoryUsage: 0,
          processingRate: 0,
        },
      };
    }
  }

  /**
   * Sanitize multiple objects in batch with performance optimization
   *
   * @param objects - Array of objects to sanitize
   * @returns Array of sanitization results
   */
  public async sanitizeBatch(objects: any[]): Promise<ObjectSanitizationResult[]> {
    if (!this.config.enableBatchProcessing || objects.length <= this.config.batchSize) {
      // Process all at once if batch processing disabled or small batch
      return Promise.all(objects.map((obj, index) => this.sanitizeObject(obj, `batch[${index}]`)));
    }

    // Process in batches for better memory management
    const results: ObjectSanitizationResult[] = [];

    for (let i = 0; i < objects.length; i += this.config.batchSize) {
      const batch = objects.slice(i, i + this.config.batchSize);
      const batchResults = await Promise.all(
        batch.map((obj, batchIndex) => this.sanitizeObject(obj, `batch[${i + batchIndex}]`))
      );
      results.push(...batchResults);

      // Optional: yield control between batches for non-blocking processing
      if (i + this.config.batchSize < objects.length) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return results;
  }

  /**
   * Classify object type for appropriate sanitization strategy
   *
   * @param obj - Object to classify
   * @returns Object type classification
   */
  private classifyObjectType(obj: any): ObjectType {
    if (obj === null || obj === undefined) return 'primitive';

    const type = typeof obj;

    if (
      type === 'boolean' ||
      type === 'number' ||
      type === 'string' ||
      type === 'symbol' ||
      type === 'bigint'
    ) {
      return 'primitive';
    }

    if (type === 'function') return 'function';

    if (Array.isArray(obj)) return 'array';

    if (obj instanceof Date) return 'date';
    if (obj instanceof RegExp) return 'regex';
    if (obj instanceof Buffer) return 'buffer';

    // Check for circular references early
    if (this.hasCircularReferences(obj)) return 'circular';

    // Check if it's a class instance vs plain object
    if (obj.constructor && obj.constructor !== Object) {
      return 'class-instance';
    }

    if (type === 'object' && obj.constructor === Object) {
      return 'plain-object';
    }

    return 'unknown';
  }

  /**
   * Detect security violations in object
   *
   * @param obj - Object to analyze
   * @param path - Current object path
   * @param type - Object type
   * @returns Array of security violations
   */
  private async detectSecurityViolations(
    obj: any,
    path: string,
    _type: ObjectType
  ): Promise<ObjectSanitizationViolation[]> {
    const violations: ObjectSanitizationViolation[] = [];

    if (!obj || typeof obj !== 'object') return violations;

    try {
      // Check for prototype pollution
      if (this.hasPrototypePollution(obj)) {
        violations.push({
          id: `PROTO_POLLUTION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'prototype-pollution',
          severity: 'critical',
          path,
          description: 'Object contains dangerous prototype properties',
          originalValue: obj,
          sanitizedValue: null,
          recommendation: 'Remove __proto__, constructor, and prototype properties',
        });
      }

      // Check for dangerous functions
      if (this.hasDangerousFunctions(obj)) {
        violations.push({
          id: `DANGEROUS_FUNC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'dangerous-function',
          severity: 'high',
          path,
          description: 'Object contains potentially dangerous functions',
          originalValue: obj,
          sanitizedValue: null,
          recommendation: 'Remove or sanitize function properties',
        });
      }

      // Check object size
      const objSize = this.calculateObjectSize(obj);
      if (objSize > this.config.maxObjectSize) {
        violations.push({
          id: `OVERSIZED_OBJ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'oversized-property',
          severity: objSize > this.config.maxObjectSize * 2 ? 'critical' : 'high',
          path,
          description: `Object size exceeds limit: ${objSize} > ${this.config.maxObjectSize} bytes`,
          originalValue: obj,
          sanitizedValue: null,
          recommendation: 'Reduce object size or implement pagination',
        });
      }

      // Check nesting depth
      const depth = this.calculateObjectDepth(obj);
      if (depth > this.config.maxDepth) {
        violations.push({
          id: `DEEP_NESTING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'deep-nesting',
          severity: depth > this.config.maxDepth * 2 ? 'critical' : 'medium',
          path,
          description: `Object nesting exceeds limit: ${depth} > ${this.config.maxDepth} levels`,
          originalValue: obj,
          sanitizedValue: null,
          recommendation: 'Flatten object structure or reduce nesting depth',
        });
      }

      // Check for injection patterns if enabled
      if (this.config.enableInjectionProtection) {
        const injectionViolations = await this.detectInjectionPatterns(obj, path);
        violations.push(...injectionViolations);
      }
    } catch (error) {
      violations.push({
        id: `DETECTION_ERROR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'memory-exhaustion',
        severity: 'high',
        path,
        description: `Security detection failed: ${sanitizeErrorMessage(error instanceof Error ? error.message : String(error))}`,
        originalValue: obj,
        sanitizedValue: null,
        recommendation: 'Review object for complexity issues',
      });
    }

    return violations;
  }

  /**
   * Determine appropriate sanitization strategy based on object analysis
   *
   * @param obj - Object to analyze
   * @param type - Object type
   * @param violations - Detected violations
   * @returns Sanitization strategy
   */
  private determineSanitizationStrategy(
    _obj: any,
    type: ObjectType,
    violations: ObjectSanitizationViolation[]
  ): SanitizationStrategy {
    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    const highViolations = violations.filter((v) => v.severity === 'high');

    // Check for custom strategies first
    if (this.config.customStrategies.has(type)) {
      const strategy = this.config.customStrategies.get(type);
      if (strategy) {
        return strategy;
      }
    }

    // Critical violations require removal
    if (criticalViolations.length > 0) {
      return 'remove';
    }

    // High violations require redaction in strict mode
    if (highViolations.length > 0 && this.config.sanitizationLevel === 'strict') {
      return 'redact';
    }

    // Strategy based on sanitization level and object type
    switch (this.config.sanitizationLevel) {
      case 'minimal':
        return type === 'function' || type === 'circular' ? 'redact' : 'preserve';

      case 'standard':
        if (type === 'function' && this.config.sanitizeFunctions) return 'redact';
        if (type === 'circular' && this.config.removeCircularReferences) return 'redact';
        if (type === 'buffer' || type === 'unknown') return 'redact';
        return 'sanitize';

      case 'strict':
        if (['function', 'circular', 'buffer', 'unknown', 'class-instance'].includes(type)) {
          return 'redact';
        }
        return 'sanitize';

      case 'paranoid':
        if (['primitive', 'plain-object', 'array'].includes(type)) {
          return 'sanitize';
        }
        return 'remove';

      default:
        return 'sanitize';
    }
  }

  /**
   * Apply sanitization strategy to object
   *
   * @param obj - Object to sanitize
   * @param type - Object type
   * @param strategy - Sanitization strategy
   * @param path - Current object path
   * @param violations - Violation array to append to
   * @param warnings - Warning array to append to
   * @returns Sanitized object and size reduction
   */
  private async applySanitizationStrategy(
    obj: any,
    type: ObjectType,
    strategy: SanitizationStrategy,
    path: string,
    violations: ObjectSanitizationViolation[],
    warnings: string[]
  ): Promise<{ sanitized: any; sizeReduction: number }> {
    const originalSize = this.calculateObjectSize(obj);

    let sanitized: any;

    switch (strategy) {
      case 'preserve':
        // Preserve the original object as-is
        sanitized = obj;
        break;

      case 'sanitize':
        sanitized = await this.deepSanitizeObject(obj, path, violations, warnings);
        break;

      case 'redact':
        sanitized = this.redactObject(obj, type, path);
        break;

      case 'remove':
        sanitized = null;
        break;

      case 'truncate':
        sanitized = this.truncateObject(obj, type);
        break;

      case 'flatten':
        sanitized = this.flattenObject(obj, path, violations, warnings);
        break;

      default:
        sanitized = await this.deepSanitizeObject(obj, path, violations, warnings);
    }

    const finalSize = this.calculateObjectSize(sanitized);
    const sizeReduction = Math.max(0, originalSize - finalSize);

    return { sanitized, sizeReduction };
  }

  /**
   * Deep sanitize object recursively with security protections
   *
   * @param obj - Object to sanitize
   * @param path - Current object path
   * @param violations - Violation array to append to
   * @param warnings - Warning array to append to
   * @param depth - Current recursion depth
   * @param seen - WeakSet to track circular references
   * @returns Sanitized object
   */
  private async deepSanitizeObject(
    obj: any,
    path: string,
    violations: ObjectSanitizationViolation[],
    warnings: string[],
    depth: number = 0,
    seen: WeakSet<object> = new WeakSet()
  ): Promise<any> {
    // Base cases
    if (obj === null || obj === undefined) return obj;

    // Primitive types
    if (typeof obj !== 'object' && typeof obj !== 'function') {
      return this.sanitizePrimitive(obj, path, violations, warnings);
    }

    // Check depth limit
    if (depth >= this.config.maxDepth) {
      warnings.push(`Maximum depth reached at path '${path}', truncating`);
      return '[Max Depth Exceeded]';
    }

    // Check for circular references
    if (typeof obj === 'object' && seen.has(obj)) {
      warnings.push(`Circular reference detected at path '${path}', removing reference`);
      if (this.config.removeCircularReferences) {
        return '[Circular Reference Removed]';
      }
      return obj;
    }

    if (typeof obj === 'object') {
      seen.add(obj);
    }

    try {
      // Handle functions
      if (typeof obj === 'function') {
        return this.sanitizeFunction(obj, path, violations, warnings);
      }

      // Handle arrays
      if (Array.isArray(obj)) {
        return this.sanitizeArray(obj, path, violations, warnings, depth, seen);
      }

      // Handle special objects
      if (obj instanceof Date) return new Date(obj);
      if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);
      if (obj instanceof Buffer) return this.sanitizeBuffer(obj, path, warnings);

      // Handle plain objects
      return this.sanitizePlainObject(obj, path, violations, warnings, depth, seen);
    } finally {
      if (typeof obj === 'object') {
        seen.delete(obj);
      }
    }
  }

  /**
   * Sanitize primitive value
   *
   * @param value - Primitive value
   * @param path - Current path
   * @param violations - Violation array
   * @param warnings - Warning array
   * @returns Sanitized primitive
   */
  private sanitizePrimitive(
    value: any,
    path: string,
    violations: ObjectSanitizationViolation[],
    warnings: string[]
  ): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value, path, violations, warnings);
    }

    if (typeof value === 'number') {
      // Check for dangerous numbers
      if (
        !Number.isFinite(value) ||
        value > Number.MAX_SAFE_INTEGER ||
        value < Number.MIN_SAFE_INTEGER
      ) {
        warnings.push(`Potentially dangerous number at path '${path}': ${value}`);
        return 0;
      }
    }

    return value;
  }

  /**
   * Sanitize string value with security checks
   *
   * @param str - String to sanitize
   * @param path - Current path
   * @param violations - Violation array
   * @param warnings - Warning array
   * @returns Sanitized string
   */
  private sanitizeString(
    str: string,
    path: string,
    violations: ObjectSanitizationViolation[],
    warnings: string[]
  ): string {
    if (str.length > this.config.maxStringLength) {
      warnings.push(
        `String truncated at path '${path}': ${str.length} > ${this.config.maxStringLength} chars`
      );
      str = `${str.substring(0, this.config.maxStringLength)}[...]`;
    }

    // Check custom redaction patterns
    for (const pattern of this.config.customRedactionPatterns) {
      if (pattern.test(str)) {
        violations.push({
          id: `PATTERN_MATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'suspicious-pattern',
          severity: 'medium',
          path,
          description: `String matches redaction pattern: ${pattern.source}`,
          originalValue: str,
          sanitizedValue: '[REDACTED]',
          recommendation: 'Review string content for sensitive information',
        });
        return '[REDACTED]';
      }
    }

    // Use existing log security for additional sanitization
    if (this.config.enableInjectionProtection) {
      const securityAnalysis = analyzeLogSecurity(str);

      if (securityAnalysis.riskLevel !== 'low') {
        const sanitizedLog = sanitizeLogOutputAdvanced(str, {
          maxLineLength: this.config.maxStringLength,
          allowControlChars: false,
          preserveFormatting: false,
          protectionLevel: 'strict',
        });

        if (sanitizedLog !== str) {
          warnings.push(`String sanitized for security at path '${path}'`);
          return sanitizedLog;
        }
      }
    }
    return str;
  }

  /**
   * Sanitize function property
   *
   * @param func - Function to sanitize
   * @param path - Current path
   * @param violations - Violation array
   * @param warnings - Warning array
   * @returns Sanitized representation
   */
  private sanitizeFunction(
    func: Function,
    path: string,
    _violations: ObjectSanitizationViolation[],
    warnings: string[]
  ): any {
    if (this.config.sanitizeFunctions) {
      warnings.push(`Function sanitized at path '${path}'`);
      return `[Function: ${func.name || 'anonymous'}]`;
    }
    return func;
  }

  /**
   * Sanitize array with size and element limits
   *
   * @param arr - Array to sanitize
   * @param path - Current path
   * @param violations - Violation array
   * @param warnings - Warning array
   * @param depth - Current depth
   * @param seen - Circular reference tracker
   * @returns Sanitized array
   */
  private async sanitizeArray(
    arr: any[],
    path: string,
    violations: ObjectSanitizationViolation[],
    warnings: string[],
    depth: number,
    seen: WeakSet<object>
  ): Promise<any[]> {
    if (arr.length > this.config.maxArrayLength) {
      warnings.push(
        `Array truncated at path '${path}': ${arr.length} > ${this.config.maxArrayLength} elements`
      );
      arr = arr.slice(0, this.config.maxArrayLength);
    }

    const sanitized: any[] = [];

    for (let i = 0; i < arr.length; i++) {
      const elementPath = `${path}[${i}]`;
      const element = await this.deepSanitizeObject(
        arr[i],
        elementPath,
        violations,
        warnings,
        depth + 1,
        seen
      );
      sanitized.push(element);
    }

    return sanitized;
  }

  /**
   * Sanitize plain object with property limits
   *
   * @param obj - Object to sanitize
   * @param path - Current path
   * @param violations - Violation array
   * @param warnings - Warning array
   * @param depth - Current depth
   * @param seen - Circular reference tracker
   * @returns Sanitized object
   */
  private async sanitizePlainObject(
    obj: any,
    path: string,
    violations: ObjectSanitizationViolation[],
    warnings: string[],
    depth: number,
    seen: WeakSet<object>
  ): Promise<any> {
    const sanitized: any = {};
    const keys = Object.keys(obj);

    if (keys.length > this.config.maxProperties) {
      warnings.push(
        `${keys.length - this.config.maxProperties} properties truncated at path '${path}': ${keys.length} > ${this.config.maxProperties} properties`
      );
    }

    const limitedKeys = keys.slice(0, this.config.maxProperties);

    for (const key of limitedKeys) {
      // Check for dangerous prototype properties
      if (this.config.removePrototypeProperties && this.isDangerousProperty(key)) {
        violations.push({
          id: `DANGEROUS_PROP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'prototype-pollution',
          severity: 'critical',
          path: `${path}.${key}`,
          description: `Dangerous property removed: ${key}`,
          originalValue: obj[key],
          sanitizedValue: undefined,
          recommendation: 'Do not use prototype pollution properties',
        });
        continue;
      }

      try {
        const propertyPath = `${path}.${key}`;

        // Try to access the property - this may throw for problematic properties
        let propertyValue: unknown;
        try {
          propertyValue = obj[key];
        } catch (propertyError) {
          warnings.push(
            `Property sanitization failed at '${path}.${key}': ${sanitizeErrorMessage(propertyError instanceof Error ? propertyError.message : String(propertyError))}`
          );
          continue; // Skip this property
        }

        // In paranoid mode, remove dangerous property types completely
        if (this.config.sanitizationLevel === 'paranoid') {
          const propertyType = this.classifyObjectType(propertyValue);
          if (!['primitive', 'plain-object', 'array'].includes(propertyType)) {
            // Skip dangerous properties in paranoid mode
            continue;
          }
        }

        const value = await this.deepSanitizeObject(
          propertyValue,
          propertyPath,
          violations,
          warnings,
          depth + 1,
          seen
        );

        if (value !== undefined) {
          sanitized[key] = value;
        }
      } catch (error) {
        warnings.push(
          `Property sanitization failed at '${path}.${key}': ${sanitizeErrorMessage(error instanceof Error ? error.message : String(error))}`
        );
        sanitized[key] = '[Sanitization Error]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize Buffer object
   *
   * @param buffer - Buffer to sanitize
   * @param path - Current path
   * @param warnings - Warning array
   * @returns Sanitized representation
   */
  private sanitizeBuffer(buffer: Buffer, path: string, warnings: string[]): any {
    const maxBufferSize = 1024; // 1KB limit for buffers

    if (buffer.length > maxBufferSize) {
      warnings.push(
        `Buffer truncated at path '${path}': ${buffer.length} > ${maxBufferSize} bytes`
      );
      return `[Buffer: ${buffer.length} bytes, truncated to ${maxBufferSize}]`;
    }

    // Convert to safe representation
    warnings.push(`Buffer converted to safe representation at path '${path}'`);
    return `[Buffer: ${buffer.length} bytes]`;
  }

  /**
   * Redact object with type-specific placeholder
   *
   * @param obj - Object to redact
   * @param type - Object type
   * @param path - Current path
   * @returns Redacted placeholder
   */
  private redactObject(obj: any, type: ObjectType, _path: string): any {
    switch (type) {
      case 'function':
        return `[Function: ${obj.name || 'anonymous'}]`;
      case 'circular':
        return '[Circular Reference]';
      case 'buffer':
        return `[Buffer: ${obj.length || 0} bytes]`;
      case 'class-instance':
        return `[${obj.constructor?.name || 'Object'} Instance]`;
      case 'unknown':
        return '[Unknown Object Type]';
      default:
        return '[Redacted]';
    }
  }

  /**
   * Truncate object to manageable size
   *
   * @param obj - Object to truncate
   * @param type - Object type
   * @returns Truncated object
   */
  private truncateObject(obj: any, type: ObjectType): any {
    if (type === 'array' && Array.isArray(obj)) {
      const truncated = obj.slice(0, Math.min(10, this.config.maxArrayLength));
      if (obj.length > truncated.length) {
        truncated.push(`[... ${obj.length - truncated.length} more items]`);
      }
      return truncated;
    }

    if (type === 'plain-object' || type === 'class-instance') {
      const keys = Object.keys(obj);
      const maxKeys = Math.min(10, this.config.maxProperties);
      const truncated: any = {};

      for (let i = 0; i < maxKeys && i < keys.length; i++) {
        truncated[keys[i]] = obj[keys[i]];
      }

      if (keys.length > maxKeys) {
        truncated['...'] = `${keys.length - maxKeys} more properties`;
      }

      return truncated;
    }

    return obj;
  }

  /**
   * Flatten complex object structure
   *
   * @param obj - Object to flatten
   * @param path - Current path
   * @param violations - Violation array
   * @param warnings - Warning array
   * @returns Flattened object
   */
  private flattenObject(
    obj: any,
    path: string,
    _violations: ObjectSanitizationViolation[],
    warnings: string[]
  ): any {
    if (Array.isArray(obj)) {
      warnings.push(`Array flattened at path '${path}'`);
      return {
        type: 'Array',
        length: obj.length,
        sample: obj.slice(0, 3),
      };
    }

    if (typeof obj === 'object' && obj !== null) {
      warnings.push(`Object flattened at path '${path}'`);
      const keys = Object.keys(obj);
      return {
        type: obj.constructor?.name || 'Object',
        propertyCount: keys.length,
        properties: keys.slice(0, 5),
      };
    }

    return obj;
  }

  /**
   * Detect injection patterns in object structure
   *
   * @param obj - Object to analyze
   * @param path - Current path
   * @returns Array of injection violations
   */
  private async detectInjectionPatterns(
    obj: any,
    path: string
  ): Promise<ObjectSanitizationViolation[]> {
    const violations: ObjectSanitizationViolation[] = [];

    // Check string values for injection patterns
    const checkString = (value: string, currentPath: string) => {
      const security = analyzeInputSecurity(value);

      if (security.violations.length > 0 || security.riskScore > 30) {
        violations.push({
          id: `INJECTION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'injection-attempt',
          severity: security.riskScore > 70 ? 'critical' : 'high',
          path: currentPath,
          description: `Potential injection pattern detected: ${security.violations.map((v) => v.type).join(', ')}`,
          originalValue: value,
          sanitizedValue: security.sanitizedInput || value,
          recommendation: 'Sanitize input or validate against injection patterns',
        });
      }
    };

    if (typeof obj === 'string') {
      checkString(obj, path);
    } else if (typeof obj === 'object' && obj !== null) {
      // Recursively check object properties for injection patterns
      try {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            checkString(value, `${path}.${key}`);
          }
        }
      } catch (_error) {
        // Handle objects that can't be enumerated
      }
    }

    return violations;
  }

  // Helper methods for object analysis

  private hasPrototypePollution(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) return false;

    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    return dangerousKeys.some((key) => Object.hasOwn(obj, key));
  }

  private hasDangerousFunctions(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) return false;

    for (const value of Object.values(obj)) {
      if (typeof value === 'function') {
        const funcStr = value.toString();
        if (
          funcStr.includes('eval') ||
          funcStr.includes('Function') ||
          funcStr.includes('setTimeout')
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private hasCircularReferences(obj: any): boolean {
    const seen = new WeakSet();

    const check = (current: any): boolean => {
      if (typeof current !== 'object' || current === null) return false;
      if (seen.has(current)) return true;

      seen.add(current);

      try {
        // Check each property individually to avoid property access errors
        const keys = Object.keys(current);
        for (const key of keys) {
          try {
            const value = current[key];
            if (check(value)) return true;
          } catch {}
        }
      } catch {
        // If we can't get keys, that might indicate a circular reference
        return true;
      }

      seen.delete(current);
      return false;
    };

    return check(obj);
  }

  private isDangerousProperty(key: string): boolean {
    const dangerous = [
      '__proto__',
      'constructor',
      'prototype',
      '__defineGetter__',
      '__defineSetter__',
      '__lookupGetter__',
      '__lookupSetter__',
      'eval',
      'Function',
      'setTimeout',
      'setInterval',
    ];
    return dangerous.includes(key);
  }

  private calculateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;

    try {
      // Use JSON.stringify length as size approximation
      return JSON.stringify(obj).length;
    } catch {
      // If JSON.stringify fails, estimate based on type
      if (typeof obj === 'string') return obj.length * 2; // UTF-16
      if (typeof obj === 'number') return 8; // 64-bit float
      if (typeof obj === 'boolean') return 4;
      if (typeof obj === 'object') {
        // Estimate based on property count
        try {
          return Object.keys(obj).length * 50; // Rough estimate
        } catch {
          return 1000; // Conservative estimate
        }
      }
      return 100; // Default estimate
    }
  }

  private calculateObjectDepth(obj: any): number {
    if (typeof obj !== 'object' || obj === null) return 0;

    const seen = new WeakSet();

    const getDepth = (current: any): number => {
      if (typeof current !== 'object' || current === null) return 0;
      if (seen.has(current)) return 0; // Avoid circular references

      seen.add(current);

      let maxDepth = 0;
      try {
        for (const value of Object.values(current)) {
          const depth = getDepth(value);
          maxDepth = Math.max(maxDepth, depth);
        }
      } catch {
        // If iteration fails, return conservative depth
        return 10;
      } finally {
        seen.delete(current);
      }

      return maxDepth + 1;
    };

    return getDepth(obj);
  }

  // Cache management methods

  private generateCacheKey(obj: any, path: string): string {
    try {
      const objStr = typeof obj === 'object' ? JSON.stringify(obj) : String(obj);
      const hash = this.simpleHash(objStr + path);
      return `${typeof obj}_${hash}`;
    } catch {
      return `${typeof obj}_${path}_${Date.now()}`;
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getCachedResult(key: string): ObjectSanitizationResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    const updatedEntry = { ...entry, hitCount: entry.hitCount + 1 };
    this.cache.set(key, updatedEntry);

    return entry.result;
  }

  private setCachedResult(key: string, result: ObjectSanitizationResult): void {
    if (this.cache.size >= this.config.maxCacheSize) {
      // Remove oldest entries (simple LRU)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  private startCacheCleanup(): void {
    const cleanupInterval = this.config.cacheTTL / 2;

    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.config.cacheTTL) {
          this.cache.delete(key);
        }
      }
    }, cleanupInterval);
  }

  // Metrics and reporting methods

  private calculateMetrics(
    _original: any,
    sanitized: any,
    processingTime: number
  ): SanitizationMetrics {
    const sanitizedSize = this.calculateObjectSize(sanitized);

    return {
      totalObjects: 1,
      processedObjects: 1,
      skippedObjects: 0,
      cacheHits: this.processingStats.cacheHits,
      cacheMisses: this.processingStats.cacheMisses,
      memoryUsage: sanitizedSize,
      processingRate: processingTime > 0 ? 1000 / processingTime : 0,
    };
  }

  private async generateSanitizationReport(
    _original: any,
    sanitized: any,
    violations: ObjectSanitizationViolation[],
    metrics: SanitizationMetrics
  ): Promise<SanitizationReport> {
    const finalSize = this.calculateObjectSize(sanitized);

    return {
      summary: {
        originalSize: finalSize, // Use final size as approximation
        finalSize,
        compressionRatio: 1.0, // Approximate ratio
        securityImprovements: violations.length,
      },
      transformations: [], // Would be populated with actual transformations
      securityAnalysis: {
        riskScore: Math.max(0, 100 - violations.length * 10),
        threatsMitigated: violations.map((v) => v.type),
        remainingRisks: [],
        complianceLevel: violations.length === 0 ? 'enterprise' : 'standard',
      },
      performanceAnalysis: {
        efficiency: Math.min(100, metrics.processingRate),
        bottlenecks: [],
        optimizations: [],
        scalabilityNotes: [],
      },
    };
  }

  private updateProcessingStats(processingTime: number): void {
    this.processingStats.totalOperations++;
    this.processingStats.averageProcessingTime =
      (this.processingStats.averageProcessingTime + processingTime) / 2;
  }

  /**
   * Get current processing statistics
   *
   * @returns Processing statistics
   */
  public getProcessingStats() {
    return { ...this.processingStats };
  }

  /**
   * Reset processing statistics and cache
   */
  public reset(): void {
    this.cache.clear();
    this.processingStats.totalOperations = 0;
    this.processingStats.cacheHits = 0;
    this.processingStats.cacheMisses = 0;
    this.processingStats.averageProcessingTime = 0;
  }
}

/**
 * Factory function to create object sanitizer with presets
 *
 * @param level - Sanitization level preset
 * @param customConfig - Custom configuration overrides
 * @returns Configured object sanitizer
 */
export function createObjectSanitizer(
  level: ObjectSanitizationLevel = 'standard',
  customConfig: Partial<ObjectSanitizationConfig> = {}
): AdvancedObjectSanitizer {
  const presets: Record<ObjectSanitizationLevel, Partial<ObjectSanitizationConfig>> = {
    minimal: {
      sanitizationLevel: 'minimal',
      removePrototypeProperties: false,
      sanitizeFunctions: false,
      enableInjectionProtection: false,
      generateReport: false,
    },
    standard: {
      sanitizationLevel: 'standard',
      removePrototypeProperties: true,
      sanitizeFunctions: true,
      enableInjectionProtection: true,
      generateReport: false,
    },
    strict: {
      sanitizationLevel: 'strict',
      removePrototypeProperties: true,
      sanitizeFunctions: true,
      enableInjectionProtection: true,
      blockDangerousTypes: true,
      generateReport: true,
      maxDepth: 5,
      maxProperties: 50,
    },
    paranoid: {
      sanitizationLevel: 'paranoid',
      removePrototypeProperties: true,
      sanitizeFunctions: true,
      enableInjectionProtection: true,
      blockDangerousTypes: true,
      generateReport: true,
      maxDepth: 3,
      maxProperties: 20,
      maxStringLength: 1000,
      strictMode: true,
    },
  };

  const config = { ...presets[level], ...customConfig };
  return new AdvancedObjectSanitizer(config);
}

/**
 * Quick sanitization function for common use cases
 *
 * @param obj - Object to sanitize
 * @param level - Sanitization level
 * @returns Sanitized object or null if sanitization fails
 */
export async function quickSanitizeObject(
  obj: any,
  level: ObjectSanitizationLevel = 'standard'
): Promise<any> {
  const sanitizer = createObjectSanitizer(level);
  const result = await sanitizer.sanitizeObject(obj);

  // Return null if there are any critical violations, regardless of isValid
  if (result.violations.some((v) => v.severity === 'critical')) {
    return null;
  }

  // Return null for invalid objects or null results
  if (!result.isValid || result.sanitized === null) {
    return null;
  }

  return result.sanitized;
}

/**
 * Batch sanitization with performance optimization
 *
 * @param objects - Array of objects to sanitize
 * @param level - Sanitization level
 * @returns Array of sanitized objects
 */
export async function batchSanitizeObjects(
  objects: any[],
  level: ObjectSanitizationLevel = 'standard'
): Promise<any[]> {
  const sanitizer = createObjectSanitizer(level, { enableBatchProcessing: true });
  const results = await sanitizer.sanitizeBatch(objects);

  return results.map((result) => {
    // Return null if there are any critical violations, regardless of isValid
    if (result.violations.some((v) => v.severity === 'critical')) {
      return null;
    }

    // Return null for invalid objects or null results
    if (!result.isValid || result.sanitized === null) {
      return null;
    }

    return result.sanitized;
  });
}
