#!/usr/bin/env node

/**
 * Enhanced Logger Icon System Demo
 * 
 * This demo showcases the new comprehensive icon system with:
 * - Platform-aware icon selection (emoji → Unicode → ASCII fallbacks)
 * - Security validation and sanitization
 * - Cross-platform compatibility detection
 * - Enhanced logger methods with semantic icons
 * - Real-world CLI scenarios
 */

import { createLogger, IconProvider, PlatformCapabilities, IconSecurity } from '../dist/core/index.js';

async function demonstrateIconSystem() {
  const logger = createLogger({ level: 3 }); // INFO level
  
  logger.intro('🚀 Enhanced Logger Icon System Demo');
  logger.sparkle('Welcome to the comprehensive icon demonstration!');
  
  // Platform Capability Analysis
  logger.info('\\n' + '═'.repeat(50));
  logger.gear('Platform Capability Analysis');
  logger.info('═'.repeat(50));
  
  const platformInfo = PlatformCapabilities.getInfo();
  logger.shield(`Platform: ${platformInfo.platform}`);
  logger.network(`Terminal: ${platformInfo.termProgram || 'unknown'}`);
  logger.lightning(`TTY Support: ${platformInfo.isTTY}`);
  logger.diamond(`Unicode Support: ${platformInfo.supportsUnicode}`);
  logger.crown(`Emoji Support: ${platformInfo.supportsEmoji}`);
  
  // Infrastructure & Deployment Icons
  logger.info('\\n' + '─'.repeat(50));
  logger.server('Infrastructure & Deployment Icons');
  logger.info('─'.repeat(50));
  
  logger.rocket('Deploying application to production...');
  logger.cloud('Connecting to cloud infrastructure...');
  logger.package('Creating deployment package...');
  logger.server('Starting web server on port 3000...');
  logger.database('Connecting to PostgreSQL database...');
  logger.api('Initializing REST API endpoints...');
  logger.network('Configuring load balancer...');
  logger.globe('Setting up CDN distribution...');
  
  // File Operations
  logger.info('\\n' + '─'.repeat(50));
  logger.folder('File & Directory Operations');
  logger.info('─'.repeat(50));
  
  logger.folder('Creating project directory structure...');
  logger.file('Generating configuration files...');
  logger.upload('Uploading assets to S3...');
  logger.download('Downloading dependencies...');
  logger.sync('Synchronizing files across environments...');
  
  // Security & Configuration
  logger.info('\\n' + '─'.repeat(50));
  logger.shield('Security & Configuration');
  logger.info('─'.repeat(50));
  
  logger.shield('Initializing security protocols...');
  logger.key('Generating API keys...');
  logger.lock('Encrypting sensitive data...');
  logger.gear('Applying configuration settings...');
  
  // Process Status Icons
  logger.info('\\n' + '─'.repeat(50));
  logger.build('Process & Status Indicators');
  logger.info('─'.repeat(50));
  
  logger.build('Building TypeScript project...');
  logger.lightning('Running performance optimization...');
  logger.pending('Waiting for database migration...');
  logger.skip('Skipping optional dependency...');
  logger.successWithIcon('Build completed successfully!');
  
  // Real-world Deployment Scenario
  logger.info('\\n' + '═'.repeat(50));
  logger.trophy('Real-world Deployment Scenario');
  logger.info('═'.repeat(50));
  
  const steps = [
    { icon: 'gear', message: 'Initializing deployment pipeline...' },
    { icon: 'shield', message: 'Validating security credentials...' },
    { icon: 'box', message: 'Creating production build...' },
    { icon: 'database', message: 'Running database migrations...' },
    { icon: 'upload', message: 'Uploading static assets...' },
    { icon: 'server', message: 'Starting application servers...' },
    { icon: 'network', message: 'Configuring load balancer...' },
    { icon: 'globe', message: 'Updating DNS records...' },
    { icon: 'lightning', message: 'Running health checks...' },
    { icon: 'trophy', message: 'Deployment successful!' }
  ];
  
  for (const step of steps) {
    logger.withIcon(step.icon, step.message);
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Icon Security Analysis
  logger.info('\\n' + '═'.repeat(50));
  logger.shield('Icon Security Analysis');
  logger.info('═'.repeat(50));
  
  const testIcons = ['🚀', '⚡', '🔒', '\\x1b[31mmalicious\\x1b[0m', 'safe-text'];
  
  testIcons.forEach(icon => {
    const analysis = IconSecurity.analyzeIconSecurity(icon);
    const status = analysis.isSecure ? logger.getSafeIcon('tick') : logger.getSafeIcon('cross');
    
    console.log(`${status} Icon: "${icon}" - Security: ${analysis.isSecure ? 'SAFE' : 'UNSAFE'}`);
    
    if (analysis.issues.length > 0) {
      console.log(`   Issues: ${analysis.issues.join(', ')}`);
    }
    
    if (analysis.warnings.length > 0) {
      console.log(`   Warnings: ${analysis.warnings.join(', ')}`);
    }
  });
  
  // Cross-platform Fallback Demonstration
  logger.info('\\n' + '═'.repeat(50));
  logger.diamond('Cross-platform Fallback System');
  logger.info('═'.repeat(50));
  
  const icons = IconProvider.getIcons();
  const criticalIcons = ['rocket', 'cloud', 'box', 'shield', 'lightning'];
  
  criticalIcons.forEach(iconName => {
    const icon = icons[iconName];
    const codePoint = icon.codePointAt(0)?.toString(16);
    console.log(`${iconName.padEnd(10)} │ ${icon} │ U+${codePoint?.toUpperCase()}`);
  });
  
  // Performance & Compatibility Test
  logger.info('\\n' + '═'.repeat(50));
  logger.lightning('Performance & Compatibility Test');
  logger.info('═'.repeat(50));
  
  logger.testIcons(); // Built-in comprehensive icon test
  
  logger.sparkle('\\nIcon system demonstration completed!');
  logger.trophy('The enhanced logger is ready for production use.');
  
  logger.outro('Demo finished successfully! ✨');
}

// Error handling demonstration
async function demonstrateErrorScenarios() {
  const logger = createLogger({ level: 3 });
  
  logger.info('\\n' + '═'.repeat(50));
  logger.warning('Error Handling with Icons');
  logger.info('═'.repeat(50));
  
  // Test invalid icon handling
  try {
    logger.withIcon('nonexistent', 'This should fallback gracefully');
  } catch (error) {
    logger.failureWithIcon(`Caught error: ${error.message}`);
  }
  
  // Test icon security
  const maliciousInput = '\\x1b[31m🚀\\x1b[0m\\x07'; // Contains ANSI and bell
  const safeIcon = IconSecurity.sanitizeIcon(maliciousInput);
  logger.shield(`Sanitized malicious input: "${maliciousInput}" → "${safeIcon}"`);
  
  // Test platform fallbacks
  PlatformCapabilities.reset(); // Reset for different platform simulation
  logger.gear('Testing platform fallback mechanisms...');
  
  const testPlatforms = [
    { name: 'Modern Terminal', unicode: true, emoji: true },
    { name: 'Basic Terminal', unicode: true, emoji: false },
    { name: 'Legacy Terminal', unicode: false, emoji: false }
  ];
  
  testPlatforms.forEach(platform => {
    console.log(`\\n${platform.name}:`);
    // Note: In real implementation, you'd mock the platform detection
    console.log(`  Rocket: ${'🚀'} (emoji) → ${'▲'} (unicode) → ${'^'} (ascii)`);
    console.log(`  Cloud:  ${'☁️'} (emoji) → ${'◯'} (unicode) → ${'O'} (ascii)`);
    console.log(`  Box:    ${'📦'} (emoji) → ${'■'} (unicode) → ${'#'} (ascii)`);
  });
}

// Main execution
async function main() {
  try {
    await demonstrateIconSystem();
    await demonstrateErrorScenarios();
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { demonstrateIconSystem, demonstrateErrorScenarios };