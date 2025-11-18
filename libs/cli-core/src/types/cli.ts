// CLI interface types - using concrete types for better type safety

import type { ExecaModule } from '../core/execution/execa.js';
import type { FSModule } from '../core/execution/fs.js';
import type { Logger } from '../core/ui/logger.js';
import type { PromptsModule } from '../core/ui/prompts.js';
import type { GitModule } from '../plugins/git.js';

export interface CreateCliOptions {
  name?: string;
  version?: string;
  description?: string;
  commandsPath?: string | string[]; // Support both single path and array of paths
  autocomplete?: {
    enabled?: boolean;
    autoInstall?: boolean;
    shells?: ('bash' | 'zsh' | 'fish' | 'powershell')[];
    enableFileCompletion?: boolean;
  };
  builtinCommands?: {
    completion?: boolean; // Default: true - Shell autocomplete management
    hello?: boolean; // Default: false - Example command for learning
    version?: boolean; // Default: false - Advanced version management (conflicts with -V)
  };
  plugins?: {
    git?: boolean; // Default: false - Git operations plugin
    workspace?: boolean; // Default: false - Workspace management plugin
    updater?: boolean; // Default: false - Version update plugin
  };
  // Custom error handler for command execution errors
  errorHandler?: (error: Error) => void | Promise<void>;
  // Control CLI auto-start behavior - set to false for manual control
  autoStart?: boolean; // Default: true - automatically start CLI with parseAsync()
}

/**
 * CommandContext provides unified access to all SDK utilities
 * This interface will be passed to all commands, giving them access to:
 * - Core utilities (fs, exec, logger, prompts)
 * - Plugin functionality (git, config, telemetry)
 * - Configuration and state management
 */
export interface CommandContext {
  // Core utilities
  fs?: FSModule; // File system operations (implemented)
  execa?: ExecaModule; // Process execution (implemented)
  logger: Logger; // Logging and spinners (implemented)
  prompts: PromptsModule; // Interactive user input (implemented)
  temp?: TempModule; // Temporary workspace management (to be implemented)

  // Plugin utilities (all optional - only available when explicitly enabled)
  git?: GitModule; // Git operations (implemented, plugin)
  config?: import('../utils/config.js').ConfigType; // Configuration data (loaded config object)
  telemetry?: TelemetryModule; // Analytics and tracking (to be implemented)

  // Configuration and state
  cwd?: string; // Current working directory
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
}

/**
 * Plugin interface for extending CLI functionality
 */
export interface CLIPlugin {
  name: string;
  version?: string;
  setup?(context: CommandContext): Promise<void> | void;
  teardown?(context: CommandContext): Promise<void> | void;
}

/**
 * Configuration for the CLI SDK
 */
export interface CLIConfig {
  theme?: {
    primary?: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  telemetry?: {
    enabled: boolean;
    endpoint?: string;
  };
  verbose?: boolean;
}

/**
 * Configuration module interface for CommandContext
 */
export interface ConfigModule {
  loadConfig: typeof import('../utils/config.js').loadConfig;
  getPackageJSON: typeof import('../utils/config.js').getPackageJSON;
  // Future configuration methods will be added here
}

/**
 * Temporary workspace module interface for CommandContext
 */
export interface TempModule {
  // Temporary workspace management methods (to be implemented)
  createTempDir: (prefix?: string) => Promise<string>;
  cleanupTempDir: (path: string) => Promise<void>;
  createTempFile: (content: string, extension?: string) => Promise<string>;
  // Future temp workspace methods will be added here
}

/**
 * Telemetry module interface for CommandContext
 */
export interface TelemetryModule {
  // Analytics tracking methods (to be implemented)
  track: (event: string, data?: Record<string, string | number | boolean>) => void;
  identify: (userId: string, traits?: Record<string, string | number | boolean>) => void;
  flush: () => Promise<void>;
  // Future telemetry methods will be added here
}
