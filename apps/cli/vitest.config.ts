import { defineConfig } from 'vitest/config';
import { join } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{ts,js}'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@lord-commander/cli-core': join(__dirname, '../../libs/cli-core/src'),
    }
  }
});