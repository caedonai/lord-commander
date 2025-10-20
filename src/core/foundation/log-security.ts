/**
 * Enhanced Log Injection Protection and Terminal Manipulation Prevention
 * 
 * Task 1.4.1: Log Injection Protection Enhancement - Comprehensive Security Framework
 * 
 * Provides enterprise-grade protection against advanced log injection attacks including:
 * - ANSI escape sequences and terminal manipulation
 * - Control characters and terminal reset commands
 * - Carriage return/line feed injection and log spoofing
 * - Terminal bell, cursor manipulation, and screen clearing
 * - Unicode bidirectional override and homograph attacks
 * - Format string attacks and command execution attempts
 * - Terminal title manipulation and window control
 * - OSC (Operating System Command) sequence attacks
 * - Device control string attacks and screen buffer manipulation
 * - Hyperlink injection and clickjacking attempts
 * 
 * @security Comprehensive protection against 15+ categories of terminal manipulation
 * @compliance OWASP logging guidelines, CWE-117 (Improper Output Neutralization)
 * @performance Optimized with pre-compiled regex patterns and bounded execution
 */

/**
 * Enhanced configuration for comprehensive log injection protection
 * 
 * @security Configurable protection levels for different deployment environments
 */
export interface LogInjectionConfig {
    /** Enable/disable all log injection protection */
    enableProtection?: boolean;
    
    /** Maximum allowed line length before truncation */
    maxLineLength?: number;
    
    /** Allow basic control characters (tab, newline) */
    allowControlChars?: boolean;
    
    /** Preserve legitimate formatting (newlines, tabs) */
    preserveFormatting?: boolean;
    
    /** Threshold for generating security warnings */
    warningThreshold?: number;
    
    /** Protection level: strict, standard, permissive */
    protectionLevel?: 'strict' | 'standard' | 'permissive';
    
    /** Enable terminal manipulation detection */
    detectTerminalManipulation?: boolean;
    
    /** Enable Unicode attack detection */
    detectUnicodeAttacks?: boolean;
    
    /** Enable hyperlink injection detection */
    detectHyperlinkInjection?: boolean;
    
    /** Enable command execution pattern detection */
    detectCommandExecution?: boolean;
    
    /** Custom dangerous patterns to detect */
    customDangerousPatterns?: RegExp[];
    
    /** Callback for security violations */
    onSecurityViolation?: (violation: LogSecurityViolation) => void;
}

/**
 * Security violation details for log injection attempts
 * 
 * @security Provides detailed information about detected attacks for monitoring
 */
export interface LogSecurityViolation {
    /** Type of security violation detected */
    type: 'ansi-escape' | 'control-chars' | 'line-injection' | 'format-string' | 
          'terminal-manipulation' | 'unicode-attack' | 'hyperlink-injection' | 
          'command-execution' | 'length-overflow' | 'custom-pattern';
    
    /** Severity level of the violation */
    severity: 'low' | 'medium' | 'high' | 'critical';
    
    /** Description of the attack detected */
    description: string;
    
    /** Original malicious input (sanitized for logging) */
    originalInput: string;
    
    /** Sanitized output */
    sanitizedOutput: string;
    
    /** Matched pattern or rule */
    matchedPattern?: string;
    
    /** Position in input where violation was found */
    position?: number;
    
    /** Timestamp of detection */
    timestamp: Date;
    
    /** Recommended action */
    recommendedAction: 'block' | 'warn' | 'audit' | 'monitor';
}

/**
 * Enhanced default configuration for comprehensive log injection protection
 * 
 * @security Provides secure-by-default configuration with enterprise-grade protection
 */
const DEFAULT_LOG_INJECTION_CONFIG: Required<LogInjectionConfig> = {
    enableProtection: true,
    maxLineLength: 2000,
    allowControlChars: false,
    preserveFormatting: false,
    warningThreshold: 1000,
    protectionLevel: 'standard',
    detectTerminalManipulation: true,
    detectUnicodeAttacks: true,
    detectHyperlinkInjection: true,
    detectCommandExecution: true,
    customDangerousPatterns: [],
    onSecurityViolation: undefined
};

/**
 * Comprehensive terminal manipulation attack patterns
 * 
 * @security Pre-compiled regex patterns for optimal performance and comprehensive coverage
 */
const TERMINAL_ATTACK_PATTERNS = {
    // ANSI escape sequences - cursor control, colors, screen manipulation
    ANSI_CSI: /\x1B\[[0-9;]*[a-zA-Z]/g,                    // Control Sequence Introducer
    ANSI_OSC: /\x1B\][0-9]*;[^\x07\x1B]*(?:\x07|\x1B\\)/g, // Operating System Command
    ANSI_DCS: /\x1B[P^_].*?(?:\x1B\\|\x07)/g,              // Device Control String
    ANSI_APC: /\x1B_.*?(?:\x1B\\|\x07)/g,                  // Application Program Command
    ANSI_PM: /\x1B\^.*?(?:\x1B\\|\x07)/g,                  // Privacy Message
    ANSI_SOS: /\x1BX.*?(?:\x1B\\|\x07)/g,                  // Start of String
    
    // Terminal manipulation sequences
    TERMINAL_TITLE: /\x1B]0;.*?(?:\x07|\x1B\\)/g,          // Set window title
    TERMINAL_RESET: /\x1B\x63/g,                           // Full terminal reset
    SCREEN_CLEAR: /\x1B\[2J/g,                             // Clear entire screen
    CURSOR_HOME: /\x1B\[[HfF]/g,                           // Move cursor home
    CURSOR_SAVE: /\x1B[\[\s]s/g,                           // Save cursor position
    CURSOR_RESTORE: /\x1B[\[\s]u/g,                        // Restore cursor position
    
    // Dangerous control characters
    BELL: /\x07/g,                                         // Terminal bell
    BACKSPACE: /\x08+/g,                                   // Multiple backspaces
    VERTICAL_TAB: /\x0B/g,                                 // Vertical tab
    FORM_FEED: /\x0C/g,                                    // Form feed
    DELETE: /\x7F/g,                                       // Delete character
    
    // Unicode bidirectional and homograph attacks
    BIDI_OVERRIDE: /[\u202A-\u202E\u2066-\u2069]/g,       // Bidirectional text overrides
    ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,                 // Zero-width characters
    CONFUSABLES: /[\u0430-\u044F\u0410-\u042F]/g,         // Cyrillic confusables
    
    // Format string and command execution attempts
    FORMAT_STRINGS: /%[diouxXeEfFgGaAcspn%]/g,            // C-style format strings
    SHELL_COMMANDS: /\$\([^)]+\)|\`[^`]+\`/g,             // Command substitution
    EVAL_ATTEMPTS: /eval\s*\(|exec\s*\(|system\s*\(/gi,   // Code execution attempts
    
    // Hyperlink injection patterns
    HYPERLINKS: /\x1B]8;[^;]*;[^\x07\x1B]*(?:\x07|\x1B\\)/g, // Terminal hyperlinks
    URL_PATTERNS: /https?:\/\/[^\s<>"'`\x00-\x1F]+/gi,    // HTTP URLs
    FILE_URLS: /file:\/\/[^\s<>"'`\x00-\x1F]+/gi,         // File URLs
    
    // Log injection patterns
    LOG_INJECTION: /\r\n|\r|\n/g,                         // Line ending injection
    NULL_BYTES: /\x00/g,                                  // Null byte injection
    EXCESSIVE_WHITESPACE: /\s{20,}/g                       // Excessive whitespace
};

/**
 * Enhanced sanitize log output to prevent comprehensive terminal manipulation attacks
 * 
 * Task 1.4.1 Enhancement: Comprehensive protection against 15+ categories of attacks:
 * - Advanced ANSI escape sequences (CSI, OSC, DCS, APC, PM, SOS)
 * - Terminal manipulation (title setting, screen clearing, cursor control)
 * - Control characters and dangerous sequences
 * - Unicode bidirectional and homograph attacks  
 * - Format string and command execution attempts
 * - Hyperlink injection and clickjacking
 * - Log injection and null byte attacks
 * 
 * @security Provides enterprise-grade protection with comprehensive attack coverage
 * @performance Optimized with pre-compiled regex patterns and bounded execution
 */
export function sanitizeLogOutput(message: string): string {
    if (!message || typeof message !== 'string') {
        return '';
    }
    
    // Use enhanced sanitization with strict defaults
    return sanitizeLogOutputAdvanced(message, {
        protectionLevel: 'strict',
        detectTerminalManipulation: true,
        detectUnicodeAttacks: true,
        detectHyperlinkInjection: true,
        detectCommandExecution: true
    });
}

/**
 * Enhanced log sanitization with comprehensive terminal manipulation prevention
 * 
 * Task 1.4.1: Provides enterprise-grade protection with configurable security levels.
 * Detects and neutralizes 15+ categories of terminal manipulation attacks while
 * maintaining legitimate logging functionality.
 * 
 * @security Comprehensive protection against advanced terminal attacks
 * @performance Optimized for high-throughput logging with bounded execution time
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
    const violations: LogSecurityViolation[] = [];
    const originalLength = sanitized.length;
    
    // Protection level-based sanitization
    const isStrict = finalConfig.protectionLevel === 'strict';
    const isPermissive = finalConfig.protectionLevel === 'permissive';
    
    // 1. ANSI Escape Sequence Protection
    if (finalConfig.detectTerminalManipulation && !isPermissive) {
        if (TERMINAL_ATTACK_PATTERNS.ANSI_CSI.test(sanitized)) {
            violations.push(createViolation('ansi-escape', 'medium', 'ANSI CSI sequences detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.ANSI_CSI, '[ANSI-CSI]');
        }
        
        if (TERMINAL_ATTACK_PATTERNS.ANSI_OSC.test(sanitized)) {
            violations.push(createViolation('terminal-manipulation', 'high', 'OSC terminal control sequences detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.ANSI_OSC, '[OSC-CMD]');
        }
        
        if (TERMINAL_ATTACK_PATTERNS.ANSI_DCS.test(sanitized)) {
            violations.push(createViolation('terminal-manipulation', 'high', 'Device Control String detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.ANSI_DCS, '[DCS-CMD]');
        }
        
        // Additional ANSI sequences
        sanitized = sanitized
            .replace(TERMINAL_ATTACK_PATTERNS.ANSI_APC, '[APC-CMD]')
            .replace(TERMINAL_ATTACK_PATTERNS.ANSI_PM, '[PM-CMD]')
            .replace(TERMINAL_ATTACK_PATTERNS.ANSI_SOS, '[SOS-CMD]');
    }
    
    // 2. Terminal Manipulation Protection
    if (finalConfig.detectTerminalManipulation) {
        if (TERMINAL_ATTACK_PATTERNS.TERMINAL_TITLE.test(sanitized)) {
            violations.push(createViolation('terminal-manipulation', 'medium', 'Terminal title manipulation detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.TERMINAL_TITLE, '[TITLE-SET]');
        }
        
        if (TERMINAL_ATTACK_PATTERNS.TERMINAL_RESET.test(sanitized)) {
            violations.push(createViolation('terminal-manipulation', 'critical', 'Terminal reset command detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.TERMINAL_RESET, '[TERM-RESET]');
        }
        
        sanitized = sanitized
            .replace(TERMINAL_ATTACK_PATTERNS.SCREEN_CLEAR, '[SCREEN-CLEAR]')
            .replace(TERMINAL_ATTACK_PATTERNS.CURSOR_HOME, '[CURSOR-HOME]')
            .replace(TERMINAL_ATTACK_PATTERNS.CURSOR_SAVE, '[CURSOR-SAVE]')
            .replace(TERMINAL_ATTACK_PATTERNS.CURSOR_RESTORE, '[CURSOR-RESTORE]');
    }
    
    // 3. Control Character Protection
    if (!finalConfig.allowControlChars) {
        // Preserve legitimate formatting if requested
        let preserveChars = '';
        if (finalConfig.preserveFormatting) {
            preserveChars = '\t\n\r'; // Tab, newline, carriage return
        }
        
        // Remove dangerous control characters
        const controlCharPattern = new RegExp(`[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F${preserveChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g');
        
        if (controlCharPattern.test(sanitized)) {
            violations.push(createViolation('control-chars', 'medium', 'Dangerous control characters detected', sanitized));
            sanitized = sanitized.replace(controlCharPattern, '');
        }
        
        // Handle specific dangerous sequences
        sanitized = sanitized
            .replace(TERMINAL_ATTACK_PATTERNS.BELL, isStrict ? '' : '[BELL]')
            .replace(TERMINAL_ATTACK_PATTERNS.BACKSPACE, '[BACKSPACE]')
            .replace(TERMINAL_ATTACK_PATTERNS.VERTICAL_TAB, '[VTAB]')
            .replace(TERMINAL_ATTACK_PATTERNS.FORM_FEED, '[FF]')
            .replace(TERMINAL_ATTACK_PATTERNS.DELETE, '[DEL]');
    }
    
    // 4. Unicode Attack Protection
    if (finalConfig.detectUnicodeAttacks) {
        if (TERMINAL_ATTACK_PATTERNS.BIDI_OVERRIDE.test(sanitized)) {
            violations.push(createViolation('unicode-attack', 'high', 'Bidirectional text override detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.BIDI_OVERRIDE, '[BIDI]');
        }
        
        if (TERMINAL_ATTACK_PATTERNS.ZERO_WIDTH.test(sanitized)) {
            violations.push(createViolation('unicode-attack', 'medium', 'Zero-width characters detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.ZERO_WIDTH, '');
        }
        
        if (isStrict && TERMINAL_ATTACK_PATTERNS.CONFUSABLES.test(sanitized)) {
            violations.push(createViolation('unicode-attack', 'low', 'Potential homograph characters detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.CONFUSABLES, '[CONFUSABLE]');
        }
    }
    
    // 5. Command Execution Protection
    if (finalConfig.detectCommandExecution) {
        if (TERMINAL_ATTACK_PATTERNS.SHELL_COMMANDS.test(sanitized)) {
            violations.push(createViolation('command-execution', 'critical', 'Shell command substitution detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.SHELL_COMMANDS, '[SHELL-CMD]');
        }
        
        if (TERMINAL_ATTACK_PATTERNS.EVAL_ATTEMPTS.test(sanitized)) {
            violations.push(createViolation('command-execution', 'critical', 'Code execution attempts detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.EVAL_ATTEMPTS, '[EVAL-ATTEMPT]');
        }
        
        if (TERMINAL_ATTACK_PATTERNS.FORMAT_STRINGS.test(sanitized)) {
            violations.push(createViolation('format-string', 'medium', 'Format string specifiers detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.FORMAT_STRINGS, '[FORMAT]');
        }
    }
    
    // 6. Hyperlink Injection Protection
    if (finalConfig.detectHyperlinkInjection) {
        if (TERMINAL_ATTACK_PATTERNS.HYPERLINKS.test(sanitized)) {
            violations.push(createViolation('hyperlink-injection', 'medium', 'Terminal hyperlinks detected', sanitized));
            sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.HYPERLINKS, '[HYPERLINK]');
        }
        
        if (isStrict) {
            if (TERMINAL_ATTACK_PATTERNS.URL_PATTERNS.test(sanitized)) {
                violations.push(createViolation('hyperlink-injection', 'low', 'HTTP URLs detected in strict mode', sanitized));
                sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.URL_PATTERNS, '[URL]');
            }
            
            if (TERMINAL_ATTACK_PATTERNS.FILE_URLS.test(sanitized)) {
                violations.push(createViolation('hyperlink-injection', 'medium', 'File URLs detected', sanitized));
                sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.FILE_URLS, '[FILE-URL]');
            }
        }
    }
    
    // 7. Log Injection Protection  
    if (!finalConfig.preserveFormatting) {
        if (TERMINAL_ATTACK_PATTERNS.LOG_INJECTION.test(sanitized)) {
            violations.push(createViolation('line-injection', 'high', 'Line ending injection detected', sanitized));
            sanitized = sanitized
                .replace(/\r\n/g, ' [CRLF] ')
                .replace(/\r/g, ' [CR] ')
                .replace(/\n/g, ' [LF] ');
        }
    }
    
    // 8. Null Byte and Whitespace Protection
    if (TERMINAL_ATTACK_PATTERNS.NULL_BYTES.test(sanitized)) {
        violations.push(createViolation('line-injection', 'high', 'Null byte injection detected', sanitized));
        sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.NULL_BYTES, '[NULL]');
    }
    
    sanitized = sanitized.replace(TERMINAL_ATTACK_PATTERNS.EXCESSIVE_WHITESPACE, ' [WHITESPACE] ');
    
    // 9. Custom Pattern Protection
    for (const pattern of finalConfig.customDangerousPatterns || []) {
        if (pattern.test(sanitized)) {
            violations.push(createViolation('custom-pattern', 'medium', 'Custom dangerous pattern detected', sanitized));
            sanitized = sanitized.replace(pattern, '[CUSTOM-PATTERN]');
        }
    }
    
    // 10. Length Protection (DoS prevention)
    if (sanitized.length > finalConfig.maxLineLength) {
        violations.push(createViolation('length-overflow', 'medium', 'Message length exceeds maximum', sanitized));
        sanitized = sanitized.slice(0, finalConfig.maxLineLength) + '[TRUNCATED]';
    }
    
    // 11. Security Violation Handling
    if (violations.length > 0) {
        // Generate security warnings
        if (originalLength > finalConfig.warningThreshold) {
            console.warn(`[Log Security] Large message detected: ${originalLength} chars, potential DoS attempt`);
        }
        
        if (violations.some(v => v.severity === 'critical')) {
            console.warn(`[Log Security] CRITICAL: ${violations.filter(v => v.severity === 'critical').length} critical violations detected`);
        }
        
        // Invoke custom violation handler if provided
        if (finalConfig.onSecurityViolation) {
            violations.forEach(violation => {
                violation.sanitizedOutput = sanitized;
                finalConfig.onSecurityViolation!(violation);
            });
        }
    }
    
    return sanitized;
}

/**
 * Helper function to create security violation objects
 */
function createViolation(
    type: LogSecurityViolation['type'],
    severity: LogSecurityViolation['severity'],
    description: string,
    originalInput: string
): LogSecurityViolation {
    return {
        type,
        severity,
        description,
        originalInput: originalInput.slice(0, 100), // Limit for security
        sanitizedOutput: '', // Will be set later
        timestamp: new Date(),
        recommendedAction: severity === 'critical' ? 'block' : severity === 'high' ? 'warn' : 'monitor'
    };
}

/**
 * Comprehensive log security analysis with advanced threat detection
 * 
 * Task 1.4.1: Enhanced security analysis covering 15+ attack categories with
 * detailed threat assessment, risk scoring, and actionable security intelligence.
 * 
 * @security Provides comprehensive threat analysis for security monitoring
 * @compliance OWASP logging guidelines, enterprise security requirements
 */
export interface LogSecurityAnalysis {
    // Basic attack detection
    hasAnsiEscapes: boolean;
    hasControlChars: boolean;
    hasLineInjection: boolean;
    hasFormatStrings: boolean;
    
    // Advanced attack detection
    hasTerminalManipulation: boolean;
    hasUnicodeAttacks: boolean;
    hasHyperlinkInjection: boolean;
    hasCommandExecution: boolean;
    hasNullByteInjection: boolean;
    hasExcessiveLength: boolean;
    
    // Risk assessment
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number; // 0-100
    threatCategories: string[];
    
    // Detection details
    warnings: string[];
    violations: LogSecurityViolation[];
    attackVectors: string[];
    
    // Recommendations
    recommendedAction: 'allow' | 'sanitize' | 'warn' | 'block';
    securityRecommendations: string[];
    
    // Metrics
    messageLength: number;
    dangerousSequenceCount: number;
    sanitizationRequired: boolean;
}

/**
 * Analyze log content for comprehensive security risks and threats
 * 
 * Performs deep security analysis covering all known attack vectors
 * with detailed threat intelligence and actionable recommendations.
 */
export function analyzeLogSecurity(message: string): LogSecurityAnalysis {
    const warnings: string[] = [];
    const violations: LogSecurityViolation[] = [];
    const attackVectors: string[] = [];
    const threatCategories: string[] = [];
    const securityRecommendations: string[] = [];
    
    let riskScore = 0;
    let dangerousSequenceCount = 0;
    
    if (!message || typeof message !== 'string') {
        return createEmptyAnalysis();
    }
    
    // 1. ANSI Escape Sequence Detection
    const hasAnsiEscapes = TERMINAL_ATTACK_PATTERNS.ANSI_CSI.test(message) ||
                           TERMINAL_ATTACK_PATTERNS.ANSI_OSC.test(message) ||
                           TERMINAL_ATTACK_PATTERNS.ANSI_DCS.test(message);
    
    if (hasAnsiEscapes) {
        threatCategories.push('ANSI Manipulation');
        attackVectors.push('Terminal color/cursor control');
        warnings.push('ANSI escape sequences detected - potential terminal manipulation');
        riskScore += 25;
        dangerousSequenceCount++;
        securityRecommendations.push('Strip ANSI sequences before logging');
    }
    
    // 2. Advanced Terminal Manipulation Detection
    const hasTerminalManipulation = TERMINAL_ATTACK_PATTERNS.TERMINAL_TITLE.test(message) ||
                                   TERMINAL_ATTACK_PATTERNS.TERMINAL_RESET.test(message) ||
                                   TERMINAL_ATTACK_PATTERNS.SCREEN_CLEAR.test(message);
    
    if (hasTerminalManipulation) {
        threatCategories.push('Terminal Control');
        attackVectors.push('Screen manipulation', 'Title hijacking');
        warnings.push('Terminal manipulation sequences detected - potential session hijacking');
        riskScore += 40;
        dangerousSequenceCount += 2;
        securityRecommendations.push('Block terminal control sequences');
        
        if (TERMINAL_ATTACK_PATTERNS.TERMINAL_RESET.test(message)) {
            violations.push(createViolation('terminal-manipulation', 'critical', 'Terminal reset detected', message));
            riskScore += 20;
        }
    }
    
    // 3. Control Character Detection
    const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(message);
    
    if (hasControlChars) {
        threatCategories.push('Control Characters');
        attackVectors.push('Log corruption', 'Terminal bells');
        warnings.push('Dangerous control characters detected - potential log corruption');
        riskScore += 15;
        dangerousSequenceCount++;
        securityRecommendations.push('Filter control characters except tab/newline');
    }
    
    // 4. Line Injection Detection
    const hasLineInjection = TERMINAL_ATTACK_PATTERNS.LOG_INJECTION.test(message);
    
    if (hasLineInjection) {
        threatCategories.push('Log Injection');
        attackVectors.push('Fake log entries', 'Log spoofing');
        warnings.push('Line injection patterns detected - potential log spoofing attack');
        riskScore += 35;
        dangerousSequenceCount += 2;
        securityRecommendations.push('Neutralize line endings in user input');
        violations.push(createViolation('line-injection', 'high', 'Line ending injection detected', message));
    }
    
    // 5. Format String Detection
    const hasFormatStrings = TERMINAL_ATTACK_PATTERNS.FORMAT_STRINGS.test(message);
    
    if (hasFormatStrings) {
        threatCategories.push('Format String Attack');
        attackVectors.push('Memory disclosure', 'Code execution');
        warnings.push('Format string specifiers detected - potential memory disclosure');
        riskScore += 20;
        dangerousSequenceCount++;
        securityRecommendations.push('Escape format string specifiers');
    }
    
    // 6. Unicode Attack Detection
    const hasUnicodeAttacks = TERMINAL_ATTACK_PATTERNS.BIDI_OVERRIDE.test(message) ||
                             TERMINAL_ATTACK_PATTERNS.ZERO_WIDTH.test(message) ||
                             TERMINAL_ATTACK_PATTERNS.CONFUSABLES.test(message);
    
    if (hasUnicodeAttacks) {
        threatCategories.push('Unicode Manipulation');
        attackVectors.push('Text spoofing', 'Visual deception');
        warnings.push('Unicode manipulation detected - potential text spoofing attack');
        riskScore += 15;
        dangerousSequenceCount++;
        securityRecommendations.push('Normalize Unicode and remove bidirectional overrides');
    }
    
    // 7. Command Execution Detection
    const hasCommandExecution = TERMINAL_ATTACK_PATTERNS.SHELL_COMMANDS.test(message) ||
                               TERMINAL_ATTACK_PATTERNS.EVAL_ATTEMPTS.test(message);
    
    if (hasCommandExecution) {
        threatCategories.push('Command Injection');
        attackVectors.push('Shell command execution', 'Code evaluation');
        warnings.push('Command execution patterns detected - CRITICAL security risk');
        riskScore += 50;
        dangerousSequenceCount += 3;
        securityRecommendations.push('Block all command execution patterns immediately');
        violations.push(createViolation('command-execution', 'critical', 'Command execution attempt detected', message));
    }
    
    // 8. Hyperlink Injection Detection
    const hasHyperlinkInjection = TERMINAL_ATTACK_PATTERNS.HYPERLINKS.test(message) ||
                                 TERMINAL_ATTACK_PATTERNS.URL_PATTERNS.test(message) ||
                                 TERMINAL_ATTACK_PATTERNS.FILE_URLS.test(message);
    
    if (hasHyperlinkInjection) {
        threatCategories.push('Hyperlink Injection');
        attackVectors.push('Clickjacking', 'Phishing links');
        warnings.push('Hyperlink injection detected - potential clickjacking attack');
        riskScore += 10;
        dangerousSequenceCount++;
        securityRecommendations.push('Sanitize URLs and disable terminal hyperlinks');
    }
    
    // 9. Null Byte Injection Detection
    const hasNullByteInjection = TERMINAL_ATTACK_PATTERNS.NULL_BYTES.test(message);
    
    if (hasNullByteInjection) {
        threatCategories.push('Null Byte Injection');
        attackVectors.push('String truncation', 'Filter bypass');
        warnings.push('Null byte injection detected - potential filter bypass');
        riskScore += 25;
        dangerousSequenceCount++;
        securityRecommendations.push('Remove null bytes from all user input');
        violations.push(createViolation('line-injection', 'high', 'Null byte injection detected', message));
    }
    
    // 10. Length-based DoS Detection
    const hasExcessiveLength = message.length > 5000;
    
    if (hasExcessiveLength) {
        threatCategories.push('DoS Attack');
        attackVectors.push('Log flooding', 'Resource exhaustion');
        warnings.push(`Extremely long message detected (${message.length} chars) - potential DoS attack`);
        riskScore += Math.min(30, Math.floor(message.length / 1000));
        securityRecommendations.push('Implement message length limits');
        
        if (message.length > 50000) {
            violations.push(createViolation('length-overflow', 'critical', 'Massive message length detected', message));
        }
    }
    
    // Risk Level Calculation
    let riskLevel: LogSecurityAnalysis['riskLevel'] = 'low';
    if (riskScore >= 80 || violations.some(v => v.severity === 'critical')) {
        riskLevel = 'critical';
    } else if (riskScore >= 50) {
        riskLevel = 'high';
    } else if (riskScore >= 20) {
        riskLevel = 'medium';
    }
    
    // Recommended Action
    let recommendedAction: LogSecurityAnalysis['recommendedAction'] = 'allow';
    if (riskLevel === 'critical') {
        recommendedAction = 'block';
    } else if (riskLevel === 'high') {
        recommendedAction = 'warn';
    } else if (riskLevel === 'medium') {
        recommendedAction = 'sanitize';
    }
    
    // Add general security recommendations
    if (dangerousSequenceCount > 0) {
        securityRecommendations.push('Implement comprehensive log sanitization');
        securityRecommendations.push('Monitor for repeated attack patterns from same source');
    }
    
    if (threatCategories.length > 3) {
        securityRecommendations.push('Multiple attack vectors detected - consider blocking source');
        riskScore += 10; // Bonus for multi-vector attacks
    }
    
    return {
        // Basic detection
        hasAnsiEscapes,
        hasControlChars,
        hasLineInjection,
        hasFormatStrings,
        
        // Advanced detection
        hasTerminalManipulation,
        hasUnicodeAttacks,
        hasHyperlinkInjection,
        hasCommandExecution,
        hasNullByteInjection,
        hasExcessiveLength,
        
        // Risk assessment
        riskLevel,
        riskScore: Math.min(100, riskScore),
        threatCategories: [...new Set(threatCategories)],
        
        // Detection details
        warnings,
        violations,
        attackVectors: [...new Set(attackVectors)],
        
        // Recommendations
        recommendedAction,
        securityRecommendations: [...new Set(securityRecommendations)],
        
        // Metrics
        messageLength: message.length,
        dangerousSequenceCount,
        sanitizationRequired: dangerousSequenceCount > 0
    };
}

/**
 * Helper function to create empty analysis for invalid inputs
 */
function createEmptyAnalysis(): LogSecurityAnalysis {
    return {
        hasAnsiEscapes: false,
        hasControlChars: false,
        hasLineInjection: false,
        hasFormatStrings: false,
        hasTerminalManipulation: false,
        hasUnicodeAttacks: false,
        hasHyperlinkInjection: false,
        hasCommandExecution: false,
        hasNullByteInjection: false,
        hasExcessiveLength: false,
        riskLevel: 'low',
        riskScore: 0,
        threatCategories: [],
        warnings: [],
        violations: [],
        attackVectors: [],
        recommendedAction: 'allow',
        securityRecommendations: [],
        messageLength: 0,
        dangerousSequenceCount: 0,
        sanitizationRequired: false
    };
}

/**
 * Real-time security monitoring for log streams
 * 
 * Task 1.4.1: Provides continuous monitoring of log security with alerting
 * and automatic threat response capabilities.
 * 
 * @security Enterprise-grade security monitoring with threat intelligence
 */
export class LogSecurityMonitor {
    private violationCounts = new Map<string, number>();
    private lastViolationTime = new Map<string, number>();
    private readonly alertThreshold: number;
    private readonly timeWindow: number; // milliseconds
    private readonly onAlert?: (alert: SecurityAlert) => void;
    
    constructor(config: {
        alertThreshold?: number;
        timeWindow?: number;
        onAlert?: (alert: SecurityAlert) => void;
    } = {}) {
        this.alertThreshold = config.alertThreshold ?? 5;
        this.timeWindow = config.timeWindow ?? 60000; // 1 minute
        this.onAlert = config.onAlert;
    }
    
    /**
     * Monitor a log message for security violations
     */
    monitorMessage(message: string, source?: string): LogSecurityAnalysis {
        const analysis = analyzeLogSecurity(message);
        
        if (analysis.violations.length > 0) {
            this.handleViolations(analysis.violations, source);
        }
        
        return analysis;
    }
    
    /**
     * Handle security violations with rate limiting and alerting
     */
    private handleViolations(violations: LogSecurityViolation[], source?: string) {
        const now = Date.now();
        const sourceKey = source ?? 'unknown';
        
        // Update violation counts
        const currentCount = this.violationCounts.get(sourceKey) ?? 0;
        this.violationCounts.set(sourceKey, currentCount + violations.length);
        
        // Check time window
        const lastViolation = this.lastViolationTime.get(sourceKey) ?? 0;
        if (now - lastViolation > this.timeWindow) {
            // Reset counter for new time window
            this.violationCounts.set(sourceKey, violations.length);
        }
        
        this.lastViolationTime.set(sourceKey, now);
        
        // Check if alert threshold exceeded
        if (this.violationCounts.get(sourceKey)! >= this.alertThreshold) {
            const alert: SecurityAlert = {
                severity: this.calculateAlertSeverity(violations),
                source: sourceKey,
                violationCount: this.violationCounts.get(sourceKey)!,
                timeWindow: this.timeWindow,
                violations: violations.slice(-5), // Last 5 violations
                timestamp: new Date(),
                recommendedAction: 'investigate'
            };
            
            // Trigger alert
            if (this.onAlert) {
                this.onAlert(alert);
            } else {
                console.error(`[SECURITY ALERT] ${alert.severity.toUpperCase()}: ${alert.violationCount} violations from ${sourceKey}`);
            }
            
            // Reset counter after alert
            this.violationCounts.set(sourceKey, 0);
        }
    }
    
    /**
     * Calculate alert severity based on violation types
     */
    private calculateAlertSeverity(violations: LogSecurityViolation[]): 'low' | 'medium' | 'high' | 'critical' {
        const hasCritical = violations.some(v => v.severity === 'critical');
        const hasHigh = violations.some(v => v.severity === 'high');
        const hasMedium = violations.some(v => v.severity === 'medium');
        
        if (hasCritical) return 'critical';
        if (hasHigh) return 'high';
        if (hasMedium) return 'medium';
        return 'low';
    }
    
    /**
     * Get current violation statistics
     */
    getStats(): { source: string; violationCount: number; lastViolation: Date }[] {
        const stats: { source: string; violationCount: number; lastViolation: Date }[] = [];
        
        for (const [source, count] of this.violationCounts) {
            const lastTime = this.lastViolationTime.get(source);
            if (lastTime) {
                stats.push({
                    source,
                    violationCount: count,
                    lastViolation: new Date(lastTime)
                });
            }
        }
        
        return stats.sort((a, b) => b.violationCount - a.violationCount);
    }
    
    /**
     * Clear all monitoring data
     */
    clearStats(): void {
        this.violationCounts.clear();
        this.lastViolationTime.clear();
    }
}

/**
 * Security alert interface for monitoring systems
 */
export interface SecurityAlert {
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    violationCount: number;
    timeWindow: number;
    violations: LogSecurityViolation[];
    timestamp: Date;
    recommendedAction: 'monitor' | 'investigate' | 'block';
}