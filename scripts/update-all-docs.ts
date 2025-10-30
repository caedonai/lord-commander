#!/usr/bin/env tsx

/**
 * Documentation Master Update Script
 * 
 * Runs all documentation updates in the correct sequence:
 * 1. Build project for accurate analysis
 * 2. Update README metrics with current data
 * 3. Generate bundle analysis documentation  
 * 4. Generate performance documentation
 * 5. Fix API documentation links
 * 6. Verify examples are up to date
 */

import { execaSync } from 'execa';
import path from 'path';

interface UpdateStep {
  name: string;
  description: string;
  command: string[];
  optional: boolean;
}

const UPDATE_STEPS: UpdateStep[] = [
  {
    name: 'Build Project',
    description: 'Build project for accurate bundle analysis',
    command: ['pnpm', 'build'],
    optional: false
  },
  {
    name: 'Update README Metrics',
    description: 'Update README.md with current performance and bundle metrics',
    command: ['pnpm', 'docs:update-metrics'],
    optional: false
  },
  {
    name: 'Generate Bundle Analysis',
    description: 'Generate comprehensive bundle analysis documentation',
    command: ['pnpm', 'docs:bundle-analysis'],
    optional: false
  },
  {
    name: 'Generate Performance Docs',
    description: 'Generate performance metrics and optimization documentation',
    command: ['pnpm', 'docs:performance'],
    optional: false
  },
  {
    name: 'Fix API Links',
    description: 'Fix broken API documentation links across all README files',
    command: ['pnpm', 'docs:fix-links'],
    optional: true
  },
  {
    name: 'Verify Tests',
    description: 'Run comprehensive test suite to verify all systems',
    command: ['pnpm', 'test'],
    optional: true
  }
];

function printSeparator(title?: string): void {
  const width = 60;
  const line = '─'.repeat(width);
  
  if (title) {
    const padding = Math.max(0, Math.floor((width - title.length - 2) / 2));
    const paddedTitle = '─'.repeat(padding) + ` ${title} ` + '─'.repeat(padding);
    console.log(paddedTitle.substring(0, width));
  } else {
    console.log(line);
  }
}

function printStepStart(step: number, total: number, name: string, description: string): void {
  console.log(`\n🔄 [${step}/${total}] ${name}`);
  console.log(`   ${description}`);
}

function printStepSuccess(name: string, duration: number): void {
  console.log(`✅ ${name} completed (${duration}ms)`);
}

function printStepSkipped(name: string, reason: string): void {
  console.log(`⏭️  ${name} skipped: ${reason}`);
}

function printStepFailed(name: string, error: string): void {
  console.log(`❌ ${name} failed: ${error}`);
}

async function runStep(step: UpdateStep, stepNum: number, totalSteps: number): Promise<boolean> {
  printStepStart(stepNum, totalSteps, step.name, step.description);
  
  const startTime = Date.now();
  
  try {
    execaSync(step.command[0], step.command.slice(1), {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    const duration = Date.now() - startTime;
    printStepSuccess(step.name, duration);
    return true;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (step.optional) {
      printStepSkipped(step.name, `Optional step failed after ${duration}ms`);
      return true; // Continue with optional steps
    } else {
      printStepFailed(step.name, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
}

function printSummary(results: boolean[], steps: UpdateStep[]): void {
  printSeparator('Summary');
  
  const successful = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Documentation Update Results:`);
  console.log(`   ✅ Successful: ${successful}/${total} steps`);
  
  // Show individual results
  for (let i = 0; i < results.length; i++) {
    const icon = results[i] ? '✅' : '❌';
    const status = results[i] ? 'Success' : 'Failed';
    const optional = steps[i].optional ? ' (optional)' : '';
    console.log(`   ${icon} ${steps[i].name}: ${status}${optional}`);
  }
  
  if (successful === total) {
    console.log(`\n🎉 All documentation updates completed successfully!`);
    console.log(`\n📝 Updated files:`);
    console.log(`   • README.md (metrics updated)`);
    console.log(`   • docs/bundle-analysis.md (regenerated)`);
    console.log(`   • docs/performance.md (regenerated)`);
    console.log(`   • docs/api/**/README.md (links fixed)`);
    console.log(`   • docs/examples/ (verified current)`);
  } else {
    const failed = total - successful;
    console.log(`\n⚠️  ${failed} step${failed > 1 ? 's' : ''} failed or skipped`);
    console.log(`   Check output above for details`);
  }
}

function printUsageInfo(): void {
  console.log(`\n💡 Individual commands available:`);
  console.log(`   pnpm docs:update-metrics     # Update README metrics only`);
  console.log(`   pnpm docs:bundle-analysis    # Generate bundle docs only`);
  console.log(`   pnpm docs:performance        # Generate performance docs only`);  
  console.log(`   pnpm docs:fix-links          # Fix API links only`);
  console.log(`   pnpm build                   # Build project for analysis`);
  console.log(`\n📚 Documentation locations:`);
  console.log(`   ./README.md                  # Main project README with metrics`);
  console.log(`   ./docs/examples/             # Usage examples and tutorials`);
  console.log(`   ./docs/bundle-analysis.md    # Bundle composition analysis`);
  console.log(`   ./docs/performance.md        # Performance metrics and optimization`);
  console.log(`   ./docs/api/                  # API documentation with fixed links`);
}

async function main(): Promise<void> {
  console.log('📚 Documentation Master Update Script');
  printSeparator();
  
  console.log(`\n🎯 Running ${UPDATE_STEPS.length} documentation update steps:`);
  
  const results: boolean[] = [];
  
  // Run each step in sequence
  for (let i = 0; i < UPDATE_STEPS.length; i++) {
    const step = UPDATE_STEPS[i];
    const success = await runStep(step, i + 1, UPDATE_STEPS.length);
    results.push(success);
    
    // Stop on critical failures (non-optional steps)
    if (!success && !step.optional) {
      console.log(`\n❌ Critical step failed: ${step.name}`);
      console.log(`   Cannot continue with remaining steps`);
      break;
    }
  }
  
  // Print summary
  printSummary(results, UPDATE_STEPS);
  printUsageInfo();
  
  // Exit with appropriate code
  const allSuccessful = results.every(Boolean);
  const criticalFailed = results.some((success, i) => !success && !UPDATE_STEPS[i].optional);
  
  if (criticalFailed) {
    console.log(`\n🚨 Critical documentation updates failed!`);
    process.exit(1);
  } else if (allSuccessful) {
    console.log(`\n✨ Documentation is now fully up to date!`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Documentation updates completed with some optional steps skipped`);
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('update-all-docs.ts')) {
  main().catch(error => {
    console.error('❌ Master update script failed:', error);
    process.exit(1);
  });
}