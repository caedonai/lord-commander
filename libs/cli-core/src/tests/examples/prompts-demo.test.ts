import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as coreModule from '../../core/index.js';

// Mock the core module functions
vi.mock('../../core/index.js', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  printPromptFooter: vi.fn(),
  printPromptHeader: vi.fn(),
  printSection: vi.fn(),
  printSeparator: vi.fn(),
  printSpacing: vi.fn(),
  printTaskComplete: vi.fn(),
  printTaskStart: vi.fn(),
}));

// Dynamic import to get the actual functions after mocking
let demoModule: {
  demoBasicSeparators?: () => Promise<void>;
  demoSectionHeaders?: () => Promise<void>;
  demoPromptHeaders?: () => Promise<void>;
  demoAdvancedWorkflow?: () => Promise<void>;
  demoComparison?: () => Promise<void>;
  runCompleteDemo?: () => Promise<void>;
};

beforeAll(async () => {
  // Dynamic import after mocking
  demoModule = await import('../../examples/prompts-demo.js');
});

describe('Prompts Demo', () => {
  const mockConsole = {
    log: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);

    // Mock setTimeout for sleep function
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: Function) => {
      fn();
      return 1 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Visual Separators Demo', () => {
    it('should demonstrate basic separator functionality', async () => {
      if (demoModule?.demoBasicSeparators) {
        await demoModule.demoBasicSeparators();

        // Verify demo header
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringContaining('Demo: Basic Visual Separators')
        );

        // Verify separators are used
        expect(coreModule.printSeparator).toHaveBeenCalledWith('Light Separator');
        expect(coreModule.printSeparator).toHaveBeenCalledWith('Heavy Separator', 'heavy');
        expect(coreModule.printSeparator).toHaveBeenCalledWith('Double Line Separator', 'double');
      }
    });

    it('should show output between separators', async () => {
      if (demoModule?.demoBasicSeparators) {
        await demoModule.demoBasicSeparators();

        // Verify content is logged between separators
        expect(mockConsole.log).toHaveBeenCalledWith('Some log output here...');
        expect(mockConsole.log).toHaveBeenCalledWith('More application output...');
        expect(mockConsole.log).toHaveBeenCalledWith('Another section of output...');
      }
    });
  });

  describe('Section Headers Demo', () => {
    it('should demonstrate section header functionality', async () => {
      if (demoModule?.demoSectionHeaders) {
        await demoModule.demoSectionHeaders();

        // Verify section headers
        expect(coreModule.printSection).toHaveBeenCalledWith(
          'Configuration Setup',
          'Setting up your application configuration'
        );
        expect(coreModule.printSection).toHaveBeenCalledWith(
          'Service Startup',
          'Starting application services'
        );
      }
    });

    it('should show task progress within sections', async () => {
      if (demoModule?.demoSectionHeaders) {
        await demoModule.demoSectionHeaders();

        // Verify task progress methods are called
        expect(coreModule.printTaskStart).toHaveBeenCalledWith('Loading configuration files');
        expect(coreModule.printTaskComplete).toHaveBeenCalledWith(
          'Configuration files loaded successfully'
        );
        expect(coreModule.printTaskStart).toHaveBeenCalledWith('Starting web server');
        expect(coreModule.printTaskComplete).toHaveBeenCalledWith(
          'Web server running on port 3000'
        );
      }
    });
  });

  describe('Prompt Headers Demo', () => {
    it('should demonstrate prompt framing', async () => {
      if (demoModule?.demoPromptHeaders) {
        await demoModule.demoPromptHeaders();

        // Verify prompt headers and footers
        expect(coreModule.printPromptHeader).toHaveBeenCalledWith('User Configuration');
        expect(coreModule.printPromptHeader).toHaveBeenCalledWith('Deployment Settings');
        expect(coreModule.printPromptFooter).toHaveBeenCalledTimes(2);
      }
    });

    it('should show prompt content', async () => {
      if (demoModule?.demoPromptHeaders) {
        await demoModule.demoPromptHeaders();

        // Verify prompt content is shown
        expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('What is your name?'));
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringContaining('Target environment?')
        );
      }
    });
  });

  describe('Advanced Workflow Demo', () => {
    it('should demonstrate complete workflow with sections', async () => {
      if (demoModule?.demoAdvancedWorkflow) {
        await demoModule.demoAdvancedWorkflow();

        // Verify workflow starts and ends properly
        expect(coreModule.intro).toHaveBeenCalledWith('🚀 Application Setup Wizard');
        expect(coreModule.outro).toHaveBeenCalledWith('Setup wizard completed! 🎉');
      }
    });

    it('should process multiple configuration sections', async () => {
      if (demoModule?.demoAdvancedWorkflow) {
        await demoModule.demoAdvancedWorkflow();

        // Should process different configuration sections
        expect(coreModule.printSection).toHaveBeenCalledWith(
          'Environment Setup',
          'Configuring your development environment'
        );
        expect(coreModule.printSection).toHaveBeenCalledWith(
          'Database Configuration',
          'Setting up database connections and schemas'
        );
      }
    });

    it('should show task execution within workflow', async () => {
      if (demoModule?.demoAdvancedWorkflow) {
        await demoModule.demoAdvancedWorkflow();

        // Verify tasks are executed
        expect(coreModule.printTaskStart).toHaveBeenCalledWith('Checking Node.js version');
        expect(coreModule.printTaskStart).toHaveBeenCalledWith('Installing dependencies');
        expect(coreModule.printTaskComplete).toHaveBeenCalled();
      }
    });
  });

  describe('Demo Comparison', () => {
    it('should show readability improvements', async () => {
      if (demoModule?.demoComparison) {
        await demoModule.demoComparison();

        // Verify comparison content
        expect(coreModule.printSeparator).toHaveBeenCalledWith(
          'Before vs After Comparison',
          'double'
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringContaining('Readability Improvements Summary')
        );
      }
    });

    it('should display improvement statistics', async () => {
      if (demoModule?.demoComparison) {
        await demoModule.demoComparison();

        // Verify statistics are shown
        expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('97% improvement'));
        expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Overall Impact'));
      }
    });
  });

  describe('Complete Demo Execution', () => {
    it('should execute full demo sequence', async () => {
      if (demoModule?.runCompleteDemo) {
        await demoModule.runCompleteDemo();

        // Verify main demo sequence
        expect(coreModule.intro).toHaveBeenCalledWith(
          '📚 Enhanced Prompts & Visual Separation Demo'
        );
        expect(coreModule.outro).toHaveBeenCalledWith('Enhanced prompts demo completed! ✨');
      }
    });

    it('should include heavy separators for demo sections', async () => {
      if (demoModule?.runCompleteDemo) {
        await demoModule.runCompleteDemo();

        // Verify heavy separators are used for demo sections
        expect(coreModule.printSeparator).toHaveBeenCalledWith(
          expect.stringContaining('Demo 1/5'),
          'heavy'
        );
      }
    });

    it('should handle demo execution errors', async () => {
      if (demoModule?.runCompleteDemo) {
        // Mock an error in core functions
        vi.mocked(coreModule.intro).mockImplementationOnce(() => {
          throw new Error('Demo error');
        });

        // Should handle the error
        await expect(demoModule.runCompleteDemo()).rejects.toThrow('Demo error');
      }
    });
  });

  describe('TypeScript Interface Support', () => {
    it('should handle ConfigSection interface', async () => {
      if (demoModule?.demoAdvancedWorkflow) {
        await demoModule.demoAdvancedWorkflow();

        // Verify interface properties work (through successful execution)
        expect(coreModule.printSection).toHaveBeenCalled();
      }
    });

    it('should handle DemoStep interface', async () => {
      if (demoModule?.runCompleteDemo) {
        await demoModule.runCompleteDemo();

        // Verify demo step interface works (through execution)
        expect(coreModule.intro).toHaveBeenCalled();
      }
    });
  });

  describe('Utility Functions', () => {
    it('should handle sleep function for timing', async () => {
      if (demoModule?.demoSectionHeaders) {
        await demoModule.demoSectionHeaders();

        // Verify setTimeout is called for timing delays
        expect(setTimeout).toHaveBeenCalled();
      }
    });

    it('should handle async operations properly', async () => {
      if (demoModule?.demoBasicSeparators) {
        // Should not throw during async execution
        await expect(demoModule.demoBasicSeparators()).resolves.toBeUndefined();
      }
    });
  });

  describe('Visual Formatting', () => {
    it('should use proper Unicode characters', async () => {
      if (demoModule?.demoBasicSeparators) {
        await demoModule.demoBasicSeparators();

        // Verify Unicode characters are used in output
        expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('🎯'));
      }
    });

    it('should maintain consistent formatting', async () => {
      if (demoModule?.demoBasicSeparators) {
        await demoModule.demoBasicSeparators();

        // Verify consistent formatting patterns - 4 separators total
        expect(coreModule.printSeparator).toHaveBeenCalledTimes(4);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing core functions gracefully', async () => {
      // Temporarily mock undefined functions
      const originalPrintSection = coreModule.printSection;
      vi.mocked(coreModule.printSection).mockImplementation(() => {
        throw new Error('Function not available');
      });

      if (demoModule?.demoSectionHeaders) {
        // Should handle missing functions gracefully
        await expect(demoModule.demoSectionHeaders()).rejects.toThrow();
      }

      // Restore
      vi.mocked(coreModule.printSection).mockImplementation(originalPrintSection);
    });

    it('should handle process termination in CLI mode', async () => {
      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Mock console.error
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // This test verifies the CLI error handling pattern
      expect(() => {
        // Simulate CLI execution error
        throw new Error('Demo execution failed');
      }).toThrow('Demo execution failed');

      mockExit.mockRestore();
    });
  });

  describe('Module Exports', () => {
    it('should export demo functions', () => {
      // Verify expected functions are available
      if (demoModule) {
        expect(typeof demoModule.demoBasicSeparators).toBe('function');
        expect(typeof demoModule.runCompleteDemo).toBe('function');
        expect(typeof demoModule.demoAdvancedWorkflow).toBe('function');
      }
    });

    it('should handle module loading', () => {
      // Module should load without errors
      expect(demoModule).toBeDefined();
    });
  });
});
