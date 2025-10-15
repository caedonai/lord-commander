#!/usr/bin/env node

import { parseVersion, compareVersions, getChangeType, satisfiesRange } from '../plugins/updater.js';
import { logger } from '../core/logger.js';

/**
 * Test script for the updater plugin functionality
 */
async function testUpdaterPlugin() {
  console.log('Starting updater plugin test...');
  logger.intro('Testing Updater Plugin');

  // Test semantic version parsing
  logger.step('Testing semantic version parsing...');
  try {
    const v1 = parseVersion('1.2.3');
    const v2 = parseVersion('v2.0.0-beta.1');
    const v3 = parseVersion('1.2.3+build.123');
    
    logger.success(`Parsed v1.2.3: ${JSON.stringify(v1)}`);
    logger.success(`Parsed v2.0.0-beta.1: ${JSON.stringify(v2)}`);
    logger.success(`Parsed v1.2.3+build.123: ${JSON.stringify(v3)}`);
  } catch (error) {
    logger.error(`Version parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Test version comparison
  logger.step('Testing version comparison...');
  try {
    const versions = [
      ['1.0.0', '1.0.1'],
      ['1.0.0', '1.1.0'],
      ['1.0.0', '2.0.0'],
      ['1.0.0-alpha', '1.0.0'],
      ['1.0.0-alpha.1', '1.0.0-alpha.2'],
      ['1.0.0', '1.0.0']
    ];

    for (const [a, b] of versions) {
      const vA = parseVersion(a);
      const vB = parseVersion(b);
      const comparison = compareVersions(vA, vB);
      const changeType = getChangeType(vA, vB);
      
      let result: string;
      if (comparison < 0) result = '<';
      else if (comparison > 0) result = '>';
      else result = '===';
      
      logger.info(`${a} ${result} ${b} (${changeType} change)`);
    }
  } catch (error) {
    logger.error(`Version comparison failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Test version range satisfaction
  logger.step('Testing version range satisfaction...');
  try {
    const testCases = [
      ['1.2.3', '^1.0.0', true],
      ['1.2.3', '^2.0.0', false],
      ['1.2.3', '~1.2.0', true],
      ['1.3.0', '~1.2.0', false],
      ['1.2.3', '>=1.2.0', true],
      ['1.1.9', '>=1.2.0', false],
      ['1.2.3', '1.2.3', true],
      ['1.2.4', '1.2.3', false]
    ];

    for (const [version, range, expected] of testCases) {
      const v = parseVersion(version as string);
      const satisfies = satisfiesRange(v, range as string);
      const status = satisfies === expected ? '✓' : '✗';
      logger.info(`${status} ${version} satisfies ${range}: ${satisfies} (expected: ${expected})`);
    }
  } catch (error) {
    logger.error(`Range satisfaction test failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Test git-based functionality (if in a git repo)
  logger.step('Testing git-based functionality...');
  try {
    const { getAllTags, getLatestTag, tagExists } = await import('../plugins/updater.js');
    
    const latestTag = await getLatestTag();
    logger.info(`Latest tag: ${latestTag || 'None found'}`);
    
    const allTags = await getAllTags();
    logger.info(`All tags (${allTags.length}): ${allTags.slice(0, 5).join(', ')}${allTags.length > 5 ? '...' : ''}`);
    
    if (latestTag) {
      const exists = await tagExists(latestTag);
      logger.info(`Tag ${latestTag} exists: ${exists}`);
    }
  } catch (error) {
    logger.warn(`Git functionality test skipped: ${error instanceof Error ? error.message : String(error)}`);
  }

  logger.outro('Updater plugin tests completed!');
}

// Run the test
testUpdaterPlugin().catch(error => {
  console.error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

export { testUpdaterPlugin };