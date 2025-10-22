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

import { 
  StructuredLogEntry, 
  StructuredLogLevel, 
  SecurityClassification
} from './structured-logging.js';
import { 
  type LogSecurityAnalysis 
} from './log-security.js';
import { 
  type EnhancedSecurityViolation, 
  type ViolationAnalysisResult 
} from './violation-detector-exports.js';
import { createHash, randomBytes } from 'crypto';

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
  CLI_SHUTDOWN = 'cli_shutdown'
}

/**
 * Severity levels for audit events
 */
export enum AuditSeverity {
  INFORMATIONAL = 'informational',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Audit trail integrity status
 */
export enum IntegrityStatus {
  VERIFIED = 'verified',
  CORRUPTED = 'corrupted',
  TAMPERED = 'tampered',
  MISSING = 'missing',
  UNKNOWN = 'unknown'
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
  beforeValue?: unknown;
  afterValue?: unknown;
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
 * Default audit trail configuration
 */
export const DEFAULT_AUDIT_TRAIL_CONFIG: AuditTrailConfig = {
  enabled: true,
  trailName: 'default-audit-trail',
  description: 'Default audit trail for security events',
  
  storageBackend: 'memory',
  maxEntries: 10000,
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
  
  enableIntegrityProtection: true,
  enableEncryption: false,
  enableTamperDetection: true,
  checksumAlgorithm: 'sha256',
  
  batchSize: 100,
  flushInterval: 5000, // 5 seconds
  compressionEnabled: false,
  asyncProcessing: true,
  
  defaultRetentionDays: 365,
  autoRotate: true,
  rotationSize: 10 * 1024 * 1024, // 10MB
  maxRotationFiles: 10,
  
  enabledEventTypes: Object.values(AuditEventType),
  minimumSeverity: AuditSeverity.INFORMATIONAL,
  includeUserContext: true,
  includeSystemContext: true,
  includeResourceContext: true,
  
  integrationWithStructuredLogging: true,
  integrationWithViolationDetection: true,
  forwardToSecurityMonitoring: false,
  
  complianceMode: false,
  complianceFrameworks: [],
  requireDigitalSignatures: false,
  nonRepudiationEnabled: false,
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
 * Helper functions for generating audit-related values
 */
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
   * Generate a checksum for an audit entry
   */
  static generateChecksum(entry: AuditEntry, algorithm: 'sha256' | 'sha512' | 'blake2b' = 'sha256'): string {
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
    
    const dataString = JSON.stringify(entryData, Object.keys(entryData).sort());
    return createHash(algorithm).update(dataString).digest('hex');
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
    } else if (violationType.includes('injection') || violationType.includes('xss') || violationType.includes('sql')) {
      return AuditEventType.ATTACK_DETECTED;
    } else if (violationType.includes('malicious') || violationType.includes('dangerous')) {
      return AuditEventType.MALICIOUS_INPUT;
    } else if (violationType.includes('access') || violationType.includes('permission')) {
      return AuditEventType.PERMISSION_DENIED;
    } else {
      return AuditEventType.SECURITY_VIOLATION;
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
    this.entry.message = message;
    return this;
  }
  
  setDescription(description: string): AuditEventBuilder {
    this.entry.description = description;
    return this;
  }
  
  setOutcome(outcome: 'success' | 'failure' | 'partial' | 'unknown'): AuditEventBuilder {
    this.entry.outcome = outcome;
    return this;
  }
  
  setUserContext(context: AuditUserContext): AuditEventBuilder {
    this.entry.userContext = context;
    return this;
  }
  
  setSystemContext(context: AuditSystemContext): AuditEventBuilder {
    this.entry.systemContext = context;
    return this;
  }
  
  setResourceContext(context: AuditResourceContext): AuditEventBuilder {
    this.entry.resourceContext = context;
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
    this.entry.relatedEventIds.push(eventId);
    return this;
  }
  
  addTag(tag: string): AuditEventBuilder {
    if (!this.entry.tags) {
      this.entry.tags = [];
    }
    this.entry.tags.push(tag);
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
    this.entry.complianceFlags.push(flag);
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
    
    return this.entry as AuditEntry;
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
 * In-memory storage backend for audit trails
 */
export class MemoryAuditStorage implements AuditStorageBackend {
  private entries: Map<string, AuditEntry> = new Map();
  private metadata: AuditTrailMetadata;
  
  constructor(private config: AuditTrailConfig) {
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
    // Clear memory to free resources
    this.entries.clear();
  }
  
  async addEntry(entry: AuditEntry): Promise<void> {
    // Add integrity protection
    if (this.config.enableIntegrityProtection) {
      // Link to previous entry for hash chain
      const lastEntry = Array.from(this.entries.values()).pop();
      if (lastEntry) {
        entry.previousEntryHash = lastEntry.checksum;
      }
      
      // Generate checksum after setting previousEntryHash
      entry.checksum = AuditHelpers.generateChecksum(entry, this.config.checksumAlgorithm);
    }
    
    this.entries.set(entry.id, entry);
    
    // Update metadata
    this.metadata.totalEntries = this.entries.size;
    this.metadata.sizeBytes += JSON.stringify(entry).length;
    this.metadata.modifiedAt = AuditHelpers.createTimestamp();
    
    if (!this.metadata.oldestEntry || entry.timestamp < this.metadata.oldestEntry) {
      this.metadata.oldestEntry = entry.timestamp;
    }
    if (!this.metadata.newestEntry || entry.timestamp > this.metadata.newestEntry) {
      this.metadata.newestEntry = entry.timestamp;
    }
    
    // Check size limits
    if (this.config.maxEntries && this.entries.size > this.config.maxEntries) {
      await this.removeOldestEntries(this.entries.size - this.config.maxEntries);
    }
    
    if (this.config.maxSizeBytes && this.metadata.sizeBytes > this.config.maxSizeBytes) {
      await this.removeLargestEntries();
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
      filteredEntries = filteredEntries.filter(e => e.timestamp >= filter.startTime!);
    }
    if (filter.endTime) {
      filteredEntries = filteredEntries.filter(e => e.timestamp <= filter.endTime!);
    }
    if (filter.eventTypes?.length) {
      filteredEntries = filteredEntries.filter(e => filter.eventTypes!.includes(e.eventType));
    }
    if (filter.severities?.length) {
      filteredEntries = filteredEntries.filter(e => filter.severities!.includes(e.severity));
    }
    if (filter.outcomes?.length) {
      filteredEntries = filteredEntries.filter(e => filter.outcomes!.includes(e.outcome));
    }
    if (filter.userIds?.length) {
      filteredEntries = filteredEntries.filter(e => 
        e.userContext?.userId && filter.userIds!.includes(e.userContext.userId)
      );
    }
    if (filter.messageContains) {
      const searchTerm = filter.messageContains.toLowerCase();
      filteredEntries = filteredEntries.filter(e => 
        e.message.toLowerCase().includes(searchTerm) ||
        e.description?.toLowerCase().includes(searchTerm)
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
    const allEntries = Array.from(this.entries.values())
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    const dataString = JSON.stringify(allEntries.map(e => e.checksum || e.id));
    return createHash(this.config.checksumAlgorithm).update(dataString).digest('hex');
  }
  
  async verifyIntegrity(): Promise<IntegrityVerificationResult> {
    const startTime = Date.now();
    const allEntries = Array.from(this.entries.values())
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    const corruptedEntries: AuditEntry[] = [];
    const errors: string[] = [];
    let verifiedCount = 0;
    
    for (let i = 0; i < allEntries.length; i++) {
      const entry = allEntries[i];
      
      // Verify entry checksum
      if (entry.checksum) {
        const expectedChecksum = AuditHelpers.generateChecksum(entry, this.config.checksumAlgorithm);
        if (entry.checksum !== expectedChecksum) {
          corruptedEntries.push(entry);
          errors.push(`Entry ${entry.id} has invalid checksum`);
          continue;
        }
      }
      
      // Verify hash chain
      if (i > 0 && entry.previousEntryHash) {
        const previousEntry = allEntries[i - 1];
        if (entry.previousEntryHash !== previousEntry.checksum) {
          corruptedEntries.push(entry);
          errors.push(`Entry ${entry.id} has broken hash chain`);
          continue;
        }
      }
      
      verifiedCount++;
    }
    
    const status = corruptedEntries.length > 0 ? IntegrityStatus.CORRUPTED : IntegrityStatus.VERIFIED;
    
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
    const entriesToRemove = allEntries.filter(e => e.timestamp < cutoffTime);
    
    for (const entry of entriesToRemove) {
      this.entries.delete(entry.id);
    }
    
    // Update metadata
    this.metadata.totalEntries = this.entries.size;
    this.metadata.sizeBytes = Array.from(this.entries.values())
      .reduce((size, entry) => size + JSON.stringify(entry).length, 0);
    this.metadata.modifiedAt = AuditHelpers.createTimestamp();
    
    return entriesToRemove.length;
  }
  
  async export(options: AuditExportOptions): Promise<Buffer> {
    const filter = options.filter || {};
    const result = await this.getEntries(filter);
    
    let content: string;
    
    switch (options.format) {
      case 'json':
        const exportData = {
          metadata: options.includeMetadata ? this.metadata : undefined,
          entries: result.entries,
          integrityData: options.includeIntegrityData ? {
            checksum: await this.calculateChecksum(),
            verificationResult: await this.verifyIntegrity(),
          } : undefined,
        };
        content = JSON.stringify(exportData, null, 2);
        break;
        
      case 'csv':
        const headers = ['id', 'timestamp', 'eventType', 'severity', 'message', 'outcome'];
        const rows = result.entries.map(entry => [
          entry.id,
          entry.timestamp,
          entry.eventType,
          entry.severity,
          entry.message,
          entry.outcome
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        break;
        
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
    
    return Buffer.from(content, 'utf-8');
  }
  
  private async removeOldestEntries(count: number): Promise<void> {
    const allEntries = Array.from(this.entries.values())
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    for (let i = 0; i < count && i < allEntries.length; i++) {
      this.entries.delete(allEntries[i].id);
    }
    
    // Recalculate metadata
    this.metadata.totalEntries = this.entries.size;
    this.metadata.sizeBytes = Array.from(this.entries.values())
      .reduce((size, entry) => size + JSON.stringify(entry).length, 0);
  }
  
  private async removeLargestEntries(): Promise<void> {
    // Remove entries until under size limit
    const allEntries = Array.from(this.entries.values())
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    while (this.metadata.sizeBytes > this.config.maxSizeBytes! && allEntries.length > 0) {
      const entryToRemove = allEntries.shift()!;
      this.entries.delete(entryToRemove.id);
      this.metadata.sizeBytes -= JSON.stringify(entryToRemove).length;
    }
  }
}

/**
 * Main audit trail manager with comprehensive security features
 */
export class AuditTrailManager {
  private storage: AuditStorageBackend;
  private config: AuditTrailConfig;
  private batchBuffer: AuditEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private processingQueue: Promise<void> = Promise.resolve();
  
  constructor(config: Partial<AuditTrailConfig> = {}) {
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
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush any pending entries
    await this.flush();
    await this.storage.close();
  }
  
  /**
   * Create a new audit event builder
   */
  createEvent(): AuditEventBuilder {
    return new AuditEventBuilderImpl();
  }
  
  /**
   * Record an audit event
   */
  async recordEvent(entry: AuditEntry): Promise<void> {
    if (!this.config.enabled) {
      return;
    }
    
    // Apply filters
    if (!this.shouldRecordEvent(entry)) {
      return;
    }
    
    // Enrich entry with system context
    await this.enrichEntry(entry);
    
    if (this.config.asyncProcessing) {
      // Add to batch buffer
      this.batchBuffer.push(entry);
      
      if (this.batchBuffer.length >= this.config.batchSize) {
        await this.flush();
      }
    } else {
      // Process immediately
      this.processingQueue = this.processingQueue.then(async () => {
        await this.storage.addEntry(entry);
      });
      await this.processingQueue;
    }
  }
  
  /**
   * Record multiple audit events
   */
  async recordEvents(entries: AuditEntry[]): Promise<void> {
    if (!this.config.enabled) {
      return;
    }
    
    const filteredEntries = entries.filter(entry => this.shouldRecordEvent(entry));
    
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
   * Flush pending entries to storage
   */
  async flush(): Promise<void> {
    if (this.batchBuffer.length === 0) {
      return;
    }
    
    const entries = [...this.batchBuffer];
    this.batchBuffer = [];
    
    this.processingQueue = this.processingQueue.then(async () => {
      await this.storage.addEntries(entries);
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
   * Update configuration
   */
  updateConfig(updates: Partial<AuditTrailConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart auto-flush if needed
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (this.config.asyncProcessing && this.config.flushInterval > 0) {
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
    const eventType = outcome === 'failure' ? AuditEventType.COMMAND_FAILURE : AuditEventType.COMMAND_EXECUTION;
    
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
      AuditSeverity.CRITICAL
    ];
    
    const entrySeverityIndex = severityLevels.indexOf(entry.severity);
    const minimumSeverityIndex = severityLevels.indexOf(this.config.minimumSeverity);
    
    return entrySeverityIndex >= minimumSeverityIndex;
  }
  
  private async enrichEntry(entry: AuditEntry): Promise<void> {
    // Add system context if enabled and not already present
    if (this.config.includeSystemContext && !entry.systemContext) {
      entry.systemContext = {
        hostname: process.env.HOSTNAME || 'unknown',
        processId: process.pid,
        parentProcessId: process.ppid,
        workingDirectory: process.cwd(),
        environmentType: this.determineEnvironmentType(),
        version: process.version,
      };
    }
    
    // Set retention policy if not specified
    if (!entry.retentionPolicy) {
      entry.retentionPolicy = `${this.config.defaultRetentionDays}d`;
      entry.retentionUntil = AuditHelpers.calculateRetentionExpiration(this.config.defaultRetentionDays);
    }
    
    // Add compliance flags based on configuration
    if (this.config.complianceMode && this.config.complianceFrameworks.length > 0) {
      entry.complianceFlags = entry.complianceFlags || [];
      entry.complianceFlags.push(...this.config.complianceFrameworks.map(f => f.toLowerCase()));
    }
  }
  
  private setupAutoFlush(): void {
    this.flushTimer = setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        // Log error but don't throw to avoid crashing the timer
        console.error('Failed to auto-flush audit trail:', error);
      }
    }, this.config.flushInterval);
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
  
  private mapSeverityToThreatLevel(severity: string): 'none' | 'low' | 'medium' | 'high' | 'critical' {
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
  
  private determineEnvironmentType(): 'development' | 'staging' | 'production' {
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
 * Default audit trail manager instance
 */
export const defaultAuditTrailManager = new AuditTrailManager();

// Initialize on import
defaultAuditTrailManager.init().catch(error => {
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
  recordSecurityViolation: (violation: EnhancedSecurityViolation, context?: any) =>
    defaultAuditTrailManager.recordSecurityViolation(violation, context),
  
  /**
   * Record a command execution
   */
  recordCommand: (command: string, args: string[], outcome: 'success' | 'failure', context?: any) =>
    defaultAuditTrailManager.recordCommandExecution(command, args, outcome, context),
  
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