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
    // Core utilities (to be implemented)
    fs: any;       // File system operations
    exec: any;     // Process execution
    logger: any;   // Logging and spinners
    prompts: any;  // Interactive user input
    temp: any;     // Temporary workspace management
    
    // Plugin utilities (to be implemented) 
    git?: any;     // Git operations
    config?: any;  // Configuration management
    telemetry?: any; // Analytics and tracking
    
    // Configuration and state
    cwd: string;   // Current working directory
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