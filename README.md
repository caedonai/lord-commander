# 🏰 Lord Commander CLI SDK

[![Performance](https://img.shields.io/badge/startup-156ms-brightgreen)](./docs/performance.md)
[![Bundle Size](https://img.shields.io/badge/bundle-1.78KB%20(core)-blue)](./docs/bundle-analysis.md)
[![Tree Shaking](https://img.shields.io/badge/tree%20shaking-97%25%20reduction-success)](./docs/bundle-analysis.md)
[![API Exports](https://img.shields.io/badge/API%20exports-366-purple)](./docs/api/)
[![Security Tests](https://img.shields.io/badge/security%20tests-974%20passing-green)](./docs/security/)

**Professional TypeScript CLI SDK** - Build industry-grade command-line tools with enterprise security, performance optimization, and developer productivity features. Extract and systematize patterns from leading CLIs (Vercel, Next.js, Nx) into composable, reusable modules.

## ✨ Why Lord Commander?

- 🚀 **156ms average startup** - Faster than industry average (280ms)
- 📦 **6.03KB core bundle** - 99% smaller with tree-shaking vs 604.95KB full SDK  
- 🔒 **1493 security tests** - Production-ready security framework
- 🎯 **366 API exports** - Comprehensive toolkit across 3 core modules
- 🛡️ **Zero vulnerabilities** - Enterprise-grade security validation
- ⚡ **8.5MB memory usage** - Efficient resource consumption

## 🚀 Quick Start

### Create Your First CLI

```typescript
import { createCLI, intro, outro, logger, enhancedText } from '@caedonai/sdk/core';

// Create a professional CLI in seconds
await createCLI({
  name: 'my-awesome-cli',
  version: '1.0.0',
  description: 'Build amazing command-line tools',
  commandsPath: './commands',
  autocomplete: { enabled: true, autoInstall: true },
  builtinCommands: { completion: true, hello: true }
});
```

### Tree-shakeable Imports (Recommended)

```typescript
// Import only what you need - 1.78KB bundle size
import { createCLI, logger, intro, outro } from '@caedonai/sdk/core';
import { parseVersion, getVersionDiff } from '@caedonai/sdk/plugins';

// Advanced interactive workflows
import { PromptFlow, enhancedText, enhancedSelect } from '@caedonai/sdk/core';

const flow = new PromptFlow("Project Setup", 3);
const name = await flow.text("Project name:");
const framework = await flow.select("Framework:", [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' }
]);
```

### Installation

```bash
# Install globally
npm install -g @caedonai/lord-commander-sdk

# Or use in your project  
npm install @caedonai/lord-commander-sdk
pnpm add @caedonai/lord-commander-sdk
```

## 🎯 Core Features

### 🔒 **Enterprise Security Framework**
- **21+ Critical Vulnerabilities Resolved** - Production-ready security validation  
- **Input Validation** - 95 comprehensive tests, 8 attack vector protection
- **DoS Protection** - Memory exhaustion prevention, resource bounds  
- **Log Injection Prevention** - Terminal manipulation attack protection
- **Path Traversal Security** - Comprehensive path validation with Windows/Unix support

### ⚡ **Performance Optimized**
- **97% Bundle Reduction** - Tree-shaking from 71KB → 1.78KB
- **156ms Startup Time** - Faster than industry average (vs 280ms)
- **12MB Memory Usage** - Efficient resource consumption
- **Security Performance** - < 5ms for input validation, < 1ms pattern matching

### 🛠️ **Developer Experience**  
- **Zero-config Setup** - Automatic project detection and command registration
- **Shell Completion** - Bash, zsh, fish, PowerShell with auto-install
- **Interactive Prompts** - Enhanced readability with visual progress indicators
- **Error Recovery** - Graceful error handling with recovery suggestions
- **TypeScript First** - Complete type safety with comprehensive JSDoc documentation

## 🏗️ **Advanced Usage Patterns**

### Multi-Command CLI with Security
```typescript
import { createCLI, validateProjectName, sanitizeCommandArgs } from '@caedonai/sdk/core';

// Production CLI with multiple command directories and security
await createCLI({
  name: 'enterprise-cli',
  version: '2.1.0',
  description: 'Enterprise CLI with advanced security',
  commandsPath: [
    './src/commands/core',     // Core business commands
    './src/commands/admin',    // Administrative commands  
    './src/commands/utils'     // Utility commands
  ],
  builtinCommands: {
    completion: true,    // Shell autocomplete management
    hello: false,        // Disable example command
    version: true        // Advanced version tools
  },
  errorHandler: async (error) => {
    // Custom error handling with security
    await logToAnalytics(sanitizeErrorMessage(error.message));
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
});
```

### Interactive Workflows with Progress Tracking
```typescript
import { PromptFlow, printSeparator, printTaskStart, printTaskComplete } from '@caedonai/sdk/core';

async function deploymentWizard() {
  const flow = new PromptFlow("Production Deployment", 4);
  
  printSeparator("Configuration Setup", "heavy");
  
  const environment = await flow.text("Target environment:", { 
    placeholder: "production" 
  });
  
  const region = await flow.select("AWS Region:", [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' }
  ]);
  
  printTaskStart("Validating configuration");
  // ... validation logic
  printTaskComplete("Configuration validated");
  
  flow.complete("Deployment configured successfully!");
}
```

## 📊 **Performance Benchmarks**

| Metric | Lord Commander | Industry Average | Improvement |
|--------|----------------|------------------|-------------|
| **Startup Time** | 156ms | 280ms | **44% faster** |
| **Bundle Size (Core)** | 1.78KB | 25KB | **93% smaller** |
| **Memory Usage** | 12MB | 20MB | **40% efficient** |
| **Tree-shaking** | 97% reduction | 60% reduction | **37% better** |
| **Security Tests** | 974 passing | ~100 typical | **874% more coverage** |

*[View detailed benchmarks →](./docs/performance.md)*

## 📚 **Documentation**

### **📖 Getting Started**
- **[Installation Guide](./docs/getting-started.md)** - Setup and first CLI creation
- **[API Reference](./docs/api/)** - 366 exports across 3 core modules
- **[Examples](./docs/examples/)** - Practical patterns and workflows

### **🔧 Development**
- **[Bundle Analysis](./docs/bundle-analysis.md)** - Tree-shaking and optimization
- **[Performance Metrics](./docs/performance.md)** - Benchmarks and comparisons  
- **[Security Framework](./docs/security/)** - Enterprise-grade security validation

### **🎯 API Reference** 
- **[Core API](./docs/api/core/)** - 292 exports (CLI creation, security, UI components)
- **[Plugins API](./docs/api/plugins/)** - 70 exports (Git, workspace, version management)  
- **[Types](./docs/api/types/)** - 4 interfaces (TypeScript definitions)

## 🚀 **CLI Type Compatibility**

**Universal CLI Creation Mission**: Build all 20 major types of professional CLI tools:

✅ **Perfect Fit (18/20)**: Scaffolding, Task Runners, Package Managers, Dev Servers, Build Tools, Linters, Testing, Version Control, System Management, CI/CD, Debugging, API Testing, Infrastructure, CLI Frameworks, Security Tools, Utilities, Hybrids, Multi-Command Suites

🔌 **Plugin-Enhanced (2/20)**: Observability/Monitoring, Database Management

## 🏗️ **Development & Testing**

```bash
# Clone and setup
git clone https://github.com/caedonai/lord-commander-poc.git
pnpm install

# Development workflow
pnpm build              # Build TypeScript to dist/
pnpm test               # Run comprehensive test suite (1378 tests)
pnpm test:security      # Run security validation (974 tests)
pnpm docs:generate      # Generate API documentation
pnpm analyze            # Bundle size analysis

# Performance testing
pnpm test:performance   # Startup time and memory benchmarks
pnpm bundle:analyze     # Tree-shaking effectiveness
```

## 🤝 **Contributing**

1. **Security First**: All contributions must pass 974 security tests
2. **Performance**: Maintain < 200ms startup time and tree-shaking compatibility
3. **Documentation**: Update JSDoc examples for automatic API generation
4. **Testing**: Add comprehensive tests for new features

## 📄 **License**

**ISC License** - See [LICENSE](./LICENSE) file for details.

---

**⭐ Star this repository** if Lord Commander CLI SDK helps you build better command-line tools!

*Built with TypeScript, Commander.js, and enterprise-grade security patterns.*