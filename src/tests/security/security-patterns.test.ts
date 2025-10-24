import { describe, it, expect } from 'vitest';
import {
  PATH_TRAVERSAL_PATTERNS,
  COMMAND_INJECTION_PATTERNS,
  SCRIPT_INJECTION_PATTERNS,
  PRIVILEGE_ESCALATION_PATTERNS,
  FILE_SYSTEM_PATTERNS,
  NETWORK_PATTERNS,
  INPUT_VALIDATION_PATTERNS,
  analyzeInputSecurity,
  sanitizeInput,
  isPathSafe,
  isCommandSafe,
  isProjectNameSafe
} from '../../core/foundation/security/patterns.js';

describe('Security Patterns', () => {
  describe('Path Traversal Patterns', () => {
    it('should detect basic directory traversal', () => {
      expect(PATH_TRAVERSAL_PATTERNS.DOTDOT_SLASH.test('../../../etc')).toBe(true);
      expect(PATH_TRAVERSAL_PATTERNS.DOTDOT_SLASH.test('..\\..\\windows')).toBe(true);
      expect(PATH_TRAVERSAL_PATTERNS.DOTDOT_SLASH.test('./safe-path')).toBe(false);
    });

    it('should detect encoded traversal attempts', () => {
      expect(PATH_TRAVERSAL_PATTERNS.DOTDOT_ENCODED.test('%2e%2e%2f')).toBe(true);
      expect(PATH_TRAVERSAL_PATTERNS.DOTDOT_ENCODED.test('normal')).toBe(false);
      expect(PATH_TRAVERSAL_PATTERNS.DOUBLE_ENCODED.test('%252e%252e%252f')).toBe(true);
    });

    it('should detect UNC paths and drive roots', () => {
      expect(PATH_TRAVERSAL_PATTERNS.UNC_PATH.test('\\\\server\\share')).toBe(true);
      expect(PATH_TRAVERSAL_PATTERNS.DRIVE_ROOT.test('C:\\')).toBe(true);
      expect(PATH_TRAVERSAL_PATTERNS.DRIVE_ROOT.test('D:/')).toBe(true);
      expect(PATH_TRAVERSAL_PATTERNS.ROOT_PATH.test('/etc/passwd')).toBe(true);
    });

    it('should detect null byte injection', () => {
      expect(PATH_TRAVERSAL_PATTERNS.NULL_BYTE.test('file.txt\x00.jpg')).toBe(true);
      expect(PATH_TRAVERSAL_PATTERNS.NULL_BYTE.test('normal-file.txt')).toBe(false);
    });
  });

  describe('Command Injection Patterns', () => {
    it('should detect shell metacharacters', () => {
      expect(COMMAND_INJECTION_PATTERNS.SHELL_METACHARACTERS.test('cmd; rm -rf /')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.SHELL_METACHARACTERS.test('cmd && evil')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.SHELL_METACHARACTERS.test('cmd | cat')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.SHELL_METACHARACTERS.test('$(evil)')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.SHELL_METACHARACTERS.test('safe-command')).toBe(false);
    });

    it('should detect command chaining', () => {
      expect(COMMAND_INJECTION_PATTERNS.COMMAND_CHAINING.test('cmd1; cmd2')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.COMMAND_CHAINING.test('cmd1 && cmd2')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.COMMAND_CHAINING.test('cmd1 || cmd2')).toBe(true);
    });

    it('should detect subprocess execution', () => {
      expect(COMMAND_INJECTION_PATTERNS.SUBPROCESS_EXECUTION.test('$(echo hello)')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.BACKTICK_EXECUTION.test('`whoami`')).toBe(true);
    });

    it('should detect dangerous commands', () => {
      expect(COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS.test('rm -rf /')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS.test('curl evil.com')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS.test('eval malicious')).toBe(true);
      expect(COMMAND_INJECTION_PATTERNS.DANGEROUS_COMMANDS.test('npm install')).toBe(false);
    });
  });

  describe('Script Injection Patterns', () => {
    it('should detect JavaScript injection', () => {
      expect(SCRIPT_INJECTION_PATTERNS.JAVASCRIPT_EVAL.test('eval("malicious")')).toBe(true);
      expect(SCRIPT_INJECTION_PATTERNS.JAVASCRIPT_FUNCTION.test('Function("return evil")')).toBe(true);
      expect(SCRIPT_INJECTION_PATTERNS.JAVASCRIPT_SETTIMEOUT.test('setTimeout("evil", 100)')).toBe(true);
    });

    it('should detect HTML/XML injection', () => {
      expect(SCRIPT_INJECTION_PATTERNS.SCRIPT_TAG.test('<script>alert("xss")</script>')).toBe(true);
      expect(SCRIPT_INJECTION_PATTERNS.JAVASCRIPT_PROTOCOL.test('javascript:alert("xss")')).toBe(true);
      expect(SCRIPT_INJECTION_PATTERNS.DATA_URI.test('data:text/html;base64,PHNjcmlwdD4=')).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      expect(SCRIPT_INJECTION_PATTERNS.SQL_KEYWORDS.test("'; DROP TABLE users; --")).toBe(true);
      expect(SCRIPT_INJECTION_PATTERNS.SQL_KEYWORDS.test('user WHERE SELECT')).toBe(true);
      expect(SCRIPT_INJECTION_PATTERNS.SQL_COMMENTS.test('admin\' --')).toBe(true);
    });

    it('should detect NoSQL injection', () => {
      expect(SCRIPT_INJECTION_PATTERNS.NOSQL_OPERATORS.test('{"$where": "function() { return true; }"}')).toBe(true);
      expect(SCRIPT_INJECTION_PATTERNS.NOSQL_OPERATORS.test('{"username": {"$ne": null}}')).toBe(true);
    });

    it('should detect template injection', () => {
      expect(SCRIPT_INJECTION_PATTERNS.TEMPLATE_INJECTION.test('Hello {{evil}}')).toBe(true);
      expect(SCRIPT_INJECTION_PATTERNS.TEMPLATE_INJECTION.test('normal text')).toBe(false);
    });
  });

  describe('Privilege Escalation Patterns', () => {
    it('should detect sudo and su commands', () => {
      expect(PRIVILEGE_ESCALATION_PATTERNS.SUDO_COMMAND.test('sudo rm -rf /')).toBe(true);
      expect(PRIVILEGE_ESCALATION_PATTERNS.SU_COMMAND.test('su root')).toBe(true);
    });

    it('should detect Windows elevation', () => {
      expect(PRIVILEGE_ESCALATION_PATTERNS.RUNAS_COMMAND.test('runas /user:Administrator cmd')).toBe(true);
      expect(PRIVILEGE_ESCALATION_PATTERNS.UAC_BYPASS.test('bypassuac technique')).toBe(true);
    });

    it('should detect setuid commands', () => {
      expect(PRIVILEGE_ESCALATION_PATTERNS.SETUID_COMMANDS.test('chmod 4755 /bin/sh')).toBe(true);
      expect(PRIVILEGE_ESCALATION_PATTERNS.SETUID_COMMANDS.test('chown root:root file')).toBe(true);
    });

    it('should detect service and registry manipulation', () => {
      expect(PRIVILEGE_ESCALATION_PATTERNS.SERVICE_COMMANDS.test('systemctl start malicious')).toBe(true);
      expect(PRIVILEGE_ESCALATION_PATTERNS.REGISTRY_COMMANDS.test('reg add HKLM\\Software')).toBe(true);
    });
  });

  describe('File System Patterns', () => {
    it('should detect Unix sensitive files', () => {
      expect(FILE_SYSTEM_PATTERNS.UNIX_SENSITIVE_FILES.test('/etc/passwd')).toBe(true);
      expect(FILE_SYSTEM_PATTERNS.UNIX_SENSITIVE_FILES.test('/etc/shadow')).toBe(true);
      expect(FILE_SYSTEM_PATTERNS.UNIX_SENSITIVE_FILES.test('/root/secret')).toBe(true);
      expect(FILE_SYSTEM_PATTERNS.UNIX_SENSITIVE_FILES.test('/proc/version')).toBe(true);
    });

    it('should detect Windows sensitive files', () => {
      expect(FILE_SYSTEM_PATTERNS.WINDOWS_SENSITIVE_FILES.test('\\windows\\system32\\config')).toBe(true);
      expect(FILE_SYSTEM_PATTERNS.WINDOWS_SENSITIVE_FILES.test('\\Program Files\\app')).toBe(true);
    });

    it('should detect dangerous file types', () => {
      expect(FILE_SYSTEM_PATTERNS.CONFIG_FILES.test('config.env')).toBe(true);
      expect(FILE_SYSTEM_PATTERNS.CONFIG_FILES.test('private.key')).toBe(true);
      expect(FILE_SYSTEM_PATTERNS.EXECUTABLE_FILES.test('malware.exe')).toBe(true);
      expect(FILE_SYSTEM_PATTERNS.EXECUTABLE_FILES.test('script.bat')).toBe(true);
    });
  });

  describe('Network Patterns', () => {
    it('should detect suspicious protocols', () => {
      expect(NETWORK_PATTERNS.SUSPICIOUS_PROTOCOLS.test('file:///etc/passwd')).toBe(true);
      expect(NETWORK_PATTERNS.SUSPICIOUS_PROTOCOLS.test('ftp://malicious.com')).toBe(true);
      expect(NETWORK_PATTERNS.SUSPICIOUS_PROTOCOLS.test('https://safe.com')).toBe(false);
    });

    it('should detect private IP addresses', () => {
      expect(NETWORK_PATTERNS.PRIVATE_IPS.test('192.168.1.1')).toBe(true);
      expect(NETWORK_PATTERNS.PRIVATE_IPS.test('10.0.0.1')).toBe(true);
      expect(NETWORK_PATTERNS.PRIVATE_IPS.test('172.16.0.1')).toBe(true);
      expect(NETWORK_PATTERNS.PRIVATE_IPS.test('8.8.8.8')).toBe(false);
    });

    it('should detect localhost variants', () => {
      expect(NETWORK_PATTERNS.LOCALHOST_VARIANTS.test('localhost')).toBe(true);
      expect(NETWORK_PATTERNS.LOCALHOST_VARIANTS.test('127.0.0.1')).toBe(true);
      expect(NETWORK_PATTERNS.LOCALHOST_VARIANTS.test('example.com')).toBe(false);
    });

    it('should detect suspicious ports', () => {
      expect(NETWORK_PATTERNS.SUSPICIOUS_PORTS.test('127.0.0.1:22')).toBe(true);
      expect(NETWORK_PATTERNS.SUSPICIOUS_PORTS.test('server:3389')).toBe(true);
      expect(NETWORK_PATTERNS.SUSPICIOUS_PORTS.test('api:3000')).toBe(false);
    });
  });

  describe('Input Validation Patterns', () => {
    it('should validate safe project names', () => {
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PROJECT_NAME.test('my-awesome-project')).toBe(true);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PROJECT_NAME.test('project_123')).toBe(true);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PROJECT_NAME.test('project v1.0')).toBe(false);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PROJECT_NAME.test('project; rm -rf /')).toBe(false);
    });

    it('should validate safe file names', () => {
      expect(INPUT_VALIDATION_PATTERNS.SAFE_FILE_NAME.test('my file.txt')).toBe(true);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_FILE_NAME.test('file-123_v2.json')).toBe(true);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_FILE_NAME.test('file; rm')).toBe(false);
    });

    it('should validate package managers', () => {
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PACKAGE_MANAGER.test('npm')).toBe(true);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PACKAGE_MANAGER.test('pnpm')).toBe(true);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PACKAGE_MANAGER.test('yarn')).toBe(true);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PACKAGE_MANAGER.test('bun')).toBe(true);
      expect(INPUT_VALIDATION_PATTERNS.SAFE_PACKAGE_MANAGER.test('malicious')).toBe(false);
    });
  });

  describe('Security Analysis Function', () => {
    it('should analyze safe input correctly', () => {
      const result = analyzeInputSecurity('my-safe-project');
      
      expect(result.isSecure).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.riskScore).toBe(0);
      expect(result.sanitizedInput).toBe('my-safe-project');
    });

    it('should detect path traversal violations', () => {
      const result = analyzeInputSecurity('../../../etc/passwd');
      
      expect(result.isSecure).toBe(false);
      expect(result.violations).toHaveLength(2); // path traversal + sensitive file
      expect(result.violations[0].type).toBe('path-traversal');
      expect(result.violations[0].severity).toBe('critical');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect command injection violations', () => {
      const result = analyzeInputSecurity('cmd; rm -rf /');
      
      expect(result.isSecure).toBe(false);
      expect(result.violations.some(v => v.type === 'command-injection')).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect script injection violations', () => {
      const result = analyzeInputSecurity('eval("malicious code")');
      
      expect(result.isSecure).toBe(false);
      expect(result.violations.some(v => v.type === 'script-injection')).toBe(true);
      expect(result.violations.some(v => v.severity === 'critical')).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect privilege escalation violations', () => {
      const result = analyzeInputSecurity('sudo rm -rf /');
      
      expect(result.isSecure).toBe(false);
      expect(result.violations.some(v => v.type === 'privilege-escalation')).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should calculate risk scores correctly', () => {
      const lowRisk = analyzeInputSecurity('safe-input');
      const highRisk = analyzeInputSecurity('eval("evil"); sudo rm -rf /; ../../../etc/passwd');
      
      expect(lowRisk.riskScore).toBe(0);
      expect(highRisk.riskScore).toBeGreaterThan(50);
      expect(highRisk.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Input Sanitization Function', () => {
    it('should sanitize path traversal attempts', () => {
      const result = sanitizeInput('../../../malicious');
      expect(result).not.toContain('../');
    });

    it('should remove shell metacharacters', () => {
      const result = sanitizeInput('cmd; rm -rf /');
      expect(result).toBe('cmd -rf /'); // Semicolon removed entirely for better security
      expect(result).not.toContain(';');
    });

    it('should remove dangerous commands', () => {
      const result = sanitizeInput('rm -rf dangerous');
      expect(result).not.toContain('rm ');
    });

    it('should preserve safe content', () => {
      const safe = 'my-safe-project-name';
      const result = sanitizeInput(safe);
      expect(result).toBe(safe);
    });
  });

  describe('Helper Validation Functions', () => {
    describe('isPathSafe', () => {
      it('should validate safe paths', () => {
        expect(isPathSafe('./src/components')).toBe(true);
        expect(isPathSafe('src/utils/helper.ts')).toBe(true);
      });

      it('should reject unsafe paths', () => {
        expect(isPathSafe('../../../etc/passwd')).toBe(false);
        expect(isPathSafe('/etc/shadow')).toBe(false);
        expect(isPathSafe('C:\\Windows\\System32')).toBe(false);
      });
    });

    describe('isCommandSafe', () => {
      it('should validate safe commands', () => {
        expect(isCommandSafe('npm install')).toBe(true);
        expect(isCommandSafe('pnpm build')).toBe(true);
        expect(isCommandSafe('node script.js')).toBe(true);
      });

      it('should reject unsafe commands', () => {
        expect(isCommandSafe('rm -rf /')).toBe(false);
        expect(isCommandSafe('cmd; evil')).toBe(false);
        expect(isCommandSafe('sudo malicious')).toBe(false);
      });
    });

    describe('isProjectNameSafe', () => {
      it('should validate safe project names', () => {
        expect(isProjectNameSafe('my-awesome-project')).toBe(true);
        expect(isProjectNameSafe('project123')).toBe(true);
        expect(isProjectNameSafe('my_project-v2')).toBe(true);
      });

      it('should reject unsafe project names', () => {
        expect(isProjectNameSafe('project; rm -rf /')).toBe(false);
        expect(isProjectNameSafe('../../../etc')).toBe(false);
        expect(isProjectNameSafe('project with spaces')).toBe(false);
        expect(isProjectNameSafe('project$(evil)')).toBe(false);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings safely', () => {
      expect(() => analyzeInputSecurity('')).not.toThrow();
      expect(() => sanitizeInput('')).not.toThrow();
      expect(() => isPathSafe('')).not.toThrow();
      expect(() => isCommandSafe('')).not.toThrow();
      expect(() => isProjectNameSafe('')).not.toThrow();
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(() => analyzeInputSecurity(null as any)).not.toThrow();
      expect(() => sanitizeInput(undefined as any)).not.toThrow();
    });

    it('should handle very long inputs', () => {
      const longInput = 'a'.repeat(10000);
      const result = analyzeInputSecurity(longInput);
      expect(result).toBeDefined();
      expect(typeof result.riskScore).toBe('number');
    });

    it('should handle inputs with mixed attacks', () => {
      const mixedAttack = '../../../etc/passwd; rm -rf /; eval("evil"); sudo malicious';
      const result = analyzeInputSecurity(mixedAttack);
      
      expect(result.isSecure).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
      expect(result.violations.some(v => v.type === 'path-traversal')).toBe(true);
      expect(result.violations.some(v => v.type === 'command-injection')).toBe(true);
    });
  });
});
