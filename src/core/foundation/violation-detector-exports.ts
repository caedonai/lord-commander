/**
 * Security Violation Detector Export Module
 * 
 * This module provides a clean export of the SecurityViolationDetector
 * without naming conflicts with security-patterns.js
 */

export {
  SecurityViolationDetector,
  defaultSecurityViolationDetector,
  DEFAULT_RISK_SCORING_CONFIG,
  type EnhancedSecurityViolation,
  type ViolationContext,
  type ViolationAnalysisResult,
  type AttackCorrelation,
  type ThreatCategory,
  type ComplianceMapping,
  type RiskFactor,
  type RemediationSuggestion,
  type ComplianceAssessment,
  type RecommendedAction,
  type RiskScoringConfig
} from './security-violation-detector.js';