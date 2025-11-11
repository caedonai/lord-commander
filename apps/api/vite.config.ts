/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import swc from 'unplugin-swc';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps-api',
  plugins: [
    // NX paths plugin disabled - build works without it and bundles properly
    // nxViteTsPaths(),
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        target: 'es2021',
      },
      // Let Vite handle module bundling, not SWC
      module: {
        type: 'es6',
      },
    }),
  ],
  optimizeDeps: {
    include: ['@nestjs/common', '@nestjs/core', '@nestjs/platform-express', 'reflect-metadata', 'rxjs'],
  },
  // Disable esbuild since we're using SWC
  esbuild: false,
  build: {
    target: 'node18',
    outDir: '../../dist/apps/api',
    emptyOutDir: true,
    reportCompressedSize: true,
    minify: false, // Disable minification to preserve class names and metadata
    lib: {
      entry: 'src/main.ts',
      name: 'api',
      fileName: 'main',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        // Only externalize NestJS core and Node.js built-ins - bundle all app code
        '@nestjs/common',
        '@nestjs/core',
        '@nestjs/platform-express',
        'reflect-metadata',
        'rxjs',
        'class-validator',
        'class-transformer',
        // Node.js built-ins
        /^node:/,
        'fs',
        'path',
        'url',
        'util',
        'events',
        'stream',
        'http',
        'https',
        'crypto',
        'os',
        'child_process',
        'repl',
        'perf_hooks',
        'async_hooks',
        'querystring',
      ],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../../coverage/apps/api',
      exclude: [
        'node_modules/',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});