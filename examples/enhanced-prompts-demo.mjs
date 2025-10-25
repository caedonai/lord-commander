#!/usr/bin/env node

/**
 * Enhanced Prompts Demo
 * 
 * This demo shows the new visual separation features for better CLI readability.
 * Run with: node examples/enhanced-prompts-demo.mjs
 * 
 * Note: Build the project first with `pnpm build`
 */

import { 
  intro,
  outro,
  createLogger,
  printSeparator,
  printSection,
  printTaskStart,
  printTaskComplete,
  printSpacing,
  printPromptHeader,
  printPromptFooter
} from '../dist/core/index.js';


const logger = createLogger();

async function demoBasicSeparators() {
  console.log('\n🎯 Demo: Basic Visual Separators\n');
  
  printSeparator('Light Separator');
  console.log('Some log output here...');
  console.log('More application output...');
  
  printSeparator('Heavy Separator', 'heavy');
  console.log('Another section of output...');
  
  printSeparator('Double Line Separator', 'double');
  console.log('Final section...');
  
  printSeparator(); // Empty separator
}

async function demoSectionHeaders() {
  console.log('\n🎯 Demo: Section Headers and Tasks\n');
  
  printSection('Configuration Setup', 'Setting up your application configuration');
  
  printTaskStart('Loading configuration files');
  await new Promise(resolve => setTimeout(resolve, 1000));
  printTaskComplete('Configuration files loaded');
  
  printTaskStart('Validating settings');
  await new Promise(resolve => setTimeout(resolve, 800));
  printTaskComplete('Settings validated');
  
  printTaskStart('Connecting to database');
  await new Promise(resolve => setTimeout(resolve, 500));
  printTaskComplete('Database connection failed', false);
  
  printSpacing(2);
}

async function demoEnhancedPrompts() {
  console.log('\n🎯 Demo: Enhanced Prompts (Simulated)\n');
  
  // Note: These would normally be interactive, but for demo we'll just show the visual structure
  console.log('This would show enhanced prompts with visual separation:');
  
  printPromptHeader('Project Setup');
  
  printSection('Basic Information');
  console.log('💭 What is your project name? my-awesome-project');
  printSpacing();
  
  console.log('💭 Choose your package manager:');
  console.log('  > npm');
  console.log('    pnpm');
  console.log('    yarn');
  printSpacing();
  
  printSection('Advanced Configuration');
  console.log('💭 Enable TypeScript? Yes');
  printSpacing();
  
  printPromptFooter();
}

async function demoPromptFlow() {
  console.log('\n🎯 Demo: Prompt Flow with Progress (Simulated)\n');
  
  printPromptHeader('Deploy Application');
  
  console.log('[1/4] 💭 Select environment: production');
  printSpacing();
  
  console.log('[2/4] 💭 Confirm deployment? Yes');
  printSpacing();
  
  console.log('[3/4] 💭 Run database migrations? Yes');
  printSpacing();
  
  console.log('[4/4] 💭 Send notification? Yes');
  
  printPromptFooter();
}

async function demoMixedOutput() {
  console.log('\n🎯 Demo: Mixed Prompts and Log Output\n');
  
  intro('Starting application deployment');
  
  printSection('Pre-deployment Checks');
  logger.info('Checking system requirements...');
  logger.success('System requirements met');
  logger.info('Validating credentials...');
  logger.success('Credentials validated');
  
  printSection('User Input Required');
  console.log('💭 Deployment target: staging');
  printSpacing();
  
  printSection('Deployment Process');
  logger.info('Building application...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  logger.success('Build completed');
  
  logger.info('Uploading files...');
  await new Promise(resolve => setTimeout(resolve, 800));
  logger.success('Files uploaded');
  
  logger.info('Running post-deployment scripts...');
  await new Promise(resolve => setTimeout(resolve, 500));
  logger.success('Post-deployment scripts completed');
  
  outro('Deployment completed successfully!');
}

async function runDemo() {
  console.clear();
  console.log('🚀 Enhanced CLI Prompts Demo\n');
  console.log('This demo shows various techniques for improving CLI readability\n');
  
  await demoBasicSeparators();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await demoSectionHeaders();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await demoEnhancedPrompts();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await demoPromptFlow();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await demoMixedOutput();
  
  console.log('\n✨ Demo completed! These techniques help users easily distinguish:');
  console.log('   • User input prompts vs. log output');
  console.log('   • Different sections of the CLI flow');
  console.log('   • Progress through multi-step processes');
  console.log('   • Task status and completion');
}

runDemo().catch(console.error);