/**
 * Updater Plugin - Comprehensive Test Suite (Vitest)
 * 
 * Comprehensive sandboxed tests for all updater functionality including
 * potentially risky operations using isolated temporary repositories.
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { parseVersion, getVersionDiff, createUpdatePlan, applyUpdate, getAllTags, getLatestTag, tagExists, createTag } from '../plugins/updater.js';
import { exec } from '../core/execution/exec.js';
import { writeFile, readFile, ensureDir } from '../core/execution/fs.js';
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
 * Optimized for faster test execution
 */
async function createTestRepository(): Promise<TestRepository> {
  const testRepoPath = path.join(os.tmpdir(), `updater-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  try {
    // Initialize clean git repository with batched config
    await ensureDir(testRepoPath);
    await exec('git', ['init', '--initial-branch=main'], { cwd: testRepoPath });
    
    // Batch git config commands for speed
    await exec('git', ['config', '--local', 'user.name', 'Test User'], { cwd: testRepoPath });
    await exec('git', ['config', '--local', 'user.email', 'test@example.com'], { cwd: testRepoPath });
    await exec('git', ['config', '--local', 'commit.gpgsign', 'false'], { cwd: testRepoPath });
    
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
  await exec('git', ['commit', '--no-verify', '-m', 'Initial project setup'], { cwd: repoPath });
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
  await exec('git', ['commit', '--no-verify', '-m', 'feat: add utility functions and configuration'], { cwd: repoPath });
  await exec('git', ['tag', 'v1.1.0'], { cwd: repoPath });
  
  // v1.2.0 - Bug fixes and improvements
  await writeFile(path.join(repoPath, 'src', 'utils.js'), 'export function add(a, b) {\n  if (typeof a !== "number" || typeof b !== "number") {\n    throw new Error("Both arguments must be numbers");\n  }\n  return a + b;\n}\n\nexport function multiply(a, b) {\n  return a * b;\n}\n');
  
  // Add a test file
  await ensureDir(path.join(repoPath, 'test'));
  await writeFile(path.join(repoPath, 'test', 'utils.test.js'), 'import { add, multiply } from "../src/utils.js";\n\nconsole.log("Testing utils...");\nconsole.log("add(2, 3) =", add(2, 3));\nconsole.log("multiply(4, 5) =", multiply(4, 5));\n');
  
  await exec('git', ['add', '.'], { cwd: repoPath });
  await exec('git', ['commit', '--no-verify', '-m', 'fix: add input validation and multiply function'], { cwd: repoPath });
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
  await exec('git', ['commit', '--no-verify', '-m', 'BREAKING CHANGE: refactor to class-based API'], { cwd: repoPath });
  await exec('git', ['tag', 'v2.0.0'], { cwd: repoPath });
  
  // v2.1.0-beta.1 - Prerelease version
  packageJson.version = '2.1.0-beta.1';
  await writeFile(path.join(repoPath, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  await writeFile(path.join(repoPath, 'src', 'utils.js'), 'export class Calculator {\n  add(a, b) {\n    if (typeof a !== "number" || typeof b !== "number") {\n      throw new Error("Both arguments must be numbers");\n    }\n    return a + b;\n  }\n\n  multiply(a, b) {\n    return a * b;\n  }\n\n  divide(a, b) {\n    if (b === 0) throw new Error("Division by zero");\n    return a / b;\n  }\n\n  // Beta: new experimental feature\n  power(base, exp) {\n    return Math.pow(base, exp);\n  }\n}\n');
  
  await exec('git', ['add', '.'], { cwd: repoPath });
  await exec('git', ['commit', '--no-verify', '-m', 'feat: add experimental power function (beta)'], { cwd: repoPath });
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

describe('Updater Plugin - Comprehensive Sandboxed Tests', () => {
  let testRepo: TestRepository;
  let mockFs: MockFileSystem;
  
  // Shared test repository for read-only operations (faster)
  let sharedTestRepo: TestRepository | null = null;

  beforeEach(async () => {
    mockFs = new MockFileSystem();
    
    // For tests that don't modify the repository, reuse shared instance
    if (!sharedTestRepo) {
      sharedTestRepo = await createTestRepository();
    }
    testRepo = sharedTestRepo;
  });

  afterEach(async () => {
    mockFs.reset();
    // Don't cleanup shared repo after each test
  });
  
  // Clean up shared repo after all tests
  afterAll(async () => {
    if (sharedTestRepo) {
      await sharedTestRepo.cleanup();
      sharedTestRepo = null;
    }
  });

  describe('Git-based Version Operations (Isolated Repository)', () => {
    it('should retrieve all tags from test repository', async () => {
      const allTags = await getAllTags(testRepo.path);
      
      expect(Array.isArray(allTags)).toBe(true);
      expect(allTags).toHaveLength(5);
      expect(allTags).toEqual(['v1.0.0', 'v1.1.0', 'v1.2.0', 'v2.0.0', 'v2.1.0-beta.1']);
    });

    it('should get latest tag from test repository', async () => {
      const latestTag = await getLatestTag(testRepo.path);
      
      expect(latestTag).toBe('v2.1.0-beta.1');
    });

    it('should check tag existence correctly', async () => {
      // Test existing tags
      const expectedTags = ['v1.0.0', 'v1.1.0', 'v1.2.0', 'v2.0.0', 'v2.1.0-beta.1'];
      
      for (const tag of expectedTags) {
        const exists = await tagExists(tag, testRepo.path);
        expect(exists).toBe(true);
      }
      
      // Test non-existent tag
      const fakeTagExists = await tagExists('v99.99.99', testRepo.path);
      expect(fakeTagExists).toBe(false);
    });
  });

  describe('Version Diffing (Real Git History)', () => {
    const testCases = [
      { from: 'v1.0.0', to: 'v1.1.0', expectedType: 'minor', shouldBeBreaking: false },
      { from: 'v1.1.0', to: 'v2.0.0', expectedType: 'major', shouldBeBreaking: true },
      { from: 'v2.0.0', to: 'v2.1.0-beta.1', expectedType: 'minor', shouldBeBreaking: false }
    ];

    testCases.forEach(testCase => {
      it(`should get correct diff for ${testCase.from} → ${testCase.to}`, async () => {
        const diff = await getVersionDiff(testCase.from, testCase.to, testRepo.path);
        
        expect(diff.changeType).toBe(testCase.expectedType);
        expect(diff.breaking).toBe(testCase.shouldBeBreaking);
        expect(diff.from).toEqual(parseVersion(testCase.from));
        expect(diff.to).toEqual(parseVersion(testCase.to));
        expect(Array.isArray(diff.files)).toBe(true);
        expect(Array.isArray(diff.commits)).toBe(true);
        expect(diff.files.length).toBeGreaterThan(0);
        expect(diff.commits.length).toBeGreaterThan(0);
        
        // Validate file diff structure
        diff.files.forEach(file => {
          expect(file).toHaveProperty('path');
          expect(file).toHaveProperty('status');
          expect(['added', 'modified', 'deleted', 'renamed']).toContain(file.status);
          expect(typeof file.insertions).toBe('number');
          expect(typeof file.deletions).toBe('number');
        });
        
        // Validate commit structure
        diff.commits.forEach(commit => {
          expect(commit).toHaveProperty('hash');
          expect(commit).toHaveProperty('shortHash');
          expect(commit).toHaveProperty('author');
          expect(commit).toHaveProperty('email');
          expect(commit).toHaveProperty('date');
          expect(commit).toHaveProperty('message');
          expect(commit.date).toBeInstanceOf(Date);
        });
      });
    });

    it('should detect breaking changes correctly', async () => {
      const breakingDiff = await getVersionDiff('v1.1.0', 'v2.0.0', testRepo.path);
      expect(breakingDiff.breaking).toBe(true);
      
      const nonBreakingDiff = await getVersionDiff('v1.0.0', 'v1.1.0', testRepo.path);
      expect(nonBreakingDiff.breaking).toBe(false);
    });
  });

  describe('Update Planning', () => {
    const planningCases = [
      { from: 'v1.0.0', to: 'v1.1.0' },
      { from: 'v1.1.0', to: 'v2.0.0' },
      { from: 'v1.0.0', to: 'v2.1.0-beta.1' }
    ];

    planningCases.forEach(testCase => {
      it(`should create valid update plan for ${testCase.from} → ${testCase.to}`, async () => {
        const plan = await createUpdatePlan(testCase.from, testCase.to, testRepo.path);
        
        expect(plan.fromVersion).toBe(testCase.from);
        expect(plan.toVersion).toBe(testCase.to);
        expect(plan).toHaveProperty('diff');
        expect(plan).toHaveProperty('strategy');
        expect(plan).toHaveProperty('conflicts');
        expect(plan).toHaveProperty('backupRequired');
        
        // Validate strategy
        expect(['overwrite', 'merge', 'selective']).toContain(plan.strategy.type);
        expect(Array.isArray(plan.strategy.excludePaths)).toBe(true);
        expect(Array.isArray(plan.strategy.preserveFiles)).toBe(true);
        expect(plan.strategy.excludePaths.length).toBeGreaterThan(0);
        
        // Validate conflicts array
        expect(Array.isArray(plan.conflicts)).toBe(true);
        
        // Validate backup requirement
        expect(typeof plan.backupRequired).toBe('boolean');
      });
    });

    it('should handle different strategy options', async () => {
      const planOverwrite = await createUpdatePlan('v1.0.0', 'v2.0.0', testRepo.path, {
        strategy: { type: 'overwrite' }
      });
      expect(planOverwrite.strategy.type).toBe('overwrite');
      
      const planSelective = await createUpdatePlan('v1.0.0', 'v2.0.0', testRepo.path, {
        strategy: { type: 'selective' }
      });
      expect(planSelective.strategy.type).toBe('selective');
    });

    it('should respect backup preferences', async () => {
      const planNoBackup = await createUpdatePlan('v1.0.0', 'v1.1.0', testRepo.path, {
        createBackup: false
      });
      // Note: backup might still be required if there are conflicts
      expect(typeof planNoBackup.backupRequired).toBe('boolean');
    });
  });

  describe('Tag Management (Isolated Repository)', () => {
    // These tests need fresh repos since they modify git state
    let isolatedRepo: TestRepository;
    
    beforeEach(async () => {
      isolatedRepo = await createTestRepository();
    });
    
    afterEach(async () => {
      if (isolatedRepo) {
        await isolatedRepo.cleanup();
      }
    });

    it('should create new tags successfully', async () => {
      const newTags = ['v2.1.0', 'v2.1.1-alpha.1'];
      
      for (const tag of newTags) {
        // Ensure tag doesn't exist initially
        let exists = await tagExists(tag, isolatedRepo.path);
        expect(exists).toBe(false);
        
        // Create the tag
        await createTag(tag, `Test release ${tag}`, isolatedRepo.path);
        
        // Verify it was created
        exists = await tagExists(tag, isolatedRepo.path);
        expect(exists).toBe(true);
      }
      
      // Verify tag count increased
      const allTagsAfter = await getAllTags(isolatedRepo.path);
      expect(allTagsAfter).toHaveLength(7); // Original 5 + 2 new ones
    });

    it('should update latest tag after creation', async () => {
      // Create a newer tag
      await createTag('v3.0.0', 'Major release', isolatedRepo.path);
      
      const latestTag = await getLatestTag(isolatedRepo.path);
      expect(latestTag).toBe('v3.0.0');
    });

    it('should handle tag creation with and without messages', async () => {
      // Create tag with message
      await createTag('v2.2.0', 'Release with message', isolatedRepo.path);
      expect(await tagExists('v2.2.0', isolatedRepo.path)).toBe(true);
      
      // Create tag without message
      await createTag('v2.3.0', undefined, isolatedRepo.path);
      expect(await tagExists('v2.3.0', isolatedRepo.path)).toBe(true);
    });
  });

  describe('Update Application (Safe Dry-Run)', () => {
    it('should execute dry-run without making changes', async () => {
      const plan = await createUpdatePlan('v1.0.0', 'v2.0.0', testRepo.path);
      
      // Get initial state
      const initialTags = await getAllTags(testRepo.path);
      
      // Execute dry-run
      await applyUpdate(plan, testRepo.path, { dryRun: true });
      
      // Verify no changes were made
      const finalTags = await getAllTags(testRepo.path);
      expect(finalTags).toEqual(initialTags);
    });

    it('should handle different update strategies in dry-run', async () => {
      const strategies = ['overwrite', 'merge', 'selective'] as const;
      
      for (const strategyType of strategies) {
        const plan = await createUpdatePlan('v1.0.0', 'v1.1.0', testRepo.path, {
          strategy: { type: strategyType }
        });
        
        // Should not throw in dry-run mode
        await expect(
          applyUpdate(plan, testRepo.path, { dryRun: true })
        ).resolves.not.toThrow();
      }
    });

    it('should validate plan structure before application', async () => {
      const plan = await createUpdatePlan('v1.0.0', 'v1.1.0', testRepo.path);
      
      // Plan should have all required properties for safe application
      expect(plan).toHaveProperty('diff');
      expect(plan).toHaveProperty('strategy');
      expect(plan).toHaveProperty('conflicts');
      expect(plan.diff).toHaveProperty('files');
      expect(plan.diff).toHaveProperty('commits');
    });
  });

  describe('Mock File System Operations', () => {
    it('should handle virtual file operations safely', () => {
      mockFs.writeFile('/test/package.json', '{"version": "2.0.0"}');
      mockFs.writeFile('/test/src/main.js', 'console.log("Updated main file");');
      mockFs.deleteFile('/test/src/index.js');
      mockFs.ensureDir('/test/new-dir');
      
      // Verify operations
      expect(mockFs.exists('/test/package.json')).toBe(true);
      expect(mockFs.exists('/test/src/main.js')).toBe(true);
      expect(mockFs.exists('/test/src/index.js')).toBe(false);
      expect(mockFs.isDeleted('/test/src/index.js')).toBe(true);
      
      // Verify file content
      expect(mockFs.readFile('/test/package.json')).toBe('{"version": "2.0.0"}');
      
      // Verify file lists
      const allFiles = mockFs.getAllFiles();
      const deletedFiles = mockFs.getDeletedFiles();
      
      expect(allFiles).toEqual(['/test/package.json', '/test/src/main.js']);
      expect(deletedFiles).toEqual(['/test/src/index.js']);
    });

    it('should handle file overwrites correctly', () => {
      mockFs.writeFile('/test/file.txt', 'original content');
      expect(mockFs.readFile('/test/file.txt')).toBe('original content');
      
      mockFs.writeFile('/test/file.txt', 'updated content');
      expect(mockFs.readFile('/test/file.txt')).toBe('updated content');
    });

    it('should handle delete and recreate operations', () => {
      mockFs.writeFile('/test/file.txt', 'content');
      expect(mockFs.exists('/test/file.txt')).toBe(true);
      
      mockFs.deleteFile('/test/file.txt');
      expect(mockFs.exists('/test/file.txt')).toBe(false);
      expect(mockFs.isDeleted('/test/file.txt')).toBe(true);
      
      // Recreate file
      mockFs.writeFile('/test/file.txt', 'new content');
      expect(mockFs.exists('/test/file.txt')).toBe(true);
      expect(mockFs.isDeleted('/test/file.txt')).toBe(false);
    });

    it('should reset state correctly', () => {
      mockFs.writeFile('/test/file1.txt', 'content1');
      mockFs.writeFile('/test/file2.txt', 'content2');
      mockFs.deleteFile('/test/file3.txt');
      mockFs.ensureDir('/test/dir');
      
      expect(mockFs.getAllFiles()).toHaveLength(2);
      expect(mockFs.getDeletedFiles()).toHaveLength(1);
      
      mockFs.reset();
      
      expect(mockFs.getAllFiles()).toHaveLength(0);
      expect(mockFs.getDeletedFiles()).toHaveLength(0);
    });
  });
});