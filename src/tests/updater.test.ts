/**
 * Updater Plugin - Basic Test Suite
 * 
 * Tests core semantic version functionality and basic git operations
 * using Vitest framework.
 */

import { describe, it, expect } from 'vitest';
import { parseVersion, compareVersions, getChangeType, satisfiesRange, getAllTags, getLatestTag, tagExists } from '../plugins/updater.js';

describe('Updater Plugin - Basic Tests', () => {
  describe('Semantic Version Parsing', () => {
    it('should parse basic semantic versions correctly', () => {
      const v1 = parseVersion('1.2.3');
      expect(v1).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        raw: '1.2.3'
      });
    });

    it('should parse versions with v prefix', () => {
      const v2 = parseVersion('v2.0.0-beta.1');
      expect(v2).toEqual({
        major: 2,
        minor: 0,
        patch: 0,
        prerelease: 'beta.1',
        raw: 'v2.0.0-beta.1'
      });
    });

    it('should parse versions with build metadata', () => {
      const v3 = parseVersion('1.2.3+build.123');
      expect(v3).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        build: 'build.123',
        raw: '1.2.3+build.123'
      });
    });

    it('should parse complex versions with prerelease and build', () => {
      const v4 = parseVersion('2.0.0-beta.2+build.123');
      expect(v4).toEqual({
        major: 2,
        minor: 0,
        patch: 0,
        prerelease: 'beta.2',
        build: 'build.123',
        raw: '2.0.0-beta.2+build.123'
      });
    });

    it('should throw error for invalid versions', () => {
      expect(() => parseVersion('invalid')).toThrow('Invalid semantic version');
      expect(() => parseVersion('1.2')).toThrow('Invalid semantic version');
      expect(() => parseVersion('1.2.3.4')).toThrow('Invalid semantic version');
    });
  });

  describe('Version Comparison', () => {
    const testCases = [
      { v1: '1.0.0', v2: '1.0.1', expected: -1, changeType: 'patch' },
      { v1: '1.0.0', v2: '1.1.0', expected: -1, changeType: 'minor' },
      { v1: '1.0.0', v2: '2.0.0', expected: -1, changeType: 'major' },
      { v1: '1.0.0-alpha', v2: '1.0.0', expected: -1, changeType: 'prerelease' },
      { v1: '1.0.0-alpha.1', v2: '1.0.0-alpha.2', expected: -1, changeType: 'prerelease' },
      { v1: '1.0.0', v2: '1.0.0', expected: 0, changeType: 'none' },
      { v1: '2.0.0', v2: '1.0.0', expected: 1, changeType: 'major' }
    ];

    testCases.forEach(({ v1, v2, expected, changeType }) => {
      it(`should compare ${v1} and ${v2} correctly`, () => {
        const version1 = parseVersion(v1);
        const version2 = parseVersion(v2);
        const comparison = compareVersions(version1, version2);
        const actualChangeType = getChangeType(version1, version2);

        expect(comparison).toBe(expected);
        expect(actualChangeType).toBe(changeType);
      });
    });

    it('should handle prerelease precedence correctly', () => {
      // Normal version has higher precedence than prerelease
      const normal = parseVersion('1.0.0');
      const prerelease = parseVersion('1.0.0-alpha');
      expect(compareVersions(prerelease, normal)).toBe(-1);
      expect(compareVersions(normal, prerelease)).toBe(1);

      // Numeric prerelease comparison
      const alpha1 = parseVersion('1.0.0-alpha.1');
      const alpha2 = parseVersion('1.0.0-alpha.2');
      expect(compareVersions(alpha1, alpha2)).toBe(-1);

      // Mixed prerelease comparison
      const alpha = parseVersion('1.0.0-alpha');
      const beta = parseVersion('1.0.0-beta');
      expect(compareVersions(alpha, beta)).toBe(-1);
    });
  });

  describe('Version Range Satisfaction', () => {
    const rangeCases = [
      { version: '1.2.3', range: '^1.0.0', expected: true, description: 'caret range - compatible' },
      { version: '1.2.3', range: '^2.0.0', expected: false, description: 'caret range - incompatible' },
      { version: '1.2.3', range: '~1.2.0', expected: true, description: 'tilde range - compatible' },
      { version: '1.3.0', range: '~1.2.0', expected: false, description: 'tilde range - incompatible' },
      { version: '1.2.3', range: '>=1.2.0', expected: true, description: 'greater than or equal - satisfied' },
      { version: '1.1.9', range: '>=1.2.0', expected: false, description: 'greater than or equal - not satisfied' },
      { version: '1.2.3', range: '>1.2.0', expected: true, description: 'greater than - satisfied' },
      { version: '1.2.0', range: '>1.2.0', expected: false, description: 'greater than - not satisfied' },
      { version: '1.2.3', range: '<=1.3.0', expected: true, description: 'less than or equal - satisfied' },
      { version: '1.4.0', range: '<=1.3.0', expected: false, description: 'less than or equal - not satisfied' },
      { version: '1.2.3', range: '<1.3.0', expected: true, description: 'less than - satisfied' },
      { version: '1.3.0', range: '<1.3.0', expected: false, description: 'less than - not satisfied' },
      { version: '1.2.3', range: '1.2.3', expected: true, description: 'exact match - satisfied' },
      { version: '1.2.4', range: '1.2.3', expected: false, description: 'exact match - not satisfied' }
    ];

    rangeCases.forEach(({ version, range, expected, description }) => {
      it(`should handle ${description}`, () => {
        const v = parseVersion(version);
        const satisfies = satisfiesRange(v, range);
        expect(satisfies).toBe(expected);
      });
    });
  });

  describe('Git Operations (Current Repository)', () => {
    it('should get all tags from current repository', async () => {
      const tags = await getAllTags();
      expect(Array.isArray(tags)).toBe(true);
      // Tags might be empty in a new repo, that's okay
    });

    it('should get latest tag from current repository', async () => {
      const latestTag = await getLatestTag();
      // Latest tag might be null in a new repo, that's okay
      if (latestTag) {
        expect(typeof latestTag).toBe('string');
        expect(latestTag.length).toBeGreaterThan(0);
      } else {
        expect(latestTag).toBeNull();
      }
    });

    it('should check if non-existent tag exists', async () => {
      const exists = await tagExists('v99.99.99-nonexistent');
      expect(exists).toBe(false);
    });

    it('should validate existing tags if any exist', async () => {
      const tags = await getAllTags();
      
      if (tags.length > 0) {
        // Test the first tag
        const firstTag = tags[0];
        const exists = await tagExists(firstTag);
        expect(exists).toBe(true);

        // Verify it's a valid semver (or at least a string)
        expect(typeof firstTag).toBe('string');
        expect(firstTag.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Change Type Detection', () => {
    it('should detect major changes', () => {
      const from = parseVersion('1.0.0');
      const to = parseVersion('2.0.0');
      expect(getChangeType(from, to)).toBe('major');
    });

    it('should detect minor changes', () => {
      const from = parseVersion('1.0.0');
      const to = parseVersion('1.1.0');
      expect(getChangeType(from, to)).toBe('minor');
    });

    it('should detect patch changes', () => {
      const from = parseVersion('1.0.0');
      const to = parseVersion('1.0.1');
      expect(getChangeType(from, to)).toBe('patch');
    });

    it('should detect prerelease changes', () => {
      const from = parseVersion('1.0.0');
      const to = parseVersion('1.0.0-alpha');
      expect(getChangeType(from, to)).toBe('prerelease');

      const from2 = parseVersion('1.0.0-alpha');
      const to2 = parseVersion('1.0.0-beta');
      expect(getChangeType(from2, to2)).toBe('prerelease');
    });

    it('should detect no change', () => {
      const from = parseVersion('1.0.0');
      const to = parseVersion('1.0.0');
      expect(getChangeType(from, to)).toBe('none');
    });
  });

  describe('Edge Cases', () => {
    it('should handle large version numbers', () => {
      const version = parseVersion('999.999.999');
      expect(version.major).toBe(999);
      expect(version.minor).toBe(999);
      expect(version.patch).toBe(999);
    });

    it('should handle complex prerelease identifiers', () => {
      const version = parseVersion('1.0.0-alpha.1.2.3');
      expect(version.prerelease).toBe('alpha.1.2.3');

      const version2 = parseVersion('1.0.0-x.7.z.92');
      expect(version2.prerelease).toBe('x.7.z.92');
    });

    it('should handle complex build metadata', () => {
      const version = parseVersion('1.0.0+20130313144700');
      expect(version.build).toBe('20130313144700');

      const version2 = parseVersion('1.0.0-beta+exp.sha.5114f85');
      expect(version2.prerelease).toBe('beta');
      expect(version2.build).toBe('exp.sha.5114f85');
    });

    it('should preserve original version string', () => {
      const inputs = [
        'v1.2.3',
        '1.2.3-alpha.1',
        '1.2.3+build.123',
        'v2.0.0-beta.1+exp.sha.5114f85'
      ];

      inputs.forEach(input => {
        const version = parseVersion(input);
        expect(version.raw).toBe(input);
      });
    });
  });
});