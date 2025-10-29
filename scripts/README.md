# Scripts Directory

This directory contains build automation, deployment, and development tooling scripts for the Lord Commander CLI SDK.

## 🚀 Production Scripts

### `release.mjs`
**Release Automation Pipeline**
- Automated version bumping (patch/minor/major)
- Runs complete test suite validation
- Generates changelog entries
- Creates git tags and commits
- Prepares for npm publishing
- Usage: `node scripts/release.mjs [patch|minor|major] [--dry-run]`

### `generate-api-docs.ts`
**API Documentation Generator** 
- Automatically generates API reference from TypeScript source code
- Extracts all exports from core, plugins, and types modules  
- Creates searchable documentation with JSDoc examples
- Parses function signatures and generates comprehensive docs
- **TypeScript with tsx** - provides type safety during script execution
- **CI/CD Ready** - runs after `pnpm install` in any CI environment
- Usage: `pnpm run docs:generate` or `tsx scripts/generate-api-docs.ts`

### `analyze-bundle.mjs`
**Bundle Analysis and Optimization**
- Analyzes bundle sizes and dependencies
- Tree-shaking optimization validation
- Performance recommendations
- Dependency impact analysis
- Usage: `node scripts/analyze-bundle.mjs`

## 🔧 Development Scripts

### `setup-dev.mjs`
**Development Environment Setup**
- Installs dependencies and tools
- Configures git hooks (pre-commit validation)
- Sets up VS Code configuration
- Creates development utilities
- Usage: `node scripts/setup-dev.mjs`

## 📊 What Goes in `scripts/` for a CLI SDK

Based on industry standards from React, Next.js, and Vite, the `scripts/` folder should contain:

### ✅ **Build Automation**
- Release pipeline automation
- Version management and tagging
- Changelog generation
- Package publishing preparation

### ✅ **Development Tooling**
- Environment setup scripts
- Development server configuration
- Code generation utilities
- Dependency management tools

### ✅ **Documentation & Analysis**
- API documentation generation
- Bundle analysis and optimization
- Performance benchmarking
- Security audit automation

### ✅ **CI/CD Integration**
- Deployment scripts
- Environment configuration
- Artifact management
- Quality gate validation

### ❌ **What Does NOT Go Here**
- Test files (belong in `src/tests/` or `test/`)
- Source code or application logic
- Configuration files (belong in root or `config/`)
- Example applications (belong in `examples/`)

## 🎯 Industry Examples

**React (`facebook/react`):**
- `scripts/release/` - Complete release pipeline
- `scripts/rollup/` - Build configuration
- `scripts/devtools/` - Development utilities
- `scripts/bench/` - Performance benchmarking

**Next.js (`vercel/next.js`):**
- `scripts/release.ts` - Release automation
- `scripts/patch-next.ts` - Development patching
- `scripts/deploy-examples.sh` - Deployment automation
- `scripts/install-native.mjs` - Dependency management

**Vite (`vitejs/vite`):**
- `scripts/release.ts` - Automated releases
- `scripts/releaseUtils.ts` - Release utilities
- `scripts/publishCI.ts` - CI publishing

## 🔄 Script Usage Patterns

### Release Workflow
```bash
# Development release
node scripts/release.mjs patch --dry-run

# Production release  
node scripts/release.mjs minor
```

### Documentation Updates
```bash
# Generate all docs
node scripts/generate-docs.mjs

# Analyze bundle
node scripts/analyze-bundle.mjs
```

### Development Setup
```bash
# First-time setup
node scripts/setup-dev.mjs

# Reset environment
node scripts/dev.mjs reset
```

## 🎨 Script Design Principles

1. **Automation First**: Reduce manual steps in common workflows
2. **Error Resilience**: Graceful failure handling with rollback capabilities  
3. **Dry Run Support**: Safe testing before making changes
4. **Clear Output**: Structured logging with progress indicators
5. **CI/CD Ready**: Proper exit codes and machine-readable output
6. **Cross-Platform**: Works on Windows, macOS, and Linux

## 📈 Benefits of Proper Script Organization

- **Predictable Structure**: Other developers know where to find tools
- **Maintainable Automation**: Centralized build and release logic  
- **Team Onboarding**: New contributors can quickly understand workflows
- **CI/CD Integration**: Easy to integrate with automated pipelines
- **Industry Standard**: Follows patterns from major open source projects

This approach separates concerns properly:
- `scripts/` = Build automation and tooling
- `src/tests/` = Application and unit tests
- `test/` or `__tests__/` = Integration and E2E tests