/**
 * Task 1.4.3 Tests: Audit Trail Integration - Comprehensive Test Suite
 *
 * Tests all aspects of the audit trail system including:
 * - Basic audit entry creation and validation
 * - Security event tracking and classification
 * - Integrity protection and tamper detection
 * - Storage backend functionality and security
 * - Query and filtering capabilities
 * - Export and import functionality
 * - Integration with existing security frameworks
 * - Performance optimization and batch processing
 * - Compliance features and regulatory support
 * - Edge cases and attack vector protection
 *
 * @security Validates comprehensive audit trail security features
 * @performance Tests memory limits, processing bounds, and batch operations
 * @architecture Tests clean integration with structured logging and violation detection
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type AuditEntry,
  AuditEventBuilderImpl,
  AuditEventType,
  AuditHelpers,
  AuditSeverity,
  type AuditTrailConfig,
  AuditTrailManager,
  type AuditUserContext,
  DEFAULT_AUDIT_TRAIL_CONFIG,
  IntegrityStatus,
  MemoryAuditStorage,
} from '../../../core/foundation/logging/audit.js';
import {
  SecurityClassification,
  type StructuredLogEntry,
  StructuredLogLevel,
} from '../../../core/foundation/logging/structured.js';
import type { EnhancedSecurityViolation } from '../../../core/foundation/security/violation-detector.js';

describe('Task 1.4.3: Audit Trail Integration', () => {
  let auditManager: AuditTrailManager;
  let testConfig: AuditTrailConfig;

  beforeEach(() => {
    testConfig = {
      ...DEFAULT_AUDIT_TRAIL_CONFIG,
      trailName: 'test-audit-trail',
      description: 'Test audit trail',
      batchSize: 5,
      flushInterval: 100,
      asyncProcessing: false, // Use synchronous for tests
    };
    auditManager = new AuditTrailManager(testConfig);
  });

  afterEach(async () => {
    await auditManager.close();
  });

  describe('AuditHelpers Utility Functions', () => {
    it('should generate unique audit IDs', () => {
      const id1 = AuditHelpers.generateAuditId();
      const id2 = AuditHelpers.generateAuditId();

      expect(id1).toMatch(/^audit_[a-z0-9]+_[a-f0-9]{16}$/);
      expect(id2).toMatch(/^audit_[a-z0-9]+_[a-f0-9]{16}$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate consistent checksums for same data', () => {
      const entry: AuditEntry = {
        id: 'test-id',
        timestamp: '2025-01-01T00:00:00.000Z',
        eventType: AuditEventType.SECURITY_VIOLATION,
        severity: AuditSeverity.HIGH,
        message: 'Test message',
        outcome: 'failure',
        securityClassification: SecurityClassification.CONFIDENTIAL,
      };

      const checksum1 = AuditHelpers.generateChecksum(entry);
      const checksum2 = AuditHelpers.generateChecksum(entry);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should generate different checksums for different data', () => {
      const entry1: AuditEntry = {
        id: 'test-id-1',
        timestamp: '2025-01-01T00:00:00.000Z',
        eventType: AuditEventType.SECURITY_VIOLATION,
        severity: AuditSeverity.HIGH,
        message: 'Test message 1',
        outcome: 'failure',
        securityClassification: SecurityClassification.CONFIDENTIAL,
      };

      const entry2: AuditEntry = {
        ...entry1,
        message: 'Test message 2',
      };

      const checksum1 = AuditHelpers.generateChecksum(entry1);
      const checksum2 = AuditHelpers.generateChecksum(entry2);

      expect(checksum1).not.toBe(checksum2);
    });

    it('should create valid ISO timestamps', () => {
      const timestamp = AuditHelpers.createTimestamp();

      expect(() => new Date(timestamp)).not.toThrow();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should calculate retention expiration correctly', () => {
      const days = 30;
      const expiration = AuditHelpers.calculateRetentionExpiration(days);
      const expirationDate = new Date(expiration);
      const now = new Date();

      const diffDays = Math.round(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(days);
    });

    it('should map log levels to audit severities correctly', () => {
      expect(AuditHelpers.mapLogLevelToAuditSeverity(StructuredLogLevel.TRACE)).toBe(
        AuditSeverity.INFORMATIONAL
      );
      expect(AuditHelpers.mapLogLevelToAuditSeverity(StructuredLogLevel.DEBUG)).toBe(
        AuditSeverity.INFORMATIONAL
      );
      expect(AuditHelpers.mapLogLevelToAuditSeverity(StructuredLogLevel.INFO)).toBe(
        AuditSeverity.LOW
      );
      expect(AuditHelpers.mapLogLevelToAuditSeverity(StructuredLogLevel.WARN)).toBe(
        AuditSeverity.MEDIUM
      );
      expect(AuditHelpers.mapLogLevelToAuditSeverity(StructuredLogLevel.ERROR)).toBe(
        AuditSeverity.HIGH
      );
      expect(AuditHelpers.mapLogLevelToAuditSeverity(StructuredLogLevel.FATAL)).toBe(
        AuditSeverity.CRITICAL
      );
    });

    it('should map security violations to event types correctly', () => {
      const authViolation: EnhancedSecurityViolation = {
        id: 'test',
        type: 'auth_failure',
        pattern: 'failed-login',
        severity: 'high',
        description: 'Authentication failed',
        recommendation: 'Block further attempts',
        timestamp: new Date(),
        context: {
          inputType: 'command-arg',
          environment: 'test',
        },
        compliance: {
          owasp: ['A07'],
          cwe: [287],
          nist: ['PR.AC-1'],
          mitre: ['T1110'],
          iso27001: ['A.9.1.1'],
        },
        riskFactors: [
          {
            type: 'behavioral',
            name: 'failed-attempts',
            impact: 80,
            description: 'Multiple failed authentication attempts',
          },
        ],
        remediation: [
          {
            type: 'blocking',
            priority: 'high',
            autoFixAvailable: true,
            description: 'Block further authentication attempts',
          },
        ],
        correlationId: 'test',
      };

      expect(AuditHelpers.mapViolationToEventType(authViolation)).toBe(AuditEventType.AUTH_FAILURE);

      const injectionViolation: EnhancedSecurityViolation = {
        ...authViolation,
        type: 'sql_injection',
        context: {
          inputType: 'command-arg',
          environment: 'test',
        },
      };

      expect(AuditHelpers.mapViolationToEventType(injectionViolation)).toBe(
        AuditEventType.ATTACK_DETECTED
      );
    });
  });

  describe('AuditEventBuilder', () => {
    let builder: AuditEventBuilderImpl;

    beforeEach(() => {
      builder = new AuditEventBuilderImpl();
    });

    it('should build complete audit entry with fluent API', () => {
      const userContext: AuditUserContext = {
        userId: 'user123',
        username: 'testuser',
        roles: ['admin'],
        sessionId: 'session123',
      };

      const entry = builder
        .setEventType(AuditEventType.AUTH_SUCCESS)
        .setSeverity(AuditSeverity.LOW)
        .setMessage('User authentication successful')
        .setDescription('User logged in successfully')
        .setOutcome('success')
        .setUserContext(userContext)
        .setSecurityClassification(SecurityClassification.INTERNAL)
        .setTraceId('trace123')
        .setCorrelationId('correlation123')
        .addTag('authentication')
        .addTag('success')
        .setCategory('security')
        .setSource('auth-system')
        .setComponent('login-handler')
        .setOperation('authenticate')
        .addComplianceFlag('audit-required')
        .setRetentionPolicy('90d')
        .build();

      expect(entry.eventType).toBe(AuditEventType.AUTH_SUCCESS);
      expect(entry.severity).toBe(AuditSeverity.LOW);
      expect(entry.message).toBe('User authentication successful');
      expect(entry.description).toBe('User logged in successfully');
      expect(entry.outcome).toBe('success');
      expect(entry.userContext).toEqual(userContext);
      expect(entry.securityClassification).toBe(SecurityClassification.INTERNAL);
      expect(entry.traceId).toBe('trace123');
      expect(entry.correlationId).toBe('correlation123');
      expect(entry.tags).toContain('authentication');
      expect(entry.tags).toContain('success');
      expect(entry.category).toBe('security');
      expect(entry.source).toBe('auth-system');
      expect(entry.component).toBe('login-handler');
      expect(entry.operation).toBe('authenticate');
      expect(entry.complianceFlags).toContain('audit-required');
      expect(entry.retentionPolicy).toBe('90d');
      expect(entry.retentionUntil).toBeDefined();
    });

    it('should validate required fields when building', () => {
      expect(() => builder.build()).toThrow('Event type is required');

      builder.setEventType(AuditEventType.AUTH_SUCCESS);
      expect(() => builder.build()).toThrow('Severity is required');

      builder.setSeverity(AuditSeverity.LOW);
      expect(() => builder.build()).toThrow('Message is required');

      builder.setMessage('Test message');
      expect(() => builder.build()).toThrow('Outcome is required');

      builder.setOutcome('success');
      expect(() => builder.build()).not.toThrow();
    });

    it('should initialize with default values', () => {
      const entry = builder
        .setEventType(AuditEventType.SYSTEM_START)
        .setSeverity(AuditSeverity.INFORMATIONAL)
        .setMessage('Test')
        .setOutcome('success')
        .build();

      expect(entry.id).toMatch(/^audit_/);
      expect(entry.timestamp).toBeDefined();
      expect(entry.securityClassification).toBe(SecurityClassification.INTERNAL);
      expect(entry.tags).toEqual([]);
      expect(entry.relatedEventIds).toEqual([]);
      expect(entry.complianceFlags).toEqual([]);
    });

    it('should handle security violations correctly', () => {
      const violation: EnhancedSecurityViolation = {
        id: 'violation123',
        type: 'xss_attempt',
        pattern: 'script-injection',
        severity: 'high',
        description: 'Cross-site scripting attempt detected',
        recommendation: 'Sanitize HTML input',
        timestamp: new Date(),
        context: {
          inputType: 'command-arg',
          environment: 'test',
        },
        compliance: {
          owasp: ['A03'],
          cwe: [79],
          nist: ['PR.DS-5'],
          mitre: ['T1059'],
          iso27001: ['A.12.6.1'],
        },
        riskFactors: [
          {
            type: 'technical',
            name: 'script-injection',
            impact: 85,
            description: 'Script injection attempt detected',
          },
        ],
        remediation: [
          {
            type: 'sanitization',
            priority: 'high',
            autoFixAvailable: true,
            description: 'Sanitize HTML input and escape special characters',
          },
        ],
        correlationId: 'xss-attack-123',
      };

      const entry = builder
        .setEventType(AuditEventType.ATTACK_DETECTED)
        .setSeverity(AuditSeverity.HIGH)
        .setMessage('XSS attack detected')
        .setOutcome('failure')
        .addSecurityViolation(violation)
        .setThreatLevel('high')
        .build();

      expect(entry.securityViolations).toHaveLength(1);
      expect(entry.securityViolations?.[0]).toEqual(violation);
      expect(entry.threatLevel).toBe('high');
    });
  });

  describe('MemoryAuditStorage', () => {
    let storage: MemoryAuditStorage;

    beforeEach(async () => {
      storage = new MemoryAuditStorage(testConfig);
      await storage.init();
    });

    afterEach(async () => {
      await storage.close();
    });

    it('should initialize with empty state', async () => {
      const metadata = await storage.getMetadata();

      expect(metadata.totalEntries).toBe(0);
      expect(metadata.sizeBytes).toBe(0);
      expect(metadata.integrityStatus).toBe(IntegrityStatus.VERIFIED);
      expect(metadata.name).toBe(testConfig.trailName);
    });

    it('should add entries and update metadata', async () => {
      const entry: AuditEntry = {
        id: 'test1',
        timestamp: AuditHelpers.createTimestamp(),
        eventType: AuditEventType.AUTH_SUCCESS,
        severity: AuditSeverity.LOW,
        message: 'Test entry',
        outcome: 'success',
        securityClassification: SecurityClassification.INTERNAL,
      };

      await storage.addEntry(entry);

      const metadata = await storage.getMetadata();
      expect(metadata.totalEntries).toBe(1);
      expect(metadata.sizeBytes).toBeGreaterThan(0);
      expect(metadata.oldestEntry).toBe(entry.timestamp);
      expect(metadata.newestEntry).toBe(entry.timestamp);
    });

    it('should retrieve entries by ID', async () => {
      const entry: AuditEntry = {
        id: 'test1',
        timestamp: AuditHelpers.createTimestamp(),
        eventType: AuditEventType.AUTH_SUCCESS,
        severity: AuditSeverity.LOW,
        message: 'Test entry',
        outcome: 'success',
        securityClassification: SecurityClassification.INTERNAL,
      };

      await storage.addEntry(entry);

      const retrieved = await storage.getEntry('test1');
      expect(retrieved).toEqual(
        expect.objectContaining({
          id: 'test1',
          message: 'Test entry',
        })
      );

      const notFound = await storage.getEntry('nonexistent');
      expect(notFound).toBeNull();
    });

    it('should filter entries by various criteria', async () => {
      const entries: AuditEntry[] = [
        {
          id: 'entry1',
          timestamp: '2025-01-01T10:00:00.000Z',
          eventType: AuditEventType.AUTH_SUCCESS,
          severity: AuditSeverity.LOW,
          message: 'Login success',
          outcome: 'success',
          securityClassification: SecurityClassification.INTERNAL,
          userContext: { userId: 'user1' },
        },
        {
          id: 'entry2',
          timestamp: '2025-01-01T11:00:00.000Z',
          eventType: AuditEventType.AUTH_FAILURE,
          severity: AuditSeverity.MEDIUM,
          message: 'Login failed',
          outcome: 'failure',
          securityClassification: SecurityClassification.INTERNAL,
          userContext: { userId: 'user2' },
        },
        {
          id: 'entry3',
          timestamp: '2025-01-01T12:00:00.000Z',
          eventType: AuditEventType.SECURITY_VIOLATION,
          severity: AuditSeverity.HIGH,
          message: 'Security violation detected',
          outcome: 'failure',
          securityClassification: SecurityClassification.CONFIDENTIAL,
        },
      ];

      await storage.addEntries(entries);

      // Filter by event type
      const authEvents = await storage.getEntries({
        eventTypes: [AuditEventType.AUTH_SUCCESS, AuditEventType.AUTH_FAILURE],
      });
      expect(authEvents.entries).toHaveLength(2);

      // Filter by severity
      const highSeverityEvents = await storage.getEntries({
        severities: [AuditSeverity.HIGH],
      });
      expect(highSeverityEvents.entries).toHaveLength(1);
      expect(highSeverityEvents.entries[0].severity).toBe(AuditSeverity.HIGH);

      // Filter by outcome
      const failureEvents = await storage.getEntries({
        outcomes: ['failure'],
      });
      expect(failureEvents.entries).toHaveLength(2);

      // Filter by user ID
      const user1Events = await storage.getEntries({
        userIds: ['user1'],
      });
      expect(user1Events.entries).toHaveLength(1);
      expect(user1Events.entries[0].userContext?.userId).toBe('user1');

      // Text search
      const loginEvents = await storage.getEntries({
        messageContains: 'login',
      });
      expect(loginEvents.entries).toHaveLength(2);

      // Time range filter
      const morningEvents = await storage.getEntries({
        startTime: '2025-01-01T10:30:00.000Z',
        endTime: '2025-01-01T11:30:00.000Z',
      });
      expect(morningEvents.entries).toHaveLength(1);
      expect(morningEvents.entries[0].id).toBe('entry2');
    });

    it('should handle pagination correctly', async () => {
      const entries: AuditEntry[] = [];
      for (let i = 1; i <= 10; i++) {
        entries.push({
          id: `entry${i}`,
          timestamp: AuditHelpers.createTimestamp(),
          eventType: AuditEventType.SYSTEM_START,
          severity: AuditSeverity.INFORMATIONAL,
          message: `Entry ${i}`,
          outcome: 'success',
          securityClassification: SecurityClassification.INTERNAL,
        });
      }

      await storage.addEntries(entries);

      // First page
      const firstPage = await storage.getEntries({
        limit: 3,
        offset: 0,
        sortBy: 'id',
        sortOrder: 'asc',
      });
      expect(firstPage.entries).toHaveLength(3);
      expect(firstPage.totalCount).toBe(10);
      expect(firstPage.filteredCount).toBe(10);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.nextOffset).toBe(3);

      // Second page
      const secondPage = await storage.getEntries({
        limit: 3,
        offset: 3,
        sortBy: 'id',
        sortOrder: 'asc',
      });
      expect(secondPage.entries).toHaveLength(3);
      expect(secondPage.hasMore).toBe(true);
      expect(secondPage.nextOffset).toBe(6);

      // Last page
      const lastPage = await storage.getEntries({
        limit: 3,
        offset: 9,
        sortBy: 'id',
        sortOrder: 'asc',
      });
      expect(lastPage.entries).toHaveLength(1);
      expect(lastPage.hasMore).toBe(false);
      expect(lastPage.nextOffset).toBeUndefined();
    });

    it('should verify integrity correctly', async () => {
      const entry1: AuditEntry = {
        id: 'test1',
        timestamp: '2025-01-01T10:00:00.000Z',
        eventType: AuditEventType.SYSTEM_START,
        severity: AuditSeverity.INFORMATIONAL,
        message: 'Test entry 1',
        outcome: 'success',
        securityClassification: SecurityClassification.INTERNAL,
      };

      const entry2: AuditEntry = {
        id: 'test2',
        timestamp: '2025-01-01T11:00:00.000Z',
        eventType: AuditEventType.SYSTEM_STOP,
        severity: AuditSeverity.INFORMATIONAL,
        message: 'Test entry 2',
        outcome: 'success',
        securityClassification: SecurityClassification.INTERNAL,
      };

      await storage.addEntry(entry1);
      await storage.addEntry(entry2);

      const verification = await storage.verifyIntegrity();
      expect(verification.status).toBe(IntegrityStatus.VERIFIED);
      expect(verification.verifiedEntries).toBe(2);
      expect(verification.totalEntries).toBe(2);
      expect(verification.corruptedEntries).toHaveLength(0);
      expect(verification.errors).toHaveLength(0);
    });

    it('should export data in different formats', async () => {
      const entry: AuditEntry = {
        id: 'test1',
        timestamp: AuditHelpers.createTimestamp(),
        eventType: AuditEventType.AUTH_SUCCESS,
        severity: AuditSeverity.LOW,
        message: 'Test entry',
        outcome: 'success',
        securityClassification: SecurityClassification.INTERNAL,
      };

      await storage.addEntry(entry);

      // JSON export
      const jsonExport = await storage.export({
        format: 'json',
        includeMetadata: true,
        includeIntegrityData: true,
        compressOutput: false,
        encryptOutput: false,
        digitalSignature: false,
      });

      const jsonData = JSON.parse(jsonExport.toString());
      expect(jsonData.metadata).toBeDefined();
      expect(jsonData.entries).toHaveLength(1);
      expect(jsonData.integrityData).toBeDefined();

      // CSV export
      const csvExport = await storage.export({
        format: 'csv',
        includeMetadata: false,
        includeIntegrityData: false,
        compressOutput: false,
        encryptOutput: false,
        digitalSignature: false,
      });

      const csvContent = csvExport.toString();
      expect(csvContent).toContain('id,timestamp,eventType,severity,message,outcome');
      expect(csvContent).toContain('test1');
    });

    it('should handle size limits correctly', async () => {
      const configWithLimits: AuditTrailConfig = {
        ...testConfig,
        maxEntries: 3,
      };

      const limitedStorage = new MemoryAuditStorage(configWithLimits);
      await limitedStorage.init();

      // Add more entries than the limit
      for (let i = 1; i <= 5; i++) {
        await limitedStorage.addEntry({
          id: `entry${i}`,
          timestamp: AuditHelpers.createTimestamp(),
          eventType: AuditEventType.SYSTEM_START,
          severity: AuditSeverity.INFORMATIONAL,
          message: `Entry ${i}`,
          outcome: 'success',
          securityClassification: SecurityClassification.INTERNAL,
        });
      }

      const metadata = await limitedStorage.getMetadata();
      expect(metadata.totalEntries).toBe(3); // Should be limited to maxEntries

      await limitedStorage.close();
    });

    it('should clean up old entries correctly', async () => {
      const oldDate = new Date('2025-01-01T00:00:00.000Z');
      const newDate = new Date('2025-01-02T00:00:00.000Z');

      await storage.addEntry({
        id: 'old1',
        timestamp: oldDate.toISOString(),
        eventType: AuditEventType.SYSTEM_START,
        severity: AuditSeverity.INFORMATIONAL,
        message: 'Old entry 1',
        outcome: 'success',
        securityClassification: SecurityClassification.INTERNAL,
      });

      await storage.addEntry({
        id: 'new1',
        timestamp: newDate.toISOString(),
        eventType: AuditEventType.SYSTEM_START,
        severity: AuditSeverity.INFORMATIONAL,
        message: 'New entry 1',
        outcome: 'success',
        securityClassification: SecurityClassification.INTERNAL,
      });

      const cleanupDate = new Date('2025-01-01T12:00:00.000Z');
      const removedCount = await storage.cleanup(cleanupDate);

      expect(removedCount).toBe(1);

      const remaining = await storage.getEntries({});
      expect(remaining.entries).toHaveLength(1);
      expect(remaining.entries[0].id).toBe('new1');
    });
  });

  describe('AuditTrailManager', () => {
    it('should initialize and close correctly', async () => {
      await auditManager.init();
      expect(auditManager.getConfig()).toEqual(testConfig);

      await auditManager.close();
    });

    it('should record events correctly', async () => {
      await auditManager.init();

      const entry = auditManager
        .createEvent()
        .setEventType(AuditEventType.AUTH_SUCCESS)
        .setSeverity(AuditSeverity.LOW)
        .setMessage('User logged in')
        .setOutcome('success')
        .build();

      await auditManager.recordEvent(entry);

      const results = await auditManager.queryEntries({ limit: 10 });
      expect(results.entries).toHaveLength(1);
      expect(results.entries[0].message).toBe('User logged in');
    });

    it('should filter events based on configuration', async () => {
      await auditManager.init();

      // Update config to only record HIGH severity events
      auditManager.updateConfig({
        minimumSeverity: AuditSeverity.HIGH,
      });

      const lowEntry = auditManager
        .createEvent()
        .setEventType(AuditEventType.AUTH_SUCCESS)
        .setSeverity(AuditSeverity.LOW)
        .setMessage('Low severity event')
        .setOutcome('success')
        .build();

      const highEntry = auditManager
        .createEvent()
        .setEventType(AuditEventType.SECURITY_VIOLATION)
        .setSeverity(AuditSeverity.HIGH)
        .setMessage('High severity event')
        .setOutcome('failure')
        .build();

      await auditManager.recordEvent(lowEntry);
      await auditManager.recordEvent(highEntry);

      const results = await auditManager.queryEntries({ limit: 10 });
      expect(results.entries).toHaveLength(1);
      expect(results.entries[0].severity).toBe(AuditSeverity.HIGH);
    });

    it('should enrich entries with system context', async () => {
      await auditManager.init();

      const entry = auditManager
        .createEvent()
        .setEventType(AuditEventType.SYSTEM_START)
        .setSeverity(AuditSeverity.INFORMATIONAL)
        .setMessage('System started')
        .setOutcome('success')
        .build();

      await auditManager.recordEvent(entry);

      const results = await auditManager.queryEntries({ limit: 1 });
      const recordedEntry = results.entries[0];

      expect(recordedEntry.systemContext).toBeDefined();
      expect(recordedEntry.systemContext?.processId).toBe(process.pid);
      expect(recordedEntry.systemContext?.workingDirectory).toBe(process.cwd());
      expect(recordedEntry.retentionPolicy).toBeDefined();
      expect(recordedEntry.retentionUntil).toBeDefined();
    });

    it('should handle security violation recording', async () => {
      await auditManager.init();

      const violation: EnhancedSecurityViolation = {
        id: 'violation123',
        type: 'sql_injection',
        pattern: 'sql-command-injection',
        severity: 'critical',
        description: 'SQL injection attempt detected',
        recommendation: 'Use parameterized queries',
        timestamp: new Date(),
        context: {
          inputType: 'command-arg',
          environment: 'test',
        },
        compliance: {
          owasp: ['A03'],
          cwe: [89],
          nist: ['PR.DS-5'],
          mitre: ['T1190'],
          iso27001: ['A.12.6.1'],
        },
        riskFactors: [
          {
            type: 'environmental',
            name: 'test-environment',
            impact: 50,
            description: 'Running in test environment',
          },
        ],
        remediation: [
          {
            type: 'validation',
            priority: 'critical',
            autoFixAvailable: false,
            description: 'Implement SQL input validation',
          },
        ],
        correlationId: 'corr123',
      };

      await auditManager.recordSecurityViolation(violation, {
        userContext: {
          userId: 'malicious_user',
          ipAddress: '192.168.1.100',
        },
      });

      const results = await auditManager.queryEntries({ limit: 1 });
      const recordedEntry = results.entries[0];

      expect(recordedEntry.eventType).toBe(AuditEventType.ATTACK_DETECTED);
      expect(recordedEntry.severity).toBe(AuditSeverity.CRITICAL);
      expect(recordedEntry.securityViolations).toHaveLength(1);
      expect(recordedEntry.threatLevel).toBe('critical');
      expect(recordedEntry.userContext?.userId).toBe('malicious_user');
    });

    it('should record structured log events', async () => {
      await auditManager.init();

      const structuredLogEntry: StructuredLogEntry = {
        timestamp: AuditHelpers.createTimestamp(),
        level: StructuredLogLevel.ERROR,
        levelName: 'ERROR',
        message: 'Database connection failed',
        sanitized: false,
        securityFlags: ['error'],
        classification: SecurityClassification.INTERNAL,
        context: { database: 'primary' },
        component: 'database-connector',
        operation: 'connect',
        error: {
          name: 'ConnectionError',
          message: 'Connection timeout',
          sanitized: false,
        },
        auditEvent: true,
      };

      await auditManager.recordStructuredLogEvent(structuredLogEntry, {
        systemContext: {
          hostname: 'db-server-01',
        },
      });

      const results = await auditManager.queryEntries({ limit: 1 });
      const recordedEntry = results.entries[0];

      expect(recordedEntry.eventType).toBe(AuditEventType.SYSTEM_ERROR);
      expect(recordedEntry.severity).toBe(AuditSeverity.HIGH);
      expect(recordedEntry.outcome).toBe('failure');
      expect(recordedEntry.rawLogEntry).toEqual(structuredLogEntry);
      expect(recordedEntry.systemContext?.hostname).toBe('db-server-01');
    });

    it('should record command execution events', async () => {
      await auditManager.init();

      await auditManager.recordCommandExecution(
        'deploy',
        ['--environment', 'production'],
        'success',
        {
          userContext: {
            userId: 'admin123',
            roles: ['admin'],
          },
          duration: 45000,
          exitCode: 0,
        }
      );

      const results = await auditManager.queryEntries({ limit: 1 });
      const recordedEntry = results.entries[0];

      expect(recordedEntry.eventType).toBe(AuditEventType.COMMAND_EXECUTION);
      expect(recordedEntry.severity).toBe(AuditSeverity.LOW);
      expect(recordedEntry.message).toContain('deploy --environment production');
      expect(recordedEntry.outcome).toBe('success');
      expect(recordedEntry.userContext?.userId).toBe('admin123');
      expect(recordedEntry.tags).toContain('cli');
      expect(recordedEntry.tags).toContain('exit-code-0');
    });

    it('should handle batch processing when enabled', async () => {
      const batchConfig: AuditTrailConfig = {
        ...testConfig,
        asyncProcessing: true,
        batchSize: 3,
        flushInterval: 100, // Minimum allowed by security validation
      };

      const batchManager = new AuditTrailManager(batchConfig);
      await batchManager.init();

      try {
        // Record multiple events
        for (let i = 1; i <= 5; i++) {
          const entry = batchManager
            .createEvent()
            .setEventType(AuditEventType.SYSTEM_START)
            .setSeverity(AuditSeverity.INFORMATIONAL)
            .setMessage(`Batch event ${i}`)
            .setOutcome('success')
            .build();

          await batchManager.recordEvent(entry);
        }

        // Wait for flush
        await new Promise((resolve) => setTimeout(resolve, 100));
        await batchManager.flush();

        const results = await batchManager.queryEntries({ limit: 10 });
        expect(results.entries).toHaveLength(5);
      } finally {
        await batchManager.close();
      }
    });
  });

  describe('Security and Edge Cases', () => {
    beforeEach(async () => {
      await auditManager.init();
    });

    it('should handle disabled audit trail', async () => {
      auditManager.updateConfig({ enabled: false });

      const entry = auditManager
        .createEvent()
        .setEventType(AuditEventType.AUTH_SUCCESS)
        .setSeverity(AuditSeverity.LOW)
        .setMessage('Should not be recorded')
        .setOutcome('success')
        .build();

      await auditManager.recordEvent(entry);

      const results = await auditManager.queryEntries({ limit: 10 });
      expect(results.entries).toHaveLength(0);
    });

    it('should handle malformed entries gracefully', async () => {
      const builder = new AuditEventBuilderImpl();

      // Missing required fields should throw
      expect(() => builder.build()).toThrow();

      // But should not crash the system
      const validEntry = auditManager
        .createEvent()
        .setEventType(AuditEventType.SYSTEM_ERROR)
        .setSeverity(AuditSeverity.MEDIUM)
        .setMessage('Valid entry after error')
        .setOutcome('success')
        .build();

      await expect(auditManager.recordEvent(validEntry)).resolves.not.toThrow();
    });

    it('should handle very large audit entries', async () => {
      const largeMessage = 'A'.repeat(10000); // 10KB message
      const largeContext = {
        data: 'B'.repeat(50000), // 50KB context
      };

      const entry = auditManager
        .createEvent()
        .setEventType(AuditEventType.DATA_ACCESS)
        .setSeverity(AuditSeverity.MEDIUM)
        .setMessage(largeMessage)
        .setOutcome('success')
        .build();

      // Add large context
      entry.resourceContext = {
        resourceType: 'file',
        beforeValue: largeContext,
      };

      await expect(auditManager.recordEvent(entry)).resolves.not.toThrow();

      const results = await auditManager.queryEntries({ limit: 1 });
      expect(results.entries).toHaveLength(1);
      expect(results.entries[0].message).toBe(largeMessage);
    });

    it('should handle concurrent access safely', async () => {
      const promises: Promise<void>[] = [];

      // Create multiple concurrent audit operations
      for (let i = 1; i <= 20; i++) {
        const promise = (async () => {
          const entry = auditManager
            .createEvent()
            .setEventType(AuditEventType.SYSTEM_START)
            .setSeverity(AuditSeverity.INFORMATIONAL)
            .setMessage(`Concurrent event ${i}`)
            .setOutcome('success')
            .build();

          await auditManager.recordEvent(entry);
        })();
        promises.push(promise);
      }

      await Promise.all(promises);

      const results = await auditManager.queryEntries({ limit: 25 });
      expect(results.entries).toHaveLength(20);

      // Verify no duplicates
      const ids = results.entries.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(20);
    });

    it('should maintain integrity with checksum validation', async () => {
      const configWithIntegrity: AuditTrailConfig = {
        ...testConfig,
        enableIntegrityProtection: true,
        enableTamperDetection: true,
        checksumAlgorithm: 'sha256',
      };

      const integrityManager = new AuditTrailManager(configWithIntegrity);
      await integrityManager.init();

      try {
        // Add multiple entries to create hash chain
        for (let i = 1; i <= 5; i++) {
          const entry = integrityManager
            .createEvent()
            .setEventType(AuditEventType.SYSTEM_START)
            .setSeverity(AuditSeverity.INFORMATIONAL)
            .setMessage(`Integrity test ${i}`)
            .setOutcome('success')
            .build();

          await integrityManager.recordEvent(entry);
        }

        // Verify integrity
        const verification = await integrityManager.verifyIntegrity();
        expect(verification.status).toBe(IntegrityStatus.VERIFIED);
        expect(verification.verifiedEntries).toBe(5);
        expect(verification.corruptedEntries).toHaveLength(0);

        // Verify entries have checksums and hash chain
        const results = await integrityManager.queryEntries({
          limit: 10,
          sortBy: 'timestamp',
          sortOrder: 'asc',
        });

        for (let i = 0; i < results.entries.length; i++) {
          const entry = results.entries[i];
          expect(entry.checksum).toBeDefined();

          if (i > 0) {
            expect(entry.previousEntryHash).toBe(results.entries[i - 1].checksum);
          }
        }
      } finally {
        await integrityManager.close();
      }
    });

    it('should handle export with various options', async () => {
      // Add test data
      const entries = [
        auditManager
          .createEvent()
          .setEventType(AuditEventType.AUTH_SUCCESS)
          .setSeverity(AuditSeverity.LOW)
          .setMessage('Login success')
          .setOutcome('success')
          .build(),
        auditManager
          .createEvent()
          .setEventType(AuditEventType.SECURITY_VIOLATION)
          .setSeverity(AuditSeverity.HIGH)
          .setMessage('Security violation')
          .setOutcome('failure')
          .build(),
      ];

      for (const entry of entries) {
        await auditManager.recordEvent(entry);
      }

      // Export with filtering
      const exportData = await auditManager.export({
        format: 'json',
        includeMetadata: true,
        includeIntegrityData: true,
        compressOutput: false,
        encryptOutput: false,
        digitalSignature: false,
        filter: {
          severities: [AuditSeverity.HIGH],
        },
      });

      const exportedData = JSON.parse(exportData.toString());
      expect(exportedData.entries).toHaveLength(1);
      expect(exportedData.entries[0].severity).toBe(AuditSeverity.HIGH);
      expect(exportedData.metadata).toBeDefined();
      expect(exportedData.integrityData).toBeDefined();
    });
  });

  describe('Convenience Functions', () => {
    let testAuditManager: AuditTrailManager;

    beforeEach(async () => {
      // Create a fresh manager for this test to avoid shared state issues
      testAuditManager = new AuditTrailManager({
        ...DEFAULT_AUDIT_TRAIL_CONFIG,
        trailName: 'convenience-test-trail',
        asyncProcessing: false,
      });
      await testAuditManager.init();
    });

    afterEach(async () => {
      await testAuditManager.close();
    });

    it('should provide convenience functions for common operations', async () => {
      // Test security violation recording
      const violation: EnhancedSecurityViolation = {
        id: 'test-violation',
        type: 'path_traversal',
        pattern: 'directory-traversal',
        severity: 'high',
        description: 'Path traversal attempt',
        recommendation: 'Block path traversal attempts',
        timestamp: new Date(),
        context: {
          inputType: 'file-path',
          environment: 'test',
        },
        compliance: {
          owasp: ['A01'],
          cwe: [22],
          nist: ['PR.DS-1'],
          mitre: ['T1083'],
          iso27001: ['A.12.6.1'],
        },
        riskFactors: [
          {
            type: 'environmental',
            name: 'test-environment',
            impact: 30,
            description: 'Running in test environment',
          },
        ],
        remediation: [
          {
            type: 'validation',
            priority: 'high',
            autoFixAvailable: true,
            description: 'Implement path validation',
          },
        ],
        correlationId: 'conv123',
      };

      await testAuditManager.recordSecurityViolation(violation);

      // Test command recording
      await testAuditManager.recordCommandExecution('ls', ['-la', '/home'], 'success');

      // Test event creation and recording
      const customEvent = testAuditManager
        .createEvent()
        .setEventType(AuditEventType.DATA_ACCESS)
        .setSeverity(AuditSeverity.MEDIUM)
        .setMessage('Data accessed')
        .setOutcome('success')
        .build();

      await testAuditManager.recordEvent(customEvent);

      // Query and verify
      const results = await testAuditManager.queryEntries({ limit: 10 });
      expect(results.entries).toHaveLength(3);

      // Test integrity verification
      const integrity = await testAuditManager.verifyIntegrity();
      expect(integrity.status).toBe(IntegrityStatus.VERIFIED);

      // Test export
      const exportData = await testAuditManager.export({
        format: 'json',
        includeMetadata: false,
        includeIntegrityData: false,
        compressOutput: false,
        encryptOutput: false,
        digitalSignature: false,
      });

      const exported = JSON.parse(exportData.toString());
      expect(exported.entries).toHaveLength(3);
    });
  });
});
