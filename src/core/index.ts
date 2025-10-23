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

// Security patterns and validation (Task 1.1.2)
export {
  PATH_TRAVERSAL_PATTERNS,
  COMMAND_INJECTION_PATTERNS,
  SCRIPT_INJECTION_PATTERNS,
  PRIVILEGE_ESCALATION_PATTERNS,
  FILE_SYSTEM_PATTERNS,
  NETWORK_PATTERNS,
  INPUT_VALIDATION_PATTERNS,
  analyzeInputSecurity,
  isPathSafe,
  isCommandSafe,
  isProjectNameSafe,
  type SecurityAnalysisResult,
  type SecurityViolation
} from './foundation/security-patterns.js';

// Framework security detection (Task 1.1.3)
export {
  detectFrameworkSecurely,
  getFrameworkSecurityRecommendations,
  isFrameworkSafe,
  TRUSTED_FRAMEWORK_DEPENDENCIES,
  SUSPICIOUS_DEPENDENCY_PATTERNS,
  DANGEROUS_SCRIPT_PATTERNS,
  type SecureFrameworkInfo,
  type FrameworkSecurityResult,
  type FrameworkSecurityViolation,
  type FrameworkDependencyInfo,
  type FrameworkBuildConfig
} from './foundation/framework-security.js';

// Input validation utilities (Task 1.2.1)
export {
  validateProjectName,
  validatePackageManager,
  sanitizeCommandArgs,
  sanitizePath,
  validateInput,
  DEFAULT_VALIDATION_CONFIG,
  TRUSTED_PACKAGE_MANAGERS,
  PROJECT_NAME_PATTERNS,
  SHELL_METACHARACTERS,
  type ValidationConfig,
  type ValidationResult,
  type InputValidationViolation
} from './foundation/input-validation.js';

// Error sanitization utilities (Task 1.3.3 - New Context Sanitization)
export {
  sanitizeErrorContext,
  createSafeErrorForForwarding,
  analyzeErrorContextSecurity,
  type ErrorContextConfig,
  type SanitizedErrorContext,
  type SensitiveContextDetection,
  DEFAULT_ERROR_CONTEXT_CONFIG
} from './foundation/error-sanitization.js';

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
  execa,
  execaSync,
  execaStream,
  type ExecResult,
  type ExecOptions
} from './execution/execa.js';

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
  type EnhancedCommand,
  type LogInjectionConfig
} from './createCLI.js';

// Memory Protection Framework
export {
  MemoryProtectionManager,
  MemorySizeCalculator,
  MemoryViolationAnalyzer,
  MemoryProtectionError,
  createMemoryGuard,
  isMemorySafe,
  truncateForMemory,
  sanitizeErrorObjectWithMemoryProtection,
  truncateMessageWithMemoryProtection,
  processContextWithMemoryProtection,
  DEFAULT_MEMORY_CONFIG,
  MemoryConfigPresets,
  type MemoryProtectionConfig,
  type MemoryProtectionLevel,
  type MemoryUsageLevel,
  type MemoryViolationType,
  type MemoryViolation,
  type MemoryAnalysisResult,
  type ProtectedOperationResult
} from './foundation/memory-protection.js';

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