#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * 
 * Analyzes the CLI SDK bundle sizes, dependencies, and optimization opportunities.
 */

import { execa } from 'execa';
import { statSync, readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '..');
const distPath = resolve(rootPath, 'dist');

console.log('📊 Lord Commander SDK Bundle Analysis');
console.log('═'.repeat(50));

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundleSize() {
  console.log('📦 Bundle Size Analysis');
  console.log('─'.repeat(30));
  
  if (!statSync(distPath).isDirectory()) {
    console.log('❌ Dist directory not found. Run `pnpm build` first.');
    return;
  }
  
  const files = [];
  
  function scanDir(dir, prefix = '') {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(prefix, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const stats = statSync(fullPath);
        files.push({
          path: relativePath,
          size: stats.size
        });
      }
    }
  }
  
  scanDir(distPath);
  
  // Sort by size (largest first)
  files.sort((a, b) => b.size - a.size);
  
  let totalSize = 0;
  console.log('File                           Size');
  console.log('─'.repeat(40));
  
  for (const file of files) {
    totalSize += file.size;
    const sizeStr = formatBytes(file.size).padStart(8);
    console.log(`${file.path.padEnd(30)} ${sizeStr}`);
  }
  
  console.log('─'.repeat(40));
  console.log(`Total Bundle Size:              ${formatBytes(totalSize)}`);
  
  // Analysis
  console.log('\n🔍 Bundle Analysis:');
  if (totalSize < 50 * 1024) { // 50KB
    console.log('  ✅ Excellent: Bundle size is optimal');
  } else if (totalSize < 100 * 1024) { // 100KB
    console.log('  ✅ Good: Bundle size is acceptable');
  } else if (totalSize < 200 * 1024) { // 200KB
    console.log('  ⚠️  Fair: Bundle size is getting large');
  } else {
    console.log('  ⚠️  Large: Consider optimization opportunities');
  }
}

function analyzeDependencies() {
  console.log('\n📋 Dependency Analysis');
  console.log('─'.repeat(30));
  
  const packageJson = JSON.parse(readFileSync(resolve(rootPath, 'package.json'), 'utf-8'));
  
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
  
  // List main dependencies
  if (packageJson.dependencies) {
    console.log('\n🎯 Main Dependencies:');
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      console.log(`  • ${name}@${version}`);
    });
  }
}

function analyzeTreeShaking() {
  console.log('\n🌳 Tree-shaking Analysis');
  console.log('─'.repeat(30));
  
  // Check if we have tree-shaking optimizations
  const packageJson = JSON.parse(readFileSync(resolve(rootPath, 'package.json'), 'utf-8'));
  
  console.log(`sideEffects: ${packageJson.sideEffects}`);
  console.log(`type: ${packageJson.type || 'commonjs'}`);
  
  if (packageJson.sideEffects === false) {
    console.log('  ✅ Tree-shaking enabled');
  } else {
    console.log('  ⚠️  Tree-shaking not fully optimized');
  }
  
  if (packageJson.type === 'module') {
    console.log('  ✅ ESM modules for better tree-shaking');
  } else {
    console.log('  ⚠️  Consider using ESM for better tree-shaking');
  }
  
  // Check exports
  if (packageJson.exports) {
    console.log('  ✅ Modern exports field defined');
    console.log('  📤 Available imports:');
    Object.keys(packageJson.exports).forEach(exp => {
      console.log(`    • import { ... } from "lord-commander-poc${exp === '.' ? '' : exp}"`);
    });
  } else {
    console.log('  ⚠️  No exports field - consider adding for better tree-shaking');
  }
}

async function runBundleAnalyzer() {
  console.log('\n🔬 Running Bundle Analyzer');
  console.log('─'.repeat(30));
  
  try {
    // Check if we can run bundle analyzer  
    await execa('which', ['webpack-bundle-analyzer'], {
      cwd: rootPath,
      stdio: 'pipe'
    }).catch(() => execa('npm', ['list', 'webpack-bundle-analyzer'], {
      cwd: rootPath,
      stdio: 'pipe'
    }));
    
    console.log('📊 Generating detailed bundle analysis...');
    await execa('pnpm', ['build', '--analyze'], {
      cwd: rootPath,
      stdio: 'inherit'
    });
    
  } catch (error) {
    console.log('  ℹ️  Advanced bundle analysis not available');
    console.log('  💡 Install webpack-bundle-analyzer for detailed analysis');
  }
}

async function main() {
  // Ensure we have a built bundle
  try {
    statSync(distPath);
  } catch (error) {
    console.log('❌ No build found. Building now...');
    await execa('pnpm', ['build'], { 
      cwd: rootPath, 
      stdio: 'inherit'
    });
  }
  
  analyzeBundleSize();
  analyzeDependencies();
  analyzeTreeShaking();
  await runBundleAnalyzer();
  
  console.log('\n🎯 Optimization Recommendations:');
  console.log('  • Use selective imports: import { createCLI } from "lord-commander-poc/core"');
  console.log('  • Enable tree-shaking in your bundler');
  console.log('  • Consider code splitting for large applications');
  console.log('  • Monitor bundle size in CI/CD pipeline');
}

main().catch(error => {
  console.error('\n💥 Analysis failed:', error.message);
  process.exit(1);
});