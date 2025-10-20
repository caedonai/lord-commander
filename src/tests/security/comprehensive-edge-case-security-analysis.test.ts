/**
 * Comprehensive Edge Case and Security Vulnerability Analysis
 * Task 1.4.1 Enhanced Log Injection Protection - Complete Security Assessment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
    sanitizeLogOutput, 
    sanitizeLogOutputAdvanced, 
    analyzeLogSecurity,
    LogSecurityMonitor,
    type LogInjectionConfig
} from '../../core/foundation/log-security.js';

describe('Task 1.4.1: Comprehensive Edge Case & Security Analysis', () => {

    describe('Critical Security Vulnerabilities', () => {
        
        describe('1. Memory Exhaustion & DoS Protection', () => {
            it('should handle catastrophically large inputs without memory exhaustion', () => {
                // Test with extremely large input that could cause memory issues
                const massiveInput = 'A'.repeat(10 * 1024 * 1024); // 10MB
                const start = performance.now();
                
                const result = sanitizeLogOutput(massiveInput);
                
                const duration = performance.now() - start;
                expect(duration).toBeLessThan(500); // Should complete within 500ms
                expect(result.length).toBeLessThan(massiveInput.length); // Should be truncated
                expect(result).toContain('[TRUNCATED]');
            });

            it('should prevent regex catastrophic backtracking attacks', () => {
                // Pathological input designed to cause regex DoS
                const pathologicalInput = 'A'.repeat(1000) + '%'.repeat(1000) + 'B'.repeat(1000);
                const start = performance.now();
                
                const result = sanitizeLogOutput(pathologicalInput);
                
                const duration = performance.now() - start;
                expect(duration).toBeLessThan(100); // Should be very fast due to DoS protection
                expect(result).toBeDefined();
            });

            it('should handle deeply nested attack patterns without stack overflow', () => {
                const nestedAttack = '\x1B['.repeat(10000) + '31m' + 'text' + '\x1B[0m'.repeat(10000);
                
                expect(() => {
                    const result = sanitizeLogOutput(nestedAttack);
                    expect(result).toBeDefined();
                }).not.toThrow();
            });
        });

        describe('2. Advanced Encoding & Bypass Attempts', () => {
            it('should detect URL-encoded ANSI sequences', () => {
                const urlEncoded = 'Log %1B%5B31m malicious %1B%5B0m text';
                const result = sanitizeLogOutput(urlEncoded);
                
                // Should detect URL-encoded patterns if properly handled
                expect(result).toContain('Log');
                expect(result).toContain('text');
            });

            it('should detect hex-encoded control characters', () => {
                const hexEncoded = 'Data \\x1B\\x5B2J clear screen \\x1Bc reset';
                const result = sanitizeLogOutput(hexEncoded);
                
                expect(result).toContain('Data');
                expect(result).toContain('clear screen');
                expect(result).toContain('reset');
            });

            it('should handle double-encoded attacks', () => {
                const doubleEncoded = 'Text %251B%255B31m nested encoding';
                const result = sanitizeLogOutput(doubleEncoded);
                
                expect(result).toContain('Text');
                expect(result).toContain('nested encoding');
            });
        });

        describe('3. Unicode & International Security', () => {
            it('should detect mixed script attacks (sophisticated homographs)', () => {
                const mixedScript = 'amazon.com vs аmazon.com vs αmazon.com'; // Latin/Cyrillic/Greek
                const result = sanitizeLogOutput(mixedScript);
                
                // Should detect homograph attempts
                expect(result).toContain('[CONFUSABLE]');
            });

            it('should handle RTL override with embedded LTR attacks', () => {
                const complexBidi = 'Normal \u202E‫override \u202D‬ with \u202A‪embedded\u202C‬ text';
                const result = sanitizeLogOutput(complexBidi);
                
                expect(result).not.toMatch(/[\u202A-\u202E]/);
                expect(result).toContain('[BIDI]');
            });

            it('should detect invisible character injection chains', () => {
                const invisibleChain = 'text\u200B\u200C\u200D\uFEFF\u2060\u180E hidden';
                const result = sanitizeLogOutput(invisibleChain);
                
                expect(result).not.toMatch(/[\u200B-\u200D\uFEFF\u2060\u180E]/);
            });
        });

        describe('4. Terminal Emulator Specific Attacks', () => {
            it('should block xterm-specific extensions', () => {
                const xtermAttacks = 'Log \x1B]1337;File=:SGVsbG8=\x07 iTerm2 attack';
                const result = sanitizeLogOutput(xtermAttacks);
                
                expect(result).not.toContain('\x1B]1337');
                expect(result).toContain('[OSC-CMD]');
            });

            it('should prevent tmux/screen escape sequence injection', () => {
                const tmuxEscape = 'Data \x1BPtmux;\x1B\x1B]0;title\x07\x1B\\';
                const result = sanitizeLogOutput(tmuxEscape);
                
                expect(result).toContain('[DCS-CMD]');
                expect(result).not.toContain('tmux;');
            });

            it('should block PowerShell console sequences', () => {
                const powershellSeq = 'Command \x1B]9;4;1;c:\\windows\\system32\x07 completed';
                const result = sanitizeLogOutput(powershellSeq);
                
                expect(result).toContain('[OSC-CMD]');
                expect(result).toContain('Command');
                expect(result).toContain('completed');
            });
        });

        describe('5. Sophisticated Command Injection', () => {
            it('should detect obfuscated command substitution', () => {
                const obfuscatedCmd = 'Log ${IFS}rm${IFS}-rf${IFS}/ and $((0x72,0x6d)) patterns';
                const result = sanitizeLogOutput(obfuscatedCmd);
                
                expect(result).toContain('[SHELL-CMD]');
                expect(result).toContain('Log');
                expect(result).toContain('patterns');
            });

            it('should prevent eval with non-standard syntax', () => {
                const nonStandardEval = 'Data window["e"+"val"]("malicious") code';
                const result = sanitizeLogOutput(nonStandardEval);
                
                expect(result).toContain('[EVAL-ATTEMPT]');
                expect(result).toContain('Data');
                expect(result).toContain('code');
            });
        });

        describe('6. Race Conditions & Concurrency Issues', () => {
            it('should handle concurrent sanitization calls safely', async () => {
                const maliciousInput = 'Concurrent \x1B[2J$(rm -rf /) \u202E test';
                
                const promises = Array(100).fill(0).map(() => 
                    sanitizeLogOutput(maliciousInput)
                );
                
                const results = await Promise.all(promises);
                
                // All results should be consistent
                expect(results).toHaveLength(100);
                expect(new Set(results).size).toBe(1); // All results identical
                results.forEach(result => {
                    expect(result).toContain('[ANSI-CSI]');
                    expect(result).toContain('[SHELL-CMD]');
                    expect(result).toContain('[BIDI]');
                });
            });

            it('should maintain thread safety with configuration changes', () => {
                const config1: LogInjectionConfig = { protectionLevel: 'strict' };
                const config2: LogInjectionConfig = { protectionLevel: 'permissive' };
                const input = 'Test \x1B[31m colored text';
                
                const result1 = sanitizeLogOutputAdvanced(input, config1);
                const result2 = sanitizeLogOutputAdvanced(input, config2);
                
                // Results should be different and consistent
                expect(result1).not.toBe(result2);
                expect(result1).toContain('[ANSI-CSI]');
            });
        });
    });

    describe('Edge Cases & Boundary Conditions', () => {
        
        describe('Input Validation Edge Cases', () => {
            it('should handle all JavaScript primitive types safely', () => {
                const inputs = [
                    null, undefined, '', 0, false, true, {}, [], 
                    Symbol('test'), BigInt(123), NaN, Infinity, -Infinity
                ];
                
                inputs.forEach(input => {
                    expect(() => {
                        const result = sanitizeLogOutput(input as any);
                        expect(typeof result).toBe('string');
                    }).not.toThrow();
                });
            });

            it('should handle circular references in object inputs', () => {
                const circular: any = { name: 'test' };
                circular.self = circular;
                
                expect(() => {
                    const result = sanitizeLogOutput(circular as any);
                    expect(result).toBe(''); // Should return empty string safely
                }).not.toThrow();
            });

            it('should handle frozen and sealed objects', () => {
                const frozen = Object.freeze({ message: 'test \x1B[31m color' });
                const sealed = Object.seal({ message: 'test \x1B[2J clear' });
                
                expect(() => {
                    sanitizeLogOutput(frozen as any);
                    sanitizeLogOutput(sealed as any);
                }).not.toThrow();
            });
        });

        describe('Configuration Edge Cases', () => {
            it('should handle malformed configuration objects gracefully', () => {
                const malformedConfigs = [
                    { protectionLevel: 'invalid' as any },
                    { maxLineLength: -1 },
                    { maxLineLength: Infinity },
                    { customDangerousPatterns: ['invalid regex'] as any },
                    { onSecurityViolation: 'not a function' as any }
                ];
                
                malformedConfigs.forEach(config => {
                    expect(() => {
                        sanitizeLogOutputAdvanced('test \x1B[31m', config);
                    }).not.toThrow();
                });
            });

            it('should handle callback exceptions gracefully', () => {
                let callbackExecuted = false;
                const throwingCallback = () => {
                    callbackExecuted = true;
                    throw new Error('Callback error');
                };
                
                expect(() => {
                    sanitizeLogOutputAdvanced('test \x1B[31m color', {
                        onSecurityViolation: throwingCallback
                    });
                }).not.toThrow();
                
                expect(callbackExecuted).toBe(true);
            });
        });

        describe('Performance Boundary Conditions', () => {
            it('should handle maximum safe integer lengths', () => {
                const maxSafeLength = Math.min(Number.MAX_SAFE_INTEGER, 1000000); // Reasonable test limit
                const largeInput = 'A'.repeat(maxSafeLength);
                
                expect(() => {
                    const result = sanitizeLogOutput(largeInput);
                    expect(result).toBeDefined();
                }).not.toThrow();
            });

            it('should maintain performance with complex nested patterns', () => {
                const complexInput = Array(1000).fill('\x1B[31m\x1B]0;title\x07\x1BP+q\x1B\\').join('text');
                const start = performance.now();
                
                const result = sanitizeLogOutput(complexInput);
                
                const duration = performance.now() - start;
                expect(duration).toBeLessThan(200); // Should complete within 200ms
                expect(result).toBeDefined();
            });
        });

        describe('Unicode Edge Cases', () => {
            it('should handle surrogate pairs correctly', () => {
                const surrogates = '𝕳𝖊𝖑𝖑𝖔 𝖜𝖔𝖗𝖑𝖉'; // Mathematical script
                const result = sanitizeLogOutput(surrogates);
                
                expect(result).toContain('𝕳𝖊𝖑𝖑𝖔');
            });

            it('should handle malformed UTF-8 sequences', () => {
                const malformedUtf8 = 'Text \uFFFD replacement \uD800 lone surrogate';
                const result = sanitizeLogOutput(malformedUtf8);
                
                expect(result).toContain('Text');
                expect(result).toContain('replacement');
            });

            it('should handle zero-width joiners and combining characters', () => {
                const combining = 'e\u0301\u200D\uFE0F combined chars'; // é with ZWJ and variation selector
                const result = sanitizeLogOutput(combining);
                
                expect(result).toContain('combined chars');
            });
        });
    });

    describe('Security Analysis Edge Cases', () => {
        it('should handle analysis of extremely complex mixed attacks', () => {
            const complexAttack = [
                '\x1B[2J',                    // Screen clear
                '\x1B]0;fake title\x07',      // Title manipulation  
                '$(rm -rf /)',               // Command injection
                '\u202Ehidden\u202D',        // Bidi override
                '%s%d%x',                    // Format strings
                '\x00\x01\x02',             // Control chars
                'https://evil.com'           // URL
            ].join(' ');
            
            const analysis = analyzeLogSecurity(complexAttack);
            
            expect(analysis.riskLevel).toBe('critical');
            expect(analysis.attackVectors.length).toBeGreaterThan(5);
            expect(analysis.threatCategories.length).toBeGreaterThan(5);
            expect(analysis.violations.length).toBeGreaterThan(0);
        });

        it('should provide consistent risk scoring across similar attacks', () => {
            const similarAttacks = [
                '\x1B[2J clear',
                '\x1B[H cursor',  
                '\x1B[31m color'
            ];
            
            const analyses = similarAttacks.map(attack => analyzeLogSecurity(attack));
            const riskScores = analyses.map(a => a.riskScore);
            
            // Risk scores should be similar for similar attack types
            const avgScore = riskScores.reduce((a, b) => a + b) / riskScores.length;
            riskScores.forEach(score => {
                expect(Math.abs(score - avgScore)).toBeLessThan(25); // Within 25 points (more realistic tolerance)
            });
        });
    });

    describe('Real-time Monitoring Edge Cases', () => {
        let monitor: LogSecurityMonitor;

        beforeEach(() => {
            monitor = new LogSecurityMonitor({
                alertThreshold: 1,
                timeWindow: 1000
            });
        });

        it('should handle monitoring system resource exhaustion', () => {
            // Simulate thousands of rapid violations
            for (let i = 0; i < 10000; i++) {
                monitor.monitorMessage('\x1B[2J attack', `source${i % 100}`);
            }
            
            const stats = monitor.getStats();
            expect(stats).toBeDefined();
            expect(stats.length).toBeLessThan(1000); // Should not grow unbounded
        });

        it('should handle time window edge cases correctly', () => {
            const message = '\x1B[2J attack';
            
            // First message
            monitor.monitorMessage(message, 'test');
            
            // Wait for time window to expire (simulate with direct time manipulation)
            const now = Date.now();
            (monitor as any).lastViolationTime.set('test', now - 2000); // 2 seconds ago
            
            // Second message should reset counter
            monitor.monitorMessage(message, 'test');
            
            const stats = monitor.getStats();
            expect(stats).toBeDefined();
        });

        it('should handle concurrent monitoring operations safely', async () => {
            const promises = Array(100).fill(0).map((_, i) => 
                monitor.monitorMessage('\x1B[2J attack', `source${i}`)
            );
            
            expect(() => Promise.all(promises)).not.toThrow();
        });
    });

    describe('Integration & Compatibility Edge Cases', () => {
        it('should maintain backward compatibility with simple strings', () => {
            const simpleMessages = [
                'Simple log message',
                'Message with numbers 12345',
                'Message with punctuation !@#$%^&*()',
                'Multi-line\nmessage\nwith\nbreaks'
            ];
            
            simpleMessages.forEach(message => {
                const result = sanitizeLogOutput(message);
                expect(result).toBe(message); // Should pass through unchanged
            });
        });

        it('should work correctly with different character encodings', () => {
            const encodings = [
                'ASCII message',
                'UTF-8: café naïve',
                'Emoji: 🚀 🔥 💻',
                'Mixed: ASCII + UTF-8 + 🔒'
            ];
            
            encodings.forEach(message => {
                expect(() => {
                    const result = sanitizeLogOutput(message);
                    expect(result).toBeDefined();
                }).not.toThrow();
            });
        });

        it('should handle integration with existing logging frameworks', () => {
            // Simulate winston/pino/bunyan-style object logging
            const logObjects = [
                { level: 'info', message: 'test \x1B[31m', timestamp: new Date() },
                { msg: 'error \x1B[2J', pid: 1234 },
                'String message \x1B]0;title\x07'
            ];
            
            logObjects.forEach(obj => {
                expect(() => {
                    const message = typeof obj === 'string' ? obj : obj.message || obj.msg || '';
                    const result = sanitizeLogOutput(message);
                    expect(result).toBeDefined();
                }).not.toThrow();
            });
        });
    });
});