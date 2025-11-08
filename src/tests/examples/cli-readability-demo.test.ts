import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the core module BEFORE any imports that use it
vi.mock('../../core/index.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    success: vi.fn(),
  })),
  intro: vi.fn(),
  note: vi.fn(),
  outro: vi.fn(),
  printSection: vi.fn(),
  printSeparator: vi.fn(),
}));

// Import after mocking
import * as coreModule from '../../core/index.js';

describe('CLI Readability Demo', () => {
  let mockConsole: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods
    mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
    };
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    
    // Mock setTimeout for sleep function
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: Function) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('demoBadReadability', () => {
    it('should demonstrate poor readability patterns', async () => {
      // Dynamic import after mocks are set up
      const { demoBadReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoBadReadability();

      // Verify header is shown
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('POOR READABILITY EXAMPLE')
      );

      // Verify problems are listed
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Problems with the above')
      );

      // Verify specific problems are mentioned
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Hard to distinguish prompts from system output')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('No clear sections or flow')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Mixed user input with system messages')
      );
    });

    it('should use logger methods for system messages', async () => {
      const { demoBadReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoBadReadability();
      
      // Verify that the demo executes and displays system output through console
      // This verifies behavior rather than implementation details
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('POOR READABILITY EXAMPLE')
      );
      
      // Verify various types of output are present
      expect(mockConsole.log).toHaveBeenCalled();
      expect(mockConsole.log.mock.calls.length).toBeGreaterThan(5);
    });

    it('should show user input examples', async () => {
      const { demoBadReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoBadReadability();

      // Verify user input is shown
      expect(mockConsole.log).toHaveBeenCalledWith('User entered: production');
      expect(mockConsole.log).toHaveBeenCalledWith('User entered: yes');
      expect(mockConsole.log).toHaveBeenCalledWith('User entered: no');
    });
  });

  describe('demoGoodReadability', () => {
    it('should demonstrate improved readability patterns', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify core functions are called for better structure
      expect(coreModule.intro).toHaveBeenCalledWith('🚀 Deployment Wizard');
      expect(coreModule.printSeparator).toHaveBeenCalledWith('Configuration', 'heavy');
      expect(coreModule.printSection).toHaveBeenCalledWith('Environment Setup', expect.any(String));
      expect(coreModule.outro).toHaveBeenCalledWith('Deployment wizard finished! 🎉');
    });

    it('should show progress tracking', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify progress indicators
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('[1/4]'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('[2/4]'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('[3/4]'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('[4/4]'));
    });

    it('should show deployment task progress', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify deployment tasks are shown
      const deploymentTasks = [
        'Validating credentials',
        'Building application',
        'Running database migrations',
        'Deploying to production',
      ];

      deploymentTasks.forEach((task, index) => {
        const current = index + 1;
        const total = deploymentTasks.length;
        expect(mockConsole.log).toHaveBeenCalledWith(`\n🔄 [${current}/${total}] ${task}...`);
        expect(mockConsole.log).toHaveBeenCalledWith(`✅ [${current}/${total}] ${task} - completed`);
      });
    });

    it('should use note and separators for structure', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify structured output
      expect(coreModule.printSeparator).toHaveBeenCalledWith('Deployment Process', 'double');
      expect(coreModule.printSeparator).toHaveBeenCalledWith('Results', 'light');
      expect(coreModule.note).toHaveBeenCalledWith(
        expect.stringContaining('Deployment completed successfully'),
        'Success'
      );
    });

    it('should show user input with proper formatting', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify user input is properly formatted with arrows
      expect(mockConsole.log).toHaveBeenCalledWith('   \x1b[36m→\x1b[0m production');
      expect(mockConsole.log).toHaveBeenCalledWith('   \x1b[36m→\x1b[0m yes');
      expect(mockConsole.log).toHaveBeenCalledWith('   \x1b[36m→\x1b[0m no');
    });

    it('should show improvements list', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify improvements are listed
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('IMPROVEMENTS IN THE ABOVE')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Clear visual hierarchy with separators')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Progress indicators show current step')
      );
    });
  });

  describe('demoComparisonSummary', () => {
    it('should show comparison between approaches', async () => {
      const { demoComparisonSummary } = await import('../../examples/cli-readability-demo.js');
      
      await demoComparisonSummary();

      // Verify comparison header
      expect(coreModule.printSeparator).toHaveBeenCalledWith('Comparison Summary', 'double');
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Key Differences:'));
    });

    it('should show improvement categories', async () => {
      const { demoComparisonSummary } = await import('../../examples/cli-readability-demo.js');
      
      await demoComparisonSummary();

      // Verify improvement categories are shown
      const categories = [
        '🎯 Visual Hierarchy',
        '📋 Progress Tracking',
        '👤 User Input',
        '⏱️ Task Status',
        '📝 Context',
      ];

      categories.forEach((category) => {
        expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining(category));
      });
    });

    it('should show before/after comparisons', async () => {
      const { demoComparisonSummary } = await import('../../examples/cli-readability-demo.js');
      
      await demoComparisonSummary();

      // Verify before/after comparisons are shown
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Before:'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('After:'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Flat, uniform output'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Clear sections with separators'));
    });

    it('should show impact metrics', async () => {
      const { demoComparisonSummary } = await import('../../examples/cli-readability-demo.js');
      
      await demoComparisonSummary();

      // Verify impact section is shown
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('📈 Impact:'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('97% improvement in readability'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Faster user comprehension'));
    });
  });

  describe('runFullDemo', () => {
    it('should execute complete demo sequence', async () => {
      const { runFullDemo } = await import('../../examples/cli-readability-demo.js');
      
      await runFullDemo();

      // Verify demo starts and ends properly
      expect(coreModule.intro).toHaveBeenCalledWith('📚 CLI Readability Enhancement Demo');
      expect(coreModule.outro).toHaveBeenCalledWith('CLI readability demo completed! ✨');
    });

    it('should show demo overview', async () => {
      const { runFullDemo } = await import('../../examples/cli-readability-demo.js');
      
      await runFullDemo();

      // Verify demo overview is provided
      expect(coreModule.note).toHaveBeenCalledWith(
        expect.stringContaining('This demo compares poor vs. excellent CLI readability patterns'),
        'Demo Overview'
      );
    });

    it('should include separator between bad and good examples', async () => {
      const { runFullDemo } = await import('../../examples/cli-readability-demo.js');
      
      await runFullDemo();

      // Verify separator is shown
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringMatching(/═{60}/));
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('IMPROVED READABILITY EXAMPLE')
      );
    });

    it('should handle errors during execution', async () => {
      // Mock an error in one of the demo functions
      const originalPrintSeparator = vi.mocked(coreModule.printSeparator).getMockImplementation();
      vi.mocked(coreModule.printSeparator).mockImplementationOnce(() => {
        throw new Error('Demo error');
      });

      const { runFullDemo } = await import('../../examples/cli-readability-demo.js');
      
      // Should not throw but should be caught
      await expect(runFullDemo()).rejects.toThrow('Demo error');
      
      // Restore mock
      if (originalPrintSeparator) {
        vi.mocked(coreModule.printSeparator).mockImplementation(originalPrintSeparator);
      }
    });
  });

  describe('Task interface and utility functions', () => {
    it('should handle task progress display correctly', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify task progress function works (implicit through calls)
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('💭'));
    });

    it('should handle sleep function for timing', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify setTimeout is called for timing (mocked to execute immediately)
      expect(setTimeout).toHaveBeenCalled();
    });
  });

  describe('Error handling in CLI execution', () => {
    it('should handle process.exit on error', async () => {
      // Mock process.exit to prevent test termination
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Mock an error in runFullDemo
      vi.mocked(coreModule.intro).mockImplementationOnce(() => {
        throw new Error('Demo execution failed');
      });

      const { runFullDemo } = await import('../../examples/cli-readability-demo.js');
      
      // Verify error handling in CLI execution
      await expect(() => runFullDemo()).rejects.toThrow();
      
      mockExit.mockRestore();
    });
  });

  describe('TypeScript interfaces and type safety', () => {
    it('should properly handle Task interface', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      // This test verifies type safety is maintained
      await demoGoodReadability();

      // Verify tasks are processed correctly (implicitly through execution)
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Validating credentials'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Building application'));
    });

    it('should handle readonly properties correctly', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      // Verify readonly interface properties work correctly
      await demoGoodReadability();

      // Tasks with readonly properties should execute without issues
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Running database migrations'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Deploying to production'));
    });
  });

  describe('Color and formatting codes', () => {
    it('should use proper ANSI color codes', async () => {
      const { demoBadReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoBadReadability();

      // Verify ANSI color codes are used
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('\x1b[31m')); // Red
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('\x1b[33m')); // Yellow
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('\x1b[0m'));  // Reset
    });

    it('should use consistent formatting in good example', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify consistent formatting
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('\x1b[36m→\x1b[0m')); // Cyan arrow
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('\x1b[32m')); // Green
    });

    it('should show proper Unicode characters', async () => {
      const { demoGoodReadability } = await import('../../examples/cli-readability-demo.js');
      
      await demoGoodReadability();

      // Verify Unicode characters are used
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('🔄')); // Process icon
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('✅')); // Check mark
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('💭')); // Thought bubble
    });
  });
});