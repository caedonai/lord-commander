#!/usr/bin/env node

/**
 * Simple Icon Test
 * 
 * Simple test to verify icon functionality works
 */

import { createLogger } from '../dist/core/index.js';

try {
  console.log('Starting simple icon test...');
  
  const logger = createLogger({ level: 3 });
  
  console.log('Logger created successfully');
  
  logger.info('Basic info message');
  logger.success('Success message');
  
  // Test icon methods if they exist
  if (typeof logger.rocket === 'function') {
    logger.rocket('Rocket launch successful! 🚀');
  } else {
    console.log('rocket method not available');
  }
  
  if (typeof logger.cloud === 'function') {
    logger.cloud('Cloud deployment ready ☁️');
  } else {
    console.log('cloud method not available');
  }
  
  console.log('Simple icon test completed successfully!');
  
} catch (error) {
  console.error('Error in simple icon test:', error);
  console.error('Stack:', error.stack);
}