// CLI interface types - using unknown for compatibility with type assertions in commands

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
  fs?: unknown; // File system operations (implemented)
  execa?: unknown; // Process execution (implemented)
  logger: unknown; // Logging and spinners (implemented)
  prompts: unknown; // Interactive user input (implemented)
  temp?: unknown; // Temporary workspace management (to be implemented)

  // Plugin utilities (all optional - only available when explicitly enabled)
  git?: unknown; // Git operations (implemented, plugin)
  config?: unknown; // Configuration management (to be implemented)
  telemetry?: unknown; // Analytics and tracking (to be implemented)

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
