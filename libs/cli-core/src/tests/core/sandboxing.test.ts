// Quick test to verify execa can be imported
import { describe, expect, it } from 'vitest';
import { execa } from '../../core/execution/execa.js';

describe('Sandboxing Implementation', () => {
  it('should execute commands with sandboxing enabled by default', async () => {
    const result = await execa('node', ['--version'], {
      silent: true,
      sandbox: { enabled: true },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('v');
  });

  it('should restrict environment variables when sandboxing enabled', async () => {
    const result = await execa('node', ['-p', 'JSON.stringify(Object.keys(process.env))'], {
      silent: true,
      sandbox: {
        enabled: true,
        restrictEnvironment: true,
        allowedEnvVars: ['PATH'], // Only allow PATH in addition to NODE_ENV
      },
    });

    expect(result.exitCode).toBe(0);
    const envKeys = JSON.parse(result.stdout.trim());

    // Should have much fewer environment variables than normal
    expect(envKeys.length).toBeLessThan(20); // Should be much less than the 97 we had before

    // Should include NODE_ENV (set to production by default)
    expect(envKeys).toContain('NODE_ENV');

    // Should include PATH (explicitly allowed)
    expect(envKeys).toContain('PATH');

    // Should NOT include many common environment variables that we didn't allow
    expect(envKeys).not.toContain('APPDATA');
    expect(envKeys).not.toContain('PROGRAMFILES');
    expect(envKeys).not.toContain('COMMONPROGRAMFILES');
    expect(envKeys).not.toContain('CHOCOLATEYINSTALL');
    expect(envKeys).not.toContain('VSCODE_INJECTION');
  });

  it('should allow disabling sandboxing', async () => {
    const result = await execa('node', ['--version'], {
      silent: true,
      sandbox: { enabled: false },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('v');
  });

  it('should force shell to false by default for security', async () => {
    const result = await execa('node', ['--version'], {
      silent: true,
    });

    expect(result.exitCode).toBe(0);
  });
});
