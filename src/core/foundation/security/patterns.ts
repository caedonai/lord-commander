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
  DOTDOT_SLASH: /\.\.[/\\]/g,
  DOTDOT_ENCODED: /%2e%2e(%2f|%5c)/gi,

  // Advanced traversal techniques
  UNICODE_TRAVERSAL: /\u002e\u002e[\u002f\u005c]/g,
  UNICODE_FULLWIDTH: /[\uFF0E\u2024]\u002E[\uFF0F\u2044\u002F\u005C]/g,
  UNICODE_VARIANTS: /[\u002E\uFF0E\u2024][\u002E\uFF0E\u2024][\u002F\uFF0F\u2044\u005C]/g,
  ZERO_WIDTH_INJECTION: /\.[\u200B\uFEFF]+\.[\u200B\uFEFF]*[/\\]/g,
  DOUBLE_ENCODED: /%252e%252e(%252f|%255c)/gi,
  TRIPLE_ENCODED: /%25252e%25252e%25252f/gi,
  OVERLONG_UTF8: /%c0%ae%c0%ae/gi,
  OVERLONG_BACKSLASH: /%c1%9c/gi,
  MIXED_ENCODED: /\.\.(%252f|%252c|%2f|%5c|%c0%af)/gi,

  // Windows-specific traversal
  UNC_PATH: /^\\\\[^\\]+\\[^\\]/,
  DRIVE_ROOT: /^[a-zA-Z]:[\\/]$/,

  // Unix-specific traversal
  ROOT_PATH: /^\/[^/]/,
  TILDE_EXPANSION: /^~[/\\]/,

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
  DANGEROUS_COMMANDS:
    /\b(rm|del|format|fdisk|mkfs|dd|cat|curl|wget|nc|netcat|telnet|ssh|ftp|tftp|eval|exec|system)\s/i,
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
  WINDOWS_SENSITIVE_FILES:
    /\\(windows\\system32|windows\\syswow64|program files|users\\[^\\]*\\desktop)/i,

  // Windows reserved device names
  WINDOWS_DEVICE_NAMES: /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,
  WINDOWS_DEVICE_VARIANTS: /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:[\s.]|$)/i, // Fixed: device names at end or followed by space/dot

  // Windows filename edge cases (trailing dots/spaces that Windows strips)
  WINDOWS_FILENAME_EDGE_CASES: /[\s.]+$/,

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
  HOMOGRAPH_GREEK: /[α-ωΑ-Ω]/g, // Greek characters
  HOMOGRAPH_MIXED: /[а-яёα-ωΑ-Ω]/g, // Mixed homograph scripts

  // Bidirectional text attacks
  BIDI_OVERRIDE: /[\u202A-\u202E\u2066-\u2069\u061C]/g,

  // Prototype pollution attempts
  PROTOTYPE_POLLUTION: /__proto__|constructor\.prototype|\.prototype\.|\.constructor/gi,

  // Zero-width and invisible characters
  ZERO_WIDTH_CHARS: /[\u200B-\u200D\uFEFF\u2060]/g,
} as const;

/**
 * Deserialization attack patterns
 * Detects attempts to inject malicious serialized objects
 */
export const DESERIALIZATION_PATTERNS = {
  // Java serialization
  JAVA_SERIALIZED: /\xac\xed\x00\x05|rO0AB/g,
  JAVA_GADGETS: /\b(Runtime|ProcessBuilder|InvokerTransformer|CommonsCollections|JRMP|LDAP)\b/gi,

  // .NET serialization
  DOTNET_BINARY: /\x00\x01\x00\x00\x00\xff\xff\xff\xff/g,
  DOTNET_GADGETS: /\b(ObjectStateFormatter|LosFormatter|BinaryFormatter|TypeConfuseDelegate)\b/gi,

  // Python pickle
  PYTHON_PICKLE: /\x80[\x02-\x04]|c__builtin__|cos\nsystem/g,
  PYTHON_REDUCE: /__reduce__|__reduce_ex__/g,

  // PHP serialization
  PHP_SERIALIZED: /[Oo]:[0-9]+:"/g,
  PHP_GADGETS: /\b(POP|Monolog|Doctrine|Guzzle|Symfony)\b/gi,

  // Node.js serialization
  NODEJS_SERIALIZE: /"__js_function"|"__js_date"|"__js_regexp"/g,

  // Generic dangerous patterns
  DANGEROUS_CLASSES: /\b(eval|exec|system|shell_exec|file_get_contents|fopen|include|require)\b/gi,
} as const;

/**
 * XXE (XML External Entity) attack patterns
 * Detects XML external entity injection attempts
 */
export const XXE_PATTERNS = {
  // External entity declarations
  EXTERNAL_ENTITY: /<!ENTITY[^>]+SYSTEM[^>]+>/gi,
  PUBLIC_ENTITY: /<!ENTITY[^>]+PUBLIC[^>]+>/gi,

  // Parameter entities
  PARAMETER_ENTITY: /<!ENTITY\s+%[^>]+>/gi,

  // Entity references
  ENTITY_REFERENCE: /&[a-zA-Z_][a-zA-Z0-9_]*;/g,

  // DOCTYPE declarations with external references
  DOCTYPE_EXTERNAL: /<!DOCTYPE[^>]+SYSTEM[^>]*>/gi,
  DOCTYPE_PUBLIC: /<!DOCTYPE[^>]+PUBLIC[^>]*>/gi,

  // XML inclusion
  XML_INCLUSION: /<xi:include[^>]*>/gi,

  // Suspicious protocols in XML
  XML_PROTOCOLS: /\b(file|ftp|http|https|gopher|jar|netdoc):/gi,

  // XML bomb patterns (billion laughs)
  XML_BOMB: /&lol[0-9]*;|&lol[0-9]*lol[0-9]*;/gi,
} as const;

/**
 * SSTI (Server-Side Template Injection) attack patterns
 * Detects template injection attempts in various template engines
 */
export const SSTI_PATTERNS = {
  // Jinja2/Django templates
  JINJA2_INJECTION: /\{\{.*?(\.|_|config|request|session|g).*?\}\}/gi,
  JINJA2_DANGEROUS: /\{\{.*?(popen|system|eval|exec|import|builtins|globals).*?\}\}/gi,

  // Twig templates
  TWIG_INJECTION: /\{\{.*?(\.|_self|app).*?\}\}/gi,
  TWIG_DANGEROUS: /\{\{.*?(system|exec|shell_exec|passthru).*?\}\}/gi,

  // Handlebars templates
  HANDLEBARS_INJECTION: /\{\{.*?(constructor|prototype|process|require).*?\}\}/gi,

  // FreeMarker templates
  FREEMARKER_INJECTION: /<#assign|<#import|<#include|\$\{.*?new.*?\}/gi,
  FREEMARKER_DANGEROUS: /\$\{.*?(freemarker\.template\.utility\.Execute|ObjectConstructor).*?\}/gi,

  // Velocity templates
  VELOCITY_INJECTION: /#set\s*\(\s*\$.*?=|#evaluate|\$\{.*?Class.*?\}/gi,

  // Smarty templates
  SMARTY_INJECTION: /\{php\}|\{\/php\}|\{literal\}|\{\/literal\}/gi,

  // Generic template patterns
  TEMPLATE_EXECUTION: /\{\{.*?(eval|exec|system|import|require|constructor).*?\}\}/gi,
  TEMPLATE_OBJECT_ACCESS: /\{\{.*?(__.*__|prototype|constructor|process).*?\}\}/gi,
} as const;

/**
 * LDAP injection attack patterns
 * Detects LDAP injection attempts in search filters
 */
export const LDAP_PATTERNS = {
  // LDAP filter injection
  LDAP_FILTER_INJECTION: /[()&|!*\\]/g,

  // LDAP special characters that need escaping
  LDAP_SPECIAL_CHARS: /[\\*()\\0]/g,

  // LDAP search operators
  LDAP_OPERATORS: /[&|!]|\*.*\*/g,

  // LDAP attribute injection
  LDAP_ATTRIBUTE_INJECTION: /[=<>~]/g,

  // Common LDAP attributes used in attacks
  LDAP_DANGEROUS_ATTRIBUTES: /\b(objectClass|cn|uid|userPassword|memberOf|dn)\s*[=]/gi,

  // LDAP DN injection
  LDAP_DN_INJECTION: /[,+=\\#<>;]/g,
} as const;

/**
 * XPath injection attack patterns
 * Detects XPath injection attempts in XML queries
 */
export const XPATH_PATTERNS = {
  // XPath injection operators
  XPATH_OPERATORS: /['"]\s*or\s*['"]/gi,
  XPATH_AND_OR: /\b(and|or)\s+['"]/gi,

  // XPath functions that can be dangerous
  XPATH_FUNCTIONS: /\b(substring|contains|starts-with|string-length|position|last|count)\s*\(/gi,

  // XPath axes that can be used for traversal
  XPATH_AXES: /\b(parent|ancestor|descendant|following|preceding|child|attribute)::/gi,

  // XPath comment injection
  XPATH_COMMENTS: /\(:.*?:\)/g,

  // Boolean-based XPath injection
  XPATH_BOOLEAN: /['"]\s*(=|!=)\s*['"]/gi,
  XPATH_TRUE_FALSE: /\b(true|false)\s*\(\s*\)/gi,

  // XPath string manipulation for injection
  XPATH_CONCAT: /concat\s*\(/gi,
  XPATH_NORMALIZE: /normalize-space\s*\(/gi,
} as const;

/**
 * Expression Language (EL) injection patterns
 * Detects EL injection in Java/JSP environments
 */
export const EXPRESSION_LANGUAGE_PATTERNS = {
  // JSP EL injection
  JSP_EL: /\$\{.*?\}/g,
  JSP_EL_DANGEROUS: /\$\{.*?(Runtime|ProcessBuilder|System|Class|Method).*?\}/gi,

  // Spring EL injection
  SPRING_EL: /#\{.*?\}/g,
  SPRING_EL_DANGEROUS: /#\{.*?(T\(|new |Runtime|ProcessBuilder|System\.getProperty).*?\}/gi,

  // OGNL (Struts) injection
  OGNL_INJECTION: /%\{.*?\}|@.*?@/g,
  OGNL_DANGEROUS: /%\{.*?(Runtime|ProcessBuilder|System|@java\.lang).*?\}/gi,

  // MVEL injection
  MVEL_INJECTION: /\$\{.*?\}|@\{.*?\}/g,

  // Unified EL dangerous patterns
  EL_EXECUTION: /\$\{.*?(Runtime\.getRuntime\(\)|ProcessBuilder|System\.exit).*?\}/gi,
  EL_REFLECTION: /\$\{.*?(Class\.forName|getClass\(\)|getDeclaredMethod).*?\}/gi,
} as const;

/**
 * CSV injection attack patterns
 * Detects formula injection in CSV/spreadsheet exports
 */
export const CSV_INJECTION_PATTERNS = {
  // Formula starters
  FORMULA_STARTERS: /^[\s]*[=+\-@]/,

  // Dangerous Excel/Calc functions
  DANGEROUS_FUNCTIONS: /\b(HYPERLINK|IMPORTXML|WEBSERVICE|INDIRECT|OFFSET)\s*\(/gi,

  // System command execution in formulas
  SYSTEM_COMMANDS: /\b(cmd|powershell|bash|sh|calc|notepad)\b/gi,

  // DDE (Dynamic Data Exchange) attacks
  DDE_INJECTION: /=.*?\|.*?!/gi,
  DDE_COMMANDS: /=cmd\|.*?!|=powershell\|.*?!/gi,

  // CSV field injection
  CSV_FIELD_INJECTION: /[",;\r\n]/g,

  // Hyperlink injection
  HYPERLINK_INJECTION: /=HYPERLINK\s*\(/gi,
} as const;

/**
 * Input validation patterns
 * Common patterns for validating user inputs
 */
export const INPUT_VALIDATION_PATTERNS = {
  // Safe project names
  SAFE_PROJECT_NAME: /^[a-zA-Z0-9\-_.àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŸ]+$/,

  // Safe file names
  SAFE_FILE_NAME: /^[a-zA-Z0-9\-_.\s]+$/,

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
      sanitizedInput: '',
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
    PATH_TRAVERSAL_PATTERNS.TILDE_EXPANSION,
  ];

  if (pathTraversalPatterns.some((pattern) => pattern.test(input))) {
    violations.push({
      type: 'path-traversal',
      pattern: 'directory-traversal',
      severity: 'critical',
      description: 'Directory traversal attempt detected (including Unicode variants)',
      recommendation: 'Use relative paths within project directory only',
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
      recommendation: 'Remove or escape shell special characters',
    });
    riskScore += 30;
  }

  // Check advanced command injection (environment variables, IFS bypass)
  if (
    COMMAND_INJECTION_PATTERNS.PATH_MANIPULATION.test(input) ||
    COMMAND_INJECTION_PATTERNS.IFS_BYPASS.test(input) ||
    COMMAND_INJECTION_PATTERNS.QUOTE_ESCAPING.test(input)
  ) {
    violations.push({
      type: 'command-injection',
      pattern: 'advanced-injection',
      severity: 'critical',
      description: 'Advanced command injection attempt detected',
      recommendation: 'Use parameterized commands and avoid environment variable manipulation',
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
      recommendation: 'Use safe alternatives or whitelist trusted commands',
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
      recommendation: 'Never use eval() with user input',
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
      recommendation: 'Run with appropriate user permissions',
    });
    riskScore += 35;
  }

  // Check file system access
  if (
    FILE_SYSTEM_PATTERNS.UNIX_SENSITIVE_FILES.test(input) ||
    FILE_SYSTEM_PATTERNS.WINDOWS_SENSITIVE_FILES.test(input)
  ) {
    violations.push({
      type: 'file-system',
      pattern: 'sensitive-file-access',
      severity: 'critical',
      description: 'Access to sensitive system files detected',
      recommendation: 'Restrict access to application directories only',
    });
    riskScore += 45;
  }

  // Check Windows device names
  if (
    FILE_SYSTEM_PATTERNS.WINDOWS_DEVICE_NAMES.test(input) ||
    FILE_SYSTEM_PATTERNS.WINDOWS_DEVICE_VARIANTS.test(input)
  ) {
    violations.push({
      type: 'file-system',
      pattern: 'windows-device-names',
      severity: 'medium',
      description: 'Windows reserved device name detected',
      recommendation: 'Avoid using Windows reserved names (CON, PRN, AUX, etc.)',
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
      recommendation: 'Remove trailing dots and spaces from filenames',
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
      recommendation: 'Use only Latin characters for identifiers',
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
      recommendation: 'Remove bidirectional control characters',
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
      recommendation: 'Avoid accessing object prototype properties',
    });
    riskScore += 35;
  }

  // Check deserialization attacks
  if (
    DESERIALIZATION_PATTERNS.JAVA_SERIALIZED.test(input) ||
    DESERIALIZATION_PATTERNS.PYTHON_PICKLE.test(input) ||
    DESERIALIZATION_PATTERNS.PHP_SERIALIZED.test(input)
  ) {
    violations.push({
      type: 'deserialization',
      pattern: 'unsafe-deserialization',
      severity: 'critical',
      description: 'Unsafe deserialization pattern detected',
      recommendation: 'Use safe deserialization libraries with type validation',
    });
    riskScore += 45;
  }

  if (DESERIALIZATION_PATTERNS.DANGEROUS_CLASSES.test(input)) {
    violations.push({
      type: 'deserialization',
      pattern: 'dangerous-classes',
      severity: 'critical',
      description: 'Dangerous class references for deserialization detected',
      recommendation: 'Avoid deserializing untrusted data with dangerous classes',
    });
    riskScore += 40;
  }

  // Check XXE attacks
  if (XXE_PATTERNS.EXTERNAL_ENTITY.test(input) || XXE_PATTERNS.DOCTYPE_EXTERNAL.test(input)) {
    violations.push({
      type: 'xxe',
      pattern: 'external-entity',
      severity: 'high',
      description: 'XML External Entity (XXE) attack detected',
      recommendation: 'Disable external entity processing in XML parsers',
    });
    riskScore += 35;
  }

  if (XXE_PATTERNS.XML_BOMB.test(input)) {
    violations.push({
      type: 'xxe',
      pattern: 'xml-bomb',
      severity: 'high',
      description: 'XML bomb (billion laughs) attack detected',
      recommendation: 'Implement XML parsing limits and disable entity expansion',
    });
    riskScore += 30;
  }

  // Check SSTI attacks
  if (
    SSTI_PATTERNS.JINJA2_INJECTION.test(input) ||
    SSTI_PATTERNS.JINJA2_DANGEROUS.test(input) ||
    SSTI_PATTERNS.TWIG_DANGEROUS.test(input) ||
    SSTI_PATTERNS.FREEMARKER_DANGEROUS.test(input)
  ) {
    violations.push({
      type: 'ssti',
      pattern: 'dangerous-template-injection',
      severity: 'critical',
      description: 'Dangerous server-side template injection detected',
      recommendation: 'Use template sandboxing and avoid dangerous functions',
    });
    riskScore += 40;
  }

  if (
    SSTI_PATTERNS.TEMPLATE_EXECUTION.test(input) ||
    SSTI_PATTERNS.TEMPLATE_OBJECT_ACCESS.test(input)
  ) {
    violations.push({
      type: 'ssti',
      pattern: 'template-execution',
      severity: 'high',
      description: 'Template execution or object access injection detected',
      recommendation: 'Sanitize template inputs and restrict object access',
    });
    riskScore += 35;
  }

  // Check LDAP injection
  if (LDAP_PATTERNS.LDAP_FILTER_INJECTION.test(input)) {
    violations.push({
      type: 'ldap-injection',
      pattern: 'ldap-filter-injection',
      severity: 'high',
      description: 'LDAP filter injection attempt detected',
      recommendation: 'Escape LDAP special characters and use parameterized queries',
    });
    riskScore += 30;
  }

  if (LDAP_PATTERNS.LDAP_DANGEROUS_ATTRIBUTES.test(input)) {
    violations.push({
      type: 'ldap-injection',
      pattern: 'ldap-attribute-injection',
      severity: 'medium',
      description: 'LDAP attribute injection attempt detected',
      recommendation: 'Validate LDAP attribute names and values',
    });
    riskScore += 25;
  }

  // Check XPath injection
  if (XPATH_PATTERNS.XPATH_OPERATORS.test(input) || XPATH_PATTERNS.XPATH_AND_OR.test(input)) {
    violations.push({
      type: 'xpath-injection',
      pattern: 'xpath-injection',
      severity: 'high',
      description: 'XPath injection attempt detected',
      recommendation: 'Use parameterized XPath queries and escape special characters',
    });
    riskScore += 30;
  }

  if (XPATH_PATTERNS.XPATH_FUNCTIONS.test(input)) {
    violations.push({
      type: 'xpath-injection',
      pattern: 'xpath-function-abuse',
      severity: 'medium',
      description: 'Suspicious XPath function usage detected',
      recommendation: 'Validate XPath function usage and parameters',
    });
    riskScore += 20;
  }

  // Check Expression Language injection
  if (
    EXPRESSION_LANGUAGE_PATTERNS.JSP_EL_DANGEROUS.test(input) ||
    EXPRESSION_LANGUAGE_PATTERNS.SPRING_EL_DANGEROUS.test(input) ||
    EXPRESSION_LANGUAGE_PATTERNS.OGNL_DANGEROUS.test(input)
  ) {
    violations.push({
      type: 'expression-injection',
      pattern: 'dangerous-el-injection',
      severity: 'critical',
      description: 'Dangerous Expression Language injection detected',
      recommendation: 'Avoid EL evaluation with untrusted input and use safe evaluation contexts',
    });
    riskScore += 40;
  }

  if (
    EXPRESSION_LANGUAGE_PATTERNS.EL_EXECUTION.test(input) ||
    EXPRESSION_LANGUAGE_PATTERNS.EL_REFLECTION.test(input)
  ) {
    violations.push({
      type: 'expression-injection',
      pattern: 'el-execution',
      severity: 'critical',
      description: 'Expression Language execution or reflection detected',
      recommendation: 'Disable dangerous EL functions and reflection access',
    });
    riskScore += 35;
  }

  // Check CSV injection
  if (CSV_INJECTION_PATTERNS.FORMULA_STARTERS.test(input)) {
    violations.push({
      type: 'csv-injection',
      pattern: 'formula-injection',
      severity: 'medium',
      description: 'CSV formula injection attempt detected',
      recommendation: 'Escape formula characters in CSV exports',
    });
    riskScore += 25;
  }

  if (
    CSV_INJECTION_PATTERNS.DANGEROUS_FUNCTIONS.test(input) ||
    CSV_INJECTION_PATTERNS.DDE_INJECTION.test(input)
  ) {
    violations.push({
      type: 'csv-injection',
      pattern: 'dangerous-csv-functions',
      severity: 'high',
      description: 'Dangerous CSV functions or DDE injection detected',
      recommendation: 'Block dangerous functions and DDE commands in CSV exports',
    });
    riskScore += 30;
  }

  return {
    isSecure: violations.length === 0,
    violations,
    riskScore: Math.min(riskScore, 100),
    sanitizedInput: violations.length > 0 ? sanitizeInput(input) : input,
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
    PATH_TRAVERSAL_PATTERNS.NULL_BYTE,
  ];

  pathTraversalPatterns.forEach((pattern) => {
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
  sanitized = sanitized.replace(ADVANCED_ATTACK_PATTERNS.HOMOGRAPH_CYRILLIC, (match) => {
    // Simple Cyrillic to Latin mapping for common homographs
    const cyrillicToLatin: Record<string, string> = {
      а: 'a',
      е: 'e',
      о: 'o',
      р: 'p',
      с: 'c',
      у: 'y',
      х: 'x',
    };
    return cyrillicToLatin[match.toLowerCase()] || '';
  });

  sanitized = sanitized.replace(ADVANCED_ATTACK_PATTERNS.HOMOGRAPH_GREEK, (match) => {
    // Simple Greek to Latin mapping for common homographs
    const greekToLatin: Record<string, string> = {
      α: 'a',
      ο: 'o',
      ρ: 'p',
      υ: 'y',
      Α: 'A',
      Ο: 'O',
      Ρ: 'P',
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

  return (analysis?.isSecure ?? false) && (analysis?.riskScore ?? 100) < 10;
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

  const hasCommandInjection = analysis?.violations.some((v) => v.type === 'command-injection');
  const hasPrivilegeEscalation = analysis?.violations.some(
    (v) => v.type === 'privilege-escalation'
  );

  // Also check for dangerous commands directly
  const hasDangerousCommand = COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS.test(command);

  return !hasCommandInjection && !hasPrivilegeEscalation && !hasDangerousCommand;
}

/**
 * Helper function to validate input type and perform security analysis
 * @private
 */
function validateInputType(input: any): {
  isValidType: boolean;
  analysis?: SecurityAnalysisResult;
} {
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

  return INPUT_VALIDATION_PATTERNS.SAFE_PROJECT_NAME.test(name) && (analysis?.isSecure ?? false);
}
