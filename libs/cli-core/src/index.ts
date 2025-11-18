/**
 * @lord-commander/cli-core - CLI SDK Framework Library
 *
 * A comprehensive toolkit for building professional-grade command-line tools.
 * Extracts and systematizes patterns from industry-leading CLIs into
 * composable, reusable modules.
 */

// ===== PHASE 2: GRANULAR EXPORTS FOR OPTIMAL TREE-SHAKING =====
// Individual function exports for maximum tree-shaking efficiency
// Import only what you need: import { execa, createLogger } from '@lord-commander/cli-core';

// ===== BACKWARD COMPATIBILITY (DEPRECATED) =====
// These namespace exports are deprecated but maintained for compatibility
// @deprecated Use individual function imports instead. Will be removed in v2.0.0
export * as core from './core';
// === Autocomplete Support ===
export {
  type CompletionContext,
  type CompletionOptions,
  type CompletionResult,
  type CompletionStatus,
  checkCompletionStatus,
  detectShell,
  generateCompletion,
  generateCompletionScript,
  type InstallationOptions,
  installCompletion,
  uninstallCompletion,
} from './core/commands/autocomplete.js';
// === Command Registration ===
export {
  registerCommands,
  resetCommandTracking,
} from './core/commands/registerCommands.js';
// === Core CLI Functions ===
export { createCLI } from './core/createCLI.js';
// === Execution Utilities ===
export {
  type ExecOptions,
  type ExecResult,
  execa,
  execaStream,
  execaSync,
} from './core/execution/execa.js';
// === File System Operations ===
export {
  type CopyOptions,
  cleanDir,
  copy,
  copyDir,
  copyFile,
  type DirectoryEntry,
  ensureDir,
  exists,
  type FileOperationOptions,
  type FileStats,
  findFiles,
  getSize,
  move,
  readDir,
  readFile,
  readJSON,
  remove,
  stat,
  writeFile,
  writeJSON,
} from './core/execution/fs.js';
// === Constants ===
export {
  BRANDING,
  CLI_CONFIG_PATHS,
  DEFAULT_IGNORE_PATTERNS,
  DEFAULT_PORTS,
  ERROR_MESSAGES,
  FILE_EXTENSIONS,
  FRAMEWORK_PATTERNS,
  type Framework,
  GIT_PATTERNS,
  PACKAGE_MANAGER_COMMANDS,
  type PackageManager,
  TELEMETRY_CONFIG,
  TEMP_DIR_PREFIX,
} from './core/foundation/core/constants.js';

// === Error Handling ===
export {
  CLIError,
  ConfigurationError,
  ERROR_RECOVERY_SUGGESTIONS,
  FileSystemError,
  formatError,
  getRecoverySuggestion,
  gracefulExit,
  handleCancel,
  isCancel,
  NetworkError,
  ProcessError,
  setupGlobalErrorHandlers,
  UserCancelledError,
  ValidationError,
  withErrorHandling,
} from './core/foundation/errors/errors.js';

// === Security ===
export {
  analyzeInputSecurity,
  isCommandSafe,
  isPathSafe,
  isProjectNameSafe,
  type SecurityAnalysisResult,
  type SecurityViolation,
} from './core/foundation/security/patterns.js';

export {
  DEFAULT_VALIDATION_CONFIG,
  type InputValidationViolation,
  sanitizeCommandArgs,
  sanitizePath,
  type ValidationConfig,
  type ValidationResult,
  validateInput,
  validatePackageManager,
  validateProjectName,
} from './core/foundation/security/validation.js';
export { Command } from './core/index.js';
export {
  type ExtendedIcons,
  IconProvider,
  IconSecurity,
  icons,
  PlatformCapabilities,
  platformInfo,
} from './core/ui/icons.js';
// === User Interface ===
export {
  createLogger,
  type Logger,
  type LoggerOptions,
} from './core/ui/logger.js';
export {
  cancel,
  confirm,
  enhancedConfirm,
  enhancedSelect,
  enhancedText,
  intro,
  log,
  type MultiSelectOption,
  multiselect,
  note,
  outro,
  PromptFlow,
  password,
  type SelectOption,
  select,
  spinner,
  text,
} from './core/ui/prompts.js';

// @deprecated Use individual plugin imports instead. Will be removed in v2.0.0
export * as plugins from './plugins';

// TypeScript interfaces and types
export * from './types';
