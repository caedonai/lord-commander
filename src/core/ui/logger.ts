/**
 * Unified logging system with colors, spinners, and progress indicators
 * 
 * Provides centralized logging with @clack/prompts integration,
 * Picocolors theming, and comprehensive CLI output formatting.
 */

import colors from 'picocolors';
import figures from 'figures';
import { 
  intro as clackIntro,
  outro as clackOutro, 
  log as clackLog,
  note as clackNote,
  spinner as clackSpinner
} from '@clack/prompts';
import { BRANDING } from '../foundation/core/constants.js';
import { formatError } from '../foundation/errors/errors.js';
import { sanitizeLogOutputAdvanced, analyzeLogSecurity, type LogInjectionConfig } from '../foundation/logging/security.js';
import { IconProvider, IconSecurity, PlatformCapabilities, type ExtendedIcons } from './icons.js';

// Define Spinner type based on @clack/prompts return type
type Spinner = ReturnType<typeof clackSpinner>;

/**
 * Log levels for controlling output verbosity
 */
export enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5,
}

/**
 * Theme configuration for logger colors
 */
export interface LoggerTheme {
  primary: (text: string) => string;
  success: (text: string) => string;
  warning: (text: string) => string;
  error: (text: string) => string;
  info: (text: string) => string;
  muted: (text: string) => string;
  highlight: (text: string) => string;
  dim: (text: string) => string;
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  level?: LogLevel;
  theme?: Partial<LoggerTheme>;
  prefix?: string;
  timestamp?: boolean;
  showBrand?: boolean;
  logInjectionProtection?: LogInjectionConfig;
}

/**
 * Default theme using picocolors and BRANDING colors
 */
const DEFAULT_THEME: LoggerTheme = {
  primary: colors.cyan,  // Use built-in colors for now
  success: colors.green,
  warning: colors.yellow,
  error: colors.red,
  info: colors.blue,
  muted: colors.gray,
  highlight: (text: string) => colors.bold(colors.cyan(text)),
  dim: colors.dim,
};

/**
 * Logger class with comprehensive CLI output capabilities
 */
export class Logger {
  private level: LogLevel;
  private theme: LoggerTheme;
  private prefix?: string;
  private showTimestamp: boolean;
  private showBrand: boolean;
  private activeSpinners = new Set<Spinner>();
  private logInjectionConfig: LogInjectionConfig;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    // Properly merge theme, ensuring no undefined values override defaults
    this.theme = { ...DEFAULT_THEME };
    if (options.theme) {
      Object.entries(options.theme).forEach(([key, value]) => {
        if (value !== undefined) {
          (this.theme as any)[key] = value;
        }
      });
    }
    this.prefix = options.prefix;
    this.showTimestamp = options.timestamp ?? false;
    this.showBrand = options.showBrand ?? false;
    this.logInjectionConfig = options.logInjectionProtection ?? { 
      enableProtection: true,
      protectionLevel: 'permissive',  // Allow legitimate ANSI colors
      detectTerminalManipulation: false, // Disable for legitimate color usage
      preserveFormatting: true,     
      allowControlChars: true      
    };
  }

  /**
   * Set the logging level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Enable verbose logging
   */
  enableVerbose(): void {
    this.setLevel(LogLevel.VERBOSE);
  }

  /**
   * Enable debug logging
   */
  enableDebug(): void {
    this.setLevel(LogLevel.DEBUG);
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return this.level >= level;
  }

  /**
   * Format a log message with prefix and timestamp
   */
  private formatMessage(message: string): string {
    const parts: string[] = [];

    if (this.showTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(this.theme.dim(`[${timestamp}]`));
    }

    if (this.prefix) {
      parts.push(this.theme.muted(`[${this.prefix}]`));
    }

    parts.push(message);
    return parts.join(' ');
  }

  /**
   * Raw console.log wrapper for internal use with log injection protection
   */
  private write(message: string): void {
    const sanitizedMessage = sanitizeLogOutputAdvanced(message, this.logInjectionConfig);
    console.log(sanitizedMessage);
  }

  /**
   * Raw console.error wrapper for internal use with log injection protection
   */
  private writeError(message: string): void {
    const sanitizedMessage = sanitizeLogOutputAdvanced(message, this.logInjectionConfig);
    console.error(sanitizedMessage);
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.write(this.formatMessage(this.theme.info(`${figures.info} ${message}`)));
  }

  /**
   * Log a success message
   */
  success(message: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.write(this.formatMessage(this.theme.success(`${figures.tick} ${message}`)));
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.write(this.formatMessage(this.theme.warning(`${figures.warning} ${message}`)));
  }

  /**
   * Log an error message
   */
  error(message: string | Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    let errorMessage: string;
    if (message instanceof Error) {
      errorMessage = formatError(message, { 
        showStack: this.level >= LogLevel.DEBUG,
        colorize: true 
      });
    } else {
      errorMessage = this.theme.error(`${figures.cross} ${message}`);
    }
    
    this.writeError(this.formatMessage(errorMessage));
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    let debugMessage = this.theme.dim(`${figures.bullet} ${message}`);
    if (data !== undefined) {
      debugMessage += '\n' + this.theme.dim(JSON.stringify(data, null, 2));
    }
    
    this.write(this.formatMessage(debugMessage));
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.VERBOSE)) return;
    
    let verboseMessage = this.theme.muted(`${figures.arrowRight} ${message}`);
    if (data !== undefined) {
      verboseMessage += '\n' + this.theme.muted(JSON.stringify(data, null, 2));
    }
    
    this.write(this.formatMessage(verboseMessage));
  }

  /**
   * Display a prominent intro message
   */
  intro(message: string, showBrand = this.showBrand): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    if (showBrand) {
      this.write(this.theme.primary(BRANDING.asciiArt));
      this.write(this.theme.muted(BRANDING.tagline));
      this.write('');
    }

    clackIntro(this.theme.primary(message));
  }

  /**
   * Display a prominent outro message
   */
  outro(message: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    clackOutro(this.theme.success(message));
  }

  /**
   * Display a note with optional title
   */
  note(message: string, title?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const noteMessage = this.theme.info(message);
    const noteTitle = title ? this.theme.highlight(title) : undefined;
    
    clackNote(noteMessage, noteTitle);
  }

  /**
   * Display step information
   */
  step(message: string, stepNumber?: number, totalSteps?: number): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    let stepMessage = message;
    if (stepNumber !== undefined && totalSteps !== undefined) {
      const stepInfo = this.theme.muted(`(${stepNumber}/${totalSteps})`);
      stepMessage = `${stepInfo} ${message}`;
    }
    
    this.info(stepMessage);
  }

  /**
   * Create a spinner for long-running operations
   */
  spinner(message: string): Spinner {
    const spinner = clackSpinner();
    spinner.start(this.theme.primary(message));
    this.activeSpinners.add(spinner);
    
    // Wrap spinner methods to maintain tracking
    const originalStop = spinner.stop.bind(spinner);
    const originalMessage = spinner.message.bind(spinner);
    
    spinner.stop = (message?: string, code?: number) => {
      this.activeSpinners.delete(spinner);
      return originalStop(message, code);
    };

    spinner.message = (message?: string) => {
      if (message) {
        return originalMessage(this.theme.primary(message));
      }
      return originalMessage();
    };

    // Add convenience methods
    (spinner as any).success = (message: string) => {
      this.activeSpinners.delete(spinner);
      spinner.stop(this.theme.success(`${figures.tick} ${message}`));
    };

    (spinner as any).fail = (message: string) => {
      this.activeSpinners.delete(spinner);
      spinner.stop(this.theme.error(`${figures.cross} ${message}`), 1);
    };

    (spinner as any).warn = (message: string) => {
      this.activeSpinners.delete(spinner);
      spinner.stop(this.theme.warning(`${figures.warning} ${message}`));
    };

    return spinner;
  }

  /**
   * Stop all active spinners (useful for cleanup)
   */
  stopAllSpinners(message?: string): void {
    for (const spinner of this.activeSpinners) {
      spinner.stop(message);
    }
    this.activeSpinners.clear();
  }

  /**
   * Log with @clack/prompts log function for consistent styling
   */
  log(message: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    clackLog.message(this.formatMessage(message));
  }

  /**
   * Display a table-like structure
   */
  table(data: Record<string, string | number | boolean>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length));
    
    for (const [key, value] of Object.entries(data)) {
      const paddedKey = key.padEnd(maxKeyLength);
      const keyColor = this.theme.highlight(paddedKey);
      const valueColor = this.theme.info(String(value));
      this.write(`${keyColor} │ ${valueColor}`);
    }
  }

  /**
   * Display a list with bullets
   */
  list(items: string[], bullet = figures.bullet): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    for (const item of items) {
      const bulletColor = this.theme.primary(bullet);
      const itemColor = this.theme.info(item);
      this.write(`${bulletColor} ${itemColor}`);
    }
  }

  /**
   * Display a box around text
   */
  box(message: string, title?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const width = Math.max(maxLength + 4, title ? title.length + 4 : 0);
    
    const horizontal = '─'.repeat(width - 2);
    const top = `┌${horizontal}┐`;
    const bottom = `└${horizontal}┘`;
    
    this.write(this.theme.primary(top));
    
    if (title) {
      const paddedTitle = title.padStart((width + title.length) / 2).padEnd(width - 2);
      this.write(this.theme.primary(`│${this.theme.highlight(paddedTitle)}│`));
      this.write(this.theme.primary(`├${horizontal}┤`));
    }
    
    for (const line of lines) {
      const paddedLine = line.padEnd(width - 4);
      this.write(this.theme.primary(`│ ${this.theme.info(paddedLine)} │`));
    }
    
    this.write(this.theme.primary(bottom));
  }

  /**
   * Create a child logger with additional prefix
   */
  child(prefix: string, options: Partial<LoggerOptions> = {}): Logger {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    
    return new Logger({
      level: this.level,
      theme: this.theme,
      prefix: childPrefix,
      timestamp: this.showTimestamp,
      showBrand: false, // Don't show brand for child loggers
      ...options,
    });
  }

  /**
   * Update theme colors
   */
  setTheme(theme: Partial<LoggerTheme>): void {
    this.theme = { ...this.theme, ...theme };
  }

  /**
   * Get current theme
   */
  getTheme(): LoggerTheme {
    return { ...this.theme };
  }

  /**
   * Update log injection protection configuration
   */
  setLogInjectionProtection(config: LogInjectionConfig): void {
    this.logInjectionConfig = { ...this.logInjectionConfig, ...config };
  }

  /**
   * Get current log injection protection configuration
   */
  getLogInjectionProtection(): LogInjectionConfig {
    return { ...this.logInjectionConfig };
  }

  /**
   * Analyze a message for potential log injection risks
   */
  analyzeMessage(message: string) {
    return analyzeLogSecurity(message);
  }

  // ========================================
  // Enhanced Icon Methods
  // ========================================

  /**
   * Get all available icons with platform-appropriate fallbacks
   */
  getIcons(): ExtendedIcons {
    return IconProvider.getIcons();
  }

  /**
   * Get platform capabilities info
   */
  getPlatformInfo() {
    return PlatformCapabilities.getInfo();
  }

  /**
   * Log a message with a specific icon
   */
  withIcon(iconName: keyof ExtendedIcons, message: string, level: LogLevel = LogLevel.INFO): void {
    if (!this.shouldLog(level)) return;

    try {
      const icon = IconProvider.get(iconName);
      const safeIcon = IconSecurity.sanitizeIcon(icon);
      
      if (!IconSecurity.isValidIcon(safeIcon)) {
        this.warn(`Invalid icon "${iconName}" - falling back to text`);
        this.log(message);
        return;
      }

      const coloredMessage = level === LogLevel.ERROR ? this.theme.error(message) :
                            level === LogLevel.WARN ? this.theme.warning(message) :
                            level === LogLevel.INFO ? this.theme.info(message) :
                            level === LogLevel.DEBUG ? this.theme.muted(message) :
                            message;

      clackLog.message(this.formatMessage(`${safeIcon} ${coloredMessage}`));
    } catch (error) {
      // Gracefully handle icon provider errors
      this.warn(`Error getting icon "${iconName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.log(message);
    }
  }

  /**
   * Deployment and infrastructure icons
   */
  rocket(message: string): void {
    this.withIcon('rocket', message, LogLevel.INFO);
  }

  cloud(message: string): void {
    this.withIcon('cloud', message, LogLevel.INFO);
  }

  package(message: string): void {
    this.withIcon('box', message, LogLevel.INFO);
  }

  deploy(message: string): void {
    this.withIcon('deploy', message, LogLevel.INFO);
  }

  server(message: string): void {
    this.withIcon('server', message, LogLevel.INFO);
  }

  database(message: string): void {
    this.withIcon('database', message, LogLevel.INFO);
  }

  api(message: string): void {
    this.withIcon('api', message, LogLevel.INFO);
  }

  network(message: string): void {
    this.withIcon('network', message, LogLevel.INFO);
  }

  globe(message: string): void {
    this.withIcon('globe', message, LogLevel.INFO);
  }

  /**
   * File and folder operations
   */
  folder(message: string): void {
    this.withIcon('folder', message, LogLevel.INFO);
  }

  file(message: string): void {
    this.withIcon('file', message, LogLevel.INFO);
  }

  upload(message: string): void {
    this.withIcon('upload', message, LogLevel.INFO);
  }

  download(message: string): void {
    this.withIcon('download', message, LogLevel.INFO);
  }

  sync(message: string): void {
    this.withIcon('sync', message, LogLevel.INFO);
  }

  /**
   * Security and configuration
   */
  shield(message: string): void {
    this.withIcon('shield', message, LogLevel.INFO);
  }

  key(message: string): void {
    this.withIcon('key', message, LogLevel.INFO);
  }

  lock(message: string): void {
    this.withIcon('lock', message, LogLevel.INFO);
  }

  gear(message: string): void {
    this.withIcon('gear', message, LogLevel.INFO);
  }

  /**
   * Process and status icons
   */
  build(message: string): void {
    this.withIcon('build', message, LogLevel.INFO);
  }

  lightning(message: string): void {
    this.withIcon('lightning', message, LogLevel.INFO);
  }

  pending(message: string): void {
    this.withIcon('pending', message, LogLevel.INFO);
  }

  skip(message: string): void {
    this.withIcon('skip', message, LogLevel.INFO);
  }

  /**
   * Enhanced status methods with better icons
   */
  successWithIcon(message: string): void {
    this.withIcon('success', message, LogLevel.INFO);
  }

  failureWithIcon(message: string): void {
    this.withIcon('failure', message, LogLevel.ERROR);
  }

  /**
   * Decorative icons
   */
  sparkle(message: string): void {
    this.withIcon('sparkle', message, LogLevel.INFO);
  }

  diamond(message: string): void {
    this.withIcon('diamond', message, LogLevel.INFO);
  }

  crown(message: string): void {
    this.withIcon('crown', message, LogLevel.INFO);
  }

  trophy(message: string): void {
    this.withIcon('trophy', message, LogLevel.INFO);
  }

  /**
   * Test icon display for debugging platform compatibility
   */
  testIcons(): void {
    const icons = this.getIcons();
    const platformInfo = this.getPlatformInfo();
    
    clackLog.message(this.formatMessage('Platform Icon Test'));
    clackLog.message(this.formatMessage(`Platform: ${platformInfo.platform}`));
    clackLog.message(this.formatMessage(`Terminal: ${platformInfo.termProgram || 'unknown'}`));
    clackLog.message(this.formatMessage(`Unicode Support: ${platformInfo.supportsUnicode}`));
    clackLog.message(this.formatMessage(`Emoji Support: ${platformInfo.supportsEmoji}`));
    
    clackLog.message(this.formatMessage('\nAvailable Icons:'));
    
    // Group icons by category for better display
    const categories = {
      'Status': ['tick', 'cross', 'warning', 'info', 'success', 'failure', 'pending', 'skip'],
      'Infrastructure': ['rocket', 'cloud', 'server', 'database', 'api', 'network', 'globe'],
      'Files': ['box', 'folder', 'file', 'upload', 'download', 'sync'],
      'Security': ['shield', 'key', 'lock', 'gear'],
      'Process': ['build', 'deploy', 'lightning'],
      'Decorative': ['sparkle', 'diamond', 'crown', 'trophy']
    };
    
    Object.entries(categories).forEach(([category, iconNames]) => {
      clackLog.message(this.formatMessage(`\n${category}:`));
      iconNames.forEach(iconName => {
        const icon = icons[iconName as keyof ExtendedIcons];
        const security = IconSecurity.analyzeIconSecurity(icon);
        const status = security.isSecure ? '✓' : '⚠';
        clackLog.message(this.formatMessage(`  ${iconName.padEnd(12)} │ ${icon} │ ${status}`));
      });
    });
  }

  /**
   * Analyze icon security for a given text
   */
  analyzeIconSecurity(text: string) {
    return IconSecurity.analyzeIconSecurity(text);
  }

  /**
   * Get a safe version of an icon
   */
  getSafeIcon(iconName: keyof ExtendedIcons): string {
    const icon = IconProvider.get(iconName);
    return IconSecurity.sanitizeIcon(icon);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger instance with options
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}