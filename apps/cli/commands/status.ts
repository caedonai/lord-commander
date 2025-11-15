import type { Command } from 'commander';

// CommandContext interface - matches the official CLI core interface
// In production: import type { CommandContext } from '@lord-commander/cli-core'
interface CommandContext {
  // Core utilities (always available)
  logger: {
    intro: (title: string) => void;
    info: (message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
    debug: (message: string) => void;
    outro: (message: string) => void;
    spinner: (message: string) => { success: (msg: string) => void; error: (msg: string) => void };
  };
  prompts: {
    text: (options: {
      message: string;
      placeholder?: string;
      validate?: (value: string) => boolean | string;
    }) => Promise<string>;
    select: (options: {
      message: string;
      options: Array<{ value: string; label: string; hint?: string }>;
    }) => Promise<string>;
    multiselect: (options: {
      message: string;
      options: Array<{ value: string; label: string; hint?: string }>;
      initialValues?: string[];
    }) => Promise<string[]>;
    confirm: (options: { message: string }) => Promise<boolean>;
    isCancel: (value: unknown) => boolean;
    cancel: (message: string) => void;
  };

  // Optional utilities (may not be available in all contexts)
  fs?: Record<string, unknown>;
  execa?: Record<string, unknown>;
  config?: Record<string, unknown>;
  cwd?: string;

  // Plugin utilities (only available when enabled)
  git?: Record<string, unknown>;
  telemetry?: Record<string, unknown>;
}

export default function (program: Command, context: CommandContext) {
  const { logger } = context;

  program
    .command('status')
    .description('Show CLI status and configuration')
    .action(async () => {
      logger.intro('📊 CLI Status');

      logger.info(`CLI Name: lord-commander`);
      logger.info(`Version: 1.0.0`);
      logger.info(`Working Directory: ${process.cwd()}`);
      logger.info(`Node.js Version: ${process.version}`);
      logger.info(`Platform: ${process.platform}`);
      logger.outro('✨ Status check complete!');
    });
}
