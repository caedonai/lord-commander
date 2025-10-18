/**
 * Enhanced Framework Detection with Security Validation
 * 
 * This module extends the basic framework patterns with comprehensive security
 * validation to prevent attacks through malicious framework configurations.
 * 
 * @security This module validates framework configs before trusting them
 * @see Task 1.1.3: Framework Detection Patterns
 */

import { readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { FRAMEWORK_PATTERNS } from './constants.js';
import { analyzeInputSecurity, isPathSafe, isCommandSafe } from './security-patterns.js';
import { ERROR_MESSAGES } from './constants.js';

/**
 * Security validation result for framework detection
 */
export interface FrameworkSecurityResult {
  isSecure: boolean;
  violations: FrameworkSecurityViolation[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Framework security violation details
 */
export interface FrameworkSecurityViolation {
  type: FrameworkViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  file?: string;
  configKey?: string;
  value?: string;
}

/**
 * Types of framework security violations
 */
export type FrameworkViolationType = 
  | 'malicious-config-path'
  | 'suspicious-dependency'
  | 'unsafe-build-command'
  | 'privilege-escalation'
  | 'path-traversal'
  | 'script-injection'
  | 'untrusted-source'
  | 'config-tampering';

/**
 * Framework pattern type with optional properties
 */
type FrameworkPattern = {
  files?: readonly string[];
  dependencies?: readonly string[];
  devDependencies?: readonly string[];
  directories?: readonly string[];
};

/**
 * Enhanced framework detection result with security validation
 */
export interface SecureFrameworkInfo {
  name: string;
  pattern: FrameworkPattern;
  configFiles: string[];
  security: FrameworkSecurityResult;
  dependencies: FrameworkDependencyInfo;
  buildConfig: FrameworkBuildConfig;
  isValid: boolean;
}

/**
 * Framework dependency information with security analysis
 */
export interface FrameworkDependencyInfo {
  production: string[];
  development: string[];
  suspicious: string[];
  trusted: string[];
  security: {
    hasUnknownDeps: boolean;
    hasSuspiciousDeps: boolean;
    untrustedSources: string[];
  };
}

/**
 * Framework build configuration with security validation
 */
export interface FrameworkBuildConfig {
  buildCommand?: string;
  devCommand?: string;
  outputDir?: string;
  scripts: Record<string, string>;
  security: {
    hasSafeCommands: boolean;
    suspiciousScripts: string[];
    privilegeEscalation: string[];
  };
}

/**
 * Whitelist of trusted framework dependencies
 * These are well-known, audited packages from major frameworks
 */
export const TRUSTED_FRAMEWORK_DEPENDENCIES = new Set([
  // React ecosystem
  'react', 'react-dom', '@types/react', '@types/react-dom',
  
  // Next.js ecosystem
  'next', '@next/env', '@next/bundle-analyzer',
  
  // Vue ecosystem
  'vue', '@vue/cli-service', 'vue-router', 'vuex',
  
  // Angular ecosystem
  '@angular/core', '@angular/cli', '@angular/common', '@angular/router',
  
  // Svelte ecosystem
  'svelte', '@sveltejs/kit', '@sveltejs/adapter-auto',
  
  // Build tools
  'vite', 'webpack', 'rollup', 'esbuild', 'parcel',
  
  // Astro ecosystem
  'astro', '@astrojs/node', '@astrojs/react',
  
  // Remix ecosystem
  '@remix-run/node', '@remix-run/react', '@remix-run/serve',
  
  // Nuxt ecosystem
  'nuxt', 'nuxt3', '@nuxt/kit',
  
  // Server frameworks
  'express', 'fastify', 'koa', 'hapi',
  
  // TypeScript
  'typescript', '@types/node',
  
  // Testing frameworks
  'vitest', 'jest', '@testing-library/react'
]);

/**
 * Patterns for detecting suspicious dependency names
 */
export const SUSPICIOUS_DEPENDENCY_PATTERNS = [
  /^evil-|^malicious-|^hack-/i,
  /backdoor|trojan|virus|malware/i,
  /^test-|^demo-|^example-/i, // Often used for typosquatting
  /^\.|^_/, // Hidden or internal packages
  /[0-9]+[a-z]+[0-9]+/, // Suspicious version-like names
  /^[a-z]$|^[a-z]{1,2}$/, // Very short names (often typosquatting)
];

/**
 * Dangerous script patterns that indicate potential security issues
 */
export const DANGEROUS_SCRIPT_PATTERNS = [
  /sudo|su\s+/,
  /rm\s+-rf|rmdir/,
  /chmod\s+777|chmod\s+\+x/,
  /wget|curl.*\|.*sh/,
  /eval|exec/,
  />\s*\/dev\/null.*&/,
  /nohup.*&/,
  /nc\s+.*-e|netcat.*-e/,
  /bash\s+-i|sh\s+-i/,
];

/**
 * Securely detect framework in a project directory
 * 
 * @param projectPath - Path to the project directory
 * @returns Promise<SecureFrameworkInfo | null> - Detected framework with security validation
 * 
 * @example
 * ```typescript
 * const framework = await detectFrameworkSecurely('./my-project');
 * if (framework && framework.isValid) {
 *   console.log(`Detected secure ${framework.name} project`);
 * } else {
 *   console.warn('Framework detection failed security validation');
 * }
 * ```
 */
export async function detectFrameworkSecurely(
  projectPath: string
): Promise<SecureFrameworkInfo | null> {
  // Validate project path for security BEFORE resolving
  if (!isPathSafe(projectPath)) {
    throw new Error(ERROR_MESSAGES.INVALID_COMMAND_PATH(projectPath));
  }

  const resolvedPath = resolve(projectPath);
  
  // Also validate resolved path for additional security
  if (!isPathSafe(resolvedPath)) {
    throw new Error(ERROR_MESSAGES.INVALID_COMMAND_PATH(resolvedPath));
  }

  try {
    // Check if directory exists and is accessible
    const stat_result = await stat(resolvedPath);
    if (!stat_result.isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }

  // Try to detect framework using existing patterns
  // Sort frameworks by specificity (most specific first to avoid false positives)
  const sortedFrameworks = Object.entries(FRAMEWORK_PATTERNS).sort(([_a, patternA], [_b, patternB]) => {
    const aFiles = 'files' in patternA ? patternA.files?.length || 0 : 0;
    const aDirs = 'directories' in patternA ? patternA.directories?.length || 0 : 0;
    const aSpecificity = aFiles + aDirs;
    
    const bFiles = 'files' in patternB ? patternB.files?.length || 0 : 0;
    const bDirs = 'directories' in patternB ? patternB.directories?.length || 0 : 0;
    const bSpecificity = bFiles + bDirs;
    
    return bSpecificity - aSpecificity; // Higher specificity first
  });

  for (const [frameworkName, pattern] of sortedFrameworks) {
    const detectionResult = await validateFrameworkPattern(
      resolvedPath,
      frameworkName,
      pattern as FrameworkPattern
    );

    if (detectionResult) {
      return detectionResult;
    }
  }

  return null;
}

/**
 * Validate a specific framework pattern against a project directory
 * 
 * @param projectPath - Resolved project directory path
 * @param frameworkName - Name of the framework
 * @param pattern - Framework detection pattern
 * @returns Promise<SecureFrameworkInfo | null> - Validation result
 */
async function validateFrameworkPattern(
  projectPath: string,
  frameworkName: string,
  pattern: FrameworkPattern
): Promise<SecureFrameworkInfo | null> {
  let matchedConfigFiles: string[] = [];
  let hasValidDependencies = false;

  // Check for config files (safely handle optional files property)
  const patternFiles = 'files' in pattern ? pattern.files : undefined;
  if (patternFiles && Array.isArray(patternFiles)) {
    for (const file of patternFiles) {
      const filePath = join(projectPath, file);
      try {
        await stat(filePath);
        
        // Always add config file if it exists, but track security status
        matchedConfigFiles.push(file);
      } catch {
        // File doesn't exist, continue
      }
    }
  }

  // Check package.json for dependencies
  const dependencyInfo = await analyzeDependencies(projectPath, pattern);
  
  // Check if this framework's specific dependencies are present
  const patternDependencies = 'dependencies' in pattern ? pattern.dependencies : undefined;
  if (patternDependencies && Array.isArray(patternDependencies)) {
    // Framework is valid only if it has its specific dependencies
    hasValidDependencies = patternDependencies.some(requiredDep =>
      dependencyInfo.trusted.includes(requiredDep)
    );
  } else {
    // If framework has no specific dependencies defined, any trusted deps are valid
    hasValidDependencies = dependencyInfo.trusted.length > 0;
  }

  // Must have either valid config files or framework-specific dependencies
  if (matchedConfigFiles.length === 0 && !hasValidDependencies) {
    return null;
  }

  // Analyze build configuration
  const buildConfig = await analyzeBuildConfig(projectPath);

  // Perform comprehensive security validation
  const securityResult = await validateFrameworkSecurity(
    projectPath,
    matchedConfigFiles,
    dependencyInfo,
    buildConfig
  );

  return {
    name: frameworkName,
    pattern,
    configFiles: matchedConfigFiles,
    dependencies: dependencyInfo,
    buildConfig,
    security: securityResult,
    isValid: securityResult.isSecure && securityResult.violations.length === 0
  };
}

/**
 * Validate security of a framework configuration file
 * 
 * @param configPath - Path to configuration file
 * @returns Promise<FrameworkSecurityResult> - Security validation result
 */
async function validateConfigFile(configPath: string): Promise<FrameworkSecurityResult> {
  const violations: FrameworkSecurityViolation[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check if file path is secure
    if (!isPathSafe(configPath)) {
      violations.push({
        type: 'malicious-config-path',
        severity: 'critical',
        description: 'Configuration file path contains potentially malicious elements',
        file: configPath
      });
    }

    // Read and analyze config file content
    const content = await readFile(configPath, 'utf-8');
    
    // Check for script injection in config (but be lenient with legitimate config patterns)
    const inputAnalysis = analyzeInputSecurity(content);
    
    // Filter out violations that are acceptable in config files
    const dangerousViolations = inputAnalysis.violations.filter(v => {
      // Allow legitimate TypeScript/JavaScript patterns in config files
      if (v.type === 'command-injection' && /import\(['"][^'"]*['"]\)/.test(content)) {
        return false; // Allow import() statements
      }
      if (v.type === 'template-injection' && /@type\s*\{/.test(content)) {
        return false; // Allow TypeScript @type annotations
      }
      return true; // Keep other violations
    });
    
    if (dangerousViolations.length > 0) {
      violations.push({
        type: 'script-injection',
        severity: 'high',
        description: 'Configuration file contains potentially dangerous patterns',
        file: configPath
      });
    }

    // Check for dangerous eval/exec patterns
    if (/eval\s*\(|new\s+Function\s*\(|Function\s*\(/.test(content)) {
      violations.push({
        type: 'script-injection',
        severity: 'critical',
        description: 'Configuration file contains dynamic code execution patterns',
        file: configPath
      });
    }

    // Check for file size (prevent DoS through large configs)
    if (content.length > 1024 * 1024) { // 1MB limit
      warnings.push('Configuration file is unusually large');
    }

  } catch (error) {
    violations.push({
      type: 'config-tampering',
      severity: 'medium',
      description: `Failed to read configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      file: configPath
    });
  }

  return {
    isSecure: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
    violations,
    warnings,
    recommendations
  };
}

/**
 * Analyze dependencies in package.json for security issues
 * 
 * @param projectPath - Project directory path
 * @param pattern - Framework pattern to validate against
 * @returns Promise<FrameworkDependencyInfo> - Dependency analysis result
 */
async function analyzeDependencies(
  projectPath: string,
  pattern: FrameworkPattern
): Promise<FrameworkDependencyInfo> {
  const result: FrameworkDependencyInfo = {
    production: [],
    development: [],
    suspicious: [],
    trusted: [],
    security: {
      hasUnknownDeps: false,
      hasSuspiciousDeps: false,
      untrustedSources: []
    }
  };

  try {
    const packageJsonPath = join(projectPath, 'package.json');
    const packageContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    // Extract dependencies
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});

    result.production = deps;
    result.development = devDeps;

    // Check against trusted dependencies
    const allDeps = [...deps, ...devDeps];
    for (const dep of allDeps) {
      if (TRUSTED_FRAMEWORK_DEPENDENCIES.has(dep)) {
        result.trusted.push(dep);
      } else {
        result.security.hasUnknownDeps = true;
        
        // Check for suspicious patterns
        const isSuspicious = SUSPICIOUS_DEPENDENCY_PATTERNS.some(pattern => 
          pattern.test(dep)
        );
        
        if (isSuspicious) {
          result.suspicious.push(dep);
          result.security.hasSuspiciousDeps = true;
        }
      }
    }

    // Validate against expected framework dependencies
    const patternDependencies = 'dependencies' in pattern ? pattern.dependencies : undefined;
    if (patternDependencies && Array.isArray(patternDependencies)) {
      const hasRequiredDeps = patternDependencies.some(requiredDep =>
        result.trusted.includes(requiredDep)
      );
      
      if (!hasRequiredDeps) {
        result.security.untrustedSources.push('Missing expected framework dependencies');
      }
    }

  } catch (error) {
    result.security.untrustedSources.push('Failed to read package.json');
  }

  return result;
}

/**
 * Analyze build configuration for security issues
 * 
 * @param projectPath - Project directory path
 * @returns Promise<FrameworkBuildConfig> - Build configuration analysis
 */
async function analyzeBuildConfig(projectPath: string): Promise<FrameworkBuildConfig> {
  const result: FrameworkBuildConfig = {
    scripts: {},
    security: {
      hasSafeCommands: true,
      suspiciousScripts: [],
      privilegeEscalation: []
    }
  };

  try {
    const packageJsonPath = join(projectPath, 'package.json');
    const packageContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    result.scripts = packageJson.scripts || {};

    // Analyze scripts for security issues
    for (const [scriptName, scriptContent] of Object.entries(result.scripts)) {
      if (typeof scriptContent !== 'string') continue;

      // Check for dangerous patterns
      const hasDangerousPattern = DANGEROUS_SCRIPT_PATTERNS.some(pattern =>
        pattern.test(scriptContent)
      );

      if (hasDangerousPattern) {
        result.security.hasSafeCommands = false;
        result.security.suspiciousScripts.push(scriptName);
      }

      // Check for privilege escalation
      if (/sudo|su\s+/.test(scriptContent)) {
        result.security.privilegeEscalation.push(scriptName);
      }

      // Validate command safety
      if (!isCommandSafe(scriptContent)) {
        result.security.suspiciousScripts.push(scriptName);
        result.security.hasSafeCommands = false;
      }
    }

    // Extract common build commands
    result.buildCommand = result.scripts.build;
    result.devCommand = result.scripts.dev || result.scripts.start;

  } catch (error) {
    // Failed to read package.json, mark as unsafe
    result.security.hasSafeCommands = false;
  }

  return result;
}

/**
 * Perform comprehensive security validation of framework detection
 * 
 * @param _projectPath - Project directory path (reserved for future use)
 * @param configFiles - Detected configuration files
 * @param dependencies - Dependency analysis result
 * @param buildConfig - Build configuration analysis
 * @returns Promise<FrameworkSecurityResult> - Comprehensive security result
 */
async function validateFrameworkSecurity(
  _projectPath: string,
  configFiles: string[],
  dependencies: FrameworkDependencyInfo,
  buildConfig: FrameworkBuildConfig
): Promise<FrameworkSecurityResult> {
  const violations: FrameworkSecurityViolation[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check config file security
  for (const configFile of configFiles) {
    const configPath = join(_projectPath, configFile);
    const configSecurity = await validateConfigFile(configPath);
    
    violations.push(...configSecurity.violations);
    warnings.push(...configSecurity.warnings);
    recommendations.push(...configSecurity.recommendations);
  }

  // Check dependency security
  if (dependencies.security.hasSuspiciousDeps) {
    violations.push({
      type: 'suspicious-dependency',
      severity: 'high',
      description: `Suspicious dependencies detected: ${dependencies.suspicious.join(', ')}`,
      value: dependencies.suspicious.join(', ')
    });
  }

  if (dependencies.security.hasUnknownDeps && dependencies.trusted.length === 0) {
    violations.push({
      type: 'untrusted-source',
      severity: 'medium',
      description: 'No trusted framework dependencies found'
    });
  }

  // Check build script security
  if (!buildConfig.security.hasSafeCommands) {
    violations.push({
      type: 'unsafe-build-command',
      severity: 'high',
      description: `Unsafe build scripts detected: ${buildConfig.security.suspiciousScripts.join(', ')}`,
      value: buildConfig.security.suspiciousScripts.join(', ')
    });
  }

  if (buildConfig.security.privilegeEscalation.length > 0) {
    violations.push({
      type: 'privilege-escalation',
      severity: 'critical',
      description: `Scripts attempting privilege escalation: ${buildConfig.security.privilegeEscalation.join(', ')}`,
      value: buildConfig.security.privilegeEscalation.join(', ')
    });
  }

  // Add recommendations
  if (dependencies.security.hasUnknownDeps) {
    recommendations.push('Review unknown dependencies for security issues');
  }

  if (configFiles.length === 0) {
    warnings.push('No framework configuration files detected');
  }

  if (dependencies.trusted.length === 0) {
    warnings.push('No trusted framework dependencies found');
  }

  const criticalViolations = violations.filter(v => v.severity === 'critical').length;
  const highViolations = violations.filter(v => v.severity === 'high').length;

  return {
    isSecure: criticalViolations === 0 && highViolations === 0,
    violations,
    warnings,
    recommendations
  };
}

/**
 * Get security recommendations for a detected framework
 * 
 * @param frameworkInfo - Framework detection result
 * @returns string[] - Array of security recommendations
 * 
 * @example
 * ```typescript
 * const framework = await detectFrameworkSecurely('./project');
 * if (framework) {
 *   const recommendations = getFrameworkSecurityRecommendations(framework);
 *   recommendations.forEach(rec => console.log(`⚠️  ${rec}`));
 * }
 * ```
 */
export function getFrameworkSecurityRecommendations(
  frameworkInfo: SecureFrameworkInfo
): string[] {
  const recommendations: string[] = [];

  if (!frameworkInfo.isValid) {
    recommendations.push('Framework failed security validation - consider manual review');
  }

  if (frameworkInfo.dependencies.security.hasUnknownDeps) {
    recommendations.push('Audit unknown dependencies for security vulnerabilities');
  }

  if (!frameworkInfo.buildConfig.security.hasSafeCommands) {
    recommendations.push('Review build scripts for potential security issues');
  }

  if (frameworkInfo.security.violations.length > 0) {
    recommendations.push('Address security violations before proceeding');
  }

  // Framework-specific recommendations
  if (frameworkInfo.name === 'next.js') {
    recommendations.push('Ensure Next.js security headers are configured');
    recommendations.push('Review next.config.js for secure configuration');
  }

  if (frameworkInfo.name === 'express') {
    recommendations.push('Use helmet.js for Express security headers');
    recommendations.push('Validate all request inputs');
  }

  return recommendations;
}

/**
 * Validate if a framework is safe to use based on security analysis
 * 
 * @param frameworkInfo - Framework detection result
 * @param allowWarnings - Whether to allow frameworks with warnings
 * @returns boolean - True if framework is safe to use
 * 
 * @example
 * ```typescript
 * const framework = await detectFrameworkSecurely('./project');
 * if (framework && isFrameworkSafe(framework)) {
 *   console.log('Framework is safe to use');
 * } else {
 *   console.error('Framework security validation failed');
 * }
 * ```
 */
export function isFrameworkSafe(
  frameworkInfo: SecureFrameworkInfo,
  allowWarnings: boolean = true
): boolean {
  // Never allow frameworks with critical or high severity violations
  const criticalViolations = frameworkInfo.security.violations.filter(
    v => v.severity === 'critical' || v.severity === 'high'
  );

  if (criticalViolations.length > 0) {
    return false;
  }

  // Check if framework passed validation
  if (!frameworkInfo.isValid) {
    return false;
  }

  // If warnings are not allowed, check for medium severity violations
  if (!allowWarnings) {
    const mediumViolations = frameworkInfo.security.violations.filter(
      v => v.severity === 'medium'
    );
    return mediumViolations.length === 0;
  }

  return true;
}