/**
 * Foundation utilities - Core infrastructure and shared components
 * 
 * These modules provide the foundational building blocks that other
 * parts of the SDK depend on: constants, types, and error handling.
 */

// Export all constants and types
export * from './constants.js';

// Export error handling utilities
export * from './errors.js';

// Export log security utilities
export * from './log-security.js';

// Export security patterns for input validation
export * from './security-patterns.js';
export { ADVANCED_ATTACK_PATTERNS } from './security-patterns.js';

// Export comprehensive security violation detection system (Task 1.2.2)
export * from './violation-detector-exports.js';

// Export framework security detection utilities
export * from './framework-security.js';

// Export input validation utilities
export * from './input-validation.js';

// Export error sanitization utilities
export * from './error-sanitization.js';