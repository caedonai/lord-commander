import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @clack/prompts
const mockClackText = vi.fn();
const mockClackPassword = vi.fn();
const mockClackConfirm = vi.fn();
const mockClackSelect = vi.fn();
const mockClackMultiselect = vi.fn();
const mockClackGroup = vi.fn();
const mockClackSpinner = vi.fn();
const mockClackIntro = vi.fn();
const mockClackOutro = vi.fn();
const mockClackNote = vi.fn();
const mockClackCancel = vi.fn();
const mockClackIsCancel = vi.fn();
const mockClackLog = { message: vi.fn() };

vi.mock('@clack/prompts', () => ({
  text: mockClackText,
  password: mockClackPassword,
  confirm: mockClackConfirm,
  select: mockClackSelect,
  multiselect: mockClackMultiselect,
  group: mockClackGroup,
  spinner: mockClackSpinner,
  intro: mockClackIntro,
  outro: mockClackOutro,
  note: mockClackNote,
  cancel: mockClackCancel,
  isCancel: mockClackIsCancel,
  log: mockClackLog,
}));

// Mock picocolors
vi.mock('picocolors', () => ({
  default: {
    blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
    green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
    red: (text: string) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
    magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
    gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
    dim: (text: string) => `\x1b[2m${text}\x1b[22m`,
    bold: (text: string) => `\x1b[1m${text}\x1b[22m`,
    white: (text: string) => `\x1b[37m${text}\x1b[0m`,
  },
}));

// Mock figures
vi.mock('figures', () => ({
  default: {
    info: 'ℹ',
    tick: '✔',
    warning: '⚠',
    cross: '✖',
    questionMarkPrefix: '?',
    pointer: '❯',
    pointerSmall: '›',
    line: '│',
    lineUpDownLeft: '├',
    lineBold: '━',
  },
}));

// Mock console methods
const mockConsoleLog = vi.fn();

describe('UI Prompts Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = mockConsoleLog;
    if (process.stdout && 'columns' in process.stdout) {
      (process.stdout as NodeJS.WriteStream & { columns?: number }).columns = 80;
    }
  });

  describe('Basic Functionality Tests', () => {
    it('should import prompts module successfully', async () => {
      const prompts = await import('../../core/ui/prompts.js');
      expect(prompts).toBeDefined();
      expect(prompts.DEFAULT_THEME).toBeDefined();
      expect(prompts.text).toBeDefined();
      expect(prompts.confirm).toBeDefined();
      expect(prompts.select).toBeDefined();
    });

    it('should have default theme with required properties', async () => {
      const { DEFAULT_THEME } = await import('../../core/ui/prompts.js');

      expect(DEFAULT_THEME).toBeDefined();
      expect(DEFAULT_THEME.prefix).toBe('⚡');
      expect(DEFAULT_THEME.symbol).toHaveProperty('info');
      expect(DEFAULT_THEME.symbol).toHaveProperty('success');
      expect(DEFAULT_THEME.symbol).toHaveProperty('warning');
      expect(DEFAULT_THEME.symbol).toHaveProperty('error');
      expect(DEFAULT_THEME.style).toHaveProperty('info');
      expect(DEFAULT_THEME.style).toHaveProperty('success');
      expect(DEFAULT_THEME.style).toHaveProperty('warning');
      expect(DEFAULT_THEME.style).toHaveProperty('error');
    });

    it('should handle theme management', async () => {
      const { setTheme, getTheme } = await import('../../core/ui/prompts.js');

      const customTheme = { prefix: '🚀' };
      setTheme(customTheme);

      const currentTheme = getTheme();
      expect(currentTheme.prefix).toBe('🚀');
      // Should merge with defaults
      expect(currentTheme.style.success).toBeDefined();
    });

    it('should handle visual helper functions', async () => {
      const { printSeparator, printSpacing, printSection } = await import(
        '../../core/ui/prompts.js'
      );

      // Test separator without title
      printSeparator();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('─'));

      mockConsoleLog.mockClear();

      // Test separator with title
      printSeparator('Test Title');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Test Title'));

      mockConsoleLog.mockClear();

      // Test spacing
      printSpacing(2);
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);

      mockConsoleLog.mockClear();

      // Test section
      printSection('Section Title');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle text prompts', async () => {
      const { text } = await import('../../core/ui/prompts.js');

      const mockResult = 'user input';
      mockClackText.mockResolvedValue(mockResult);
      mockClackIsCancel.mockReturnValue(false);

      const result = await text('Enter text:');
      expect(result).toBe(mockResult);
      expect(mockClackText).toHaveBeenCalledWith({
        message: expect.any(String),
        placeholder: undefined,
        initialValue: undefined,
        validate: undefined,
      });
    });

    it('should handle cancelled prompts', async () => {
      const { text } = await import('../../core/ui/prompts.js');

      const cancelSymbol = Symbol('cancel');
      mockClackText.mockResolvedValue(cancelSymbol);
      mockClackIsCancel.mockReturnValue(true);

      await expect(text('Enter text:')).rejects.toThrow('Operation cancelled by user');
    });

    it('should handle password prompts', async () => {
      const { password } = await import('../../core/ui/prompts.js');

      const mockResult = 'secret';
      mockClackPassword.mockResolvedValue(mockResult);
      mockClackIsCancel.mockReturnValue(false);

      const result = await password('Enter password:');
      expect(result).toBe(mockResult);
      expect(mockClackPassword).toHaveBeenCalledWith({
        message: expect.any(String),
        validate: undefined,
      });
    });

    it('should handle confirm prompts', async () => {
      const { confirm } = await import('../../core/ui/prompts.js');

      mockClackConfirm.mockResolvedValue(true);
      mockClackIsCancel.mockReturnValue(false);

      const result = await confirm('Continue?');
      expect(result).toBe(true);
      expect(mockClackConfirm).toHaveBeenCalledWith({
        message: expect.any(String),
        active: 'Yes',
        inactive: 'No',
        initialValue: undefined,
      });
    });

    it('should handle select prompts', async () => {
      const { select } = await import('../../core/ui/prompts.js');

      const mockResult = 'option1';
      mockClackSelect.mockResolvedValue(mockResult);
      mockClackIsCancel.mockReturnValue(false);

      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      const result = await select('Choose option:', options);
      expect(result).toBe(mockResult);
      expect(mockClackSelect).toHaveBeenCalled();
    });

    it('should handle multiselect prompts', async () => {
      const { multiselect } = await import('../../core/ui/prompts.js');

      const mockResult = ['option1', 'option2'];
      mockClackMultiselect.mockResolvedValue(mockResult);
      mockClackIsCancel.mockReturnValue(false);

      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      const result = await multiselect('Choose options:', options);
      expect(result).toEqual(mockResult);
      expect(mockClackMultiselect).toHaveBeenCalled();
    });

    it('should handle utility functions', async () => {
      const { intro, outro, note, log, spinner } = await import('../../core/ui/prompts.js');

      // Test intro
      intro('Welcome');
      expect(mockClackIntro).toHaveBeenCalled();

      // Test outro
      outro('Complete');
      expect(mockClackOutro).toHaveBeenCalled();

      // Test note
      note('Important note', 'Note');
      expect(mockClackNote).toHaveBeenCalled();

      // Test log
      log('Info message', 'info');
      expect(mockClackLog.message).toHaveBeenCalled();

      // Test spinner
      const mockSpinnerInstance = {
        start: vi.fn(),
        stop: vi.fn(),
        message: vi.fn(),
      };
      mockClackSpinner.mockReturnValue(mockSpinnerInstance);

      const s = spinner();
      s.start('Loading...');
      s.stop('Complete!', 0);

      expect(mockSpinnerInstance.start).toHaveBeenCalled();
      expect(mockSpinnerInstance.stop).toHaveBeenCalled();
    });

    it('should handle enhanced prompts with options', async () => {
      const { enhancedText, enhancedConfirm } = await import('../../core/ui/prompts.js');

      mockClackText.mockResolvedValue('enhanced text');
      mockClackIsCancel.mockReturnValue(false);

      const result = await enhancedText('Enter text:', {
        section: 'Configuration',
        spacing: true,
      });

      expect(result).toBe('enhanced text');
      expect(mockConsoleLog).toHaveBeenCalled();

      mockConsoleLog.mockClear();
      mockClackConfirm.mockResolvedValue(true);

      const confirmResult = await enhancedConfirm('Continue?', {
        showProgress: { current: 1, total: 3 },
      });

      expect(confirmResult).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('[1/3]'));
    });

    it('should handle PromptFlow class', async () => {
      const { PromptFlow } = await import('../../core/ui/prompts.js');

      const flow = new PromptFlow('Setup Wizard', 3);

      flow.start();
      expect(mockConsoleLog).toHaveBeenCalled();

      mockClackText.mockResolvedValue('test input');
      mockClackIsCancel.mockReturnValue(false);

      const result = await flow.text('Enter name:');
      expect(result).toBe('test input');

      flow.nextStep();
      flow.end();
    });

    it('should validate project names correctly', async () => {
      const { patterns } = await import('../../core/ui/prompts.js');

      const { validate } = patterns.projectName;

      expect(validate('')).toBe('Project name is required');
      expect(validate('   ')).toBe('Project name is required');
      expect(validate('invalid-name!')).toBe(
        'Project name can only contain letters, numbers, hyphens, and underscores'
      );
      expect(validate('a'.repeat(51))).toBe('Project name must be 50 characters or less');
      expect(validate('valid-project-name')).toBeUndefined();
      expect(validate('validProjectName123')).toBeUndefined();
    });

    it('should handle required field validation', async () => {
      const { text, password } = await import('../../core/ui/prompts.js');

      // Empty text with required flag
      mockClackText.mockResolvedValue('');
      mockClackIsCancel.mockReturnValue(false);

      await expect(text('Enter text:', { required: true })).rejects.toThrow(
        'This field is required'
      );

      // Empty password with required flag
      mockClackPassword.mockResolvedValue('');

      await expect(password('Enter password:', { required: true })).rejects.toThrow(
        'Password is required'
      );
    });

    it('should handle edge cases gracefully', async () => {
      const { printSeparator } = await import('../../core/ui/prompts.js');

      // Very long title
      const longTitle = 'A'.repeat(100);
      printSeparator(longTitle);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('...'));

      // Narrow terminal
      if (process.stdout && 'columns' in process.stdout) {
        (process.stdout as NodeJS.WriteStream & { columns?: number }).columns = 20;
      }
      printSeparator('Test');
      expect(mockConsoleLog).toHaveBeenCalled();

      // Missing terminal columns
      if (process.stdout && 'columns' in process.stdout) {
        Reflect.deleteProperty(process.stdout, 'columns');
      }
      printSeparator('Test');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle pre-built flows', async () => {
      const { flows } = await import('../../core/ui/prompts.js');

      mockClackGroup.mockResolvedValue({
        name: 'test-project',
        packageManager: 'pnpm',
        framework: 'next',
        typescript: true,
        initGit: true,
      });
      mockClackIsCancel.mockReturnValue(false);

      const result = await flows.projectInit();

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('packageManager');
      expect(mockClackIntro).toHaveBeenCalled();
      expect(mockClackOutro).toHaveBeenCalled();
    });
  });
});
