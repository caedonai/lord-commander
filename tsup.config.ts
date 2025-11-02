import { defineConfig } from 'tsup';

export default defineConfig([
  // Library exports
  {
    entry: ['src/index.ts', 'src/core/index.ts', 'src/plugins/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    target: 'node18',
    shims: true,
  },
  // CLI binary with shebang
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    dts: false,
    target: 'node18',
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
