#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * 
 * Sets up the development environment for the Lord Commander CLI SDK,
 * including dependencies, git hooks, and development tools.
 */

import { execa } from 'execa';
import { existsSync, writeFileSync, chmodSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '..');

console.log('🔧 Lord Commander SDK Development Setup');
console.log('═'.repeat(50));

async function runCommand(cmd, description) {
  console.log(`📋 ${description}...`);
  
  try {
    const [command, ...args] = cmd.split(' ');
    await execa(command, args, { 
      cwd: rootPath, 
      stdio: 'inherit'
    });
    console.log(`   ✅ Completed`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return false;
  }
  return true;
}

function createFile(path, content, description) {
  console.log(`📝 Creating ${description}...`);
  
  if (existsSync(path)) {
    console.log(`   ⚠️  File already exists, skipping`);
    return;
  }
  
  writeFileSync(path, content);
  console.log(`   ✅ Created ${path}`);
}

async function main() {
  // 1. Install dependencies
  console.log('📦 Installing dependencies...');
  await runCommand('pnpm install', 'Installing npm packages');
  
  // 2. Build the project initially
  await runCommand('pnpm build', 'Initial project build');
  
  // 3. Set up git hooks
  console.log('\n🪝 Setting up git hooks...');
  
  const preCommitHook = `#!/bin/sh
# Pre-commit hook for Lord Commander SDK

echo "🔍 Running pre-commit checks..."

# Run linting
echo "📏 Running ESLint..."
pnpm lint || exit 1

# Run tests
echo "🧪 Running tests..."
pnpm test || exit 1

# Build check
echo "🔨 Testing build..."
pnpm build || exit 1

echo "✅ Pre-commit checks passed!"
`;

  const hooksDir = resolve(rootPath, '.git/hooks');
  const preCommitPath = resolve(hooksDir, 'pre-commit');
  
  if (existsSync(hooksDir)) {
    createFile(preCommitPath, preCommitHook, 'pre-commit hook');
    try {
      chmodSync(preCommitPath, 0o755);
      console.log('   ✅ Made pre-commit hook executable');
    } catch (error) {
      console.log('   ⚠️  Could not make hook executable (Windows?)');
    }
  } else {
    console.log('   ⚠️  Git hooks directory not found, skipping');
  }
  
  // 4. Create VS Code settings
  console.log('\n⚙️  Setting up VS Code configuration...');
  
  const vscodeSettings = {
    "typescript.preferences.includePackageJsonAutoImports": "on",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    },
    "files.associations": {
      "*.mjs": "javascript"
    },
    "vitest.enable": true
  };
  
  const vscodeDir = resolve(rootPath, '.vscode');
  const settingsPath = resolve(vscodeDir, 'settings.json');
  
  try {
    if (!existsSync(vscodeDir)) {
      await execa('mkdir', ['-p', vscodeDir], { 
        cwd: rootPath
      });
    }
    createFile(settingsPath, JSON.stringify(vscodeSettings, null, 2), 'VS Code settings');
  } catch (error) {
    console.log('   ⚠️  Could not create VS Code settings');
  }
  
  // 5. Create development scripts
  console.log('\n🛠️  Creating development utilities...');
  
  const devScript = `#!/usr/bin/env node

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
      console.log(\`  pnpm dev \${cmd}\`);
    });
    process.exit(1);
  }

  await commands[command]();
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
`;
  
  createFile(resolve(rootPath, 'scripts/dev.mjs'), devScript, 'development utility script');
  
  // 6. Test the setup
  console.log('\n🧪 Testing setup...');
  await runCommand('pnpm test:cli-build', 'Testing CLI build');
  
  console.log('\n🎉 Development setup completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start development: pnpm dev');
  console.log('   2. Run tests: pnpm test');
  console.log('   3. Build CLI: pnpm build');
  console.log('   4. Test CLI: pnpm test:cli-all');
  console.log('\n🚀 Happy coding!');
}

main().catch(error => {
  console.error('\n💥 Setup failed:', error.message);
  process.exit(1);
});