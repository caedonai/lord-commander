#!/usr/bin/env node

/**
 * CLI Readability Enhancement Demo
 * 
 * This demo shows techniques for improving CLI readability using the SDK's enhanced functions.
 * 
 * Note: Build the project first with `pnpm build`
 */

import { 
  intro, 
  outro, 
  note, 
  createLogger,
  printSeparator,
  printSection
} from '../dist/core/index.js';

const logger = createLogger();

function printTaskProgress(current, total, task) {
  const progress = `[\x1b[2m${current}/${total}\x1b[0m]`;
  console.log(`${progress} 💭 ${task}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoBadReadability() {
  console.log('\n\x1b[31m❌ POOR READABILITY EXAMPLE:\x1b[0m\n');
  
  logger.info('Starting deployment process...');
  logger.info('What is your target environment?');
  console.log('User entered: production');
  logger.info('Validating credentials...');
  logger.success('Credentials validated');
  logger.info('Do you want to run migrations?');
  console.log('User entered: yes');
  logger.info('Building application...');
  logger.success('Build completed');
  logger.info('Should we send notifications?');
  console.log('User entered: no');
  logger.info('Deploying to production...');
  logger.success('Deployment successful');
  
  console.log('\n\x1b[33m🤔 Problems with the above:\x1b[0m');
  console.log('   • Hard to distinguish prompts from system output');
  console.log('   • No clear sections or flow');
  console.log('   • Difficult to scan when scrolling back');
  console.log('   • All text looks similar');
}

async function demoGoodReadability() {
  console.log('\n\x1b[32m✅ ENHANCED READABILITY EXAMPLE:\x1b[0m\n');
  
  intro('Application Deployment Wizard');
  
  printSeparator('Environment Configuration', 'double');
  printTaskProgress(1, 4, 'Select target environment:');
  console.log('  \x1b[36m▶\x1b[0m production');
  console.log();
  
  printSection('Credential Validation', 'Verifying deployment permissions');
  logger.info('Checking AWS credentials...');
  await sleep(500);
  logger.success('AWS credentials validated');
  logger.info('Verifying database access...');
  await sleep(300);
  logger.success('Database access confirmed');
  
  printSeparator('Database Configuration', 'heavy');
  printTaskProgress(2, 4, 'Run database migrations?');
  console.log('  \x1b[32m✓\x1b[0m Yes, run migrations');
  console.log();
  
  printSection('Build Process', 'Compiling and bundling application');
  logger.info('Installing dependencies...');
  await sleep(400);
  logger.success('Dependencies installed');
  logger.info('Running build process...');
  await sleep(600);
  logger.success('Build completed successfully');
  
  printSeparator('Notification Settings', 'heavy');
  printTaskProgress(3, 4, 'Send deployment notifications?');
  console.log('  \x1b[31m✗\x1b[0m No notifications');
  console.log();
  
  printSeparator('Deployment Execution', 'double');
  printTaskProgress(4, 4, 'Deploy to production?');
  console.log('  \x1b[32m✓\x1b[0m Confirm deployment');
  console.log();
  
  printSection('Deployment Progress', 'Executing deployment steps');
  logger.info('Uploading application files...');
  await sleep(800);
  logger.success('Files uploaded');
  logger.info('Updating server configuration...');
  await sleep(400);
  logger.success('Configuration updated');
  logger.info('Running post-deployment scripts...');
  await sleep(300);
  logger.success('Post-deployment scripts completed');
  
  printSeparator();
  outro('Deployment completed successfully! 🚀');
  
  console.log('\n\x1b[32m🎯 Benefits of the enhanced approach:\x1b[0m');
  console.log('   • \x1b[1mClear section boundaries\x1b[0m with visual separators');
  console.log('   • \x1b[1mProgress indicators\x1b[0m show where you are in the flow');
  console.log('   • \x1b[1mConsistent prompt styling\x1b[0m makes user input obvious');
  console.log('   • \x1b[1mGrouped related operations\x1b[0m with descriptive headers');
  console.log('   • \x1b[1mEasy to scan\x1b[0m when scrolling back through output');
}

async function showBestPractices() {
  console.log('\n\x1b[1m\x1b[35m📋 CLI READABILITY BEST PRACTICES:\x1b[0m\n');
  
  printSeparator('Visual Hierarchy Techniques', 'double');
  console.log('1. \x1b[1mHeavy separators\x1b[0m (━━━) for major sections');
  console.log('2. \x1b[1mLight separators\x1b[0m (───) for subsections');
  console.log('3. \x1b[1mDouble lines\x1b[0m (═══) for critical prompts');
  console.log('4. \x1b[1mSection headers\x1b[0m (▶ Title) with descriptions');
  console.log('5. \x1b[1mProgress indicators\x1b[0m [2/5] for multi-step flows');
  
  console.log();
  printSeparator('Color and Symbol Strategy', 'heavy');
  console.log('• \x1b[36m💭 Cyan for questions/prompts\x1b[0m');
  console.log('• \x1b[32m✓ Green for confirmations\x1b[0m'); 
  console.log('• \x1b[31m✗ Red for negative responses\x1b[0m');
  console.log('• \x1b[33m⚠ Yellow for warnings\x1b[0m');
  console.log('• \x1b[34mℹ Blue for information\x1b[0m');
  console.log('• \x1b[2m▶ Dim for section headers\x1b[0m');
  
  console.log();
  printSeparator('Spacing Guidelines', 'light');
  console.log('• Add blank lines before and after prompts');
  console.log('• Group related log messages together');
  console.log('• Use consistent indentation (2-4 spaces)');
  console.log('• Separate different operations with lines');
  console.log('• Add extra space around critical decisions');
}

async function runDemo() {
  console.clear();
  console.log('\x1b[1m\x1b[36m🎨 CLI Readability Enhancement Demo\x1b[0m');
  console.log('\x1b[2mShowing techniques to improve user experience when scrolling through CLI output\x1b[0m\n');
  
  console.log('Press \x1b[1mCtrl+C\x1b[0m to stop, or wait for the demo to complete...\n');
  await sleep(2000);
  
  await demoBadReadability();
  await sleep(3000);
  
  await demoGoodReadability();
  await sleep(2000);
  
  await showBestPractices();
  
  console.log('\n\x1b[1m\x1b[32m✨ Demo completed!\x1b[0m');
  console.log('\x1b[2mThese techniques are now built into your SDK for easy CLI enhancement.\x1b[0m');
}

runDemo().catch(console.error);