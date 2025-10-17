/**
 * Log injection protection and security utilities
 * 
 * Provides comprehensive protection against log injection attacks including:
 * - ANSI escape sequences for terminal manipulation
 * - Control characters that can corrupt logs
 * - Carriage return/line feed injection
 * - Terminal bell and other disruptive characters
 * - Unicode bidirectional override attacks
 * - Format string attacks
 */

/**
 * Configuration for log injection protection
 */
export interface LogInjectionConfig {
    enableProtection?: boolean;
    maxLineLength?: number;
    allowControlChars?: boolean;
    preserveFormatting?: boolean;
    warningThreshold?: number;
}

/**
 * Default configuration for log injection protection
 */
const DEFAULT_LOG_INJECTION_CONFIG: Required<LogInjectionConfig> = {
    enableProtection: true,
    maxLineLength: 2000,
    allowControlChars: false,
    preserveFormatting: false,
    warningThreshold: 1000
};

/**
 * Sanitize log output to prevent log injection attacks
 * 
 * Protects against:
 * - ANSI escape sequences for terminal manipulation
 * - Control characters that can corrupt logs
 * - Carriage return/line feed injection
 * - Terminal bell and other disruptive characters
 * - Unicode bidirectional override attacks
 * - Format string attacks
 */
export function sanitizeLogOutput(message: string): string {
    if (!message || typeof message !== 'string') {
        return '';
    }
    
    return message
        // Remove ANSI escape sequences (terminal color/cursor manipulation)
        .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
        .replace(/\x1B\][0-9]*;[^\x07\x1B]*(?:\x07|\x1B\\)/g, '')
        .replace(/\x1B[P^_].*?(?:\x1B\\|\x07)/g, '')
        
        // Remove terminal bell and other disruptive sequences
        .replace(/\x07/g, '') // Bell character
        .replace(/\x1B\x63/g, '') // Reset terminal
        .replace(/\x1B./g, '') // Any remaining ESC sequences
        
        // Remove dangerous control characters (excluding ESC which we handled above)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1A\x1C-\x1F\x7F]/g, '') // Control chars except \t, \n, \r, ESC
        
        // Handle line ending injection attempts
        .replace(/\r\n/g, ' [CRLF] ')  // Windows line endings
        .replace(/\r/g, ' [CR] ')      // Mac classic line endings
        .replace(/\n/g, ' [LF] ')      // Unix line endings
        
        // Prevent Unicode bidirectional override attacks
        .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
        
        // Remove potential format string specifiers
        .replace(/%[diouxXeEfFgGaAcspn%]/g, '[FORMAT]')
        
        // Limit excessive whitespace
        .replace(/\s{10,}/g, ' [WHITESPACE] ')
        
        // Truncate extremely long messages to prevent log flooding
        .slice(0, 2000);
}

/**
 * Enhanced log sanitization with configurable protection levels
 * 
 * Provides comprehensive protection against log injection while allowing
 * developers to configure the level of sanitization based on their needs.
 */
export function sanitizeLogOutputAdvanced(
    message: string, 
    config: LogInjectionConfig = {}
): string {
    if (!message || typeof message !== 'string') {
        return '';
    }
    
    const finalConfig = { ...DEFAULT_LOG_INJECTION_CONFIG, ...config };
    
    if (!finalConfig.enableProtection) {
        return message;
    }
    
    let sanitized = message;
    
    // Basic sanitization always applied
    if (!finalConfig.allowControlChars) {
        // Remove dangerous control characters
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Handle ANSI escape sequences
        sanitized = sanitized
            .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
            .replace(/\x1B\][0-9]*;[^\x07\x1B]*(?:\x07|\x1B\\)/g, '')
            .replace(/\x1B[P^_].*?(?:\x1B\\|\x07)/g, '');
    }
    
    // Line ending injection protection
    if (!finalConfig.preserveFormatting) {
        sanitized = sanitized
            .replace(/\r\n/g, ' ')
            .replace(/[\r\n]/g, ' ');
    }
    
    // Length protection
    if (sanitized.length > finalConfig.maxLineLength) {
        sanitized = sanitized.slice(0, finalConfig.maxLineLength) + '[TRUNCATED]';
    }
    
    // Warning for suspicious content
    if (sanitized.length > finalConfig.warningThreshold) {
        console.warn('[Log Security] Large log message detected, potential flooding attempt');
    }
    
    return sanitized;
}

/**
 * Analyze log content for potential security risks
 * 
 * Performs comprehensive security analysis to detect various injection patterns
 * and assign appropriate risk levels for monitoring and alerting.
 */
export function analyzeLogSecurity(message: string): {
    hasAnsiEscapes: boolean;
    hasControlChars: boolean;
    hasLineInjection: boolean;
    hasFormatStrings: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
} {
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    const hasAnsiEscapes = /\x1B\[[0-9;]*[a-zA-Z]/.test(message);
    const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(message);
    const hasLineInjection = /[\r\n]/.test(message);
    const hasFormatStrings = /%[diouxXeEfFgGaAcspn%]/.test(message);
    
    if (hasAnsiEscapes) {
        warnings.push('ANSI escape sequences detected');
        riskLevel = 'medium';
    }
    
    if (hasControlChars) {
        warnings.push('Control characters detected');
        riskLevel = 'medium';
    }
    
    if (hasLineInjection) {
        warnings.push('Line injection patterns detected');
        riskLevel = 'high';
    }
    
    if (hasFormatStrings) {
        warnings.push('Format string specifiers detected');
        riskLevel = 'medium';
    }
    
    if (message.length > 5000) {
        warnings.push('Extremely long message detected');
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }
    
    return {
        hasAnsiEscapes,
        hasControlChars,
        hasLineInjection,
        hasFormatStrings,
        riskLevel,
        warnings
    };
}