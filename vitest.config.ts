import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    env: {
      FORCE_UNICODE_DETECTION: 'true',
      FORCE_EMOJI_DETECTION: 'false',
    },
    testTimeout: 30000, // 30 seconds for most tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 10000, // 10 seconds for cleanup
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        '**/*\x00*', // Exclude files with null bytes
      ],
      reportsDirectory: './coverage',
      clean: true,
    },
  },
  esbuild: {
    target: 'node18',
  },
});
