import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import versionCommand from '../../commands/version.js';
import type { CommandContext } from '../../types/cli.js';

// Mock the git plugin
vi.mock('../../plugins/git.js', () => ({
  isGitRepository: vi.fn(),
}));

// Mock the updater plugin with comprehensive mock functions
vi.mock('../../plugins/updater.js', () => ({
  compareVersions: vi.fn(),
  createUpdatePlan: vi.fn(),
  getAllTags: vi.fn(),
  getChangeType: vi.fn(),
  getVersionDiff: vi.fn(),
  parseVersion: vi.fn(),
}));

describe('Version Command', () => {
  let program: Command;
  let mockLogger: Record<string, ReturnType<typeof vi.fn>>;
  let mockPrompts: Record<string, ReturnType<typeof vi.fn>>;
  let context: CommandContext;
  let mockIsGitRepository: ReturnType<typeof vi.fn>;
  let mockCompareVersions: ReturnType<typeof vi.fn>;
  let mockCreateUpdatePlan: ReturnType<typeof vi.fn>;
  let mockGetAllTags: ReturnType<typeof vi.fn>;
  let mockGetChangeType: ReturnType<typeof vi.fn>;
  let mockGetVersionDiff: ReturnType<typeof vi.fn>;
  let mockParseVersion: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Import mocked modules
    const { isGitRepository } = await import('../../plugins/git.js');
    const {
      compareVersions,
      createUpdatePlan,
      getAllTags,
      getChangeType,
      getVersionDiff,
      parseVersion,
    } = await import('../../plugins/updater.js');

    // Store mocked functions
    mockIsGitRepository = vi.mocked(isGitRepository);
    mockCompareVersions = vi.mocked(compareVersions);
    mockCreateUpdatePlan = vi.mocked(createUpdatePlan);
    mockGetAllTags = vi.mocked(getAllTags);
    mockGetChangeType = vi.mocked(getChangeType);
    mockGetVersionDiff = vi.mocked(getVersionDiff);
    mockParseVersion = vi.mocked(parseVersion);

    // Create mock logger
    mockLogger = {
      intro: vi.fn(),
      outro: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      step: vi.fn(),
    };

    // Create mock prompts
    mockPrompts = {
      text: vi.fn(),
      confirm: vi.fn(),
      select: vi.fn(),
    };

    // Create context
    context = {
      logger: mockLogger,
      prompts: mockPrompts,
    } as unknown as CommandContext;

    // Create fresh command program
    program = new Command();
    program.exitOverride();

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Command Registration', () => {
    it('should register version command with correct name and description', () => {
      versionCommand(program, context);

      const commands = program.commands;
      const versionCmd = commands.find((cmd) => cmd.name() === 'version');

      expect(versionCmd).toBeDefined();
      expect(versionCmd?.description()).toBe('Version management and update utilities');
    });

    it('should register all command options', () => {
      versionCommand(program, context);

      const versionCmd = program.commands.find((cmd) => cmd.name() === 'version');
      const options = versionCmd?.options;

      expect(options?.some((opt) => opt.long === '--compare')).toBe(true);
      expect(options?.some((opt) => opt.long === '--list-tags')).toBe(true);
      expect(options?.some((opt) => opt.long === '--diff')).toBe(true);
      expect(options?.some((opt) => opt.long === '--plan')).toBe(true);
      expect(options?.some((opt) => opt.long === '--validate')).toBe(true);
    });
  });

  describe('Version Validation', () => {
    beforeEach(() => {
      versionCommand(program, context);
    });

    it('should validate semantic version successfully', async () => {
      const mockVersion = {
        raw: '1.2.3',
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined,
        build: undefined,
      };
      mockParseVersion.mockReturnValue(mockVersion);

      await program.parseAsync(['node', 'test', 'version', '--validate', '1.2.3']);

      expect(mockLogger.intro).toHaveBeenCalledWith('Version Management');
      expect(mockParseVersion).toHaveBeenCalledWith('1.2.3');
      expect(mockLogger.success).toHaveBeenCalledWith('✓ Valid semantic version: 1.2.3');
      expect(mockLogger.info).toHaveBeenCalledWith('  Major: 1, Minor: 2, Patch: 3');
    });

    it('should validate semantic version with prerelease and build metadata', async () => {
      const mockVersion = {
        raw: '1.2.3-alpha.1+build.123',
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha.1',
        build: 'build.123',
      };
      mockParseVersion.mockReturnValue(mockVersion);

      await program.parseAsync(['node', 'test', 'version', '--validate', '1.2.3-alpha.1+build.123']);

      expect(mockLogger.success).toHaveBeenCalledWith('✓ Valid semantic version: 1.2.3-alpha.1+build.123');
      expect(mockLogger.info).toHaveBeenCalledWith('  Prerelease: alpha.1');
      expect(mockLogger.info).toHaveBeenCalledWith('  Build: build.123');
    });

    it('should handle invalid semantic version', async () => {
      mockParseVersion.mockImplementation(() => {
        throw new Error('Invalid version format');
      });

      await program.parseAsync(['node', 'test', 'version', '--validate', 'invalid']);

      expect(mockLogger.error).toHaveBeenCalledWith('✗ Invalid semantic version: Invalid version format');
    });

    it('should handle non-error thrown during validation', async () => {
      mockParseVersion.mockImplementation(() => {
        throw 'String error';
      });

      await program.parseAsync(['node', 'test', 'version', '--validate', 'invalid']);

      expect(mockLogger.error).toHaveBeenCalledWith('✗ Invalid semantic version: String error');
    });
  });

  describe('Version Comparison', () => {
    beforeEach(() => {
      versionCommand(program, context);
    });

    it('should compare two versions when first is less than second', async () => {
      const version1 = { raw: '1.0.0', major: 1, minor: 0, patch: 0 };
      const version2 = { raw: '2.0.0', major: 2, minor: 0, patch: 0 };
      
      mockParseVersion.mockReturnValueOnce(version1).mockReturnValueOnce(version2);
      mockCompareVersions.mockReturnValue(-1);
      mockGetChangeType.mockReturnValue('major');

      await program.parseAsync(['node', 'test', 'version', '--compare', '1.0.0,2.0.0']);

      expect(mockLogger.success).toHaveBeenCalledWith('Comparison: 1.0.0 < 2.0.0');
      expect(mockGetChangeType).toHaveBeenCalledWith(version1, version2);
      expect(mockLogger.info).toHaveBeenCalledWith('Change type: major');
    });

    it('should compare two versions when first is greater than second', async () => {
      const version1 = { raw: '2.0.0', major: 2, minor: 0, patch: 0 };
      const version2 = { raw: '1.0.0', major: 1, minor: 0, patch: 0 };
      
      mockParseVersion.mockReturnValueOnce(version1).mockReturnValueOnce(version2);
      mockCompareVersions.mockReturnValue(1);
      mockGetChangeType.mockReturnValue('major');

      await program.parseAsync(['node', 'test', 'version', '--compare', '2.0.0,1.0.0']);

      expect(mockLogger.success).toHaveBeenCalledWith('Comparison: 2.0.0 > 1.0.0');
      expect(mockGetChangeType).toHaveBeenCalledWith(version2, version1);
      expect(mockLogger.info).toHaveBeenCalledWith('Change type: major');
    });

    it('should compare two equal versions', async () => {
      const version1 = { raw: '1.0.0', major: 1, minor: 0, patch: 0 };
      const version2 = { raw: '1.0.0', major: 1, minor: 0, patch: 0 };
      
      mockParseVersion.mockReturnValueOnce(version1).mockReturnValueOnce(version2);
      mockCompareVersions.mockReturnValue(0);

      await program.parseAsync(['node', 'test', 'version', '--compare', '1.0.0,1.0.0']);

      expect(mockLogger.success).toHaveBeenCalledWith('Comparison: 1.0.0 === 1.0.0');
      expect(mockGetChangeType).not.toHaveBeenCalled();
    });

    it('should handle missing version in comparison', async () => {
      await program.parseAsync(['node', 'test', 'version', '--compare', '1.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Please provide two versions: --compare v1.0.0,v2.0.0');
    });

    it('should handle comparison errors', async () => {
      mockParseVersion.mockImplementation(() => {
        throw new Error('Parse error');
      });

      await program.parseAsync(['node', 'test', 'version', '--compare', '1.0.0,2.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Comparison failed: Parse error');
    });

    it('should handle non-error thrown during comparison', async () => {
      mockParseVersion.mockImplementation(() => {
        throw 'String error';
      });

      await program.parseAsync(['node', 'test', 'version', '--compare', '1.0.0,2.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Comparison failed: String error');
    });
  });

  describe('Git Repository Requirements', () => {
    beforeEach(() => {
      versionCommand(program, context);
    });

    it('should check git repository for list-tags command', async () => {
      mockIsGitRepository.mockResolvedValue(false);

      await program.parseAsync(['node', 'test', 'version', '--list-tags']);

      expect(mockIsGitRepository).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Git-based commands require a git repository');
    });

    it('should check git repository for diff command', async () => {
      mockIsGitRepository.mockResolvedValue(false);

      await program.parseAsync(['node', 'test', 'version', '--diff', '1.0.0,2.0.0']);

      expect(mockIsGitRepository).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Git-based commands require a git repository');
    });

    it('should check git repository for plan command', async () => {
      mockIsGitRepository.mockResolvedValue(false);

      await program.parseAsync(['node', 'test', 'version', '--plan', '1.0.0,2.0.0']);

      expect(mockIsGitRepository).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Git-based commands require a git repository');
    });
  });

  describe('List Tags Operation', () => {
    beforeEach(() => {
      versionCommand(program, context);
      mockIsGitRepository.mockResolvedValue(true);
    });

    it('should list git tags successfully', async () => {
      const mockTags = ['v1.0.0', 'v1.1.0', 'v2.0.0'];
      mockGetAllTags.mockResolvedValue(mockTags);
      mockParseVersion.mockImplementation((tag: string) => ({
        raw: tag,
        major: parseInt(tag.split('.')[0].slice(1)),
        minor: parseInt(tag.split('.')[1]),
        patch: parseInt(tag.split('.')[2]),
      }));

      await program.parseAsync(['node', 'test', 'version', '--list-tags']);

      expect(mockGetAllTags).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('Found 3 tags:');
      expect(mockLogger.info).toHaveBeenCalledWith('  1. v1.0.0 (v1.0.0)');
      expect(mockLogger.info).toHaveBeenCalledWith('  2. v1.1.0 (v1.1.0)');
      expect(mockLogger.info).toHaveBeenCalledWith('  3. v2.0.0 (v2.0.0)');
    });

    it('should handle non-semver tags', async () => {
      const mockTags = ['v1.0.0', 'invalid-tag', 'v2.0.0'];
      mockGetAllTags.mockResolvedValue(mockTags);
      mockParseVersion.mockImplementation((tag: string) => {
        if (tag === 'invalid-tag') {
          throw new Error('Invalid version');
        }
        return {
          raw: tag,
          major: parseInt(tag.split('.')[0].slice(1)),
          minor: parseInt(tag.split('.')[1]),
          patch: parseInt(tag.split('.')[2]),
        };
      });

      await program.parseAsync(['node', 'test', 'version', '--list-tags']);

      expect(mockLogger.success).toHaveBeenCalledWith('Found 3 tags:');
      expect(mockLogger.info).toHaveBeenCalledWith('  2. invalid-tag (non-semver)');
    });

    it('should handle no tags found', async () => {
      mockGetAllTags.mockResolvedValue([]);

      await program.parseAsync(['node', 'test', 'version', '--list-tags']);

      expect(mockLogger.info).toHaveBeenCalledWith('No tags found in repository');
    });

    it('should handle list tags error', async () => {
      mockGetAllTags.mockRejectedValue(new Error('Git error'));

      await program.parseAsync(['node', 'test', 'version', '--list-tags']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to list tags: Git error');
    });

    it('should handle non-error thrown during list tags', async () => {
      mockGetAllTags.mockRejectedValue('String error');

      await program.parseAsync(['node', 'test', 'version', '--list-tags']);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to list tags: String error');
    });
  });

  describe('Version Diff Operation', () => {
    beforeEach(() => {
      versionCommand(program, context);
      mockIsGitRepository.mockResolvedValue(true);
    });

    it('should show version diff successfully', async () => {
      const mockDiff = {
        from: { raw: 'v1.0.0' },
        to: { raw: 'v2.0.0' },
        changeType: 'major',
        breaking: true,
        files: [
          { path: 'src/file1.ts', status: 'modified', insertions: 10, deletions: 5 },
          { path: 'src/file2.ts', status: 'added', insertions: 20, deletions: 0 },
        ],
        commits: [
          { shortHash: 'abc123', message: 'feat: new feature' },
          { shortHash: 'def456', message: 'fix: bug fix' },
        ],
      };
      mockGetVersionDiff.mockResolvedValue(mockDiff);

      await program.parseAsync(['node', 'test', 'version', '--diff', 'v1.0.0,v2.0.0']);

      expect(mockLogger.step).toHaveBeenCalledWith('Getting diff from v1.0.0 to v2.0.0...');
      expect(mockGetVersionDiff).toHaveBeenCalledWith('v1.0.0', 'v2.0.0');
      expect(mockLogger.success).toHaveBeenCalledWith('Version Diff: v1.0.0 → v2.0.0');
      expect(mockLogger.info).toHaveBeenCalledWith('Change Type: major');
      expect(mockLogger.info).toHaveBeenCalledWith('Breaking Changes: Yes');
      expect(mockLogger.info).toHaveBeenCalledWith('Files Changed: 2');
      expect(mockLogger.info).toHaveBeenCalledWith('Commits: 2');
    });

    it('should display file changes in diff', async () => {
      const mockDiff = {
        from: { raw: 'v1.0.0' },
        to: { raw: 'v2.0.0' },
        changeType: 'major',
        breaking: false,
        files: [
          { path: 'src/file1.ts', status: 'modified', insertions: 10, deletions: 5 },
        ],
        commits: [],
      };
      mockGetVersionDiff.mockResolvedValue(mockDiff);

      await program.parseAsync(['node', 'test', 'version', '--diff', 'v1.0.0,v2.0.0']);

      expect(mockLogger.info).toHaveBeenCalledWith('\nFile Changes:');
      expect(mockLogger.info).toHaveBeenCalledWith('  Modified: src/file1.ts (+10/-5)');
    });

    it('should display commits in diff', async () => {
      const mockDiff = {
        from: { raw: 'v1.0.0' },
        to: { raw: 'v2.0.0' },
        changeType: 'major',
        breaking: false,
        files: [],
        commits: [
          { shortHash: 'abc123', message: 'feat: new feature' },
        ],
      };
      mockGetVersionDiff.mockResolvedValue(mockDiff);

      await program.parseAsync(['node', 'test', 'version', '--diff', 'v1.0.0,v2.0.0']);

      expect(mockLogger.info).toHaveBeenCalledWith('\nRecent Commits:');
      expect(mockLogger.info).toHaveBeenCalledWith('  abc123: feat: new feature');
    });

    it('should limit file display to 10 files', async () => {
      const files = Array.from({ length: 15 }, (_, i) => ({
        path: `file${i}.ts`,
        status: 'modified',
        insertions: 1,
        deletions: 1,
      }));
      
      const mockDiff = {
        from: { raw: 'v1.0.0' },
        to: { raw: 'v2.0.0' },
        changeType: 'major',
        breaking: false,
        files,
        commits: [],
      };
      mockGetVersionDiff.mockResolvedValue(mockDiff);

      await program.parseAsync(['node', 'test', 'version', '--diff', 'v1.0.0,v2.0.0']);

      expect(mockLogger.info).toHaveBeenCalledWith('  ... and 5 more files');
    });

    it('should limit commit display to 5 commits', async () => {
      const commits = Array.from({ length: 8 }, (_, i) => ({
        shortHash: `hash${i}`,
        message: `commit ${i}`,
      }));
      
      const mockDiff = {
        from: { raw: 'v1.0.0' },
        to: { raw: 'v2.0.0' },
        changeType: 'major',
        breaking: false,
        files: [],
        commits,
      };
      mockGetVersionDiff.mockResolvedValue(mockDiff);

      await program.parseAsync(['node', 'test', 'version', '--diff', 'v1.0.0,v2.0.0']);

      expect(mockLogger.info).toHaveBeenCalledWith('  ... and 3 more commits');
    });

    it('should handle missing version in diff', async () => {
      await program.parseAsync(['node', 'test', 'version', '--diff', 'v1.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Please provide two versions: --diff v1.0.0,v2.0.0');
    });

    it('should handle diff error', async () => {
      mockGetVersionDiff.mockRejectedValue(new Error('Diff error'));

      await program.parseAsync(['node', 'test', 'version', '--diff', 'v1.0.0,v2.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Diff failed: Diff error');
    });

    it('should handle non-error thrown during diff', async () => {
      mockGetVersionDiff.mockRejectedValue('String error');

      await program.parseAsync(['node', 'test', 'version', '--diff', 'v1.0.0,v2.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Diff failed: String error');
    });
  });

  describe('Update Plan Operation', () => {
    beforeEach(() => {
      versionCommand(program, context);
      mockIsGitRepository.mockResolvedValue(true);
    });

    it('should create update plan successfully', async () => {
      const mockPlan = {
        fromVersion: 'v1.0.0',
        toVersion: 'v2.0.0',
        strategy: { type: 'automatic' },
        backupRequired: true,
        conflicts: [
          { file: 'package.json', description: 'Version conflict' },
        ],
        diff: {
          files: [
            { path: 'src/file1.ts', status: 'modified' },
          ],
        },
      };
      mockCreateUpdatePlan.mockResolvedValue(mockPlan);

      await program.parseAsync(['node', 'test', 'version', '--plan', 'v1.0.0,v2.0.0']);

      expect(mockLogger.step).toHaveBeenCalledWith('Creating update plan from v1.0.0 to v2.0.0...');
      expect(mockCreateUpdatePlan).toHaveBeenCalledWith('v1.0.0', 'v2.0.0', process.cwd());
      expect(mockLogger.success).toHaveBeenCalledWith('Update Plan: v1.0.0 → v2.0.0');
      expect(mockLogger.info).toHaveBeenCalledWith('Strategy: automatic');
      expect(mockLogger.info).toHaveBeenCalledWith('Backup Required: Yes');
      expect(mockLogger.info).toHaveBeenCalledWith('Files to Update: 1');
      expect(mockLogger.info).toHaveBeenCalledWith('Conflicts: 1');
    });

    it('should display conflicts in update plan', async () => {
      const mockPlan = {
        fromVersion: 'v1.0.0',
        toVersion: 'v2.0.0',
        strategy: { type: 'manual' },
        backupRequired: false,
        conflicts: [
          { file: 'package.json', description: 'Version conflict' },
        ],
        diff: { files: [] },
      };
      mockCreateUpdatePlan.mockResolvedValue(mockPlan);

      await program.parseAsync(['node', 'test', 'version', '--plan', 'v1.0.0,v2.0.0']);

      expect(mockLogger.warn).toHaveBeenCalledWith('\nPotential Conflicts:');
      expect(mockLogger.warn).toHaveBeenCalledWith('  package.json: Version conflict');
    });

    it('should display planned changes', async () => {
      const mockPlan = {
        fromVersion: 'v1.0.0',
        toVersion: 'v2.0.0',
        strategy: { type: 'automatic' },
        backupRequired: false,
        conflicts: [],
        diff: {
          files: [
            { path: 'src/file1.ts', status: 'modified' },
          ],
        },
      };
      mockCreateUpdatePlan.mockResolvedValue(mockPlan);

      await program.parseAsync(['node', 'test', 'version', '--plan', 'v1.0.0,v2.0.0']);

      expect(mockLogger.info).toHaveBeenCalledWith('\nPlanned Changes:');
      expect(mockLogger.info).toHaveBeenCalledWith('  modified: src/file1.ts');
    });

    it('should limit planned changes display to 10 files', async () => {
      const files = Array.from({ length: 15 }, (_, i) => ({
        path: `file${i}.ts`,
        status: 'modified',
      }));
      
      const mockPlan = {
        fromVersion: 'v1.0.0',
        toVersion: 'v2.0.0',
        strategy: { type: 'automatic' },
        backupRequired: false,
        conflicts: [],
        diff: { files },
      };
      mockCreateUpdatePlan.mockResolvedValue(mockPlan);

      await program.parseAsync(['node', 'test', 'version', '--plan', 'v1.0.0,v2.0.0']);

      expect(mockLogger.info).toHaveBeenCalledWith('  ... and 5 more files');
    });

    it('should handle missing version in plan', async () => {
      await program.parseAsync(['node', 'test', 'version', '--plan', 'v1.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Please provide two versions: --plan v1.0.0,v2.0.0');
    });

    it('should handle update plan error', async () => {
      mockCreateUpdatePlan.mockRejectedValue(new Error('Plan error'));

      await program.parseAsync(['node', 'test', 'version', '--plan', 'v1.0.0,v2.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Update plan failed: Plan error');
    });

    it('should handle non-error thrown during plan creation', async () => {
      mockCreateUpdatePlan.mockRejectedValue('String error');

      await program.parseAsync(['node', 'test', 'version', '--plan', 'v1.0.0,v2.0.0']);

      expect(mockLogger.error).toHaveBeenCalledWith('Update plan failed: String error');
    });
  });

  describe('Interactive Mode', () => {
    beforeEach(() => {
      versionCommand(program, context);
    });

    it('should enter interactive mode when no options provided', async () => {
      mockIsGitRepository.mockResolvedValue(true);
      mockPrompts.select.mockResolvedValue('validate');
      mockPrompts.text.mockResolvedValue('1.2.3');
      mockParseVersion.mockReturnValue({ raw: '1.2.3', major: 1, minor: 2, patch: 3 });

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.info).toHaveBeenCalledWith('Interactive version management');
      expect(mockPrompts.select).toHaveBeenCalledWith({
        message: 'What would you like to do?',
        options: [
          { value: 'validate', label: 'Validate semantic version' },
          { value: 'compare', label: 'Compare two versions' },
          { value: 'list', label: 'List repository tags' },
          { value: 'diff', label: 'Show version diff' },
          { value: 'plan', label: 'Create update plan' },
        ],
      });
    });

    it('should show limited options when not in git repository', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('validate');
      mockPrompts.text.mockResolvedValue('1.2.3');
      mockParseVersion.mockReturnValue({ raw: '1.2.3', major: 1, minor: 2, patch: 3 });

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockPrompts.select).toHaveBeenCalledWith({
        message: 'What would you like to do?',
        options: [
          { value: 'validate', label: 'Validate semantic version' },
          { value: 'compare', label: 'Compare two versions' },
        ],
      });
    });

    it('should handle interactive validation', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('validate');
      mockPrompts.text.mockResolvedValue('1.2.3');
      mockParseVersion.mockReturnValue({ raw: '1.2.3', major: 1, minor: 2, patch: 3 });

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockPrompts.text).toHaveBeenCalledWith({
        message: 'Enter version to validate:',
        placeholder: '1.2.3',
      });
      expect(mockLogger.success).toHaveBeenCalledWith('✓ Valid semantic version: 1.2.3');
    });

    it('should handle interactive validation error', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('validate');
      mockPrompts.text.mockResolvedValue('invalid');
      mockParseVersion.mockImplementation(() => {
        throw new Error('Invalid format');
      });

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.error).toHaveBeenCalledWith('✗ Invalid: Invalid format');
    });

    it('should handle interactive validation with non-error thrown', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('validate');
      mockPrompts.text.mockResolvedValue('invalid');
      mockParseVersion.mockImplementation(() => {
        throw 'String error';
      });

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.error).toHaveBeenCalledWith('✗ Invalid: String error');
    });

    it('should handle interactive comparison', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('compare');
      mockPrompts.text
        .mockResolvedValueOnce('1.0.0')
        .mockResolvedValueOnce('2.0.0');
      
      const version1 = { raw: '1.0.0', major: 1, minor: 0, patch: 0 };
      const version2 = { raw: '2.0.0', major: 2, minor: 0, patch: 0 };
      mockParseVersion.mockReturnValueOnce(version1).mockReturnValueOnce(version2);
      mockCompareVersions.mockReturnValue(-1);

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockPrompts.text).toHaveBeenCalledWith({
        message: 'Enter first version:',
        placeholder: '1.0.0',
      });
      expect(mockPrompts.text).toHaveBeenCalledWith({
        message: 'Enter second version:',
        placeholder: '2.0.0',
      });
      expect(mockLogger.success).toHaveBeenCalledWith('1.0.0 < 2.0.0');
    });

    it('should handle interactive comparison with equal versions', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('compare');
      mockPrompts.text
        .mockResolvedValueOnce('1.0.0')
        .mockResolvedValueOnce('1.0.0');
      
      const version1 = { raw: '1.0.0', major: 1, minor: 0, patch: 0 };
      const version2 = { raw: '1.0.0', major: 1, minor: 0, patch: 0 };
      mockParseVersion.mockReturnValueOnce(version1).mockReturnValueOnce(version2);
      mockCompareVersions.mockReturnValue(0);

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.success).toHaveBeenCalledWith('1.0.0 === 1.0.0');
    });

    it('should handle interactive comparison error', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('compare');
      mockPrompts.text
        .mockResolvedValueOnce('invalid')
        .mockResolvedValueOnce('1.0.0');
      mockParseVersion.mockImplementation(() => {
        throw new Error('Parse error');
      });

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.error).toHaveBeenCalledWith('Comparison failed: Parse error');
    });

    it('should handle interactive comparison with non-error thrown', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('compare');
      mockPrompts.text
        .mockResolvedValueOnce('invalid')
        .mockResolvedValueOnce('1.0.0');
      mockParseVersion.mockImplementation(() => {
        throw 'String error';
      });

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.error).toHaveBeenCalledWith('Comparison failed: String error');
    });

    it('should handle interactive list tags', async () => {
      mockIsGitRepository.mockResolvedValue(true);
      mockPrompts.select.mockResolvedValue('list');
      mockGetAllTags.mockResolvedValue(['v1.0.0', 'v2.0.0']);

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockGetAllTags).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('Found 2 tags');
      expect(mockLogger.info).toHaveBeenCalledWith('  v1.0.0');
      expect(mockLogger.info).toHaveBeenCalledWith('  v2.0.0');
    });

    it('should handle interactive list tags when no tags found', async () => {
      mockIsGitRepository.mockResolvedValue(true);
      mockPrompts.select.mockResolvedValue('list');
      mockGetAllTags.mockResolvedValue([]);

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.info).toHaveBeenCalledWith('No tags found');
    });

    it('should handle interactive diff operation', async () => {
      mockIsGitRepository.mockResolvedValue(true);
      mockPrompts.select
        .mockResolvedValueOnce('diff')
        .mockResolvedValueOnce('v1.0.0')
        .mockResolvedValueOnce('v2.0.0');
      
      mockGetAllTags.mockResolvedValue(['v1.0.0', 'v2.0.0', 'v3.0.0']);
      
      const mockDiff = {
        from: { raw: 'v1.0.0' },
        to: { raw: 'v2.0.0' },
        files: [{ path: 'file.ts' }],
        commits: [{ shortHash: 'abc123' }],
      };
      mockGetVersionDiff.mockResolvedValue(mockDiff);

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockPrompts.select).toHaveBeenCalledWith({
        message: 'Select source version:',
        options: [
          { value: 'v1.0.0', label: 'v1.0.0' },
          { value: 'v2.0.0', label: 'v2.0.0' },
          { value: 'v3.0.0', label: 'v3.0.0' },
        ],
      });
      
      expect(mockPrompts.select).toHaveBeenCalledWith({
        message: 'Select target version:',
        options: [
          { value: 'v2.0.0', label: 'v2.0.0' },
          { value: 'v3.0.0', label: 'v3.0.0' },
        ],
      });
      
      expect(mockGetVersionDiff).toHaveBeenCalledWith('v1.0.0', 'v2.0.0');
      expect(mockLogger.success).toHaveBeenCalledWith('Diff: v1.0.0 → v2.0.0');
      expect(mockLogger.info).toHaveBeenCalledWith('Files changed: 1, Commits: 1');
    });

    it('should handle interactive plan operation', async () => {
      mockIsGitRepository.mockResolvedValue(true);
      mockPrompts.select
        .mockResolvedValueOnce('plan')
        .mockResolvedValueOnce('v1.0.0')
        .mockResolvedValueOnce('v2.0.0');
      
      mockGetAllTags.mockResolvedValue(['v1.0.0', 'v2.0.0']);
      
      const mockPlan = {
        fromVersion: 'v1.0.0',
        toVersion: 'v2.0.0',
        strategy: { type: 'automatic' },
        conflicts: [],
      };
      mockCreateUpdatePlan.mockResolvedValue(mockPlan);

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockCreateUpdatePlan).toHaveBeenCalledWith('v1.0.0', 'v2.0.0', process.cwd());
      expect(mockLogger.success).toHaveBeenCalledWith('Plan: v1.0.0 → v2.0.0');
      expect(mockLogger.info).toHaveBeenCalledWith('Strategy: automatic, Conflicts: 0');
    });

    it('should handle interactive diff/plan with insufficient tags', async () => {
      mockIsGitRepository.mockResolvedValue(true);
      mockPrompts.select.mockResolvedValue('diff');
      mockGetAllTags.mockResolvedValue(['v1.0.0']); // Only 1 tag

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.error).toHaveBeenCalledWith('Need at least 2 tags for diff/plan operations');
    });

    it('should complete interactive mode successfully', async () => {
      mockIsGitRepository.mockResolvedValue(false);
      mockPrompts.select.mockResolvedValue('validate');
      mockPrompts.text.mockResolvedValue('1.2.3');
      mockParseVersion.mockReturnValue({ raw: '1.2.3', major: 1, minor: 2, patch: 3 });

      await program.parseAsync(['node', 'test', 'version']);

      expect(mockLogger.outro).toHaveBeenCalledWith('Version management completed');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      versionCommand(program, context);
    });

    it('should handle top-level command errors', async () => {
      mockIsGitRepository.mockRejectedValue(new Error('Git check failed'));

      await program.parseAsync(['node', 'test', 'version', '--list-tags']);

      expect(mockLogger.error).toHaveBeenCalledWith('Command failed: Git check failed');
    });

    it('should handle top-level command non-error thrown', async () => {
      mockIsGitRepository.mockRejectedValue('String error');

      await program.parseAsync(['node', 'test', 'version', '--list-tags']);

      expect(mockLogger.error).toHaveBeenCalledWith('Command failed: String error');
    });
  });
});