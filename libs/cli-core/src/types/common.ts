/**
 * Common utility types for the lord-commander-poc project
 * These types replace `any` usage with more specific, type-safe alternatives
 */

// Generic utility types
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// Error handling types
export type ErrorContext = Record<string, JsonValue>;
export type ErrorHandler = (error: Error) => void | Promise<void>;

// Configuration types
export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray;
export type ConfigObject = { [key: string]: ConfigValue };
export type ConfigArray = ConfigValue[];

// File system types
export type FileSystemData = JsonValue;
export type PackageJsonExports = Record<string, string | { [key: string]: string }>;

// Memory sanitization types
export type SanitizableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SanitizableObject
  | SanitizableArray
  | Date
  | RegExp
  | Buffer
  | Error
  | Function;

export type SanitizableObject = { [key: string]: SanitizableValue };
export type SanitizableArray = SanitizableValue[];

// Process/execution types
export type ProcessEnv = Record<string, string | undefined>;
export type ExecOptions = {
  cwd?: string;
  env?: ProcessEnv;
  shell?: boolean | string;
  timeout?: number;
} & Record<string, ConfigValue>;

// Test types
export type TestSpy = {
  mockImplementation: (fn: (...args: unknown[]) => unknown) => void;
  mockReturnValue: (value: unknown) => void;
  [key: string]: unknown;
};

export type MockFunction<
  T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown,
> = {
  (...args: Parameters<T>): ReturnType<T>;
  mockImplementation: (fn: T) => void;
  mockReturnValue: (value: ReturnType<T>) => void;
  [key: string]: unknown;
};

// UI/Logger types
export type LoggerMethod = (...args: (string | number | boolean)[]) => void;
export type PromptMethod = (options: {
  message: string;
  [key: string]: ConfigValue;
}) => Promise<unknown>;

// Command types
export type CommandOptions = Record<string, ConfigValue>;
export type CommandArguments = string[];

// Generic object types with constraints
export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>;
export type StrictRecord<K extends string | number | symbol, T> = Record<K, T>;

// Event/callback types
export type EventListener = (...args: unknown[]) => void | Promise<void>;
export type EventMap = Record<string, EventListener>;

// Validation types
export type ValidationResult<T = unknown> = {
  isValid: boolean;
  value?: T;
  errors?: string[];
};

// HTTP/Network types (if needed)
export type HttpHeaders = Record<string, string>;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Shell/completion types
export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd';
export type CompletionData = {
  name: string;
  description?: string;
  options?: string[];
} & Record<string, ConfigValue>;

// Plugin types
export type PluginOptions = ConfigObject;
export type PluginResult<T = ConfigValue> = {
  success: boolean;
  result?: T;
  error?: string;
};

// Workspace types
export type WorkspacePackage = {
  name: string;
  version: string;
  path: string;
  dependencies?: Record<string, string>;
} & Record<string, ConfigValue>;

// Git types
export type GitTag = {
  name: string;
  hash: string;
  date: Date;
  message?: string;
};

export type GitCommit = {
  hash: string;
  message: string;
  author: string;
  date: Date;
} & Record<string, ConfigValue>;

// Utility type for gradual migration from any
export type TODO_REPLACE_ANY = unknown;

/**
 * File system operations interface
 */
export interface FileSystemOperations {
  exists: (filePath: string) => boolean;
  stat: (filePath: string) => Promise<unknown>;
  ensureDir: (dirPath: string) => Promise<void>;
  remove: (targetPath: string, options?: { recursive?: boolean }) => Promise<void>;
  readFile: (filePath: string, encoding?: string) => Promise<string>;
  writeFile: (filePath: string, data: string, encoding?: string) => Promise<void>;
  readJSON: <T = JsonValue>(filePath: string) => Promise<T>;
  writeJSON: (filePath: string, data: JsonValue, options?: unknown) => Promise<void>;
  copyFile: (src: string, dest: string, options?: unknown) => Promise<void>;
  copyDir: (src: string, dest: string, options?: unknown) => Promise<void>;
  copy: (src: string, dest: string, options?: unknown) => Promise<void>;
  readDir: (dirPath: string, options?: unknown) => Promise<unknown[]>;
  findFiles: (dirPath: string, pattern: string, options?: unknown) => Promise<string[]>;
  cleanDir: (dirPath: string) => Promise<void>;
  getSize: (targetPath: string) => Promise<number>;
  move: (src: string, dest: string, options?: unknown) => Promise<void>;
}

/**
 * Process execution interface
 */
export interface ProcessExecution {
  (command: string, args?: string[], options?: unknown): Promise<unknown>;
  sync: (command: string, args?: string[], options?: unknown) => unknown;
  stream: (command: string, args?: string[], options?: unknown) => Promise<unknown>;
  withOutput: (command: string, args?: string[], options?: unknown) => Promise<unknown>;
  commandExists: (command: string) => Promise<boolean>;
  detectPackageManager: (cwd?: string) => Promise<unknown>;
  runPackageManager: (
    action: string,
    packageOrScript?: string,
    options?: unknown
  ) => Promise<unknown>;
  git: (subcommand: string, args?: string[], options?: unknown) => Promise<unknown>;
  createCancellable: () => unknown;
  sequence: (commands: unknown[], options?: unknown) => Promise<unknown[]>;
  parallel: (commands: unknown[], options?: unknown) => Promise<unknown[]>;
}

/**
 * Logger interface
 */
export interface LoggerInterface {
  intro: (message: string, showBrand?: boolean) => void;
  outro: (message: string) => void;
  info: (message: string) => void;
  success: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string | Error) => void;
  debug: (message: string, data?: unknown) => void;
  verbose: (message: string, data?: unknown) => void;
  spinner: (message: string) => unknown;
  enableVerbose: () => void;
  enableDebug: () => void;
  setLevel: (level: string) => void;
  step: (message: string, stepNumber?: number, totalSteps?: number) => void;
  note: (message: string, title?: string) => void;
  log: (message: string) => void;
  table: (data: Record<string, string | number | boolean>) => void;
  stopAllSpinners: (message?: string) => void;
}

/**
 * Prompts interface
 */
export interface PromptsInterface {
  text: (message: string, options?: unknown) => Promise<string>;
  confirm: (message: string, options?: unknown) => Promise<boolean>;
  select: <T = string>(message: string, options: unknown) => Promise<T>;
  multiselect: <T = string>(message: string, options: unknown) => Promise<T[]>;
  enhancedText: (options: unknown) => Promise<string>;
  enhancedConfirm: (options: unknown) => Promise<boolean>;
  enhancedSelect: <T = string>(options: unknown) => Promise<T>;
  intro: (message: string, options?: unknown) => void;
  outro: (message: string, options?: unknown) => void;
  printSeparator: (title?: string, style?: string) => void;
  printSection: (title: string, content?: string) => void;
  printTaskStart: (task: string) => void;
  printTaskComplete: (task: string, success?: boolean) => void;
  printSpacing: (lines?: number) => void;
  setTheme: (theme: unknown) => void;
  getTheme: () => unknown;
  PromptFlow: new (title: string, totalSteps: number) => unknown;
}

/**
 * Git operations interface
 */
export interface GitOperations {
  init: (directory?: string) => Promise<void>;
  clone: (url: string, directory: string, options?: unknown) => Promise<void>;
  add: (files: string | string[], options?: unknown) => Promise<void>;
  commit: (message: string, options?: unknown) => Promise<void>;
  push: (remote?: string, branch?: string, options?: unknown) => Promise<void>;
  pull: (remote?: string, branch?: string, options?: unknown) => Promise<void>;
  status: (options?: unknown) => Promise<unknown>;
  diff: (from?: string, to?: string, options?: unknown) => Promise<string>;
  tag: (tagName: string, options?: unknown) => Promise<void>;
  getTagDiff: (fromTag: string, toTag: string) => Promise<unknown>;
} // Use this temporarily during migration

// Type guards
export function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (typeof value === 'object') {
    return Object.values(value as object).every(isJsonValue);
  }
  return false;
}

export function isConfigValue(value: unknown): value is ConfigValue {
  return isJsonValue(value); // Config values follow JSON structure
}

export function isSanitizableValue(value: unknown): value is SanitizableValue {
  if (isJsonValue(value)) return true;
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    Buffer.isBuffer(value) ||
    value instanceof Error
  ) {
    return true;
  }
  return false;
}
