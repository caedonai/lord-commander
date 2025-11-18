/// <reference types='vitest' />

import * as path from 'node:path';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// TypeScript interface definitions handled by vitest types reference

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../node_modules/.vite/cli-core',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    target: 'node18',
    outDir: '../dist/cli-core',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Multiple entry points for Phase 2 granular tree-shaking
      entry: {
        index: 'src/index.ts',
        // Core modules for individual imports
        'core/execution/execa': 'src/core/execution/execa.ts',
        'core/execution/fs': 'src/core/execution/fs.ts',
        'core/ui/logger': 'src/core/ui/logger.ts',
        'core/ui/prompts': 'src/core/ui/prompts.ts',
        'core/ui/icons': 'src/core/ui/icons.ts',
        'core/foundation/errors/errors': 'src/core/foundation/errors/errors.ts',
        'core/foundation/security/patterns': 'src/core/foundation/security/patterns.ts',
        'core/foundation/security/validation': 'src/core/foundation/security/validation.ts',
        'core/foundation/core/constants': 'src/core/foundation/core/constants.ts',
        // Legacy namespace support
        'core/index': 'src/core/index.ts',
        'plugins/index': 'src/plugins/index.ts',
        'types/index': 'src/types/index.ts',
      },
      formats: ['es' as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        // Node.js built-in modules
        'node:fs',
        'node:fs/promises',
        'node:path',
        'node:os',
        'node:child_process',
        'node:process',
        'node:util',
        'node:events',
        'node:url',
        'node:buffer',
        'node:stream',
        'node:readline',
        'node:timers/promises',
        'node:crypto',
        'fs',
        'fs/promises',
        'path',
        'os',
        'child_process',
        'process',
        'util',
        'events',
        'url',
        'buffer',
        'stream',
        'readline',
        'timers/promises',
        'crypto',
        // External dependencies
        'commander',
        'execa',
        '@clack/prompts',
        'figures',
        'picocolors',
        'zod',
      ],
    },
  },
  test: {
    name: 'cli-core',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: [
      'node_modules',
      'dist',
      // Exclude the original memory-intensive fs-advanced test in favor of lightweight version
      'src/tests/core/execution/fs-advanced.test.ts',
      // Temporarily exclude CLI performance tests that require building the CLI app
      'src/tests/cli/performance.test.ts',
      'src/tests/cli/build-validation.test.ts',
      'src/tests/cli/integration.test.ts',
      // Exclude example tests with import path issues (these would need example files to be built/compiled)
      'src/tests/examples/cli-readability-demo.test.ts',
      'src/tests/examples/logger-icons-demo.test.ts',
      'src/tests/examples/prompts-demo.test.ts',
      'src/tests/examples/simple-icon-test.test.ts',
      'src/tests/examples/workflows/basic-cli-creation.test.ts',
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
      reportsDirectory: '../../coverage/libs/cli-core',
      provider: 'v8' as const,
    },
  },
}));
