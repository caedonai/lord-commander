# 📚 API Reference

*Automatically generated from TypeScript source code*

## Overview

The Lord Commander CLI SDK provides **366 exported functions, classes, and types** across **3 core modules**. The API is designed for maximum tree-shaking efficiency and developer productivity.

## 🎯 Quick Start

```typescript
// Recommended: Import only what you need (tree-shakeable)
import { createCLI, logger, intro, outro } from '@caedonai/sdk/core';
import { parseVersion, getVersionDiff } from '@caedonai/sdk/plugins';

// Create your CLI
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool'
});
```

## 📦 Modules

### [Core API](./core-api/README.md)

No description available

- **Path**: `src/core`
- **Exports**: 292 items
- **Types**: 56 constants, 26 classs, 112 functions, 87 interfaces, 11 types


### [Plugins API](./plugins-api/README.md)

No description available

- **Path**: `src/plugins`
- **Exports**: 70 items
- **Types**: 37 functions, 26 interfaces, 2 types, 5 constants


### [Type Definitions](./type-definitions/README.md)

No description available

- **Path**: `src/types`
- **Exports**: 4 items
- **Types**: 4 interfaces



## 🔍 Popular Functions

- [`AdvancedObjectSanitizer`](./type-definitions/README.md#advancedobjectsanitizer) - No description
- [`analyzeErrorContextSecurity`](./type-definitions/README.md#analyzeerrorcontextsecurity) - Enhanced Error Sanitization for Information Disclosure Protection This module provides comprehensive error sanitization to prevent sensitive information disclosure in error messages, stack traces, and error context
- [`analyzeInputSecurity`](./type-definitions/README.md#analyzeinputsecurity) - Security pattern definitions for detecting malicious inputs and attack vectors These patterns are used throughout the SDK to validate user inputs, command arguments, file paths, and configuration values for security threats
- [`analyzeStackTraceSecurity`](./type-definitions/README.md#analyzestacktracesecurity) - Enhanced Error Sanitization for Information Disclosure Protection This module provides comprehensive error sanitization to prevent sensitive information disclosure in error messages, stack traces, and error context
- [`batchSanitizeObjects`](./type-definitions/README.md#batchsanitizeobjects) - No description
- [`BRANDING`](./type-definitions/README.md#branding) - Core constants and configuration for the CLI SDK These constants define the supported technologies, file patterns, and framework detection logic used throughout the SDK
- [`createEnvironmentConfig`](./type-definitions/README.md#createenvironmentconfig) - Enhanced Error Sanitization for Information Disclosure Protection This module provides comprehensive error sanitization to prevent sensitive information disclosure in error messages, stack traces, and error context
- [`createMemoryGuard`](./type-definitions/README.md#creatememoryguard) - No description

## 📊 Performance Metrics

- **Bundle Size**: 1.78KB (core only) to 71KB (full SDK)
- **Tree-shaking**: 97% size reduction for selective imports
- **Startup Time**: 156ms average (production ready)
- **Memory Usage**: 12MB baseline

## 📖 Related Documentation

- **[Getting Started](../getting-started.md)** - Installation and first CLI
- **[Bundle Analysis](../bundle-analysis.md)** - Performance optimization guide  
- **[Performance Benchmarks](../performance.md)** - Real performance metrics
- **[Examples](../examples/)** - Practical usage patterns and workflows

## 🔧 Development Tools

```bash
# Generate fresh API docs
pnpm run docs:generate

# Analyze bundle performance  
pnpm run analyze

# Run comprehensive tests
pnpm test
```

---

*Last updated: 2025-10-29T21:38:06.344Z*
*Total API surface: 366 exports across 3 modules*
