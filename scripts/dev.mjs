#!/usr/bin/env node

/**
 * Development CLI for Lord Commander SDK
 * Quick development commands and utilities
 */

import { execa } from 'execa';
const [,, command, ...args] = process.argv;

const commands = {
  'test-quick': async () => await execa('pnpm', ['test:run'], { stdio: 'inherit' }),
  'test-cli': async () => await execa('pnpm', ['test:cli-all'], { stdio: 'inherit' }),
  'build-watch': async () => await execa('pnpm', ['build', '--watch'], { stdio: 'inherit' }),
  'clean': async () => {
    await execa('rm', ['-rf', 'dist', 'node_modules/.cache'], { stdio: 'inherit' });
    console.log('✅ Cleaned build cache');
  },
  'reset': async () => {
    await execa('rm', ['-rf', 'node_modules', 'pnpm-lock.yaml'], { stdio: 'inherit' });
    await execa('pnpm', ['install'], { stdio: 'inherit' });
    console.log('✅ Reset dependencies');
  }
};

async function main() {
  if (!command || !commands[command]) {
    console.log('🛠️  Lord Commander SDK Development CLI');
    console.log('Available commands:');
    Object.keys(commands).forEach(cmd => {
      console.log(`  pnpm dev ${cmd}`);
    });
    process.exit(1);
  }

  await commands[command]();
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
