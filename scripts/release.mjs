#!/usr/bin/env node

/**
 * Release Automation Script
 * 
 * Automates the release process for the Lord Commander CLI SDK including
 * version bumping, changelog generation, build validation, and npm publishing.
 */

import { execa } from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const releaseType = args[0] || 'patch'; // patch, minor, major
const dryRun = args.includes('--dry-run');

console.log('🚀 Lord Commander SDK Release Automation');
console.log('═'.repeat(50));

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

async function runCommand(cmd, description) {
  console.log(`📋 ${description}...`);
  
  if (dryRun) {
    console.log(`   Would run: ${cmd}`);
    return;
  }
  
  try {
    const [command, ...args] = cmd.split(' ');
    await execa(command, args, { 
      cwd: rootPath, 
      stdio: 'inherit'
    });
    console.log(`   ✅ Completed`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    process.exit(1);
  }
}

async function bumpVersion(type) {
  console.log(`📈 Bumping ${type} version...`);
  
  const packagePath = resolve(rootPath, 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  let newVersion;
  
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
  }
  
  console.log(`   Version: ${pkg.version} → ${newVersion}`);
  
  if (!dryRun) {
    pkg.version = newVersion;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  }
  
  return newVersion;
}

async function generateChangelog(version) {
  console.log('📝 Generating changelog...');
  
  if (dryRun) {
    console.log('   Would generate changelog for version', version);
    return;
  }
  
  // Simple changelog generation - you could enhance this with conventional commits
  const date = new Date().toISOString().split('T')[0];
  const changelogEntry = `
## [${version}] - ${date}

### Added
- New features and enhancements

### Changed
- Improvements and updates

### Fixed
- Bug fixes and security updates
`;
  
  try {
    const changelog = readFileSync(resolve(rootPath, 'CHANGELOG.md'), 'utf-8');
    const newChangelog = changelog.replace(
      /^(# Changelog)/m,
      `$1\n${changelogEntry}`
    );
    writeFileSync(resolve(rootPath, 'CHANGELOG.md'), newChangelog);
    console.log('   ✅ Changelog updated');
  } catch (error) {
    console.log('   ⚠️  No CHANGELOG.md found, skipping');
  }
}

async function main() {
  // 1. Run all tests
  await runCommand('pnpm test', 'Running unit tests');
  await runCommand('pnpm test:cli-all', 'Running CLI tests');
  
  // 2. Build the project
  await runCommand('pnpm build', 'Building project');
  
  // 3. Bump version
  const newVersion = await bumpVersion(releaseType);
  
  // 4. Generate changelog
  await generateChangelog(newVersion);
  
  // 5. Commit changes
  await runCommand(`git add .`, 'Staging changes');
  await runCommand(`git commit -m "chore: release v${newVersion}"`, 'Committing changes');
  
  // 6. Create git tag
  await runCommand(`git tag -a v${newVersion} -m "Release v${newVersion}"`, 'Creating git tag');
  
  // 7. Push changes
  await runCommand('git push origin main --tags', 'Pushing to repository');
  
  // 8. Publish to npm
  console.log('📦 Publishing to npm...');
  if (dryRun) {
    console.log('   Would run: npm publish --access public');
  } else {
    console.log('   Run manually: npm publish --access public');
    console.log('   Or with 2FA: npm publish --access public --otp <code>');
  }
  
  console.log('\n🎉 Release completed successfully!');
  console.log(`   Version: v${newVersion}`);
  console.log(`   Tag: v${newVersion}`);
  console.log('   Manual step: npm publish --access public');
}

main().catch(error => {
  console.error('\n💥 Release failed:', error.message);
  process.exit(1);
});