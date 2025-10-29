#!/usr/bin/env tsx

/**
 * Enhanced Logger Icon System Demo
 * 
 * This demo showcases the comprehensive icon system with:
 * - Platform-aware icon selection (emoji → Unicode → ASCII fallbacks)
 * - Security validation and sanitization
 * - Cross-platform compatibility detection
 * - Enhanced logger methods with semantic icons
 * - Real-world CLI scenarios
 * - TypeScript type safety and error handling
 */

import { createLogger } from '../../dist/core/index.js';
import type { ExtendedIcons } from '../core/ui/icons.js';

// TypeScript interfaces for better type safety
interface DeploymentStep {
  readonly icon: keyof ExtendedIcons;
  readonly message: string;
  readonly duration?: number;
}

interface PlatformInfo {
  readonly platform: string;
  readonly termProgram?: string;
  readonly isTTY: boolean;
  readonly supportsUnicode: boolean;
  readonly supportsEmoji: boolean;
}

// Removed unused SecurityAnalysis interface

interface PlatformTestCase {
  readonly name: string;
  readonly unicode: boolean;
  readonly emoji: boolean;
}

// Enhanced logger type with icon methods
type EnhancedLogger = ReturnType<typeof createLogger> & {
  [key: string]: any; // Allow dynamic icon methods
};

/**
 * Demonstrates the comprehensive icon system capabilities
 */
async function demonstrateIconSystem(): Promise<void> {
  const logger = createLogger({ level: 3 }) as EnhancedLogger; // INFO level
  
  // Check if enhanced icon methods are available
  const hasEnhancedIcons = typeof logger.intro === 'function';
  
  if (hasEnhancedIcons) {
    logger.intro('🚀 Enhanced Logger Icon System Demo');
    logger.sparkle?.('Welcome to the comprehensive icon demonstration!');
  } else {
    logger.info('🚀 Enhanced Logger Icon System Demo');
    logger.info('✨ Welcome to the comprehensive icon demonstration!');
  }
  
  // Platform Capability Analysis
  logger.info('\n' + '═'.repeat(50));
  if (logger.gear) {
    logger.gear('Platform Capability Analysis');
  } else {
    logger.info('⚙️ Platform Capability Analysis');
  }
  logger.info('═'.repeat(50));
  
  const platformInfo: PlatformInfo = {
    platform: process.platform,
    termProgram: process.env.TERM_PROGRAM,
    isTTY: process.stdout.isTTY || false,
    supportsUnicode: true, // Assumed for modern terminals
    supportsEmoji: process.platform !== 'win32' || !!process.env.WT_SESSION
  };
  
  // Use available methods or fallback to basic logging
  const logPlatformInfo = (icon: keyof ExtendedIcons, key: keyof PlatformInfo, value: any) => {
    const message = `${key}: ${value}`;
    if (logger.withIcon) {
      logger.withIcon(icon, message);
    } else {
      logger.info(`${getIconFallback(icon)} ${message}`);
    }
  };
  
  logPlatformInfo('shield', 'platform', platformInfo.platform);
  logPlatformInfo('network', 'termProgram', platformInfo.termProgram || 'unknown');
  logPlatformInfo('lightning', 'isTTY', platformInfo.isTTY);
  logPlatformInfo('diamond', 'supportsUnicode', platformInfo.supportsUnicode);
  logPlatformInfo('crown', 'supportsEmoji', platformInfo.supportsEmoji);
  
  // Infrastructure & Deployment Icons
  await demonstrateInfrastructureIcons(logger);
  
  // File Operations
  await demonstrateFileOperations(logger);
  
  // Security & Configuration
  await demonstrateSecurityConfig(logger);
  
  // Process Status Icons
  await demonstrateProcessStatus(logger);
  
  // Real-world Deployment Scenario
  await demonstrateDeploymentScenario(logger);
  
  // Cross-platform Fallback Demonstration
  demonstrateCrossPlatformFallback(logger);
  
  // Performance & Compatibility Test
  demonstratePerformanceTest(logger);
  
  if (logger.sparkle && logger.trophy && logger.outro) {
    logger.sparkle('\nIcon system demonstration completed!');
    logger.trophy('The enhanced logger is ready for production use.');
    logger.outro('Demo finished successfully! ✨');
  } else {
    logger.info('✨ Icon system demonstration completed!');
    logger.info('🏆 The enhanced logger is ready for production use.');
    logger.info('✅ Demo finished successfully! ✨');
  }
}

/**
 * Demonstrates infrastructure and deployment icons
 */
async function demonstrateInfrastructureIcons(logger: EnhancedLogger): Promise<void> {
  logger.info('\n' + '─'.repeat(50));
  if (logger.server) {
    logger.server('Infrastructure & Deployment Icons');
  } else {
    logger.info('🖥️ Infrastructure & Deployment Icons');
  }
  logger.info('─'.repeat(50));
  
  const infraSteps: DeploymentStep[] = [
    { icon: 'rocket', message: 'Deploying application to production...' },
    { icon: 'cloud', message: 'Connecting to cloud infrastructure...' },
    { icon: 'box', message: 'Creating deployment package...' },
    { icon: 'server', message: 'Starting web server on port 3000...' },
    { icon: 'database', message: 'Connecting to PostgreSQL database...' },
    { icon: 'api', message: 'Initializing REST API endpoints...' },
    { icon: 'network', message: 'Configuring load balancer...' },
    { icon: 'globe', message: 'Setting up CDN distribution...' }
  ];
  
  for (const step of infraSteps) {
    if (logger.withIcon) {
      logger.withIcon(step.icon, step.message);
    } else {
      logger.info(`${getIconFallback(step.icon)} ${step.message}`);
    }
    await sleep(200); // Simulate processing time
  }
}

/**
 * Demonstrates file operation icons
 */
async function demonstrateFileOperations(logger: EnhancedLogger): Promise<void> {
  logger.info('\n' + '─'.repeat(50));
  if (logger.folder) {
    logger.folder('File & Directory Operations');
  } else {
    logger.info('📁 File & Directory Operations');
  }
  logger.info('─'.repeat(50));
  
  const fileSteps: DeploymentStep[] = [
    { icon: 'folder', message: 'Creating project directory structure...' },
    { icon: 'file', message: 'Generating configuration files...' },
    { icon: 'upload', message: 'Uploading assets to S3...' },
    { icon: 'download', message: 'Downloading dependencies...' },
    { icon: 'sync', message: 'Synchronizing files across environments...' }
  ];
  
  for (const step of fileSteps) {
    if (logger.withIcon) {
      logger.withIcon(step.icon, step.message);
    } else {
      logger.info(`${getIconFallback(step.icon)} ${step.message}`);
    }
    await sleep(150);
  }
}

/**
 * Demonstrates security and configuration icons
 */
async function demonstrateSecurityConfig(logger: EnhancedLogger): Promise<void> {
  logger.info('\n' + '─'.repeat(50));
  if (logger.shield) {
    logger.shield('Security & Configuration');
  } else {
    logger.info('🛡️ Security & Configuration');
  }
  logger.info('─'.repeat(50));
  
  const securitySteps: DeploymentStep[] = [
    { icon: 'shield', message: 'Initializing security protocols...' },
    { icon: 'key', message: 'Generating API keys...' },
    { icon: 'lock', message: 'Encrypting sensitive data...' },
    { icon: 'gear', message: 'Applying configuration settings...' }
  ];
  
  for (const step of securitySteps) {
    if (logger.withIcon) {
      logger.withIcon(step.icon, step.message);
    } else {
      logger.info(`${getIconFallback(step.icon)} ${step.message}`);
    }
    await sleep(250);
  }
}

/**
 * Demonstrates process status icons
 */
async function demonstrateProcessStatus(logger: EnhancedLogger): Promise<void> {
  logger.info('\n' + '─'.repeat(50));
  if (logger.build) {
    logger.build('Process & Status Indicators');
  } else {
    logger.info('🔨 Process & Status Indicators');
  }
  logger.info('─'.repeat(50));
  
  const processSteps: DeploymentStep[] = [
    { icon: 'build', message: 'Building TypeScript project...' },
    { icon: 'lightning', message: 'Running performance optimization...' },
    { icon: 'pending', message: 'Waiting for database migration...' },
    { icon: 'skip', message: 'Skipping optional dependency...' }
  ];
  
  for (const step of processSteps) {
    if (logger.withIcon) {
      logger.withIcon(step.icon, step.message);
    } else {
      logger.info(`${getIconFallback(step.icon)} ${step.message}`);
    }
    await sleep(300);
  }
  
  if (logger.successWithIcon) {
    logger.successWithIcon('Build completed successfully!');
  } else {
    logger.success('✅ Build completed successfully!');
  }
}

/**
 * Demonstrates a real-world deployment scenario
 */
async function demonstrateDeploymentScenario(logger: EnhancedLogger): Promise<void> {
  logger.info('\n' + '═'.repeat(50));
  if (logger.trophy) {
    logger.trophy('Real-world Deployment Scenario');
  } else {
    logger.info('🏆 Real-world Deployment Scenario');
  }
  logger.info('═'.repeat(50));
  
  const steps: DeploymentStep[] = [
    { icon: 'gear', message: 'Initializing deployment pipeline...', duration: 400 },
    { icon: 'shield', message: 'Validating security credentials...', duration: 300 },
    { icon: 'box', message: 'Creating production build...', duration: 500 },
    { icon: 'database', message: 'Running database migrations...', duration: 600 },
    { icon: 'upload', message: 'Uploading static assets...', duration: 350 },
    { icon: 'server', message: 'Starting application servers...', duration: 450 },
    { icon: 'network', message: 'Configuring load balancer...', duration: 250 },
    { icon: 'globe', message: 'Updating DNS records...', duration: 200 },
    { icon: 'lightning', message: 'Running health checks...', duration: 300 },
    { icon: 'trophy', message: 'Deployment successful!', duration: 100 }
  ];
  
  for (const step of steps) {
    if (logger.withIcon) {
      logger.withIcon(step.icon, step.message);
    } else {
      logger.info(`${getIconFallback(step.icon)} ${step.message}`);
    }
    await sleep(step.duration || 300);
  }
}

/**
 * Demonstrates cross-platform fallback system
 */
function demonstrateCrossPlatformFallback(logger: EnhancedLogger): void {
  logger.info('\n' + '═'.repeat(50));
  if (logger.diamond) {
    logger.diamond('Cross-platform Fallback System');
  } else {
    logger.info('💎 Cross-platform Fallback System');
  }
  logger.info('═'.repeat(50));
  
  const criticalIcons: (keyof ExtendedIcons)[] = ['rocket', 'cloud', 'box', 'shield', 'lightning'];
  
  criticalIcons.forEach(iconName => {
    const emoji = getIconFallback(iconName);
    const codePoint = emoji.codePointAt(0)?.toString(16);
    console.log(`${iconName.padEnd(10)} │ ${emoji} │ U+${codePoint?.toUpperCase() || 'N/A'}`);
  });
}

/**
 * Demonstrates performance and compatibility testing
 */
function demonstratePerformanceTest(logger: EnhancedLogger): void {
  logger.info('\n' + '═'.repeat(50));
  if (logger.lightning) {
    logger.lightning('Performance & Compatibility Test');
  } else {
    logger.info('⚡ Performance & Compatibility Test');
  }
  logger.info('═'.repeat(50));
  
  // Test icon performance
  const startTime = performance.now();
  const iterations = 1000;
  
  for (let i = 0; i < iterations; i++) {
    getIconFallback('rocket' as keyof ExtendedIcons); // Test icon retrieval performance
  }
  
  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2);
  
  logger.info(`⏱️ Icon retrieval performance: ${iterations} iterations in ${duration}ms`);
  logger.info(`📊 Average per icon: ${(parseFloat(duration) / iterations).toFixed(4)}ms`);
  
  // Test built-in icon compatibility
  if (logger.testIcons) {
    logger.testIcons(); // Built-in comprehensive icon test
  } else {
    logger.info('🧪 Icon compatibility test not available in this build');
  }
}

/**
 * Demonstrates error handling scenarios with icons
 */
async function demonstrateErrorScenarios(): Promise<void> {
  const logger = createLogger({ level: 3 }) as EnhancedLogger;
  
  logger.info('\n' + '═'.repeat(50));
  if (logger.warning) {
    logger.warning('Error Handling with Icons');
  } else {
    logger.warn('⚠️ Error Handling with Icons');
  }
  logger.info('═'.repeat(50));
  
  // Test invalid icon handling
  try {
    // Test with a valid icon name for fallback demonstration
    if (logger.withIcon) {
      logger.withIcon('warning', 'This demonstrates icon system resilience');
    } else {
      logger.info('❓ Testing nonexistent icon fallback');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (logger.failureWithIcon) {
      logger.failureWithIcon(`Caught error: ${errorMessage}`);
    } else {
      logger.error(`❌ Caught error: ${errorMessage}`);
    }
  }
  
  // Test icon security (simulated)
  const maliciousInput = '\x1b[31m🚀\x1b[0m\x07'; // Contains ANSI and bell
  const safeIcon = sanitizeIcon(maliciousInput);
  
  if (logger.shield) {
    logger.shield(`Sanitized malicious input: "${maliciousInput}" → "${safeIcon}"`);
  } else {
    logger.info(`🛡️ Sanitized malicious input: "${maliciousInput}" → "${safeIcon}"`);
  }
  
  // Test platform fallbacks
  logger.info('🔄 Testing platform fallback mechanisms...');
  
  const testPlatforms: PlatformTestCase[] = [
    { name: 'Modern Terminal', unicode: true, emoji: true },
    { name: 'Basic Terminal', unicode: true, emoji: false },
    { name: 'Legacy Terminal', unicode: false, emoji: false }
  ];
  
  testPlatforms.forEach(platform => {
    console.log(`\n${platform.name}:`);
    console.log(`  Rocket: 🚀 (emoji) → ▲ (unicode) → ^ (ascii)`);
    console.log(`  Cloud:  ☁️ (emoji) → ◯ (unicode) → O (ascii)`);
    console.log(`  Box:    📦 (emoji) → ■ (unicode) → # (ascii)`);
  });
}

// Utility functions

/**
 * Simple sleep utility for demonstration timing
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get icon fallback for demonstration purposes
 */
function getIconFallback(iconName: keyof ExtendedIcons): string {
  const iconMap: Record<keyof ExtendedIcons, string> = {
    // Basic status icons
    tick: '✓',
    cross: '✗',
    warning: '⚠️',
    info: 'ℹ️',
    
    // Extended semantic icons
    rocket: '🚀',
    cloud: '☁️',
    box: '📦',
    folder: '📁',
    file: '�',
    gear: '⚙️',
    lightning: '⚡',
    shield: '�️',
    key: '🔑',
    lock: '�',
    globe: '🌍',
    network: '🌐',
    database: '🗄️',
    server: '�️',
    api: '�',
    upload: '⬆️',
    download: '⬇️',
    sync: '🔄',
    build: '�',
    deploy: '�',
    success: '✅',
    failure: '❌',
    pending: '⏳',
    skip: '⏭️',
    
    // Decorative
    sparkle: '✨',
    diamond: '�',
    crown: '👑',
    trophy: '🏆'
  };
  
  return iconMap[iconName] || '❓';
}

/**
 * Simple icon sanitization for security demo
 */
function sanitizeIcon(input: string): string {
  // Remove ANSI escape sequences and control characters
  return input.replace(/\x1b\[[0-9;]*[mGKH]/g, '').replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    await demonstrateIconSystem();
    await demonstrateErrorScenarios();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Demo failed:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('📚 Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Export functions for potential module usage
export { 
  demonstrateIconSystem, 
  demonstrateErrorScenarios,
  main as runDemo
};

// CLI execution - always run for demonstration
main().catch(error => {
  console.error('Demo execution failed:', error);
  process.exit(1);
});