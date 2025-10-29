#!/usr/bin/env node

/**
 * Advanced CLI Patterns Workflow
 * 
 * Demonstrates advanced CLI patterns including error handling, 
 * validation, caching, and professional user experience.
 */

import { createCLI, type CommandContext } from '../../index.js';
import type { Command } from 'commander';

/**
 * Advanced Validation Workflow
 * Shows comprehensive input validation and error handling
 */
export async function validationWorkflow(context: CommandContext, userInput: string): Promise<void> {
  const { logger } = context;
  
  logger.intro('🔍 Input Validation Demo');
  
  // Simulate various validation steps
  const validate = logger.spinner('Validating input...');
  
  // Simulate validation logic
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (userInput.length < 3) {
    validate.fail('Input too short (minimum 3 characters)');
    logger.error('❌ Validation failed');
    return;
  }
  
  if (userInput.includes('..')) {
    validate.fail('Path traversal detected');
    logger.error('🚨 Security violation: Invalid characters');
    return;
  }
  
  validate.success('Input validation passed');
  
  // Process the validated input
  const process = logger.spinner('Processing validated input...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  process.success('Processing completed');
  
  logger.success(`✅ Successfully processed: "${userInput}"`);
  logger.outro('Validation workflow completed 🎯');
}

/**
 * Error Recovery Workflow
 * Demonstrates graceful error handling and recovery
 */
export async function errorRecoveryWorkflow(context: CommandContext, shouldFail: boolean = false): Promise<void> {
  const { logger } = context;
  
  logger.intro('⚡ Error Recovery Demo');
  
  // Step 1: Always succeeds
  const step1 = logger.spinner('Step 1: Initial setup...');
  await new Promise(resolve => setTimeout(resolve, 800));
  step1.success('Setup completed');
  
  // Step 2: May fail based on parameter
  const step2 = logger.spinner('Step 2: Critical operation...');
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  if (shouldFail) {
    step2.fail('Operation failed');
    logger.error('❌ Critical error occurred');
    
    // Recovery attempt
    const recovery = logger.spinner('Attempting recovery...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    recovery.success('Recovery successful');
    
    logger.warn('⚠️  Continuing with fallback approach');
  } else {
    step2.success('Operation completed successfully');
  }
  
  // Step 3: Cleanup (always runs)
  const cleanup = logger.spinner('Step 3: Cleanup...');
  await new Promise(resolve => setTimeout(resolve, 600));
  cleanup.success('Cleanup completed');
  
  logger.success('✅ Workflow completed with error recovery');
  logger.outro('Error handling demonstrated 🛡️');
}

/**
 * Performance Monitoring Workflow
 * Shows how to monitor and report performance metrics
 */
export async function performanceWorkflow(context: CommandContext): Promise<void> {
  const { logger } = context;
  
  logger.intro('📊 Performance Monitoring');
  
  const startTime = Date.now();
  
  // Task 1: Fast operation
  const fast = logger.spinner('Fast operation...');
  const task1Start = Date.now();
  await new Promise(resolve => setTimeout(resolve, 200));
  const task1Time = Date.now() - task1Start;
  fast.success(`Completed in ${task1Time}ms`);
  
  // Task 2: Medium operation
  const medium = logger.spinner('Medium operation...');
  const task2Start = Date.now();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const task2Time = Date.now() - task2Start;
  medium.success(`Completed in ${task2Time}ms`);
  
  // Task 3: Slow operation
  const slow = logger.spinner('Intensive operation...');
  const task3Start = Date.now();
  await new Promise(resolve => setTimeout(resolve, 2500));
  const task3Time = Date.now() - task3Start;
  slow.success(`Completed in ${task3Time}ms`);
  
  const totalTime = Date.now() - startTime;
  
  // Performance report
  logger.info('\n📈 Performance Report:');
  console.log(`   Fast operation:      ${task1Time}ms`);
  console.log(`   Medium operation:    ${task2Time}ms`);
  console.log(`   Intensive operation: ${task3Time}ms`);
  console.log(`   ─────────────────────────────`);
  console.log(`   Total time:          ${totalTime}ms`);
  
  logger.success('✅ Performance monitoring completed');
  logger.outro('Metrics collected successfully 📊');
}

/**
 * Resource Management Workflow
 * Demonstrates proper resource allocation and cleanup
 */
export async function resourceManagementWorkflow(context: CommandContext): Promise<void> {
  const { logger } = context;
  
  logger.intro('🔧 Resource Management');
  
  // Allocate resources
  const allocate = logger.spinner('Allocating resources...');
  await new Promise(resolve => setTimeout(resolve, 800));
  allocate.success('Resources allocated (Memory: 25MB, Handles: 3)');
  
  // Use resources
  const use = logger.spinner('Using allocated resources...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  use.success('Resource operations completed');
  
  // Monitor usage
  const monitor = logger.spinner('Monitoring resource usage...');
  await new Promise(resolve => setTimeout(resolve, 600));
  monitor.success('Usage within limits (Peak: 28MB)');
  
  // Cleanup resources
  const cleanup = logger.spinner('Releasing resources...');
  await new Promise(resolve => setTimeout(resolve, 400));
  cleanup.success('All resources released');
  
  logger.success('♻️ Resource management completed');
  logger.outro('No memory leaks detected 🎯');
}

/**
 * Batch Processing Workflow
 * Shows how to handle multiple items with progress reporting
 */
export async function batchProcessingWorkflow(context: CommandContext, itemCount: number = 5): Promise<void> {
  const { logger } = context;
  
  logger.intro('📦 Batch Processing');
  
  logger.info(`Processing ${itemCount} items...`);
  
  for (let i = 1; i <= itemCount; i++) {
    const item = logger.spinner(`Processing item ${i}/${itemCount}...`);
    
    // Simulate variable processing time
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    item.success(`Item ${i} processed (${Math.round(processingTime)}ms)`);
  }
  
  logger.success(`✅ Successfully processed all ${itemCount} items`);
  logger.outro('Batch processing completed 🎉');
}

/**
 * Commands that demonstrate advanced patterns
 */
export function setupAdvancedCommands(program: Command, context: CommandContext): void {
  
  program
    .command('validate')
    .description('Demonstrate input validation workflow')
    .argument('<input>', 'Input to validate')
    .action(async (input: string) => {
      try {
        await validationWorkflow(context, input);
      } catch (error) {
        context.logger.error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  
  program
    .command('error-demo')
    .description('Demonstrate error recovery workflow')
    .option('--fail', 'Force an error to demonstrate recovery')
    .action(async (options) => {
      try {
        await errorRecoveryWorkflow(context, options.fail);
      } catch (error) {
        context.logger.error(`Error demo failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  
  program
    .command('performance')
    .description('Monitor and report performance metrics')
    .action(async () => {
      try {
        await performanceWorkflow(context);
      } catch (error) {
        context.logger.error(`Performance test failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  
  program
    .command('resources')
    .description('Demonstrate resource management')
    .action(async () => {
      try {
        await resourceManagementWorkflow(context);
      } catch (error) {
        context.logger.error(`Resource management failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  
  program
    .command('batch')
    .description('Process multiple items in batch')
    .argument('[count]', 'Number of items to process', '5')
    .action(async (count: string) => {
      try {
        const itemCount = parseInt(count, 10);
        if (isNaN(itemCount) || itemCount < 1) {
          throw new Error('Count must be a positive number');
        }
        await batchProcessingWorkflow(context, itemCount);
      } catch (error) {
        context.logger.error(`Batch processing failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}

/**
 * Create CLI with advanced pattern commands
 */
export async function createAdvancedPatternsCLI() {
  return await createCLI({
    name: 'patterns-cli',
    version: '1.0.0',
    description: 'CLI demonstrating advanced patterns',
    builtinCommands: {
      completion: true,
      hello: false,
      version: false
    }
  });
}

/**
 * Demo runner for advanced patterns
 */
export async function runAdvancedPatternsDemo() {
  console.log('🎯 Lord Commander SDK - Advanced Patterns\n');
  
  console.log('Available pattern demonstrations:');
  console.log('1. 🔍 validate <input>  - Input validation & security');
  console.log('2. ⚡ error-demo        - Error recovery patterns');
  console.log('3. 📊 performance       - Performance monitoring');
  console.log('4. 🔧 resources         - Resource management');
  console.log('5. 📦 batch [count]     - Batch processing');
  
  console.log('\nAdvanced patterns include:');
  console.log('• Comprehensive input validation');
  console.log('• Graceful error handling & recovery');
  console.log('• Performance monitoring & reporting');
  console.log('• Resource allocation & cleanup');
  console.log('• Batch processing with progress');
  console.log('• Professional status reporting\n');
  
  console.log('These patterns show production-ready CLI');
  console.log('development techniques with the SDK.\n');
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdvancedPatternsDemo().catch(console.error);
}