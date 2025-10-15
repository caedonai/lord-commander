import chalk from 'chalk';
import figures from 'figures';

type LogFunction = (message: string) => void;

interface LoggerStyle {
  color?: typeof chalk;
  symbol?: string;
  prefix?: string;
  formatter?: (message: string) => string;
}

export interface Logger {
  [key: string]: LogFunction;
}

interface LoggerConfig {
  info?: LoggerStyle;
  warn?: LoggerStyle;
  error?: LoggerStyle;
  success?: LoggerStyle;
}

// Default styles for built-in log types
const defaultStyles: Required<LoggerConfig> = {
  info: { color: chalk.blue, symbol: figures.info },
  warn: { color: chalk.yellow, symbol: figures.warning },
  error: { color: chalk.red, symbol: figures.cross },
  success: { color: chalk.green, symbol: figures.tick }
};

/**
 * Initialize the logger by converting the default styles into functional logging methods.
 * Process:
 * 1. Object.entries(defaultStyles) converts the config object into [type, style] pairs
 *    Example: [['info', { color: chalk.blue, symbol: '→' }], ['error', {...}]]
 * 2. reduce() builds the final logger object by iterating through these pairs
 * 3. Each iteration creates a configured logging function for that type (info/warn/error/success)
 * Result: { info: fn(), warn: fn(), error: fn(), success: fn() }
 */
export const logger: Logger = Object.entries(defaultStyles).reduce((loggerInstance, [logType, styleInfo]) => {
  loggerInstance[logType] = createLogFunction(styleInfo);
  return loggerInstance;
}, {} as Logger);


/**
 * Configure the built-in log types (info, warn, error, success)
 * Allows customization of color, symbol, prefix, and message formatting
 * 
 * @example
 * configureLoggerStyles({
 *   info: { color: chalk.cyan, symbol: '→', prefix: 'INFO' },
 *   error: { color: chalk.redBright, formatter: msg => msg.toUpperCase() }
 * });
 */
export function configureLoggerStyles(config: LoggerConfig): void {
  Object.entries(config).forEach(([type, style]) => {
    if (type in defaultStyles) {
      const mergedStyle = {
        ...defaultStyles[type as keyof LoggerConfig],
        ...style
      };
      logger[type] = createLogFunction(mergedStyle);
    }
  });
}

/**
 * Add a new custom log type to the logger
 * 
 * @example
 * addLogType('debug', {
 *   color: chalk.magenta,
 *   symbol: '🔍',
 *   prefix: 'DEBUG',
 *   formatter: msg => `[${new Date().toISOString()}] ${msg}`
 * });
 * 
 * logger.debug('Debugging information');
 */
export function addLogType(type: string, style: LoggerStyle): void {
  if (type in logger) {
    throw new Error(`Log type '${type}' already exists`);
  }

  logger[type] = createLogFunction(style);
}

// Helper function to create a log function from a style configuration
function createLogFunction(style: LoggerStyle): LogFunction {
  return (message: string) => {
    let output = message;

    // Apply custom formatter if provided
    if (style.formatter) {
      output = style.formatter(output);
    }

    // Build the prefix components
    const parts = [
      style.symbol,
      style.prefix && `[${style.prefix}]`
    ].filter(Boolean);

    // Apply color to the entire output if color is specified
    const colorize = style.color || (x => x);
    const prefix = parts.length > 0 ? parts.join(' ') + ' ' : '';
    
    console.log(colorize(prefix + output));
  };
}
