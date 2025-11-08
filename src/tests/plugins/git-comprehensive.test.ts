import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ExecResult } from '../../core/execution/execa.js';

// Mock the execa module
vi.mock('../../core/execution/execa.js', () => ({
  execa: vi.fn(),
  execaStream: vi.fn(),
}));

// Import git module and its dependencies
import * as gitModule from '../../plugins/git.js';
import { execa } from '../../core/execution/execa.js';

// Helper function to create proper ExecResult objects
function createMockExecResult(stdout: string, stderr: string = '', exitCode: number = 0): ExecResult {
  return {
    stdout,
    stderr,
    exitCode,
    command: 'git',
    failed: exitCode !== 0,
    timedOut: false,
    killed: false,
    duration: 10,
  };
}

describe('Git Plugin - comprehensive tests (fixed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitRepository', () => {
    it('should return true when git repository is detected', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('/path/to/repo/.git'));

      const result = await gitModule.isGitRepository('/path/to/repo');

      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', '--git-dir'], { cwd: '/path/to/repo' });
    });

    it('should return false when not a git repository', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a git repository'));

      const result = await gitModule.isGitRepository('/path/to/non-repo');

      expect(result).toBe(false);
    });

    it('should use process.cwd() as default directory', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('/.git'));

      await gitModule.isGitRepository();

      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', '--git-dir'], { cwd: process.cwd() });
    });
  });

  describe('isGitAvailable', () => {
    it('should return true when git is available', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('git version 2.30.0'));

      const result = await gitModule.isGitAvailable();

      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('git', ['--version']);
    });

    it('should return false when git is not available', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('git not found'));

      const result = await gitModule.isGitAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getRepositoryRoot', () => {
    it('should return repository root path', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('/path/to/repo'));

      const result = await gitModule.getRepositoryRoot('/path/to/repo/subdir');

      expect(result).toBe('/path/to/repo');
      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', '--show-toplevel'], { cwd: '/path/to/repo/subdir' });
    });

    it('should throw CLIError when not in git repository', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a git repository'));

      await expect(gitModule.getRepositoryRoot('/non-repo')).rejects.toThrow();
    });

    it('should use process.cwd() as default', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('/current/repo'));

      await gitModule.getRepositoryRoot();

      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', '--show-toplevel'], { cwd: process.cwd() });
    });
  });

  describe('init', () => {
    it('should initialize git repository in specified directory', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('Initialized empty Git repository'));

      await gitModule.init('/new/repo');

      expect(execa).toHaveBeenCalledWith('git', ['init', '/new/repo'], { cwd: '/new/repo' });
    });

    it('should initialize with defaultBranch option', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('Initialized empty Git repository'));

      await gitModule.init('/new/repo', { defaultBranch: 'develop' });

      expect(execa).toHaveBeenCalledWith('git', ['init', '--initial-branch', 'develop', '/new/repo'], { cwd: '/new/repo' });
    });

    it('should initialize bare repository', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('Initialized empty Git repository'));

      await gitModule.init('/new/repo', { bare: true });

      expect(execa).toHaveBeenCalledWith('git', ['init', '--bare', '/new/repo'], { cwd: '/new/repo' });
    });

    it('should handle initialization errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Permission denied'));

      await expect(gitModule.init('/protected/repo')).rejects.toThrow();
    });
  });

  describe('clone', () => {
    it('should clone repository with default options', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('Cloning into repository...'));

      await gitModule.clone('https://github.com/user/repo.git', '/target/dir');

      expect(execa).toHaveBeenCalledWith('git', ['clone', 'https://github.com/user/repo.git', '/target/dir']);
    });

    it('should clone with specific branch', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('Cloning into repository...'));

      await gitModule.clone('https://github.com/user/repo.git', '/target/dir', { branch: 'develop' });

      expect(execa).toHaveBeenCalledWith('git', ['clone', '--branch', 'develop', 'https://github.com/user/repo.git', '/target/dir']);
    });

    it('should clone with depth limit', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('Cloning into repository...'));

      await gitModule.clone('https://github.com/user/repo.git', '/target/dir', { depth: 1 });

      expect(execa).toHaveBeenCalledWith('git', ['clone', '--depth', '1', 'https://github.com/user/repo.git', '/target/dir']);
    });

    it('should clone recursively', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('Cloning into repository...'));

      await gitModule.clone('https://github.com/user/repo.git', '/target/dir', { recursive: true });

      expect(execa).toHaveBeenCalledWith('git', ['clone', '--recursive', 'https://github.com/user/repo.git', '/target/dir']);
    });

    it('should handle clone errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Repository not found'));

      await expect(gitModule.clone('https://github.com/user/nonexistent.git', '/target/dir')).rejects.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should parse git status correctly', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce(createMockExecResult('main')) // git branch --show-current
        .mockResolvedValueOnce(createMockExecResult('0\t1')) // git rev-list --count --left-right
        .mockResolvedValueOnce(createMockExecResult('M  modified.txt\nA  added.txt\n?? untracked.txt')); // git status --porcelain

      const result = await gitModule.getStatus('/repo');

      expect(result).toEqual({
        branch: 'main',
        ahead: 1,
        behind: 0,
        staged: ['modified.txt', 'added.txt'],
        unstaged: [],
        untracked: ['untracked.txt'],
        clean: false
      });
    });

    it('should handle clean repository', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce(createMockExecResult('main')) // git branch --show-current
        .mockResolvedValueOnce(createMockExecResult('0\t0')) // git rev-list --count --left-right
        .mockResolvedValueOnce(createMockExecResult('')); // git status --porcelain

      const result = await gitModule.getStatus('/repo');

      expect(result.clean).toBe(true);
      expect(result.staged).toEqual([]);
      expect(result.unstaged).toEqual([]);
      expect(result.untracked).toEqual([]);
    });

    it('should handle status errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a git repository'));

      await expect(gitModule.getStatus('/non-repo')).rejects.toThrow();
    });
  });

  describe('add', () => {
    it('should add single file', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult(''));

      await gitModule.add('file.txt', '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['add', 'file.txt'], { cwd: '/repo' });
    });

    it('should add multiple files', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult(''));

      await gitModule.add(['file1.txt', 'file2.txt'], '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['add', 'file1.txt', 'file2.txt'], { cwd: '/repo' });
    });

    it('should add all files with dot', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult(''));

      await gitModule.add('.', '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['add', '.'], { cwd: '/repo' });
    });

    it('should handle add errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('File not found'));

      await expect(gitModule.add('nonexistent.txt', '/repo')).rejects.toThrow();
    });
  });

  describe('commit', () => {
    it('should commit with message', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('[main abc123d] Test commit'));

      const hash = await gitModule.commit({ message: 'Test commit' }, '/repo');

      expect(hash).toBe('abc123d');
      expect(execa).toHaveBeenCalledWith('git', ['commit', '-m', 'Test commit'], { cwd: '/repo' });
    });

    it('should commit with amend option', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('[main def456a] Test commit (amended)'));

      await gitModule.commit({ message: 'Test commit', amend: true }, '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['commit', '-m', 'Test commit', '--amend'], { cwd: '/repo' });
    });

    it('should commit with sign-off', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('[main ghi789b] Test commit'));

      await gitModule.commit({ message: 'Test commit', signOff: true }, '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['commit', '-m', 'Test commit', '--signoff'], { cwd: '/repo' });
    });

    it('should allow empty commits', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('[main jkl012c] Empty commit'));

      await gitModule.commit({ message: 'Empty commit', allowEmpty: true }, '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['commit', '-m', 'Empty commit', '--allow-empty'], { cwd: '/repo' });
    });

    it('should handle commit errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Nothing to commit'));

      await expect(gitModule.commit({ message: 'Test' }, '/repo')).rejects.toThrow();
    });
  });

  describe('getCommits', () => {
    it('should get commits with default limit', async () => {
      const gitLog = [
        'abc123d|abc123d|John Doe|john@example.com|2023-01-01 12:00:00 +0000|Initial commit',
        'def456e|def456e|Jane Smith|jane@example.com|2023-01-02 13:00:00 +0000|Add feature'
      ].join('\n');
      
      vi.mocked(execa).mockResolvedValue(createMockExecResult(gitLog));

      const commits = await gitModule.getCommits(10, '/repo');

      expect(commits).toHaveLength(2);
      expect(commits[0]).toEqual({
        hash: 'abc123d',
        shortHash: 'abc123d',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2023-01-01 12:00:00 +0000'),
        message: 'Initial commit'
      });
      
      expect(execa).toHaveBeenCalledWith('git', ['log', '-10', '--pretty=format:%H|%h|%an|%ae|%ai|%s'], { cwd: '/repo' });
    });

    it('should get commits with custom limit', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('abc123d|abc123d|John Doe|john@example.com|2023-01-01 12:00:00 +0000|Initial commit'));

      await gitModule.getCommits(5, '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['log', '-5', '--pretty=format:%H|%h|%an|%ae|%ai|%s'], { cwd: '/repo' });
    });

    it('should handle empty log', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult(''));

      const commits = await gitModule.getCommits(10, '/repo');

      expect(commits).toEqual([]);
    });

    it('should handle log errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Invalid reference'));

      await expect(gitModule.getCommits(10, '/repo')).rejects.toThrow();
    });
  });

  describe('getDiff', () => {
    it('should get diff between commits', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('diff --git a/file.txt b/file.txt\nindex abc123..def456 100644\n--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old content\n+new content'));

      const diff = await gitModule.getDiff('abc123', 'def456', '/repo');

      expect(diff).toContain('diff --git a/file.txt b/file.txt');
      expect(execa).toHaveBeenCalledWith('git', ['diff', 'abc123', 'def456'], { cwd: '/repo' });
    });

    it('should get working directory diff', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('diff --git a/file.txt b/file.txt\nindex abc123..def456 100644\n--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old content\n+new content'));

      await gitModule.getDiff(undefined, undefined, '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['diff'], { cwd: '/repo' });
    });

    it('should handle diff errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Invalid commit'));

      await expect(gitModule.getDiff('invalid', 'commit', '/repo')).rejects.toThrow();
    });
  });

  describe('getBranches', () => {
    it('should get branches without remote', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('* main\n  develop\n  feature/new-feature'));

      const branches = await gitModule.getBranches('/repo');

      expect(branches).toEqual(['main', 'develop', 'feature/new-feature']);
      expect(execa).toHaveBeenCalledWith('git', ['branch'], { cwd: '/repo' });
    });

    it('should get branches with remote', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('* main\n  develop\n  feature/new-feature\n  remotes/origin/main\n  remotes/origin/develop'));

      const branches = await gitModule.getBranches('/repo', true);

      expect(branches).toEqual(['main', 'develop', 'feature/new-feature', 'remotes/origin/main', 'remotes/origin/develop']);
      expect(execa).toHaveBeenCalledWith('git', ['branch', '-a'], { cwd: '/repo' });
    });

    it('should handle branches error', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a git repository'));

      await expect(gitModule.getBranches('/repo')).rejects.toThrow();
    });
  });

  describe('createBranch', () => {
    it('should create new branch', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult(''));

      await gitModule.createBranch('new-feature', '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['branch', 'new-feature'], { cwd: '/repo' });
    });

    it('should create and checkout branch', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult(''));

      await gitModule.createBranch('new-feature', '/repo', true);

      expect(execa).toHaveBeenCalledWith('git', ['checkout', '-b', 'new-feature'], { cwd: '/repo' });
    });

    it('should handle branch creation errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Branch already exists'));

      await expect(gitModule.createBranch('existing-branch', '/repo')).rejects.toThrow();
    });
  });

  describe('checkout', () => {
    it('should checkout branch', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('Switched to branch \'develop\''));

      await gitModule.checkout('develop', '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['checkout', 'develop'], { cwd: '/repo' });
    });

    it('should checkout commit hash', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('HEAD is now at abc123d Initial commit'));

      await gitModule.checkout('abc123d', '/repo');

      expect(execa).toHaveBeenCalledWith('git', ['checkout', 'abc123d'], { cwd: '/repo' });
    });

    it('should handle checkout errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Branch not found'));

      await expect(gitModule.checkout('nonexistent', '/repo')).rejects.toThrow();
    });
  });

  describe('getCurrentCommit', () => {
    it('should get current commit hash', async () => {
      vi.mocked(execa).mockResolvedValue(createMockExecResult('abc123def456789'));

      const hash = await gitModule.getCurrentCommit('/repo');

      expect(hash).toBe('abc123def456789');
      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', 'HEAD'], { cwd: '/repo' });
    });

    it('should handle no commits', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('No commits yet'));

      await expect(gitModule.getCurrentCommit('/repo')).rejects.toThrow();
    });
  });

  describe('isClean', () => {
    it('should return true for clean repository', async () => {
      // Mock the getStatus function call with clean status
      vi.mocked(execa)
        .mockResolvedValueOnce(createMockExecResult('main')) // git branch --show-current
        .mockResolvedValueOnce(createMockExecResult('0\t0')) // git rev-list --count --left-right
        .mockResolvedValueOnce(createMockExecResult('')); // git status --porcelain

      const clean = await gitModule.isClean('/repo');

      expect(clean).toBe(true);
    });

    it('should return false for dirty repository', async () => {
      // Mock the getStatus function call with dirty status
      vi.mocked(execa)
        .mockResolvedValueOnce(createMockExecResult('main')) // git branch --show-current
        .mockResolvedValueOnce(createMockExecResult('0\t0')) // git rev-list --count --left-right
        .mockResolvedValueOnce(createMockExecResult('M  modified.txt\n?? untracked.txt')); // git status --porcelain

      const clean = await gitModule.isClean('/repo');

      expect(clean).toBe(false);
    });

    it('should handle status check errors', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('Not a git repository'));

      await expect(gitModule.isClean('/repo')).rejects.toThrow();
    });
  });
});