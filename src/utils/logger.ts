import chalk from 'chalk';
import { replaceSymbols } from 'figures';

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

export const logger: Logger = {
  info: (message: string) => console.log(chalk.blue('ℹ'), message),
  warn: (message: string) => console.log(chalk.yellow('⚠'), message),
  error: (message: string) => console.log(chalk.red('✖'), message),
  success: (message: string) => console.log(chalk.green('✓'), message),
};
