#!/usr/bin/env node

import { copyFileSync, chmodSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const hooksDir = join(projectRoot, '.git', 'hooks');
const preCommitSource = join(projectRoot, '.githooks', 'pre-commit');
const preCommitTarget = join(hooksDir, 'pre-commit');

console.log('🛠️  Installing git hooks...');

// Check if .git exists
if (!existsSync(hooksDir)) {
  console.error('❌ .git/hooks directory not found. Make sure you\'re in a git repository.');
  process.exit(1);
}

// Check if source hook exists
if (!existsSync(preCommitSource)) {
  console.error('❌ Source hook not found at:', preCommitSource);
  process.exit(1);
}

try {
  // Copy pre-commit hook
  copyFileSync(preCommitSource, preCommitTarget);
  
  // Make it executable (Unix/Mac/WSL)
  if (process.platform !== 'win32') {
    chmodSync(preCommitTarget, '755');
  }
  
  console.log('✅ Pre-commit hook installed successfully!');
  console.log('📍 Installed to:', preCommitTarget);
  console.log('📍 Source:', preCommitSource);
  
} catch (error) {
  console.error('❌ Failed to install hook:', error.message);
  process.exit(1);
}