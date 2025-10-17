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
  DOUBLE_ENCODED: /%252e%252e(%252f|%255c)/gi,
  
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
 * Input validation patterns
 * Common patterns for validating user inputs
 */
export const INPUT_VALIDATION_PATTERNS = {
  // Safe project names
  SAFE_PROJECT_NAME: /^[a-zA-Z0-9\-_\.]+$/,
  
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
 * Combined security pattern validator
 * Analyzes input against all security patterns and returns detailed results
 */
export interface SecurityViolation {
  type: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface SecurityAnalysisResult {
  isSecure: boolean;
  violations: SecurityViolation[];
  riskScore: number; // 0-100
  sanitizedInput?: string;
}

/**
 * Analyzes input for security violations
 */
export function analyzeInputSecurity(input: string): SecurityAnalysisResult {
  // Handle null/undefined inputs
  if (input == null) {
    return {
      isSecure: true,
      violations: [],
      riskScore: 0,
      sanitizedInput: ''
    };
  }
  const violations: SecurityViolation[] = [];
  let riskScore = 0;

  // Check path traversal
  if (PATH_TRAVERSAL_PATTERNS.DOTDOT_SLASH.test(input)) {
    violations.push({
      type: 'path-traversal',
      pattern: 'directory-traversal',
      severity: 'critical',
      description: 'Directory traversal attempt detected',
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

  return {
    isSecure: violations.length === 0,
    violations,
    riskScore: Math.min(riskScore, 100),
    sanitizedInput: violations.length > 0 ? sanitizeInput(input) : input
  };
}

/**
 * Sanitizes input by removing or escaping dangerous patterns
 */
export function sanitizeInput(input: string): string {
  // Handle null/undefined inputs
  if (input == null) {
    return '';
  }
  
  let sanitized = input;

  // Remove path traversal attempts
  sanitized = sanitized.replace(PATH_TRAVERSAL_PATTERNS.DOTDOT_SLASH, '');
  sanitized = sanitized.replace(PATH_TRAVERSAL_PATTERNS.NULL_BYTE, '');

  // Escape shell metacharacters
  sanitized = sanitized.replace(/([;&|`$(){}[\]<>])/g, '\\$1');

  // Remove dangerous commands
  sanitized = sanitized.replace(COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS, '');

  return sanitized;
}

/**
 * Validates if a path is safe for file operations
 */
export function isPathSafe(path: string): boolean {
  if (path == null) return false;
  const analysis = analyzeInputSecurity(path);
  return analysis.isSecure && analysis.riskScore < 10;
}

/**
 * Validates if a command is safe for execution
 */
export function isCommandSafe(command: string): boolean {
  if (command == null) return true;
  
  const analysis = analyzeInputSecurity(command);
  const hasCommandInjection = analysis.violations.some(v => v.type === 'command-injection');
  const hasPrivilegeEscalation = analysis.violations.some(v => v.type === 'privilege-escalation');
  
  // Also check for dangerous commands directly
  const hasDangerousCommand = COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS.test(command);
  
  return !hasCommandInjection && !hasPrivilegeEscalation && !hasDangerousCommand;
}

/**
 * Validates if a project name is safe
 */
export function isProjectNameSafe(name: string): boolean {
  if (name == null) return false;
  return INPUT_VALIDATION_PATTERNS.SAFE_PROJECT_NAME.test(name) && 
         analyzeInputSecurity(name).isSecure;
}