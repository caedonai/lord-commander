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

// Foundation utilities - Core infrastructure
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
  ERROR_MESSAGES,
  type PackageManager,
  type Framework 
} from './foundation/constants.js';

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
} from './foundation/errors.js';

// User interface utilities
export { 
  createLogger,
  type Logger,
  type LoggerOptions 
} from './ui/logger.js';

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
} from './ui/prompts.js';

// Execution utilities  
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
} from './execution/fs.js';

export { 
  exec,
  execSync,
  execStream,
  type ExecResult,
  type ExecOptions
} from './execution/exec.js';

// CLI Creation and Command Registration  
export { 
  createCLI, 
  registerBuiltinCommands,
  validateErrorHandler,
  executeErrorHandlerSafely,
  ErrorHandlerValidationError,
  sanitizeErrorMessage,
  sanitizeStackTrace,
  sanitizeErrorObject,
  truncateErrorMessage,
  getObjectMemorySize,
  isDebugMode,
  shouldShowDetailedErrors,
  formatErrorForDisplay,
  sanitizeLogOutput,
  sanitizeLogOutputAdvanced,
  analyzeLogSecurity,
  type LogInjectionConfig
} from './createCLI.js';
export { registerCommands, resetCommandTracking } from './commands/registerCommands.js';

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
  checkCompletionStatus,
  type CompletionOptions,
  type CompletionContext,
  type CompletionResult,
  type InstallationOptions,
  type CompletionStatus
} from './commands/autocomplete.js';

// Re-export Commander for advanced CLI control
export { Command } from 'commander';