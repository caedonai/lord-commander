# Command Auto-Discovery

The CLI SDK automatically discovers commands without any configuration required!

## How it works

The SDK searches for command files in these common locations (in order):

1. `./commands` - Root level commands folder
2. `./src/commands` - Inside src folder (most common)
3. `./lib/commands` - Inside lib folder  
4. `./cli/commands` - Inside cli folder
5. `./app/commands` - Inside app folder
6. `./bin/commands` - Inside bin folder

## Zero Configuration Example

```typescript
import { createCLI } from '@caedonai/sdk';

// That's it! Commands are automatically discovered
await createCLI({
    name: 'my-awesome-cli',
    description: 'My CLI tool',
    version: '1.0.0'
});
```

## Override Auto-Discovery (Optional)

If you need a custom location:

```typescript
await createCLI({
    name: 'my-cli',
    version: '1.0.0',
    commandsPath: './custom/commands/folder'
});
```

## Command File Requirements

For auto-discovery to work, command files must:

- Be `.ts` or `.js` files
- Be in a `/commands` directory
- Not be test files (`.test.ts`, `.spec.js`)
- Not be index files (`index.ts`, `index.js`)
- Export a default function that takes `(program, context)`

## Example Project Structure

```
my-cli-project/
├── src/
│   ├── commands/           ← Automatically discovered!
│   │   ├── build.ts
│   │   ├── deploy.ts
│   │   └── init.ts
│   └── index.ts
└── package.json
```

No configuration needed - just run `createCLI()` and your commands are ready! 🎉