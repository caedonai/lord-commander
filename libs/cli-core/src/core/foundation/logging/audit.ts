/**
 * Task 1.4.3: Audit Trail Integration
 *
 * Security-focused audit logging system that integrates with existing structured logging
 * and security violation detection frameworks to provide comprehensive audit trails.
 *
 * Features:
 * - Security event tracking with context preservation
 * - Integrity protection using cryptographic hashing
 * - Tamper detection with verification mechanisms
 * - Secure storage with configurable backends
 * - Compliance support (SOX, GDPR, HIPAA, etc.)
 * - Integration with existing security frameworks
 * - Performance optimization for high-throughput scenarios
 *
 * @security Builds on existing security foundation from Tasks 1.1-1.4.2
 * @compliance Enterprise audit requirements, regulatory standards
 * @performance Optimized for production environments with bounded resource usage
 * @architecture Integrates seamlessly with structured logging and violation detection
 */

import { createHash, randomBytes } from 'node:crypto';
import type { SanitizableObject, SanitizableValue } from '../../../types/common.js';
import type {
  EnhancedSecurityViolation,
  ViolationAnalysisResult,
} from '../security/violation-detector.js';
import type { LogSecurityAnalysis } from './security.js';
import {
  SecurityClassification,
  type StructuredLogEntry,
  StructuredLogLevel,
} from './structured.js';

/**
 * Types of security events that can be audited
 */
export enum AuditEventType {
  // Authentication events
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_TIMEOUT = 'auth_timeout',
  AUTH_LOCKOUT = 'auth_lockout',

  // Authorization events
  AUTHZ_SUCCESS = 'authz_success',
  AUTHZ_FAILURE = 'authz_failure',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  PERMISSION_DENIED = 'permission_denied',

  // Configuration changes
  CONFIG_CHANGE = 'config_change',
  POLICY_CHANGE = 'policy_change',
  SETTING_CHANGE = 'setting_change',

  // Security violations
  SECURITY_VIOLATION = 'security_violation',
  ATTACK_DETECTED = 'attack_detected',
  INTRUSION_ATTEMPT = 'intrusion_attempt',
  MALICIOUS_INPUT = 'malicious_input',

  // Data events
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  DATA_EXPORT = 'data_export',

  // System events
  SYSTEM_START = 'system_start',
  SYSTEM_STOP = 'system_stop',
  SYSTEM_ERROR = 'system_error',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',

  // Administrative events
  ADMIN_ACTION = 'admin_action',
  USER_CREATION = 'user_creation',
  USER_DELETION = 'user_deletion',
  ROLE_ASSIGNMENT = 'role_assignment',

  // CLI-specific events
  COMMAND_EXECUTION = 'command_execution',
  COMMAND_FAILURE = 'command_failure',
  COMMAND_TIMEOUT = 'command_timeout',
  CLI_STARTUP = 'cli_startup',
  CLI_SHUTDOWN = 'cli_shutdown',
}

/**
 * Severity levels for audit events
 */
export enum AuditSeverity {
  INFORMATIONAL = 'informational',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Audit trail integrity status
 */
export enum IntegrityStatus {
  VERIFIED = 'verified',
  CORRUPTED = 'corrupted',
  TAMPERED = 'tampered',
  MISSING = 'missing',
  UNKNOWN = 'unknown',
}

/**
 * User context for audit events
 */
export interface AuditUserContext {
  userId?: string;
  username?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * System context for audit events
 */
export interface AuditSystemContext {
  hostname?: string;
  processId?: number;
  parentProcessId?: number;
  workingDirectory?: string;
  environmentType?: 'development' | 'staging' | 'production';
  version?: string;
  buildId?: string;
  deploymentId?: string;
}

/**
 * Resource context for audit events
 */
export interface AuditResourceContext {
  resourceType?: string;
  resourceId?: string;
  resourcePath?: string;
  resourceName?: string;
  resourceOwner?: string;
  resourcePermissions?: string[];
  beforeValue?: SanitizableValue;
  afterValue?: SanitizableValue;
}

/**
 * Comprehensive audit event entry
 */
export interface AuditEntry {
  // Core identification
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;

  // Message and description
  message: string;
  description?: string;
  outcome: 'success' | 'failure' | 'partial' | 'unknown';

  // Context information
  userContext?: AuditUserContext;
  systemContext?: AuditSystemContext;
  resourceContext?: AuditResourceContext;

  // Security information
  securityClassification: SecurityClassification;
  securityViolations?: EnhancedSecurityViolation[];
  violationAnalysis?: ViolationAnalysisResult;
  threatLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical';

  // Tracing and correlation
  traceId?: string;
  correlationId?: string;
  parentEventId?: string;
  relatedEventIds?: string[];

  // Additional metadata
  tags?: string[];
  category?: string;
  source?: string;
  component?: string;
  operation?: string;

  // Compliance and retention
  complianceFlags?: string[];
  retentionPolicy?: string;
  retentionUntil?: string;

  // Raw data references
  rawLogEntry?: StructuredLogEntry;
  securityAnalysis?: LogSecurityAnalysis;

  // Integrity protection
  checksum?: string;
  signature?: string;
  previousEntryHash?: string;
}

/**
 * Audit trail metadata and configuration
 */
export interface AuditTrailMetadata {
  id: string;
  name: string;
  description?: string;

  // Creation and modification
  createdAt: string;
  modifiedAt: string;
  version: string;

  // Statistics
  totalEntries: number;
  sizeBytes: number;
  oldestEntry?: string;
  newestEntry?: string;

  // Integrity information
  integrityStatus: IntegrityStatus;
  lastVerified?: string;
  checksumAlgorithm: string;

  // Configuration
  maxEntries?: number;
  maxSizeBytes?: number;
  retentionDays?: number;
  autoRotate?: boolean;

  // Security settings
  encryptionEnabled: boolean;
  signatureEnabled: boolean;
  tamperDetectionEnabled: boolean;
}

/**
 * Complete audit trail with entries and metadata
 */
export interface AuditTrail {
  metadata: AuditTrailMetadata;
  entries: AuditEntry[];

  // Integrity chain
  hashChain?: string[];
  merkleRoot?: string;

  // Verification data
  lastIntegrityCheck?: string;
  verificationSignature?: string;
}

/**
 * Configuration for audit trail system
 */
export interface AuditTrailConfig {
  // Basic configuration
  enabled: boolean;
  trailName: string;
  description?: string;

  // Storage configuration
  storageBackend: 'memory' | 'file' | 'database' | 'external';
  storagePath?: string;
  maxEntries?: number;
  maxSizeBytes?: number;

  // Security configuration
  enableIntegrityProtection: boolean;
  enableEncryption: boolean;
  enableTamperDetection: boolean;
  checksumAlgorithm: 'sha256' | 'sha512' | 'blake2b';

  // Performance configuration
  batchSize: number;
  flushInterval: number;
  compressionEnabled: boolean;
  asyncProcessing: boolean;

  // Retention configuration
  defaultRetentionDays: number;
  autoRotate: boolean;
  rotationSize: number;
  maxRotationFiles: number;

  // Filter configuration
  enabledEventTypes: AuditEventType[];
  minimumSeverity: AuditSeverity;
  includeUserContext: boolean;
  includeSystemContext: boolean;
  includeResourceContext: boolean;

  // Integration configuration
  integrationWithStructuredLogging: boolean;
  integrationWithViolationDetection: boolean;
  forwardToSecurityMonitoring: boolean;

  // Compliance configuration
  complianceMode: boolean;
  complianceFrameworks: string[]; // ['SOX', 'GDPR', 'HIPAA', 'PCI-DSS']
  requireDigitalSignatures: boolean;
  nonRepudiationEnabled: boolean;
}

/**
 * Security constants for audit trail protection
 */
export const AUDIT_SECURITY_LIMITS = {
  MAX_ENTRY_SIZE_BYTES: 1024 * 1024, // 1MB per entry
  MAX_BATCH_BUFFER_SIZE: 100, // Maximum entries in batch buffer
  MAX_CHECKSUM_COMPUTATION_TIME_MS: 5000, // 5 seconds timeout
  MAX_ARRAY_SIZE: 100, // Maximum items in arrays (tags, related events, etc.)
  MAX_STRING_LENGTH: 10000, // Maximum string field length
  MAX_CONTEXT_SIZE_BYTES: 100 * 1024, // 100KB per context object
  MAX_TOTAL_SIZE_BYTES: 10 * 1024 * 1024, // 10MB total storage (reduced from 50MB)
} as const;

/**
 * Default audit trail configuration with security-first defaults
 */
export const DEFAULT_AUDIT_TRAIL_CONFIG: AuditTrailConfig = {
  enabled: true,
  trailName: 'default-audit-trail',
  description: 'Default audit trail for security events',

  storageBackend: 'memory',
  maxEntries: 5000, // Reduced from 10000
  maxSizeBytes: AUDIT_SECURITY_LIMITS.MAX_TOTAL_SIZE_BYTES,

  enableIntegrityProtection: true,
  enableEncryption: true, // SECURITY FIX: Enable by default
  enableTamperDetection: true,
  checksumAlgorithm: 'sha256',

  batchSize: 50, // Reduced from 100
  flushInterval: 3000, // Reduced from 5 seconds
  compressionEnabled: false,
  asyncProcessing: true,

  defaultRetentionDays: 90, // Reduced from 365
  autoRotate: true,
  rotationSize: 5 * 1024 * 1024, // Reduced to 5MB
  maxRotationFiles: 5, // Reduced from 10

  enabledEventTypes: Object.values(AuditEventType),
  minimumSeverity: AuditSeverity.INFORMATIONAL,
  includeUserContext: true,
  includeSystemContext: true,
  includeResourceContext: true,

  integrationWithStructuredLogging: true,
  integrationWithViolationDetection: true,
  forwardToSecurityMonitoring: false,

  complianceMode: true, // SECURITY FIX: Enable by default
  complianceFrameworks: ['GDPR', 'SOX'], // Default compliance frameworks
  requireDigitalSignatures: true, // SECURITY FIX: Enable by default
  nonRepudiationEnabled: true, // SECURITY FIX: Enable by default
};

/**
 * Audit trail query filters
 */
export interface AuditQueryFilter {
  // Time range
  startTime?: string;
  endTime?: string;

  // Event filters
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  outcomes?: ('success' | 'failure' | 'partial' | 'unknown')[];

  // Context filters
  userIds?: string[];
  sessionIds?: string[];
  ipAddresses?: string[];
  components?: string[];
  operations?: string[];

  // Security filters
  threatLevels?: ('none' | 'low' | 'medium' | 'high' | 'critical')[];
  hasViolations?: boolean;
  classifications?: SecurityClassification[];

  // Text search
  searchTerms?: string[];
  messageContains?: string;

  // Pagination
  limit?: number;
  offset?: number;
  sortBy?: keyof AuditEntry;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit trail query result
 */
export interface AuditQueryResult {
  entries: AuditEntry[];
  totalCount: number;
  filteredCount: number;
  queryTime: number;
  hasMore: boolean;
  nextOffset?: number;
}

/**
 * Integrity verification result
 */
export interface IntegrityVerificationResult {
  status: IntegrityStatus;
  verifiedEntries: number;
  totalEntries: number;
  corruptedEntries: AuditEntry[];
  missingEntries: string[];
  errors: string[];
  verificationTime: number;
  lastVerifiedHash?: string;
}

/**
 * Audit trail export options
 */
export interface AuditExportOptions {
  format: 'json' | 'csv' | 'xml' | 'pdf';
  includeMetadata: boolean;
  includeIntegrityData: boolean;
  compressOutput: boolean;
  encryptOutput: boolean;
  digitalSignature: boolean;

  // Filtering
  filter?: AuditQueryFilter;

  // Compliance
  complianceTemplate?: string;
  certificationLevel?: 'basic' | 'enhanced' | 'premium';
}

/**
 * Audit trail import result
 */
export interface AuditImportResult {
  importedEntries: number;
  skippedEntries: number;
  failedEntries: number;
  integrityStatus: IntegrityStatus;
  errors: string[];
  warnings: string[];
  importTime: number;
}

/**
 * Audit event builder for creating audit entries
 */
export interface AuditEventBuilder {
  setEventType(type: AuditEventType): AuditEventBuilder;
  setSeverity(severity: AuditSeverity): AuditEventBuilder;
  setMessage(message: string): AuditEventBuilder;
  setDescription(description: string): AuditEventBuilder;
  setOutcome(outcome: 'success' | 'failure' | 'partial' | 'unknown'): AuditEventBuilder;

  setUserContext(context: AuditUserContext): AuditEventBuilder;
  setSystemContext(context: AuditSystemContext): AuditEventBuilder;
  setResourceContext(context: AuditResourceContext): AuditEventBuilder;

  setSecurityClassification(classification: SecurityClassification): AuditEventBuilder;
  addSecurityViolation(violation: EnhancedSecurityViolation): AuditEventBuilder;
  setThreatLevel(level: 'none' | 'low' | 'medium' | 'high' | 'critical'): AuditEventBuilder;

  setTraceId(traceId: string): AuditEventBuilder;
  setCorrelationId(correlationId: string): AuditEventBuilder;
  setParentEventId(parentId: string): AuditEventBuilder;
  addRelatedEvent(eventId: string): AuditEventBuilder;

  addTag(tag: string): AuditEventBuilder;
  setCategory(category: string): AuditEventBuilder;
  setSource(source: string): AuditEventBuilder;
  setComponent(component: string): AuditEventBuilder;
  setOperation(operation: string): AuditEventBuilder;

  addComplianceFlag(flag: string): AuditEventBuilder;
  setRetentionPolicy(policy: string): AuditEventBuilder;

  setRawLogEntry(logEntry: StructuredLogEntry): AuditEventBuilder;
  setSecurityAnalysis(analysis: LogSecurityAnalysis): AuditEventBuilder;

  build(): AuditEntry;
}

/**
 * Security validation utilities for audit trail
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Utility class for audit security functions
export class AuditSecurityValidator {
  /**
   * Validate audit entry size and content for security
   */
  static validateAuditEntry(entry: AuditEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Sanitize the entry first to prevent prototype pollution attacks
    if (entry.userContext) {
      entry.userContext = AuditSecurityValidator.sanitizeContextObject(
        entry.userContext as SanitizableValue
      ) as AuditUserContext;
    }
    if (entry.systemContext) {
      entry.systemContext = AuditSecurityValidator.sanitizeContextObject(
        entry.systemContext as SanitizableValue
      ) as AuditSystemContext;
    }
    if (entry.resourceContext) {
      entry.resourceContext = AuditSecurityValidator.sanitizeContextObject(
        entry.resourceContext as SanitizableValue
      ) as AuditResourceContext;
    }

    // Calculate entry size
    const entrySize = AuditSecurityValidator.calculateEntrySize(entry);
    if (entrySize > AUDIT_SECURITY_LIMITS.MAX_ENTRY_SIZE_BYTES) {
      errors.push(
        `Entry size ${entrySize} bytes exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_ENTRY_SIZE_BYTES} bytes`
      );
    }

    // Validate string field lengths
    if (entry.message?.length > AUDIT_SECURITY_LIMITS.MAX_STRING_LENGTH) {
      errors.push(
        `Message length ${entry.message.length} exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_STRING_LENGTH}`
      );
    }

    if (entry.description && entry.description.length > AUDIT_SECURITY_LIMITS.MAX_STRING_LENGTH) {
      errors.push(
        `Description length ${entry.description.length} exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_STRING_LENGTH}`
      );
    }

    // Validate array sizes
    if (entry.tags && entry.tags.length > AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE) {
      errors.push(
        `Tags array size ${entry.tags.length} exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE}`
      );
    }

    if (
      entry.relatedEventIds &&
      entry.relatedEventIds.length > AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE
    ) {
      errors.push(
        `Related events array size ${entry.relatedEventIds.length} exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE}`
      );
    }

    if (
      entry.complianceFlags &&
      entry.complianceFlags.length > AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE
    ) {
      errors.push(
        `Compliance flags array size ${entry.complianceFlags.length} exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE}`
      );
    }

    // Validate context objects
    if (entry.userContext) {
      const contextSize = AuditSecurityValidator.calculateObjectSize(entry.userContext);
      if (contextSize > AUDIT_SECURITY_LIMITS.MAX_CONTEXT_SIZE_BYTES) {
        errors.push(
          `User context size ${contextSize} bytes exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_CONTEXT_SIZE_BYTES} bytes`
        );
      }

      const contextErrors = AuditSecurityValidator.validateContextObject(
        entry.userContext,
        'userContext'
      );
      errors.push(...contextErrors);
    }

    if (entry.systemContext) {
      const contextSize = AuditSecurityValidator.calculateObjectSize(entry.systemContext);
      if (contextSize > AUDIT_SECURITY_LIMITS.MAX_CONTEXT_SIZE_BYTES) {
        errors.push(
          `System context size ${contextSize} bytes exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_CONTEXT_SIZE_BYTES} bytes`
        );
      }

      const contextErrors = AuditSecurityValidator.validateContextObject(
        entry.systemContext,
        'systemContext'
      );
      errors.push(...contextErrors);
    }

    if (entry.resourceContext) {
      const contextSize = AuditSecurityValidator.calculateObjectSize(entry.resourceContext);
      if (contextSize > AUDIT_SECURITY_LIMITS.MAX_CONTEXT_SIZE_BYTES) {
        errors.push(
          `Resource context size ${contextSize} bytes exceeds maximum ${AUDIT_SECURITY_LIMITS.MAX_CONTEXT_SIZE_BYTES} bytes`
        );
      }

      const contextErrors = AuditSecurityValidator.validateContextObject(
        entry.resourceContext,
        'resourceContext'
      );
      errors.push(...contextErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize context object against prototype pollution and circular references
   */
  static sanitizeContextObject(obj: SanitizableValue): SanitizableValue {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Detect circular references
    const seen = new WeakSet();

    const sanitize = (current: SanitizableValue): SanitizableValue => {
      if (current === null || typeof current !== 'object') {
        return current;
      }

      if (seen.has(current)) {
        return '[Circular Reference Removed]';
      }

      seen.add(current);

      if (Array.isArray(current)) {
        return current.slice(0, AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE).map(sanitize);
      }

      const sanitized: SanitizableObject = {};
      const keys = Object.keys(current).slice(0, AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE);

      for (const key of keys) {
        // Block dangerous prototype pollution keys
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }

        try {
          sanitized[key] = sanitize((current as Record<string, SanitizableValue>)[key]);
        } catch (_error) {
          sanitized[key] = '[Sanitization Error]';
        }
      }

      return sanitized;
    };

    return sanitize(obj);
  }

  /**
   * Calculate approximate size of an audit entry
   */
  private static calculateEntrySize(entry: AuditEntry): number {
    try {
      return JSON.stringify(entry).length;
    } catch (_error) {
      // If JSON.stringify fails (circular refs), estimate size
      let size = 0;

      // Estimate based on string fields
      size += entry.message?.length || 0;
      size += entry.description?.length || 0;
      size += entry.id?.length || 0;
      size += entry.timestamp?.length || 0;

      // Add estimated overhead for objects and arrays
      size += 1000; // Base overhead

      return size;
    }
  }

  /**
   * Calculate approximate size of an object
   */
  private static calculateObjectSize(obj: unknown): number {
    try {
      return JSON.stringify(obj).length;
    } catch (_error) {
      // Fallback estimation
      return 1000;
    }
  }

  /**
   * Validate context object for dangerous properties
   */
  private static validateContextObject(obj: unknown, contextName: string): string[] {
    const errors: string[] = [];

    if (typeof obj !== 'object' || obj === null) {
      return errors;
    }

    // Check for dangerous properties (using hasOwnProperty to avoid inherited properties)
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    for (const key of dangerousKeys) {
      if (Object.hasOwn(obj, key)) {
        errors.push(`${contextName} contains dangerous property: ${key}`);
      }
    }

    // Check for excessively deep nesting
    const maxDepth = 10;
    const checkDepth = (current: unknown, depth: number): boolean => {
      if (depth > maxDepth) {
        return false;
      }

      if (typeof current === 'object' && current !== null) {
        for (const value of Object.values(current)) {
          if (!checkDepth(value, depth + 1)) {
            return false;
          }
        }
      }

      return true;
    };

    if (!checkDepth(obj, 0)) {
      errors.push(`${contextName} exceeds maximum nesting depth of ${maxDepth}`);
    }

    return errors;
  }

  /**
   * Validate configuration for security
   */
  static validateConfiguration(config: Partial<AuditTrailConfig>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate numeric limits
    if (config.maxEntries !== undefined) {
      if (config.maxEntries < 0 || config.maxEntries > 50000) {
        errors.push(`maxEntries must be between 0 and 50000, got ${config.maxEntries}`);
      }
    }

    if (config.maxSizeBytes !== undefined) {
      if (config.maxSizeBytes < 0 || config.maxSizeBytes > 100 * 1024 * 1024) {
        errors.push(`maxSizeBytes must be between 0 and 100MB, got ${config.maxSizeBytes}`);
      }
    }

    if (config.batchSize !== undefined) {
      if (config.batchSize < 1 || config.batchSize > 1000) {
        errors.push(`batchSize must be between 1 and 1000, got ${config.batchSize}`);
      }
    }

    if (config.flushInterval !== undefined) {
      if (config.flushInterval < 100 || config.flushInterval > 60000) {
        errors.push(`flushInterval must be between 100ms and 60s, got ${config.flushInterval}`);
      }
    }

    // Validate algorithm
    if (config.checksumAlgorithm !== undefined) {
      const validAlgorithms = ['sha256', 'sha512', 'blake2b'];
      if (!validAlgorithms.includes(config.checksumAlgorithm)) {
        errors.push(
          `checksumAlgorithm must be one of ${validAlgorithms.join(', ')}, got ${config.checksumAlgorithm}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Helper functions for generating audit-related values
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Utility class for audit helper functions
export class AuditHelpers {
  /**
   * Generate a unique audit entry ID
   */
  static generateAuditId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(8).toString('hex');
    return `audit_${timestamp}_${randomPart}`;
  }

  /**
   * Generate a checksum for an audit entry with timeout protection
   */
  static generateChecksum(
    entry: AuditEntry,
    algorithm: 'sha256' | 'sha512' | 'blake2b' = 'sha256'
  ): string {
    const startTime = Date.now();

    try {
      // Create a deterministic string representation of the entry
      // Exclude checksum and previousEntryHash to avoid circular dependencies
      const entryData = {
        id: entry.id,
        timestamp: entry.timestamp,
        eventType: entry.eventType,
        severity: entry.severity,
        message: entry.message,
        outcome: entry.outcome,
        userContext: entry.userContext,
        systemContext: entry.systemContext,
        resourceContext: entry.resourceContext,
        securityClassification: entry.securityClassification,
        traceId: entry.traceId,
        correlationId: entry.correlationId,
        // Don't include previousEntryHash or checksum in checksum calculation
      };

      // Pre-truncate data if too large to prevent DoS
      let dataString = JSON.stringify(entryData, Object.keys(entryData).sort());
      if (dataString.length > AUDIT_SECURITY_LIMITS.MAX_ENTRY_SIZE_BYTES * 3) {
        dataString = dataString.substring(0, AUDIT_SECURITY_LIMITS.MAX_ENTRY_SIZE_BYTES * 3);
      }

      // Check if computation is taking too long
      if (Date.now() - startTime > AUDIT_SECURITY_LIMITS.MAX_CHECKSUM_COMPUTATION_TIME_MS) {
        throw new Error('Checksum computation timeout - potential DoS attack');
      }

      return createHash(algorithm).update(dataString).digest('hex');
    } catch (_error) {
      // Fallback to simple checksum if complex computation fails
      const fallbackData = `${entry.id}-${entry.timestamp}-${entry.eventType}-${entry.severity}`;
      return createHash('sha256').update(fallbackData).digest('hex');
    }
  }

  /**
   * Create a safe timestamp
   */
  static createTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Calculate retention expiration date
   */
  static calculateRetentionExpiration(retentionDays: number): string {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + retentionDays);
    return expirationDate.toISOString();
  }

  /**
   * Determine audit severity from structured log level
   */
  static mapLogLevelToAuditSeverity(logLevel: StructuredLogLevel): AuditSeverity {
    switch (logLevel) {
      case StructuredLogLevel.TRACE:
      case StructuredLogLevel.DEBUG:
        return AuditSeverity.INFORMATIONAL;
      case StructuredLogLevel.INFO:
        return AuditSeverity.LOW;
      case StructuredLogLevel.WARN:
        return AuditSeverity.MEDIUM;
      case StructuredLogLevel.ERROR:
        return AuditSeverity.HIGH;
      case StructuredLogLevel.FATAL:
        return AuditSeverity.CRITICAL;
      default:
        return AuditSeverity.LOW;
    }
  }

  /**
   * Determine event type from security violation
   */
  static mapViolationToEventType(violation: EnhancedSecurityViolation): AuditEventType {
    // Map based on violation type patterns
    const violationType = violation.type.toLowerCase();

    if (violationType.includes('auth')) {
      return AuditEventType.AUTH_FAILURE;
    } else if (
      violationType.includes('injection') ||
      violationType.includes('xss') ||
      violationType.includes('sql')
    ) {
      return AuditEventType.ATTACK_DETECTED;
    } else if (violationType.includes('malicious') || violationType.includes('dangerous')) {
      return AuditEventType.MALICIOUS_INPUT;
    } else if (violationType.includes('access') || violationType.includes('permission')) {
      return AuditEventType.PERMISSION_DENIED;
    } else {
      return AuditEventType.SECURITY_VIOLATION;
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Sanitize environment data to prevent information disclosure
   */
  static sanitizeEnvironmentData(): AuditSystemContext {
    const hostname = process.env.HOSTNAME || 'unknown';
    const workingDir = process.cwd();

    return {
      hostname: hostname.length > 50 ? `${hostname.substring(0, 50)}...` : hostname,
      processId: process.pid,
      parentProcessId: process.ppid,
      workingDirectory:
        workingDir.length > 100
          ? `...${workingDir.substring(workingDir.length - 100)}`
          : workingDir,
      environmentType: AuditHelpers.determineEnvironmentType(),
      version: process.version,
    };
  }

  /**
   * Determine environment type safely
   */
  private static determineEnvironmentType(): 'development' | 'staging' | 'production' {
    const env = process.env.NODE_ENV?.toLowerCase();

    if (env === 'production' || env === 'prod') {
      return 'production';
    } else if (env === 'staging' || env === 'stage') {
      return 'staging';
    } else {
      return 'development';
    }
  }
}

/**
 * Audit event builder implementation for fluent API
 */
export class AuditEventBuilderImpl implements AuditEventBuilder {
  private entry: Partial<AuditEntry> = {};

  constructor() {
    this.entry.id = AuditHelpers.generateAuditId();
    this.entry.timestamp = AuditHelpers.createTimestamp();
    this.entry.securityClassification = SecurityClassification.INTERNAL;
    this.entry.tags = [];
    this.entry.relatedEventIds = [];
    this.entry.complianceFlags = [];
  }

  setEventType(type: AuditEventType): AuditEventBuilder {
    this.entry.eventType = type;
    return this;
  }

  setSeverity(severity: AuditSeverity): AuditEventBuilder {
    this.entry.severity = severity;
    return this;
  }

  setMessage(message: string): AuditEventBuilder {
    // Validate and sanitize message
    if (message && message.length > AUDIT_SECURITY_LIMITS.MAX_STRING_LENGTH) {
      this.entry.message = `${message.substring(0, AUDIT_SECURITY_LIMITS.MAX_STRING_LENGTH)}...[truncated]`;
    } else {
      this.entry.message = message;
    }
    return this;
  }

  setDescription(description: string): AuditEventBuilder {
    // Validate and sanitize description
    if (description && description.length > AUDIT_SECURITY_LIMITS.MAX_STRING_LENGTH) {
      this.entry.description = `${description.substring(0, AUDIT_SECURITY_LIMITS.MAX_STRING_LENGTH)}...[truncated]`;
    } else {
      this.entry.description = description;
    }
    return this;
  }

  setOutcome(outcome: 'success' | 'failure' | 'partial' | 'unknown'): AuditEventBuilder {
    this.entry.outcome = outcome;
    return this;
  }

  setUserContext(context: AuditUserContext): AuditEventBuilder {
    // Sanitize context object against prototype pollution and circular references
    this.entry.userContext = AuditSecurityValidator.sanitizeContextObject(
      context as SanitizableValue
    ) as AuditUserContext;
    return this;
  }

  setSystemContext(context: AuditSystemContext): AuditEventBuilder {
    // Sanitize context object against prototype pollution and circular references
    this.entry.systemContext = AuditSecurityValidator.sanitizeContextObject(
      context as SanitizableValue
    ) as AuditSystemContext;
    return this;
  }

  setResourceContext(context: AuditResourceContext): AuditEventBuilder {
    // Sanitize context object against prototype pollution and circular references
    this.entry.resourceContext = AuditSecurityValidator.sanitizeContextObject(
      context as SanitizableValue
    ) as AuditResourceContext;
    return this;
  }

  setSecurityClassification(classification: SecurityClassification): AuditEventBuilder {
    this.entry.securityClassification = classification;
    return this;
  }

  addSecurityViolation(violation: EnhancedSecurityViolation): AuditEventBuilder {
    if (!this.entry.securityViolations) {
      this.entry.securityViolations = [];
    }
    this.entry.securityViolations.push(violation);
    return this;
  }

  setThreatLevel(level: 'none' | 'low' | 'medium' | 'high' | 'critical'): AuditEventBuilder {
    this.entry.threatLevel = level;
    return this;
  }

  setTraceId(traceId: string): AuditEventBuilder {
    this.entry.traceId = traceId;
    return this;
  }

  setCorrelationId(correlationId: string): AuditEventBuilder {
    this.entry.correlationId = correlationId;
    return this;
  }

  setParentEventId(parentId: string): AuditEventBuilder {
    this.entry.parentEventId = parentId;
    return this;
  }

  addRelatedEvent(eventId: string): AuditEventBuilder {
    if (!this.entry.relatedEventIds) {
      this.entry.relatedEventIds = [];
    }

    // Enforce array size limit
    if (this.entry.relatedEventIds.length < AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE) {
      this.entry.relatedEventIds.push(eventId);
    }
    return this;
  }

  addTag(tag: string): AuditEventBuilder {
    if (!this.entry.tags) {
      this.entry.tags = [];
    }

    // Enforce array size limit
    if (this.entry.tags.length < AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE) {
      // Sanitize tag string
      const sanitizedTag = tag && tag.length > 100 ? tag.substring(0, 100) : tag;
      this.entry.tags.push(sanitizedTag);
    }
    return this;
  }

  setCategory(category: string): AuditEventBuilder {
    this.entry.category = category;
    return this;
  }

  setSource(source: string): AuditEventBuilder {
    this.entry.source = source;
    return this;
  }

  setComponent(component: string): AuditEventBuilder {
    this.entry.component = component;
    return this;
  }

  setOperation(operation: string): AuditEventBuilder {
    this.entry.operation = operation;
    return this;
  }

  addComplianceFlag(flag: string): AuditEventBuilder {
    if (!this.entry.complianceFlags) {
      this.entry.complianceFlags = [];
    }

    // Enforce array size limit
    if (this.entry.complianceFlags.length < AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE) {
      this.entry.complianceFlags.push(flag);
    }
    return this;
  }

  setRetentionPolicy(policy: string): AuditEventBuilder {
    this.entry.retentionPolicy = policy;
    return this;
  }

  setRawLogEntry(logEntry: StructuredLogEntry): AuditEventBuilder {
    this.entry.rawLogEntry = logEntry;
    return this;
  }

  setSecurityAnalysis(analysis: LogSecurityAnalysis): AuditEventBuilder {
    this.entry.securityAnalysis = analysis;
    return this;
  }

  build(): AuditEntry {
    // Validate required fields
    if (!this.entry.eventType) {
      throw new Error('Event type is required for audit entry');
    }
    if (!this.entry.severity) {
      throw new Error('Severity is required for audit entry');
    }
    if (!this.entry.message) {
      throw new Error('Message is required for audit entry');
    }
    if (!this.entry.outcome) {
      throw new Error('Outcome is required for audit entry');
    }

    // Set retention expiration if policy is specified
    if (this.entry.retentionPolicy) {
      const days = parseInt(this.entry.retentionPolicy.replace(/\D/g, ''), 10) || 365;
      this.entry.retentionUntil = AuditHelpers.calculateRetentionExpiration(days);
    }

    const auditEntry = this.entry as AuditEntry;

    // Perform comprehensive security validation
    const validation = AuditSecurityValidator.validateAuditEntry(auditEntry);
    if (!validation.isValid) {
      throw new Error(`Audit entry validation failed: ${validation.errors.join(', ')}`);
    }

    return auditEntry;
  }
}

/**
 * Storage backend interface for audit trails
 */
export interface AuditStorageBackend {
  // Basic operations
  init(): Promise<void>;
  close(): Promise<void>;

  // Entry operations
  addEntry(entry: AuditEntry): Promise<void>;
  addEntries(entries: AuditEntry[]): Promise<void>;
  getEntry(id: string): Promise<AuditEntry | null>;
  getEntries(filter: AuditQueryFilter): Promise<AuditQueryResult>;

  // Metadata operations
  getMetadata(): Promise<AuditTrailMetadata>;
  updateMetadata(metadata: Partial<AuditTrailMetadata>): Promise<void>;

  // Integrity operations
  calculateChecksum(): Promise<string>;
  verifyIntegrity(): Promise<IntegrityVerificationResult>;

  // Maintenance operations
  rotate(): Promise<void>;
  cleanup(olderThan: Date): Promise<number>;
  export(options: AuditExportOptions): Promise<Buffer>;
}

/**
 * In-memory storage backend for audit trails with enhanced security
 */
export class MemoryAuditStorage implements AuditStorageBackend {
  private entries: Map<string, AuditEntry> = new Map();
  private metadata: AuditTrailMetadata;
  private isLocked: boolean = false;
  private lockWaiters: Array<() => void> = [];

  constructor(private config: AuditTrailConfig) {
    // Validate configuration first
    const configValidation = AuditSecurityValidator.validateConfiguration(config);
    if (!configValidation.isValid) {
      throw new Error(`Invalid audit trail configuration: ${configValidation.errors.join(', ')}`);
    }

    this.metadata = {
      id: `audit-trail-${Date.now()}`,
      name: config.trailName,
      description: config.description,
      createdAt: AuditHelpers.createTimestamp(),
      modifiedAt: AuditHelpers.createTimestamp(),
      version: '1.0.0',
      totalEntries: 0,
      sizeBytes: 0,
      integrityStatus: IntegrityStatus.VERIFIED,
      checksumAlgorithm: config.checksumAlgorithm,
      encryptionEnabled: config.enableEncryption,
      signatureEnabled: config.requireDigitalSignatures,
      tamperDetectionEnabled: config.enableTamperDetection,
    };
  }

  async init(): Promise<void> {
    // Memory storage doesn't need initialization
  }

  async close(): Promise<void> {
    // Wait for any pending operations to complete
    await this.acquireLock();

    try {
      // Clear memory to free resources
      this.entries.clear();
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Acquire exclusive lock for atomic operations
   */
  private async acquireLock(): Promise<void> {
    if (!this.isLocked) {
      this.isLocked = true;
      return;
    }

    // Wait for lock to become available
    return new Promise((resolve) => {
      this.lockWaiters.push(resolve);
    });
  }

  /**
   * Release exclusive lock
   */
  private releaseLock(): void {
    this.isLocked = false;

    // Wake up next waiter
    const nextWaiter = this.lockWaiters.shift();
    if (nextWaiter) {
      this.isLocked = true;
      nextWaiter();
    }
  }

  async addEntry(entry: AuditEntry): Promise<void> {
    await this.acquireLock();

    try {
      // Validate entry security before adding
      const validation = AuditSecurityValidator.validateAuditEntry(entry);
      if (!validation.isValid) {
        throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
      }

      // Check total size before adding
      const entrySize = JSON.stringify(entry).length;
      if (
        this.metadata.sizeBytes + entrySize >
        (this.config.maxSizeBytes || AUDIT_SECURITY_LIMITS.MAX_TOTAL_SIZE_BYTES)
      ) {
        throw new Error(`Adding entry would exceed maximum storage size limit`);
      }

      // Add integrity protection
      if (this.config.enableIntegrityProtection) {
        // Get sorted entries for consistent hash chain
        const sortedEntries = Array.from(this.entries.values()).sort((a, b) =>
          a.timestamp.localeCompare(b.timestamp)
        );

        const lastEntry = sortedEntries[sortedEntries.length - 1];
        if (lastEntry) {
          entry.previousEntryHash = lastEntry.checksum;
        }

        // Generate checksum after setting previousEntryHash
        entry.checksum = AuditHelpers.generateChecksum(entry, this.config.checksumAlgorithm);
      }

      this.entries.set(entry.id, entry);

      // Update metadata atomically
      this.updateMetadataForNewEntry(entry, entrySize);

      // Check size limits after adding
      await this.enforceSizeLimits();
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Update metadata for new entry (called within lock)
   */
  private updateMetadataForNewEntry(entry: AuditEntry, entrySize: number): void {
    this.metadata.totalEntries = this.entries.size;
    this.metadata.sizeBytes += entrySize;
    this.metadata.modifiedAt = AuditHelpers.createTimestamp();

    if (!this.metadata.oldestEntry || entry.timestamp < this.metadata.oldestEntry) {
      this.metadata.oldestEntry = entry.timestamp;
    }
    if (!this.metadata.newestEntry || entry.timestamp > this.metadata.newestEntry) {
      this.metadata.newestEntry = entry.timestamp;
    }
  }

  /**
   * Enforce size limits (called within lock)
   */
  private async enforceSizeLimits(): Promise<void> {
    let deletedEntries = 0;

    // Check entry count limit
    if (this.config.maxEntries && this.entries.size > this.config.maxEntries) {
      const entriesToRemove = this.entries.size - this.config.maxEntries;
      const removedCount = await this.removeOldestEntries(entriesToRemove);
      deletedEntries += removedCount;
    }

    // Check size limit
    if (this.config.maxSizeBytes && this.metadata.sizeBytes > this.config.maxSizeBytes) {
      const removedCount = await this.removeLargestEntries();
      deletedEntries += removedCount;
    }

    // Log deletion for audit trail
    if (deletedEntries > 0) {
      console.warn(`[AUDIT TRAIL] Deleted ${deletedEntries} entries to enforce size limits`);
    }
  }

  async addEntries(entries: AuditEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.addEntry(entry);
    }
  }

  async getEntry(id: string): Promise<AuditEntry | null> {
    return this.entries.get(id) || null;
  }

  async getEntries(filter: AuditQueryFilter): Promise<AuditQueryResult> {
    const startTime = Date.now();
    let filteredEntries = Array.from(this.entries.values());

    // Apply filters
    if (filter.startTime) {
      const startTime = filter.startTime;
      filteredEntries = filteredEntries.filter((e) => e.timestamp >= startTime);
    }
    if (filter.endTime) {
      const endTime = filter.endTime;
      filteredEntries = filteredEntries.filter((e) => e.timestamp <= endTime);
    }
    if (filter.eventTypes?.length) {
      filteredEntries = filteredEntries.filter((e) => filter.eventTypes?.includes(e.eventType));
    }
    if (filter.severities?.length) {
      filteredEntries = filteredEntries.filter((e) => filter.severities?.includes(e.severity));
    }
    if (filter.outcomes?.length) {
      filteredEntries = filteredEntries.filter((e) => filter.outcomes?.includes(e.outcome));
    }
    if (filter.userIds?.length) {
      filteredEntries = filteredEntries.filter(
        (e) => e.userContext?.userId && filter.userIds?.includes(e.userContext.userId)
      );
    }
    if (filter.messageContains) {
      // Sanitize search term to prevent regex DoS attacks
      const searchTerm = filter.messageContains.toLowerCase();
      if (searchTerm.length > 1000) {
        throw new Error('Search term too long (max 1000 characters)');
      }

      // Escape regex special characters to prevent regex DoS
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filteredEntries = filteredEntries.filter(
        (e) =>
          e.message.toLowerCase().includes(escapedTerm) ||
          e.description?.toLowerCase().includes(escapedTerm)
      );
    }

    const totalFiltered = filteredEntries.length;

    // Apply sorting
    if (filter.sortBy) {
      const sortKey = filter.sortBy;
      const sortOrder = filter.sortOrder || 'desc';
      filteredEntries.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        // Handle undefined values
        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return sortOrder === 'asc' ? -1 : 1;
        if (bVal === undefined) return sortOrder === 'asc' ? 1 : -1;

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    const paginatedEntries = filteredEntries.slice(offset, offset + limit);

    return {
      entries: paginatedEntries,
      totalCount: this.entries.size,
      filteredCount: totalFiltered,
      queryTime: Date.now() - startTime,
      hasMore: offset + limit < totalFiltered,
      nextOffset: offset + limit < totalFiltered ? offset + limit : undefined,
    };
  }

  async getMetadata(): Promise<AuditTrailMetadata> {
    return { ...this.metadata };
  }

  async updateMetadata(updates: Partial<AuditTrailMetadata>): Promise<void> {
    this.metadata = { ...this.metadata, ...updates };
    this.metadata.modifiedAt = AuditHelpers.createTimestamp();
  }

  async calculateChecksum(): Promise<string> {
    const allEntries = Array.from(this.entries.values()).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    const dataString = JSON.stringify(allEntries.map((e) => e.checksum || e.id));
    return createHash(this.config.checksumAlgorithm).update(dataString).digest('hex');
  }

  async verifyIntegrity(): Promise<IntegrityVerificationResult> {
    const startTime = Date.now();
    const allEntries = Array.from(this.entries.values()).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    const corruptedEntries: AuditEntry[] = [];
    const errors: string[] = [];
    let verifiedCount = 0;

    for (let i = 0; i < allEntries.length; i++) {
      const entry = allEntries[i];

      // Verify entry checksum
      if (entry.checksum) {
        const expectedChecksum = AuditHelpers.generateChecksum(
          entry,
          this.config.checksumAlgorithm
        );
        if (!AuditHelpers.constantTimeCompare(entry.checksum, expectedChecksum)) {
          corruptedEntries.push(entry);
          errors.push(`Entry ${entry.id} has invalid checksum`);
          continue;
        }
      }

      // Verify hash chain
      if (i > 0 && entry.previousEntryHash) {
        const previousEntry = allEntries[i - 1];
        if (
          !AuditHelpers.constantTimeCompare(entry.previousEntryHash, previousEntry.checksum || '')
        ) {
          corruptedEntries.push(entry);
          errors.push(`Entry ${entry.id} has broken hash chain`);
          continue;
        }
      }

      verifiedCount++;
    }

    const status =
      corruptedEntries.length > 0 ? IntegrityStatus.CORRUPTED : IntegrityStatus.VERIFIED;

    // Update metadata
    this.metadata.integrityStatus = status;
    this.metadata.lastVerified = AuditHelpers.createTimestamp();

    return {
      status,
      verifiedEntries: verifiedCount,
      totalEntries: allEntries.length,
      corruptedEntries,
      missingEntries: [], // Memory storage doesn't have missing entries
      errors,
      verificationTime: Date.now() - startTime,
      lastVerifiedHash: await this.calculateChecksum(),
    };
  }

  async rotate(): Promise<void> {
    // For memory storage, rotation means clearing old entries
    if (this.config.autoRotate && this.config.rotationSize) {
      const currentSize = this.metadata.sizeBytes;
      if (currentSize > this.config.rotationSize) {
        const targetEntries = Math.floor(this.entries.size * 0.7); // Keep 70%
        const entriesToRemove = this.entries.size - targetEntries;
        await this.removeOldestEntries(entriesToRemove);
      }
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    const cutoffTime = olderThan.toISOString();
    const allEntries = Array.from(this.entries.values());
    const entriesToRemove = allEntries.filter((e) => e.timestamp < cutoffTime);

    for (const entry of entriesToRemove) {
      this.entries.delete(entry.id);
    }

    // Update metadata
    this.metadata.totalEntries = this.entries.size;
    this.metadata.sizeBytes = Array.from(this.entries.values()).reduce(
      (size, entry) => size + JSON.stringify(entry).length,
      0
    );
    this.metadata.modifiedAt = AuditHelpers.createTimestamp();

    return entriesToRemove.length;
  }

  async export(options: AuditExportOptions): Promise<Buffer> {
    const filter = options.filter || {};
    const result = await this.getEntries(filter);

    let content: string;

    try {
      switch (options.format) {
        case 'json': {
          const exportData = {
            metadata: options.includeMetadata ? this.metadata : undefined,
            entries: result.entries.map(
              (entry) =>
                AuditSecurityValidator.sanitizeContextObject(
                  entry as unknown as SanitizableValue
                ) as unknown as AuditEntry
            ), // Sanitize for export
            integrityData: options.includeIntegrityData
              ? {
                  checksum: await this.calculateChecksum(),
                  verificationResult: await this.verifyIntegrity(),
                }
              : undefined,
          };

          // Use custom JSON stringify to handle circular references
          content = JSON.stringify(
            exportData,
            (_key, value) => {
              if (typeof value === 'object' && value !== null) {
                // Detect circular references
                if (this.circularRefs?.has(value)) {
                  return '[Circular Reference]';
                }
                if (!this.circularRefs) {
                  this.circularRefs = new WeakSet();
                }
                this.circularRefs.add(value);
              }
              return value;
            },
            2
          );

          // Clean up circular reference tracker
          this.circularRefs = undefined;
          break;
        }

        case 'csv': {
          const headers = ['id', 'timestamp', 'eventType', 'severity', 'message', 'outcome'];
          const rows = result.entries.map((entry) => [
            entry.id || '',
            entry.timestamp || '',
            entry.eventType || '',
            entry.severity || '',
            (entry.message || '')
              .replace(/,/g, ';')
              .replace(/\n/g, ' '), // Escape CSV
            entry.outcome || '',
          ]);
          content = [headers, ...rows].map((row) => row.join(',')).join('\n');
          break;
        }

        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      return Buffer.from(content, 'utf-8');
    } catch (error) {
      // Sanitize error message before throwing
      const sanitizedError =
        error instanceof Error ? error.message.replace(/[<>"']/g, '') : 'Export failed';
      throw new Error(`Export failed: ${sanitizedError}`);
    }
  }

  private circularRefs?: WeakSet<object>;

  private async removeOldestEntries(count: number): Promise<number> {
    const allEntries = Array.from(this.entries.values()).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    let removedCount = 0;
    for (let i = 0; i < count && i < allEntries.length; i++) {
      this.entries.delete(allEntries[i].id);
      removedCount++;
    }

    // Recalculate metadata
    this.metadata.totalEntries = this.entries.size;
    this.metadata.sizeBytes = Array.from(this.entries.values()).reduce(
      (size, entry) => size + JSON.stringify(entry).length,
      0
    );

    return removedCount;
  }

  private async removeLargestEntries(): Promise<number> {
    // Remove entries until under size limit
    const allEntries = Array.from(this.entries.values()).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    let removedCount = 0;
    const maxSizeBytes = this.config.maxSizeBytes || Number.MAX_SAFE_INTEGER;
    while (this.metadata.sizeBytes > maxSizeBytes && allEntries.length > 0) {
      const entryToRemove = allEntries.shift();
      if (!entryToRemove) break;
      this.entries.delete(entryToRemove.id);
      this.metadata.sizeBytes -= JSON.stringify(entryToRemove).length;
      removedCount++;
    }

    return removedCount;
  }
}

/**
 * Main audit trail manager with comprehensive security features
 */
export class AuditTrailManager {
  private storage: AuditStorageBackend;
  private config: AuditTrailConfig;
  private batchBuffer: AuditEntry[] = [];
  private processingQueue: Promise<void> = Promise.resolve();
  private isShuttingDown: boolean = false;
  private activeTimers: Set<NodeJS.Timeout> = new Set();

  constructor(config: Partial<AuditTrailConfig> = {}) {
    // Validate configuration before proceeding
    const configValidation = AuditSecurityValidator.validateConfiguration(config);
    if (!configValidation.isValid) {
      throw new Error(`Invalid audit trail configuration: ${configValidation.errors.join(', ')}`);
    }

    this.config = { ...DEFAULT_AUDIT_TRAIL_CONFIG, ...config };

    // Initialize storage backend
    switch (this.config.storageBackend) {
      case 'memory':
        this.storage = new MemoryAuditStorage(this.config);
        break;
      default:
        throw new Error(`Unsupported storage backend: ${this.config.storageBackend}`);
    }

    // Setup auto-flush timer
    if (this.config.asyncProcessing && this.config.flushInterval > 0) {
      this.setupAutoFlush();
    }
  }

  /**
   * Initialize the audit trail manager
   */
  async init(): Promise<void> {
    await this.storage.init();
  }

  /**
   * Close the audit trail manager and flush pending entries
   */
  async close(): Promise<void> {
    this.isShuttingDown = true;

    // Clear all active timers
    for (const timer of this.activeTimers) {
      clearInterval(timer);
    }
    this.activeTimers.clear();

    // Flush any pending entries
    try {
      await this.flush();
    } catch (error) {
      console.error(
        '[AUDIT TRAIL] Failed to flush pending entries during shutdown:',
        this.sanitizeError(error)
      );
    }

    await this.storage.close();
  }

  /**
   * Sanitize error messages to prevent information disclosure
   */
  private sanitizeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message.replace(/[<>"']/g, '').substring(0, 200);
    }
    return 'Unknown error';
  }

  /**
   * Create a new audit event builder
   */
  createEvent(): AuditEventBuilder {
    return new AuditEventBuilderImpl();
  }

  /**
   * Record an audit event with security validation
   */
  async recordEvent(entry: AuditEntry): Promise<void> {
    if (!this.config.enabled || this.isShuttingDown) {
      return;
    }

    try {
      // Apply filters
      if (!this.shouldRecordEvent(entry)) {
        return;
      }

      // Validate entry security
      const validation = AuditSecurityValidator.validateAuditEntry(entry);
      if (!validation.isValid) {
        console.warn('[AUDIT TRAIL] Entry validation failed:', validation.errors.join(', '));
        return; // Skip invalid entries instead of throwing
      }

      // Enrich entry with system context
      await this.enrichEntry(entry);

      if (this.config.asyncProcessing) {
        // Check batch buffer size limit
        if (this.batchBuffer.length >= AUDIT_SECURITY_LIMITS.MAX_BATCH_BUFFER_SIZE) {
          await this.flush(); // Force flush to prevent buffer overflow
        }

        // Add to batch buffer
        this.batchBuffer.push(entry);

        if (this.batchBuffer.length >= this.config.batchSize) {
          await this.flush();
        }
      } else {
        // Process immediately with error recovery
        this.processingQueue = this.processingQueue
          .then(async () => {
            await this.storage.addEntry(entry);
          })
          .catch((error) => {
            console.error('[AUDIT TRAIL] Failed to record entry:', this.sanitizeError(error));
            // Continue processing despite errors
          });
        await this.processingQueue;
      }
    } catch (error) {
      console.error('[AUDIT TRAIL] Unexpected error in recordEvent:', this.sanitizeError(error));
      // Don't throw - audit failures shouldn't crash the application
    }
  }

  /**
   * Record multiple audit events
   */
  async recordEvents(entries: AuditEntry[]): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const filteredEntries = entries.filter((entry) => this.shouldRecordEvent(entry));

    for (const entry of filteredEntries) {
      await this.enrichEntry(entry);
    }

    if (this.config.asyncProcessing) {
      this.batchBuffer.push(...filteredEntries);

      if (this.batchBuffer.length >= this.config.batchSize) {
        await this.flush();
      }
    } else {
      this.processingQueue = this.processingQueue.then(async () => {
        await this.storage.addEntries(filteredEntries);
      });
      await this.processingQueue;
    }
  }

  /**
   * Get an audit entry by ID
   */
  async getEntry(id: string): Promise<AuditEntry | null> {
    return await this.storage.getEntry(id);
  }

  /**
   * Query audit entries
   */
  async queryEntries(filter: AuditQueryFilter = {}): Promise<AuditQueryResult> {
    return await this.storage.getEntries(filter);
  }

  /**
   * Get audit trail metadata
   */
  async getMetadata(): Promise<AuditTrailMetadata> {
    return await this.storage.getMetadata();
  }

  /**
   * Verify audit trail integrity
   */
  async verifyIntegrity(): Promise<IntegrityVerificationResult> {
    return await this.storage.verifyIntegrity();
  }

  /**
   * Export audit trail
   */
  async export(options: AuditExportOptions): Promise<Buffer> {
    return await this.storage.export(options);
  }

  /**
   * Rotate audit trail
   */
  async rotate(): Promise<void> {
    await this.storage.rotate();
  }

  /**
   * Clean up old entries
   */
  async cleanup(olderThan: Date): Promise<number> {
    return await this.storage.cleanup(olderThan);
  }

  /**
   * Flush pending entries to storage with error recovery
   */
  async flush(): Promise<void> {
    if (this.batchBuffer.length === 0) {
      return;
    }

    const entries = [...this.batchBuffer];
    this.batchBuffer = [];

    this.processingQueue = this.processingQueue
      .then(async () => {
        try {
          await this.storage.addEntries(entries);
        } catch (error) {
          console.error('[AUDIT TRAIL] Failed to flush entries:', this.sanitizeError(error));

          // Try to re-add entries to buffer if not shutting down
          if (
            !this.isShuttingDown &&
            this.batchBuffer.length < AUDIT_SECURITY_LIMITS.MAX_BATCH_BUFFER_SIZE
          ) {
            this.batchBuffer.unshift(
              ...entries.slice(
                0,
                AUDIT_SECURITY_LIMITS.MAX_BATCH_BUFFER_SIZE - this.batchBuffer.length
              )
            );
          }

          throw error; // Re-throw to maintain error state
        }
      })
      .catch((error) => {
        // Log but don't re-throw to prevent queue corruption
        console.error('[AUDIT TRAIL] Processing queue error:', this.sanitizeError(error));
      });

    await this.processingQueue;
  }

  /**
   * Get current configuration
   */
  getConfig(): AuditTrailConfig {
    return { ...this.config };
  }

  /**
   * Update configuration with validation
   */
  updateConfig(updates: Partial<AuditTrailConfig>): void {
    // Validate configuration updates
    const configValidation = AuditSecurityValidator.validateConfiguration(updates);
    if (!configValidation.isValid) {
      throw new Error(`Invalid configuration updates: ${configValidation.errors.join(', ')}`);
    }

    this.config = { ...this.config, ...updates };

    // Restart auto-flush if needed
    for (const timer of this.activeTimers) {
      clearInterval(timer);
    }
    this.activeTimers.clear();

    if (this.config.asyncProcessing && this.config.flushInterval > 0 && !this.isShuttingDown) {
      this.setupAutoFlush();
    }
  }

  /**
   * Convenience method to record a security violation event
   */
  async recordSecurityViolation(
    violation: EnhancedSecurityViolation,
    context?: {
      userContext?: AuditUserContext;
      systemContext?: AuditSystemContext;
      additionalInfo?: Record<string, unknown>;
    }
  ): Promise<void> {
    const eventType = AuditHelpers.mapViolationToEventType(violation);
    const severity = this.mapViolationSeverityToAuditSeverity(violation.severity);

    const entry = this.createEvent()
      .setEventType(eventType)
      .setSeverity(severity)
      .setMessage(`Security violation detected: ${violation.type}`)
      .setDescription(violation.description)
      .setOutcome('failure')
      .setSecurityClassification(SecurityClassification.CONFIDENTIAL)
      .addSecurityViolation(violation)
      .setThreatLevel(this.mapSeverityToThreatLevel(violation.severity))
      .setSource('security-violation-detector')
      .addTag('security')
      .addTag('violation')
      .addComplianceFlag('security-monitoring');

    if (context?.userContext) {
      entry.setUserContext(context.userContext);
    }

    if (context?.systemContext) {
      entry.setSystemContext(context.systemContext);
    }

    await this.recordEvent(entry.build());
  }

  /**
   * Convenience method to record a structured log event
   */
  async recordStructuredLogEvent(
    logEntry: StructuredLogEntry,
    context?: {
      userContext?: AuditUserContext;
      systemContext?: AuditSystemContext;
    }
  ): Promise<void> {
    const severity = AuditHelpers.mapLogLevelToAuditSeverity(logEntry.level);
    const eventType = this.determineEventTypeFromLogEntry(logEntry);

    const entry = this.createEvent()
      .setEventType(eventType)
      .setSeverity(severity)
      .setMessage(logEntry.message)
      .setOutcome(logEntry.error ? 'failure' : 'success')
      .setSecurityClassification(logEntry.classification)
      .setRawLogEntry(logEntry)
      .setSource('structured-logger');

    if (logEntry.component) {
      entry.setComponent(logEntry.component);
    }

    if (logEntry.operation) {
      entry.setOperation(logEntry.operation);
    }

    if (logEntry.traceId) {
      entry.setTraceId(logEntry.traceId);
    }

    if (logEntry.correlationId) {
      entry.setCorrelationId(logEntry.correlationId);
    }

    if (logEntry.auditEvent) {
      entry.addTag('audit-event');
    }

    if (logEntry.securityAnalysis) {
      entry.setSecurityAnalysis(logEntry.securityAnalysis);
    }

    if (context?.userContext) {
      entry.setUserContext(context.userContext);
    }

    if (context?.systemContext) {
      entry.setSystemContext(context.systemContext);
    }

    await this.recordEvent(entry.build());
  }

  /**
   * Convenience method to record CLI command execution
   */
  async recordCommandExecution(
    command: string,
    args: string[],
    outcome: 'success' | 'failure',
    context?: {
      userContext?: AuditUserContext;
      duration?: number;
      exitCode?: number;
      error?: Error;
    }
  ): Promise<void> {
    const severity = outcome === 'failure' ? AuditSeverity.MEDIUM : AuditSeverity.LOW;
    const eventType =
      outcome === 'failure' ? AuditEventType.COMMAND_FAILURE : AuditEventType.COMMAND_EXECUTION;

    const entry = this.createEvent()
      .setEventType(eventType)
      .setSeverity(severity)
      .setMessage(`Command execution: ${command} ${args.join(' ')}`)
      .setOutcome(outcome)
      .setSecurityClassification(SecurityClassification.INTERNAL)
      .setSource('cli-command')
      .setComponent('command-executor')
      .setOperation(command)
      .addTag('cli')
      .addTag('command');

    if (context?.userContext) {
      entry.setUserContext(context.userContext);
    }

    if (context?.duration !== undefined) {
      entry.setDescription(`Command completed in ${context.duration}ms`);
    }

    if (context?.exitCode !== undefined) {
      entry.addTag(`exit-code-${context.exitCode}`);
    }

    await this.recordEvent(entry.build());
  }

  private shouldRecordEvent(entry: AuditEntry): boolean {
    // Check event type filter
    if (!this.config.enabledEventTypes.includes(entry.eventType)) {
      return false;
    }

    // Check severity filter
    const severityLevels = [
      AuditSeverity.INFORMATIONAL,
      AuditSeverity.LOW,
      AuditSeverity.MEDIUM,
      AuditSeverity.HIGH,
      AuditSeverity.CRITICAL,
    ];

    const entrySeverityIndex = severityLevels.indexOf(entry.severity);
    const minimumSeverityIndex = severityLevels.indexOf(this.config.minimumSeverity);

    return entrySeverityIndex >= minimumSeverityIndex;
  }

  private async enrichEntry(entry: AuditEntry): Promise<void> {
    // Add system context if enabled and not already present
    if (this.config.includeSystemContext && !entry.systemContext) {
      entry.systemContext = AuditHelpers.sanitizeEnvironmentData();
    }

    // Set retention policy if not specified
    if (!entry.retentionPolicy) {
      entry.retentionPolicy = `${this.config.defaultRetentionDays}d`;
      entry.retentionUntil = AuditHelpers.calculateRetentionExpiration(
        this.config.defaultRetentionDays
      );
    }

    // Add compliance flags based on configuration
    if (this.config.complianceMode && this.config.complianceFrameworks.length > 0) {
      entry.complianceFlags = entry.complianceFlags || [];
      // Limit compliance flags to prevent array overflow
      const remainingSlots = AUDIT_SECURITY_LIMITS.MAX_ARRAY_SIZE - entry.complianceFlags.length;
      const flagsToAdd = this.config.complianceFrameworks
        .slice(0, remainingSlots)
        .map((f) => f.toLowerCase());
      entry.complianceFlags.push(...flagsToAdd);
    }
  }

  private setupAutoFlush(): void {
    if (this.isShuttingDown) {
      return;
    }

    const timer = setInterval(async () => {
      if (this.isShuttingDown) {
        clearInterval(timer);
        this.activeTimers.delete(timer);
        return;
      }

      try {
        await this.flush();
      } catch (error) {
        // Log error but don't throw to avoid crashing the timer
        console.error('[AUDIT TRAIL] Auto-flush failed:', this.sanitizeError(error));
      }
    }, this.config.flushInterval);

    this.activeTimers.add(timer);
  }

  private mapViolationSeverityToAuditSeverity(severity: string): AuditSeverity {
    switch (severity.toLowerCase()) {
      case 'critical':
        return AuditSeverity.CRITICAL;
      case 'high':
        return AuditSeverity.HIGH;
      case 'medium':
        return AuditSeverity.MEDIUM;
      case 'low':
        return AuditSeverity.LOW;
      default:
        return AuditSeverity.INFORMATIONAL;
    }
  }

  private mapSeverityToThreatLevel(
    severity: string
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'none';
    }
  }

  private determineEventTypeFromLogEntry(logEntry: StructuredLogEntry): AuditEventType {
    // Determine event type based on log entry characteristics
    if (logEntry.error) {
      return AuditEventType.SYSTEM_ERROR;
    }

    if (logEntry.auditEvent) {
      return AuditEventType.ADMIN_ACTION;
    }

    if (logEntry.securityFlags?.includes('violations_detected')) {
      return AuditEventType.SECURITY_VIOLATION;
    }

    if (logEntry.component === 'cli' || logEntry.operation?.includes('command')) {
      return AuditEventType.COMMAND_EXECUTION;
    }

    return AuditEventType.SYSTEM_START;
  }
}

/**
 * Default audit trail manager instance
 */
export const defaultAuditTrailManager = new AuditTrailManager();

// Initialize on import
defaultAuditTrailManager.init().catch((error) => {
  console.error('Failed to initialize default audit trail manager:', error);
});

/**
 * Convenience functions for common audit operations
 */
export const auditTrail = {
  /**
   * Initialize the default audit trail manager
   */
  init: () => defaultAuditTrailManager.init(),

  /**
   * Record a security violation
   */
  recordSecurityViolation: (
    violation: EnhancedSecurityViolation,
    context?: {
      userContext?: AuditUserContext;
      systemContext?: AuditSystemContext;
      additionalInfo?: Record<string, unknown>;
    }
  ) => defaultAuditTrailManager.recordSecurityViolation(violation, context),

  /**
   * Record a command execution
   */
  recordCommand: (
    command: string,
    args: string[],
    outcome: 'success' | 'failure',
    context?: {
      userContext?: AuditUserContext;
      duration?: number;
      exitCode?: number;
      error?: Error;
    }
  ) => defaultAuditTrailManager.recordCommandExecution(command, args, outcome, context),

  /**
   * Create an audit event
   */
  createEvent: () => defaultAuditTrailManager.createEvent(),

  /**
   * Record an audit event
   */
  record: (entry: AuditEntry) => defaultAuditTrailManager.recordEvent(entry),

  /**
   * Query audit entries
   */
  query: (filter?: AuditQueryFilter) => defaultAuditTrailManager.queryEntries(filter),

  /**
   * Verify integrity
   */
  verifyIntegrity: () => defaultAuditTrailManager.verifyIntegrity(),

  /**
   * Export audit trail
   */
  export: (options: AuditExportOptions) => defaultAuditTrailManager.export(options),
};
