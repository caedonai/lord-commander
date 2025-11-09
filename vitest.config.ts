import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['libs/**/*.{test,spec}.{js,ts}', 'apps/**/*.{test,spec}.{js,ts}'],
    exclude: [
      'node_modules',
      'dist',
      // Exclude the original memory-intensive fs-advanced test in favor of lightweight version
      'libs/cli-core/src/tests/core/execution/fs-advanced.test.ts',
    ],
    env: {
      FORCE_UNICODE_DETECTION: 'true',
      FORCE_EMOJI_DETECTION: 'false',
    },
    testTimeout: 30000, // 30 seconds for most tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 10000, // 10 seconds for cleanup
    reporters: ['verbose'],
    // Optimize memory usage - single threaded approach
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1, // Single worker for maximum memory control
        minForks: 1,
        isolate: true, // Isolate each test file in its own process
        execArgv: [
          '--max-old-space-size=4096', // 4GB heap limit
          '--expose-gc', // Enable manual garbage collection
        ],
      },
    },
    // Additional memory optimizations
    maxConcurrency: 1, // Run tests completely sequentially
    isolate: true, // Use fresh environments to prevent memory leaks
    // Force garbage collection between test files
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    // Reduce memory pressure by running smaller test batches
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'], // Full reporting with increased memory limit
      exclude: [
        'node_modules/',
        'libs/**/tests/',
        'apps/**/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        '**/*\x00*', // Exclude files with null bytes
        // Exclude temporary test directories
        '**/createcli-run-test-*/**',
        '**/temp-register-commands-test-*/**',
        '**/edge-test-*/**',
        '**/vuln-fix-test-*/**',
        '**/framework-test-*/**',
        '**/unknown-deps-test-*/**',
        '**/updater-test-*/**',
        '**/workspace-test-*/**',
        // Exclude common temp directory patterns
        '**/tmp/**',
        '**/temp/**',
        '**/.tmp/**',
        '**/test-*/**',
        // Exclude specific temp directory patterns found in coverage
        'temp-*/**',
        'temp-*',
        '*/temp-*/**',
        '*/temp-*',
        // Exclude directories that start with "temp-"
        '**/temp-multi-commands-*/**',
        '**/temp-test/**',
        '**/*temp-test*/**',
        '**/*spaces and (symbols)*/**',
        // Global patterns for any temp test directories
        '**temp*/**',
        '**/*temp*/**',
      ],
      reportsDirectory: './coverage',
      clean: true,
    },
  },
  esbuild: {
    target: 'node18',
  },
});
