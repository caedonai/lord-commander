import fs from 'node:fs';
import path from 'node:path';

import type { ConfigValue } from '../types/common.js';

export interface ConfigType {
  [key: string]: ConfigValue;
}

/**
 * Load configuration from a .config file in the current directory
 */
export function loadConfig(appName: string): ConfigType {
  const configPath = path.join(process.cwd(), `.${appName.toLowerCase()}rc`);

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to parse config file: ${error}`);
    }
  }

  return {};
}

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  [key: string]: unknown;
}

export function getPackageJSON(startDir: string): PackageJson {
  const dir = path.resolve(startDir);

  const pathCandidate = path.join(dir, 'package.json');
  if (fs.existsSync(pathCandidate)) {
    const pkgJSON: PackageJson = JSON.parse(fs.readFileSync(pathCandidate, 'utf8'));
    return pkgJSON;
  }

  return {};
}

import { logger } from '../core/ui/logger.js';
import type { CreateCliOptions } from '../types/cli';

/**
 * Resolve CLI defaults by combining provided options, package.json and fallbacks.
 */
export default function resolveCliDefaults(options: CreateCliOptions = {}) {
  let pkgJSON: CreateCliOptions = {};
  try {
    pkgJSON = getPackageJSON(process.cwd());
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to read package.json: ${error.message}`);
    }
  }

  return {
    name: options.name || pkgJSON.name || 'CLI Tool',
    version: options.version || pkgJSON.version || '0.1.0',
    description: options.description || pkgJSON.description || '',
  };
}
