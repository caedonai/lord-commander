import { describe, it, expect } from 'vitest';
import prompts, * as promptsModule from '../../utils/prompts.js';

describe('Prompts Utils', () => {
  describe('Named Export', () => {
    it('should export prompts object with all expected functions', () => {
      expect(promptsModule.prompts).toBeTypeOf('object');
      expect(promptsModule.prompts).toBeDefined();
    });

    it('should include intro function', () => {
      expect(promptsModule.prompts.intro).toBeTypeOf('function');
    });

    it('should include outro function', () => {
      expect(promptsModule.prompts.outro).toBeTypeOf('function');
    });

    it('should include text function', () => {
      expect(promptsModule.prompts.text).toBeTypeOf('function');
    });

    it('should include confirm function', () => {
      expect(promptsModule.prompts.confirm).toBeTypeOf('function');
    });

    it('should include select function', () => {
      expect(promptsModule.prompts.select).toBeTypeOf('function');
    });

    it('should include multiselect function', () => {
      expect(promptsModule.prompts.multiselect).toBeTypeOf('function');
    });

    it('should include spinner function', () => {
      expect(promptsModule.prompts.spinner).toBeTypeOf('function');
    });

    it('should include note function', () => {
      expect(promptsModule.prompts.note).toBeTypeOf('function');
    });
  });

  describe('Default Export', () => {
    it('should export prompts as default export', () => {
      expect(prompts).toBeTypeOf('object');
      expect(prompts).toBeDefined();
    });

    it('should have default export match named export', () => {
      expect(prompts).toBe(promptsModule.prompts);
    });

    it('should include all expected functions in default export', () => {
      const expectedFunctions: (keyof typeof prompts)[] = [
        'intro', 'outro', 'text', 'confirm', 
        'select', 'multiselect', 'spinner', 'note'
      ];

      expectedFunctions.forEach(funcName => {
        expect(prompts).toHaveProperty(funcName);
        expect(prompts[funcName]).toBeTypeOf('function');
      });
    });
  });

  describe('Module Structure', () => {
    it('should export exactly the expected number of functions', () => {
      const expectedCount = 8;
      const actualCount = Object.keys(prompts).length;
      expect(actualCount).toBe(expectedCount);
    });

    it('should have consistent function exports', () => {
      // Verify that both named and default exports have same structure
      const namedKeys = Object.keys(promptsModule.prompts).sort();
      const defaultKeys = Object.keys(prompts).sort();
      expect(namedKeys).toEqual(defaultKeys);
    });
  });
});