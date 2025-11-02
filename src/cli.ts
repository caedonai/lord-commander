/**
 * Lord Commander SDK Demo CLI
 *
 * This CLI demonstrates the capabilities of the Lord Commander SDK.
 * It shows how to build professional CLIs using the SDK's modular architecture.
 */

import { createCLI } from './core/createCLI.js';

async function main() {
  try {
    await createCLI({
      name: 'lord-commander',
      version: '1.0.0',
      description: 'Professional CLI SDK Framework for building advanced command-line tools',
      commandsPath: './commands',
      builtinCommands: {
        completion: true,
        hello: true,
        version: true,
      },
      autocomplete: {
        enabled: true,
        autoInstall: true,
        shells: ['bash', 'zsh', 'fish', 'powershell'],
        enableFileCompletion: true,
      },
    });
  } catch (error) {
    console.error('Failed to start CLI:', error);
    process.exit(1);
  }
}

main();
