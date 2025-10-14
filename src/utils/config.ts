import fs from 'fs';
import path from 'path';

export interface ConfigType {
  [key: string]: any;
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
