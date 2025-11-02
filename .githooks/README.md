# Git Hooks

This directory contains git hooks that are tracked in version control and shared across all developers.

## Setup

The repository is configured to use `.githooks/` as the hooks directory via:
```bash
git config core.hooksPath .githooks
```

This configuration should be automatically applied when cloning the repository, but if hooks aren't working, you can run:
```bash
pnpm setup
```

## Available Hooks

### `pre-commit`
Runs before each commit to ensure code quality:

- **Linting & Formatting**: `pnpm lint:check` (Ultracite/BiomeJS)
- **Tests**: `pnpm test` (Full test suite)  
- **Build Validation**: `pnpm build` (TypeScript compilation)

The hook will prevent commits if any of these checks fail.

## Manual Installation

If you need to manually install the hooks:

```bash
node scripts/setup-dev.mjs
```

## Why Tracked Hooks?

- **Consistency**: All developers get the same pre-commit validation
- **No Setup Required**: Hooks are automatically available after clone
- **Version Controlled**: Hook changes are tracked and can be reviewed
- **Team Standards**: Enforces project quality standards automatically

## Bypassing Hooks (Emergency Only)

If you need to bypass hooks temporarily:
```bash
git commit --no-verify -m "emergency commit"
```

**Note**: Use sparingly and only for urgent fixes. The hook validates important quality checks.