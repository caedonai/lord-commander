# Bundle Analysis

> 📦 Comprehensive analysis of the lord-commander SDK bundle composition and optimization

*Last updated: 2025-11-17*

## 📊 Bundle Overview

| Metric | Value | Description |
|---------|-------|-------------|
| **Total Bundle Size** | 292.8KB | Complete SDK with all features |
| **Core Bundle Size** | 254.7KB | Essential CLI functionality only |
| **Plugin Bundle Size** | 19.5KB | Extended features (Git, updater, workspace) |
| **Tree-shaking Reduction** | 61% | Unused code eliminated in optimized builds |
| **Total Exports** | 417 | Available functions and utilities |

## 🎯 Import Strategy Comparison

### Full SDK Import (Not Recommended for Most Apps)
```typescript
import * as SDK from '@caedonai/sdk';
// Bundle size: ~292.8KB (includes core + plugins + commands)
// Use case: Apps that need everything
```

### Core-Only Import (Recommended for Most Apps)
```typescript
import { createCLI, createLogger, execa } from '@caedonai/sdk/core';
// Bundle size: ~254.7KB (excludes plugins, saves 13%)
// Use case: Standard CLI applications without Git/updater features
```

### Plugin-Specific Import (For Specific Features)
```typescript
import { parseVersion, initRepo } from '@caedonai/sdk/plugins';
// Bundle size: ~19.5KB (plugins only, no core CLI framework)
// Use case: Existing apps that only need specific utilities
```

### Understanding Bundle Sizes
- **Individual function imports** (like `import { createCLI }`) still load most dependencies
- **Real bundle reduction** comes from excluding entire categories (plugins, commands)
- **Tree-shaking** helps but can't eliminate core dependencies between functions

## 📁 File Breakdown

### Core Files
| `index-CJQX5Xqg.js` | 97.1KB | Supporting utilities and shared code |\n| `logger-CF27VWaZ.js` | 29.5KB | Supporting utilities and shared code |\n| `core/foundation/security/validation.js` | 22.1KB | Supporting utilities and shared code |\n| `core/foundation/security/patterns.js` | 20.7KB | Supporting utilities and shared code |\n| `index-DuWgH8Bm.js` | 20.1KB | Supporting utilities and shared code |\n| `core/execution/execa.js` | 11.9KB | Process execution utilities |\n| `core/ui/icons.js` | 11.9KB | Supporting utilities and shared code |\n| `core/ui/prompts.js` | 11.4KB | Supporting utilities and shared code |\n| `core/foundation/core/constants.js` | 9.1KB | Supporting utilities and shared code |\n| `core/execution/fs.js` | 7.8KB | File system operations |

### Plugin Files  
| `updater-DEbeOHT8.js` | 18.4KB | Supporting utilities and shared code |\n| `plugins/index.js` | 1.1KB | Plugin system with Git, updater, and workspace tools |

### Supporting Files Summary
| Category | Files | Total Size | Description |
|----------|-------|------------|-------------|
| **Shared Chunks** | 0 files | 0KB | Optimized code chunks for efficient loading |
| **CLI Utilities** | 3 files | 14KB | CLI commands and completion system |
| **System Utilities** | 0 files | 0KB | Process execution, file system, and security |
| **Other Utilities** | 2 files | 4.53KB | Supporting libraries and entry points |

### Key Individual Files
| File | Size | Description |
|------|------|-------------|
| `version-fVSyiN3t.js` | 7.9KB | Version management utilities |

## 📁 Complete Bundle Inventory

All bundle files with their sizes, purposes, and key functionality:

| File | Size | Purpose | Key Exports |
|------|------|---------|-------------|
| `index-CJQX5Xqg.js` | 97.1KB | CLI framework and command system | Ys, Ks, Ce |\n| `logger-CF27VWaZ.js` | 29.5KB | Logging and output utilities | z, V, Z |\n| `core/foundation/security/validation.js` | 22.1KB | Security validation and protection | v, c, l |\n| `core/foundation/security/patterns.js` | 20.7KB | Security validation and protection | a, r, d |\n| `index-DuWgH8Bm.js` | 20.1KB | Logging and output utilities | v, C, Se |\n| `updater-DEbeOHT8.js` | 18.4KB | Logging and output utilities | pt, P, w |\n| `core/execution/execa.js` | 11.9KB | CLI framework and command system | D, B, ne |\n| `core/ui/icons.js` | 11.9KB | Security validation and protection | i, E, n |\n| `core/ui/prompts.js` | 11.4KB | Security validation and protection | E, q, B |\n| `core/foundation/core/constants.js` | 9.1KB | CLI framework and command system | _, p, a |\n| `version-fVSyiN3t.js` | 7.9KB | Logging and output utilities | V |\n| `core/execution/fs.js` | 7.8KB | Logging and output utilities | T, L, N |\n| `core/index.js` | 6.4KB | CLI framework and command system | _e, Le, de |\n| `core/foundation/errors/errors.js` | 6.2KB | Version management and updating system | s, m, h |\n| `completion-CkqGC0j_.js` | 4.3KB | Logging and output utilities | d |

## 📦 Production Dependencies

### Bundled Dependencies (Included in SDK)
| Package | Version | Bundle Impact | Purpose |
|---------|---------|---------------|---------|
| `commander` | ^14.0.1 | 43.9KB | CLI framework and command parsing |\n| `execa` | ^8.0.1 | 24.4KB | Cross-platform process execution |\n| `@clack/prompts` | ^0.11.0 | 14.6KB | Interactive user prompts and spinners |\n| `picocolors` | ^1.1.1 | 2KB | Terminal output colorization (85% smaller than chalk) |

### External Dependencies (Peer/Optional)
| Package | Version | Bundle Impact | Purpose |
|---------|---------|---------------|---------|
| `axios` | ^1.6.0 | 4.9KB | Supporting utility |\n| `figures` | ^6.1.0 | 4.9KB | Supporting utility |\n| `tslib` | ^2.3.0 | 4.9KB | Supporting utility |

## ⚡ Tree-shaking Optimization

### Export Distribution
- **Core SDK**: 290 exports (70%)
- **Plugin System**: 76 exports (18%)
- **Total Available**: 417 functions and utilities

### Optimization Results
- **Import Only Core**: 13% bundle size reduction (excludes plugins)
- **Dead Code Elimination**: Unused code automatically removed in production builds
- **Module Boundaries**: Clear separation between core and plugin functionality  
- **Granular Control**: Import only the specific functions your app uses

## 🚀 Bundle Optimization Best Practices

### 1. Import Only What You Need
```typescript
// ✅ Recommended: Import specific functions you'll use
import { createCLI, createLogger } from '@caedonai/sdk/core';
import { parseVersion } from '@caedonai/sdk/plugins';

// ❌ Avoid: Importing everything (pulls in unused code)
import * as SDK from '@caedonai/sdk';
```

### 2. Import by Category
```typescript
// Core functionality (~255KB)
import { createCLI, execa, fs, logger } from '@caedonai/sdk/core';

// Plugin features (~20KB)  
import { git, updater, workspace } from '@caedonai/sdk/plugins';
```

### 3. Conditional Plugin Loading
```typescript
// Load plugins only when needed
if (await isGitRepository()) {
  const { initRepo, commitChanges } = await import('@caedonai/sdk/plugins');
  await initRepo(projectPath);
}
```

### 4. Vite Bundle Optimization
```typescript
// vite.config.ts - Optimize for lord-commander SDK
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['@caedonai/sdk'], // If using as external dependency
      output: {
        manualChunks: {
          // Split core and plugins for better caching
          'cli-core': ['@caedonai/sdk/core'],
          'cli-plugins': ['@caedonai/sdk/plugins']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@caedonai/sdk/core'], // Pre-bundle core for faster dev
    exclude: ['@caedonai/sdk/plugins'] // Lazy load plugins
  }
});
```

### 5. Bundle Analysis & Monitoring
```bash
# Analyze your project's bundle impact
pnpm analyze-bundle

# Test tree-shaking effectiveness  
pnpm test:tree-shaking

# Monitor bundle size in Vite builds
vite build --analyze
```

## 📈 Performance Metrics

### Startup Performance (Node.js v18+)
- **Full SDK**: ~30ms module loading + ~50ms initialization  
- **Core Only**: ~26ms module loading + ~45ms initialization
- **Minimal Functions**: ~15ms module loading + ~20ms initialization

### Memory Usage (V8 Heap)
- **Full SDK**: ~15MB initial heap (includes all features)
- **Core Only**: ~13MB initial heap (excludes plugins)  
- **Peak Usage**: ~25MB during intensive operations
- **Minimal Functions**: ~10MB (importing just a few functions)

### Load Time Comparison (Realistic Estimates)
| Import Strategy | Bundle Size | Parse Time | Memory Footprint |
|-----------------|-------------|-----------|------------------|
| Full SDK | 292.8KB | ~30ms | ~15MB |
| Core Only | 254.7KB | ~26ms | ~13MB |
| Minimal Functions | ~50-100KB* | ~15ms | ~10MB |

*Note: Even importing individual functions loads most of the core due to dependencies

### Bundle Loading Benchmarks
```bash
# Test your application's actual load times
time node -e "require('@caedonai/sdk')"           # Full SDK (292.8KB)
time node -e "require('@caedonai/sdk/core')"     # Core only (254.7KB)  
time node -e "const {createCLI}=require('@caedonai/sdk/core')" # Individual functions (still loads most of core)
```

## 🔍 Bundle Composition Analysis

### Code Categories
```
Core SDK (87%)
├── CLI Framework (35%)
├── Command System (25%) 
├── UI Components (20%)
└── Utilities (20%)

Plugin System (7%)
├── Git Operations (45%)
├── Version Management (35%)
└── Workspace Tools (20%)

Supporting Code (6%)
├── Shared Chunks (60%)
├── External Dependencies (25%)
└── Runtime Utilities (15%)
```

### Optimization Opportunities
1. **Lazy Loading**: Plugin modules loaded on-demand
2. **Code Splitting**: Shared chunks minimize duplication
3. **Tree Shaking**: Unused exports automatically eliminated
4. **Minification**: Production builds optimized for size
5. **Compression**: Gzip reduces transfer size by ~70%

## ⚡ Vite-Specific Bundle Optimization

### Optimal Vite Configuration
```typescript
// vite.config.ts - Production-optimized for lord-commander SDK
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separate core and plugin bundles for optimal caching
          if (id.includes('@caedonai/sdk/core')) return 'cli-core';
          if (id.includes('@caedonai/sdk/plugins')) return 'cli-plugins';
          if (id.includes('commander') || id.includes('execa')) return 'cli-deps';
        }
      }
    },
    // Optimize chunk size limits for CLI tools
    chunkSizeWarningLimit: 200 // Warn at 200KB vs default 500KB
  },
  optimizeDeps: {
    // Pre-bundle core dependencies for faster cold starts
    include: [
      '@caedonai/sdk/core',
      '@caedonai/sdk/logger',
      '@caedonai/sdk/execa'
    ],
    // Exclude plugins to enable lazy loading
    exclude: [
      '@caedonai/sdk/plugins',
      '@caedonai/sdk/git',
      '@caedonai/sdk/updater'
    ]
  },
  // Enable advanced tree-shaking
  esbuild: {
    treeShaking: true
  }
});
```

### Bundle Size Targets for Vite Applications
| Application Type | Target Bundle Size | SDK Recommendation |
|------------------|-------------------|-------------------|
| **CLI Tools** | < 1MB total | Core only (~254.7KB) |
| **Desktop Apps** | < 5MB total | Core + selective plugins |
| **Web Applications** | < 500KB initial | Lazy-load all plugins |
| **Node.js Services** | < 2MB total | Full SDK acceptable |

### Vite Bundle Analysis Commands
```bash
# Build with bundle analysis
pnpm vite build --analyze

# Inspect bundle composition
pnpm vite-bundle-analyzer dist

# Test tree-shaking effectiveness
pnpm vite build --mode development --minify false
```

### Advanced Vite Optimizations
```typescript
// Dynamic imports for plugin lazy loading
const loadGitPlugin = () => import('@caedonai/sdk/plugins/git');
const loadUpdater = () => import('@caedonai/sdk/plugins/updater');

// Conditional plugin loading
if (process.env.NODE_ENV !== 'production') {
  const { git } = await loadGitPlugin();
  // Use git functionality
}
```

---

*📊 **Bundle analysis generated automatically**. Run `pnpm docs:bundle-analysis` to update with latest metrics.*