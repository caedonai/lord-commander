import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      // Recommended TypeScript rules (minimal set)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Allow console statements (common in CLI tools)
      'no-console': 'off',
      
      // Basic code quality
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
  {
    ignores: [
      'dist/',
      'coverage/',
      'node_modules/',
      '**/*.js',
      '**/*.mjs',
      '**/*.d.ts'
    ]
  }
];