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
/**
 * Sanitizes file paths in stack traces to prevent information disclosure
 * 
 * Implements comprehensive path sanitization following SOLID principles by breaking
 * down the sanitization process into focused, single-responsibility functions.
 * Each step handles a specific category of path patterns to prevent information
 * leakage while maintaining stack trace readability for debugging.
 * 
 * @param stack - The stack trace string to sanitize
 * @returns Sanitized stack trace with sensitive paths redacted
 * 
 * @example
 * ```typescript
 * const unsafeStack = "Error: Test\\n  at /Users/admin/secret/file.js:10:5";
 * const safe = _sanitizePaths(unsafeStack);
 * // Result: "Error: Test\\n  at /Users/***"
 * ```
 * 
 * @security Prevents disclosure of user directories, system paths, and sensitive files
 * @internal This is a private function used by sanitizeStackTrace
 */
function _sanitizePaths(stack: string): string {
  let sanitized = stack;
  
  // Apply sanitization steps in logical order
  sanitized = _sanitizeControlCharacters(sanitized);
  sanitized = _sanitizeNodeModulesPaths(sanitized);
  sanitized = _sanitizePathTraversal(sanitized);
  sanitized = _sanitizeUserDirectories(sanitized);
  sanitized = _sanitizeSystemDirectories(sanitized);
  sanitized = _sanitizeProjectDirectories(sanitized);
  sanitized = _sanitizeUncAndDevicePaths(sanitized);
  sanitized = _sanitizeSensitiveFiles(sanitized);
  sanitized = _sanitizeBuildDirectories(sanitized);
  sanitized = _cleanupRepeatingCharacters(sanitized);
  
  return sanitized;
}

/**
 * Removes control characters while preserving essential formatting
 * 
 * Follows Single Responsibility Principle by focusing solely on control character
 * sanitization. Removes potentially dangerous control characters that could be used
 * for terminal manipulation attacks while preserving newlines and tabs needed for
 * proper stack trace formatting.
 * 
 * @param input - The input string to sanitize
 * @returns String with control characters removed, preserving newlines and tabs
 * 
 * @example
 * ```typescript
 * const malicious = "Error\x07\x1B[31m malicious content";
 * const safe = _sanitizeControlCharacters(malicious);
 * // Result: "Error malicious content" (bell and ANSI escape removed)
 * ```
 * 
 * @security Prevents terminal manipulation via control character injection
 * @internal Private helper function for path sanitization
 */
function _sanitizeControlCharacters(input: string): string {
  // Remove control characters but preserve newlines (\x0A) and tabs (\x09)
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}

/**
 * Handles node_modules path sanitization with consistent formatting
 * Ensures DRY principle by centralizing node_modules logic
 */
function _sanitizeNodeModulesPaths(input: string): string {
  let result = input;
  
  // Handle node_modules paths first to ensure consistent formatting
  // Pattern 1: Full path with subdirectories
  result = result.replace(/[^\/\n\r\t \(\)]*\/[^\/\n\r\t \(\)]*\/[^\/\n\r\t \(\)]*\/node_modules\/([^\\\/\n\r\t \)]+)\/+([^\\\/\n\r\t \)]+)/g, 'node_modules/$1/$2');
  
  // Pattern 2: Simple path with node_modules
  result = result.replace(/[^\/\n\r\t \(\)]*\/[^\/\n\r\t \(\)]*\/node_modules\/([^\\\/\n\r\t \)]+)/g, 'node_modules/$1/');
  
  // Pattern 3: Windows style paths
  result = result.replace(/C:\\[^\\]*\\[^\\]*\\node_modules\\([^\\\/\n\r\t \)]+)\\([^\\\/\n\r\t \)]+)/g, 'node_modules/$1/$2');
  result = result.replace(/C:\\[^\\]*\\node_modules\\([^\\\/\n\r\t \)]+)/g, 'node_modules/$1/');
  
  return result;
}

/**
 * Blocks path traversal attacks by sanitizing .. patterns
 * Focused on security-specific path traversal prevention
 */
function _sanitizePathTraversal(input: string): string {
  return input
    .replace(/\.\.[\\/]/g, '[PATH-TRAVERSAL]/')
    .replace(/[\\/]\.\.$/gm, '/[PATH-TRAVERSAL]')
    .replace(/\.\.[\\/]\.\.[\\/]/g, '[PATH-TRAVERSAL]/');
}

/**
 * Sanitizes user directory paths with cross-platform support
 * 
 * Handles mixed path separators and Windows-specific patterns to prevent
 * disclosure of sensitive user directory information. Processes Windows
 * backslash patterns first (most specific) then handles mixed separator
 * attack patterns that combine forward and backward slashes.
 * 
 * @param input - The input string containing potential user directory paths
 * @returns String with user directory paths sanitized to generic patterns
 * 
 * @example
 * ```typescript
 * const paths = "at C:\\Users\\administrator\\secrets\\file.js:10";
 * const safe = _sanitizeUserDirectories(paths);
 * // Result: "at C:\\Users\\***"
 * ```
 * 
 * @security Prevents disclosure of usernames and user directory structures
 * @internal Private helper for comprehensive path sanitization
 */
function _sanitizeUserDirectories(input: string): string {
  let result = input;
  
  // Unix-style user paths
  result = result.replace(/\/Users\/[^\/\n\r\t \)\:]+/g, '/Users/***');
  result = result.replace(/\/home\/[^\/\n\r\t \)\:]+/g, '/home/***');
  
  // Pure Windows backslash patterns first (most specific to least specific)
  // This preserves the expected C:\Users\*** format
  const windowsUserPatterns = [
    /C:\\Users\\[^\\*\n\r]+\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*/g,
    /C:\\Users\\[^\\*\n\r]+\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*\\[^\\\n\r]*/g,
    /C:\\Users\\[^\\*\n\r]+\\[^\\\n\r]*\\[^\\\n\r]*/g,
    /C:\\Users\\[^\\*\n\r]+\\[^\\\n\r]*/g,
    /C:\\Users\\[^\\*\n\r]+$/gm
  ];
  
  windowsUserPatterns.forEach(pattern => {
    result = result.replace(pattern, 'C:\\Users\\***');
  });
  
  // Mixed path separator patterns (e.g., C:/Users\\admin/) handled after pure Windows paths
  // This catches any remaining mixed patterns
  result = result.replace(/C:[\\/]Users[\\/\\]+[^\/\\\n\r\t \)\:*]+[\\/]/g, 'C:\\Users\\***');
  
  return result;
}

/**
 * Sanitizes system directory paths while preserving node_modules handling
 * Implements Open/Closed Principle by allowing path list extension
 */
function _sanitizeSystemDirectories(input: string): string {
  const systemPaths = [
    '/etc/', '/root/', '/opt/', '/var/', '/usr/', '/bin/', '/sbin/',
    'C:\\Windows\\', 'C:\\Program Files\\', 'C:\\ProgramData\\'
  ];

  return _sanitizePathList(input, systemPaths, (line) => {
    // Skip lines containing node_modules - they have dedicated handling
    return !line.includes('node_modules');
  });
}

/**
 * Sanitizes project and workspace directories
 * Conservative approach to avoid breaking legitimate stack traces
 */
function _sanitizeProjectDirectories(input: string): string {
  const projectPaths = [
    '/workspace/', '/project/', '/src/', '/dist/', '/build/'
  ];
  
  let result = input;
  
  projectPaths.forEach(path => {
    if (result.includes(path)) {
      const regex = new RegExp(path.replace(/[\\\/]/g, '[\\\\/]') + '[^\\\\/\\n\\r\\t \\)]*', 'gi');
      result = result.replace(regex, path + '***');
    }
  });
  
  // Handle complex workspace patterns
  result = result.replace(/\/mnt\/[^\/\n\r\t \)\:]+\/[^\/\n\r\t \)\:]+/g, '/mnt/***/***');
  
  return result;
}

/**
 * Sanitizes Windows UNC paths and device paths with comprehensive security
 * 
 * Handles device name sanitization and dangerous device blocking to prevent
 * access to sensitive Windows system resources. Processes UNC paths, device
 * paths, and dangerous device names that could expose system internals.
 * 
 * @param input - The input string containing potential UNC/device paths
 * @returns String with UNC and device paths sanitized
 * 
 * @example
 * ```typescript
 * const dangerous = "at \\\\.\\GLOBALROOT\\Device\\PhysicalDrive0";
 * const safe = _sanitizeUncAndDevicePaths(dangerous);
 * // Result: "at \\\\.\\[DEVICE]"
 * ```
 * 
 * @security Prevents access to Windows device paths and network shares
 * @internal Private helper for Windows-specific path sanitization
 */
function _sanitizeUncAndDevicePaths(input: string): string {
  let result = input;
  
  // UNC and device path patterns
  result = result.replace(/\\\\[^\\\/\n\r\t ]+\\[^\\\/\n\r\t ]*/g, '\\\\[SERVER]\\[SHARE]');
  result = result.replace(/\\\\\?\\/g, '\\\\[DEVICE]\\');
  result = result.replace(/\\\\\.\\[^\\\/\n\r\t ]*/g, '\\\\.\\[DEVICE]');
  
  // Dangerous device name sanitization
  const dangerousDevices = ['PhysicalDrive0', 'GLOBALROOT', 'Device', 'CON', 'PRN', 'AUX', 'NUL'];
  result = _sanitizeDangerousDeviceNames(result, dangerousDevices);
  
  // Drive roots and Unix device paths
  result = result.replace(/[A-Z]:\\$/gm, '[DRIVE]:\\');
  result = result.replace(/\/dev\/[^\/\n\r\t ]*/g, '/dev/[DEVICE]');
  
  return result;
}

/**
 * Sanitizes dangerous Windows device names with multiple pattern matching
 * 
 * Implements comprehensive device name blocking using multiple pattern matching
 * strategies to catch device names in various contexts (UNC paths, standalone
 * references, drive patterns). Helps prevent exposure of sensitive Windows
 * system devices and hardware identifiers.
 * 
 * @param input - The input string to scan for dangerous device names
 * @param devices - Array of dangerous device names to sanitize
 * @returns String with dangerous device names replaced with generic placeholders
 * 
 * @example
 * ```typescript
 * const dangerous = "Error at PhysicalDrive0: Access denied";
 * const safe = _sanitizeDangerousDeviceNames(dangerous, ['PhysicalDrive0']);
 * // Result: "Error at [DEVICE]: Access denied"
 * ```
 * 
 * @security Prevents disclosure of hardware device names and system identifiers
 * @internal Private helper implementing DRY principle for device name sanitization
 */
function _sanitizeDangerousDeviceNames(input: string, devices: string[]): string {
  let result = input;
  
  devices.forEach(device => {
    const patterns = [
      // Device names in UNC paths (pre-processing)
      { regex: new RegExp(`\\\\\\\\[^\\\\]*\\\\${device}\\b`, 'gi'), replacement: '\\\\[SERVER]\\[DEVICE]' },
      // Device names after UNC processing
      { regex: new RegExp(`\\\\\\\\\\[SERVER\\]\\\\\\[SHARE\\]\\\\${device}\\b`, 'gi'), replacement: '\\\\[SERVER]\\[SHARE]\\[DEVICE]' },
      // Standalone device references
      { regex: new RegExp(`\\b${device}\\b`, 'gi'), replacement: '[DEVICE]' },
      // Device colon patterns (e.g., PhysicalDrive0:)
      { regex: new RegExp(`\\b${device}:`, 'gi'), replacement: '[DEVICE]:' }
    ];
    
    patterns.forEach(({ regex, replacement }) => {
      result = result.replace(regex, replacement);
    });
  });
  
  return result;
}

/**
 * Sanitizes sensitive file references
 * Follows DRY principle with configurable file list
 */
function _sanitizeSensitiveFiles(input: string): string {
  const sensitiveFiles = ['passwd', 'shadow', 'hosts', 'secrets.txt', '.env', '.ssh'];
  let result = input;
  
  sensitiveFiles.forEach(file => {
    const fileRegex = new RegExp(file.replace('.', '\\.'), 'gi');
    result = result.replace(fileRegex, '[REDACTED]');
  });
  
  return result;
}

/**
 * Sanitizes build directory paths
 * Focused helper for build-specific path handling
 */
function _sanitizeBuildDirectories(input: string): string {
  return input.replace(/[\\/](dist|build|out)[\\/][^\\\/\n\r\t \)\:]*/g, '/$1/***');
}

/**
 * Cleans up repeating character sequences that might indicate injection attempts
 * Security-focused cleanup function
 */
function _cleanupRepeatingCharacters(input: string): string {
  return input.replace(/([a-z])\1{20,}/gi, '[REPEATED-CHARS]');
}

/**
 * Generic helper for sanitizing path lists with optional filtering
 * 
 * Implements DRY principle for path list processing by providing a reusable
 * function that can handle different types of path sanitization with optional
 * line-level filtering. Supports both simple global replacement and complex
 * line-by-line processing with custom filter functions.
 * 
 * @param input - The input string to sanitize
 * @param paths - Array of path patterns to sanitize
 * @param shouldProcess - Optional filter function for line-level processing
 * @returns String with specified paths sanitized according to the configuration
 * 
 * @example
 * ```typescript
 * const text = "Error at /etc/passwd\\n  at /node_modules/pkg/index.js";
 * const safe = _sanitizePathList(text, ['/etc/'], (line) => !line.includes('node_modules'));
 * // Result: "Error at /etc/***\\n  at /node_modules/pkg/index.js" (node_modules preserved)
 * ```
 * 
 * @security Provides flexible path sanitization with preservation of legitimate paths
 * @internal Private helper implementing DRY principle for path processing
 */
function _sanitizePathList(
  input: string, 
  paths: string[], 
  shouldProcess?: (line: string) => boolean
): string {
  let result = input;
  
  paths.forEach(path => {
    if (result.includes(path)) {
      if (shouldProcess) {
        // Line-by-line processing with filtering
        const lines = result.split('\n');
        const processedLines = lines.map(line => {
          if (!shouldProcess(line)) {
            return line; // Skip processing for filtered lines
          }
          const regex = new RegExp(path.replace(/[\\\/]/g, '[\\\\/]') + '[^\\\\/\\n\\r\\t ]*', 'gi');
          return line.replace(regex, path + '***');
        });
        result = processedLines.join('\n');
      } else {
        // Simple global replacement
        const regex = new RegExp(path.replace(/[\\\/]/g, '[\\\\/]') + '[^\\\\/\\n\\r\\t ]*', 'gi');
        result = result.replace(regex, path + '***');
      }
    }
  });
  
  return result;
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

// ===================================================================
// Task 1.3.3: Error Context Sanitization
// ===================================================================

/**
 * Configuration for error context sanitization behavior
 * 
 * Controls how error context information is handled during sanitization,
 * balancing security concerns with debugging requirements.
 * 
 * @example
 * ```typescript
 * const config: ErrorContextConfig = {
 *   generateSecureIds: true,
 *   preserveErrorCodes: true,
 *   redactionLevel: 'partial',
 *   includeContextHints: true,
 *   maxContextLength: 1000,
 *   allowedProperties: ['timestamp', 'level', 'operation']
 * };
 * ```
 */
export interface ErrorContextConfig {
  /** Whether to generate secure, non-sensitive error IDs */
  generateSecureIds: boolean;
  /** Whether to preserve error codes for debugging */
  preserveErrorCodes: boolean;
  /** Level of context redaction: 'none', 'partial', 'full' */
  redactionLevel: 'none' | 'partial' | 'full';
  /** Whether to include hints about redacted content */
  includeContextHints: boolean;
  /** Maximum allowed context length (DoS protection) */
  maxContextLength: number;
  /** List of allowed context properties to preserve */
  allowedProperties: string[];
  /** Whether to sanitize nested objects recursively */
  sanitizeNestedObjects: boolean;
  /** Whether to preserve timestamp information */
  preserveTimestamps: boolean;
  /** Whether to sanitize function names that might reveal internal structure */
  sanitizeFunctionNames: boolean;
  /** Custom patterns for context-specific sensitive data */
  customContextPatterns: RegExp[];
}

/**
 * Default configuration for error context sanitization
 * 
 * Provides secure defaults that protect sensitive information while
 * maintaining sufficient debugging context for troubleshooting.
 */
export const DEFAULT_ERROR_CONTEXT_CONFIG: ErrorContextConfig = {
  generateSecureIds: true,
  preserveErrorCodes: true,
  redactionLevel: 'partial',
  includeContextHints: true,
  maxContextLength: 1000,
  allowedProperties: ['timestamp', 'level', 'operation', 'component'],
  sanitizeNestedObjects: true,
  preserveTimestamps: true,
  sanitizeFunctionNames: true,
  customContextPatterns: []
};

/**
 * Result of error context sanitization
 * 
 * Contains the sanitized context along with metadata about
 * what was redacted and secure identifiers.
 */
export interface SanitizedErrorContext {
  /** Unique, secure identifier for this error */
  errorId: string;
  /** Sanitized error context object */
  context: Record<string, unknown>;
  /** Original error code if preserved */
  code?: string | number;
  /** Timestamp of the error (if preserved) */
  timestamp?: string;
  /** List of properties that were redacted */
  redactedProperties: string[];
  /** Security warnings about the original context */
  securityWarnings: string[];
  /** Whether any sensitive data was detected and removed */
  hadSensitiveData: boolean;
  /** Safe hints about redacted content for debugging */
  redactionHints: Record<string, string>;
}

/**
 * Information about detected sensitive content in error context
 */
export interface SensitiveContextDetection {
  /** Property path where sensitive data was found */
  propertyPath: string;
  /** Type of sensitive data detected */
  sensitiveType: string;
  /** Suggested replacement hint */
  hint: string;
  /** Severity level of the detection */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Sanitizes error context to prevent information disclosure
 * 
 * This function processes error context objects (commonly used in logging
 * and telemetry) to remove sensitive information while preserving debugging
 * value. It supports selective redaction, secure ID generation, and provides
 * hints about what was removed.
 * 
 * @param error - The error object to extract context from
 * @param additionalContext - Additional context to include
 * @param config - Configuration options for sanitization behavior
 * @returns Sanitized error context with secure identifier
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const result = sanitizeErrorContext(error, { userId: '12345', operation: 'login' });
 * console.log(result.errorId); // "ERR_2024_A3B7F9C2"
 * console.log(result.context.operation); // "login"
 * console.log(result.redactionHints.userId); // "User identifier (redacted)"
 * 
 * // Custom configuration
 * const result = sanitizeErrorContext(error, context, {
 *   redactionLevel: 'partial',
 *   allowedProperties: ['operation', 'timestamp'],
 *   customContextPatterns: [/internal-id-\d+/gi]
 * });
 * ```
 * 
 * @security This function prevents information disclosure by:
 * - Removing user credentials, API keys, and personal information
 * - Sanitizing file paths and system information
 * - Generating non-sensitive error identifiers
 * - Limiting context size to prevent DoS attacks
 * - Providing safe debugging hints without exposing sensitive data
 */
export function sanitizeErrorContext(
  error: Error,
  additionalContext: Record<string, unknown> = {},
  config: Partial<ErrorContextConfig> = {}
): SanitizedErrorContext {
  const fullConfig: ErrorContextConfig = _mergeConfigSafely(DEFAULT_ERROR_CONTEXT_CONFIG, config);

  const startTime = Date.now();
  const redactedProperties: string[] = [];
  const securityWarnings: string[] = [];
  const redactionHints: Record<string, string> = {};
  let hadSensitiveData = false;

  // Generate secure error ID
  const errorId = fullConfig.generateSecureIds 
    ? _generateSecureErrorId(error)
    : `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Build initial context with security filtering and safe error property access
  const rawContext: Record<string, unknown> = {};
  
  // Safely extract error properties with sanitization
  let messageSanitized = false;
  try {
    const rawMessage = error.message || 'Unknown error';
    // Use existing sanitization from Tasks 1.3.1-1.3.2
    const sanitizedMessage = sanitizeErrorMessage(rawMessage);
    rawContext.message = sanitizedMessage;
    // Check if sanitization actually changed the message
    messageSanitized = sanitizedMessage !== rawMessage;
  } catch {
    rawContext.message = 'Error message access failed';
  }
  
  try {
    rawContext.name = error.name || 'Error';
  } catch {
    rawContext.name = 'Error';
  }
  
  // Safely extract all enumerable properties from the error object
  try {
    for (const key in error) {
      if (key !== 'message' && key !== 'name' && key !== 'stack') {
        try {
          const value = (error as any)[key];
          if (value !== undefined) {
            rawContext[key] = value;
          }
        } catch {
          // Skip properties that throw during access
        }
      }
    }
  } catch {
    // Ignore if property enumeration fails
  }
  
  // Add additional context safely
  Object.assign(rawContext, additionalContext);

  // Remove dangerous properties that could be used for injection attacks
  const initialContext = _removeDangerousProperties(rawContext);
  
  // Early detection of problematic context structure before processing
  try {
    JSON.stringify(rawContext);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('circular')) {
      securityWarnings.push('Circular reference detected in raw context');
    } else {
      securityWarnings.push('Context serialization error detected');
    }
  }

  // Add error code if available and preservation is enabled
  if (fullConfig.preserveErrorCodes) {
    try {
      if ('code' in error && error.code !== undefined) {
        initialContext.code = error.code;
      }
    } catch {
      // Ignore if code property access fails
    }
  }

  // Add timestamp if preservation is enabled
  const timestamp = fullConfig.preserveTimestamps ? new Date().toISOString() : undefined;

  // DoS protection: Pre-truncate large context
  let processedContext = initialContext;
  let contextSize = 0;
  
  // Calculate rough context size
  for (const [, value] of Object.entries(initialContext)) {
    if (typeof value === 'string') {
      contextSize += value.length;
    } else if (typeof value === 'object' && value !== null) {
      try {
        contextSize += _safeJsonStringify(value).length;
      } catch {
        contextSize += 1000; // Estimate for objects we can't serialize
      }
    }
  }
  
  // Check if context is too large (including the base context from error)
  const sizeLimit = fullConfig.maxContextLength * 3;
  if (contextSize > sizeLimit) {
    securityWarnings.push('Large context detected - applying size limits for security');
    // Truncate each property that's too long
    for (const [key, value] of Object.entries(initialContext)) {
      if (typeof value === 'string' && value.length > 200) {
        initialContext[key] = value.substring(0, 200) + '...[truncated]';
        redactionHints[key] = 'Long content truncated for security';
      }
    }
    processedContext = initialContext;
  } else {
    try {
      // Test if we can safely serialize the context
      _safeJsonStringify(initialContext);
      processedContext = initialContext;
    } catch (error) {
      // Handle circular references or other serialization issues
      securityWarnings.push('Serialization error detected in context - applying safe fallback');
      processedContext = _removeDangerousProperties(initialContext);
    }
  }

  // Additional security checks for problematic context structure
  try {
    // Check for circular references more explicitly
    JSON.stringify(processedContext);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('circular')) {
      securityWarnings.push('Circular reference detected in context structure');
    }
  }

  // Check for properties that throw during access
  let hasThrowingProperties = false;
  for (const [, value] of Object.entries(processedContext)) {
    try {
      // Try to access the value to see if it throws
      JSON.stringify(value);
    } catch {
      hasThrowingProperties = true;
      break;
    }
  }
  
  if (hasThrowingProperties) {
    securityWarnings.push('Properties with access errors detected in context');
  }

  // Detect and handle sensitive content
  const sensitiveDetections = _detectSensitiveContent(processedContext, fullConfig);
  
  // Apply sanitization based on redaction level
  const sanitizedContext = _applyContextRedaction(
    processedContext, 
    sensitiveDetections, 
    fullConfig,
    redactedProperties,
    redactionHints
  );

  // Update flags based on detections and message sanitization
  hadSensitiveData = sensitiveDetections.length > 0 || messageSanitized;
  
  // Add security warnings for high-severity detections
  sensitiveDetections
    .filter(d => d.severity === 'high' || d.severity === 'critical')
    .forEach(d => securityWarnings.push(`${d.sensitiveType} detected in ${d.propertyPath}`));

  // Final size check with safe JSON serialization
  let finalSize: number;
  try {
    finalSize = _safeJsonStringify(sanitizedContext).length;
  } catch (error) {
    // If we can't serialize safely, estimate size and add warning
    finalSize = Object.keys(sanitizedContext).length * 50; // Rough estimate
    securityWarnings.push('Unable to calculate exact context size - using safe defaults');
  }
  
  if (finalSize > fullConfig.maxContextLength) {
    securityWarnings.push('Context size exceeded limits after sanitization');
    // Further truncate if needed
    for (const [key, value] of Object.entries(sanitizedContext)) {
      if (typeof value === 'string' && value.length > 100) {
        sanitizedContext[key] = value.substring(0, 100) + '...[size-limited]';
        redactionHints[key] = (redactionHints[key] || '') + ' (size limited)';
      }
    }
  }

  // Performance monitoring
  const processingTime = Date.now() - startTime;
  if (processingTime > 100) {
    securityWarnings.push(`Context sanitization took ${processingTime}ms - consider reducing context size`);
  }

  // Safely extract final error code
  let finalErrorCode: string | number | undefined;
  if (fullConfig.preserveErrorCodes) {
    try {
      if ('code' in error && error.code !== undefined) {
        finalErrorCode = error.code as string | number;
      }
    } catch {
      // Ignore if code property access fails
    }
  }

  return {
    errorId,
    context: sanitizedContext,
    code: finalErrorCode,
    timestamp,
    redactedProperties,
    securityWarnings,
    hadSensitiveData,
    redactionHints
  };
}

/**
 * Creates a safe error object for forwarding to external systems
 * 
 * This function sanitizes an error and its context for safe transmission
 * to logging, telemetry, or monitoring systems. It ensures no sensitive
 * information is leaked while maintaining debugging utility.
 * 
 * @param error - The error object to sanitize
 * @param context - Additional context to include
 * @param config - Configuration for sanitization behavior
 * @returns Safe error object ready for external forwarding
 * 
 * @example
 * ```typescript
 * // For telemetry systems
 * const safeError = createSafeErrorForForwarding(error, {
 *   operation: 'user-login',
 *   component: 'auth-service'
 * });
 * 
 * // Send to external monitoring
 * await telemetry.recordError(safeError);
 * 
 * // For logging systems with custom config
 * const safeError = createSafeErrorForForwarding(error, context, {
 *   redactionLevel: 'full',
 *   allowedProperties: ['timestamp', 'component']
 * });
 * ```
 * 
 * @security This function ensures safe external forwarding by:
 * - Applying comprehensive context sanitization
 * - Removing all stack trace information by default
 * - Generating correlation IDs instead of exposing internal error details
 * - Limiting payload size to prevent abuse
 */
export function createSafeErrorForForwarding(
  error: Error,
  context: Record<string, unknown> = {},
  config: Partial<ErrorContextConfig> = {}
): {
  errorId: string;
  message: string;
  type: string;
  timestamp: string;
  context: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high';
  metadata: {
    hadSensitiveData: boolean;
    redactedCount: number;
    securityWarnings: string[];
  };
} {
  // Use more restrictive defaults for external forwarding
  const forwardingConfig: ErrorContextConfig = {
    ...DEFAULT_ERROR_CONTEXT_CONFIG,
    redactionLevel: 'partial', // More restrictive by default
    maxContextLength: 500, // Smaller limit for external systems
    preserveTimestamps: true, // Always preserve timestamps for correlation
    ...config
  };

  // Sanitize the error context
  const sanitized = sanitizeErrorContext(error, context, forwardingConfig);

  // Sanitize the error message itself
  const sanitizedMessage = sanitizeErrorMessage(error.message, {
    maxMessageLength: 300,
    redactPasswords: true,
    redactApiKeys: true,
    redactFilePaths: true,
    redactDatabaseUrls: true,
    redactNetworkInfo: true,
    redactPersonalInfo: true
  });

  // Apply aggressive size limiting for telemetry systems
  let finalContext = sanitized.context;
  let finalSecurityWarnings = [...sanitized.securityWarnings];
  
  // Calculate the size of the result so far
  let currentSize = JSON.stringify({
    errorId: sanitized.errorId,
    message: sanitizedMessage,
    type: error.name || 'Error',
    timestamp: sanitized.timestamp || new Date().toISOString(),
    context: finalContext
  }).length;
  
  // If the payload is too large, apply aggressive reduction for telemetry
  const maxTelemetrySize = 8000; // Target under 10KB with some buffer
  if (currentSize > maxTelemetrySize) {
    finalSecurityWarnings.push('Payload size exceeded telemetry limits - applying aggressive reduction');
    
    // Priority order for property preservation
    const priorityProperties = ['timestamp', 'level', 'operation', 'component', 'status'];
    const reducedContext: Record<string, unknown> = {};
    
    // First, preserve high-priority properties
    for (const prop of priorityProperties) {
      if (prop in finalContext) {
        reducedContext[prop] = finalContext[prop];
      }
    }
    
    // Then add other properties until we hit the size limit
    const remainingProperties = Object.keys(finalContext).filter(key => !priorityProperties.includes(key));
    for (const prop of remainingProperties) {
      const testContext = { ...reducedContext, [prop]: finalContext[prop] };
      const testSize = JSON.stringify({
        errorId: sanitized.errorId,
        message: sanitizedMessage,
        type: error.name || 'Error',
        timestamp: sanitized.timestamp || new Date().toISOString(),
        context: testContext
      }).length;
      
      if (testSize < maxTelemetrySize) {
        reducedContext[prop] = finalContext[prop];
      } else {
        // Try with truncated property value if it's a string
        if (typeof finalContext[prop] === 'string') {
          const truncated = (finalContext[prop] as string).substring(0, 50) + '...[truncated]';
          const testTruncatedContext = { ...reducedContext, [prop]: truncated };
          const testTruncatedSize = JSON.stringify({
            errorId: sanitized.errorId,
            message: sanitizedMessage,
            type: error.name || 'Error',
            timestamp: sanitized.timestamp || new Date().toISOString(),
            context: testTruncatedContext
          }).length;
          
          if (testTruncatedSize < maxTelemetrySize) {
            reducedContext[prop] = truncated;
          }
        }
        // If we can't fit it even truncated, stop adding properties
        break;
      }
    }
    
    finalContext = reducedContext;
  }

  // Limit security warnings for telemetry to prevent payload bloat
  const maxTelemetryWarnings = 10;
  if (finalSecurityWarnings.length > maxTelemetryWarnings) {
    const warningCount = finalSecurityWarnings.length;
    finalSecurityWarnings = finalSecurityWarnings.slice(0, maxTelemetryWarnings);
    finalSecurityWarnings.push(`... and ${warningCount - maxTelemetryWarnings} more security warnings (truncated for telemetry)`);
  }

  // Determine severity based on error type and sensitive data detection
  let severity: 'low' | 'medium' | 'high' = 'low';
  if (sanitized.hadSensitiveData || finalSecurityWarnings.length > 0) {
    severity = 'medium';
  }
  if (error.name === 'SecurityError' || error.message.toLowerCase().includes('security')) {
    severity = 'high';
  }

  return {
    errorId: sanitized.errorId,
    message: sanitizedMessage,
    type: error.name || 'Error',
    timestamp: sanitized.timestamp || new Date().toISOString(),
    context: finalContext,
    severity,
    metadata: {
      hadSensitiveData: sanitized.hadSensitiveData,
      redactedCount: sanitized.redactedProperties.length,
      securityWarnings: finalSecurityWarnings
    }
  };
}

/**
 * Analyzes error context for sensitive information without modifying it
 * 
 * This function performs a security analysis of error context to identify
 * potential information disclosure risks. Useful for auditing and security
 * monitoring without actually sanitizing the content.
 * 
 * @param context - The context object to analyze
 * @param config - Configuration for analysis behavior
 * @returns Analysis results with detected risks and recommendations
 * 
 * @example
 * ```typescript
 * const analysis = analyzeErrorContextSecurity({
 *   user: { email: 'user@example.com', password: 'secret' },
 *   apiKey: 'sk-123456789',
 *   filePath: '/home/user/.env'
 * });
 * 
 * console.log(analysis.riskLevel); // 'high'
 * console.log(analysis.sensitiveDetections.length); // 3
 * console.log(analysis.recommendations); // ['Remove user credentials', 'Redact API keys', ...]
 * ```
 */
export function analyzeErrorContextSecurity(
  context: Record<string, unknown>,
  config: Partial<ErrorContextConfig> = {}
): {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sensitiveDetections: SensitiveContextDetection[];
  recommendations: string[];
  estimatedRedactionPercentage: number;
} {
  const fullConfig: ErrorContextConfig = {
    ...DEFAULT_ERROR_CONTEXT_CONFIG,
    ...config
  };

  const sensitiveDetections = _detectSensitiveContent(context, fullConfig);
  const totalProperties = _countProperties(context);
  const sensitiveProperties = sensitiveDetections.length;

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  const criticalDetections = sensitiveDetections.filter(d => d.severity === 'critical').length;
  const highDetections = sensitiveDetections.filter(d => d.severity === 'high').length;
  const mediumDetections = sensitiveDetections.filter(d => d.severity === 'medium').length;

  if (criticalDetections > 0) {
    riskLevel = 'critical';
  } else if (highDetections >= 2 || sensitiveProperties >= 5) {
    riskLevel = 'high';
  } else if (highDetections > 0 || mediumDetections >= 2) {
    riskLevel = 'medium';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (criticalDetections > 0) {
    recommendations.push('CRITICAL: Remove all credential and authentication information');
  }
  if (sensitiveDetections.some(d => d.sensitiveType.includes('password'))) {
    recommendations.push('Remove password and authentication data');
  }
  if (sensitiveDetections.some(d => d.sensitiveType.includes('api'))) {
    recommendations.push('Remove API keys and tokens');
  }
  if (sensitiveDetections.some(d => d.sensitiveType.includes('path'))) {
    recommendations.push('Sanitize file paths and directory information');
  }
  if (sensitiveDetections.some(d => d.sensitiveType.includes('personal'))) {
    recommendations.push('Remove personal information (emails, names, etc.)');
  }
  if (sensitiveProperties > totalProperties * 0.3) {
    recommendations.push('Consider using redactionLevel: "full" due to high sensitive content ratio');
  }
  if (totalProperties > 20) {
    recommendations.push('Reduce context size - large contexts increase information disclosure risk');
  }

  const estimatedRedactionPercentage = totalProperties > 0 
    ? Math.round((sensitiveProperties / totalProperties) * 100)
    : 0;

  return {
    riskLevel,
    sensitiveDetections,
    recommendations,
    estimatedRedactionPercentage
  };
}

// ===================================================================
// Task 1.3.3: Helper Functions (Following SOLID Principles)
// ===================================================================

/**
 * Generates a secure, non-sensitive error identifier
 * 
 * Creates identifiers that are unique for correlation but don't expose
 * sensitive information about the system or error content.
 * 
 * @param error - The error to generate an ID for
 * @returns Secure error identifier
 */
function _generateSecureErrorId(error: Error): string {
  const timestamp = Date.now();
  const year = new Date().getFullYear();
  const random = Math.random();
  
  // Create a hash based on error properties but not sensitive content
  const hashInput = `${error.name}-${error.message.length}-${timestamp}-${random}`;
  const hash = _simpleHash(hashInput);
  
  // Format: ERR_YEAR_HASH (e.g., ERR_2024_A3B7F9C2)
  // Ensure exactly 8 characters by padding with zeros
  const paddedHash = hash.substring(0, 8).toUpperCase().padEnd(8, '0');
  return `ERR_${year}_${paddedHash}`;
}

/**
 * Simple hash function for generating error IDs
 * 
 * @param input - String to hash
 * @returns Hash string
 */
function _simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Detects sensitive content in error context
 * 
 * @param context - Context object to analyze
 * @param config - Configuration for detection
 * @returns Array of sensitive content detections
 */
function _detectSensitiveContent(
  context: Record<string, unknown>,
  config: ErrorContextConfig
): SensitiveContextDetection[] {
  const detections: SensitiveContextDetection[] = [];

  function analyzeValue(value: unknown, path: string): void {
    if (typeof value === 'string') {
      _analyzeSensitiveString(value, path, detections);
    } else if (typeof value === 'object' && value !== null && config.sanitizeNestedObjects) {
      if (Array.isArray(value)) {
        // Check if array contains sensitive items
        let hasSensitiveItems = false;
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            const itemDetections: SensitiveContextDetection[] = [];
            _analyzeSensitiveString(JSON.stringify(item), `${path}[${index}]`, itemDetections);
            if (itemDetections.length > 0) {
              hasSensitiveItems = true;
              detections.push(...itemDetections);
            }
          } else if (typeof item === 'string') {
            _analyzeSensitiveString(item, `${path}[${index}]`, detections);
          }
        });
        
        // If array has sensitive content, mark the whole array
        if (hasSensitiveItems) {
          detections.push({
            propertyPath: path,
            sensitiveType: 'sensitive-array',
            hint: 'Array containing sensitive data',
            severity: 'high'
          });
        }
      } else {
        Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
          analyzeValue(val, path ? `${path}.${key}` : key);
        });
      }
    }
  }

  Object.entries(context).forEach(([key, value]) => {
    analyzeValue(value, key);
  });

  return detections;
}

/**
 * Analyzes a string value for sensitive content patterns
 * 
 * @param value - String value to analyze
 * @param path - Property path for reporting
 * @param detections - Array to add detections to
 */
function _analyzeSensitiveString(
  value: string,
  path: string,
  detections: SensitiveContextDetection[]
): void {
  // Check for passwords
  if (/password|passwd|pwd|secret|key/i.test(path) || 
      /password[=:]\s*\S+|secret[=:]\s*\S+/i.test(value)) {
    detections.push({
      propertyPath: path,
      sensitiveType: 'password/secret',
      hint: 'Authentication credential',
      severity: 'critical'
    });
  }

  // Check for API keys and tokens
  if (/api[_-]?key|token|bearer|authorization/i.test(path) ||
      /sk-[a-zA-Z0-9]+|pk-[a-zA-Z0-9]+|[a-zA-Z0-9]{32,}/g.test(value)) {
    detections.push({
      propertyPath: path,
      sensitiveType: 'api-key/token',
      hint: 'API authentication token',
      severity: 'critical'
    });
  }

  // Check for email addresses
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(value)) {
    detections.push({
      propertyPath: path,
      sensitiveType: 'personal-email',
      hint: 'Email address',
      severity: 'high'
    });
  }

  // Check for file paths
  if (/^\/|^[A-Z]:[\\\/]|\/home\/|\/Users\/|\\Users\\/.test(value)) {
    detections.push({
      propertyPath: path,
      sensitiveType: 'file-path',
      hint: 'File system path',
      severity: 'medium'
    });
  }

  // Check for URLs with credentials
  if (/https?:\/\/[^:]+:[^@]+@/.test(value)) {
    detections.push({
      propertyPath: path,
      sensitiveType: 'url-with-credentials',
      hint: 'URL containing credentials',
      severity: 'critical'
    });
  }

  // Check for database connection strings
  if (/(mongodb|mysql|postgres|redis):\/\//.test(value) && /:.*@/.test(value)) {
    detections.push({
      propertyPath: path,
      sensitiveType: 'database-connection',
      hint: 'Database connection string',
      severity: 'critical'
    });
  }

  // Check for IP addresses
  if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(value)) {
    detections.push({
      propertyPath: path,
      sensitiveType: 'ip-address',
      hint: 'IP address',
      severity: 'medium'
    });
  }
}

/**
 * Applies context redaction based on configuration and detections
 * 
 * @param context - Original context object
 * @param detections - Sensitive content detections
 * @param config - Configuration for redaction
 * @param redactedProperties - Array to track redacted properties
 * @param redactionHints - Object to store redaction hints
 * @returns Sanitized context object
 */
function _applyContextRedaction(
  context: Record<string, unknown>,
  detections: SensitiveContextDetection[],
  config: ErrorContextConfig,
  redactedProperties: string[],
  redactionHints: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Helper to check if a property should be preserved
  const isAllowedProperty = (key: string): boolean => {
    return config.allowedProperties.includes(key) || 
           config.allowedProperties.includes('*');
  };

  // Helper to check if a path has sensitive content
  const hasSensitiveContent = (path: string): boolean => {
    return detections.some(d => 
      d.propertyPath === path || 
      d.propertyPath.startsWith(path + '.') ||
      path.startsWith(d.propertyPath + '.')
    );
  };

  // Helper to get the detection for a path
  const getDetection = (path: string): SensitiveContextDetection | undefined => {
    return detections.find(d => d.propertyPath === path);
  };

  for (const [key, value] of Object.entries(context)) {
    const hasDetection = hasSensitiveContent(key);
    const isAllowed = isAllowedProperty(key);

    if (config.redactionLevel === 'none') {
      // No redaction - include everything
      result[key] = value;
    } else if (config.redactionLevel === 'full') {
      // Full redaction - only include explicitly allowed properties
      if (isAllowed) {
        result[key] = value;
      } else {
        redactedProperties.push(key);
        if (config.includeContextHints) {
          redactionHints[key] = 'Property redacted (full redaction mode)';
        }
      }
    } else if (config.redactionLevel === 'partial') {
      // Partial redaction - remove detected sensitive content
      if (hasDetection) {
        redactedProperties.push(key);
        const detection = getDetection(key);
        if (config.includeContextHints && detection) {
          redactionHints[key] = detection.hint;
        } else if (config.includeContextHints) {
          redactionHints[key] = 'Sensitive content detected';
        }
      } else {
        // Not sensitive - include it (potentially with nested sanitization)
        result[key] = config.sanitizeNestedObjects ? 
          _sanitizeNestedValue(value, `${key}`, detections, config) : 
          value;
      }
    }
  }

  return result;
}

/**
 * Sanitizes nested values in objects and arrays
 * 
 * @param value - Value to sanitize
 * @param path - Current property path
 * @param detections - Sensitive content detections
 * @param config - Configuration for sanitization
 * @returns Sanitized value
 */
function _sanitizeNestedValue(
  value: unknown,
  path: string,
  detections: SensitiveContextDetection[],
  config: ErrorContextConfig
): unknown {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map((item, index) => {
        const itemPath = `${path}[${index}]`;
        const hasDetection = detections.some(d => d.propertyPath === itemPath);
        return hasDetection ? '[redacted]' : _sanitizeNestedValue(item, itemPath, detections, config);
      });
    } else {
      const result: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        const nestedPath = `${path}.${key}`;
        const hasDetection = detections.some(d => d.propertyPath === nestedPath);
        if (!hasDetection) {
          result[key] = _sanitizeNestedValue(val, nestedPath, detections, config);
        }
      });
      return result;
    }
  }
  return value;
}

/**
 * Counts the total number of properties in a nested object
 * 
 * @param obj - Object to count properties in
 * @returns Total property count
 */
function _countProperties(obj: Record<string, unknown>): number {
  let count = 0;
  
  function countRecursive(value: unknown): void {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        count += value.length;
        value.forEach(item => countRecursive(item));
      } else {
        const entries = Object.entries(value as Record<string, unknown>);
        count += entries.length;
        entries.forEach(([, val]) => countRecursive(val));
      }
    }
  }
  
  countRecursive(obj);
  return count;
}

/**
 * Removes dangerous properties that could be used for context injection attacks
 * 
 * @param obj - Object to clean
 * @param visited - Set to track visited objects (for circular reference protection)
 * @returns Cleaned object without dangerous properties
 */
function _removeDangerousProperties(
  obj: Record<string, unknown>, 
  visited: WeakSet<object> = new WeakSet()
): Record<string, unknown> {
  // Check for circular reference
  if (visited.has(obj)) {
    return {}; // Return empty object for circular references
  }
  visited.add(obj);
  
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const cleaned: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip dangerous keys
    if (dangerousKeys.includes(key)) {
      continue;
    }
    
    // Recursively clean nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      try {
        cleaned[key] = _removeDangerousProperties(value as Record<string, unknown>, visited);
      } catch {
        // If we can't process it safely, skip it
        continue;
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Safe JSON stringification that handles problematic data types
 * 
 * @param obj - Object to stringify
 * @returns JSON string or fallback representation
 */
function _safeJsonStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, (_key, value) => {
      // Handle BigInt
      if (typeof value === 'bigint') {
        return `[BigInt: ${value.toString()}]`;
      }
      
      // Handle functions
      if (typeof value === 'function') {
        return `[Function: ${value.name || 'anonymous'}]`;
      }
      
      // Handle symbols
      if (typeof value === 'symbol') {
        return `[Symbol: ${value.toString()}]`;
      }
      
      // Handle undefined (normally omitted)
      if (value === undefined) {
        return '[Undefined]';
      }
      
      // Handle RegExp
      if (value instanceof RegExp) {
        return `[RegExp: ${value.toString()}]`;
      }
      
      // Handle Date
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      // Handle Buffer and typed arrays
      if (value instanceof Buffer) {
        return `[Buffer: ${value.length} bytes]`;
      }
      
      if (value instanceof Uint8Array) {
        return `[Uint8Array: ${value.length} bytes]`;
      }
      
      if (value instanceof ArrayBuffer) {
        return `[ArrayBuffer: ${value.byteLength} bytes]`;
      }
      
      return value;
    });
  } catch (error) {
    // Fallback for objects that can't be stringified
    return `[Object: ${typeof obj}]`;
  }
}

/**
 * Safely merges configuration objects, handling invalid values
 * 
 * @param defaultConfig - Default configuration
 * @param userConfig - User-provided configuration
 * @returns Merged configuration with fallbacks for invalid values
 */
function _mergeConfigSafely(
  defaultConfig: ErrorContextConfig,
  userConfig: Partial<ErrorContextConfig>
): ErrorContextConfig {
  const merged: ErrorContextConfig = { ...defaultConfig };
  
  if (!userConfig || typeof userConfig !== 'object') {
    return merged;
  }
  
  // Safely merge each property with validation
  if (typeof userConfig.redactionLevel === 'string' && 
      ['none', 'partial', 'full'].includes(userConfig.redactionLevel)) {
    merged.redactionLevel = userConfig.redactionLevel;
  }
  
  if (typeof userConfig.maxContextLength === 'number' && userConfig.maxContextLength >= 0) {
    merged.maxContextLength = userConfig.maxContextLength;
  }
  
  if (Array.isArray(userConfig.allowedProperties)) {
    merged.allowedProperties = userConfig.allowedProperties.filter(prop => 
      typeof prop === 'string'
    );
  }
  
  if (Array.isArray(userConfig.customContextPatterns)) {
    merged.customContextPatterns = userConfig.customContextPatterns.filter(pattern => 
      pattern instanceof RegExp
    );
  }
  
  if (typeof userConfig.preserveTimestamps === 'boolean') {
    merged.preserveTimestamps = userConfig.preserveTimestamps;
  }
  
  if (typeof userConfig.preserveErrorCodes === 'boolean') {
    merged.preserveErrorCodes = userConfig.preserveErrorCodes;
  }
  
  if (typeof userConfig.generateSecureIds === 'boolean') {
    merged.generateSecureIds = userConfig.generateSecureIds;
  }
  
  if (typeof userConfig.sanitizeNestedObjects === 'boolean') {
    merged.sanitizeNestedObjects = userConfig.sanitizeNestedObjects;
  }
  
  if (typeof userConfig.includeContextHints === 'boolean') {
    merged.includeContextHints = userConfig.includeContextHints;
  }
  
  if (typeof userConfig.sanitizeFunctionNames === 'boolean') {
    merged.sanitizeFunctionNames = userConfig.sanitizeFunctionNames;
  }
  
  return merged;
}