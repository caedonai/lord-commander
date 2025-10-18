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
  preserveErrorCodes: true
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
  
  // Merge with defaults
  const fullConfig = { ...DEFAULT_ERROR_SANITIZATION_CONFIG, ...config };
  
  // In production, remove completely if configured
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && fullConfig.removeStackInProduction) {
    return '';
  }
  
  let sanitizedStack = stack;
  
  // Apply file path sanitization if configured
  if (fullConfig.redactFilePaths) {
    sanitizedStack = sanitizedStack
      // First, sanitize user home directories BEFORE node_modules cleanup
      .replace(/\/Users\/[^\/\s]+/g, '/Users/***')
      .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\***')
      .replace(/\/home\/[^\/\s]+/g, '/home/***')
      // Then remove absolute file paths but preserve already-sanitized user directories
      // Skip paths that contain sanitized user directories
      .replace(/(C:\\Users\\\*\*\*\\.*?)\\node_modules/gi, (_match, userPath) => {
        return userPath + '\\node_modules';
      })
      .replace(/\/.*?\/node_modules/g, 'node_modules')
      .replace(/C:\\(?!Users\\\*\*\*).*?\\node_modules/gi, 'node_modules')
      .replace(/[C-Z]:[\\/](?!Users[\\/]\*\*\*).*?[\\/]node_modules/gi, 'node_modules')
      // Normalize ALL backslashes to forward slashes in node_modules paths
      .replace(/node_modules\\+/g, 'node_modules/')
      .replace(/(node_modules\/[^\\:\n\s]*?)\\+/g, '$1/')
      // Remove other potentially sensitive paths
      .replace(/\/opt\/[^\/]+/g, '/opt/***')
      .replace(/\/var\/[^\/]+/g, '/var/***')
      .replace(/\/etc\/[^\/]+/g, '/etc/***');
  }
  
  // Limit stack depth
  const lines = sanitizedStack.split('\n');
  if (lines.length > fullConfig.maxStackDepth) {
    return lines.slice(0, fullConfig.maxStackDepth).join('\n') + 
           `\n... [${lines.length - fullConfig.maxStackDepth} more frames hidden for security]`;
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
    },
    staging: {
      ...DEFAULT_ERROR_SANITIZATION_CONFIG,
      maxMessageLength: 750,
      maxStackDepth: 15,
      removeStackInProduction: false,
    },
    production: {
      ...DEFAULT_ERROR_SANITIZATION_CONFIG,
      maxMessageLength: 250,
      maxStackDepth: 5,
      removeStackInProduction: true,
    },
  };
  
  return { ...baseConfigs[environment], ...customOverrides };
}