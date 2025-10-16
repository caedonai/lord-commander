/**
 * Core SDK modules - Essential utilities that form the foundation
 * 
 * These modules provide the fundamental building blocks for CLI applications:
 * - Process execution and file system operations
 * - Logging, prompts, and error handling
 * - Version management and temporary workspaces
 * 
 * Tree-shakeable exports - import only what you need:
 * import { logger } from '@caedonai/lord-commander/core/logger';
 * import { exec } from '@caedonai/lord-commander/core/exec'; 
 */

// Explicit named exports for better tree-shaking
export { 
  PACKAGE_MANAGER_COMMANDS, 
  DEFAULT_IGNORE_PATTERNS,
  TEMP_DIR_PREFIX,
  CLI_CONFIG_PATHS,
  FRAMEWORK_PATTERNS,
  FILE_EXTENSIONS,
  DEFAULT_PORTS,
  GIT_PATTERNS,
  TELEMETRY_CONFIG,
  BRANDING,
  type PackageManager,
  type Framework 
} from './constants.js';

export { 
  CLIError, 
  ProcessError, 
  FileSystemError,
  NetworkError,
  ConfigurationError,
  ValidationError,
  UserCancelledError,
  ERROR_RECOVERY_SUGGESTIONS,
  isCancel,
  handleCancel,
  gracefulExit,
  formatError,
  getRecoverySuggestion,
  withErrorHandling,
  setupGlobalErrorHandlers
} from './errors.js';

export { 
  createLogger,
  type Logger,
  type LoggerOptions 
} from './logger.js';

export { 
  exists,
  stat,
  ensureDir,
  remove,
  readFile,
  writeFile,
  readJSON,
  writeJSON,
  copyFile,
  readDir,
  copyDir,
  copy,
  findFiles,
  cleanDir,
  getSize,
  move,
  type FileStats,
  type FileOperationOptions,
  type CopyOptions,
  type DirectoryEntry
} from './fs.js';

export { 
  exec,
  execSync,
  execStream,
  type ExecResult,
  type ExecOptions
} from './exec.js';

export { 
  confirm,
  select,
  multiselect,
  text,
  password,
  spinner,
  outro,
  intro,
  note,
  cancel,
  log,
  type SelectOption,
  type MultiSelectOption
} from './prompts.js';

// CLI Creation and Command Registration
export { createCLI } from './createCLI.js';
export { registerCommands } from './registerCommands.js';

// Shell Autocomplete Support
export { 
  analyzeProgram,
  generateCompletion,
  generateCompletionScript,
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion,
  generatePowerShellCompletion,
  installCompletion,
  uninstallCompletion,
  detectShell,
  type CompletionOptions,
  type CompletionContext,
  type CompletionResult,
  type InstallationOptions
} from './autocomplete.js';

// Re-export Commander for advanced CLI control
export { Command } from 'commander';