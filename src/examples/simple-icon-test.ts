#!/usr/bin/env tsx

/**
 * Simple Icon Test
 * 
 * Simple test to verify icon functionality works across platforms
 * Demonstrates basic logger usage with TypeScript integration
 */

import { createLogger, type Logger } from '../../dist/core/index.js';

// Use type assertion for enhanced logger methods
type EnhancedLogger = Logger & {
  rocket?: (message: string) => void;
  cloud?: (message: string) => void;
  [key: string]: any; // Allow dynamic icon methods
};

async function runIconTest(): Promise<void> {
  try {
    console.log('🧪 Starting simple icon test...');
    
    const logger = createLogger({ level: 3 }) as EnhancedLogger;
    
    console.log('✅ Logger created successfully');
    
    // Basic logging methods
    logger.info('📝 Basic info message');
    logger.success('🎉 Success message with semantic meaning');
    logger.warn('⚠️ Warning message for attention');
    
    // Test enhanced icon methods if they exist
    if (typeof logger.rocket === 'function') {
      logger.rocket('Rocket launch successful! 🚀');
    } else {
      logger.info('ℹ️ rocket method not available (expected in some builds)');
    }
    
    if (typeof logger.cloud === 'function') {
      logger.cloud('Cloud deployment ready ☁️');
    } else {
      logger.info('ℹ️ cloud method not available (expected in some builds)');
    }
    
    // Test generic withIcon method
    if (typeof logger.withIcon === 'function') {
      logger.withIcon('sparkle', 'Generic icon method working! ✨');
    }
    
    // Platform detection example
    const platform = process.platform;
    const isWindows = platform === 'win32';
    const isMacOS = platform === 'darwin';
    const isLinux = platform === 'linux';
    
    logger.info(`🖥️ Platform detected: ${platform}`);
    logger.info(`${isWindows ? '🪟' : isMacOS ? '🍎' : isLinux ? '🐧' : '💻'} OS-specific icon test`);
    
    // Terminal capability detection
    const isTTY = process.stdout.isTTY;
    const termProgram = process.env.TERM_PROGRAM;
    
    logger.info(`📟 TTY support: ${isTTY ? '✅' : '❌'}`);
    if (termProgram) {
      logger.info(`🔧 Terminal program: ${termProgram}`);
    }
    
    console.log('🎯 Simple icon test completed successfully!');
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error('❌ Error in simple icon test:', errorMessage);
    console.error('📚 Stack:', errorStack);
    process.exit(1);
  }
}

// Export for potential module usage
export { runIconTest };

// Run if called directly - always run for demonstration
runIconTest().catch(error => {
  console.error('Icon test execution failed:', error);
  process.exit(1);
});