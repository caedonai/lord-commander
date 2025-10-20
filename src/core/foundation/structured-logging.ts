/**
 * Task 1.4.2: Structured Logging with Security
 * 
 * Comprehensive structured logging system with automatic sanitization and security features.
 * Builds on Task 1.4.1 (Log Injection Protection) to provide enterprise-grade structured logging.
 * 
 * Features:
 * - Structured log entries with consistent formatting
 * - Automatic sanitization of log data using existing security framework
 * - Security metadata and violation tracking
 * - Performance-optimized serialization
 * - Multiple output formats (JSON, text, structured)
 * - Contextual logging with security-aware field handling
 * - Integration with existing Logger and log injection protection
 * 
 * @security Leverages comprehensive log injection protection from Task 1.4.1
 * @compliance OWASP logging guidelines, enterprise audit requirements
 * @performance Optimized serialization with bounded memory usage
 * @architecture Builds on existing security foundation while maintaining API compatibility
 */

import { sanitizeLogOutputAdvanced, analyzeLogSecurity, type LogInjectionConfig, type LogSecurityAnalysis } from './log-security.js';
import { sanitizeErrorMessage, sanitizeStackTrace } from './error-sanitization.js';

/**
 * Log severity levels for structured logging
 */
export enum StructuredLogLevel {
  TRACE = 0,
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  FATAL = 50,
}

/**
 * Security classification for log entries
 */
export enum SecurityClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
}

/**
 * Structured log entry with comprehensive metadata
 */
export interface StructuredLogEntry {
  // Core metadata
  timestamp: string;
  level: StructuredLogLevel;
  levelName: string;
  message: string;
  
  // Security metadata
  sanitized: boolean;
  securityFlags: string[];
  classification: SecurityClassification;
  securityAnalysis?: LogSecurityAnalysis;
  
  // Context and tracing
  context: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  
  // Application metadata
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  
  // Error handling
  error?: StructuredError;
  stack?: string;
  
  // Performance metrics
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  
  // Compliance and audit
  auditEvent?: boolean;
  complianceFlags?: string[];
  retentionPolicy?: string;
}

/**
 * Structured error representation for logging
 */
export interface StructuredError {
  name: string;
  message: string;
  code?: string | number;
  stack?: string;
  cause?: StructuredError;
  context?: Record<string, unknown>;
  sanitized: boolean;
}

/**
 * Configuration for structured logging
 */
export interface StructuredLoggingConfig {
  // Output format configuration
  format: 'json' | 'text' | 'structured';
  prettyPrint: boolean;
  includeMetadata: boolean;
  
  // Security configuration
  logInjectionConfig: LogInjectionConfig;
  defaultClassification: SecurityClassification;
  sanitizeByDefault: boolean;
  includeSecurityAnalysis: boolean;
  
  // Performance configuration
  maxMessageLength: number;
  maxContextSize: number;
  maxStackDepth: number;
  enablePerformanceMetrics: boolean;
  
  // Field inclusion/exclusion
  includeStackTraces: boolean;
  includeMemoryUsage: boolean;
  excludeFields: string[];
  maskFields: string[];
  
  // Compliance configuration
  enableAuditMode: boolean;
  retentionPolicies: Record<StructuredLogLevel, string>;
  complianceMode: boolean;
}

/**
 * Default configuration optimized for security and performance
 */
export const DEFAULT_STRUCTURED_LOGGING_CONFIG: StructuredLoggingConfig = {
  format: 'json',
  prettyPrint: false,
  includeMetadata: true,
  
  logInjectionConfig: {
    enableProtection: true,
    maxLineLength: 8192,
    allowControlChars: false,
    preserveFormatting: false,
  },
  defaultClassification: SecurityClassification.INTERNAL,
  sanitizeByDefault: true,
  includeSecurityAnalysis: true,
  
  maxMessageLength: 8192,
  maxContextSize: 65536, // 64KB limit for context
  maxStackDepth: 50,
  enablePerformanceMetrics: true,
  
  includeStackTraces: true,
  includeMemoryUsage: false,
  excludeFields: [],
  maskFields: ['password', 'token', 'secret', 'key', 'authorization'],
  
  enableAuditMode: false,
  retentionPolicies: {
    [StructuredLogLevel.TRACE]: '7d',
    [StructuredLogLevel.DEBUG]: '30d',
    [StructuredLogLevel.INFO]: '90d',
    [StructuredLogLevel.WARN]: '1y',
    [StructuredLogLevel.ERROR]: '7y',
    [StructuredLogLevel.FATAL]: '7y',
  },
  complianceMode: false,
};

/**
 * Options for creating a structured log entry
 */
export interface LogEntryOptions {
  level?: StructuredLogLevel;
  classification?: SecurityClassification;
  context?: Record<string, unknown>;
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  error?: Error;
  duration?: number;
  auditEvent?: boolean;
  skipSanitization?: boolean;
}

/**
 * Result of structured log entry creation
 */
export interface CreateLogEntryResult {
  entry: StructuredLogEntry;
  warnings: string[];
  truncated: boolean;
  sanitizationApplied: boolean;
}

/**
 * Structured logger with comprehensive security features
 */
export class StructuredLogger {
  private config: StructuredLoggingConfig;

  constructor(config: Partial<StructuredLoggingConfig> = {}) {
    this.config = { ...DEFAULT_STRUCTURED_LOGGING_CONFIG, ...config };
  }

  /**
   * Create a structured log entry with comprehensive security handling
   */
  createLogEntry(
    message: string,
    options: LogEntryOptions = {}
  ): CreateLogEntryResult {
    const warnings: string[] = [];
    let truncated = false;
    let sanitizationApplied = false;
    
    try {
      // Generate unique identifiers if not provided
      const timestamp = new Date().toISOString();
      const level = options.level ?? StructuredLogLevel.INFO;
      const levelName = StructuredLogLevel[level];
      
      // Sanitize message if required
      let sanitizedMessage = message;
      let securityAnalysis: LogSecurityAnalysis | undefined;
      
      if (this.config.sanitizeByDefault && !options.skipSanitization) {
        const originalMessage = message;
        sanitizedMessage = sanitizeLogOutputAdvanced(message, this.config.logInjectionConfig);
        sanitizationApplied = sanitizedMessage !== originalMessage;
        
        if (this.config.includeSecurityAnalysis) {
          securityAnalysis = analyzeLogSecurity(originalMessage);
        }
      }
      
      // Truncate message if too long
      if (sanitizedMessage.length > this.config.maxMessageLength) {
        sanitizedMessage = sanitizedMessage.substring(0, this.config.maxMessageLength) + '...[truncated]';
        truncated = true;
        warnings.push(`Message truncated to ${this.config.maxMessageLength} characters`);
      }
      
      // Process context with security-aware handling
      const processedContext = this.processContext(options.context || {}, warnings);
      
      // Handle error information
      let structuredError: StructuredError | undefined;
      let stackTrace: string | undefined;
      
      if (options.error) {
        structuredError = this.createStructuredError(options.error);
        if (this.config.includeStackTraces && options.error.stack) {
          stackTrace = sanitizeStackTrace(options.error.stack, {
            maxStackDepth: this.config.maxStackDepth,
          });
        }
      }
      
      // Collect security flags
      const securityFlags: string[] = [];
      if (sanitizationApplied) securityFlags.push('sanitized');
      if (truncated) securityFlags.push('truncated');
      if (securityAnalysis?.violations.length) securityFlags.push('violations_detected');
      if (options.auditEvent) securityFlags.push('audit_event');
      
      // Performance metrics
      let memoryUsage: NodeJS.MemoryUsage | undefined;
      if (this.config.enablePerformanceMetrics && this.config.includeMemoryUsage) {
        try {
          memoryUsage = process.memoryUsage();
        } catch (error) {
          warnings.push('Failed to collect memory usage metrics');
        }
      }
      
      // Build log entry
      const entry: StructuredLogEntry = {
        timestamp,
        level,
        levelName,
        message: sanitizedMessage,
        
        sanitized: sanitizationApplied,
        securityFlags,
        classification: options.classification ?? this.config.defaultClassification,
        securityAnalysis,
        
        context: processedContext,
        traceId: options.traceId,
        spanId: options.spanId,
        correlationId: options.correlationId,
        
        component: options.component,
        operation: options.operation,
        userId: options.userId,
        sessionId: options.sessionId,
        
        error: structuredError,
        stack: stackTrace,
        
        duration: options.duration,
        memoryUsage,
        
        auditEvent: options.auditEvent ?? false,
        complianceFlags: this.generateComplianceFlags(level, options),
        retentionPolicy: this.config.retentionPolicies[level],
      };
      
      return {
        entry: this.applyFieldFiltering(entry),
        warnings,
        truncated,
        sanitizationApplied,
      };
      
    } catch (error) {
      // Fallback for critical errors in log entry creation
      const fallbackEntry: StructuredLogEntry = {
        timestamp: new Date().toISOString(),
        level: StructuredLogLevel.ERROR,
        levelName: 'ERROR',
        message: 'Failed to create structured log entry',
        sanitized: false,
        securityFlags: ['creation_error'],
        classification: SecurityClassification.INTERNAL,
        context: { originalMessage: message, creationError: String(error) },
        auditEvent: false,
      };
      
      return {
        entry: fallbackEntry,
        warnings: [`Log entry creation failed: ${String(error)}`],
        truncated: false,
        sanitizationApplied: false,
      };
    }
  }

  /**
   * Process context object with security-aware field handling
   */
  private processContext(
    context: Record<string, unknown>,
    warnings: string[]
  ): Record<string, unknown> {
    try {
      const processed: Record<string, unknown> = {};
      
      // Skip empty contexts
      if (!context || Object.keys(context).length === 0) {
        return {};
      }
      
      let serialized: string;
      try {
        serialized = JSON.stringify(context);
      } catch (serializationError) {
        warnings.push(`Context processing failed: ${String(serializationError)}`);
        return { contextError: 'Failed to process context' };
      }
      
      // Check context size limits
      if (serialized.length > this.config.maxContextSize) {
        warnings.push(`Context truncated from ${serialized.length} to ${this.config.maxContextSize} bytes`);
        // Truncate by removing properties until under size limit
        const keys = Object.keys(context);
        let currentSize = 0;
        
        for (const key of keys) {
          const value = context[key];
          let valueSize: number;
          
          try {
            valueSize = JSON.stringify({ [key]: value }).length;
          } catch (valueSerializationError) {
            // Skip fields that can't be serialized
            warnings.push(`Context field '${key}' excluded due to serialization error`);
            continue;
          }
          
          if (currentSize + valueSize <= this.config.maxContextSize) {
            processed[key] = this.processContextValue(key, value);
            currentSize += valueSize;
          } else {
            warnings.push(`Context field '${key}' excluded due to size limits`);
            break;
          }
        }
        
        return processed;
      }
      
      // Process all context fields
      for (const [key, value] of Object.entries(context)) {
        processed[key] = this.processContextValue(key, value);
      }
      
      return processed;
      
    } catch (error) {
      warnings.push(`Context processing failed: ${String(error)}`);
      return { contextError: 'Failed to process context' };
    }
  }

  /**
   * Process individual context values with masking and sanitization
   */
  private processContextValue(key: string, value: unknown): unknown {
    // Check if field should be masked (case-insensitive)
    const lowerKey = key.toLowerCase();
    const shouldMask = this.config.maskFields.some(maskField => 
      lowerKey.includes(maskField.toLowerCase())
    );
    
    if (shouldMask) {
      return '[MASKED]';
    }
    
    // Sanitize string values
    if (typeof value === 'string') {
      return sanitizeLogOutputAdvanced(value, this.config.logInjectionConfig);
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => 
        this.processContextValue(`${key}[${index}]`, item)
      );
    }
    
    // Handle objects (with depth limiting to prevent deep nesting issues)
    if (value && typeof value === 'object') {
      const processed: Record<string, unknown> = {};
      for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
        // For nested objects, check the subKey directly for masking
        const nestedKey = subKey;
        processed[subKey] = this.processContextValue(nestedKey, subValue);
      }
      return processed;
    }
    
    return value;
  }

  /**
   * Create structured error representation with sanitization
   */
  private createStructuredError(error: Error): StructuredError {
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    const sanitized = sanitizedMessage !== error.message;
    
    const structuredError: StructuredError = {
      name: error.name,
      message: sanitizedMessage,
      sanitized,
    };
    
    // Add error code if available
    if ('code' in error && error.code !== undefined) {
      structuredError.code = error.code as string | number;
    }
    
    // Add sanitized stack trace
    if (error.stack && this.config.includeStackTraces) {
      structuredError.stack = sanitizeStackTrace(error.stack, {
        maxStackDepth: this.config.maxStackDepth,
      });
    }
    
    // Handle error cause chain
    if ('cause' in error && error.cause instanceof Error) {
      structuredError.cause = this.createStructuredError(error.cause);
    }
    
    return structuredError;
  }

  /**
   * Generate compliance flags based on log level and options
   */
  private generateComplianceFlags(
    level: StructuredLogLevel,
    options: LogEntryOptions
  ): string[] {
    const flags: string[] = [];
    
    if (this.config.complianceMode) {
      flags.push('compliance_mode');
    }
    
    if (options.auditEvent) {
      flags.push('audit_required');
    }
    
    if (level >= StructuredLogLevel.ERROR) {
      flags.push('error_reporting');
    }
    
    if (options.userId) {
      flags.push('user_associated');
    }
    
    return flags;
  }

  /**
   * Apply field filtering (exclusion and masking) to log entry
   */
  private applyFieldFiltering(entry: StructuredLogEntry): StructuredLogEntry {
    const filtered = { ...entry };
    
    // Remove excluded fields
    for (const field of this.config.excludeFields) {
      delete (filtered as any)[field];
    }
    
    // Apply additional metadata filtering based on configuration
    if (!this.config.includeMetadata) {
      delete filtered.securityAnalysis;
      delete filtered.memoryUsage;
      delete filtered.complianceFlags;
    }
    
    return filtered;
  }

  /**
   * Format log entry for output
   */
  formatLogEntry(entry: StructuredLogEntry): string {
    try {
      switch (this.config.format) {
        case 'json':
          return this.config.prettyPrint 
            ? JSON.stringify(entry, null, 2)
            : JSON.stringify(entry);
            
        case 'text':
          return this.formatAsText(entry);
          
        case 'structured':
          return this.formatAsStructured(entry);
          
        default:
          return JSON.stringify(entry);
      }
    } catch (error) {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level: StructuredLogLevel.ERROR,
        message: 'Failed to format log entry',
        error: String(error),
        originalEntry: { message: entry.message, level: entry.level },
      });
    }
  }

  /**
   * Format entry as human-readable text
   */
  private formatAsText(entry: StructuredLogEntry): string {
    const parts = [
      entry.timestamp,
      `[${entry.levelName}]`,
    ];
    
    if (entry.component) parts.push(`(${entry.component})`);
    if (entry.operation) parts.push(`{${entry.operation}}`);
    
    parts.push(entry.message);
    
    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`);
    }
    
    if (entry.securityFlags.length > 0) {
      parts.push(`Security: [${entry.securityFlags.join(', ')}]`);
    }
    
    return parts.join(' ');
  }

  /**
   * Format entry as structured text with key-value pairs
   */
  private formatAsStructured(entry: StructuredLogEntry): string {
    const lines = [
      `timestamp=${entry.timestamp}`,
      `level=${entry.levelName}`,
      `message="${entry.message}"`,
    ];
    
    if (entry.component) lines.push(`component=${entry.component}`);
    if (entry.operation) lines.push(`operation=${entry.operation}`);
    if (entry.userId) lines.push(`userId=${entry.userId}`);
    if (entry.traceId) lines.push(`traceId=${entry.traceId}`);
    
    if (entry.error) {
      lines.push(`error.name=${entry.error.name}`);
      lines.push(`error.message="${entry.error.message}"`);
    }
    
    if (entry.securityFlags.length > 0) {
      lines.push(`securityFlags=[${entry.securityFlags.join(',')}]`);
    }
    
    if (Object.keys(entry.context).length > 0) {
      lines.push(`context=${JSON.stringify(entry.context)}`);
    }
    
    return lines.join(' ');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StructuredLoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): StructuredLoggingConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create a structured logger with common presets
 */
export function createStructuredLogger(
  preset: 'development' | 'production' | 'audit' | 'security',
  overrides: Partial<StructuredLoggingConfig> = {}
): StructuredLogger {
  const presetConfigs: Record<string, Partial<StructuredLoggingConfig>> = {
    development: {
      format: 'text',
      prettyPrint: true,
      includeMetadata: true,
      sanitizeByDefault: false,
      includeSecurityAnalysis: false,
      enablePerformanceMetrics: false,
      complianceMode: false,
    },
    production: {
      format: 'json',
      prettyPrint: false,
      includeMetadata: false,
      sanitizeByDefault: true,
      includeSecurityAnalysis: true,
      enablePerformanceMetrics: true,
      complianceMode: true,
    },
    audit: {
      format: 'json',
      prettyPrint: false,
      includeMetadata: true,
      sanitizeByDefault: true,
      includeSecurityAnalysis: true,
      enableAuditMode: true,
      complianceMode: true,
    },
    security: {
      format: 'json',
      prettyPrint: false,
      includeMetadata: true,
      sanitizeByDefault: true,
      includeSecurityAnalysis: true,
      defaultClassification: SecurityClassification.CONFIDENTIAL,
      logInjectionConfig: {
        enableProtection: true,
        maxLineLength: 4096,
        allowControlChars: false,
        preserveFormatting: false,
      },
    },
  };

  const config = { ...presetConfigs[preset], ...overrides };
  return new StructuredLogger(config);
}

/**
 * Convenience functions for common logging patterns
 */
export const structuredLog = {
  /**
   * Create an audit log entry
   */
  audit: (
    message: string,
    options: Omit<LogEntryOptions, 'auditEvent'> = {}
  ) => {
    const logger = createStructuredLogger('audit');
    return logger.createLogEntry(message, { ...options, auditEvent: true });
  },

  /**
   * Create a security log entry
   */
  security: (
    message: string,
    options: LogEntryOptions = {}
  ) => {
    const logger = createStructuredLogger('security');
    return logger.createLogEntry(message, {
      ...options,
      classification: SecurityClassification.CONFIDENTIAL,
    });
  },

  /**
   * Create an error log entry with comprehensive error handling
   */
  error: (
    message: string,
    error: Error,
    options: LogEntryOptions = {}
  ) => {
    const logger = createStructuredLogger('production');
    return logger.createLogEntry(message, {
      ...options,
      level: StructuredLogLevel.ERROR,
      error,
    });
  },

  /**
   * Create a performance log entry with timing information
   */
  performance: (
    message: string,
    duration: number,
    options: LogEntryOptions = {}
  ) => {
    const logger = createStructuredLogger('production', {
      enablePerformanceMetrics: true,
    });
    return logger.createLogEntry(message, {
      ...options,
      level: StructuredLogLevel.INFO,
      duration,
    });
  },
};