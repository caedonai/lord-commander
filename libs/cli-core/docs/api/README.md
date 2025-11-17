# 📚 API Reference

_Automatically generated from TypeScript source code_

## Overview

The Lord Commander CLI SDK provides **417 exported functions, classes, and types** across **3 core modules**. The API is designed for maximum tree-shaking efficiency and developer productivity.

## 🎯 Quick Start

```typescript
// Recommended: Import only what you need (tree-shakeable)
import { createCLI, logger, intro, outro } from "@lord-commander/cli-core";
import { parseVersion, getVersionDiff } from "@lord-commander/cli-core/plugins";

// Create your CLI
await createCLI({
  name: "my-cli",
  version: "1.0.0",
  description: "My awesome CLI tool",
});
```

## 📦 Modules

### [Core API](./core/README.md)

No description available

- **Path**: `src/core`
- **Exports**: 295 items
- **Types**: 56 constants, 26 classs, 112 functions, 90 interfaces, 11 types

### [Plugins API](./plugins/README.md)

No description available

- **Path**: `src/plugins`
- **Exports**: 71 items
- **Types**: 37 functions, 27 interfaces, 2 types, 5 constants

### [Type Definitions](./types/README.md)

No description available

- **Path**: `src/types`
- **Exports**: 51 items
- **Types**: 12 interfaces, 36 types, 3 functions

## 🔍 Popular Functions

- [`AdvancedObjectSanitizer`](./core/README.md#advancedobjectsanitizer) - No description
- [`analyzeErrorContextSecurity`](./core/README.md#analyzeerrorcontextsecurity) - Enhanced Error Sanitization for Information Disclosure Protection This module provides comprehensive error sanitization to prevent sensitive information disclosure in error messages, stack traces, and error context
- [`analyzeInputSecurity`](./core/README.md#analyzeinputsecurity) - Security pattern definitions for detecting malicious inputs and attack vectors These patterns are used throughout the SDK to validate user inputs, command arguments, file paths, and configuration values for security threats
- [`analyzeStackTraceSecurity`](./core/README.md#analyzestacktracesecurity) - Enhanced Error Sanitization for Information Disclosure Protection This module provides comprehensive error sanitization to prevent sensitive information disclosure in error messages, stack traces, and error context
- [`batchSanitizeObjects`](./core/README.md#batchsanitizeobjects) - No description
- [`BRANDING`](./core/README.md#branding) - Core constants and configuration for the CLI SDK These constants define the supported technologies, file patterns, and framework detection logic used throughout the SDK
- [`createEnvironmentConfig`](./core/README.md#createenvironmentconfig) - Enhanced Error Sanitization for Information Disclosure Protection This module provides comprehensive error sanitization to prevent sensitive information disclosure in error messages, stack traces, and error context
- [`createMemoryGuard`](./core/README.md#creatememoryguard) - No description

## 📊 Performance Metrics

- **Bundle Size**: 253.5KB (core only) to 267.5KB (full SDK)
- **Tree-shaking**: 64% size reduction from source to bundle
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

_Last updated: 2025-11-17T03:51:25.263Z_
_Total API surface: 417 exports across 3 modules_
