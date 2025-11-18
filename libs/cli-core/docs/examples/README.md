# Examples and Tutorials

This directory contains comprehensive examples and tutorials demonstrating the lord-commander SDK capabilities. From basic CLI creation to advanced enterprise patterns, these examples show how to build professional-grade command-line tools.

## 📚 Getting Started

### Basic Examples
- [**Quick Start Guide**](./01-quick-start.md) - Your first CLI in 5 minutes
- [**Basic CLI Creation**](./02-basic-cli.md) - Core concepts and patterns
- [**Command Registration**](./03-command-registration.md) - Organizing and loading commands

### Intermediate Features
- [**Interactive Prompts**](./04-interactive-prompts.md) - Building user-friendly CLI experiences
- [**Error Handling**](./05-error-handling.md) - Robust error management and recovery
- [**Plugin System**](./06-plugin-system.md) - Git, updater, and workspace plugins

### Advanced Patterns
- [**Enterprise Security**](./07-enterprise-security.md) - Production-ready security validation
- [**Performance Optimization**](./08-performance.md) - Bundle optimization and tree-shaking
- [**Monorepo Management**](./09-monorepo.md) - Workspace utilities and batch operations

### Real-World Use Cases
- [**Project Scaffolding CLI**](./10-scaffolding-cli.md) - Complete project generator example
- [**DevOps Automation Tool**](./11-devops-tool.md) - Infrastructure and deployment automation
- [**Package Manager CLI**](./12-package-manager.md) - Dependency management patterns

## 🎯 By Capability

### Core Features
| Feature | Example | Description |
|---------|---------|-------------|
| CLI Creation | [Quick Start](./01-quick-start.md) | Basic `createCLI()` usage |
| Command Registration | [Commands](./03-command-registration.md) | Automatic command discovery |
| Interactive UI | [Prompts](./04-interactive-prompts.md) | User input and feedback |
| Process Execution | [Process Control](./process-execution.md) | Running shell commands |
| File Operations | [File System](./file-operations.md) | Safe file management |

### Security Framework
| Security Feature | Example | Description |
|------------------|---------|-------------|
| Input Validation | [Security](./07-enterprise-security.md#input-validation) | Enterprise-grade validation |
| Error Sanitization | [Security](./07-enterprise-security.md#error-handling) | Information disclosure protection |
| Path Security | [Security](./07-enterprise-security.md#path-validation) | Directory traversal prevention |
| Memory Protection | [Security](./07-enterprise-security.md#memory-safety) | DoS attack prevention |

### Plugin System
| Plugin | Example | Description |
|--------|---------|-------------|
| Git Operations | [Git Plugin](./06-plugin-system.md#git-operations) | Repository management |
| Version Management | [Updater Plugin](./06-plugin-system.md#version-management) | Semantic versioning |
| Workspace Tools | [Monorepo](./09-monorepo.md) | Multi-package management |

### Performance & Optimization
| Optimization | Example | Description |
|--------------|---------|-------------|
| Tree-shaking | [Performance](./08-performance.md#tree-shaking) | Bundle size reduction |
| Selective Imports | [Performance](./08-performance.md#selective-imports) | Import only what you need |
| Caching System | [Performance](./08-performance.md#caching) | Performance optimization |

## 🚀 Quick Reference

### Essential Imports
```typescript
// Core functionality
import { createCLI, createLogger, execa, fs } from '@caedonai/sdk/core';

// Interactive UI
import { intro, outro, text, select, confirm } from '@caedonai/sdk/core';

// Plugin features  
import { initRepo, commitChanges, parseVersion } from '@caedonai/sdk/plugins';

// Security utilities
import { validateProjectName, sanitizePath } from '@caedonai/sdk/core';
```

### Common Patterns
```typescript
// Basic CLI
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI'
});

// With configuration
await createCLI({
  name: 'my-cli',
  version: '1.0.0', 
  description: 'Enterprise CLI',
  commandsPath: ['./commands', './plugins/commands'],
  builtinCommands: { completion: true, hello: false }
});
```

## 📖 Tutorial Series

### 🎯 Beginner Series 
1. **Quick Start** - Basic CLI in 5 minutes
2. **Adding Commands** - Command structure and patterns  
3. **User Interaction** - Prompts and feedback
4. **Error Handling** - Graceful error management

### 🔧 Intermediate Series 
1. **Plugin Integration** - Git, updater, workspace tools
2. **Security Patterns** - Input validation and sanitization
3. **Performance Tuning** - Bundle optimization strategies
4. **Testing Strategies** - Comprehensive test patterns

### 🏗️ Advanced Series 
1. **Enterprise Architecture** - Large-scale CLI design
2. **Security Framework** - Production-ready security
3. **Plugin Development** - Custom plugin creation
4. **Performance Monitoring** - Metrics and optimization

### 🚀 Expert Series
1. **Multi-CLI Ecosystems** - CLI suite management
2. **Advanced Security** - Threat modeling and mitigation
3. **Performance Engineering** - Memory and CPU optimization
4. **Production Deployment** - CI/CD and monitoring

## 💡 Best Practices

### Code Organization
- Use the module folder structure (`foundation/`, `commands/`, `execution/`, `ui/`)
- Implement proper TypeScript interfaces for all data structures
- Follow the CommandContext pattern for dependency injection
- Organize commands by feature domains

### Security Guidelines  
- Always validate user inputs with the provided validation framework
- Use path sanitization for file operations
- Implement proper error handling with information disclosure protection
- Follow the principle of least privilege for file system access

### Performance Tips
- Use tree-shaking with selective imports to minimize bundle size
- Implement caching for expensive operations
- Monitor memory usage in long-running processes
- Optimize command registration for large CLI suites

### User Experience
- Provide clear, actionable error messages with recovery suggestions
- Use consistent visual patterns (separators, progress indicators, icons)
- Implement proper loading states for async operations
- Offer both interactive and non-interactive modes

## 🔗 Related Documentation

- [**API Reference**](../api/README.md) - Complete API documentation
- [**Architecture Guide**](../architecture/README.md) - System design and patterns
- [**Security Framework**](../security/README.md) - Comprehensive security documentation
- [**Performance Analysis**](../performance.md) - Bundle and runtime optimization

---

*💡 **Pro Tip**: Start with the Quick Start guide and work through the tutorial series. Each example builds on previous concepts while introducing new capabilities.*