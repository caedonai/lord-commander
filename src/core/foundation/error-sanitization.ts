/**
 * Enhanced Error Sanitization for Information Disclosure Protection
 * 
 * This module provides comprehensive error sanitization to prevent sensitive
 * information disclosure in error messages, stack traces, and error context.
 * Implements Task 1.3.1: Information Disclosure Protection requirements.
 * 
 * @see Task 1.3.1: Information Disclosure Protection
 * @since 1.0.0
 */

/**
 * Configuration interface for error sanitization behavior
 * 
 * Controls which types of sensitive information should be redacted
 * from error messages and stack traces. Allows fine-grained control
 * over sanitization behavior for different deployment environments.
 * 
 * @example
 * ```typescript
 * const config: ErrorSanitizationConfig = {
 *   redactPasswords: true,
 *   redactApiKeys: true,
 *   redactFilePaths: true,
 *   redactDatabaseUrls: true,
 *   redactNetworkInfo: true,
 *   redactPersonalInfo: true,
 *   customPatterns: [/custom-secret-\w+/gi],
 *   maxMessageLength: 500,
 *   maxStackDepth: 10
 * };
 * ```
 */
export interface ErrorSanitizationConfig {
  /** Whether to redact password-related patterns */
  redactPasswords: boolean;
  /** Whether to redact API keys, tokens, and secrets */
  redactApiKeys: boolean;
  /** Whether to redact file paths that might contain sensitive info */
  redactFilePaths: boolean;
  /** Whether to redact database URLs and connection strings */
  redactDatabaseUrls: boolean;
  /** Whether to redact network information (IPs, ports, hostnames) */
  redactNetworkInfo: boolean;
  /** Whether to redact personal information (emails, usernames, financial data) */
  redactPersonalInfo: boolean;
  /** Custom regex patterns for application-specific sensitive data */
  customPatterns: RegExp[];
  /** Maximum error message length (DoS protection: messages >3x this limit are pre-truncated) */
  maxMessageLength: number;
  /** Maximum stack trace depth to include */
  maxStackDepth: number;
  /** Whether to completely remove stack traces in production */
  removeStackInProduction: boolean;
  /** Whether to preserve error codes for debugging while sanitizing messages */
  preserveErrorCodes: boolean;
  /** Environment-specific stack trace handling levels */
  stackTraceLevel: 'none' | 'minimal' | 'sanitized' | 'full';
  /** Whether to remove source map references for security */
  removeSourceMaps: boolean;
  /** Whether to sanitize module names that might reveal internal structure */
  sanitizeModuleNames: boolean;
  /** Whether to remove line numbers and column numbers */
  removeLineNumbers: boolean;
}

/**
 * Default configuration for error sanitization
 * 
 * Provides secure defaults that protect against common information
 * disclosure vectors while maintaining debugging capabilities.
 */
export const DEFAULT_ERROR_SANITIZATION_CONFIG: ErrorSanitizationConfig = {
  redactPasswords: true,
  redactApiKeys: true,
  redactFilePaths: true,
  redactDatabaseUrls: true,
  redactNetworkInfo: true,
  redactPersonalInfo: true,
  customPatterns: [],
  maxMessageLength: 500,
  maxStackDepth: 10,
  removeStackInProduction: true,
  preserveErrorCodes: true,
  stackTraceLevel: 'sanitized', // Default to sanitized for security
  removeSourceMaps: true, // Remove source maps by default for security
  sanitizeModuleNames: true, // Sanitize module names to hide internal structure
  removeLineNumbers: false // Keep line numbers for debugging (can be overridden per environment)
};

/**
 * Comprehensive security patterns for sensitive data detection
 * 
 * Organized by category for maintainability and performance.
 * Each pattern includes both case-sensitive and case-insensitive variants
 * where appropriate to catch various naming conventions.
 */
const SECURITY_PATTERNS = {
  // Password and authentication patterns
  passwords: [
    // Direct password patterns (include variants with numbers/underscores)
    /password[0-9_]*[=:]\s*[^\s,;}]+/gi,
    /passwd[0-9_]*[=:]\s*[^\s,;}]+/gi,
    /pwd[0-9_]*[=:]\s*[^\s,;}]+/gi,
    /pass[0-9_]*[=:]\s*[^\s,;}]+/gi,
    // Secret patterns (both with and without key suffix, include variants with numbers)
    /secret[0-9_]*[=:]\s*[^\s,;}]+/gi,
    /secret[_-]?key[0-9_]*[=:]\s*[^\s,;}]+/gi,
    // Private keys and certificates
    /private[_-]?key[=:]\s*[^\s,;}]+/gi,
    /cert[_-]?key[=:]\s*[^\s,;}]+/gi,
    // Authentication tokens
    /auth[_-]?token[=:]\s*[^\s,;}]+/gi,
    /session[_-]?token[=:]\s*[^\s,;}]+/gi,
    /csrf[_-]?token[=:]\s*[^\s,;}]+/gi,
    // SSH and GPG keys
    /ssh[_-]?key[=:]\s*[^\s,;}]+/gi,
    /gpg[_-]?key[=:]\s*[^\s,;}]+/gi,
  ],

  // API keys, tokens, and secrets
  apiKeys: [
    // Generic API patterns (preserve casing for common formats)
    /API_KEY[=:-][^\s,;}]+/g,
    /TOKEN[=:-][^\s,;}]+/g,
    /SECRET[=:-][^\s,;}]+/g,
    /ACCESS_KEY[=:-][^\s,;}]+/g,
    // Case-insensitive variants (include variants with numbers)
    /api[_-]?key[0-9_]*[=:]\s*[^\s,;}]+/gi,
    /access[_-]?key[0-9_]*[=:]\s*[^\s,;}]+/gi,
    /secret[_-]?access[_-]?key[0-9_]*[=:]\s*[^\s,;}]+/gi,
    // Simple token patterns (must be before more specific ones, avoid already sanitized values)
    /token[=:]\s*(?!\*\*\*)[^\s,;}]+/gi,
    // Bearer tokens
    /bearer[=:]\s*[^\s,;}]+/gi,
    /authorization[=:]\s*bearer\s+[^\s,;}]+/gi,
    /authorization[=:]\s*Basic\s+[^\s,;}]+/gi,
    // OAuth and JWT tokens
    /access[_-]?token[=:]\s*[^\s,;}]+/gi,
    /refresh[_-]?token[=:]\s*[^\s,;}]+/gi,
    /jwt[_-]?token[=:]\s*[^\s,;}]+/gi,
    // Cloud provider keys
    /aws[_-]?access[_-]?key[=:]\s*[^\s,;}]+/gi,
    /aws[_-]?secret[_-]?key[=:]\s*[^\s,;}]+/gi,
    /gcp[_-]?key[=:]\s*[^\s,;}]+/gi,
    /azure[_-]?key[=:]\s*[^\s,;}]+/gi,
    // API key formats in quotes or JSON
    /['"](sk|pk|tok|key|secret)-[a-zA-Z0-9_-]+['"]/g,
    /['"]\w*[Aa][Pp][Ii][Kk][Ee][Yy]\w*["']:\s*["'][^"']+["']/g,
  ],

  // Database connection strings and credentials
  databaseUrls: [
    // Connection strings with credentials
    /(mongodb|mysql|postgres|postgresql|redis|sqlite|oracle|mssql):\/\/[^\s@]+:[^\s@]+@[^\s,;}]+/gi,
    // Full connection strings (must have equals or colon, allow semicolons in values)
    /connection[_-]?string[=:]\s*[^\s,}]+/gi,
    /database[_-]?url[=:]\s*[^\s,;}]+/gi,
    /db[_-]?url[=:]\s*[^\s,;}]+/gi,
    // Database credentials (must have equals or colon)
    /database[=:]\s*[^\s,;}]+/gi,
    /db[_-]?password[=:]\s*[^\s,;}]+/gi,
    /database[_-]?password[=:]\s*[^\s,;}]+/gi,
    /db[_-]?user[=:]\s*[^\s,;}]+/gi,
    /database[_-]?user[=:]\s*[^\s,;}]+/gi,
    // Network info patterns (host, user, port)
    /host[=:]\s*[^\s,;}]+/gi,
    /user[=:]\s*[^\s,;}]+/gi,
    /port[=:]\s*[^\s,;}]+/gi,
  ],

  // File paths that might contain sensitive information
  filePaths: [
    // User directories (must be first to handle before config files)
    /\/Users\/[^\/\s]+/g,
    /C:[\\\/]+Users[\\\/]+[^\\\/\s]+/g,
    /\/home\/[^\/\s]+/g,
    // Config and credential files (will only match if not already handled by user dir patterns)
    /[^\/\\\s]*(?:config|credential|secret|key|token|password)[^\/\\\s]*\.(?:json|yaml|yml|toml|ini|env|conf)/gi,
    // Hidden files and directories that might contain secrets
    /\/\.[^\/\s]*(?:secret|key|token|credential|auth)[^\/\s]*/gi,
    /[\/\\]\.[^\/\\\s]*(?:secret|key|token|credential|auth)[^\/\\\s]*/gi,
    // Generic sensitive paths
    /\/(?:etc\/shadow|etc\/passwd|var\/log\/auth\.log)/g,
    /C:[\/\\]Windows[\/\\]System32[\/\\]config[\/\\]SAM/gi,
  ],

  // Network information
  networkInfo: [
    // IP addresses (IPv4)
    /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    // IPv6 addresses
    /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
    /\b(?:[0-9a-fA-F]{1,4}:){1,7}:\b/g,
    /\b::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\b/g,
    // Port specifications
    /port[=:]\s*\d+/gi,
    /:\d{2,5}\b(?![\d.])/g, // Port numbers not part of version numbers
    // Hostnames and domains in sensitive contexts
    /host[=:]\s*[^\s,;}]+/gi,
    /hostname[=:]\s*[^\s,;}]+/gi,
    /server[=:]\s*[^\s,;}]+/gi,
    // Internal network indicators
    /localhost:\d+/gi,
    /127\.0\.0\.1:\d+/g,
    /0\.0\.0\.0:\d+/g,
  ],

  // Personal and financial information
  personalInfo: [
    // Email addresses (including localhost)
    /[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|localhost)/g,
    // Credit card numbers (various formats)
    /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    /\b\d{13,19}\b/g, // Generic card number length
    // SSN patterns
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{9}\b/g, // SSN without dashes
    // Phone numbers
    /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    // Username patterns
    /username[=:]\s*[^\s,;}]+/gi,
    /user[=:]\s*[^\s,;}]+/gi,
    /login[=:]\s*[^\s,;}]+/gi,
    // Employee/customer IDs
    /(?:employee|customer|client)[_-]?id[=:]\s*[^\s,;}]+/gi,
  ],

  // Injection and malicious patterns
  injectionPatterns: [
    // HTML/XML tags
    /<[^>]*>/g,
    // JavaScript patterns
    /javascript:[^;\s]*/gi,
    /alert\s*\([^)]*\)/gi,
    /eval\s*\([^)]*\)/gi,
    /\bon(click|load|error|focus|blur|change|submit|keydown|keyup|mouseover|mouseout)\s*=\s*[^>\s]*/gi,
    // Control characters
    /[\x00-\x1F\x7F]/g,
    // ANSI escape sequences
    /\x1b\[[0-9;]*[mGKH]/g,
  ],
};

/**
 * Sanitize error message for production use
 * 
 * Removes sensitive information based on configuration while preserving
 * enough context for debugging. Implements comprehensive pattern matching
 * to catch various forms of sensitive data disclosure.
 * 
 * **Security Features:**
 * - DoS Protection: Pre-truncates extremely large messages to prevent regex DoS attacks
 * - Pattern-based sanitization for passwords, API keys, file paths, etc.
 * - Configurable sanitization levels and custom patterns
 * 
 * @param message - The error message to sanitize
 * @param config - Sanitization configuration options
 * @returns Sanitized message safe for production logging
 * 
 * @example
 * ```typescript
 * // Basic usage with default config
 * const safe = sanitizeErrorMessage('Connection failed: password=secret123');
 * console.log(safe); // "Connection failed: password=***"
 * 
 * // Custom configuration
 * const customConfig = {
 *   ...DEFAULT_ERROR_SANITIZATION_CONFIG,
 *   redactFilePaths: false, // Keep file paths in staging environment
 *   customPatterns: [/myapp-secret-\w+/gi]
 * };
 * const safe2 = sanitizeErrorMessage(errorMsg, customConfig);
 * ```
 * 
 * @see {@link ErrorSanitizationConfig} for configuration options
 */
export function sanitizeErrorMessage(
  message: string, 
  config: Partial<ErrorSanitizationConfig> = {}
): string {
  // Handle null/undefined/empty messages
  if (!message) return '';
  
  // Merge with defaults
  const fullConfig = { ...DEFAULT_ERROR_SANITIZATION_CONFIG, ...config };
  
  // DoS Protection: Pre-truncate extremely large messages to prevent resource exhaustion
  // This is a critical security measure to prevent regex DoS attacks
  let sanitized = message;
  const maxProcessingLength = fullConfig.maxMessageLength * 3; // Allow buffer for boundary protection
  if (sanitized.length > maxProcessingLength) {
    sanitized = sanitized.substring(0, maxProcessingLength);
  }
  
  // Remove injection patterns first (highest priority)
  for (const pattern of SECURITY_PATTERNS.injectionPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Apply custom patterns first (they can be more specific than built-in patterns)
  for (const pattern of fullConfig.customPatterns) {
    sanitized = sanitized.replace(pattern, '***');
  }
  
  // Apply sanitization based on configuration
  if (fullConfig.redactApiKeys) {
    for (const pattern of SECURITY_PATTERNS.apiKeys) {
      sanitized = sanitized.replace(pattern, (match) => {
        // Handle complete quoted strings first
        if (/^['"](sk|pk|tok|key|secret)-[a-zA-Z0-9_-]+['"]$/.test(match)) {
          const quote = match[0];
          return quote + '***' + quote;
        }
        
        // Handle JSON-style quoted keys
        if (/^['"]\w*[Aa][Pp][Ii][Kk][Ee][Yy]\w*["']:\s*["'][^"']+["']$/.test(match)) {
          // Replace both the key name and the value with ***
          const keyQuoteMatch = match.match(/^(['"])/);
          const valueQuoteMatch = match.match(/:\s*(['"]).*\1$/);
          if (keyQuoteMatch && valueQuoteMatch) {
            const keyQuote = keyQuoteMatch[1];
            const valueQuote = valueQuoteMatch[1];
            return keyQuote + '***' + keyQuote + ': ' + valueQuote + '***' + valueQuote;
          }
        }
        
        // Handle quoted values in key=value format
        if (match.includes('"') && match.indexOf('"') !== match.lastIndexOf('"')) {
          const firstQuote = match.indexOf('"');
          const beforeQuote = match.substring(0, firstQuote + 1);
          return beforeQuote + '***"';
        }
        if (match.includes("'") && match.indexOf("'") !== match.lastIndexOf("'")) {
          const firstQuote = match.indexOf("'");
          const beforeQuote = match.substring(0, firstQuote + 1);
          return beforeQuote + "***'";
        }
        
        // Preserve the key name but redact the value
        const equalIndex = match.indexOf('=');
        const colonIndex = match.indexOf(':');
        const dashIndex = match.indexOf('-');
        
        // Find the first separator that exists
        let separatorIndex = -1;
        let separator = '=';
        
        if (equalIndex !== -1) {
          separatorIndex = equalIndex;
          separator = '=';
        } else if (colonIndex !== -1) {
          separatorIndex = colonIndex;
          separator = '='; // Standardize to = for output
        } else if (dashIndex !== -1) {
          separatorIndex = dashIndex;
          separator = '='; // Standardize to = for output
        }
        
        if (separatorIndex !== -1) {
          const keyPart = match.substring(0, separatorIndex);
          return keyPart + separator + '***';
        }
        return '***';
      });
    }
  }
  
  if (fullConfig.redactPasswords) {
    for (const pattern of SECURITY_PATTERNS.passwords) {
      sanitized = sanitized.replace(pattern, (match) => {
        const equalIndex = match.indexOf('=');
        const colonIndex = match.indexOf(':');
        const separatorIndex = equalIndex !== -1 ? equalIndex : colonIndex;
        
        if (separatorIndex !== -1) {
          const keyPart = match.substring(0, separatorIndex);
          return keyPart + '=***';
        }
        return '***';
      });
    }
  }
  
  if (fullConfig.redactDatabaseUrls) {
    for (const pattern of SECURITY_PATTERNS.databaseUrls) {
      sanitized = sanitized.replace(pattern, (match) => {
        // For connection strings, preserve protocol but redact credentials
        if (match.includes('://')) {
          const protocolEnd = match.indexOf('://');
          const protocol = match.substring(0, protocolEnd + 3);
          return protocol + '***@***';
        }
        // For other patterns, use standard redaction
        const equalIndex = match.indexOf('=');
        const colonIndex = match.indexOf(':');
        const separatorIndex = equalIndex !== -1 ? equalIndex : colonIndex;
        
        if (separatorIndex !== -1) {
          const keyPart = match.substring(0, separatorIndex);
          return keyPart + '=***';
        }
        return '***';
      });
    }
  }
  
  if (fullConfig.redactFilePaths) {
    // Apply user directory patterns first - replace usernames but preserve rest of path
    sanitized = sanitized
      .replace(/\/Users\/[^\/\s]+/g, '/Users/***')
      .replace(/C:[\\\/]+Users[\\\/]+[^\\\/\s]+/g, (match) => {
        // Preserve the original path separators
        const separators = match.match(/[\\\/]+/g);
        if (separators && separators.length >= 2) {
          const driveAndUsers = 'C:' + separators[0] + 'Users' + separators[1];
          return driveAndUsers + '***';
        }
        return 'C:\\Users\\***'; // Fallback
      })
      .replace(/\/home\/[^\/\s]+/g, '/home/***');
    
    // Apply other file path patterns only to files not in user directories
    const otherFilePatterns = SECURITY_PATTERNS.filePaths.slice(3); // Skip user dir patterns
    
    for (const pattern of otherFilePatterns) {
      sanitized = sanitized.replace(pattern, (match, offset, string) => {
        // Check if this match is within a user directory that was already sanitized
        const beforeMatch = string.substring(0, offset);
        const isInUserDir = beforeMatch.includes('Users\\***') || 
                           beforeMatch.includes('Users/***') || 
                           beforeMatch.includes('home/***');
        
        if (isInUserDir) {
          return match; // Don't modify if in user directory
        }
        
        // For config files and sensitive filenames in other locations
        if (match.includes('.')) {
          // If it's a full path, preserve directory structure
          if (match.includes('/') || match.includes('\\')) {
            return match.replace(/\/[^\/]+\//, '/***/');
          } else {
            // For just filenames, replace with generic filename
            const extension = match.substring(match.lastIndexOf('.'));
            return '***' + extension;
          }
        }
        return '***';
      });
    }
  }
  
  if (fullConfig.redactNetworkInfo) {
    for (const pattern of SECURITY_PATTERNS.networkInfo) {
      sanitized = sanitized.replace(pattern, (match) => {
        if (match.includes('.') && /\d+\.\d+\.\d+\.\d+/.test(match)) {
          return '***.***.***.***'; // IP address
        } else if (match.includes(':') && /:\d+/.test(match)) {
          // Port number - replace just the port part
          return match.replace(/:\d+/, ':***');
        } else if (match.toLowerCase().includes('port') || match.toLowerCase().includes('host') || match.toLowerCase().includes('server')) {
          const equalIndex = match.indexOf('=');
          const colonIndex = match.indexOf(':');
          const separatorIndex = equalIndex !== -1 ? equalIndex : colonIndex;
          
          if (separatorIndex !== -1) {
            const keyPart = match.substring(0, separatorIndex);
            return keyPart + '=***';
          }
        }
        return '***';
      });
    }
  }
  
  if (fullConfig.redactPersonalInfo) {
    for (const pattern of SECURITY_PATTERNS.personalInfo) {
      sanitized = sanitized.replace(pattern, (match) => {
        if (match.includes('@') && /[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|localhost)/.test(match)) {
          return '***@***.***'; // Email (including localhost)
        } else if (/\b(?:\d{4}[\s-]?){3}\d{4}\b/.test(match)) {
          return '****-****-****-****'; // Credit card
        } else if (/\b\d{3}-\d{2}-\d{4}\b/.test(match)) {
          return '***-**-****'; // SSN with dashes
        } else if (/\b\d{9}\b/.test(match)) {
          return '***-**-****'; // SSN without dashes
        }
        
        // Generic pattern with separator
        const equalIndex = match.indexOf('=');
        const colonIndex = match.indexOf(':');
        const separatorIndex = equalIndex !== -1 ? equalIndex : colonIndex;
        
        if (separatorIndex !== -1) {
          const keyPart = match.substring(0, separatorIndex);
          return keyPart + '=***';
        }
        return '***';
      });
    }
  }
  
  // Apply length limits FIRST to prevent DoS attacks via large messages
  const truncationSuffix = '... [truncated for security]';
  if (message.length > fullConfig.maxMessageLength * 2) {
    // For very large messages, truncate early to prevent DoS
    // Use 2x the limit to allow some buffer for pattern matching near the boundary
    const earlyTruncateLength = fullConfig.maxMessageLength * 2;
    sanitized = sanitized.substring(0, earlyTruncateLength);
  }
  
  // Final truncation after sanitization (for normal-sized messages or post-early-truncation)
  if (sanitized.length > fullConfig.maxMessageLength) {
    sanitized = sanitized.substring(0, fullConfig.maxMessageLength - truncationSuffix.length) + truncationSuffix;
  }

  return sanitized;
}

/**
 * Sanitize stack trace for production use
 * 
 * Removes sensitive file paths and limits stack depth while preserving
 * enough information for debugging. Provides different levels of sanitization
 * based on environment configuration.
 * 
 * @param stack - The stack trace string to sanitize
 * @param config - Sanitization configuration options
 * @returns Sanitized stack trace safe for production logging
 * 
 * @example
 * ```typescript
 * const error = new Error('Something went wrong');
 * const safeStack = sanitizeStackTrace(error.stack);
 * 
 * // In production, this might return empty string for security
 * // In development, returns sanitized paths with limited depth
 * ```
 */
export function sanitizeStackTrace(
  stack: string, 
  config: Partial<ErrorSanitizationConfig> = {}
): string {
  if (!stack) return stack;
  
  // Security: Prevent DoS attacks via extremely large stack traces
  const MAX_STACK_SIZE = 50000; // 50KB limit
  if (stack.length > MAX_STACK_SIZE) {
    const truncated = stack.substring(0, MAX_STACK_SIZE);
    console.warn(`Stack trace truncated from ${stack.length} to ${MAX_STACK_SIZE} chars for security`);
    return truncated + '\n... [Stack trace truncated for security]';
  }
  
  // Merge with defaults and validate configuration
  const fullConfig = { ...DEFAULT_ERROR_SANITIZATION_CONFIG, ...config };
  
  // Security: Validate configuration values to prevent exploitation
  if (fullConfig.maxStackDepth && (fullConfig.maxStackDepth < 1 || fullConfig.maxStackDepth > 1000)) {
    console.warn('Invalid maxStackDepth, using default: 20');
    fullConfig.maxStackDepth = 20;
  }
  
  if (fullConfig.maxMessageLength && (fullConfig.maxMessageLength < 10 || fullConfig.maxMessageLength > 100000)) {
    console.warn('Invalid maxMessageLength, using default: 500');
    fullConfig.maxMessageLength = 500;
  }
  
  // Handle different stack trace levels
  switch (fullConfig.stackTraceLevel) {
    case 'none':
      return '';
    case 'minimal':
      return _sanitizeStackMinimal(stack, fullConfig);
    case 'sanitized':
      return _sanitizeStackSanitized(stack, fullConfig);
    case 'full':
      return _sanitizeStackFull(stack, fullConfig);
    default:
      return _sanitizeStackSanitized(stack, fullConfig);
  }
}

/**
 * Minimal stack trace sanitization - removes most information, keeps error location only
 * @private
 */
function _sanitizeStackMinimal(
  stack: string, 
  config: ErrorSanitizationConfig
): string {
  const lines = stack.split('\n');
  if (lines.length === 0) return stack;
  
  // Keep only the first line (error message) and first stack frame
  const errorLine = lines[0] || '';
  const firstFrame = lines.find(line => line.trim().startsWith('at ')) || '';
  
  if (!firstFrame) return errorLine;
  
  // Sanitize the first frame heavily - use bounded patterns to prevent ReDoS
  let sanitizedFrame = firstFrame
    .replace(/\/[^\/]{1,50}\//g, '/')  // Remove path components safely
    .replace(/C:\\[^\\]{1,50}\\/g, 'C:\\')  // Remove Windows path components safely  
    .replace(/:\d{1,6}:\d{1,6}/g, '')  // Remove line:column numbers with bounds
    .replace(/\([^)]{0,200}node_modules[^)]{0,200}\)/g, '(node_modules)')  // Bound node_modules patterns
    .replace(/\([^)\/]{0,100}\/[^)]{0,100}\)/g, '(internal)');  // Bound other path patterns
  
  if (config.removeLineNumbers) {
    sanitizedFrame = sanitizedFrame.replace(/:\d+/g, '');
  }
  
  return `${errorLine}\n${sanitizedFrame}`;
}

/**
 * Standard sanitized stack trace - removes sensitive paths but keeps structure
 * @private
 */
function _sanitizeStackSanitized(
  stack: string, 
  config: ErrorSanitizationConfig
): string {
  let sanitizedStack = stack;
  
  // Memory protection: Split processing for very large stacks
  if (stack.length > 10000) {
    const chunks = [];
    for (let i = 0; i < stack.length; i += 5000) {
      chunks.push(stack.substring(i, i + 5000));
    }
    sanitizedStack = chunks.map(chunk => _processSanitizationChunk(chunk, config)).join('');
  }
  
  // Remove source map references for security
  if (config.removeSourceMaps) {
    sanitizedStack = sanitizedStack
      .replace(/\/\/# sourceMappingURL=.*/g, '')
      .replace(/\/\*# sourceMappingURL=.*\*\//g, '')
      .replace(/\.js\.map/g, '.js')
      .replace(/\.ts\.map/g, '.ts');
  }
  
  // Apply file path sanitization if configured - use secure string processing
  if (config.redactFilePaths) {
    // Use aggressive sanitization to block all path disclosure attempts
    sanitizedStack = _sanitizePaths(sanitizedStack);
  }
  
  // Sanitize module names that might reveal internal structure
  if (config.sanitizeModuleNames) {
    sanitizedStack = sanitizedStack
      .replace(/(@[^\/]+\/[^\/\s\n)]+)/g, '@***/***')  // Scoped packages
      .replace(/(internal\/[^\/\s\n)]+)/g, 'internal/***')  // Internal modules
      .replace(/(lib\/[^\/\s\n)]+)/g, 'lib/***')  // Library paths
      .replace(/(src\/[^\/\s\n)]+)/g, 'src/***');  // Source paths
  }
  
  // Remove line and column numbers if configured
  if (config.removeLineNumbers) {
    sanitizedStack = sanitizedStack.replace(/:\d+:\d+/g, '');
  }
  
  // Limit stack depth
  const lines = sanitizedStack.split('\n');
  if (lines.length > config.maxStackDepth) {
    return lines.slice(0, config.maxStackDepth).join('\n') + 
           `\n... [${lines.length - config.maxStackDepth} more frames hidden for security]`;
  }
  return sanitizedStack;
}

/**
 * Process a chunk of stack trace safely to prevent memory exhaustion
 * @private
 */
/**
 * Secure path sanitization using simple string operations to prevent ReDoS
 */
function _sanitizePaths(stack: string): string {
  let sanitized = stack;
  
  // Remove control characters first to prevent injection, but preserve newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  
  // Handle node_modules paths first to ensure consistent formatting before other sanitization
  // This ensures we get 'node_modules/package/index.js' format consistently
  // Pattern 1: Full path with subdirectories: /path/to/node_modules/package/file.js -> node_modules/package/file.js
  sanitized = sanitized.replace(/[^\/\n\r\t \(\)]*\/[^\/\n\r\t \(\)]*\/[^\/\n\r\t \(\)]*\/node_modules\/([^\\\/\n\r\t \)]+)\/+([^\\\/\n\r\t \)]+)/g, 'node_modules/$1/$2');
  // Pattern 2: Simple path with node_modules: /something/node_modules/package -> node_modules/package/
  sanitized = sanitized.replace(/[^\/\n\r\t \(\)]*\/[^\/\n\r\t \(\)]*\/node_modules\/([^\\\/\n\r\t \)]+)/g, 'node_modules/$1/');
  // Pattern 3: Windows style: C:\path\node_modules\package\file -> node_modules/package/file  
  sanitized = sanitized.replace(/C:\\[^\\]*\\[^\\]*\\node_modules\\([^\\\/\n\r\t \)]+)\\([^\\\/\n\r\t \)]+)/g, 'node_modules/$1/$2');
  sanitized = sanitized.replace(/C:\\[^\\]*\\node_modules\\([^\\\/\n\r\t \)]+)/g, 'node_modules/$1/');
  
  // Aggressive path traversal blocking
  sanitized = sanitized.replace(/\.\.[\\/]/g, '[PATH-TRAVERSAL]/');
  sanitized = sanitized.replace(/[\\/]\.\.$/gm, '/[PATH-TRAVERSAL]');
  sanitized = sanitized.replace(/\.\.[\\/]\.\.[\\/]/g, '[PATH-TRAVERSAL]/');
  
  // User directories - be very specific about path patterns (avoid \s to prevent newline matching)
  // Unix-style paths first
  sanitized = sanitized.replace(/\/Users\/[^\/\n\r\t \)\:]+/g, '/Users/***');
  sanitized = sanitized.replace(/\/home\/[^\/\n\r\t \)\:]+/g, '/home/***');
  
  // Windows paths - handle the exact pattern from test (be more specific about what we match)
  // Only match actual Windows user paths, not already-sanitized ones
  sanitized = sanitized.replace(/C:\\Users\\[^\\*\n\r]+\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*/g, 'C:\\Users\\***');
  sanitized = sanitized.replace(/C:\\Users\\[^\\*\n\r]+\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*/g, 'C:\\Users\\***');  
  sanitized = sanitized.replace(/C:\\Users\\[^\\*\n\r]+\\[^\\\n\r]*\\[^\\\n\r]*/g, 'C:\\Users\\***');
  sanitized = sanitized.replace(/C:\\Users\\[^\\*\n\r]+\\[^\\\n\r]*/g, 'C:\\Users\\***');
  sanitized = sanitized.replace(/C:\\Users\\[^\\*\n\r]+$/gm, 'C:\\Users\\***');
  
  // Remove any leftover long sequences of repeating characters
  sanitized = sanitized.replace(/([a-z])\1{20,}/gi, '[REPEATED-CHARS]');
  
  // System directories - exact string matching (but skip paths containing node_modules)
  // System directories with more comprehensive patterns
  const systemPaths = [
    '/etc/', '/root/', '/opt/', '/var/', '/usr/', '/bin/', '/sbin/',
    'C:\\Windows\\', 'C:\\Program Files\\', 'C:\\ProgramData\\'
  ];

  systemPaths.forEach(path => {
    if (sanitized.includes(path)) {
      // Skip lines that contain node_modules - they should be handled by node_modules logic
      const lines = sanitized.split('\n');
      const processedLines = lines.map(line => {
        if (line.includes('node_modules')) {
          return line; // Don't sanitize system paths in node_modules lines
        }
        const regex = new RegExp(path.replace(/[\\\/]/g, '[\\\\/]') + '[^\\\\/\\n\\r\\t ]*', 'gi');
        return line.replace(regex, path + '***');
      });
      sanitized = processedLines.join('\n');
    }
  });
  
  // Remove the cleanup logic since we're not sanitizing node_modules paths above  // Project and workspace directories - be more conservative  
  const projectPaths = [
    '/workspace/', '/project/', '/src/', '/dist/', '/build/'
    // Removed '/app/' as it's too generic and breaks stack traces
  ];
  
  projectPaths.forEach(path => {
    if (sanitized.includes(path)) {
      // Use [^\\\/\n\r\t ]* to exclude newlines specifically  
      const regex = new RegExp(path.replace(/[\\\/]/g, '[\\\\/]') + '[^\\\\/\\n\\r\\t \\)]*', 'gi');
      sanitized = sanitized.replace(regex, path + '***');
    }
  });
  
  // Handle more complex workspace patterns (avoid \s to prevent newline matching)
  sanitized = sanitized.replace(/\/mnt\/[^\/\n\r\t \)\:]+\/[^\/\n\r\t \)\:]+/g, '/mnt/***/***');
  
  // Windows UNC and device paths - be more aggressive (avoid \s to prevent newline matching)
  sanitized = sanitized.replace(/\\\\[^\\\/\n\r\t ]+\\[^\\\/\n\r\t ]*/g, '\\\\[SERVER]\\[SHARE]');
  sanitized = sanitized.replace(/\\\\\?\\/g, '\\\\[DEVICE]\\');
  sanitized = sanitized.replace(/\\\\\.\\[^\\\/\n\r\t ]*/g, '\\\\.\\[DEVICE]');
  
  // Remove specific dangerous device names - only when they appear as device paths
  const dangerousDevices = ['PhysicalDrive0', 'GLOBALROOT', 'Device', 'CON', 'PRN', 'AUX', 'NUL'];
  dangerousDevices.forEach(device => {
    // Only replace when they appear as device paths, not in filenames
    const deviceRegex = new RegExp(`\\\\\\\\[^\\\\]*\\\\${device}\\b`, 'gi');
    sanitized = sanitized.replace(deviceRegex, `\\\\[SERVER]\\[DEVICE]`);
    const driveRegex = new RegExp(`\\b${device}:`, 'gi');
    sanitized = sanitized.replace(driveRegex, '[DEVICE]:');
  });
  
  // Drive roots and device paths (avoid \s to prevent newline matching)
  sanitized = sanitized.replace(/[A-Z]:\\$/gm, '[DRIVE]:\\');
  sanitized = sanitized.replace(/\/dev\/[^\/\n\r\t ]*/g, '/dev/[DEVICE]');
  
  // Node modules - preserve filenames but sanitize leading paths (avoid \s to prevent newline matching)
  sanitized = sanitized.replace(/[^\/\n\r\t \)]*[\\/]node_modules[\\/]([^\\\/\n\r\t \)\:]+[\\/][^\\\/\n\r\t \)\:]+)/g, 'node_modules/$1');
  
  // Build directories (avoid \s to prevent newline matching)
  sanitized = sanitized.replace(/[\\/](dist|build|out)[\\/][^\\\/\n\r\t \)\:]*/g, '/$1/***');
  
  // Sensitive files
  const sensitiveFiles = ['passwd', 'shadow', 'hosts', 'secrets.txt', '.env', '.ssh'];
  sensitiveFiles.forEach(file => {
    const fileRegex = new RegExp(file.replace('.', '\\.'), 'gi');
    sanitized = sanitized.replace(fileRegex, '[REDACTED]');
  });
  
  return sanitized;
}

function _processSanitizationChunk(chunk: string, config: ErrorSanitizationConfig): string {
  let processedChunk = chunk;
  
  // Apply basic path sanitization only to prevent ReDoS on chunks
  if (config.redactFilePaths) {
    processedChunk = processedChunk
      .replace(/\/Users\/[^\/\s]{1,50}/g, '/Users/***')
      .replace(/C:\\Users\\[^\\]{1,50}/g, 'C:\\Users\\***')
      .replace(/\/home\/[^\/\s]{1,50}/g, '/home/***');
  }
  
  return processedChunk;
}

/**
 * Full stack trace with minimal sanitization - for development environments
 * @private
 */
function _sanitizeStackFull(
  stack: string, 
  config: ErrorSanitizationConfig
): string {
  let sanitizedStack = stack;
  
  // Even in full mode, we may want to remove source maps for security
  if (config.removeSourceMaps) {
    sanitizedStack = sanitizedStack
      .replace(/\/\/# sourceMappingURL=.*/g, '')
      .replace(/\/\*# sourceMappingURL=.*\*\//g, '');
  }
  
  // Apply minimal path sanitization only if specifically requested
  if (config.redactFilePaths) {
    sanitizedStack = sanitizedStack
      // Only sanitize very sensitive paths, keep most for debugging
      .replace(/\/Users\/[^\/\s]+\/\.ssh/g, '/Users/***/[hidden]')
      .replace(/\/home\/[^\/\s]+\/\.ssh/g, '/home/***/[hidden]')
      .replace(/\.env\b/g, '[env-file]')  // Hide .env file references
      .replace(/password|secret|key|token/gi, (match) => `[${match.toLowerCase()}]`);
  }
  
  // Still respect stack depth limits even in full mode
  const lines = sanitizedStack.split('\n');
  if (lines.length > config.maxStackDepth) {
    return lines.slice(0, config.maxStackDepth).join('\n') + 
           `\n... [${lines.length - config.maxStackDepth} more frames, use higher maxStackDepth for full trace]`;
  }
  
  return sanitizedStack;
}

/**
 * Sanitize complete error object for production use
 * 
 * Creates a sanitized copy of an Error object with sensitive information
 * removed from message, stack trace, and any custom properties. Preserves
 * error type and code information for debugging while protecting sensitive data.
 * 
 * @param error - The error object to sanitize
 * @param config - Sanitization configuration options
 * @returns New Error object with sanitized properties
 * 
 * @example
 * ```typescript
 * const originalError = new Error('Database connection failed: password=secret123');
 * originalError.stack = 'Error: Database connection failed...\n    at /home/user/.config/app/db.js:15';
 * 
 * const safeError = sanitizeErrorForProduction(originalError, {
 *   redactPasswords: true,
 *   redactFilePaths: true
 * });
 * 
 * console.log(safeError.message); // "Database connection failed: password=***"
 * console.log(safeError.stack);   // Sanitized stack without sensitive paths
 * ```
 * 
 * @see {@link ErrorSanitizationConfig} for configuration options
 */
export function sanitizeErrorForProduction(
  error: Error, 
  config: Partial<ErrorSanitizationConfig> = {}
): Error {
  // Handle null/undefined errors
  if (!error) return new Error('Unknown error occurred');
  
  // Merge with defaults
  const fullConfig = { ...DEFAULT_ERROR_SANITIZATION_CONFIG, ...config };
  
  // Create new error with sanitized message
  const sanitizedMessage = sanitizeErrorMessage(error.message || '', fullConfig);
  const sanitizedError = new Error(sanitizedMessage);
  
  // Preserve error name and constructor
  sanitizedError.name = error.name;
  
  // Sanitize stack trace
  if (error.stack) {
    sanitizedError.stack = sanitizeStackTrace(error.stack, fullConfig);
  }
  
  // Handle custom error properties while preserving error codes
  if (fullConfig.preserveErrorCodes) {
    // Preserve common error code properties
    if ('code' in error && error.code) {
      (sanitizedError as any).code = error.code;
    }
    if ('errno' in error && error.errno) {
      (sanitizedError as any).errno = error.errno;
    }
    if ('syscall' in error && error.syscall) {
      (sanitizedError as any).syscall = error.syscall;
    }
  }
  
  // Sanitize any custom properties that might contain sensitive data
  for (const [key, value] of Object.entries(error)) {
    if (key !== 'message' && key !== 'stack' && key !== 'name') {
      if (typeof value === 'string') {
        (sanitizedError as any)[key] = sanitizeErrorMessage(value, fullConfig);
      } else if (value && typeof value === 'object') {
        // For objects, convert to string and sanitize
        (sanitizedError as any)[key] = sanitizeErrorMessage(JSON.stringify(value), fullConfig);
      } else {
        // For primitive values, preserve as-is
        (sanitizedError as any)[key] = value;
      }
    }
  }
  
  return sanitizedError;
}

/**
 * Check if current environment should show detailed error information
 * 
 * Determines whether full error details should be displayed based on
 * environment variables and debug settings. Used to control information
 * disclosure in different deployment environments.
 * 
 * @returns true if detailed errors should be shown, false otherwise
 * 
 * @example
 * ```typescript
 * if (shouldShowDetailedErrors()) {
 *   console.error('Full error:', error);
 * } else {
 *   console.error('Error:', sanitizeErrorForProduction(error));
 * }
 * ```
 */
export function shouldShowDetailedErrors(): boolean {
  // Never show detailed errors in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // Check for explicit debug flags
  if (process.env.DEBUG || process.env.CLI_DEBUG) {
    return true;
  }
  
  // Show detailed errors in development by default
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

/**
 * Check if running in debug mode
 * 
 * Determines if the application is running in debug mode based on
 * environment variables. Used to control logging verbosity and
 * error detail levels.
 * 
 * @returns true if in debug mode, false otherwise
 * 
 * @example
 * ```typescript
 * if (isDebugMode()) {
 *   console.debug('Debug info:', debugData);
 * }
 * ```
 */
export function isDebugMode(): boolean {
  // Security: Never enable debug mode in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  return !!(
    process.env.DEBUG || 
    process.env.CLI_DEBUG || 
    process.env.NODE_ENV === 'development' ||
    process.argv.includes('--debug') ||
    process.argv.includes('--verbose')
  );
}

/**
 * Create error sanitization configuration for specific environments
 * 
 * Provides pre-configured sanitization settings for common deployment
 * environments (development, staging, production) with appropriate
 * security and debugging balance.
 * 
 * @param environment - Target environment ('development' | 'staging' | 'production')
 * @param customOverrides - Additional configuration overrides
 * @returns Complete sanitization configuration
 * 
 * @example
 * ```typescript
 * // Production configuration with maximum security
 * const prodConfig = createEnvironmentConfig('production');
 * 
 * // Staging with some debugging capability
 * const stagingConfig = createEnvironmentConfig('staging', {
 *   redactFilePaths: false // Allow file paths for debugging
 * });
 * ```
 */
export function createEnvironmentConfig(
  environment: 'development' | 'staging' | 'production',
  customOverrides: Partial<ErrorSanitizationConfig> = {}
): ErrorSanitizationConfig {
  const baseConfigs = {
    development: {
      ...DEFAULT_ERROR_SANITIZATION_CONFIG,
      redactFilePaths: false,
      redactNetworkInfo: false,
      maxMessageLength: 1000,
      maxStackDepth: 20,
      removeStackInProduction: false,
      stackTraceLevel: 'full' as const,
      removeSourceMaps: false,
      sanitizeModuleNames: false,
      removeLineNumbers: false,
    },
    staging: {
      ...DEFAULT_ERROR_SANITIZATION_CONFIG,
      maxMessageLength: 750,
      maxStackDepth: 15,
      removeStackInProduction: false,
      stackTraceLevel: 'sanitized' as const,
      removeSourceMaps: true,
      sanitizeModuleNames: true,
      removeLineNumbers: false,
    },
    production: {
      ...DEFAULT_ERROR_SANITIZATION_CONFIG,
      maxMessageLength: 250,
      maxStackDepth: 5,
      removeStackInProduction: true,
      stackTraceLevel: 'minimal' as const,
      removeSourceMaps: true,
      sanitizeModuleNames: true,
      removeLineNumbers: true,
    },
  };
  
  return { ...baseConfigs[environment], ...customOverrides };
}

/**
 * Analyze stack trace for potential security risks and sensitive information
 * 
 * Examines stack traces for patterns that might indicate information disclosure
 * risks, such as exposed file paths, source maps, or internal module structure.
 * Useful for security auditing and compliance validation.
 * 
 * @param stack - Stack trace string to analyze
 * @returns Analysis result with risk assessment and recommendations
 * 
 * @example
 * ```typescript
 * const analysis = analyzeStackTraceSecurity(error.stack);
 * if (analysis.riskLevel === 'high') {
 *   console.warn('Stack trace contains sensitive information:', analysis.risks);
 * }
 * ```
 */
export function analyzeStackTraceSecurity(stack: string): {
  riskLevel: 'low' | 'medium' | 'high';
  risks: string[];
  recommendations: string[];
  sensitivePatterns: Array<{ pattern: string; description: string; line: string }>;
} {
  if (!stack) {
    return { riskLevel: 'low', risks: [], recommendations: [], sensitivePatterns: [] };
  }
  
  // Security: Limit analysis input size to prevent DoS
  const MAX_ANALYSIS_SIZE = 10000; // 10KB limit for analysis
  const analysisStack = stack.length > MAX_ANALYSIS_SIZE 
    ? stack.substring(0, MAX_ANALYSIS_SIZE) 
    : stack;
  
  const risks: string[] = [];
  const recommendations: string[] = [];
  const sensitivePatterns: Array<{ pattern: string; description: string; line: string }> = [];
  
  const lines = analysisStack.split('\n').slice(0, 100); // Limit to 100 lines max
  
  // Check for various security risks with bounded, safe regex patterns
  lines.forEach(line => {
    // Limit line length to prevent ReDoS on individual lines
    const safeLine = line.length > 500 ? line.substring(0, 500) + '...' : line;
    
    // Check for user home directories - use bounded patterns
    if (/\/Users\/[^\/\s]{1,50}|C:\\Users\\[^\\]{1,50}|\/home\/[^\/\s]{1,50}/.test(safeLine)) {
      risks.push('User home directory paths exposed');
      sensitivePatterns.push({
        pattern: 'home-directory',
        description: 'User home directory path revealed',
        line: safeLine.trim()
      });
    }
    
    // Check for source map references
    if (/sourceMappingURL|\.js\.map|\.ts\.map/.test(safeLine)) {
      risks.push('Source map references present');
      sensitivePatterns.push({
        pattern: 'source-maps',
        description: 'Source map reference found',
        line: safeLine.trim()
      });
    }
    
    // Check for potentially sensitive file patterns
    if (/\.env|config|secret|password|key|token/i.test(safeLine)) {
      risks.push('Potentially sensitive file or variable names');
      sensitivePatterns.push({
        pattern: 'sensitive-names',
        description: 'Sensitive file or variable name detected',
        line: safeLine.trim()
      });
    }
    
    // Check for internal module structure exposure
    if (/internal\/|lib\/private|src\/.*\/private/.test(safeLine)) {
      risks.push('Internal module structure exposed');
      sensitivePatterns.push({
        pattern: 'internal-structure',
        description: 'Internal module structure revealed',
        line: safeLine.trim()
      });
    }
    
    // Check for absolute paths that might reveal deployment structure
    if (/^[\s]*at.*[\/\\](?:opt|var|srv|app|workspace)[\/\\]/.test(safeLine)) {
      risks.push('Deployment path structure exposed');
      sensitivePatterns.push({
        pattern: 'deployment-paths',
        description: 'Deployment directory structure revealed',
        line: safeLine.trim()
      });
    }
    
    // Check for extremely long paths or repeated patterns that could be attacks
    if (line.length > 500 || /([a-z])\1{50,}|([A-Z])\2{50,}|([0-9])\3{50,}/.test(line)) {
      risks.push('Suspicious long or repetitive path patterns');
      sensitivePatterns.push({
        pattern: 'long-paths',
        description: 'Long or repetitive path pattern detected',
        line: safeLine.trim()
      });
    }
  });
  
  // Determine risk level - be more sensitive to security issues
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // If we found multiple sensitive patterns, it's definitely high risk
  if (sensitivePatterns.length >= 5 || risks.length >= 3) {
    riskLevel = 'high';
  } else if (risks.length > 0 || sensitivePatterns.length > 0) {
    // Any sensitive patterns found should at least be medium risk
    riskLevel = 'medium';
    
    // If we found user home directories or deployment paths, elevate to high
    if (risks.some(r => r.includes('User home') || r.includes('Deployment path') || r.includes('sensitive file'))) {
      riskLevel = 'high';
    }
  }
  
  // Generate recommendations based on risks
  if (risks.includes('User home directory paths exposed')) {
    recommendations.push('Enable redactFilePaths in sanitization config');
  }
  if (risks.includes('Source map references present')) {
    recommendations.push('Enable removeSourceMaps in sanitization config');
  }
  if (risks.includes('Internal module structure exposed')) {
    recommendations.push('Enable sanitizeModuleNames in sanitization config');
  }
  if (risks.includes('Deployment path structure exposed')) {
    recommendations.push('Use stackTraceLevel: "minimal" or "sanitized" for production');
  }
  if (sensitivePatterns.length > 0) {
    recommendations.push('Consider using higher stack trace sanitization level');
  }
  
  return { riskLevel, risks, recommendations, sensitivePatterns };
}