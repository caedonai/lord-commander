/**
 * @fileoverview Memory Protection Framework Integration
 * 
 * This module provides comprehensive memory exhaustion protection across all
 * security-critical components in the SDK. It follows SOLID principles and
 * provides a centralized, reusable memory protection framework.
 * 
 * @module memory-protection
 * @version 1.5.1
 * @since 2025-10-22
 * @author Generated for lord-commander-poc
 * 
 * @security Memory exhaustion attack prevention
 * @performance Optimized memory monitoring with bounded operations
 * @architecture SOLID principles compliance with DRY methodology
 * 
 * @example
 * ```typescript
 * import { MemoryProtectionManager, createMemoryGuard } from '@caedonai/sdk/core';
 * 
 * const memoryGuard = createMemoryGuard();
 * const result = await memoryGuard.protectOperation(() => {
 *   return processLargeData(userInput);
 * });
 * ```
 */

import { 
  sanitizeLogOutputAdvanced
} from './log-security.js';
import { sanitizeErrorMessage } from './error-sanitization.js';

/**
 * Memory protection severity levels for graduated response
 */
export type MemoryProtectionLevel = 'strict' | 'standard' | 'permissive' | 'disabled';

/**
 * Memory usage classification for monitoring and alerting
 */
export type MemoryUsageLevel = 'safe' | 'warning' | 'critical' | 'exceeded';

/**
 * Memory protection violation types for security analysis
 */
export type MemoryViolationType = 
  | 'object-size-exceeded'
  | 'context-size-exceeded' 
  | 'message-length-exceeded'
  | 'stack-depth-exceeded'
  | 'property-count-exceeded'
  | 'circular-reference-detected'
  | 'memory-exhaustion-attempt'
  | 'resource-consumption-exceeded';

/**
 * Comprehensive memory protection configuration following SOLID principles
 * 
 * @interface MemoryProtectionConfig
 * @since 1.5.1
 */
export interface MemoryProtectionConfig {
  // === Core Memory Limits ===
  /** Maximum object size in bytes (default: 10KB) */
  readonly maxObjectSize: number;
  
  /** Maximum context object size in bytes (default: 64KB) */
  readonly maxContextSize: number;
  
  /** Maximum message length in characters (default: 500) */
  readonly maxMessageLength: number;
  
  /** Maximum stack trace depth in frames (default: 10) */
  readonly maxStackDepth: number;
  
  /** Maximum number of object properties (default: 50) */
  readonly maxPropertyCount: number;
  
  // === Advanced Memory Protection ===
  /** Maximum array length for processing (default: 1000) */
  readonly maxArrayLength: number;
  
  /** Maximum nesting depth for objects (default: 10) */
  readonly maxNestingDepth: number;
  
  /** Maximum string concatenation operations (default: 100) */
  readonly maxStringOperations: number;
  
  /** Maximum memory calculation time in milliseconds (default: 100) */
  readonly maxCalculationTime: number;
  
  // === Monitoring and Response ===
  /** Protection level for graduated response */
  readonly protectionLevel: MemoryProtectionLevel;
  
  /** Enable real-time memory usage monitoring */
  readonly enableMonitoring: boolean;
  
  /** Enable automatic garbage collection triggers */
  readonly enableGarbageCollection: boolean;
  
  /** Log memory violations for security analysis */
  readonly logViolations: boolean;
  
  /** Throw errors on critical violations vs. graceful degradation */
  readonly strictMode: boolean;
  
  // === Performance Optimization ===
  /** Sample rate for memory monitoring (0.0 to 1.0) */
  readonly monitoringSampleRate: number;
  
  /** Cache memory calculations for repeated objects */
  readonly enableMemoryCache: boolean;
  
  /** Batch size for processing large collections */
  readonly processingBatchSize: number;
}

/**
 * Memory protection violation details for security analysis
 * 
 * @interface MemoryViolation
 * @since 1.5.1
 */
export interface MemoryViolation {
  readonly id: string;
  readonly timestamp: string;
  readonly type: MemoryViolationType;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly actualSize: number;
  readonly allowedSize: number;
  readonly context: string;
  readonly objectType: string;
  readonly suggestion: string;
  readonly securityImpact: string;
}

/**
 * Memory analysis result for comprehensive security assessment
 * 
 * @interface MemoryAnalysisResult
 * @since 1.5.1
 */
export interface MemoryAnalysisResult {
  readonly totalSize: number;
  readonly usageLevel: MemoryUsageLevel;
  readonly violations: MemoryViolation[];
  readonly recommendations: string[];
  readonly securityScore: number; // 0-100, higher is more secure
  readonly performanceImpact: 'none' | 'low' | 'medium' | 'high';
  readonly requiresAction: boolean;
}

/**
 * Protected operation result with comprehensive metadata
 * 
 * @interface ProtectedOperationResult
 * @since 1.5.1
 */
export interface ProtectedOperationResult<T> {
  readonly success: boolean;
  readonly result?: T;
  readonly error?: Error;
  readonly memoryAnalysis: MemoryAnalysisResult;
  readonly protectionApplied: boolean;
  readonly warnings: string[];
  readonly executionTime: number;
}

/**
 * Default memory protection configuration optimized for security and performance
 * 
 * @constant DEFAULT_MEMORY_CONFIG
 * @since 1.5.1
 */
export const DEFAULT_MEMORY_CONFIG: MemoryProtectionConfig = {
  // Core Memory Limits
  maxObjectSize: 10 * 1024, // 10KB
  maxContextSize: 64 * 1024, // 64KB
  maxMessageLength: 500,
  maxStackDepth: 10,
  maxPropertyCount: 50,
  
  // Advanced Memory Protection
  maxArrayLength: 1000,
  maxNestingDepth: 10,
  maxStringOperations: 100,
  maxCalculationTime: 100,
  
  // Monitoring and Response
  protectionLevel: 'standard',
  enableMonitoring: true,
  enableGarbageCollection: false, // Conservative default
  logViolations: true,
  strictMode: false, // Graceful degradation by default
  
  // Performance Optimization
  monitoringSampleRate: 1.0, // Full monitoring by default
  enableMemoryCache: true,
  processingBatchSize: 100
};

/**
 * Environment-specific memory protection configurations
 * 
 * @namespace MemoryConfigPresets
 * @since 1.5.1
 */
export const MemoryConfigPresets = {
  /** Development environment - Strict monitoring with detailed logging */
  development: {
    ...DEFAULT_MEMORY_CONFIG,
    protectionLevel: 'strict' as const,
    strictMode: true,
    logViolations: true,
    monitoringSampleRate: 1.0
  },
  
  /** Production environment - Balanced protection with performance focus */
  production: {
    ...DEFAULT_MEMORY_CONFIG,
    protectionLevel: 'standard' as const,
    strictMode: false,
    logViolations: true,
    monitoringSampleRate: 0.1, // Sample 10% for performance
    enableGarbageCollection: true
  },
  
  /** Testing environment - Permissive with comprehensive logging */
  testing: {
    ...DEFAULT_MEMORY_CONFIG,
    protectionLevel: 'permissive' as const,
    strictMode: false,
    logViolations: true,
    monitoringSampleRate: 0.0, // No monitoring overhead in tests
    enableMemoryCache: false
  },
  
  /** Security audit environment - Maximum protection with full monitoring */
  audit: {
    ...DEFAULT_MEMORY_CONFIG,
    protectionLevel: 'strict' as const,
    strictMode: true,
    logViolations: true,
    monitoringSampleRate: 1.0,
    maxObjectSize: 5 * 1024, // 5KB - Very strict
    maxContextSize: 32 * 1024, // 32KB - Very strict
    maxPropertyCount: 25 // Reduced limits for audit
  }
} as const;

/**
 * Memory protection error class for security-critical violations
 * 
 * @class MemoryProtectionError
 * @extends Error
 * @since 1.5.1
 */
export class MemoryProtectionError extends Error {
  public readonly violation: MemoryViolation;
  public readonly securityImpact: string;
  
  constructor(violation: MemoryViolation) {
    super(`Memory protection violation: ${violation.type} - ${violation.suggestion}`);
    this.name = 'MemoryProtectionError';
    this.violation = violation;
    this.securityImpact = violation.securityImpact;
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MemoryProtectionError);
    }
  }
}

/**
 * Advanced memory size calculator with performance optimization and security focus
 * 
 * @class MemorySizeCalculator
 * @since 1.5.1
 * 
 * @principle Single Responsibility - Focused solely on memory size calculation
 * @principle Open/Closed - Extensible for new object types without modification
 */
export class MemorySizeCalculator {
  private readonly cache = new WeakMap<object, number>();
  private readonly config: MemoryProtectionConfig;
  private calculationStartTime = 0;
  
  constructor(config: MemoryProtectionConfig = DEFAULT_MEMORY_CONFIG) {
    this.config = { ...config };
  }
  
  /**
   * Calculate comprehensive memory size with security protections
   * 
   * @param obj - Object to analyze
   * @param visited - Circular reference protection
   * @param depth - Current nesting depth
   * @returns Memory size in bytes
   * 
   * @security Prevents infinite recursion and calculation timeouts
   * @performance Uses WeakMap caching and time-bounded operations
   */
  public calculateSize(obj: unknown, visited = new WeakSet<object>(), depth = 0): number {
    // Start timing for timeout protection
    if (depth === 0) {
      this.calculationStartTime = Date.now();
    }
    
    // Timeout protection against DoS attacks
    if (Date.now() - this.calculationStartTime > this.config.maxCalculationTime) {
      throw new MemoryProtectionError(this.createViolation(
        'memory-exhaustion-attempt',
        'critical',
        this.config.maxCalculationTime,
        Date.now() - this.calculationStartTime,
        'Memory calculation timeout exceeded',
        'Potential DoS attack via complex object structures'
      ));
    }
    
    // Depth protection against stack overflow
    if (depth > this.config.maxNestingDepth) {
      throw new MemoryProtectionError(this.createViolation(
        'object-size-exceeded',
        'high',
        this.config.maxNestingDepth,
        depth,
        'Maximum nesting depth exceeded',
        'Deep nesting can cause stack overflow vulnerabilities'
      ));
    }
    
    return this.calculateSizeInternal(obj, visited, depth);
  }
  
  /**
   * Internal size calculation with type-specific handling
   * 
   * @private
   */
  private calculateSizeInternal(obj: unknown, visited: WeakSet<object>, depth: number): number {
    // Depth protection against stack overflow - check at every level
    if (depth > this.config.maxNestingDepth) {
      throw new MemoryProtectionError(this.createViolation(
        'object-size-exceeded',
        'high',
        this.config.maxNestingDepth,
        depth,
        'Maximum nesting depth exceeded',
        'Deep nesting can cause stack overflow vulnerabilities'
      ));
    }
    
    // Handle primitive types
    if (obj === null || obj === undefined) return 0;
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'boolean') return 4;
    if (typeof obj === 'bigint') return 8;
    if (typeof obj === 'symbol') return 8;
    if (typeof obj === 'function') return 16; // Function overhead
    
    // Handle strings with proper UTF-16 encoding calculation
    if (typeof obj === 'string') {
      // Count visual characters (grapheme clusters) rather than code units for more accurate memory estimation
      const graphemeCount = Array.from(obj).length; // Uses iterator to count grapheme clusters
      return graphemeCount * 2; // Each character takes 2 bytes on average in UTF-16
    }
    
    // Handle objects with circular reference protection
    if (typeof obj === 'object' && obj !== null) {
      // Circular reference protection
      if (visited.has(obj)) return 0;
      visited.add(obj);
      
      // Cache lookup for performance
      if (this.config.enableMemoryCache && this.cache.has(obj)) {
        return this.cache.get(obj)!;
      }
      
      let size = this.calculateObjectSize(obj, visited, depth);
      
      // Cache result for performance
      if (this.config.enableMemoryCache) {
        this.cache.set(obj, size);
      }
      
      return size;
    }
    
    return 0;
  }
  
  /**
   * Calculate size for object types with security protections
   * 
   * @private
   */
  private calculateObjectSize(obj: object, visited: WeakSet<object>, depth: number): number {
    let size = 64; // Base object overhead
    
    // Handle arrays with length protection
    if (Array.isArray(obj)) {
      if (obj.length > this.config.maxArrayLength) {
        throw new MemoryProtectionError(this.createViolation(
          'object-size-exceeded',
          'high',
          this.config.maxArrayLength,
          obj.length,
          'Array length exceeds security limits',
          'Large arrays can cause memory exhaustion attacks'
        ));
      }
      
      // Array overhead + element sizes
      size = obj.length * 8; // Array element slots
      for (let i = 0; i < obj.length; i++) {
        try {
          size += this.calculateSizeInternal(obj[i], visited, depth + 1);
        } catch (error) {
          // Re-throw MemoryProtectionError to propagate security violations
          if (error instanceof MemoryProtectionError) {
            throw error;
          }
          // Handle other errors gracefully
          size += 8; // Approximate size for problematic element
        }
      }
      
      // Empty arrays still have overhead
      if (obj.length === 0) {
        size = 64; // Base array overhead
      }
      
      return size;
    }
    
    // Handle regular objects with property count protection
    const keys = Object.keys(obj);
    if (keys.length > this.config.maxPropertyCount) {
      throw new MemoryProtectionError(this.createViolation(
        'property-count-exceeded',
        'medium',
        this.config.maxPropertyCount,
        keys.length,
        'Object property count exceeds security limits',
        'Excessive properties can indicate injection attacks'
      ));
    }
    
    // Calculate size for all properties
    for (const key of keys) {
      size += key.length * 2; // Key string size
      try {
        size += this.calculateSizeInternal((obj as any)[key], visited, depth + 1);
      } catch (error) {
        // Re-throw MemoryProtectionError to propagate security violations
        if (error instanceof MemoryProtectionError) {
          throw error;
        }
        // Handle other getter errors gracefully
        size += 8; // Approximate size for problematic property
      }
    }
    
    // Handle special object types
    if (obj instanceof Date) size += 8;
    if (obj instanceof RegExp) size += obj.source.length * 2 + 16;
    if (obj instanceof Error) {
      size += (obj.message?.length || 0) * 2;
      size += (obj.stack?.length || 0) * 2;
    }
    
    return size;
  }
  
  /**
   * Create standardized violation object
   * 
   * @private
   */
  private createViolation(
    type: MemoryViolationType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    allowed: number,
    actual: number,
    context: string,
    securityImpact: string
  ): MemoryViolation {
    return {
      id: `MEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      actualSize: actual,
      allowedSize: allowed,
      context,
      objectType: 'unknown',
      suggestion: `Reduce ${type.replace(/-/g, ' ')} to within ${allowed} limit`,
      securityImpact
    };
  }
}

/**
 * Memory violation analyzer for security assessment and recommendation generation
 * 
 * @class MemoryViolationAnalyzer
 * @since 1.5.1
 * 
 * @principle Single Responsibility - Focused on violation analysis and recommendations
 * @principle Dependency Inversion - Depends on abstractions, not concretions
 */
export class MemoryViolationAnalyzer {
  private readonly config: MemoryProtectionConfig;
  
  constructor(config: MemoryProtectionConfig = DEFAULT_MEMORY_CONFIG) {
    this.config = { ...config };
  }
  
  /**
   * Analyze memory usage and generate comprehensive security assessment
   * 
   * @param size - Total memory size
   * @param violations - List of violations
   * @returns Comprehensive analysis result
   */
  public analyzeMemoryUsage(size: number, violations: MemoryViolation[]): MemoryAnalysisResult {
    const usageLevel = this.determineUsageLevel(size, violations);
    const securityScore = this.calculateSecurityScore(size, violations);
    const recommendations = this.generateRecommendations(violations, usageLevel);
    const performanceImpact = this.assessPerformanceImpact(size, violations);
    
    return {
      totalSize: size,
      usageLevel,
      violations: [...violations], // Defensive copy
      recommendations,
      securityScore,
      performanceImpact,
      requiresAction: violations.some(v => v.severity === 'critical' || v.severity === 'high')
    };
  }
  
  /**
   * Determine memory usage level based on configured thresholds and violations
   * 
   * @private
   */
  private determineUsageLevel(size: number, violations: MemoryViolation[]): MemoryUsageLevel {
    // Use maxObjectSize as the primary threshold for consistency with tests
    const maxSize = this.config.maxObjectSize;
    
    // Check for explicit size-exceeded violations first
    if (violations.some(v => v.type === 'object-size-exceeded' || v.type === 'context-size-exceeded')) {
      return 'exceeded';
    }
    
    // Then check size thresholds
    if (size > maxSize) return 'exceeded';
    if (size > maxSize * 0.75) return 'critical';  // 75% threshold for critical
    if (size > maxSize * 0.5) return 'warning';    // 50% threshold for warning
    return 'safe';
  }
  
  /**
   * Calculate security score based on violations and usage patterns
   * 
   * @private
   */
  private calculateSecurityScore(size: number, violations: MemoryViolation[]): number {
    let score = 100;
    
    // Deduct points for violations by severity
    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    
    // Deduct points for excessive memory usage
    const maxSize = this.config.maxObjectSize;
    if (size > maxSize * 0.75) score -= 15;  // Critical level
    if (size > maxSize * 0.5) score -= 10;   // Warning level
    
    return Math.max(0, score);
  }
  
  /**
   * Generate actionable recommendations based on violations
   * 
   * @private
   */
  private generateRecommendations(violations: MemoryViolation[], usageLevel: MemoryUsageLevel): string[] {
    const recommendations: string[] = [];
    
    // Usage level recommendations
    switch (usageLevel) {
      case 'exceeded':
        recommendations.push('CRITICAL: Memory usage exceeds safe limits. Implement immediate reduction measures.');
        break;
      case 'critical':
        recommendations.push('WARNING: Memory usage is approaching limits. Consider optimization.');
        break;
      case 'warning':
        recommendations.push('NOTICE: Memory usage is elevated. Monitor for continued growth.');
        break;
    }
    
    // Violation-specific recommendations
    const violationTypes = new Set(violations.map(v => v.type));
    
    if (violationTypes.has('object-size-exceeded')) {
      recommendations.push('Reduce object complexity by splitting large objects into smaller components.');
    }
    
    if (violationTypes.has('property-count-exceeded')) {
      recommendations.push('Limit object properties and consider using Map for dynamic key-value storage.');
    }
    
    if (violationTypes.has('circular-reference-detected')) {
      recommendations.push('Remove circular references to prevent memory leaks and calculation issues.');
    }
    
    if (violationTypes.has('memory-exhaustion-attempt')) {
      recommendations.push('SECURITY: Potential DoS attack detected. Implement stricter input validation.');
    }
    
    // General recommendations
    if (violations.length > 3) {
      recommendations.push('Multiple violations detected. Consider implementing comprehensive input validation.');
    }
    
    return recommendations;
  }
  
  /**
   * Assess performance impact of memory usage patterns
   * 
   * @private
   */
  private assessPerformanceImpact(size: number, violations: MemoryViolation[]): 'none' | 'low' | 'medium' | 'high' {
    // Use maxObjectSize for consistency with usage level determination
    const maxSize = this.config.maxObjectSize;
    const criticalViolations = violations.filter(v => v.severity === 'critical' || v.severity === 'high').length;
    
    if (size > maxSize * 2 || criticalViolations > 2) return 'high';
    if (size > maxSize || criticalViolations > 0) return 'medium';
    if (size > maxSize * 0.5) return 'low';
    return 'none';
  }
}

/**
 * Comprehensive memory protection manager with integration capabilities
 * 
 * @class MemoryProtectionManager
 * @since 1.5.1
 * 
 * @principle Single Responsibility - Manages all memory protection operations
 * @principle Open/Closed - Extensible for new protection strategies
 * @principle Liskov Substitution - Can be substituted with enhanced implementations
 * @principle Interface Segregation - Focused interface for memory protection
 * @principle Dependency Inversion - Depends on configuration abstractions
 */
export class MemoryProtectionManager {
  private readonly config: MemoryProtectionConfig;
  private readonly calculator: MemorySizeCalculator;
  private readonly analyzer: MemoryViolationAnalyzer;
  private readonly violations: MemoryViolation[] = [];
  
  constructor(config: MemoryProtectionConfig = DEFAULT_MEMORY_CONFIG) {
    this.config = { ...config };
    this.calculator = new MemorySizeCalculator(this.config);
    this.analyzer = new MemoryViolationAnalyzer(this.config);
  }
  
  /**
   * Protect an operation with comprehensive memory monitoring
   * 
   * @param operation - Function to execute with protection
   * @returns Protected operation result
   */
  public async protectOperation<T>(
    operation: () => T | Promise<T>
  ): Promise<ProtectedOperationResult<T>> {
    const startTime = performance.now();
    let memoryAnalysis: MemoryAnalysisResult;
    let protectionApplied = false;
    const warnings: string[] = [];
    
    try {
      // Pre-execution memory check
      const initialMemory = this.getProcessMemoryUsage();
      
      // Execute operation with monitoring
      const result = await operation();
      
      // Post-execution memory analysis
      const finalMemory = this.getProcessMemoryUsage();
      const memoryDelta = Math.max(0, finalMemory.heapUsed - initialMemory.heapUsed);
      
      // Analyze memory usage including any violations from the operation
      memoryAnalysis = this.analyzer.analyzeMemoryUsage(memoryDelta, [...this.violations]);
      
      // Check if the operation result is oversized
      try {
        const resultSize = this.calculator.calculateSize(result);
        if (resultSize > this.config.maxObjectSize) {
          protectionApplied = true;
          warnings.push(`Operation result exceeds memory limits (${resultSize} > ${this.config.maxObjectSize} bytes)`);
          
          // Create violation for oversized result
          const violation: MemoryViolation = {
            id: `MEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'object-size-exceeded',
            severity: 'high',
            actualSize: resultSize,
            allowedSize: this.config.maxObjectSize,
            context: 'operation-result',
            objectType: this.getObjectType(result),
            suggestion: 'Reduce operation result size or implement result pagination',
            securityImpact: 'Large operation results can cause memory exhaustion'
          };
          
          this.violations.push(violation);
          
          // Re-analyze with the new violation
          memoryAnalysis = this.analyzer.analyzeMemoryUsage(memoryDelta, [...this.violations]);
        }
      } catch (calcError) {
        // If we can't calculate result size, assume it's problematic
        protectionApplied = true;
        warnings.push('Unable to calculate operation result size - assuming memory risk');
      }
      
      // Apply protection if needed
      if (memoryAnalysis.requiresAction || protectionApplied) {
        protectionApplied = true;
        warnings.push(...memoryAnalysis.recommendations);
        
        // Trigger garbage collection if enabled and needed
        if (this.config.enableGarbageCollection && (memoryAnalysis.usageLevel === 'critical' || memoryAnalysis.usageLevel === 'exceeded')) {
          const gcTriggered = this.triggerGarbageCollection();
          if (gcTriggered) {
            warnings.push('Garbage collection triggered due to high memory usage');
          } else {
            warnings.push('Garbage collection requested but not available');
          }
        }
      }
      
      return {
        success: true,
        result,
        memoryAnalysis,
        protectionApplied,
        warnings,
        executionTime: performance.now() - startTime
      };
      
    } catch (error) {
      // Error case analysis
      const errorSize = error instanceof Error ? this.calculator.calculateSize(error) : 0;
      memoryAnalysis = this.analyzer.analyzeMemoryUsage(errorSize, [...this.violations]);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        memoryAnalysis,
        protectionApplied: true,
        warnings: [`Operation failed: ${error instanceof Error ? error.message : String(error)}`],
        executionTime: performance.now() - startTime
      };
    }
  }
  
  /**
   * Validate object size with comprehensive protection
   * 
   * @param obj - Object to validate
   * @param maxSize - Maximum allowed size
   * @param context - Validation context
   * @returns Validation result with analysis
   */
  public validateObjectSize(obj: unknown, maxSize?: number, context = 'object'): MemoryAnalysisResult {
    const effectiveMaxSize = maxSize || this.config.maxObjectSize;
    // Don't clear violations - let them accumulate for statistics
    
    try {
      const size = this.calculator.calculateSize(obj);
      
      if (size > effectiveMaxSize) {
        const violation: MemoryViolation = {
          id: `MEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'object-size-exceeded',
          severity: size > effectiveMaxSize * 2 ? 'critical' : 'high',
          actualSize: size,
          allowedSize: effectiveMaxSize,
          context,
          objectType: this.getObjectType(obj),
          suggestion: `Reduce ${context} size to within ${effectiveMaxSize} bytes`,
          securityImpact: 'Large objects can cause memory exhaustion and DoS attacks'
        };
        
        this.violations.push(violation);
        
        if (this.config.logViolations) {
          this.logViolation(violation);
        }
        
        if (this.config.strictMode) {
          throw new MemoryProtectionError(violation);
        }
      }
      
      return this.analyzer.analyzeMemoryUsage(size, [...this.violations]);
      
    } catch (error) {
      if (error instanceof MemoryProtectionError) {
        // In strict mode, re-throw the error instead of returning analysis
        if (this.config.strictMode) {
          throw error;
        }
        
        // Add the violation to our tracking if it's not already there
        if (!this.violations.some(v => v.id === error.violation.id)) {
          this.violations.push(error.violation);
        }
        
        // Return analysis with the violation
        return this.analyzer.analyzeMemoryUsage(error.violation.actualSize, [...this.violations]);
      }
      
      // For other errors, create a generic violation
      const genericViolation: MemoryViolation = {
        id: `MEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: 'memory-exhaustion-attempt',
        severity: 'high',
        actualSize: 0,
        allowedSize: effectiveMaxSize,
        context,
        objectType: this.getObjectType(obj),
        suggestion: 'Unable to calculate object size safely',
        securityImpact: 'Object structure may be malicious or too complex'
      };
      
      this.violations.push(genericViolation);
      return this.analyzer.analyzeMemoryUsage(0, [...this.violations]);
    }
  }
  
  /**
   * Get current process memory usage with error handling
   * 
   * @private
   */
  private getProcessMemoryUsage(): NodeJS.MemoryUsage {
    try {
      return process.memoryUsage();
    } catch (error) {
      // Fallback for restricted environments
      return {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0
      };
    }
  }
  
  /**
   * Trigger garbage collection with safety checks
   * 
   * @private
   * @returns True if garbage collection was triggered
   */
  private triggerGarbageCollection(): boolean {
    try {
      if (global.gc) {
        global.gc();
        return true;
      }
    } catch (error) {
      // GC may not be exposed or available
    }
    return false;
  }
  
  /**
   * Get object type for violation reporting
   * 
   * @private
   */
  private getObjectType(obj: unknown): string {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (Array.isArray(obj)) return 'array';
    if (obj instanceof Error) return 'error';
    if (obj instanceof Date) return 'date';
    if (obj instanceof RegExp) return 'regexp';
    return typeof obj;
  }
  
  /**
   * Log violation with security context
   * 
   * @private
   */
  private logViolation(violation: MemoryViolation): void {
    // Use existing log security infrastructure
    const violationData = JSON.stringify({
      violation: {
        id: violation.id,
        type: violation.type,
        severity: violation.severity,
        context: violation.context,
        suggestion: violation.suggestion
      }
    });
    
    const sanitizedMessage = sanitizeLogOutputAdvanced(violationData);
    
    console.warn(`[MemoryProtection] ${sanitizedMessage}`);
  }
  
  /**
   * Get current memory protection statistics
   */
  public getProtectionStats(): {
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    averageObjectSize: number;
    protectionLevel: MemoryProtectionLevel;
  } {
    const violationsBySeverity = this.violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageObjectSize = this.violations.length > 0
      ? this.violations.reduce((sum, v) => sum + v.actualSize, 0) / this.violations.length
      : 0;
    
    return {
      totalViolations: this.violations.length,
      violationsBySeverity,
      averageObjectSize,
      protectionLevel: this.config.protectionLevel
    };
  }
}

/**
 * Factory function for creating memory protection instances
 * 
 * @param environment - Target environment for configuration
 * @param customConfig - Custom configuration overrides
 * @returns Configured memory protection manager
 * 
 * @example
 * ```typescript
 * const memoryGuard = createMemoryGuard('production');
 * const result = await memoryGuard.protectOperation(() => processData(input));
 * ```
 */
export function createMemoryGuard(
  environment: keyof typeof MemoryConfigPresets = 'production',
  customConfig?: Partial<MemoryProtectionConfig>
): MemoryProtectionManager {
  const baseConfig = MemoryConfigPresets[environment];
  const finalConfig = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
  
  return new MemoryProtectionManager(finalConfig);
}

/**
 * Utility function to check if an object exceeds memory limits
 * 
 * @param obj - Object to check
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if object is within limits
 */
export function isMemorySafe(obj: unknown, maxSize = DEFAULT_MEMORY_CONFIG.maxObjectSize): boolean {
  try {
    const calculator = new MemorySizeCalculator();
    const size = calculator.calculateSize(obj);
    return size <= maxSize;
  } catch (error) {
    // If calculation fails, assume unsafe
    return false;
  }
}

/**
 * Utility function to truncate objects to fit memory constraints
 * 
 * @param obj - Object to truncate
 * @param maxSize - Maximum allowed size
 * @returns Truncated object that fits constraints
 */
export function truncateForMemory<T>(obj: T, maxSize = DEFAULT_MEMORY_CONFIG.maxObjectSize): T {
  if (isMemorySafe(obj, maxSize)) {
    return obj;
  }
  
  // For objects, reduce properties
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const truncated = {} as any;
    const keys = Object.keys(obj);
    const maxProperties = Math.floor(DEFAULT_MEMORY_CONFIG.maxPropertyCount / 2);
    
    for (let i = 0; i < Math.min(keys.length, maxProperties); i++) {
      truncated[keys[i]] = (obj as any)[keys[i]];
      if (!isMemorySafe(truncated, maxSize)) {
        delete truncated[keys[i]];
        break;
      }
    }
    
    return truncated as T;
  }
  
  // For arrays, reduce length
  if (Array.isArray(obj)) {
    const maxLength = Math.floor(DEFAULT_MEMORY_CONFIG.maxArrayLength / 2);
    return obj.slice(0, maxLength) as T;
  }
  
  // For strings, truncate
  if (typeof obj === 'string') {
    const maxLength = Math.floor(DEFAULT_MEMORY_CONFIG.maxMessageLength / 2);
    return obj.slice(0, maxLength) as T;
  }
  
  return obj;
}

/**
 * Integration functions for existing security modules
 */

/**
 * Enhanced error object sanitization with integrated memory protection
 * 
 * @param error - Error object to sanitize
 * @param config - Memory protection configuration
 * @returns Sanitized error with memory protection applied
 */
export function sanitizeErrorObjectWithMemoryProtection(
  error: Error, 
  config: MemoryProtectionConfig = DEFAULT_MEMORY_CONFIG
): Error {
  const memoryGuard = new MemoryProtectionManager(config);
  
  try {
    const analysis = memoryGuard.validateObjectSize(error, config.maxObjectSize, 'error-object');
    
    // If memory usage is safe, sanitize normally
    if (analysis.usageLevel === 'safe') {
      const sanitizedMessage = sanitizeErrorMessage(error.message || '');
      const sanitizedError = new Error(sanitizedMessage);
      sanitizedError.name = error.name;
      
      if (error.stack) {
        const stackLines = error.stack.split('\n');
        const limitedStack = stackLines.slice(0, config.maxStackDepth);
        sanitizedError.stack = limitedStack.join('\n');
      }
      
      return sanitizedError;
    }
  } catch (memError) {
    // If memory validation fails, proceed with truncation
  }
  
  // For oversized errors, create minimal safe version with truncated message
  const originalMessage = error.message || 'Error occurred';
  const truncatedMessage = originalMessage.length > config.maxMessageLength 
    ? originalMessage.slice(0, config.maxMessageLength - 50) + 'Error message truncated for memory protection'
    : originalMessage;
  
  const sanitizedTruncated = sanitizeErrorMessage(truncatedMessage);
  const safeError = new Error(sanitizedTruncated);
  safeError.name = error.name || 'Error';
  
  return safeError;
}

/**
 * Enhanced message truncation with memory-aware processing
 * 
 * @param message - Message to truncate
 * @param config - Memory protection configuration
 * @returns Truncated message with security indicators
 */
export function truncateMessageWithMemoryProtection(
  message: string, 
  config: MemoryProtectionConfig = DEFAULT_MEMORY_CONFIG
): string {
  if (!message) return '';
  
  const memoryGuard = new MemoryProtectionManager(config);
  const analysis = memoryGuard.validateObjectSize(message, config.maxMessageLength * 2, 'message');
  
  if (analysis.usageLevel === 'safe' && message.length <= config.maxMessageLength) {
    return sanitizeErrorMessage(message);
  }
  
  const truncatedLength = Math.min(message.length, config.maxMessageLength - 50); // Reserve space for indicator
  const truncated = message.slice(0, truncatedLength);
  const indicator = analysis.violations.length > 0 
    ? ' [TRUNCATED: Memory protection violation]'
    : ' [TRUNCATED: Length limit]';
  
  return sanitizeErrorMessage(truncated + indicator);
}

/**
 * Memory-protected context processing for structured logging
 * 
 * @param context - Context object to process
 * @param config - Memory protection configuration
 * @returns Processed context with memory protections applied
 */
export function processContextWithMemoryProtection(
  context: Record<string, unknown>,
  config: MemoryProtectionConfig = DEFAULT_MEMORY_CONFIG
): { context: Record<string, unknown>; warnings: string[] } {
  const memoryGuard = new MemoryProtectionManager(config);
  const warnings: string[] = [];
  
  try {
    // Pre-check for problematic objects that might cause errors
    for (const key in context) {
      try {
        const value = context[key];
        // This will trigger getter errors if they exist
        JSON.stringify(value);
      } catch (error) {
        warnings.push(`Memory protection error: ${error instanceof Error ? error.message : String(error)}`);
        // Return minimal safe context for problematic objects
        return {
          context: { error: 'Context processing failed due to memory protection' },
          warnings
        };
      }
    }
    
    const analysis = memoryGuard.validateObjectSize(context, config.maxContextSize, 'log-context');
    
    // Always process if there are warnings or violations
    if (analysis.usageLevel === 'safe' && analysis.totalSize <= config.maxContextSize && analysis.violations.length === 0) {
      return { context, warnings };
    }
    
    // For large contexts, reduce the number of properties
    const keys = Object.keys(context);
    const maxKeys = Math.floor(keys.length / 2); // Reduce by half
    
    const protectedContext: Record<string, unknown> = {};
    for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
      protectedContext[keys[i]] = context[keys[i]];
    }
    
    warnings.push(`Context truncated due to memory protection (${analysis.totalSize} > ${config.maxContextSize} bytes)`);
    warnings.push(...analysis.recommendations);
    
    return { context: protectedContext, warnings };
    
  } catch (error) {
    warnings.push(`Memory protection error: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return minimal safe context
    return {
      context: { error: 'Context processing failed due to memory protection' },
      warnings
    };
  }
}