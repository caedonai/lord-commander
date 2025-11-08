import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as gitModule from '../../plugins/git.js';
import { execa } from '../../core/execution/execa.js';
import { CLIError } from '../../core/foundation/errors/errors.js';
import type { ExecResult } from '../../core/execution/execa.js';

// Mock dependencies
vi.mock('../../core/execution/execa.js');

// Helper to create ExecResult mock
function mockExecResult(overrides: Partial<ExecResult> = {}): ExecResult {
  return {
    stdout: '',
    stderr: '',
    exitCode: 0,
    command: 'git command',
    failed: false,
    timedOut: false,
    killed: false,
    duration: 100,
    ...overrides
  };
}

describe('Git Plugin - focused tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitRepository', () => {
    it('should return true when git repository is detected', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ stdout: '.git' }));

      const result = await gitModule.isGitRepository('/path/to/repo');

      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', '--git-dir'], { cwd: '/path/to/repo' });
    });

    it('should return false when not a git repository', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a git repository'));

      const result = await gitModule.isGitRepository('/not/repo');

      expect(result).toBe(false);
    });
  });

  describe('isGitAvailable', () => {
    it('should return true when git is available', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ stdout: 'git version 2.30.0' }));

      const result = await gitModule.isGitAvailable();

      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('git', ['--version']);
    });

    it('should return false when git is not available', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('git: command not found'));

      const result = await gitModule.isGitAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getRepositoryRoot', () => {
    it('should return repository root path', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ stdout: '/path/to/repo\n' }));

      const result = await gitModule.getRepositoryRoot('/path/to/repo/subdir');

      expect(result).toBe('/path/to/repo');
      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', '--show-toplevel'], { cwd: '/path/to/repo/subdir' });
    });

    it('should throw CLIError when not in git repository', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a git repository'));

      await expect(gitModule.getRepositoryRoot('/not/repo')).rejects.toThrow(CLIError);
    });
  });

  describe('init', () => {
    it('should initialize git repository with defaults', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.init('/new/repo');

      expect(execa).toHaveBeenCalledWith('git', ['init', '/new/repo'], { cwd: '/new/repo' });
    });

    it('should initialize with default branch', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.init('/new/repo', { defaultBranch: 'main' });

      expect(execa).toHaveBeenCalledWith('git', ['init', '--initial-branch', 'main', '/new/repo'], { cwd: '/new/repo' });
    });

    it('should initialize bare repository', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.init('/new/repo', { bare: true });

      expect(execa).toHaveBeenCalledWith('git', ['init', '--bare', '/new/repo'], { cwd: '/new/repo' });
    });

    it('should handle initialization errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Permission denied'));

      await expect(gitModule.init('/invalid/path')).rejects.toThrow(CLIError);
    });
  });

  describe('clone', () => {
    it('should clone repository with defaults', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.clone('https://github.com/user/repo.git', '/target/dir');

      expect(execa).toHaveBeenCalledWith('git', ['clone', 'https://github.com/user/repo.git', '/target/dir']);
    });

    it('should clone with branch option', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.clone('https://github.com/user/repo.git', '/target/dir', { branch: 'develop' });

      expect(execa).toHaveBeenCalledWith('git', ['clone', '--branch', 'develop', 'https://github.com/user/repo.git', '/target/dir']);
    });

    it('should clone with depth limit', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.clone('https://github.com/user/repo.git', '/target/dir', { depth: 1 });

      expect(execa).toHaveBeenCalledWith('git', ['clone', '--depth', '1', 'https://github.com/user/repo.git', '/target/dir']);
    });

    it('should handle clone errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Repository not found'));

      await expect(gitModule.clone('https://invalid.url', '/target')).rejects.toThrow(CLIError);
    });
  });

  describe('getStatus', () => {
    it('should parse git status correctly', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce(mockExecResult({ stdout: 'main' })) // branch --show-current
        .mockRejectedValueOnce(new Error('No upstream')) // rev-list (no tracking)
        .mockResolvedValueOnce(mockExecResult({ 
          stdout: 'A  added.txt\n M modified.txt\n?? untracked.txt\n'
        })); // status --porcelain

      const result = await gitModule.getStatus('/repo');

      expect(result.branch).toBe('main');
      expect(result.ahead).toBe(0);
      expect(result.behind).toBe(0);
      expect(result.staged).toEqual(['added.txt']);
      expect(result.unstaged).toEqual(['modified.txt']);
      expect(result.untracked).toEqual(['untracked.txt']);
      expect(result.clean).toBe(false);
    });

    it('should handle clean repository', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce(mockExecResult({ stdout: 'main' }))
        .mockRejectedValueOnce(new Error('No upstream'))
        .mockResolvedValueOnce(mockExecResult({ stdout: '' }));

      const result = await gitModule.getStatus('/repo');

      expect(result.clean).toBe(true);
      expect(result.staged).toEqual([]);
      expect(result.unstaged).toEqual([]);
      expect(result.untracked).toEqual([]);
    });

    it('should handle tracking branch info', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce(mockExecResult({ stdout: 'main' }))
        .mockResolvedValueOnce(mockExecResult({ stdout: '1\t2' })) // behind\tahead
        .mockResolvedValueOnce(mockExecResult({ stdout: '' }));

      const result = await gitModule.getStatus('/repo');

      expect(result.ahead).toBe(2);
      expect(result.behind).toBe(1);
    });

    it('should handle status errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a repository'));

      await expect(gitModule.getStatus('/non-repo')).rejects.toThrow(CLIError);
    });
  });

  describe('add', () => {
    it('should add single file', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.add('file.txt', '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['add', 'file.txt'], { cwd: '/repo' });
    });

    it('should add multiple files', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.add(['file1.txt', 'file2.txt'], '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['add', 'file1.txt', 'file2.txt'], { cwd: '/repo' });
    });

    it('should handle add errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('File not found'));

      await expect(gitModule.add('nonexistent.txt', '/repo')).rejects.toThrow(CLIError);
    });
  });

  describe('commit', () => {
    it('should commit with message', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ 
        stdout: '[main abc123d] Test commit'
      }));

      const result = await gitModule.commit({ message: 'Test commit' }, '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['commit', '-m', 'Test commit'], { cwd: '/repo' });
      expect(result).toBe('abc123d');
    });

    it('should commit with options', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.commit({ message: 'Test commit', amend: true, signOff: true }, '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['commit', '-m', 'Test commit', '--amend', '--signoff'], { cwd: '/repo' });
    });

    it('should handle commit errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Nothing to commit'));

      await expect(gitModule.commit({ message: 'Test' }, '/repo')).rejects.toThrow(CLIError);
    });
  });

  describe('getCommits', () => {
    it('should get commits with default limit', async () => {
      const mockCommit = 'abc123def456|abc123d|John Doe|john@example.com|2023-01-01T10:00:00Z|Initial commit';
      vi.mocked(execa).mockResolvedValue(mockExecResult({ stdout: mockCommit }));

      const commits = await gitModule.getCommits(10, '/repo');

      expect(commits).toHaveLength(1);
      expect(commits[0]).toEqual({
        hash: 'abc123def456',
        shortHash: 'abc123d',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2023-01-01T10:00:00Z'),
        message: 'Initial commit'
      });
      expect(execa).toHaveBeenCalledWith('git', ['log', '-10', '--pretty=format:%H|%h|%an|%ae|%ai|%s'], { cwd: '/repo' });
    });

    it('should handle empty log', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ stdout: '' }));

      const commits = await gitModule.getCommits(10, '/repo');

      expect(commits).toEqual([]);
    });

    it('should handle log errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('No commits'));

      await expect(gitModule.getCommits(10, '/repo')).rejects.toThrow(CLIError);
    });
  });

  describe('getDiff', () => {
    it('should get diff between commits', async () => {
      const diffOutput = 'diff --git a/file.txt b/file.txt\nindex abc123..def456';
      vi.mocked(execa).mockResolvedValue(mockExecResult({ stdout: diffOutput }));

      const result = await gitModule.getDiff('HEAD~1', 'HEAD', '/repo');

      expect(result).toBe(diffOutput);
      expect(execa).toHaveBeenCalledWith('git', ['diff', 'HEAD~1', 'HEAD'], { cwd: '/repo' });
    });

    it('should get working directory diff', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ stdout: 'Working dir diff' }));

      const result = await gitModule.getDiff(undefined, undefined, '/repo');

      expect(result).toBe('Working dir diff');
      expect(execa).toHaveBeenCalledWith('git', ['diff'], { cwd: '/repo' });
    });

    it('should handle diff errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Invalid revision'));

      await expect(gitModule.getDiff('invalid', 'HEAD', '/repo')).rejects.toThrow(CLIError);
    });
  });

  describe('getBranches', () => {
    it('should get local branches', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ 
        stdout: '* main\n  develop\n  feature/new-feature\n'
      }));

      const branches = await gitModule.getBranches('/repo');

      expect(branches).toEqual(['main', 'develop', 'feature/new-feature']);
      expect(execa).toHaveBeenCalledWith('git', ['branch'], { cwd: '/repo' });
    });

    it('should get all branches including remote', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ 
        stdout: '* main\n  develop\n  remotes/origin/main\n'
      }));

      const branches = await gitModule.getBranches('/repo', true);

      expect(branches).toEqual(['main', 'develop', 'remotes/origin/main']);
      expect(execa).toHaveBeenCalledWith('git', ['branch', '-a'], { cwd: '/repo' });
    });

    it('should handle branches error', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a git repository'));

      await expect(gitModule.getBranches('/not-repo')).rejects.toThrow(CLIError);
    });
  });

  describe('createBranch', () => {
    it('should create new branch', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.createBranch('new-feature', '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['branch', 'new-feature'], { cwd: '/repo' });
    });

    it('should create and checkout branch', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.createBranch('new-feature', '/repo', true);

      expect(execa).toHaveBeenCalledWith('git', ['checkout', '-b', 'new-feature'], { cwd: '/repo' });
    });

    it('should handle branch creation errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Branch exists'));

      await expect(gitModule.createBranch('existing', '/repo')).rejects.toThrow(CLIError);
    });
  });

  describe('checkout', () => {
    it('should checkout branch', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult());

      await gitModule.checkout('develop', '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['checkout', 'develop'], { cwd: '/repo' });
    });

    it('should handle checkout errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Branch not found'));

      await expect(gitModule.checkout('nonexistent', '/repo')).rejects.toThrow(CLIError);
    });
  });

  describe('getCurrentCommit', () => {
    it('should get current commit hash', async () => {
      vi.mocked(execa).mockResolvedValue(mockExecResult({ 
        stdout: 'abc123def456789\n'
      }));

      const result = await gitModule.getCurrentCommit('/repo');

      expect(result).toBe('abc123def456789');
      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', 'HEAD'], { cwd: '/repo' });
    });

    it('should handle no commits', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('No HEAD commit'));

      await expect(gitModule.getCurrentCommit('/repo')).rejects.toThrow(CLIError);
    });
  });

  describe('isClean', () => {
    it('should return true for clean repository', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce(mockExecResult({ stdout: 'main' }))
        .mockRejectedValueOnce(new Error('No upstream'))
        .mockResolvedValueOnce(mockExecResult({ stdout: '' }));

      const result = await gitModule.isClean('/repo');

      expect(result).toBe(true);
    });

    it('should return false for dirty repository', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce(mockExecResult({ stdout: 'main' }))
        .mockRejectedValueOnce(new Error('No upstream'))
        .mockResolvedValueOnce(mockExecResult({ stdout: 'M  modified.txt\n' }));

      const result = await gitModule.isClean('/repo');

      expect(result).toBe(false);
    });

    it('should handle status check errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a repository'));

      await expect(gitModule.isClean('/not-repo')).rejects.toThrow(CLIError);
    });
  });
});