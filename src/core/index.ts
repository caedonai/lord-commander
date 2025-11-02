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
 * import { execa } from '@caedonai/lord-commander/core/execa';
 */

// Re-export Commander for advanced CLI control
export { Command } from 'commander';
// Shell Autocomplete Support
export {
  analyzeProgram,
  type CompletionContext,
  type CompletionOptions,
  type CompletionResult,
  type CompletionStatus,
  checkCompletionStatus,
  detectShell,
  generateBashCompletion,
  generateCompletion,
  generateCompletionScript,
  generateFishCompletion,
  generatePowerShellCompletion,
  generateZshCompletion,
  type InstallationOptions,
  installCompletion,
  uninstallCompletion,
} from './commands/autocomplete.js';
export { registerCommands, resetCommandTracking } from './commands/registerCommands.js';
// CLI Creation and Command Registration
export {
  analyzeLogSecurity,
  createCLI,
  type EnhancedCommand,
  ErrorHandlerValidationError,
  executeErrorHandlerSafely,
  formatErrorForDisplay,
  getObjectMemorySize,
  isDebugMode,
  type LogInjectionConfig,
  registerBuiltinCommands,
  sanitizeErrorMessage,
  sanitizeErrorObject,
  sanitizeLogOutput,
  sanitizeLogOutputAdvanced,
  sanitizeStackTrace,
  shouldShowDetailedErrors,
  truncateErrorMessage,
  validateErrorHandler,
} from './createCLI.js';
export {
  type ExecOptions,
  type ExecResult,
  execa,
  execaStream,
  execaSync,
} from './execution/execa.js';
// Execution utilities
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
} from './execution/fs.js';
// Foundation utilities - Core infrastructure
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
} from './foundation/core/constants.js';
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
} from './foundation/errors/errors.js';
// Error sanitization utilities (Task 1.3.3 - New Context Sanitization)
export {
  analyzeErrorContextSecurity,
  createSafeErrorForForwarding,
  DEFAULT_ERROR_CONTEXT_CONFIG,
  type ErrorContextConfig,
  type SanitizedErrorContext,
  type SensitiveContextDetection,
  sanitizeErrorContext,
} from './foundation/errors/sanitization.js';
// Memory Protection Framework
export {
  createMemoryGuard,
  DEFAULT_MEMORY_CONFIG,
  isMemorySafe,
  type MemoryAnalysisResult,
  MemoryConfigPresets,
  type MemoryProtectionConfig,
  MemoryProtectionError,
  type MemoryProtectionLevel,
  MemoryProtectionManager,
  MemorySizeCalculator,
  type MemoryUsageLevel,
  type MemoryViolation,
  MemoryViolationAnalyzer,
  type MemoryViolationType,
  type ProtectedOperationResult,
  processContextWithMemoryProtection,
  sanitizeErrorObjectWithMemoryProtection,
  truncateForMemory,
  truncateMessageWithMemoryProtection,
} from './foundation/memory/protection.js';
// Framework security detection (Task 1.1.3)
export {
  DANGEROUS_SCRIPT_PATTERNS,
  detectFrameworkSecurely,
  type FrameworkBuildConfig,
  type FrameworkDependencyInfo,
  type FrameworkSecurityResult,
  type FrameworkSecurityViolation,
  getFrameworkSecurityRecommendations,
  isFrameworkSafe,
  type SecureFrameworkInfo,
  SUSPICIOUS_DEPENDENCY_PATTERNS,
  TRUSTED_FRAMEWORK_DEPENDENCIES,
} from './foundation/security/framework.js';
// Security patterns and validation (Task 1.1.2)
export {
  analyzeInputSecurity,
  COMMAND_INJECTION_PATTERNS,
  FILE_SYSTEM_PATTERNS,
  INPUT_VALIDATION_PATTERNS,
  isCommandSafe,
  isPathSafe,
  isProjectNameSafe,
  NETWORK_PATTERNS,
  PATH_TRAVERSAL_PATTERNS,
  PRIVILEGE_ESCALATION_PATTERNS,
  SCRIPT_INJECTION_PATTERNS,
  type SecurityAnalysisResult,
  type SecurityViolation,
} from './foundation/security/patterns.js';
// Input validation utilities (Task 1.2.1)
export {
  DEFAULT_VALIDATION_CONFIG,
  type InputValidationViolation,
  PROJECT_NAME_PATTERNS,
  SHELL_METACHARACTERS,
  sanitizeCommandArgs,
  sanitizePath,
  TRUSTED_PACKAGE_MANAGERS,
  type ValidationConfig,
  type ValidationResult,
  validateInput,
  validatePackageManager,
  validateProjectName,
} from './foundation/security/validation.js';
export {
  type ExtendedIcons,
  IconProvider,
  IconSecurity,
  icons,
  PlatformCapabilities,
  platformInfo,
} from './ui/icons.js';
// User interface utilities
export {
  createLogger,
  type Logger,
  type LoggerOptions,
} from './ui/logger.js';
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
  printPromptFooter,
  printPromptHeader,
  printSection,
  printSeparator,
  printSpacing,
  printTaskComplete,
  printTaskStart,
  type SelectOption,
  select,
  spinner,
  text,
} from './ui/prompts.js';
