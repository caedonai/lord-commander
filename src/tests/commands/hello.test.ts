import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import helloCommand from '../../commands/hello.js';
import type { CommandContext } from '../../types/cli.js';

describe('Hello Command', () => {
  let program: Command;
  let mockLogger: Record<string, ReturnType<typeof vi.fn>>;
  let mockExeca: Record<string, ReturnType<typeof vi.fn>>;
  let mockFs: Record<string, ReturnType<typeof vi.fn>>;
  let mockPrompts: Record<string, ReturnType<typeof vi.fn>>;
  let context: CommandContext;

  beforeEach(() => {
    // Create mock logger with all required methods
    mockLogger = {
      intro: vi.fn(),
      outro: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      enableVerbose: vi.fn(),
    };

    // Create mock execa
    mockExeca = {
      execa: vi.fn(),
    };

    // Create mock fs
    mockFs = {
      exists: vi.fn(),
      readFile: vi.fn(),
    };

    // Create mock prompts
    mockPrompts = {
      intro: vi.fn(),
      outro: vi.fn(),
      text: vi.fn().mockResolvedValue('test-input'),
      confirm: vi.fn().mockResolvedValue(true),
      select: vi.fn().mockResolvedValue('option1'),
      multiselect: vi.fn().mockResolvedValue(['option1']),
      spinner: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn(), message: vi.fn() }),
      note: vi.fn(),
    };

    // Create context with all required properties
    context = {
      logger: mockLogger,
      execa: mockExeca,
      fs: mockFs,
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
    it('should register hello command with correct name and description', () => {
      helloCommand(program, context);

      const commands = program.commands;
      const helloCmd = commands.find((cmd) => cmd.name() === 'hello');

      expect(helloCmd).toBeDefined();
      expect(helloCmd?.description()).toBe('Say hello and show system information');
    });

    it('should register command with optional name argument', () => {
      helloCommand(program, context);

      const helloCmd = program.commands.find((cmd) => cmd.name() === 'hello');
      const args = helloCmd?.registeredArguments;

      expect(args).toBeDefined();
      expect(args?.[0]?.name()).toBe('name');
      expect(args?.[0]?.description).toBe('Name of the person to greet');
      expect(args?.[0]?.required).toBe(false);
    });

    it('should register all command options', () => {
      helloCommand(program, context);

      const helloCmd = program.commands.find((cmd) => cmd.name() === 'hello');
      const options = helloCmd?.options;

      expect(options?.some((opt) => opt.long === '--uppercase')).toBe(true);
      expect(options?.some((opt) => opt.short === '-u')).toBe(true);
      expect(options?.some((opt) => opt.long === '--verbose')).toBe(true);
      expect(options?.some((opt) => opt.long === '--info')).toBe(true);
      expect(options?.some((opt) => opt.short === '-i')).toBe(true);
    });
  });

  describe('Basic Greeting', () => {
    beforeEach(() => {
      helloCommand(program, context);
    });

    it('should greet with default name "World"', async () => {
      await program.parseAsync(['node', 'test', 'hello']);

      expect(mockLogger.intro).toHaveBeenCalledWith('Hello Command');
      expect(mockLogger.info).toHaveBeenCalledWith('Greeting World...');
      expect(mockLogger.success).toHaveBeenCalledWith('Hello, World!');
      expect(mockLogger.outro).toHaveBeenCalledWith('Command completed!');
    });

    it('should greet with custom name', async () => {
      await program.parseAsync(['node', 'test', 'hello', 'Alice']);

      expect(mockLogger.info).toHaveBeenCalledWith('Greeting Alice...');
      expect(mockLogger.success).toHaveBeenCalledWith('Hello, Alice!');
    });

    it('should convert greeting to uppercase when --uppercase flag is used', async () => {
      await program.parseAsync(['node', 'test', 'hello', 'Bob', '--uppercase']);

      expect(mockLogger.success).toHaveBeenCalledWith('HELLO, BOB!');
      expect(mockLogger.debug).toHaveBeenCalledWith('Message converted to uppercase');
    });

    it('should convert greeting to uppercase when -u flag is used', async () => {
      await program.parseAsync(['node', 'test', 'hello', 'Charlie', '-u']);

      expect(mockLogger.success).toHaveBeenCalledWith('HELLO, CHARLIE!');
      expect(mockLogger.debug).toHaveBeenCalledWith('Message converted to uppercase');
    });

    it('should handle uppercase with default name', async () => {
      await program.parseAsync(['node', 'test', 'hello', '--uppercase']);

      expect(mockLogger.success).toHaveBeenCalledWith('HELLO, WORLD!');
    });
  });

  describe('Verbose Logging', () => {
    beforeEach(() => {
      helloCommand(program, context);
    });

    it('should enable verbose logging when --verbose flag is used', async () => {
      await program.parseAsync(['node', 'test', 'hello', '--verbose']);

      expect(mockLogger.enableVerbose).toHaveBeenCalled();
    });

    it('should not enable verbose logging by default', async () => {
      await program.parseAsync(['node', 'test', 'hello']);

      expect(mockLogger.enableVerbose).not.toHaveBeenCalled();
    });

    it('should enable verbose logging with uppercase option', async () => {
      await program.parseAsync(['node', 'test', 'hello', 'Dave', '--verbose', '--uppercase']);

      expect(mockLogger.enableVerbose).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('HELLO, DAVE!');
      expect(mockLogger.debug).toHaveBeenCalledWith('Message converted to uppercase');
    });
  });

  describe('System Information', () => {
    beforeEach(() => {
      helloCommand(program, context);
    });

    it('should skip system info when --info is not provided', async () => {
      await program.parseAsync(['node', 'test', 'hello']);

      expect(mockExeca.execa).not.toHaveBeenCalled();
      expect(mockFs.exists).not.toHaveBeenCalled();
    });

    it('should skip system info when execa is not available', async () => {
      const contextWithoutExeca = {
        logger: mockLogger,
        execa: undefined,
        fs: mockFs,
        prompts: mockPrompts,
      } as unknown as CommandContext;

      program = new Command();
      program.exitOverride();
      helloCommand(program, contextWithoutExeca);

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockFs.exists).not.toHaveBeenCalled();
    });

    it('should skip system info when fs is not available', async () => {
      const contextWithoutFs = {
        logger: mockLogger,
        execa: mockExeca,
        fs: undefined,
        prompts: mockPrompts,
      } as unknown as CommandContext;

      program = new Command();
      program.exitOverride();
      helloCommand(program, contextWithoutFs);

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockExeca.execa).not.toHaveBeenCalled();
    });

    it('should gather comprehensive system information when --info flag is used', async () => {
      // Mock Node.js version
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      // Mock npm version
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      
      // Mock package.json existence and content
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'typescript': '^5.0.0',
        },
        scripts: {
          'build': 'tsc',
          'test': 'vitest',
          'start': 'node dist/index.js',
        },
      }));

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.info).toHaveBeenCalledWith('Gathering system information...');
      
      // Node.js version check
      expect(mockExeca.execa).toHaveBeenCalledWith('node', ['--version']);
      expect(mockLogger.info).toHaveBeenCalledWith('Node.js version: v18.17.0');
      
      // npm version check
      expect(mockExeca.execa).toHaveBeenCalledWith('npm', ['--version']);
      expect(mockLogger.info).toHaveBeenCalledWith('npm version: 9.6.7');
      
      // Current working directory
      expect(mockLogger.info).toHaveBeenCalledWith(`Current directory: ${process.cwd()}`);
      
      // Package.json checks
      expect(mockFs.exists).toHaveBeenCalledWith('package.json');
      expect(mockLogger.info).toHaveBeenCalledWith('Has package.json: ✅');
      expect(mockFs.readFile).toHaveBeenCalledWith('package.json');
      expect(mockLogger.info).toHaveBeenCalledWith('Project: my-project');
      expect(mockLogger.info).toHaveBeenCalledWith('Version: 1.0.0');
      expect(mockLogger.info).toHaveBeenCalledWith('Dependencies: 2');
      expect(mockLogger.info).toHaveBeenCalledWith('Available scripts: build, test, start');
      
      // Environment info
      expect(mockLogger.info).toHaveBeenCalledWith(`Platform: ${process.platform}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`Architecture: ${process.arch}`);
    });

    it('should handle package.json without name', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
      }));

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.info).toHaveBeenCalledWith('Project: unnamed');
    });

    it('should handle package.json without version', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'my-project',
      }));

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.info).toHaveBeenCalledWith('Version: unknown');
    });

    it('should handle package.json without dependencies', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
      }));

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Dependencies:'));
    });

    it('should handle package.json without scripts', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
      }));

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Available scripts:'));
    });

    it('should handle missing package.json', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      
      mockFs.exists.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.info).toHaveBeenCalledWith('Has package.json: ❌');
      expect(mockFs.readFile).not.toHaveBeenCalled();
    });

    it('should use short -i flag for info', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      mockFs.exists.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'hello', '-i']);

      expect(mockLogger.info).toHaveBeenCalledWith('Gathering system information...');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      helloCommand(program, context);
    });

    it('should handle Node.js version check error', async () => {
      mockExeca.execa.mockRejectedValueOnce(new Error('Command not found'));
      mockFs.exists.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.error).toHaveBeenCalledWith('System info error: Command not found');
    });

    it('should handle npm version check error', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockRejectedValueOnce(new Error('npm not found'));
      mockFs.exists.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.error).toHaveBeenCalledWith('System info error: npm not found');
    });

    it('should handle JSON parsing error', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue('invalid json');

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('System info error:'));
    });

    it('should handle file read error', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockRejectedValue(new Error('File read error'));

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.error).toHaveBeenCalledWith('System info error: File read error');
    });

    it('should handle non-Error thrown during system info', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockRejectedValueOnce('String error');
      mockFs.exists.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'hello', '--info']);

      expect(mockLogger.error).toHaveBeenCalledWith('System info error: String error');
    });
  });

  describe('Combined Options', () => {
    beforeEach(() => {
      helloCommand(program, context);
    });

    it('should handle verbose, uppercase, and info options together', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      mockFs.exists.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'hello', 'TestUser', '--verbose', '--uppercase', '--info']);

      expect(mockLogger.enableVerbose).toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalledWith('HELLO, TESTUSER!');
      expect(mockLogger.debug).toHaveBeenCalledWith('Message converted to uppercase');
      expect(mockLogger.info).toHaveBeenCalledWith('Gathering system information...');
    });

    it('should handle short flags combination', async () => {
      mockExeca.execa.mockResolvedValueOnce({ stdout: 'v18.17.0' });
      mockExeca.execa.mockResolvedValueOnce({ stdout: '9.6.7' });
      mockFs.exists.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'hello', 'ShortFlag', '-u', '-i']);

      expect(mockLogger.success).toHaveBeenCalledWith('HELLO, SHORTFLAG!');
      expect(mockLogger.info).toHaveBeenCalledWith('Gathering system information...');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      helloCommand(program, context);
    });

    it('should handle empty name argument', async () => {
      await program.parseAsync(['node', 'test', 'hello', '']);

      expect(mockLogger.info).toHaveBeenCalledWith('Greeting ...');
      expect(mockLogger.success).toHaveBeenCalledWith('Hello, !');
    });

    it('should handle name with special characters', async () => {
      await program.parseAsync(['node', 'test', 'hello', 'José-María']);

      expect(mockLogger.success).toHaveBeenCalledWith('Hello, José-María!');
    });

    it('should handle very long name', async () => {
      const longName = 'A'.repeat(100);
      await program.parseAsync(['node', 'test', 'hello', longName]);

      expect(mockLogger.success).toHaveBeenCalledWith(`Hello, ${longName}!`);
    });
  });
});