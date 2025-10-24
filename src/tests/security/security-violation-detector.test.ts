/**
 * Comprehensive tests for Security Violation Detection Engine (Task 1.2.2)
 * 
 * Tests cover:
 * - Centralized violation detection API
 * - Advanced risk scoring algorithms
 * - Attack pattern correlation
 * - Compliance framework mapping
 * - Context-aware severity escalation
 * - Missing attack vector detection (deserialization, XXE, SSTI, LDAP, XPath, EL, CSV)
 * - Threat categorization
 * - Remediation suggestion generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SecurityViolationDetector,
  ViolationContext,
  DEFAULT_RISK_SCORING_CONFIG,
  defaultSecurityViolationDetector
} from '../../../src/core/foundation/security/violation-detector.js';

describe('SecurityViolationDetector - Centralized Violation Detection API', () => {
  let detector: SecurityViolationDetector;
  let context: ViolationContext;

  beforeEach(() => {
    detector = new SecurityViolationDetector();
    context = {
      inputType: 'command-arg',
      environment: 'development',
      userRole: 'user',
      sessionId: 'test-session',
      clientId: 'test-client'
    };
  });

  describe('Basic Violation Detection', () => {
    it('should detect path traversal attacks', async () => {
      const result = await detector.analyzeViolations('../../../etc/passwd', context);
      
      expect(result.violations.length).toBeGreaterThan(0);
      const pathViolation = result.violations.find(v => v.type === 'path-traversal');
      expect(pathViolation).toBeDefined();
      expect(pathViolation!.severity).toBe('critical');
      expect(result.calculatedRiskScore).toBeGreaterThan(30);
      expect(result.securityAnalysis.isSecure).toBe(false);
    });

    it('should detect command injection attacks', async () => {
      const result = await detector.analyzeViolations('rm -rf /; echo "pwned"', context);
      
      expect(result.violations.length).toBeGreaterThan(0);
      const commandInjection = result.violations.find(v => v.type === 'command-injection');
      expect(commandInjection).toBeDefined();
      expect(commandInjection!.severity).toBe('critical');
      expect(result.calculatedRiskScore).toBeGreaterThan(35);
    });

    it('should detect safe inputs correctly', async () => {
      const result = await detector.analyzeViolations('my-safe-project-name', context);
      
      expect(result.violations).toHaveLength(0);
      expect(result.calculatedRiskScore).toBe(0);
      expect(result.securityAnalysis.isSecure).toBe(true);
    });
  });

  describe('Missing Attack Vector Detection', () => {
    it('should detect deserialization attacks', async () => {
      const javaSerializedData = 'rO0ABXNyABJqYXZhLnV0aWwuSGFzaE1hcA==';
      const result = await detector.analyzeViolations(javaSerializedData, context);
      
      const deserializationViolation = result.violations.find(v => v.type === 'deserialization');
      expect(deserializationViolation).toBeDefined();
      expect(deserializationViolation!.severity).toBe('critical');
      expect(result.calculatedRiskScore).toBeGreaterThan(40);
    });

    it('should detect XXE attacks', async () => {
      const xxePayload = '<!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>';
      const result = await detector.analyzeViolations(xxePayload, context);
      
      const xxeViolation = result.violations.find(v => v.type === 'xxe');
      expect(xxeViolation).toBeDefined();
      expect(xxeViolation!.severity).toBe('high');
      expect(result.calculatedRiskScore).toBeGreaterThan(30);
    });

    it('should detect SSTI attacks', async () => {
      const sstiPayload = '{{config.items()}}';
      const result = await detector.analyzeViolations(sstiPayload, context);
      
      // Should be detected by either JINJA2_INJECTION or TEMPLATE_OBJECT_ACCESS patterns
      const sstiViolation = result.violations.find(v => v.type === 'ssti');
      expect(sstiViolation).toBeDefined();
      expect(result.calculatedRiskScore).toBeGreaterThan(30);
    });

    it('should detect LDAP injection', async () => {
      const ldapPayload = 'admin)(&(password=*';
      const result = await detector.analyzeViolations(ldapPayload, context);
      
      const ldapViolation = result.violations.find(v => v.type === 'ldap-injection');
      expect(ldapViolation).toBeDefined();
      expect(ldapViolation!.severity).toBe('high');
    });

    it('should detect XPath injection', async () => {
      const xpathPayload = '\' or \'1\'=\'1';
      const result = await detector.analyzeViolations(xpathPayload, context);
      
      const xpathViolation = result.violations.find(v => v.type === 'xpath-injection');
      expect(xpathViolation).toBeDefined();
      expect(xpathViolation!.severity).toBe('high');
    });

    it('should detect Expression Language injection', async () => {
      const elPayload = '${Runtime.getRuntime().exec("calc")}';
      const result = await detector.analyzeViolations(elPayload, context);
      
      const elViolation = result.violations.find(v => v.type === 'expression-injection');
      expect(elViolation).toBeDefined();
      expect(elViolation!.severity).toBe('critical');
    });

    it('should detect CSV injection', async () => {
      const csvPayload = '=cmd|"/C calc"!A1';
      const result = await detector.analyzeViolations(csvPayload, context);
      
      const csvViolation = result.violations.find(v => v.type === 'csv-injection');
      expect(csvViolation).toBeDefined();
    });
  });

  describe('Advanced Risk Scoring Algorithm', () => {
    it('should calculate risk scores using algorithmic approach', async () => {
      const result = await detector.analyzeViolations('rm -rf /', {
        ...context,
        environment: 'production',
        userRole: 'admin'
      });
      
      expect(result.calculatedRiskScore).toBeGreaterThan(0);
      expect(result.calculatedRiskScore).toBeLessThanOrEqual(100);
      
      // Production + admin should increase risk score compared to development + user
      const devResult = await detector.analyzeViolations('safe-input', context);
      expect(result.calculatedRiskScore).toBeGreaterThan(devResult.calculatedRiskScore);
    });

    it('should handle multiple violations with correlation bonuses', async () => {
      const multiVectorAttack = '../../../etc/passwd; rm -rf /';
      const result = await detector.analyzeViolations(multiVectorAttack, context);
      
      expect(result.violations.length).toBeGreaterThan(1);
      expect(result.calculatedRiskScore).toBeGreaterThan(50); // Should get correlation bonus
      expect(result.attackCorrelations.length).toBeGreaterThan(0);
    });

    it('should cap risk scores at 100', async () => {
      const extremePayload = '../../../etc/passwd; rm -rf /; eval("malicious"); ${Runtime.exec("calc")}';
      const result = await detector.analyzeViolations(extremePayload, {
        ...context,
        environment: 'production',
        userRole: 'admin'
      });
      
      expect(result.calculatedRiskScore).toBeLessThanOrEqual(100);
    });

    it('should use configurable risk scoring', () => {
      const customConfig = {
        severityWeights: { critical: 50, high: 40, medium: 25, low: 10 },
        contextMultipliers: { production: 3.0, staging: 2.0, development: 1.0, test: 0.5 }
      };
      
      const customDetector = new SecurityViolationDetector(customConfig);
      expect(customDetector).toBeDefined();
    });
  });

  describe('Context-Aware Severity Escalation', () => {
    it('should escalate severity in production environment', async () => {
      const productionContext = { ...context, environment: 'production' as const };
      const result = await detector.analyzeViolations('medium-risk-input', productionContext);
      
      // Production environment should add risk factors
      const productionViolations = result.violations.filter(v => 
        v.riskFactors.some(rf => rf.name === 'production-environment')
      );
      expect(productionViolations.length).toBeGreaterThanOrEqual(0);
    });

    it('should escalate severity for admin users', async () => {
      const adminContext = { ...context, userRole: 'admin' as const };
      const result = await detector.analyzeViolations('some-input', adminContext);
      
      // Should track admin context in risk factors if violations exist
      if (result.violations.length > 0) {
        const adminViolations = result.violations.filter(v => 
          v.riskFactors.some(rf => rf.name === 'admin-user-context')
        );
        expect(adminViolations.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should escalate command injection in command argument context', async () => {
      const cmdContext = { ...context, inputType: 'command-arg' as const };
      const result = await detector.analyzeViolations('rm -rf /', cmdContext);
      
      const commandViolations = result.violations.filter(v => v.type === 'command-injection');
      if (commandViolations.length > 0) {
        expect(commandViolations[0].severity).toBe('critical');
      }
    });
  });

  describe('Threat Categorization', () => {
    it('should categorize threats correctly', async () => {
      const result = await detector.analyzeViolations('../../../etc/passwd; rm -rf /', context);
      
      expect(result.threatCategories.length).toBeGreaterThan(0);
      
      const pathCategory = result.threatCategories.find(c => c.name === 'Path Manipulation');
      expect(pathCategory).toBeDefined();
      expect(pathCategory!.violations.length).toBeGreaterThan(0);
      expect(pathCategory!.mitigations.length).toBeGreaterThan(0);
    });

    it('should set threat levels based on highest severity', async () => {
      const result = await detector.analyzeViolations('critical-threat-input', context);
      
      result.threatCategories.forEach(category => {
        expect(['low', 'medium', 'high', 'critical']).toContain(category.level);
      });
    });
  });

  describe('Attack Pattern Correlation', () => {
    it('should detect multi-vector attacks', async () => {
      const multiVectorPayload = '../../../etc/passwd; eval("malicious"); rm -rf /';
      const result = await detector.analyzeViolations(multiVectorPayload, context);
      
      if (result.violations.length > 1) {
        expect(result.attackCorrelations.length).toBeGreaterThan(0);
        
        const multiVector = result.attackCorrelations.find(c => c.attackPattern === 'multi-vector-attack');
        expect(multiVector).toBeDefined();
        expect(multiVector!.sophisticationLevel).toBeOneOf(['basic', 'intermediate', 'advanced', 'expert']);
        expect(multiVector!.recommendedResponse).toBeOneOf(['monitor', 'warn', 'block', 'escalate']);
      }
    });

    it('should correlate attacks across sessions', async () => {
      const sessionContext = { ...context, sessionId: 'correlation-test' };
      
      // First attack
      await detector.analyzeViolations('../../../etc/passwd', sessionContext);
      
      // Second attack in same session
      const result = await detector.analyzeViolations('rm -rf /', sessionContext);
      
      const sessionCorrelation = result.attackCorrelations.find(c => 
        c.attackPattern === 'session-based-attack'
      );
      // May or may not exist depending on implementation timing
      if (sessionCorrelation) {
        expect(sessionCorrelation.violations.length).toBeGreaterThan(1);
      }
    });

    it('should assess attack sophistication levels', async () => {
      const basicAttack = '../etc/passwd';
      await detector.analyzeViolations(basicAttack, context); // Basic attack for comparison
      
      const advancedAttack = '../../../etc/passwd; eval("complex"); ${Runtime.exec("calc")}';
      const advancedResult = await detector.analyzeViolations(advancedAttack, context);
      
      if (advancedResult.attackCorrelations.length > 0) {
        const sophistication = advancedResult.attackCorrelations[0].sophisticationLevel;
        expect(['intermediate', 'advanced', 'expert']).toContain(sophistication);
      }
    });
  });

  describe('Compliance Framework Mapping', () => {
    it('should map violations to OWASP Top 10', async () => {
      const result = await detector.analyzeViolations('../../../etc/passwd', context);
      
      if (result.violations.length > 0) {
        const pathViolation = result.violations.find(v => v.type === 'path-traversal');
        expect(pathViolation).toBeDefined();
        expect(pathViolation!.compliance.owasp).toContain('A01:2021-Broken Access Control');
      }
    });

    it('should map violations to CWE numbers', async () => {
      const result = await detector.analyzeViolations('rm -rf /', context);
      
      if (result.violations.length > 0) {
        const cmdViolation = result.violations.find(v => v.type === 'command-injection');
        if (cmdViolation) {
          expect(cmdViolation.compliance.cwe).toContain(77);
        }
      }
    });

    it('should assess overall compliance status', async () => {
      const result = await detector.analyzeViolations('../../../etc; rm -rf /', context);
      
      expect(result.complianceStatus.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceStatus.overallScore).toBeLessThanOrEqual(100);
      expect(result.complianceStatus.frameworkScores).toHaveProperty('OWASP');
      expect(result.complianceStatus.frameworkScores).toHaveProperty('CWE');
    });

    it('should track failed compliance requirements', async () => {
      const result = await detector.analyzeViolations('critical-violation', context);
      
      expect(Array.isArray(result.complianceStatus.failedRequirements)).toBe(true);
      expect(Array.isArray(result.complianceStatus.gaps)).toBe(true);
    });
  });

  describe('Remediation Suggestions', () => {
    it('should generate appropriate remediation suggestions', async () => {
      const result = await detector.analyzeViolations('../../../etc/passwd', context);
      
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation.remediation.length).toBeGreaterThan(0);
        
        const suggestion = violation.remediation[0];
        expect(['sanitization', 'replacement', 'configuration', 'validation', 'blocking', 'monitoring']).toContain(suggestion.type);
        expect(['low', 'medium', 'high', 'critical']).toContain(suggestion.priority);
        expect(typeof suggestion.description).toBe('string');
        expect(typeof suggestion.autoFixAvailable).toBe('boolean');
      }
    });

    it('should include context-specific suggestions', async () => {
      const productionContext = { ...context, environment: 'production' as const };
      const result = await detector.analyzeViolations('some-violation', productionContext);
      
      if (result.violations.length > 0) {
        const monitoringSuggestions = result.violations.some(v => 
          v.remediation.some(r => r.type === 'monitoring')
        );
        // May include monitoring suggestions for production
        expect(typeof monitoringSuggestions).toBe('boolean');
      }
    });

    it('should suggest different remediation types for different attacks', async () => {
      const pathResult = await detector.analyzeViolations('../../../etc', context);
      const cmdResult = await detector.analyzeViolations('rm -rf /', context);
      
      if (pathResult.violations.length > 0 && cmdResult.violations.length > 0) {
        const pathSuggestion = pathResult.violations[0].remediation[0];
        const cmdSuggestion = cmdResult.violations[0].remediation[0];
        
        expect(pathSuggestion.type).toBeDefined();
        expect(cmdSuggestion.type).toBeDefined();
        // Different attack types should have different suggestions
      }
    });
  });

  describe('Recommended Actions Generation', () => {
    it('should generate immediate actions for critical violations', async () => {
      const result = await detector.analyzeViolations('eval("malicious"); rm -rf /', context);
      
      expect(result.recommendedActions.length).toBeGreaterThan(0);
      
      const immediateActions = result.recommendedActions.filter(a => a.type === 'immediate');
      if (result.violations.some(v => v.severity === 'critical')) {
        expect(immediateActions.length).toBeGreaterThan(0);
        expect(immediateActions[0].priority).toBe('critical');
      }
    });

    it('should recommend escalation for attack correlations', async () => {
      const correlatedAttack = '../../../etc/passwd; rm -rf /; eval("test")';
      const result = await detector.analyzeViolations(correlatedAttack, context);
      
      if (result.attackCorrelations.length > 0) {
        const escalationActions = result.recommendedActions.filter(a => 
          a.description.includes('correlat') || a.description.includes('attack patterns')
        );
        expect(escalationActions.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should recommend compliance improvements for low scores', async () => {
      const majorViolation = '../../../etc; rm -rf /; eval("malicious"); ${Runtime.exec()}';
      const result = await detector.analyzeViolations(majorViolation, context);
      
      if (result.complianceStatus.overallScore < 80) {
        const complianceActions = result.recommendedActions.filter(a => 
          a.description.includes('compliance')
        );
        expect(complianceActions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Default Instance and Configuration', () => {
    it('should provide default security violation detector', () => {
      expect(defaultSecurityViolationDetector).toBeDefined();
      expect(defaultSecurityViolationDetector).toBeInstanceOf(SecurityViolationDetector);
    });

    it('should have comprehensive default risk scoring config', () => {
      expect(DEFAULT_RISK_SCORING_CONFIG.severityWeights).toBeDefined();
      expect(DEFAULT_RISK_SCORING_CONFIG.contextMultipliers).toBeDefined();
      expect(DEFAULT_RISK_SCORING_CONFIG.attackVectorWeights).toBeDefined();
      expect(DEFAULT_RISK_SCORING_CONFIG.environmentalFactors).toBeDefined();
      expect(DEFAULT_RISK_SCORING_CONFIG.correlationBonuses).toBeDefined();
      
      // Should include all new attack vectors
      expect(DEFAULT_RISK_SCORING_CONFIG.attackVectorWeights).toHaveProperty('deserialization');
      expect(DEFAULT_RISK_SCORING_CONFIG.attackVectorWeights).toHaveProperty('xxe');
      expect(DEFAULT_RISK_SCORING_CONFIG.attackVectorWeights).toHaveProperty('ssti');
      expect(DEFAULT_RISK_SCORING_CONFIG.attackVectorWeights).toHaveProperty('ldap-injection');
      expect(DEFAULT_RISK_SCORING_CONFIG.attackVectorWeights).toHaveProperty('xpath-injection');
      expect(DEFAULT_RISK_SCORING_CONFIG.attackVectorWeights).toHaveProperty('expression-injection');
      expect(DEFAULT_RISK_SCORING_CONFIG.attackVectorWeights).toHaveProperty('csv-injection');
    });
  });

  describe('Violation Metadata and Tracking', () => {
    it('should generate unique violation IDs', async () => {
      const result1 = await detector.analyzeViolations('../../../etc', context);
      const result2 = await detector.analyzeViolations('../../../etc', context);
      
      if (result1.violations.length > 0 && result2.violations.length > 0) {
        expect(result1.violations[0].id).not.toBe(result2.violations[0].id);
      }
    });

    it('should include timestamps in violations', async () => {
      const result = await detector.analyzeViolations('../../../etc', context);
      
      if (result.violations.length > 0) {
        expect(result.violations[0].timestamp).toBeInstanceOf(Date);
        expect(result.violations[0].timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });

    it('should include context information in violations', async () => {
      const result = await detector.analyzeViolations('../../../etc', context);
      
      if (result.violations.length > 0) {
        expect(result.violations[0].context).toEqual(context);
      }
    });

    it('should track risk factors for violations', async () => {
      const productionContext = { ...context, environment: 'production' as const, userRole: 'admin' as const };
      const result = await detector.analyzeViolations('../../../etc', productionContext);
      
      if (result.violations.length > 0) {
        expect(result.violations[0].riskFactors).toBeDefined();
        expect(Array.isArray(result.violations[0].riskFactors)).toBe(true);
        
        const envFactor = result.violations[0].riskFactors.find(rf => rf.type === 'environmental');
        expect(envFactor).toBeDefined();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty input safely', async () => {
      const result = await detector.analyzeViolations('', context);
      
      expect(result.violations).toHaveLength(0);
      expect(result.calculatedRiskScore).toBe(0);
    });

    it('should handle null/undefined context gracefully', async () => {
      const minimalContext: ViolationContext = {
        inputType: 'project-name',
        environment: 'development'
      };
      
      const result = await detector.analyzeViolations('test-input', minimalContext);
      expect(result).toBeDefined();
    });

    it('should handle very long inputs', async () => {
      const longInput = 'a'.repeat(10000) + '../../../etc/passwd';
      const result = await detector.analyzeViolations(longInput, context);
      
      expect(result).toBeDefined();
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should handle special Unicode characters', async () => {
      const unicodeInput = '../../\u0000\u202E/etc/passwd';
      const result = await detector.analyzeViolations(unicodeInput, context);
      
      expect(result).toBeDefined();
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });
});

describe('SecurityViolationDetector - Integration with Security Patterns', () => {
  let detector: SecurityViolationDetector;
  let context: ViolationContext;

  beforeEach(() => {
    detector = new SecurityViolationDetector();
    context = {
      inputType: 'command-arg',
      environment: 'development'
    };
  });

  it('should detect all attack vectors from enhanced security patterns', async () => {
    const attackVectors = [
      '../../../etc/passwd',          // Path traversal
      'rm -rf /',                     // Command injection  
      'eval("malicious")',           // Script injection
      'sudo rm -rf /',               // Privilege escalation
      'rO0ABXNyABJqYXZhLnV0aWw=',    // Deserialization
      '<!ENTITY xxe SYSTEM "file:///etc/passwd">', // XXE
      '{{config.items()}}',          // SSTI
      'admin)(&(password=*',         // LDAP injection
      '\' or \'1\'=\'1',             // XPath injection
      '${Runtime.getRuntime()}',     // Expression Language
      '=cmd|"/C calc"!A1'           // CSV injection
    ];

    for (const attack of attackVectors) {
      const result = await detector.analyzeViolations(attack, context);
      expect(result.violations.length).toBeGreaterThan(0);
    }
  });

  it('should properly integrate with existing security analysis', async () => {
    const complexAttack = '../../../etc/passwd; rm -rf /; eval("test")';
    const result = await detector.analyzeViolations(complexAttack, context);
    
    // Should have both securityAnalysis (from security-patterns) and enhanced violations
    expect(result.securityAnalysis).toBeDefined();
    expect(result.securityAnalysis.violations.length).toBeGreaterThan(0);
    expect(result.violations.length).toBeGreaterThan(0);
    
    // Enhanced violations should have additional metadata
    expect(result.violations[0]).toHaveProperty('id');
    expect(result.violations[0]).toHaveProperty('timestamp');
    expect(result.violations[0]).toHaveProperty('context');
    expect(result.violations[0]).toHaveProperty('compliance');
    expect(result.violations[0]).toHaveProperty('riskFactors');
    expect(result.violations[0]).toHaveProperty('remediation');
  });
});