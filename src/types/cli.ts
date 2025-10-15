export interface CreateCliOptions {
    name?: string;
    version?: string;
    description?: string;
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
    fs?: any;      // File system operations (implemented)
    exec?: any;    // Process execution (implemented)
    logger: any;   // Logging and spinners (implemented)
    prompts: any;  // Interactive user input (implemented)
    temp?: any;    // Temporary workspace management (to be implemented)
    
    // Plugin utilities
    git: any;      // Git operations (implemented)
    config?: any;  // Configuration management (to be implemented)
    telemetry?: any; // Analytics and tracking (to be implemented)
    
    // Configuration and state
    cwd?: string;  // Current working directory
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