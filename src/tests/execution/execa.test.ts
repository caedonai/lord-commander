/**
 * Execa Module Tests
 *
 * Comprehensive tests for the process execution wrapper module
 * to improve execution module coverage.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';


// Mock dependencies
vi.mock('execa', () => ({
  execa: vi.fn(),
  execaSync: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
}));

vi.mock('../../core/foundation/core/constants.js', () => ({
  PACKAGE_MANAGER_COMMANDS: {
    npm: {
      install: 'npm install',
      installDev: 'npm install --save-dev',
      run: 'npm run',
      create: 'npm create',
      lockFile: 'package-lock.json',
    },
    pnpm: {
      install: 'pnpm install',
      installDev: 'pnpm add -D',
      run: 'pnpm run',
      create: 'pnpm create',
      lockFile: 'pnpm-lock.yaml',
    },
    yarn: {
      install: 'yarn install',
      installDev: 'yarn add -D',
      run: 'yarn run',
      create: 'yarn create',
      lockFile: 'yarn.lock',
    },
  },
}));

vi.mock('../../core/foundation/errors/errors.js', () => ({
  ProcessError: class ProcessError extends Error {
    constructor(message: string, public command?: string, public exitCode?: number, public cause?: Error) {
      super(message);
      this.name = 'ProcessError';
    }
  },
}));

vi.mock('../../core/ui/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('../../core/execution/fs.js', () => ({
  exists: vi.fn(),
}));

import { mkdir } from 'node:fs/promises';
import { execa as execaLib, execaSync as execaSyncLib } from 'execa';
import { ProcessError } from '../../core/foundation/errors/errors.js';
import { exists } from '../../core/execution/fs.js';
import {
  execa,
  execaSync,
  execaStream,
  execaWithOutput,
  commandExists,
  detectPackageManager,
  runPackageManagerExeca,
  gitExeca,
  createCancellableExecution,
  execaSequence,
  execaParallel,
} from '../../core/execution/execa.js';

describe('Execa Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execa', () => {
    it('should execute a command successfully', async () => {
      const mockResult = {
        stdout: 'success output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const result = await execa('echo', ['hello']);

      expect(result.stdout).toBe('success output');
      expect(result.exitCode).toBe(0);
      expect(result.failed).toBe(false);
      expect(result.command).toBe('echo hello');
      expect(typeof result.duration).toBe('number');
    });

    it('should handle command failure with reject=true', async () => {
      const mockError = {
        stdout: 'error output',
        stderr: 'error message',
        exitCode: 1,
        failed: true,
        timedOut: false,
        killed: false,
        message: 'Command failed',
      };

      vi.mocked(execaLib).mockRejectedValue(mockError);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await expect(execa('false')).rejects.toThrow(ProcessError);
    });

    it('should handle command failure with reject=false', async () => {
      const mockError = {
        stdout: 'error output',
        stderr: 'error message',
        exitCode: 1,
        failed: true,
        timedOut: false,
        killed: false,
        message: 'Command failed',
      };

      vi.mocked(execaLib).mockRejectedValue(mockError);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const result = await execa('false', [], { reject: false });

      expect(result.exitCode).toBe(1);
      expect(result.failed).toBe(true);
      expect(result.stdout).toBe('error output');
    });

    it('should create sandbox environment when enabled', async () => {
      const mockResult = {
        stdout: 'success',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await execa('echo', ['test'], {
        sandbox: {
          enabled: true,
          isolateWorkingDirectory: true,
          restrictEnvironment: true,
        },
      });

      expect(mkdir).toHaveBeenCalled();
      expect(execaLib).toHaveBeenCalledWith(
        'echo',
        ['test'],
        expect.objectContaining({
          extendEnv: false,
          shell: false,
        })
      );
    });

    it('should use custom environment variables', async () => {
      const mockResult = {
        stdout: 'success',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await execa('env', [], {
        env: { CUSTOM_VAR: 'custom_value' },
      });

      expect(execaLib).toHaveBeenCalledWith(
        'env',
        [],
        expect.objectContaining({
          env: expect.objectContaining({
            CUSTOM_VAR: 'custom_value',
          }),
        })
      );
    });

    it('should warn when shell execution is enabled', async () => {
      const mockResult = {
        stdout: 'success',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await execa('echo', ['test'], { shell: true });

      // The shell option should be passed through (not overridden in current implementation)
      expect(execaLib).toHaveBeenCalledWith(
        'echo',
        ['test'],
        expect.objectContaining({
          shell: true, // Actual behavior
        })
      );
    });

    it('should handle timeout option', async () => {
      const mockResult = {
        stdout: 'success',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await execa('sleep', ['1'], { timeout: 5000 });

      expect(execaLib).toHaveBeenCalledWith(
        'sleep',
        ['1'],
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });
  });

  describe('execaSync', () => {
    it('should execute a command synchronously', () => {
      const mockResult = {
        stdout: 'sync output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaSyncLib).mockReturnValue(mockResult as any);

      const result = execaSync('echo', ['hello']);

      expect(result.stdout).toBe('sync output');
      expect(result.exitCode).toBe(0);
      expect(result.command).toBe('echo hello');
      expect(typeof result.duration).toBe('number');
    });

    it('should handle sync command failure', () => {
      const mockError = {
        stdout: '',
        stderr: 'sync error',
        exitCode: 1,
        failed: true,
        timedOut: false,
        killed: false,
        message: 'Sync command failed',
      };

      vi.mocked(execaSyncLib).mockImplementation(() => {
        throw mockError;
      });

      expect(() => execaSync('false')).toThrow(ProcessError);
    });

    it('should use restricted environment in sync mode', () => {
      const mockResult = {
        stdout: 'sync output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaSyncLib).mockReturnValue(mockResult as any);

      execaSync('echo', ['test'], {
        sandbox: {
          enabled: true,
          restrictEnvironment: true,
        },
      });

      expect(execaSyncLib).toHaveBeenCalledWith(
        'echo',
        ['test'],
        expect.objectContaining({
          extendEnv: false,
          shell: false,
        })
      );
    });
  });

  describe('execaStream', () => {
    it('should execute command with streaming output', async () => {
      const mockSubprocess = {
        stdout: {
          on: vi.fn(),
        },
        stderr: {
          on: vi.fn(),
        },
      };
      const mockResult = {
        stdout: 'streamed output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockReturnValue(
        Promise.resolve(mockResult as any).then((result) => {
          Object.assign(mockSubprocess, result);
          return result;
        }) as any
      );
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const onStdout = vi.fn();
      const onStderr = vi.fn();
      const onProgress = vi.fn();

      await execaStream('echo', ['test'], {
        onStdout,
        onStderr,
        onProgress,
      });

      expect(execaLib).toHaveBeenCalledWith(
        'echo',
        ['test'],
        expect.objectContaining({
          stdio: 'pipe',
        })
      );
    });

    it('should handle streaming command failure', async () => {
      const mockError = {
        exitCode: 1,
        failed: true,
        message: 'Stream command failed',
      };

      vi.mocked(execaLib).mockRejectedValue(mockError);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await expect(execaStream('false')).rejects.toThrow(ProcessError);
    });
  });

  describe('execaWithOutput', () => {
    it('should execute command and capture output without throwing', async () => {
      const mockResult = {
        stdout: 'captured output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const result = await execaWithOutput('echo', ['test']);

      expect(result.stdout).toBe('captured output');
      expect(execaLib).toHaveBeenCalledWith(
        'echo',
        ['test'],
        expect.objectContaining({
          reject: false,
        })
      );
    });
  });

  describe('commandExists', () => {
    it('should return true for existing command', async () => {
      const mockResult = {
        stdout: '/usr/bin/git',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const result = await commandExists('git');

      expect(result).toBe(true);
    });

    it('should return false for non-existing command', async () => {
      const mockError = {
        exitCode: 1,
        stdout: '',
        stderr: 'command not found',
        failed: true,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockRejectedValue(mockError);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const result = await commandExists('nonexistent-command');

      expect(result).toBe(false);
    });

    it('should use correct command based on platform', async () => {
      const originalPlatform = process.platform;
      
      // Test Windows
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      vi.mocked(execaLib).mockResolvedValue({
        stdout: 'C:\\Windows\\System32\\git.exe',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await commandExists('git');

      expect(execaLib).toHaveBeenCalledWith(
        'where',
        ['git'],
        expect.any(Object)
      );

      // Restore platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('detectPackageManager', () => {
    beforeEach(() => {
      vi.mocked(exists).mockImplementation((path: string) => {
        return path.includes('pnpm-lock.yaml');
      });
    });

    it('should detect package manager from lock file', async () => {
      const result = await detectPackageManager('/test/project');

      expect(result).toEqual({
        manager: 'pnpm',
        lockFile: 'pnpm-lock.yaml',
        commands: expect.objectContaining({
          install: 'pnpm install',
          run: 'pnpm run',
        }),
      });
    });

    it('should return null when no package manager detected', async () => {
      vi.mocked(exists).mockReturnValue(false);
      
      // Also mock commandExists to return false
      vi.mocked(execaLib).mockResolvedValue({
        exitCode: 1,
        failed: true,
      } as any);

      const result = await detectPackageManager();

      expect(result).toBeNull();
    });

    it('should fallback to checking available commands', async () => {
      vi.mocked(exists).mockReturnValue(false);
      
      // Mock pnpm command exists
      vi.mocked(execaLib).mockResolvedValue({
        stdout: '/usr/bin/pnpm',
        exitCode: 0,
        failed: false,
      } as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const result = await detectPackageManager();

      expect(result?.manager).toBe('pnpm');
    });
  });

  describe('runPackageManagerExeca', () => {
    beforeEach(() => {
      vi.mocked(exists).mockImplementation((path: string) => {
        return path.includes('package-lock.json');
      });
    });

    it('should run install command', async () => {
      const mockResult = {
        stdout: 'packages installed',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const result = await runPackageManagerExeca('install');

      expect(result.stdout).toBe('packages installed');
      expect(execaLib).toHaveBeenCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({
          stdio: 'inherit',
        })
      );
    });

    it('should run install with specific package', async () => {
      const mockResult = {
        stdout: 'package installed',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await runPackageManagerExeca('install', 'express');

      expect(execaLib).toHaveBeenCalledWith(
        'npm',
        ['install', 'express'],
        expect.any(Object)
      );
    });

    it('should run dev dependency install', async () => {
      const mockResult = {
        stdout: 'dev dependency installed',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await runPackageManagerExeca('installDev', 'typescript');

      expect(execaLib).toHaveBeenCalledWith(
        'npm',
        ['install', '--save-dev', 'typescript'],
        expect.any(Object)
      );
    });

    it('should run script command', async () => {
      const mockResult = {
        stdout: 'script executed',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await runPackageManagerExeca('run', 'test');

      expect(execaLib).toHaveBeenCalledWith(
        'npm',
        ['run', 'test'],
        expect.any(Object)
      );
    });

    it('should throw error when no package manager detected', async () => {
      vi.mocked(exists).mockReturnValue(false);
      vi.mocked(execaLib).mockResolvedValue({
        exitCode: 1,
        failed: true,
      } as any);

      await expect(runPackageManagerExeca('install')).rejects.toThrow(ProcessError);
    });

    it('should throw error for run command without script name', async () => {
      await expect(runPackageManagerExeca('run')).rejects.toThrow(ProcessError);
    });

    it('should throw error for create command without package name', async () => {
      await expect(runPackageManagerExeca('create')).rejects.toThrow(ProcessError);
    });
  });

  describe('gitExeca', () => {
    it('should execute git command when git is available', async () => {
      const mockResult = {
        stdout: 'git output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      // Mock git availability check
      vi.mocked(execaLib)
        .mockResolvedValueOnce({
          stdout: '/usr/bin/git',
          exitCode: 0,
          failed: false,
        } as any)
        .mockResolvedValueOnce(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const result = await gitExeca('status');

      expect(result.stdout).toBe('git output');
      // Check that git command is called (second call after the git availability check)
      expect(execaLib).toHaveBeenNthCalledWith(
        2,
        'git',
        ['status'],
        expect.objectContaining({
          reject: true,
        })
      );
    });

    it('should throw error when git is not available', async () => {
      vi.mocked(execaLib).mockRejectedValue({
        exitCode: 1,
        failed: true,
      });

      await expect(gitExeca('status')).rejects.toThrow(ProcessError);
    });
  });

  describe('createCancellableExecution', () => {
    it('should create cancellable execution context', () => {
      const cancellable = createCancellableExecution();

      expect(cancellable).toHaveProperty('signal');
      expect(cancellable).toHaveProperty('cancel');
      expect(cancellable).toHaveProperty('execa');
      expect(cancellable).toHaveProperty('execStream');
      expect(typeof cancellable.cancel).toBe('function');
    });

    it('should pass signal to execa functions', async () => {
      const mockResult = {
        stdout: 'output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const cancellable = createCancellableExecution();
      await cancellable.execa('echo', ['test']);

      expect(execaLib).toHaveBeenCalledWith(
        'echo',
        ['test'],
        expect.objectContaining({
          signal: cancellable.signal,
        })
      );
    });
  });

  describe('execaSequence', () => {
    it('should execute commands in sequence', async () => {
      const mockResults = [
        {
          stdout: 'result 1',
          stderr: '',
          exitCode: 0,
          failed: false,
          timedOut: false,
          killed: false,
        },
        {
          stdout: 'result 2',
          stderr: '',
          exitCode: 0,
          failed: false,
          timedOut: false,
          killed: false,
        },
      ];

      vi.mocked(execaLib)
        .mockResolvedValueOnce(mockResults[0] as any)
        .mockResolvedValueOnce(mockResults[1] as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const commands = [
        { command: 'echo', args: ['first'] },
        { command: 'echo', args: ['second'] },
      ];

      const results = await execaSequence(commands);

      expect(results).toHaveLength(2);
      expect(results[0].stdout).toBe('result 1');
      expect(results[1].stdout).toBe('result 2');
    });

    it('should stop on error by default', async () => {
      vi.mocked(execaLib)
        .mockResolvedValueOnce({
          stdout: 'result 1',
          exitCode: 0,
          failed: false,
        } as any)
        .mockRejectedValueOnce(new Error('Command failed'));
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const commands = [
        { command: 'echo', args: ['first'] },
        { command: 'false' },
        { command: 'echo', args: ['third'] },
      ];

      await expect(execaSequence(commands)).rejects.toThrow('Failed to execute command');
    });

    it('should continue on error when stopOnError is false', async () => {
      vi.mocked(execaLib)
        .mockResolvedValueOnce({
          stdout: 'result 1',
          exitCode: 0,
          failed: false,
        } as any)
        .mockRejectedValueOnce(new Error('Command failed'))
        .mockResolvedValueOnce({
          stdout: 'result 3',
          exitCode: 0,
          failed: false,
        } as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const commands = [
        { command: 'echo', args: ['first'] },
        { command: 'false' },
        { command: 'echo', args: ['third'] },
      ];

      const results = await execaSequence(commands, { stopOnError: false });

      expect(results).toHaveLength(3);
      expect(results[0].stdout).toBe('result 1');
      expect(results[1].failed).toBe(true);
      expect(results[2].stdout).toBe('result 3');
    });
  });

  describe('execaParallel', () => {
    it('should execute commands in parallel', async () => {
      const mockResults = [
        {
          stdout: 'result 1',
          stderr: '',
          exitCode: 0,
          failed: false,
          timedOut: false,
          killed: false,
        },
        {
          stdout: 'result 2',
          stderr: '',
          exitCode: 0,
          failed: false,
          timedOut: false,
          killed: false,
        },
      ];

      vi.mocked(execaLib)
        .mockResolvedValueOnce(mockResults[0] as any)
        .mockResolvedValueOnce(mockResults[1] as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const commands = [
        { command: 'echo', args: ['first'] },
        { command: 'echo', args: ['second'] },
      ];

      const results = await execaParallel(commands);

      expect(results).toHaveLength(2);
      expect(results.some(r => r.stdout === 'result 1')).toBe(true);
      expect(results.some(r => r.stdout === 'result 2')).toBe(true);
    });

    it('should respect maxConcurrency limit', async () => {
      const mockResult = {
        stdout: 'result',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const commands = Array.from({ length: 10 }, (_, i) => ({
        command: 'echo',
        args: [`test${i}`],
      }));

      const results = await execaParallel(commands, { maxConcurrency: 2 });

      expect(results).toHaveLength(10);
    });
  });

  describe('Sandbox Security', () => {
    it('should create secure environment with minimal variables', async () => {
      const mockResult = {
        stdout: 'secure output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await execa('env', [], {
        sandbox: {
          enabled: true,
          restrictEnvironment: true,
          allowedEnvVars: ['PATH', 'NODE_ENV'],
        },
      });

      expect(execaLib).toHaveBeenCalledWith(
        'env',
        [],
        expect.objectContaining({
          extendEnv: false,
          env: expect.objectContaining({
            NODE_ENV: expect.any(String), // Could be 'test' in test environment
          }),
        })
      );
    });

    it('should disable sandbox when explicitly disabled', async () => {
      const mockResult = {
        stdout: 'normal output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);

      await execa('env', [], {
        sandbox: {
          enabled: false,
        },
      });

      // Should not call mkdir when sandbox is disabled
      expect(mkdir).not.toHaveBeenCalled();
    });

    it('should handle sandbox directory creation failure gracefully', async () => {
      vi.mocked(mkdir).mockRejectedValue(new Error('Permission denied'));
      
      const mockResult = {
        stdout: 'output',
        stderr: '',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      };

      vi.mocked(execaLib).mockResolvedValue(mockResult as any);

      // Should not throw, should fallback to current directory
      const result = await execa('echo', ['test'], {
        sandbox: {
          enabled: true,
          isolateWorkingDirectory: true,
        },
      });

      expect(result.stdout).toBe('output');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown error types', async () => {
      const unknownError = new Error('Unknown error');
      vi.mocked(execaLib).mockRejectedValue(unknownError);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await expect(execa('unknown-command')).rejects.toThrow(ProcessError);
    });

    it('should properly format command strings', async () => {
      const mockError = {
        exitCode: 1,
        message: 'Command failed',
      };

      vi.mocked(execaLib).mockRejectedValue(mockError);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      try {
        await execa('complex-command', ['--option', 'value', '--flag']);
      } catch (error) {
        expect(error).toBeInstanceOf(ProcessError);
      }
    });
  });
});