/**
 * Security pattern definitions for detecting malicious inputs and attack vectors
 * 
 * These patterns are used throughout the SDK to validate user inputs,
 * command arguments, file paths, and configuration values for security threats.
 */

/**
 * Path traversal attack patterns
 * Detects attempts to access files outside the intended directory
 */
export const PATH_TRAVERSAL_PATTERNS = {
  // Basic directory traversal
  DOTDOT_SLASH: /\.\.[\/\\]/g,
  DOTDOT_ENCODED: /%2e%2e(%2f|%5c)/gi,
  
  // Advanced traversal techniques
  UNICODE_TRAVERSAL: /\u002e\u002e[\u002f\u005c]/g,
  UNICODE_FULLWIDTH: /[\uFF0E\u2024]\u002E[\uFF0F\u2044\u002F\u005C]/g,
  UNICODE_VARIANTS: /[\u002E\uFF0E\u2024][\u002E\uFF0E\u2024][\u002F\uFF0F\u2044\u005C]/g,
  ZERO_WIDTH_INJECTION: /\.[\u200B\uFEFF]+\.[\u200B\uFEFF]*[\/\\]/g,
  DOUBLE_ENCODED: /%252e%252e(%252f|%255c)/gi,
  TRIPLE_ENCODED: /%25252e%25252e%25252f/gi,
  OVERLONG_UTF8: /%c0%ae%c0%ae/gi,
  OVERLONG_BACKSLASH: /%c1%9c/gi,
  MIXED_ENCODED: /\.\.(%252f|%252c|%2f|%5c|%c0%af)/gi,
  
  // Windows-specific traversal
  UNC_PATH: /^\\\\[^\\]+\\[^\\]/,
  DRIVE_ROOT: /^[a-zA-Z]:[\\\/]$/,
  
  // Unix-specific traversal
  ROOT_PATH: /^\/[^\/]/,
  TILDE_EXPANSION: /^~[\/\\]/,
  
  // Null byte injection (path truncation)
  NULL_BYTE: /\x00/g,
} as const;

/**
 * Command injection attack patterns
 * Detects attempts to inject shell commands or execute arbitrary code
 */
export const COMMAND_INJECTION_PATTERNS = {
  // Shell metacharacters
  SHELL_METACHARACTERS: /[;&|`$(){}[\]<>]/,
  
  // Command chaining
  COMMAND_CHAINING: /[;&|]{1,2}/,
  
  // Subprocess execution
  SUBPROCESS_EXECUTION: /\$\([^)]*\)/g,
  BACKTICK_EXECUTION: /`[^`]*`/g,
  
  // Redirection and piping
  REDIRECTION: /[<>]{1,2}/,
  PIPE_EXECUTION: /\|[^|]/,
  
  // Environment variable manipulation
  ENV_VAR_INJECTION: /\$\{[^}]*\}/g,
  PATH_MANIPULATION: /PATH\s*=|LD_PRELOAD\s*=|BASH_ENV\s*=|ENV\s*=/i,
  IFS_BYPASS: /\$IFS\$|\$\{IFS\}/g,
  QUOTE_ESCAPING: /\$['"][^'"]*['"]|\\\\/g,
  
  // Specific dangerous commands
  DANGEROUS_COMMANDS: /\b(rm|del|format|fdisk|mkfs|dd|cat|curl|wget|nc|netcat|telnet|ssh|ftp|tftp|eval|exec|system)\s/i,
} as const;

/**
 * Script injection attack patterns
 * Detects attempts to inject malicious scripts or code
 */
export const SCRIPT_INJECTION_PATTERNS = {
  // JavaScript injection
  JAVASCRIPT_EVAL: /\beval\s*\(/i,
  JAVASCRIPT_FUNCTION: /\bFunction\s*\(/i,
  JAVASCRIPT_SETTIMEOUT: /\bsetTimeout\s*\(/i,
  JAVASCRIPT_SETINTERVAL: /\bsetInterval\s*\(/i,
  
  // HTML/XML injection
  SCRIPT_TAG: /<script[^>]*>.*?<\/script>/gis,
  JAVASCRIPT_PROTOCOL: /javascript:/i,
  DATA_URI: /data:[^;]*;base64/i,
  
  // SQL injection patterns  
  SQL_KEYWORDS: /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi,
  SQL_COMMENTS: /(--|\/\*|\*\/|#)/,
  
  // NoSQL injection
  NOSQL_OPERATORS: /\$where|\$regex|\$ne|\$gt|\$lt/i,
  
  // Template injection
  TEMPLATE_INJECTION: /(\{\{.*?\}\}|\$\{.*?\})/g,
} as const;

/**
 * Privilege escalation attack patterns
 * Detects attempts to gain elevated privileges or access restricted resources
 */
export const PRIVILEGE_ESCALATION_PATTERNS = {
  // Sudo and su commands
  SUDO_COMMAND: /\bsudo\s/i,
  SU_COMMAND: /\bsu\s/i,
  
  // Windows elevation
  RUNAS_COMMAND: /\brunas\s/i,
  UAC_BYPASS: /\bbypassuac\b/i,
  
  // Process manipulation
  SETUID_COMMANDS: /\b(chmod\s+[0-7]*[4-7][0-7]*|chown\s+root)/i,
  
  // Service manipulation
  SERVICE_COMMANDS: /\b(systemctl|service|sc\.exe)\s/i,
  
  // Registry manipulation (Windows)
  REGISTRY_COMMANDS: /\b(reg\s+add|regedit)\s/i,
  
  // Kernel module loading
  KERNEL_MODULES: /\b(insmod|modprobe|rmmod)\s/i,
} as const;

/**
 * File system attack patterns
 * Detects attempts to access or manipulate sensitive files
 */
export const FILE_SYSTEM_PATTERNS = {
  // Sensitive system files (Unix)
  UNIX_SENSITIVE_FILES: /\/(etc\/passwd|etc\/shadow|etc\/hosts|root\/|proc\/|sys\/|dev\/)/i,
  
  // Sensitive system files (Windows)
  WINDOWS_SENSITIVE_FILES: /\\(windows\\system32|windows\\syswow64|program files|users\\[^\\]*\\desktop)/i,
  
  // Windows reserved device names
  WINDOWS_DEVICE_NAMES: /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,
  WINDOWS_DEVICE_VARIANTS: /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:[\s\.]|$)/i, // Fixed: device names at end or followed by space/dot
  
  // Windows filename edge cases (trailing dots/spaces that Windows strips)
  WINDOWS_FILENAME_EDGE_CASES: /[\s\.]+$/,
  
  // Configuration files
  CONFIG_FILES: /\.(conf|config|cfg|ini|env|key|pem|p12|pfx)$/i,
  
  // Backup and temporary files
  BACKUP_FILES: /\.(bak|backup|tmp|temp|old|orig|save)$/i,
  
  // Executable files
  EXECUTABLE_FILES: /\.(exe|bat|cmd|com|scr|pif|msi|dll|so|dylib)$/i,
} as const;

/**
 * Network attack patterns
 * Detects attempts to make unauthorized network connections
 */
export const NETWORK_PATTERNS = {
  // URLs with suspicious protocols
  SUSPICIOUS_PROTOCOLS: /^(file|ftp|gopher|ldap|dict|telnet|ssh):/i,
  
  // Private IP addresses (RFC 1918)
  PRIVATE_IPS: /\b(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/,
  
  // Localhost variations
  LOCALHOST_VARIANTS: /\b(localhost|127\.|0\.0\.0\.0|::1)/i,
  
  // Suspicious ports
  SUSPICIOUS_PORTS: /:(22|23|53|135|139|445|1433|1521|3306|3389|5432|5900|6379)\b/,
} as const;

/**
 * Advanced security attack patterns
 * Detects sophisticated attacks and bypass attempts
 */
export const ADVANCED_ATTACK_PATTERNS = {
  // Homograph attacks using similar-looking characters
  HOMOGRAPH_CYRILLIC: /[а-яё]/gi, // Cyrillic characters
  HOMOGRAPH_GREEK: /[α-ωΑ-Ω]/g,   // Greek characters
  HOMOGRAPH_MIXED: /[а-яёα-ωΑ-Ω]/g, // Mixed homograph scripts
  
  // Bidirectional text attacks
  BIDI_OVERRIDE: /[\u202A-\u202E\u2066-\u2069\u061C]/g,
  
  // Prototype pollution attempts
  PROTOTYPE_POLLUTION: /__proto__|constructor\.prototype|\.prototype\.|\.constructor/gi,
  
  // Zero-width and invisible characters
  ZERO_WIDTH_CHARS: /[\u200B-\u200D\uFEFF\u2060]/g,
} as const;

/**
 * Input validation patterns
 * Common patterns for validating user inputs
 */
export const INPUT_VALIDATION_PATTERNS = {
  // Safe project names
  SAFE_PROJECT_NAME: /^[a-zA-Z0-9\-_\.àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŸ]+$/,
  
  // Safe file names
  SAFE_FILE_NAME: /^[a-zA-Z0-9\-_\.\s]+$/,
  
  // Safe package manager names
  SAFE_PACKAGE_MANAGER: /^(npm|pnpm|yarn|bun)$/,
  
  // Email validation (basic)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // URL validation (basic)
  URL: /^https?:\/\/[^\s]+$/,
} as const;

/**
 * Represents a single security violation detected in input analysis
 * 
 * @interface SecurityViolation
 */
export interface SecurityViolation {
  /** The category of security violation (e.g., 'path-traversal', 'command-injection') */
  type: string;
  /** The specific pattern that was matched (e.g., 'directory-traversal', 'shell-metacharacters') */
  pattern: string;
  /** The severity level of the violation */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Human-readable description of what was detected */
  description: string;
  /** Recommended action to fix the violation */
  recommendation: string;
}

/**
 * Result of comprehensive security analysis on input
 * 
 * @interface SecurityAnalysisResult
 */
export interface SecurityAnalysisResult {
  /** Whether the input passed all security checks */
  isSecure: boolean;
  /** Array of all security violations found */
  violations: SecurityViolation[];
  /** Risk score from 0-100, where 100 is maximum risk */
  riskScore: number;
  /** Sanitized version of the input with dangerous patterns removed/escaped */
  sanitizedInput?: string;
}

/**
 * Analyzes input string for security violations across all attack categories
 * 
 * Performs comprehensive security analysis checking for:
 * - Path traversal attacks (../../../, encoded variants)
 * - Command injection attempts (shell metacharacters, dangerous commands)
 * - Script injection (eval usage, template injection)
 * - Privilege escalation (sudo, runas commands)
 * - Sensitive file access attempts
 * 
 * @param input - The input string to analyze for security threats
 * @returns SecurityAnalysisResult with violations, risk score, and sanitized input
 * 
 * @example
 * ```typescript
 * const result = analyzeInputSecurity("rm -rf /");
 * // Returns: { isSecure: false, violations: [...], riskScore: 40, sanitizedInput: "" }
 * 
 * const safe = analyzeInputSecurity("my-project-name");
 * // Returns: { isSecure: true, violations: [], riskScore: 0, sanitizedInput: "my-project-name" }
 * ```
 */
export function analyzeInputSecurity(input: string): SecurityAnalysisResult {
  // Handle null/undefined and non-string inputs
  if (input == null || typeof input !== 'string') {
    return {
      isSecure: true,
      violations: [],
      riskScore: 0,
      sanitizedInput: ''
    };
  }
  const violations: SecurityViolation[] = [];
  let riskScore = 0;

  // Check path traversal (basic and encoded variants)
  const pathTraversalPatterns = [
    PATH_TRAVERSAL_PATTERNS.DOTDOT_SLASH,
    PATH_TRAVERSAL_PATTERNS.DOTDOT_ENCODED,
    PATH_TRAVERSAL_PATTERNS.DOUBLE_ENCODED,
    PATH_TRAVERSAL_PATTERNS.TRIPLE_ENCODED,
    PATH_TRAVERSAL_PATTERNS.OVERLONG_UTF8,
    PATH_TRAVERSAL_PATTERNS.OVERLONG_BACKSLASH,
    PATH_TRAVERSAL_PATTERNS.MIXED_ENCODED,
    PATH_TRAVERSAL_PATTERNS.UNICODE_TRAVERSAL,
    PATH_TRAVERSAL_PATTERNS.UNICODE_FULLWIDTH,
    PATH_TRAVERSAL_PATTERNS.UNICODE_VARIANTS,
    PATH_TRAVERSAL_PATTERNS.ZERO_WIDTH_INJECTION,
    PATH_TRAVERSAL_PATTERNS.UNC_PATH,
    PATH_TRAVERSAL_PATTERNS.DRIVE_ROOT,
    PATH_TRAVERSAL_PATTERNS.ROOT_PATH,
    PATH_TRAVERSAL_PATTERNS.TILDE_EXPANSION
  ];
  
  if (pathTraversalPatterns.some(pattern => pattern.test(input))) {
    violations.push({
      type: 'path-traversal',
      pattern: 'directory-traversal',
      severity: 'critical',
      description: 'Directory traversal attempt detected (including Unicode variants)',
      recommendation: 'Use relative paths within project directory only'
    });
    riskScore += 40;
  }

  // Check command injection
  if (COMMAND_INJECTION_PATTERNS.SHELL_METACHARACTERS.test(input)) {
    violations.push({
      type: 'command-injection',
      pattern: 'shell-metacharacters',
      severity: 'high',
      description: 'Shell metacharacters detected',
      recommendation: 'Remove or escape shell special characters'
    });
    riskScore += 30;
  }

  // Check advanced command injection (environment variables, IFS bypass)
  if (COMMAND_INJECTION_PATTERNS.PATH_MANIPULATION.test(input) || 
      COMMAND_INJECTION_PATTERNS.IFS_BYPASS.test(input) ||
      COMMAND_INJECTION_PATTERNS.QUOTE_ESCAPING.test(input)) {
    violations.push({
      type: 'command-injection',
      pattern: 'advanced-injection',
      severity: 'critical',
      description: 'Advanced command injection attempt detected',
      recommendation: 'Use parameterized commands and avoid environment variable manipulation'
    });
    riskScore += 45;
  }

  // Check for dangerous commands
  if (COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS.test(input)) {
    violations.push({
      type: 'command-injection',
      pattern: 'dangerous-commands',
      severity: 'critical',
      description: 'Dangerous command detected',
      recommendation: 'Use safe alternatives or whitelist trusted commands'
    });
    riskScore += 40;
  }

  // Check script injection
  if (SCRIPT_INJECTION_PATTERNS.JAVASCRIPT_EVAL.test(input)) {
    violations.push({
      type: 'script-injection',
      pattern: 'eval-usage',
      severity: 'critical',
      description: 'Eval function usage detected',
      recommendation: 'Never use eval() with user input'
    });
    riskScore += 50;
  }

  // Check privilege escalation
  if (PRIVILEGE_ESCALATION_PATTERNS.SUDO_COMMAND.test(input)) {
    violations.push({
      type: 'privilege-escalation',
      pattern: 'sudo-command',
      severity: 'high',
      description: 'Privilege escalation attempt detected',
      recommendation: 'Run with appropriate user permissions'
    });
    riskScore += 35;
  }

  // Check file system access
  if (FILE_SYSTEM_PATTERNS.UNIX_SENSITIVE_FILES.test(input) || 
      FILE_SYSTEM_PATTERNS.WINDOWS_SENSITIVE_FILES.test(input)) {
    violations.push({
      type: 'file-system',
      pattern: 'sensitive-file-access',
      severity: 'critical',
      description: 'Access to sensitive system files detected',
      recommendation: 'Restrict access to application directories only'
    });
    riskScore += 45;
  }

  // Check Windows device names
  if (FILE_SYSTEM_PATTERNS.WINDOWS_DEVICE_NAMES.test(input) ||
      FILE_SYSTEM_PATTERNS.WINDOWS_DEVICE_VARIANTS.test(input)) {
    violations.push({
      type: 'file-system',
      pattern: 'windows-device-names',
      severity: 'medium',
      description: 'Windows reserved device name detected',
      recommendation: 'Avoid using Windows reserved names (CON, PRN, AUX, etc.)'
    });
    riskScore += 20;
  }

  // Check Windows filename edge cases (trailing dots/spaces)
  if (FILE_SYSTEM_PATTERNS.WINDOWS_FILENAME_EDGE_CASES.test(input)) {
    violations.push({
      type: 'file-system',
      pattern: 'windows-filename-edge-cases',
      severity: 'low',
      description: 'Windows filename edge case detected (trailing dots/spaces)',
      recommendation: 'Remove trailing dots and spaces from filenames'
    });
    riskScore += 10;
  }

  // Check advanced attacks
  ADVANCED_ATTACK_PATTERNS.HOMOGRAPH_MIXED.lastIndex = 0; // Reset global regex state
  if (ADVANCED_ATTACK_PATTERNS.HOMOGRAPH_MIXED.test(input)) {
    violations.push({
      type: 'advanced-attack',
      pattern: 'homograph-attack',
      severity: 'high',
      description: 'Homograph attack using non-Latin characters detected',
      recommendation: 'Use only Latin characters for identifiers'
    });
    riskScore += 35;
  }

  ADVANCED_ATTACK_PATTERNS.BIDI_OVERRIDE.lastIndex = 0; // Reset global regex state
  if (ADVANCED_ATTACK_PATTERNS.BIDI_OVERRIDE.test(input)) {
    violations.push({
      type: 'advanced-attack',
      pattern: 'bidirectional-text',
      severity: 'high',
      description: 'Bidirectional text override attack detected',
      recommendation: 'Remove bidirectional control characters'
    });
    riskScore += 35;
  }

  ADVANCED_ATTACK_PATTERNS.PROTOTYPE_POLLUTION.lastIndex = 0; // Reset global regex state
  if (ADVANCED_ATTACK_PATTERNS.PROTOTYPE_POLLUTION.test(input)) {
    violations.push({
      type: 'advanced-attack',
      pattern: 'prototype-pollution',
      severity: 'high',
      description: 'Prototype pollution attempt detected',
      recommendation: 'Avoid accessing object prototype properties'
    });
    riskScore += 35;
  }

  return {
    isSecure: violations.length === 0,
    violations,
    riskScore: Math.min(riskScore, 100),
    sanitizedInput: violations.length > 0 ? sanitizeInput(input) : input
  };
}

/**
 * Sanitizes input string by removing or escaping dangerous patterns
 * 
 * Applies the following sanitization rules:
 * - Removes path traversal sequences (../)
 * - Removes null bytes that could truncate paths
 * - Escapes shell metacharacters with backslashes
 * - Removes dangerous command patterns
 * - Removes JavaScript injection patterns
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string with dangerous patterns removed/escaped
 * 
 * @example
 * ```typescript
 * const dangerous = "../../etc/passwd; rm -rf /";
 * const safe = sanitizeInput(dangerous);
 * // Returns: "etc/passwd\\;  /"
 * ```
 */
export function sanitizeInput(input: string): string {
  // Handle null/undefined and non-string inputs
  if (input == null || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input;

  // Remove path traversal attempts (including encoded variants)
  const pathTraversalPatterns = [
    PATH_TRAVERSAL_PATTERNS.DOTDOT_SLASH,
    PATH_TRAVERSAL_PATTERNS.DOTDOT_ENCODED,
    PATH_TRAVERSAL_PATTERNS.DOUBLE_ENCODED,
    PATH_TRAVERSAL_PATTERNS.TRIPLE_ENCODED,
    PATH_TRAVERSAL_PATTERNS.OVERLONG_UTF8,
    PATH_TRAVERSAL_PATTERNS.OVERLONG_BACKSLASH,
    PATH_TRAVERSAL_PATTERNS.MIXED_ENCODED,
    PATH_TRAVERSAL_PATTERNS.UNICODE_TRAVERSAL,
    PATH_TRAVERSAL_PATTERNS.UNICODE_FULLWIDTH,
    PATH_TRAVERSAL_PATTERNS.UNICODE_VARIANTS,
    PATH_TRAVERSAL_PATTERNS.ZERO_WIDTH_INJECTION,
    PATH_TRAVERSAL_PATTERNS.NULL_BYTE
  ];
  
  pathTraversalPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove JavaScript injection patterns
  sanitized = sanitized.replace(SCRIPT_INJECTION_PATTERNS.JAVASCRIPT_EVAL, '');
  sanitized = sanitized.replace(SCRIPT_INJECTION_PATTERNS.JAVASCRIPT_FUNCTION, '');
  sanitized = sanitized.replace(SCRIPT_INJECTION_PATTERNS.SCRIPT_TAG, '');
  sanitized = sanitized.replace(SCRIPT_INJECTION_PATTERNS.SQL_KEYWORDS, '');
  sanitized = sanitized.replace(SCRIPT_INJECTION_PATTERNS.NOSQL_OPERATORS, '');
  sanitized = sanitized.replace(SCRIPT_INJECTION_PATTERNS.TEMPLATE_INJECTION, '');

  // Remove shell metacharacters entirely instead of escaping (more secure for edge cases)
  sanitized = sanitized.replace(/[;&|`$(){}[\]<>]/g, '');

  // Remove dangerous commands and keywords
  sanitized = sanitized.replace(COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS, '');
  sanitized = sanitized.replace(/\b(eval|alert|script|exec|system|rm|del)\b/gi, '');

  // Remove advanced attack patterns
  sanitized = sanitized.replace(COMMAND_INJECTION_PATTERNS.PATH_MANIPULATION, '');
  sanitized = sanitized.replace(COMMAND_INJECTION_PATTERNS.IFS_BYPASS, '');
  sanitized = sanitized.replace(ADVANCED_ATTACK_PATTERNS.BIDI_OVERRIDE, '');
  sanitized = sanitized.replace(ADVANCED_ATTACK_PATTERNS.ZERO_WIDTH_CHARS, '');
  sanitized = sanitized.replace(ADVANCED_ATTACK_PATTERNS.PROTOTYPE_POLLUTION, '');

  // Normalize homograph characters to safe Latin equivalents
  sanitized = sanitized.replace(ADVANCED_ATTACK_PATTERNS.HOMOGRAPH_CYRILLIC, match => {
    // Simple Cyrillic to Latin mapping for common homographs
    const cyrillicToLatin: Record<string, string> = {
      'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x'
    };
    return cyrillicToLatin[match.toLowerCase()] || '';
  });

  sanitized = sanitized.replace(ADVANCED_ATTACK_PATTERNS.HOMOGRAPH_GREEK, match => {
    // Simple Greek to Latin mapping for common homographs  
    const greekToLatin: Record<string, string> = {
      'α': 'a', 'ο': 'o', 'ρ': 'p', 'υ': 'y', 'Α': 'A', 'Ο': 'O', 'Ρ': 'P'
    };
    return greekToLatin[match] || '';
  });

  return sanitized;
}

/**
 * Validates if a file path is safe for file system operations
 * 
 * Checks path against all security patterns and ensures low risk score.
 * Safe paths must not contain directory traversal, absolute paths,
 * or references to sensitive system locations.
 * 
 * @param path - The file path to validate
 * @returns true if path is safe for file operations, false otherwise
 * 
 * @example
 * ```typescript
 * isPathSafe("./src/components/Button.tsx"); // true
 * isPathSafe("../../../etc/passwd");         // false
 * isPathSafe("C:\\Windows\\System32");       // false
 * ```
 */
export function isPathSafe(path: string): boolean {
  const { isValidType, analysis } = validateInputType(path);
  if (!isValidType) return false;
  
  return analysis!.isSecure && analysis!.riskScore < 10;
}

/**
 * Validates if a command string is safe for shell execution
 * 
 * Checks for command injection attempts, privilege escalation,
 * and dangerous command patterns. Safe commands should not
 * contain shell metacharacters or system-level operations.
 * 
 * @param command - The command string to validate
 * @returns true if command is safe to execute, false otherwise
 * 
 * @example
 * ```typescript
 * isCommandSafe("npm install");           // true
 * isCommandSafe("rm -rf /");              // false
 * isCommandSafe("cmd; cat /etc/passwd");  // false
 * ```
 */
export function isCommandSafe(command: string): boolean {
  const { isValidType, analysis } = validateInputType(command);
  if (!isValidType) return true; // null/undefined commands are safe (no-op)
  
  const hasCommandInjection = analysis!.violations.some(v => v.type === 'command-injection');
  const hasPrivilegeEscalation = analysis!.violations.some(v => v.type === 'privilege-escalation');
  
  // Also check for dangerous commands directly
  const hasDangerousCommand = COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS.test(command);
  
  return !hasCommandInjection && !hasPrivilegeEscalation && !hasDangerousCommand;
}

/**
 * Helper function to validate input type and perform security analysis
 * @private
 */
function validateInputType(input: any): { isValidType: boolean; analysis?: SecurityAnalysisResult } {
  if (input == null || typeof input !== 'string') {
    return { isValidType: false };
  }
  return { isValidType: true, analysis: analyzeInputSecurity(input) };
}

/**
 * Validates if a project name follows safe naming conventions
 * 
 * Safe project names must:
 * - Contain only alphanumeric characters, hyphens, underscores, and dots
 * - Pass all security pattern checks
 * - Not contain any injection attempts or traversal patterns
 * 
 * @param name - The project name to validate
 * @returns true if project name is safe, false otherwise
 * 
 * @example
 * ```typescript
 * isProjectNameSafe("my-awesome-project");  // true
 * isProjectNameSafe("my_project.v2");       // true
 * isProjectNameSafe("../../../etc");        // false
 * isProjectNameSafe("project; rm -rf /");   // false
 * ```
 */
export function isProjectNameSafe(name: string): boolean {
  const { isValidType, analysis } = validateInputType(name);
  if (!isValidType) return false;
  
  return INPUT_VALIDATION_PATTERNS.SAFE_PROJECT_NAME.test(name) && 
         analysis!.isSecure;
}