import * as clack from '@clack/prompts';
import chalk from 'chalk';
import figures from 'figures';
import { CLIError } from '../foundation/errors/index.js';

export type PromptTheme = {
  prefix: string;
  symbol: {
    info: string;
    success: string;
    warning: string;
    error: string;
    question: string;
    pointer: string;
    pointerSmall: string;
    line: string;
    lineWithBreaks: string;
    lineBreak: string;
  };
  style: {
    info: (text: string) => string;
    success: (text: string) => string;
    warning: (text: string) => string;
    error: (text: string) => string;
    question: (text: string) => string;
    answer: (text: string) => string;
    highlight: (text: string) => string;
    muted: (text: string) => string;
    dim: (text: string) => string;
  };
};

export const DEFAULT_THEME: PromptTheme = {
  prefix: '⚡',
  symbol: {
    info: figures.info,
    success: figures.tick,
    warning: figures.warning,
    error: figures.cross,
    question: figures.questionMarkPrefix,
    pointer: figures.pointer,
    pointerSmall: figures.pointerSmall,
    line: figures.line,
    lineWithBreaks: figures.lineUpDownLeft,
    lineBreak: figures.lineBold,
  },
  style: {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    question: chalk.cyan,
    answer: chalk.white.bold,
    highlight: chalk.magenta,
    muted: chalk.gray,
    dim: chalk.dim,
  },
};

export interface SelectOption<T = string> {
  value: T;
  label?: string;
  hint?: string;
}

export interface MultiSelectOption<T = string> extends SelectOption<T> {
  selected?: boolean;
}

export interface PromptOptions {
  theme?: Partial<PromptTheme>;
  validate?: (value: string) => string | undefined;
  placeholder?: string;
  initialValue?: string;
  required?: boolean;
}

export interface SelectPromptOptions<T = string> extends Omit<PromptOptions, 'validate'> {
  maxItems?: number;
  validate?: (value: T) => string | undefined;
}

export interface MultiSelectPromptOptions<T = string> extends Omit<PromptOptions, 'validate'> {
  maxItems?: number;
  required?: boolean;
  validate?: (values: T[]) => string | undefined;
}

export interface ConfirmPromptOptions extends Omit<PromptOptions, 'validate' | 'initialValue'> {
  active?: string;
  inactive?: string;
  initialValue?: boolean;
}

let currentTheme: PromptTheme = DEFAULT_THEME;

export function setTheme(theme: Partial<PromptTheme>): void {
  currentTheme = { ...DEFAULT_THEME, ...theme };
}

export function getTheme(): PromptTheme {
  return currentTheme;
}

/**
 * Display an introductory message at the start of a CLI flow
 */
export function intro(message: string, options?: { theme?: Partial<PromptTheme> }): void {
  const theme = options?.theme ? { ...currentTheme, ...options.theme } : currentTheme;
  
  clack.intro(theme.style.info(`${theme.prefix} ${message}`));
}

/**
 * Display a closing message at the end of a CLI flow
 */
export function outro(message: string, options?: { theme?: Partial<PromptTheme> }): void {
  const theme = options?.theme ? { ...currentTheme, ...options.theme } : currentTheme;
  
  clack.outro(theme.style.success(`${theme.symbol.success} ${message}`));
}

/**
 * Display an informational note
 */
export function note(message: string, title?: string): void {
  const theme = currentTheme;
  const formattedTitle = title ? theme.style.info(title) : undefined;
  
  clack.note(message, formattedTitle);
}

/**
 * Display a log message with styling
 */
export function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  const theme = currentTheme;
  const symbol = theme.symbol[type] || theme.symbol.info;
  const style = theme.style[type] || theme.style.info;
  
  clack.log.message(style(`${symbol} ${message}`));
}

/**
 * Create a spinner for long-running operations
 */
export function spinner(): {
  start: (message?: string) => void;
  stop: (message?: string, code?: number) => void;
  message: (message: string) => void;
} {
  const s = clack.spinner();
  
  return {
    start: (message?: string) => {
      const theme = currentTheme;
      s.start(message ? theme.style.info(message) : 'Loading...');
    },
    stop: (message?: string, code?: number) => {
      const theme = currentTheme;
      if (code === 0 || code === undefined) {
        s.stop(message ? theme.style.success(`${theme.symbol.success} ${message}`) : 'Done');
      } else {
        s.stop(message ? theme.style.error(`${theme.symbol.error} ${message}`) : 'Failed');
      }
    },
    message: (message: string) => {
      const theme = currentTheme;
      s.message(theme.style.info(message));
    },
  };
}

/**
 * Prompt for text input
 */
export async function text(
  message: string,
  options: PromptOptions = {}
): Promise<string> {
  const theme = options.theme ? { ...currentTheme, ...options.theme } : currentTheme;
  
  const result = await clack.text({
    message: theme.style.question(message),
    placeholder: options.placeholder,
    initialValue: options.initialValue,
    validate: options.validate,
  });

  if (clack.isCancel(result)) {
    throw new CLIError('Operation cancelled by user', { code: 'CANCELLED' });
  }

  if (options.required && !result.trim()) {
    throw new CLIError('This field is required', { code: 'VALIDATION_ERROR' });
  }

  return result;
}

/**
 * Prompt for password input
 */
export async function password(
  message: string,
  options: Omit<PromptOptions, 'initialValue'> = {}
): Promise<string> {
  const theme = options.theme ? { ...currentTheme, ...options.theme } : currentTheme;
  
  const result = await clack.password({
    message: theme.style.question(message),
    validate: options.validate,
  });

  if (clack.isCancel(result)) {
    throw new CLIError('Operation cancelled by user', { code: 'CANCELLED' });
  }

  if (options.required && !result.trim()) {
    throw new CLIError('Password is required', { code: 'VALIDATION_ERROR' });
  }

  return result;
}

/**
 * Prompt for confirmation (yes/no)
 */
export async function confirm(
  message: string,
  options: ConfirmPromptOptions = {}
): Promise<boolean> {
  const theme = options.theme ? { ...currentTheme, ...options.theme } : currentTheme;
  
  const result = await clack.confirm({
    message: theme.style.question(message),
    active: options.active || 'Yes',
    inactive: options.inactive || 'No',
    initialValue: options.initialValue,
  });

  if (clack.isCancel(result)) {
    throw new CLIError('Operation cancelled by user', { code: 'CANCELLED' });
  }

  return result;
}

/**
 * Prompt for single selection from a list
 */
export async function select<T = string>(
  message: string,
  options: SelectOption<T>[],
  promptOptions: SelectPromptOptions<T> = {}
): Promise<T> {
  const theme = promptOptions.theme ? { ...currentTheme, ...promptOptions.theme } : currentTheme;
  
  const selectOptions = options.map((option) => ({
    value: option.value,
    label: option.label || String(option.value),
  }));

  const result = await clack.select({
    message: theme.style.question(message),
    options: selectOptions as any,
    maxItems: promptOptions.maxItems,
  });

  if (clack.isCancel(result)) {
    throw new CLIError('Operation cancelled by user', { code: 'CANCELLED' });
  }

  if (promptOptions.validate) {
    const validationError = promptOptions.validate(result as T);
    if (validationError) {
      throw new CLIError(validationError, { code: 'VALIDATION_ERROR' });
    }
  }

  return result as T;
}

/**
 * Prompt for multiple selections from a list
 */
export async function multiselect<T = string>(
  message: string,
  options: MultiSelectOption<T>[],
  promptOptions: MultiSelectPromptOptions<T> = {}
): Promise<T[]> {
  const theme = promptOptions.theme ? { ...currentTheme, ...promptOptions.theme } : currentTheme;
  
  const selectOptions = options.map((option) => ({
    value: option.value,
    label: option.label || String(option.value),
  }));

  const result = await clack.multiselect({
    message: theme.style.question(message),
    options: selectOptions as any,
    required: promptOptions.required !== false,
    maxItems: promptOptions.maxItems,
  });

  if (clack.isCancel(result)) {
    throw new CLIError('Operation cancelled by user', { code: 'CANCELLED' });
  }

  if (promptOptions.required && (!result || (result as T[]).length === 0)) {
    throw new CLIError('At least one selection is required', { code: 'VALIDATION_ERROR' });
  }

  if (promptOptions.validate) {
    const validationError = promptOptions.validate(result as T[]);
    if (validationError) {
      throw new CLIError(validationError, { code: 'VALIDATION_ERROR' });
    }
  }

  return result as T[];
}

/**
 * Group related prompts together
 */
export async function group<T extends Record<string, any>>(
  prompts: {
    [K in keyof T]: () => Promise<T[K]>;
  },
  options?: {
    onCancel?: (prompt: { results: Partial<T> }) => void;
  }
): Promise<T> {
  const result = await clack.group(prompts, options);

  if (clack.isCancel(result)) {
    throw new CLIError('Operation cancelled by user', { code: 'CANCELLED' });
  }

  return result;
}

// isCancel is re-exported from clack at the end of this file

/**
 * Cancel the current operation
 */
export function cancel(message: string = 'Operation cancelled'): never {
  clack.cancel(currentTheme.style.error(message));
  process.exit(1);
}

/**
 * Common prompt patterns for CLI setup
 */
export const patterns = {
  /**
   * Project name validation
   */
  projectName: {
    validate: (value: string): string | undefined => {
      if (!value.trim()) return 'Project name is required';
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
        return 'Project name can only contain letters, numbers, hyphens, and underscores';
      }
      if (value.length > 50) return 'Project name must be 50 characters or less';
      return undefined;
    },
    placeholder: 'my-awesome-project',
  },

  /**
   * Package manager selection
   */
  packageManager: async (): Promise<'npm' | 'pnpm' | 'yarn' | 'bun'> => {
    return select('Choose a package manager:', [
      { value: 'pnpm' as const, label: 'pnpm (recommended)', hint: 'Fast, disk space efficient' },
      { value: 'npm' as const, label: 'npm', hint: 'Node.js default package manager' },
      { value: 'yarn' as const, label: 'Yarn', hint: 'Fast, reliable, secure' },
      { value: 'bun' as const, label: 'Bun', hint: 'All-in-one JavaScript runtime' },
    ]);
  },

  /**
   * Framework selection
   */
  framework: async (): Promise<string> => {
    return select('Choose a framework:', [
      { value: 'next', label: 'Next.js', hint: 'React framework with SSR/SSG' },
      { value: 'remix', label: 'Remix', hint: 'Full-stack React framework' },
      { value: 'astro', label: 'Astro', hint: 'Static site generator' },
      { value: 'vite', label: 'Vite', hint: 'Fast build tool' },
      { value: 'none', label: 'None', hint: 'Plain setup' },
    ]);
  },

  /**
   * TypeScript confirmation
   */
  typescript: async (): Promise<boolean> => {
    return confirm('Use TypeScript?', { initialValue: true });
  },

  /**
   * Git repository initialization
   */
  initGit: async (): Promise<boolean> => {
    return confirm('Initialize Git repository?', { initialValue: true });
  },

  /**
   * Environment variable setup
   */
  envSetup: async (): Promise<boolean> => {
    return confirm('Set up environment variables?', { initialValue: false });
  },
};

/**
 * Pre-built prompt flows for common CLI scenarios
 */
export const flows = {
  /**
   * Project initialization flow
   */
  projectInit: async (): Promise<{
    name: string;
    packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
    framework: string;
    typescript: boolean;
    initGit: boolean;
  }> => {
    intro('Let\'s create your project');

    const result = await group({
      name: () => text('Project name:', patterns.projectName),
      packageManager: patterns.packageManager,
      framework: patterns.framework,
      typescript: patterns.typescript,
      initGit: patterns.initGit,
    });

    outro('Project configuration complete!');
    return result;
  },

  /**
   * Environment configuration flow
   */
  envConfig: async (): Promise<Record<string, string>> => {
    intro('Environment Configuration');
    
    const envVars: Record<string, string> = {};
    let addMore = true;

    while (addMore) {
      const key = await text('Environment variable name:', {
        placeholder: 'API_KEY',
        validate: (value) => {
          if (!value.trim()) return 'Variable name is required';
          if (!/^[A-Z_][A-Z0-9_]*$/.test(value)) {
            return 'Variable name must be uppercase with underscores';
          }
          return undefined;
        },
      });

      const value = await password('Environment variable value:');
      envVars[key] = value;

      addMore = await confirm('Add another environment variable?', { initialValue: false });
    }

    outro(`Configured ${Object.keys(envVars).length} environment variable(s)`);
    return envVars;
  },

  /**
   * Deployment configuration flow
   */
  deployConfig: async (): Promise<{
    provider: string;
    region: string;
    environment: string;
  }> => {
    intro('Deployment Configuration');

    const result = await group({
      provider: () => select('Deployment provider:', [
        { value: 'vercel', label: 'Vercel', hint: 'Optimized for Next.js' },
        { value: 'netlify', label: 'Netlify', hint: 'Great for static sites' },
        { value: 'aws', label: 'AWS', hint: 'Full cloud platform' },
        { value: 'railway', label: 'Railway', hint: 'Simple deployments' },
      ]),
      region: () => select('Deployment region:', [
        { value: 'us-east-1', label: 'US East (N. Virginia)' },
        { value: 'us-west-2', label: 'US West (Oregon)' },
        { value: 'eu-west-1', label: 'Europe (Ireland)' },
        { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
      ]),
      environment: () => select('Environment:', [
        { value: 'production', label: 'Production' },
        { value: 'staging', label: 'Staging' },
        { value: 'development', label: 'Development' },
      ]),
    });

    outro('Deployment configuration complete!');
    return result;
  },
};

// Export clack utilities for advanced use cases
export { clack };

// Note: isCancel is already exported from errors.js, so we don't re-export it here to avoid conflicts