#!/usr/bin/env node

/**
 * Comprehensive Updater Plugin Test Suite - Sandboxed Environment
 * 
 * This test suite creates isolated temporary git repositories to safely test
 * all updater functionality including potentially risky operations like:
 * - File modifications and deletions
 * - Git tag creation
 * - Update application and conflict resolution
 * 
 * All tests run in complete isolation with automatic cleanup.
 */

import { parseVersion, compareVersions, getChangeType, satisfiesRange, getVersionDiff, createUpdatePlan, applyUpdate, getAllTags, getLatestTag, tagExists, createTag } from '../plugins/updater.js';
import { exec } from '../core/exec.js';
import { writeFile, readFile, ensureDir } from '../core/fs.js';
import { logger } from '../core/logger.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

// Test Repository Management
interface TestRepository {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Create an isolated test git repository with sample history
 */
async function createTestRepository(): Promise<TestRepository> {
  const testRepoPath = path.join(os.tmpdir(), `updater-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  try {
    // Initialize clean git repository
    await ensureDir(testRepoPath);
    await exec('git', ['init'], { cwd: testRepoPath });
    await exec('git', ['config', 'user.name', 'Test User'], { cwd: testRepoPath });
    await exec('git', ['config', 'user.email', 'test@example.com'], { cwd: testRepoPath });
    await exec('git', ['config', 'init.defaultBranch', 'main'], { cwd: testRepoPath });
    
    // Create sample project structure and history
    await createSampleProjectHistory(testRepoPath);
    
    const cleanup = async () => {
      try {
        await fs.rm(testRepoPath, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors in tests
        console.warn(`Cleanup warning for ${testRepoPath}:`, error);
      }
    };
    
    return { path: testRepoPath, cleanup };
  } catch (error) {
    // Cleanup on failure
    try {
      await fs.rm(testRepoPath, { recursive: true, force: true });
    } catch {}
    throw error;
  }
}

/**
 * Create a realistic project history with multiple versions
 */
async function createSampleProjectHistory(repoPath: string): Promise<void> {
  // v1.0.0 - Initial project setup
  await writeFile(path.join(repoPath, 'package.json'), JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    description: 'Test project for updater',
    main: 'src/index.js'
  }, null, 2));
  
  await writeFile(path.join(repoPath, 'README.md'), '# Test Project\n\nInitial version of the test project.\n');
  
  await ensureDir(path.join(repoPath, 'src'));
  await writeFile(path.join(repoPath, 'src', 'index.js'), 'console.log("Hello, World!");\n');
  
  await writeFile(path.join(repoPath, '.gitignore'), 'node_modules/\n.env\n*.log\n');
  
  await exec('git', ['add', '.'], { cwd: repoPath });
  await exec('git', ['commit', '-m', 'Initial project setup'], { cwd: repoPath });
  await exec('git', ['tag', 'v1.0.0'], { cwd: repoPath });
  
  // v1.1.0 - Add new features
  await writeFile(path.join(repoPath, 'src', 'utils.js'), 'export function add(a, b) { return a + b; }\n');
  await writeFile(path.join(repoPath, 'src', 'config.js'), 'export const config = { debug: false };\n');
  
  // Update package.json version
  const packageJson = JSON.parse(await readFile(path.join(repoPath, 'package.json')));
  packageJson.version = '1.1.0';
  packageJson.dependencies = { lodash: '^4.17.21' };
  await writeFile(path.join(repoPath, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  // Update README
  await writeFile(path.join(repoPath, 'README.md'), '# Test Project\n\nTest project with utilities.\n\n## Features\n- Basic math utilities\n- Configuration support\n');
  
  await exec('git', ['add', '.'], { cwd: repoPath });
  await exec('git', ['commit', '-m', 'feat: add utility functions and configuration'], { cwd: repoPath });
  await exec('git', ['tag', 'v1.1.0'], { cwd: repoPath });
  
  // v1.2.0 - Bug fixes and improvements
  await writeFile(path.join(repoPath, 'src', 'utils.js'), 'export function add(a, b) {\n  if (typeof a !== "number" || typeof b !== "number") {\n    throw new Error("Both arguments must be numbers");\n  }\n  return a + b;\n}\n\nexport function multiply(a, b) {\n  return a * b;\n}\n');
  
  // Add a test file
  await ensureDir(path.join(repoPath, 'test'));
  await writeFile(path.join(repoPath, 'test', 'utils.test.js'), 'import { add, multiply } from "../src/utils.js";\n\nconsole.log("Testing utils...");\nconsole.log("add(2, 3) =", add(2, 3));\nconsole.log("multiply(4, 5) =", multiply(4, 5));\n');
  
  await exec('git', ['add', '.'], { cwd: repoPath });
  await exec('git', ['commit', '-m', 'fix: add input validation and multiply function'], { cwd: repoPath });
  await exec('git', ['tag', 'v1.2.0'], { cwd: repoPath });
  
  // v2.0.0 - Breaking changes
  packageJson.version = '2.0.0';
  packageJson.type = 'module';
  packageJson.dependencies = { lodash: '^5.0.0' }; // Breaking: new lodash version
  await writeFile(path.join(repoPath, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  // Breaking: rename src/index.js to src/main.js
  await exec('git', ['mv', 'src/index.js', 'src/main.js'], { cwd: repoPath });
  
  // Breaking: change API
  await writeFile(path.join(repoPath, 'src', 'utils.js'), 'export class Calculator {\n  add(a, b) {\n    if (typeof a !== "number" || typeof b !== "number") {\n      throw new Error("Both arguments must be numbers");\n    }\n    return a + b;\n  }\n\n  multiply(a, b) {\n    return a * b;\n  }\n\n  divide(a, b) {\n    if (b === 0) throw new Error("Division by zero");\n    return a / b;\n  }\n}\n');
  
  // Update config with breaking changes
  await writeFile(path.join(repoPath, 'src', 'config.js'), 'export const config = {\n  debug: false,\n  version: "2.0.0",\n  api: {\n    baseUrl: "https://api.example.com/v2"\n  }\n};\n');
  
  // Delete old test, add new one
  await exec('git', ['rm', 'test/utils.test.js'], { cwd: repoPath });
  await writeFile(path.join(repoPath, 'test', 'calculator.test.js'), 'import { Calculator } from "../src/utils.js";\n\nconst calc = new Calculator();\nconsole.log("Testing Calculator...");\nconsole.log("add(2, 3) =", calc.add(2, 3));\nconsole.log("multiply(4, 5) =", calc.multiply(4, 5));\nconsole.log("divide(10, 2) =", calc.divide(10, 2));\n');
  
  await exec('git', ['add', '.'], { cwd: repoPath });
  await exec('git', ['commit', '-m', 'BREAKING CHANGE: refactor to class-based API'], { cwd: repoPath });
  await exec('git', ['tag', 'v2.0.0'], { cwd: repoPath });
  
  // v2.1.0-beta.1 - Prerelease version
  packageJson.version = '2.1.0-beta.1';
  await writeFile(path.join(repoPath, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  await writeFile(path.join(repoPath, 'src', 'utils.js'), 'export class Calculator {\n  add(a, b) {\n    if (typeof a !== "number" || typeof b !== "number") {\n      throw new Error("Both arguments must be numbers");\n    }\n    return a + b;\n  }\n\n  multiply(a, b) {\n    return a * b;\n  }\n\n  divide(a, b) {\n    if (b === 0) throw new Error("Division by zero");\n    return a / b;\n  }\n\n  // Beta: new experimental feature\n  power(base, exp) {\n    return Math.pow(base, exp);\n  }\n}\n');
  
  await exec('git', ['add', '.'], { cwd: repoPath });
  await exec('git', ['commit', '-m', 'feat: add experimental power function (beta)'], { cwd: repoPath });
  await exec('git', ['tag', 'v2.1.0-beta.1'], { cwd: repoPath });
}

/**
 * Mock File System for testing dangerous operations safely
 */
class MockFileSystem {
  private virtualFiles = new Map<string, string>();
  private virtualDirs = new Set<string>();
  private deletedFiles = new Set<string>();
  
  reset(): void {
    this.virtualFiles.clear();
    this.virtualDirs.clear();
    this.deletedFiles.clear();
  }
  
  writeFile(filePath: string, content: string): void {
    this.virtualFiles.set(filePath, content);
    this.deletedFiles.delete(filePath);
  }
  
  readFile(filePath: string): string | undefined {
    return this.virtualFiles.get(filePath);
  }
  
  deleteFile(filePath: string): void {
    this.virtualFiles.delete(filePath);
    this.deletedFiles.add(filePath);
  }
  
  ensureDir(dirPath: string): void {
    this.virtualDirs.add(dirPath);
  }
  
  exists(filePath: string): boolean {
    return this.virtualFiles.has(filePath) && !this.deletedFiles.has(filePath);
  }
  
  isDeleted(filePath: string): boolean {
    return this.deletedFiles.has(filePath);
  }
  
  getAllFiles(): string[] {
    return Array.from(this.virtualFiles.keys()).filter(f => !this.deletedFiles.has(f));
  }
  
  getDeletedFiles(): string[] {
    return Array.from(this.deletedFiles);
  }
}

/**
 * Comprehensive test suite runner
 */
async function runComprehensiveUpdaterTests(): Promise<void> {
  logger.intro('Comprehensive Updater Plugin Test Suite - Sandboxed Environment');
  
  let testRepo: TestRepository | null = null;
  const mockFs = new MockFileSystem();
  
  try {
    // Test 1: Basic Semantic Version Operations (Pure Functions)
    await testSemanticVersionOperations();
    
    // Test 2: Test Repository Setup
    logger.step('Setting up isolated test repository...');
    testRepo = await createTestRepository();
    logger.success(`Test repository created at: ${testRepo.path}`);
    
    // Test 3: Git-based Version Operations
    await testGitVersionOperations(testRepo.path);
    
    // Test 4: Version Diffing
    await testVersionDiffing(testRepo.path);
    
    // Test 5: Update Planning
    await testUpdatePlanning(testRepo.path);
    
    // Test 6: Tag Management
    await testTagManagement(testRepo.path);
    
    // Test 7: Safe Update Application (Dry Run)
    await testUpdateApplicationDryRun(testRepo.path, mockFs);
    
    logger.success('All comprehensive tests passed successfully!');
    
  } catch (error) {
    logger.error(`Test suite failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    // Cleanup
    if (testRepo) {
      logger.step('Cleaning up test repository...');
      await testRepo.cleanup();
      logger.success('Cleanup completed');
    }
  }
  
  logger.outro('Comprehensive updater plugin tests completed!');
}

/**
 * Test basic semantic version operations
 */
async function testSemanticVersionOperations(): Promise<void> {
  logger.step('Testing semantic version operations...');
  
  // Test version parsing
  const versions = [
    '1.0.0',
    'v2.1.3',
    '1.0.0-alpha.1',
    '2.0.0-beta.2+build.123',
    '10.20.30'
  ];
  
  for (const versionStr of versions) {
    const version = parseVersion(versionStr);
    logger.info(`✓ Parsed ${versionStr}: ${version.major}.${version.minor}.${version.patch}${version.prerelease ? `-${version.prerelease}` : ''}${version.build ? `+${version.build}` : ''}`);
  }
  
  // Test version comparison
  const comparisons = [
    ['1.0.0', '1.0.1', 'patch'],
    ['1.0.0', '1.1.0', 'minor'],
    ['1.0.0', '2.0.0', 'major'],
    ['1.0.0-alpha', '1.0.0', 'prerelease'],
    ['2.1.0-beta.1', '2.1.0-beta.2', 'prerelease']
  ];
  
  for (const [v1, v2, expectedType] of comparisons) {
    const version1 = parseVersion(v1);
    const version2 = parseVersion(v2);
    const comparison = compareVersions(version1, version2);
    const changeType = getChangeType(version1, version2);
    
    if (comparison < 0 && changeType === expectedType) {
      logger.info(`✓ ${v1} < ${v2} (${changeType} change)`);
    } else {
      throw new Error(`Version comparison failed: ${v1} vs ${v2}`);
    }
  }
  
  // Test range satisfaction
  const rangTests = [
    ['1.2.3', '^1.0.0', true],
    ['2.0.0', '^1.0.0', false],
    ['1.2.5', '~1.2.0', true],
    ['1.3.0', '~1.2.0', false]
  ];
  
  for (const [version, range, expected] of rangTests) {
    const v = parseVersion(version as string);
    const satisfies = satisfiesRange(v, range as string);
    if (satisfies === expected) {
      logger.info(`✓ ${version} ${satisfies ? 'satisfies' : 'does not satisfy'} ${range}`);
    } else {
      throw new Error(`Range test failed: ${version} ${range}`);
    }
  }
  
  logger.success('Semantic version operations: All tests passed');
}

/**
 * Test git-based version operations
 */
async function testGitVersionOperations(repoPath: string): Promise<void> {
  logger.step('Testing git-based version operations...');
  
  // Test tag retrieval
  const allTags = await getAllTags(repoPath);
  logger.info(`✓ Found ${allTags.length} tags: ${allTags.join(', ')}`);
  
  const expectedTags = ['v1.0.0', 'v1.1.0', 'v1.2.0', 'v2.0.0', 'v2.1.0-beta.1'];
  if (allTags.length !== expectedTags.length) {
    throw new Error(`Expected ${expectedTags.length} tags, got ${allTags.length}`);
  }
  
  // Test latest tag
  const latestTag = await getLatestTag(repoPath);
  logger.info(`✓ Latest tag: ${latestTag}`);
  
  if (latestTag !== 'v2.1.0-beta.1') {
    throw new Error(`Expected latest tag 'v2.1.0-beta.1', got '${latestTag}'`);
  }
  
  // Test tag existence
  for (const tag of expectedTags) {
    const exists = await tagExists(tag, repoPath);
    if (!exists) {
      throw new Error(`Tag ${tag} should exist but doesn't`);
    }
    logger.info(`✓ Tag ${tag} exists`);
  }
  
  // Test non-existent tag
  const fakeTagExists = await tagExists('v99.99.99', repoPath);
  if (fakeTagExists) {
    throw new Error('Fake tag should not exist');
  }
  logger.info('✓ Non-existent tag correctly reported as missing');
  
  logger.success('Git-based version operations: All tests passed');
}

/**
 * Test version diffing functionality
 */
async function testVersionDiffing(repoPath: string): Promise<void> {
  logger.step('Testing version diffing...');
  
  // Test diff between versions
  const testCases = [
    { from: 'v1.0.0', to: 'v1.1.0', expectedType: 'minor', shouldBeBreaking: false },
    { from: 'v1.1.0', to: 'v2.0.0', expectedType: 'major', shouldBeBreaking: true },
    { from: 'v2.0.0', to: 'v2.1.0-beta.1', expectedType: 'minor', shouldBeBreaking: false }
  ];
  
  for (const testCase of testCases) {
    const diff = await getVersionDiff(testCase.from, testCase.to, repoPath);
    
    // Validate diff structure
    if (diff.changeType !== testCase.expectedType) {
      throw new Error(`Expected change type ${testCase.expectedType}, got ${diff.changeType}`);
    }
    
    if (diff.breaking !== testCase.shouldBeBreaking) {
      throw new Error(`Expected breaking: ${testCase.shouldBeBreaking}, got ${diff.breaking}`);
    }
    
    logger.info(`✓ Diff ${testCase.from} → ${testCase.to}: ${diff.changeType} change, breaking: ${diff.breaking}`);
    logger.info(`  Files changed: ${diff.files.length}, Commits: ${diff.commits.length}`);
    
    // Validate that we have files and commits
    if (diff.files.length === 0) {
      throw new Error('Expected file changes but got none');
    }
    
    if (diff.commits.length === 0) {
      throw new Error('Expected commits but got none');
    }
    
    // Log some file changes for verification
    diff.files.slice(0, 3).forEach(file => {
      logger.info(`  ${file.status}: ${file.path} (+${file.insertions}/-${file.deletions})`);
    });
  }
  
  logger.success('Version diffing: All tests passed');
}

/**
 * Test update planning functionality
 */
async function testUpdatePlanning(repoPath: string): Promise<void> {
  logger.step('Testing update planning...');
  
  const testCases = [
    { from: 'v1.0.0', to: 'v1.1.0' },
    { from: 'v1.1.0', to: 'v2.0.0' },
    { from: 'v1.0.0', to: 'v2.1.0-beta.1' }
  ];
  
  for (const testCase of testCases) {
    const plan = await createUpdatePlan(testCase.from, testCase.to, repoPath);
    
    // Validate plan structure
    if (plan.fromVersion !== testCase.from || plan.toVersion !== testCase.to) {
      throw new Error('Update plan versions don\'t match input');
    }
    
    if (!plan.diff || !plan.strategy) {
      throw new Error('Update plan missing required properties');
    }
    
    logger.info(`✓ Update plan ${testCase.from} → ${testCase.to}:`);
    logger.info(`  Strategy: ${plan.strategy.type}`);
    logger.info(`  Backup required: ${plan.backupRequired}`);
    logger.info(`  Conflicts: ${plan.conflicts.length}`);
    logger.info(`  Files to update: ${plan.diff.files.length}`);
    
    // Validate strategy
    if (!['overwrite', 'merge', 'selective'].includes(plan.strategy.type)) {
      throw new Error(`Invalid strategy type: ${plan.strategy.type}`);
    }
    
    // Validate exclude paths exist
    if (!Array.isArray(plan.strategy.excludePaths) || plan.strategy.excludePaths.length === 0) {
      throw new Error('Strategy should have exclude paths');
    }
  }
  
  logger.success('Update planning: All tests passed');
}

/**
 * Test tag management operations
 */
async function testTagManagement(repoPath: string): Promise<void> {
  logger.step('Testing tag management...');
  
  // Test creating new tags
  const newTags = ['v2.1.0', 'v2.1.1-alpha.1'];
  
  for (const tag of newTags) {
    // Ensure tag doesn't exist initially
    let exists = await tagExists(tag, repoPath);
    if (exists) {
      throw new Error(`Tag ${tag} should not exist initially`);
    }
    
    // Create the tag
    await createTag(tag, `Test release ${tag}`, repoPath);
    logger.info(`✓ Created tag: ${tag}`);
    
    // Verify it was created
    exists = await tagExists(tag, repoPath);
    if (!exists) {
      throw new Error(`Tag ${tag} should exist after creation`);
    }
    logger.info(`✓ Verified tag exists: ${tag}`);
  }
  
  // Test tag listing after creation
  const allTagsAfterCreation = await getAllTags(repoPath);
  const expectedFinalCount = 5 + newTags.length; // Original 5 + 2 new ones
  
  if (allTagsAfterCreation.length !== expectedFinalCount) {
    throw new Error(`Expected ${expectedFinalCount} tags after creation, got ${allTagsAfterCreation.length}`);
  }
  
  logger.info(`✓ Total tags after creation: ${allTagsAfterCreation.length}`);
  logger.info(`  Tags: ${allTagsAfterCreation.join(', ')}`);
  
  // Test latest tag is correctly identified
  const latestAfterCreation = await getLatestTag(repoPath);
  logger.info(`✓ Latest tag after creation: ${latestAfterCreation}`);
  
  logger.success('Tag management: All tests passed');
}

/**
 * Test update application in safe dry-run mode
 */
async function testUpdateApplicationDryRun(repoPath: string, mockFs: MockFileSystem): Promise<void> {
  logger.step('Testing update application (dry-run mode)...');
  
  // Test update application with different strategies
  const plan = await createUpdatePlan('v1.0.0', 'v2.0.0', repoPath);
  
  // Test dry-run mode (safe)
  logger.info('Testing dry-run mode...');
  await applyUpdate(plan, repoPath, { dryRun: true });
  logger.info('✓ Dry-run completed successfully (no actual changes made)');
  
  // Verify repository is unchanged after dry-run
  const tagsAfterDryRun = await getAllTags(repoPath);
  const expectedTagCount = 7; // Should be unchanged from tag management test
  if (tagsAfterDryRun.length !== expectedTagCount) {
    throw new Error('Dry-run should not modify repository');
  }
  
  // Test mock file system operations (simulated)
  mockFs.reset();
  logger.info('Testing mock file system operations...');
  
  // Simulate file operations that would happen in a real update
  mockFs.writeFile('/test/package.json', '{"version": "2.0.0"}');
  mockFs.writeFile('/test/src/main.js', 'console.log("Updated main file");');
  mockFs.deleteFile('/test/src/index.js'); // Simulate rename
  mockFs.ensureDir('/test/new-dir');
  
  // Verify mock operations
  if (!mockFs.exists('/test/package.json')) {
    throw new Error('Mock file should exist');
  }
  
  if (!mockFs.isDeleted('/test/src/index.js')) {
    throw new Error('Mock file should be marked as deleted');
  }
  
  const allFiles = mockFs.getAllFiles();
  const deletedFiles = mockFs.getDeletedFiles();
  
  logger.info(`✓ Mock FS: ${allFiles.length} files created, ${deletedFiles.length} files deleted`);
  logger.info(`  Created: ${allFiles.join(', ')}`);
  logger.info(`  Deleted: ${deletedFiles.join(', ')}`);
  
  logger.success('Update application (dry-run): All tests passed');
}

// Run the comprehensive test suite
runComprehensiveUpdaterTests().catch(error => {
  console.error(`Comprehensive test suite failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

export { runComprehensiveUpdaterTests };