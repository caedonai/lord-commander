# CLI Creation Import Patterns

With the restructured exports, users now have multiple flexible ways to import the CLI creation functionality:

## 1. **Recommended: Import from Core (Tree-Shakeable)**

```typescript
import { createCLI } from '@caedonai/sdk/core';

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool'
});
```

**Benefits**: 
- Tree-shakeable - only imports what you need
- Clear module organization
- Access to other core utilities if needed

## 2. **Convenience: Top-Level Import (Backward Compatible)**

```typescript
import { createCLI } from '@caedonai/sdk';

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0'
});
```

**Benefits**:
- Simple import path
- Backward compatible with existing code
- Still tree-shakeable due to explicit export

## 3. **Advanced: Granular CLI Control**

```typescript
import { 
  createCLI, 
  registerCommands,
  createLogger 
} from '@caedonai/sdk/core';
import { Command } from 'commander';

// Custom CLI setup with manual command registration
const program = new Command();
const logger = createLogger();
const context = { logger, /* other utilities */ };

await registerCommands(program, context, './custom-commands');
await registerCommands(program, context, './plugin-commands');

program.parse();
```

**Benefits**:
- Fine-grained control over CLI initialization
- Multiple command directories
- Custom command registration logic
- Advanced use cases and testing

## 4. **Bundle Size Comparison**

| Import Pattern | Estimated Bundle Size | Use Case |
|---|---|---|
| `createCLI` only | ~15-20KB | Simple CLI creation |
| `createCLI + registerCommands` | ~18-25KB | Custom registration |
| Full core module | ~35-40KB | Complete core utilities |
| Full SDK | ~71KB | Everything included |

## 5. **Use Case Examples**

### Simple CLI (Minimal Bundle)
```typescript
import { createCLI } from '@caedonai/sdk/core';

export default createCLI({
  name: 'deploy-tool',
  version: '2.1.0',
  commandsPath: './commands'
});
```

### Advanced CLI (Custom Setup)
```typescript
import { registerCommands, createLogger } from '@caedonai/sdk/core';
import { isWorkspace } from '@caedonai/sdk/plugins';
import { Command } from 'commander';

const program = new Command();
const logger = createLogger();

// Conditional command loading
if (await isWorkspace()) {
  await registerCommands(program, { logger }, './workspace-commands');
} else {
  await registerCommands(program, { logger }, './single-project-commands');
}

program.parse();
```

### Testing CLI Components
```typescript
import { registerCommands } from '@caedonai/sdk/core';
import { describe, it, expect } from 'vitest';

describe('CLI Commands', () => {
  it('should register test commands correctly', async () => {
    const mockProgram = new Command();
    const mockContext = { /* mock utilities */ };
    
    await registerCommands(mockProgram, mockContext, './test-commands');
    
    expect(mockProgram.commands).toHaveLength(3);
  });
});
```

## Summary

**Answer to your question**: Yes, `registerCommands` should be exported because it enables:

1. **Custom CLI initialization patterns**
2. **Multiple command directory registration** 
3. **Conditional command loading**
4. **Advanced testing scenarios**
5. **Fine-grained control for power users**

The SDK now provides both convenience (`createCLI` does everything) and flexibility (`registerCommands` for custom workflows) while maintaining excellent tree-shaking support.