/**
 * Security Violation Detection Engine (Task 1.2.2)
 * 
 * Centralized security violation detection system that provides comprehensive
 * threat analysis, risk scoring, attack correlation, and compliance mapping.
 * 
 * @security This module is the core of the security validation framework
 * @see Task 1.2.2: Security Violation Detection
 */

import { 
  analyzeInputSecurity, 
  SecurityViolation as BaseSecurityViolation,
  SecurityAnalysisResult 
} from './security-patterns.js';

/**
 * Enhanced security violation with compliance and correlation metadata
 */
export interface EnhancedSecurityViolation extends BaseSecurityViolation {
  /** Unique violation identifier for tracking */
  id: string;
  /** Timestamp when violation was detected */
  timestamp: Date;
  /** Input context where violation was found */
  context: ViolationContext;
  /** Compliance framework mappings */
  compliance: ComplianceMapping;
  /** Risk factors contributing to severity */
  riskFactors: RiskFactor[];
  /** Correlation with other violations */
  correlationId?: string;
  /** Remediation suggestions */
  remediation: RemediationSuggestion[];
}

/**
 * Context information for violation detection
 */
export interface ViolationContext {
  /** Type of input being validated */
  inputType: 'project-name' | 'package-manager' | 'file-path' | 'command-arg' | 'config-value' | 'url' | 'email';
  /** User role performing the action */
  userRole?: 'admin' | 'user' | 'guest' | 'service';
  /** Environment where validation occurs */
  environment: 'development' | 'staging' | 'production' | 'test';
  /** Request/session identifier for correlation */
  sessionId?: string;
  /** IP address or client identifier */
  clientId?: string;
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Risk factor contributing to violation severity
 */
export interface RiskFactor {
  /** Factor type */
  type: 'environmental' | 'contextual' | 'historical' | 'behavioral' | 'technical';
  /** Factor name */
  name: string;
  /** Impact on risk score (0-100) */
  impact: number;
  /** Description of the risk factor */
  description: string;
}

/**
 * Compliance framework mapping for violations
 */
export interface ComplianceMapping {
  /** OWASP Top 10 2021 categories */
  owasp?: string[];
  /** CWE (Common Weakness Enumeration) IDs */
  cwe?: number[];
  /** NIST Cybersecurity Framework categories */
  nist?: string[];
  /** MITRE ATT&CK technique IDs */
  mitre?: string[];
  /** ISO 27001 control references */
  iso27001?: string[];
}

/**
 * Remediation suggestion for fixing violations
 */
export interface RemediationSuggestion {
  /** Suggestion type */
  type: 'sanitization' | 'replacement' | 'configuration' | 'validation' | 'blocking' | 'monitoring';
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Suggestion description */
  description: string;
  /** Example of how to fix */
  example?: string;
  /** Automated fix available */
  autoFixAvailable: boolean;
}

/**
 * Attack correlation result
 */
export interface AttackCorrelation {
  /** Correlation identifier */
  correlationId: string;
  /** Correlated violations */
  violations: EnhancedSecurityViolation[];
  /** Attack pattern identified */
  attackPattern: string;
  /** Combined risk score */
  combinedRiskScore: number;
  /** Attack sophistication level */
  sophisticationLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  /** Recommended response */
  recommendedResponse: 'monitor' | 'warn' | 'block' | 'escalate';
}

/**
 * Threat category classification
 */
export interface ThreatCategory {
  /** Category name */
  name: string;
  /** Category description */
  description: string;
  /** Threat level */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** Violations in this category */
  violations: EnhancedSecurityViolation[];
  /** Mitigation strategies */
  mitigations: string[];
}

/**
 * Comprehensive violation analysis result
 */
export interface ViolationAnalysisResult {
  /** Original security analysis */
  securityAnalysis: SecurityAnalysisResult;
  /** Enhanced violations with metadata */
  violations: EnhancedSecurityViolation[];
  /** Calculated risk score using advanced algorithms */
  calculatedRiskScore: number;
  /** Threat categories identified */
  threatCategories: ThreatCategory[];
  /** Attack correlations found */
  attackCorrelations: AttackCorrelation[];
  /** Compliance assessment */
  complianceStatus: ComplianceAssessment;
  /** Recommended actions */
  recommendedActions: RecommendedAction[];
}

/**
 * Compliance assessment result
 */
export interface ComplianceAssessment {
  /** Overall compliance score (0-100) */
  overallScore: number;
  /** Framework-specific scores */
  frameworkScores: Record<string, number>;
  /** Failed compliance requirements */
  failedRequirements: string[];
  /** Compliance gaps identified */
  gaps: ComplianceGap[];
}

/**
 * Compliance gap information
 */
export interface ComplianceGap {
  /** Framework where gap exists */
  framework: string;
  /** Requirement that failed */
  requirement: string;
  /** Gap description */
  description: string;
  /** Remediation steps */
  remediation: string[];
}

/**
 * Recommended action based on analysis
 */
export interface RecommendedAction {
  /** Action type */
  type: 'immediate' | 'short-term' | 'long-term' | 'monitoring';
  /** Action description */
  description: string;
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Estimated effort */
  effort: 'minimal' | 'moderate' | 'significant' | 'extensive';
  /** Expected impact */
  impact: string;
}

/**
 * Advanced risk scoring configuration
 */
export interface RiskScoringConfig {
  /** Base severity weights */
  severityWeights: Record<string, number>;
  /** Context multipliers */
  contextMultipliers: Record<string, number>;
  /** Attack vector weights */
  attackVectorWeights: Record<string, number>;
  /** Environmental factors */
  environmentalFactors: Record<string, number>;
  /** Correlation bonuses */
  correlationBonuses: Record<string, number>;
}

/**
 * Default risk scoring configuration
 */
export const DEFAULT_RISK_SCORING_CONFIG: RiskScoringConfig = {
  severityWeights: {
    'critical': 40,
    'high': 30,
    'medium': 20,
    'low': 10
  },
  contextMultipliers: {
    'production': 2.0,
    'staging': 1.5,
    'development': 1.0,
    'test': 0.8
  },
  attackVectorWeights: {
    'path-traversal': 35,
    'command-injection': 40,
    'script-injection': 45,
    'privilege-escalation': 50,
    'deserialization': 45,
    'xxe': 35,
    'ssti': 40,
    'ldap-injection': 30,
    'xpath-injection': 30,
    'expression-injection': 40,
    'csv-injection': 25,
    'log-forging': 20
  },
  environmentalFactors: {
    'admin-user': 1.8,
    'service-account': 1.5,
    'regular-user': 1.0,
    'guest-user': 0.8
  },
  correlationBonuses: {
    'chained-attack': 25,
    'multi-vector': 20,
    'persistent-attempt': 15,
    'sophisticated-pattern': 30
  }
};

/**
 * Security violation history for correlation analysis
 */
interface ViolationHistory {
  violations: EnhancedSecurityViolation[];
  sessionCorrelations: Map<string, EnhancedSecurityViolation[]>;
  clientCorrelations: Map<string, EnhancedSecurityViolation[]>;
  timeWindows: Map<string, EnhancedSecurityViolation[]>;
}

/**
 * Advanced Security Violation Detection Engine
 * 
 * Provides centralized, comprehensive security violation detection with:
 * - Advanced risk scoring algorithms
 * - Attack pattern correlation
 * - Compliance framework mapping
 * - Context-aware severity escalation
 * - Comprehensive threat categorization
 */
export class SecurityViolationDetector {
  private config: RiskScoringConfig;
  private history: ViolationHistory;
  private correlationTimeWindow: number = 5 * 60 * 1000; // 5 minutes

  constructor(config?: Partial<RiskScoringConfig>) {
    this.config = { ...DEFAULT_RISK_SCORING_CONFIG, ...config };
    this.history = {
      violations: [],
      sessionCorrelations: new Map(),
      clientCorrelations: new Map(),
      timeWindows: new Map()
    };
  }

  /**
   * Analyze input for security violations with comprehensive analysis
   * 
   * @param input - Input string to analyze
   * @param context - Validation context
   * @returns Comprehensive violation analysis result
   */
  async analyzeViolations(
    input: string, 
    context: ViolationContext
  ): Promise<ViolationAnalysisResult> {
    // Perform base security analysis
    const securityAnalysis = analyzeInputSecurity(input);
    
    // Convert to enhanced violations
    const violations = await this.enhanceViolations(
      securityAnalysis.violations,
      input,
      context
    );

    // Calculate advanced risk score
    const calculatedRiskScore = this.calculateAdvancedRiskScore(violations, context);

    // Categorize threats
    const threatCategories = this.categorizeThreats(violations);

    // Find attack correlations
    const attackCorrelations = await this.correlateAttackPatterns(violations, context);

    // Assess compliance
    const complianceStatus = this.assessCompliance(violations);

    // Generate recommendations
    const recommendedActions = this.generateRecommendations(
      violations,
      threatCategories,
      attackCorrelations,
      complianceStatus
    );

    // Store in history for correlation
    this.updateHistory(violations, context);

    return {
      securityAnalysis,
      violations,
      calculatedRiskScore,
      threatCategories,
      attackCorrelations,
      complianceStatus,
      recommendedActions
    };
  }

  /**
   * Categorize threats based on violation patterns
   */
  categorizeThreats(violations: EnhancedSecurityViolation[]): ThreatCategory[] {
    const categories = new Map<string, ThreatCategory>();

    for (const violation of violations) {
      const categoryName = this.getCategoryName(violation.type);
      
      if (!categories.has(categoryName)) {
        categories.set(categoryName, {
          name: categoryName,
          description: this.getCategoryDescription(categoryName),
          level: 'low',
          violations: [],
          mitigations: this.getCategoryMitigations(categoryName)
        });
      }

      const category = categories.get(categoryName)!;
      category.violations.push(violation);
      
      // Update threat level based on highest severity
      if (this.getSeverityLevel(violation.severity) > this.getSeverityLevel(category.level)) {
        category.level = violation.severity;
      }
    }

    return Array.from(categories.values());
  }

  /**
   * Escalate severity based on context and risk factors
   */
  escalateSeverity(
    violation: EnhancedSecurityViolation, 
    context: ViolationContext
  ): EnhancedSecurityViolation {
    let escalatedSeverity = violation.severity;
    const riskFactors: RiskFactor[] = [...violation.riskFactors];

    // Environmental escalation
    if (context.environment === 'production') {
      riskFactors.push({
        type: 'environmental',
        name: 'production-environment',
        impact: 20,
        description: 'Violation detected in production environment'
      });
      
      if (violation.severity === 'medium') escalatedSeverity = 'high';
      if (violation.severity === 'high') escalatedSeverity = 'critical';
    }

    // User role escalation
    if (context.userRole === 'admin') {
      riskFactors.push({
        type: 'contextual',
        name: 'admin-user-context',
        impact: 15,
        description: 'Violation from administrative user account'
      });
    }

    // Input type escalation
    if (context.inputType === 'command-arg' && violation.type === 'command-injection') {
      riskFactors.push({
        type: 'contextual',
        name: 'command-context-injection',
        impact: 25,
        description: 'Command injection in command argument context'
      });
      
      if (violation.severity !== 'critical') escalatedSeverity = 'critical';
    }

    return {
      ...violation,
      severity: escalatedSeverity,
      riskFactors
    };
  }

  /**
   * Correlate attack patterns across violations
   */
  private async correlateAttackPatterns(
    violations: EnhancedSecurityViolation[], 
    context: ViolationContext
  ): Promise<AttackCorrelation[]> {
    const correlations: AttackCorrelation[] = [];

    // Check for immediate multi-vector attacks
    if (violations.length > 1) {
      const correlationId = this.generateCorrelationId();
      correlations.push({
        correlationId,
        violations,
        attackPattern: 'multi-vector-attack',
        combinedRiskScore: this.calculateCombinedRisk(violations),
        sophisticationLevel: this.assessSophistication(violations),
        recommendedResponse: this.getRecommendedResponse(violations)
      });
    }

    // Check historical correlations
    const historicalCorrelations = await this.findHistoricalCorrelations(violations, context);
    correlations.push(...historicalCorrelations);

    return correlations;
  }

  /**
   * Calculate advanced risk score using algorithmic approach
   */
  private calculateAdvancedRiskScore(
    violations: EnhancedSecurityViolation[], 
    context: ViolationContext
  ): number {
    if (violations.length === 0) return 0;

    let totalRisk = 0;
    let maxIndividualRisk = 0;

    for (const violation of violations) {
      // Base severity weight
      const severityWeight = this.config.severityWeights[violation.severity] || 10;
      
      // Attack vector weight
      const vectorWeight = this.config.attackVectorWeights[violation.type] || 20;
      
      // Context multiplier
      const contextMultiplier = this.config.contextMultipliers[context.environment] || 1.0;
      
      // Environmental factor
      const envFactor = this.config.environmentalFactors[`${context.userRole}-user`] || 1.0;
      
      // Calculate risk factors impact
      const riskFactorsImpact = violation.riskFactors.reduce((sum: number, factor: RiskFactor) => sum + factor.impact, 0);
      
      // Calculate individual violation risk
      const individualRisk = Math.min(
        (severityWeight + vectorWeight + riskFactorsImpact) * contextMultiplier * envFactor,
        100
      );
      
      totalRisk += individualRisk;
      maxIndividualRisk = Math.max(maxIndividualRisk, individualRisk);
    }

    // Apply correlation bonuses for multiple violations
    if (violations.length > 1) {
      const correlationBonus = this.config.correlationBonuses['multi-vector'] || 0;
      totalRisk += correlationBonus;
    }

    // Cap at 100 and ensure it's at least the highest individual risk
    return Math.min(Math.max(totalRisk, maxIndividualRisk), 100);
  }

  /**
   * Enhance violations with metadata and compliance mappings
   */
  private async enhanceViolations(
    baseViolations: BaseSecurityViolation[],
    input: string,
    context: ViolationContext
  ): Promise<EnhancedSecurityViolation[]> {
    const enhanced: EnhancedSecurityViolation[] = [];

    for (const violation of baseViolations) {
      const enhancedViolation: EnhancedSecurityViolation = {
        ...violation,
        id: this.generateViolationId(),
        timestamp: new Date(),
        context,
        compliance: this.mapCompliance(violation.type),
        riskFactors: this.calculateRiskFactors(violation, context),
        remediation: this.generateRemediation(violation, input, context)
      };

      // Apply severity escalation
      const escalatedViolation = this.escalateSeverity(enhancedViolation, context);
      enhanced.push(escalatedViolation);
    }

    return enhanced;
  }

  /**
   * Map violation to compliance frameworks
   */
  private mapCompliance(violationType: string): ComplianceMapping {
    const mappings: Record<string, ComplianceMapping> = {
      'path-traversal': {
        owasp: ['A01:2021-Broken Access Control'],
        cwe: [22, 23, 36, 73],
        nist: ['PR.AC-4', 'DE.AE-2'],
        mitre: ['T1083', 'T1005'],
        iso27001: ['A.9.1.2', 'A.9.4.1']
      },
      'command-injection': {
        owasp: ['A03:2021-Injection'],
        cwe: [77, 78, 88],
        nist: ['PR.DS-2', 'DE.CM-1'],
        mitre: ['T1059'],
        iso27001: ['A.14.2.1', 'A.14.2.5']
      },
      'script-injection': {
        owasp: ['A03:2021-Injection'],
        cwe: [79, 89, 94],
        nist: ['PR.DS-2', 'DE.CM-1'],
        mitre: ['T1055', 'T1027'],
        iso27001: ['A.14.2.1', 'A.14.2.5']
      },
      'privilege-escalation': {
        owasp: ['A01:2021-Broken Access Control'],
        cwe: [269, 270, 272],
        nist: ['PR.AC-1', 'PR.AC-4'],
        mitre: ['T1068', 'T1078'],
        iso27001: ['A.9.1.1', 'A.9.2.3']
      }
    };

    return mappings[violationType] || {
      owasp: [],
      cwe: [],
      nist: [],
      mitre: [],
      iso27001: []
    };
  }

  /**
   * Calculate risk factors for a violation
   */
  private calculateRiskFactors(
    violation: BaseSecurityViolation,
    context: ViolationContext
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Environmental factors
    if (context.environment === 'production') {
      factors.push({
        type: 'environmental',
        name: 'production-environment',
        impact: 20,
        description: 'Higher impact in production environment'
      });
    }

    // Contextual factors
    if (context.userRole === 'admin') {
      factors.push({
        type: 'contextual',
        name: 'administrative-privileges',
        impact: 15,
        description: 'Administrative user context increases risk'
      });
    }

    // Technical factors based on violation type
    if (violation.type === 'command-injection' && context.inputType === 'command-arg') {
      factors.push({
        type: 'technical',
        name: 'direct-command-execution',
        impact: 25,
        description: 'Direct command execution capability'
      });
    }

    return factors;
  }

  /**
   * Generate remediation suggestions
   */
  private generateRemediation(
    violation: BaseSecurityViolation,
    _input: string,
    context: ViolationContext
  ): RemediationSuggestion[] {
    const suggestions: RemediationSuggestion[] = [];

    switch (violation.type) {
      case 'path-traversal':
        suggestions.push({
          type: 'validation',
          priority: 'high',
          description: 'Validate and sanitize file paths to prevent directory traversal',
          example: 'Use path.normalize() and check against allowed directories',
          autoFixAvailable: true
        });
        break;
        
      case 'command-injection':
        suggestions.push({
          type: 'sanitization',
          priority: 'critical',
          description: 'Remove or escape shell metacharacters',
          example: 'Use parameterized commands or shell escape functions',
          autoFixAvailable: true
        });
        break;
        
      case 'script-injection':
        suggestions.push({
          type: 'blocking',
          priority: 'critical',
          description: 'Block script execution patterns completely',
          example: 'Reject inputs containing eval(), Function(), or script tags',
          autoFixAvailable: false
        });
        break;

      case 'privilege-escalation':
        suggestions.push({
          type: 'blocking',
          priority: 'critical',
          description: 'Block privilege escalation attempts',
          example: 'Validate user permissions and reject unauthorized access',
          autoFixAvailable: false
        });
        break;

      case 'deserialization':
        suggestions.push({
          type: 'validation',
          priority: 'critical',
          description: 'Validate serialized data before deserialization',
          example: 'Use safe deserialization libraries with type checking',
          autoFixAvailable: false
        });
        break;

      case 'xxe':
        suggestions.push({
          type: 'configuration',
          priority: 'high',
          description: 'Disable external entity processing in XML parsers',
          example: 'Configure XML parsers to reject external entities',
          autoFixAvailable: true
        });
        break;

      case 'ssti':
        suggestions.push({
          type: 'sanitization',
          priority: 'critical',
          description: 'Sanitize template inputs to prevent server-side injection',
          example: 'Use template sandboxing and input escaping',
          autoFixAvailable: false
        });
        break;

      case 'ldap-injection':
        suggestions.push({
          type: 'sanitization',
          priority: 'high',
          description: 'Escape LDAP special characters in user input',
          example: 'Use LDAP escaping functions for filter inputs',
          autoFixAvailable: true
        });
        break;

      case 'xpath-injection':
        suggestions.push({
          type: 'sanitization',
          priority: 'high',
          description: 'Use parameterized XPath queries',
          example: 'Avoid string concatenation in XPath expressions',
          autoFixAvailable: true
        });
        break;

      case 'expression-injection':
        suggestions.push({
          type: 'blocking',
          priority: 'critical',
          description: 'Block expression language injection attempts',
          example: 'Validate and sanitize expression inputs, use safe evaluation',
          autoFixAvailable: false
        });
        break;

      case 'csv-injection':
        suggestions.push({
          type: 'sanitization',
          priority: 'medium',
          description: 'Escape CSV special characters and formulas',
          example: 'Prefix formula characters with apostrophe or quotes',
          autoFixAvailable: true
        });
        break;
    }

    // Add context-specific suggestions
    if (context.environment === 'production') {
      suggestions.push({
        type: 'monitoring',
        priority: 'high',
        description: 'Implement enhanced monitoring for production environment',
        example: 'Set up alerting and logging for security violations',
        autoFixAvailable: false
      });
    }

    return suggestions;
  }

  /**
   * Assess compliance status
   */
  private assessCompliance(violations: EnhancedSecurityViolation[]): ComplianceAssessment {
    const frameworkScores: Record<string, number> = {
      'OWASP': 100,
      'CWE': 100,
      'NIST': 100,
      'MITRE': 100,
      'ISO27001': 100
    };

    const failedRequirements: string[] = [];
    const gaps: ComplianceGap[] = [];

    for (const violation of violations) {
      if (violation.severity === 'critical' || violation.severity === 'high') {
        // Reduce scores for high/critical violations
        frameworkScores['OWASP'] -= 20;
        frameworkScores['CWE'] -= 15;
        frameworkScores['NIST'] -= 10;
        
        // Add failed requirements
        if (violation.compliance.owasp) {
          failedRequirements.push(...violation.compliance.owasp);
        }
      }
    }

    // Ensure scores don't go below 0
    Object.keys(frameworkScores).forEach(key => {
      frameworkScores[key] = Math.max(0, frameworkScores[key]);
    });

    const overallScore = Object.values(frameworkScores).reduce((sum, score) => sum + score, 0) / Object.keys(frameworkScores).length;

    return {
      overallScore,
      frameworkScores,
      failedRequirements: [...new Set(failedRequirements)],
      gaps
    };
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendations(
    violations: EnhancedSecurityViolation[],
    _categories: ThreatCategory[],
    correlations: AttackCorrelation[],
    compliance: ComplianceAssessment
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    // Critical violations need immediate action
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      actions.push({
        type: 'immediate',
        description: `Address ${criticalViolations.length} critical security violations immediately`,
        priority: 'critical',
        effort: 'moderate',
        impact: 'Prevents potential security breaches'
      });
    }

    // Attack correlations need escalation
    if (correlations.length > 0) {
      actions.push({
        type: 'immediate',
        description: 'Investigate correlated attack patterns and implement monitoring',
        priority: 'high',
        effort: 'significant',
        impact: 'Detects and prevents coordinated attacks'
      });
    }

    // Compliance gaps need addressing
    if (compliance.overallScore < 80) {
      actions.push({
        type: 'short-term',
        description: 'Improve compliance posture to meet security standards',
        priority: 'medium',
        effort: 'extensive',
        impact: 'Ensures regulatory compliance and reduces audit risk'
      });
    }

    return actions;
  }

  // Helper methods
  private generateViolationId(): string {
    return `viol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCategoryName(violationType: string): string {
    const categories: Record<string, string> = {
      'path-traversal': 'Path Manipulation',
      'command-injection': 'Command Injection',
      'script-injection': 'Script Injection',
      'privilege-escalation': 'Privilege Escalation',
      'malformed-input': 'Input Validation',
      'suspicious-pattern': 'Suspicious Patterns'
    };
    return categories[violationType] || 'Unknown Threat';
  }

  private getCategoryDescription(categoryName: string): string {
    const descriptions: Record<string, string> = {
      'Path Manipulation': 'Attempts to access unauthorized files or directories',
      'Command Injection': 'Injection of malicious commands into system calls',
      'Script Injection': 'Injection of malicious scripts or code',
      'Privilege Escalation': 'Attempts to gain elevated system privileges',
      'Input Validation': 'Malformed or invalid input data',
      'Suspicious Patterns': 'Patterns that may indicate malicious intent'
    };
    return descriptions[categoryName] || 'Unknown threat category';
  }

  private getCategoryMitigations(categoryName: string): string[] {
    const mitigations: Record<string, string[]> = {
      'Path Manipulation': [
        'Implement strict path validation',
        'Use allow-lists for permitted directories',
        'Sanitize user input paths'
      ],
      'Command Injection': [
        'Use parameterized commands',
        'Implement command allow-lists',
        'Escape shell metacharacters'
      ],
      'Script Injection': [
        'Validate and sanitize all inputs',
        'Use Content Security Policy',
        'Implement input encoding'
      ]
    };
    return mitigations[categoryName] || ['Implement appropriate security controls'];
  }

  private getSeverityLevel(severity: string): number {
    const levels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return levels[severity as keyof typeof levels] || 0;
  }

  private calculateCombinedRisk(violations: EnhancedSecurityViolation[]): number {
    const baseRisk = violations.reduce((sum, v) => {
      const severityPoints = this.config.severityWeights[v.severity] || 10;
      return sum + severityPoints;
    }, 0);

    // Add bonus for multiple attack vectors
    const multiVectorBonus = violations.length > 1 ? 
      this.config.correlationBonuses['multi-vector'] || 0 : 0;

    return Math.min(baseRisk + multiVectorBonus, 100);
  }

  private assessSophistication(violations: EnhancedSecurityViolation[]): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const vectorTypes = new Set(violations.map(v => v.type)).size;

    if (criticalCount >= 2 && vectorTypes >= 3) return 'expert';
    if (criticalCount >= 1 && vectorTypes >= 2) return 'advanced';
    if (vectorTypes >= 2) return 'intermediate';
    return 'basic';
  }

  private getRecommendedResponse(violations: EnhancedSecurityViolation[]): 'monitor' | 'warn' | 'block' | 'escalate' {
    const hasCritical = violations.some(v => v.severity === 'critical');
    const hasMultipleHigh = violations.filter(v => v.severity === 'high').length >= 2;

    if (hasCritical) return 'escalate';
    if (hasMultipleHigh) return 'block';
    if (violations.length > 1) return 'warn';
    return 'monitor';
  }

  private updateHistory(violations: EnhancedSecurityViolation[], context: ViolationContext): void {
    // Add to global history
    this.history.violations.push(...violations);

    // Add to session correlation
    if (context.sessionId) {
      if (!this.history.sessionCorrelations.has(context.sessionId)) {
        this.history.sessionCorrelations.set(context.sessionId, []);
      }
      this.history.sessionCorrelations.get(context.sessionId)!.push(...violations);
    }

    // Add to client correlation
    if (context.clientId) {
      if (!this.history.clientCorrelations.has(context.clientId)) {
        this.history.clientCorrelations.set(context.clientId, []);
      }
      this.history.clientCorrelations.get(context.clientId)!.push(...violations);
    }

    // Clean old history (keep last 1000 violations)
    if (this.history.violations.length > 1000) {
      this.history.violations = this.history.violations.slice(-1000);
    }
  }

  private async findHistoricalCorrelations(
    violations: EnhancedSecurityViolation[], 
    context: ViolationContext
  ): Promise<AttackCorrelation[]> {
    const correlations: AttackCorrelation[] = [];

    // Check session-based correlations
    if (context.sessionId) {
      const sessionViolations = this.history.sessionCorrelations.get(context.sessionId) || [];
      if (sessionViolations.length > 0) {
        correlations.push({
          correlationId: this.generateCorrelationId(),
          violations: [...sessionViolations, ...violations],
          attackPattern: 'session-based-attack',
          combinedRiskScore: this.calculateCombinedRisk([...sessionViolations, ...violations]),
          sophisticationLevel: 'intermediate',
          recommendedResponse: 'warn'
        });
      }
    }

    // Check client-based correlations  
    if (context.clientId) {
      const clientViolations = this.history.clientCorrelations.get(context.clientId) || [];
      const recentClientViolations = clientViolations.filter(
        v => Date.now() - v.timestamp.getTime() < this.correlationTimeWindow
      );
      
      if (recentClientViolations.length > 0) {
        correlations.push({
          correlationId: this.generateCorrelationId(),
          violations: [...recentClientViolations, ...violations],
          attackPattern: 'persistent-client-attack',
          combinedRiskScore: this.calculateCombinedRisk([...recentClientViolations, ...violations]),
          sophisticationLevel: 'advanced',
          recommendedResponse: 'block'
        });
      }
    }

    return correlations;
  }
}

/**
 * Default security violation detector instance
 */
export const defaultSecurityViolationDetector = new SecurityViolationDetector();
