#!/usr/bin/env tsx

/**
 * Bundle Analysis Script
 *
 * Analyzes the CLI SDK bundle sizes, dependencies, and optimization opportunities.
 * Provides detailed insights for performance optimization and tree-shaking effectiveness.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

// Types for better analysis
interface BundleFile {
  path: string;
  size: number;
  category: 'core' | 'plugins' | 'commands' | 'types' | 'other';
}

interface PackageJson {
  name: string;
  version: string;
  type?: string;
  sideEffects?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  exports?: Record<string, unknown>;
}

interface AnalysisResult {
  totalSize: number;
  files: BundleFile[];
  dependencies: {
    production: number;
    development: number;
    peer: number;
  };
  treeShaking: {
    enabled: boolean;
    esmOptimized: boolean;
    hasExports: boolean;
  };
  recommendations: string[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliCorePath = resolve(__dirname, '..');
const workspaceRoot = resolve(cliCorePath, '../..');
const distPath = resolve(workspaceRoot, 'dist/libs/cli-core');

console.log('📊 Lord Commander SDK Bundle Analysis');
console.log('═'.repeat(50));

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

async function categorizeFile(filePath: string): Promise<BundleFile['category']> {
  const fileName = basename(filePath).toLowerCase();
  
  // For Vite's hash-named bundles, we need to analyze content
  if (fileName === 'index.js') {
    return 'core'; // Main entry point
  }
  
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Check for core patterns first (large files with core functionality)
    const stats = await stat(filePath);
    if (stats.size > 100000) { // Files larger than 100KB are likely core
      // But check if it's actually a command file by looking for specific command patterns
      if (fileName.includes('hello') || fileName.includes('version') || 
          fileName.includes('completion') || fileName.includes('init') ||
          fileName.includes('scaffold') || fileName.includes('demo')) {
        return 'commands';
      }
      return 'core';
    }
    
    // Check for command patterns (smaller command files)
    if (content.includes('.command(') && (
        fileName.includes('hello') || fileName.includes('version') || 
        fileName.includes('completion') || fileName.includes('init') ||
        fileName.includes('scaffold') || fileName.includes('demo'))) {
      return 'commands';
    }
    
    // Check for plugin patterns
    if (content.includes('plugin') || content.includes('git') || 
        content.includes('updater') || content.includes('workspace')) {
      return 'plugins';
    }
    
    // Check for type definitions
    if (content.includes('interface ') || content.includes('type ') ||
        fileName.includes('types')) {
      return 'types';
    }
    
    return 'other';
  } catch (error) {
    return 'other';
  }
}

async function analyzeBundleSize(): Promise<{ files: BundleFile[]; totalSize: number }> {
  console.log('📦 Bundle Size Analysis');
  console.log('─'.repeat(30));

  if (!statSync(distPath).isDirectory()) {
    console.log('❌ Dist directory not found. Run `pnpm build` first.');
    return { files: [], totalSize: 0 };
  }

  const files: BundleFile[] = [];

  async function scanDir(dir: string, prefix = ''): Promise<void> {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(prefix, entry.name);

      if (entry.isDirectory()) {
        await scanDir(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const stats = statSync(fullPath);
        const category = await categorizeFile(fullPath); // Use fullPath instead of relativePath
        files.push({
          path: relativePath,
          size: stats.size,
          category,
        });
      }
    }
  }

  await scanDir(distPath);

  // Sort by size (largest first)
  files.sort((a, b) => b.size - a.size);

  let totalSize = 0;
  const categoryTotals: Record<BundleFile['category'], number> = {
    core: 0,
    plugins: 0,
    commands: 0,
    types: 0,
    other: 0,
  };

  console.log('File                           Size      Category');
  console.log('─'.repeat(55));

  for (const file of files) {
    totalSize += file.size;
    categoryTotals[file.category] += file.size;
    const sizeStr = formatBytes(file.size).padStart(8);
    const categoryStr = file.category.padStart(8);
    console.log(`${file.path.padEnd(30)} ${sizeStr} ${categoryStr}`);
  }

  console.log('─'.repeat(55));
  console.log(`Total Bundle Size:              ${formatBytes(totalSize)}`);

  // Category breakdown
  console.log('\n📂 Size by Category:');
  Object.entries(categoryTotals).forEach(([category, size]) => {
    if (size > 0) {
      const percentage = ((size / totalSize) * 100).toFixed(1);
      console.log(`  ${category.padEnd(10)} ${formatBytes(size).padStart(8)} (${percentage}%)`);
    }
  });

  // Analysis
  console.log('\n🔍 Bundle Analysis:');
  if (totalSize < 50 * 1024) {
    // 50KB
    console.log('  ✅ Excellent: Bundle size is optimal');
  } else if (totalSize < 100 * 1024) {
    // 100KB
    console.log('  ✅ Good: Bundle size is acceptable');
  } else if (totalSize < 200 * 1024) {
    // 200KB
    console.log('  ⚠️  Fair: Bundle size is getting large');
  } else {
    console.log('  ⚠️  Large: Consider optimization opportunities');
  }

  return { files, totalSize };
}

function analyzeDependencies(): { production: number; development: number; peer: number } {
  console.log('\n📋 Dependency Analysis');
  console.log('─'.repeat(30));

  const packageJson: PackageJson = JSON.parse(
    readFileSync(resolve(cliCorePath, 'package.json'), 'utf-8')
  );

  const deps = Object.keys(packageJson.dependencies || {}).length;
  const devDeps = Object.keys(packageJson.devDependencies || {}).length;
  const peerDeps = Object.keys(packageJson.peerDependencies || {}).length;

  console.log(`Production dependencies: ${deps}`);
  console.log(`Development dependencies: ${devDeps}`);
  console.log(`Peer dependencies: ${peerDeps}`);

  if (deps < 5) {
    console.log('  ✅ Lightweight: Few production dependencies');
  } else if (deps < 10) {
    console.log('  ✅ Moderate: Reasonable dependency count');
  } else {
    console.log('  ⚠️  Heavy: Many dependencies, consider tree-shaking');
  }

  // List main dependencies with estimated sizes
  if (packageJson.dependencies) {
    console.log('\n🎯 Production Dependencies:');
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      // Estimate typical sizes for common dependencies
      const estimatedSize = getEstimatedDependencySize(name);
      console.log(`  • ${name}@${version} ${estimatedSize ? `(~${estimatedSize})` : ''}`);
    });
  }

  return { production: deps, development: devDeps, peer: peerDeps };
}

function getEstimatedDependencySize(name: string): string {
  const sizes: Record<string, string> = {
    commander: '~8KB',
    picocolors: '~2KB',
    '@clack/prompts': '~15KB',
    execa: '~25KB',
    semver: '~12KB',
  };
  return sizes[name] || '';
}

function analyzeTreeShaking(): { enabled: boolean; esmOptimized: boolean; hasExports: boolean } {
  console.log('\n🌳 Tree-shaking Analysis');
  console.log('─'.repeat(30));

  const packageJson: PackageJson = JSON.parse(
    readFileSync(resolve(cliCorePath, 'package.json'), 'utf-8')
  );

  const sideEffects = packageJson.sideEffects === false;
  const esmOptimized = packageJson.type === 'module';
  const hasExports = !!packageJson.exports;

  console.log(`sideEffects: ${packageJson.sideEffects}`);
  console.log(`type: ${packageJson.type || 'commonjs'}`);
  console.log(`exports field: ${hasExports ? 'defined' : 'missing'}`);

  if (sideEffects) {
    console.log('  ✅ Tree-shaking enabled');
  } else {
    console.log('  ⚠️  Tree-shaking not fully optimized');
  }

  if (esmOptimized) {
    console.log('  ✅ ESM modules for better tree-shaking');
  } else {
    console.log('  ⚠️  Consider using ESM for better tree-shaking');
  }

  // Check exports
  if (hasExports && packageJson.exports) {
    console.log('  ✅ Modern exports field defined');
    console.log('  📤 Available selective imports:');
    Object.keys(packageJson.exports).forEach((exp) => {
      const importPath = exp === '.' ? packageJson.name : `${packageJson.name}${exp}`;
      console.log(`    • import { ... } from "${importPath}"`);
    });
  } else {
    console.log('  ⚠️  No exports field - consider adding for better tree-shaking');
  }

  return { enabled: sideEffects, esmOptimized, hasExports };
}

function generateRecommendations(analysis: Partial<AnalysisResult>): string[] {
  const recommendations: string[] = [];

  if (analysis.totalSize && analysis.totalSize > 100 * 1024) {
    recommendations.push('Consider code splitting for large applications');
  }

  if (!analysis.treeShaking?.enabled) {
    recommendations.push('Enable tree-shaking by setting "sideEffects": false');
  }

  if (!analysis.treeShaking?.esmOptimized) {
    recommendations.push('Use ESM modules for better tree-shaking');
  }

  if (!analysis.treeShaking?.hasExports) {
    recommendations.push('Add exports field to package.json for selective imports');
  }

  if (analysis.dependencies?.production && analysis.dependencies.production > 10) {
    recommendations.push('Review dependency list for potential optimizations');
  }

  recommendations.push(
    'Use selective imports: import { createCLI } from "lord-commander-poc/core"'
  );
  recommendations.push('Monitor bundle size in CI/CD pipeline');

  return recommendations;
}

async function runBundleAnalyzer(): Promise<void> {
  console.log('\n🔬 Running Bundle Analyzer');
  console.log('─'.repeat(30));

  try {
    // Check if we can run bundle analyzer
    await execa('which', ['webpack-bundle-analyzer'], {
      cwd: workspaceRoot,
      stdio: 'pipe',
    }).catch(() =>
      execa('npm', ['list', 'webpack-bundle-analyzer'], {
        cwd: workspaceRoot,
        stdio: 'pipe',
      })
    );

    console.log('📊 Generating detailed bundle analysis...');
    await execa('pnpx', ['nx', 'build', 'cli-core', '--analyze'], {
      cwd: workspaceRoot,
      stdio: 'inherit',
    });
  } catch (_error) {
    console.log('  ℹ️  Advanced bundle analysis not available');
    console.log('  💡 Install webpack-bundle-analyzer for detailed analysis');
  }
}

function generateBundleReport(analysis: AnalysisResult): void {
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    analysis,
    summary: {
      totalSizeFormatted: formatBytes(analysis.totalSize),
      largestFiles: analysis.files.slice(0, 5).map((f) => ({
        path: f.path,
        size: formatBytes(f.size),
        category: f.category,
      })),
      optimization: {
        treeShakingScore: analysis.treeShaking.enabled
          ? 100
          : analysis.treeShaking.hasExports
            ? 66
            : 33,
        dependencyCount: analysis.dependencies.production,
        sizeCategory:
          analysis.totalSize < 50 * 1024
            ? 'excellent'
            : analysis.totalSize < 100 * 1024
              ? 'good'
              : analysis.totalSize < 200 * 1024
                ? 'fair'
                : 'large',
      },
    },
  };

  // Save report for docs generation
  const reportPath = resolve(cliCorePath, 'temp-bundle-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Bundle report saved to ${reportPath}`);
}

async function main(): Promise<void> {
  // Ensure we have a built bundle
  try {
    statSync(distPath);
  } catch (_error) {
    console.log('❌ No build found. Building now...');
    await execa('pnpx', ['nx', 'build', 'cli-core'], {
      cwd: workspaceRoot,
      stdio: 'inherit',
    });
  }

  const bundleAnalysis = await analyzeBundleSize();
  const dependencyAnalysis = analyzeDependencies();
  const treeShakingAnalysis = analyzeTreeShaking();

  const analysis: AnalysisResult = {
    totalSize: bundleAnalysis.totalSize,
    files: bundleAnalysis.files,
    dependencies: dependencyAnalysis,
    treeShaking: treeShakingAnalysis,
    recommendations: [],
  };

  analysis.recommendations = generateRecommendations(analysis);

  await runBundleAnalyzer();

  console.log('\n🎯 Optimization Recommendations:');
  analysis.recommendations.forEach((rec) => {
    console.log(`  • ${rec}`);
  });

  // Generate machine-readable report
  generateBundleReport(analysis);
}

main().catch((error) => {
  console.error('\n💥 Analysis failed:', error.message);
  process.exit(1);
});
