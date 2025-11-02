/**
 * Workspace Plugin - Comprehensive Test Suite (Vitest)
 *
 * Comprehensive tests for workspace functionality including:
 * - Monorepo detection and configuration loading
 * - Package discovery across different workspace types
 * - Dependency graph building and analysis
 * - Batch operations and filtering
 * - Change detection and affected package analysis
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureDir, writeFile } from '../../core/execution/fs.js';
import {
  detectPackageManager,
  detectWorkspaceType,
  discoverPackages,
  filterPackages,
  getWorkspaceSummary,
  isWorkspace,
  loadWorkspace,
  type PackageFilter,
  validateWorkspace,
} from '../../plugins/workspace.js';

// Mock workspace structures for testing
interface MockWorkspace {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Create a mock workspace for testing
 */
async function createMockWorkspace(
  type: 'nx' | 'lerna' | 'rush' | 'pnpm' | 'yarn' | 'npm' | 'multi'
): Promise<MockWorkspace> {
  const workspacePath = path.join(
    os.tmpdir(),
    `workspace-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  try {
    await ensureDir(workspacePath);

    // Create different workspace configurations based on type
    switch (type) {
      case 'nx':
        await createNxWorkspace(workspacePath);
        break;
      case 'lerna':
        await createLernaWorkspace(workspacePath);
        break;
      case 'rush':
        await createRushWorkspace(workspacePath);
        break;
      case 'pnpm':
        await createPnpmWorkspace(workspacePath);
        break;
      case 'yarn':
        await createYarnWorkspace(workspacePath);
        break;
      case 'npm':
        await createNpmWorkspace(workspacePath);
        break;
      case 'multi':
        await createMultiToolWorkspace(workspacePath);
        break;
    }

    const cleanup = async () => {
      try {
        await fs.rm(workspacePath, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Cleanup warning for ${workspacePath}:`, error);
      }
    };

    return { path: workspacePath, cleanup };
  } catch (error) {
    try {
      await fs.rm(workspacePath, { recursive: true, force: true });
    } catch {}
    throw error;
  }
}

async function createNxWorkspace(workspacePath: string): Promise<void> {
  // Root package.json
  await writeFile(
    path.join(workspacePath, 'package.json'),
    JSON.stringify(
      {
        name: 'nx-workspace',
        version: '1.0.0',
        private: true,
        scripts: {
          build: 'nx run-many --target=build',
          test: 'nx run-many --target=test',
        },
        devDependencies: {
          '@nx/workspace': '^17.0.0',
        },
      },
      null,
      2
    )
  );

  // nx.json configuration
  await writeFile(
    path.join(workspacePath, 'nx.json'),
    JSON.stringify(
      {
        version: 3,
        projects: {
          'app-one': 'apps/app-one',
          'lib-shared': 'libs/shared',
        },
        targetDefaults: {
          build: {
            cache: true,
          },
        },
      },
      null,
      2
    )
  );

  // Create apps directory and app-one
  await ensureDir(path.join(workspacePath, 'apps', 'app-one'));
  await writeFile(
    path.join(workspacePath, 'apps', 'app-one', 'package.json'),
    JSON.stringify(
      {
        name: 'app-one',
        version: '1.0.0',
        private: true,
        dependencies: {
          'lib-shared': '*',
        },
        scripts: {
          build: 'echo "Building app-one"',
          test: 'echo "Testing app-one"',
        },
      },
      null,
      2
    )
  );

  // Create libs directory and shared lib
  await ensureDir(path.join(workspacePath, 'libs', 'shared'));
  await writeFile(
    path.join(workspacePath, 'libs', 'shared', 'package.json'),
    JSON.stringify(
      {
        name: 'lib-shared',
        version: '1.0.0',
        private: true,
        scripts: {
          build: 'echo "Building lib-shared"',
          test: 'echo "Testing lib-shared"',
        },
      },
      null,
      2
    )
  );
}

async function createLernaWorkspace(workspacePath: string): Promise<void> {
  // Root package.json
  await writeFile(
    path.join(workspacePath, 'package.json'),
    JSON.stringify(
      {
        name: 'lerna-workspace',
        version: '1.0.0',
        private: true,
        workspaces: ['packages/*'],
        scripts: {
          bootstrap: 'lerna bootstrap',
          build: 'lerna run build',
        },
      },
      null,
      2
    )
  );

  // lerna.json
  await writeFile(
    path.join(workspacePath, 'lerna.json'),
    JSON.stringify(
      {
        version: 'independent',
        packages: ['packages/*'],
        npmClient: 'npm',
        command: {
          bootstrap: {
            ignore: 'component-*',
            npmClientArgs: ['--no-package-lock'],
          },
        },
      },
      null,
      2
    )
  );

  // Create packages
  await ensureDir(path.join(workspacePath, 'packages', 'pkg-a'));
  await writeFile(
    path.join(workspacePath, 'packages', 'pkg-a', 'package.json'),
    JSON.stringify(
      {
        name: 'pkg-a',
        version: '1.2.0',
        dependencies: {
          'pkg-b': '^2.0.0',
          lodash: '^4.17.21',
        },
        scripts: {
          build: 'echo "Building pkg-a"',
        },
      },
      null,
      2
    )
  );

  await ensureDir(path.join(workspacePath, 'packages', 'pkg-b'));
  await writeFile(
    path.join(workspacePath, 'packages', 'pkg-b', 'package.json'),
    JSON.stringify(
      {
        name: 'pkg-b',
        version: '2.0.0',
        scripts: {
          build: 'echo "Building pkg-b"',
        },
      },
      null,
      2
    )
  );
}

async function createRushWorkspace(workspacePath: string): Promise<void> {
  // rush.json
  await writeFile(
    path.join(workspacePath, 'rush.json'),
    JSON.stringify(
      {
        rushVersion: '5.82.0',
        pnpmVersion: '7.15.0',
        nodeSupportedVersionRange: '>=14.15.0 <19.0.0',
        projects: [
          {
            packageName: 'service-api',
            projectFolder: 'apps/service-api',
          },
          {
            packageName: 'shared-utils',
            projectFolder: 'libs/shared-utils',
          },
        ],
      },
      null,
      2
    )
  );

  // Create apps/service-api
  await ensureDir(path.join(workspacePath, 'apps', 'service-api'));
  await writeFile(
    path.join(workspacePath, 'apps', 'service-api', 'package.json'),
    JSON.stringify(
      {
        name: 'service-api',
        version: '1.0.0',
        dependencies: {
          'shared-utils': 'workspace:*',
          express: '^4.18.0',
        },
        scripts: {
          build: 'echo "Building service-api"',
          start: 'node dist/index.js',
        },
      },
      null,
      2
    )
  );

  // Create libs/shared-utils
  await ensureDir(path.join(workspacePath, 'libs', 'shared-utils'));
  await writeFile(
    path.join(workspacePath, 'libs', 'shared-utils', 'package.json'),
    JSON.stringify(
      {
        name: 'shared-utils',
        version: '1.0.0',
        scripts: {
          build: 'echo "Building shared-utils"',
        },
      },
      null,
      2
    )
  );
}

async function createPnpmWorkspace(workspacePath: string): Promise<void> {
  // Root package.json
  await writeFile(
    path.join(workspacePath, 'package.json'),
    JSON.stringify(
      {
        name: 'pnpm-workspace',
        version: '1.0.0',
        private: true,
        scripts: {
          build: 'pnpm -r run build',
          test: 'pnpm -r run test',
        },
      },
      null,
      2
    )
  );

  // pnpm-workspace.yaml
  await writeFile(
    path.join(workspacePath, 'pnpm-workspace.yaml'),
    'packages:\n  - "packages/*"\n  - "apps/*"\n'
  );

  // pnpm-lock.yaml (empty for testing)
  await writeFile(path.join(workspacePath, 'pnpm-lock.yaml'), '# pnpm lock file\n');

  // Create packages
  await ensureDir(path.join(workspacePath, 'packages', 'utils'));
  await writeFile(
    path.join(workspacePath, 'packages', 'utils', 'package.json'),
    JSON.stringify(
      {
        name: '@workspace/utils',
        version: '1.0.0',
        scripts: {
          build: 'echo "Building utils"',
        },
      },
      null,
      2
    )
  );

  await ensureDir(path.join(workspacePath, 'apps', 'web'));
  await writeFile(
    path.join(workspacePath, 'apps', 'web', 'package.json'),
    JSON.stringify(
      {
        name: '@workspace/web',
        version: '1.0.0',
        dependencies: {
          '@workspace/utils': 'workspace:*',
        },
        scripts: {
          build: 'echo "Building web"',
          dev: 'echo "Starting dev server"',
        },
      },
      null,
      2
    )
  );
}

async function createYarnWorkspace(workspacePath: string): Promise<void> {
  // Root package.json
  await writeFile(
    path.join(workspacePath, 'package.json'),
    JSON.stringify(
      {
        name: 'yarn-workspace',
        version: '1.0.0',
        private: true,
        workspaces: ['packages/*'],
        scripts: {
          build: 'yarn workspaces run build',
        },
      },
      null,
      2
    )
  );

  // yarn.lock (empty for testing)
  await writeFile(path.join(workspacePath, 'yarn.lock'), '# yarn lock file\n');

  // Create packages
  await ensureDir(path.join(workspacePath, 'packages', 'core'));
  await writeFile(
    path.join(workspacePath, 'packages', 'core', 'package.json'),
    JSON.stringify(
      {
        name: 'core',
        version: '1.0.0',
        scripts: {
          build: 'echo "Building core"',
        },
      },
      null,
      2
    )
  );

  await ensureDir(path.join(workspacePath, 'packages', 'ui'));
  await writeFile(
    path.join(workspacePath, 'packages', 'ui', 'package.json'),
    JSON.stringify(
      {
        name: 'ui',
        version: '1.0.0',
        dependencies: {
          core: '^1.0.0',
        },
        scripts: {
          build: 'echo "Building ui"',
        },
      },
      null,
      2
    )
  );
}

async function createNpmWorkspace(workspacePath: string): Promise<void> {
  // Root package.json with npm workspaces
  await writeFile(
    path.join(workspacePath, 'package.json'),
    JSON.stringify(
      {
        name: 'npm-workspace',
        version: '1.0.0',
        private: true,
        workspaces: ['packages/*'],
      },
      null,
      2
    )
  );

  // package-lock.json (empty for testing)
  await writeFile(path.join(workspacePath, 'package-lock.json'), '{}');

  // Create packages
  await ensureDir(path.join(workspacePath, 'packages', 'common'));
  await writeFile(
    path.join(workspacePath, 'packages', 'common', 'package.json'),
    JSON.stringify(
      {
        name: 'common',
        version: '1.0.0',
      },
      null,
      2
    )
  );
}

async function createMultiToolWorkspace(workspacePath: string): Promise<void> {
  // Root package.json with workspaces
  await writeFile(
    path.join(workspacePath, 'package.json'),
    JSON.stringify(
      {
        name: 'multi-tool-workspace',
        version: '1.0.0',
        private: true,
        workspaces: ['packages/*', 'apps/*'],
        scripts: {
          build: 'turbo run build',
        },
      },
      null,
      2
    )
  );

  // Multiple configuration files
  await writeFile(
    path.join(workspacePath, 'lerna.json'),
    JSON.stringify(
      {
        version: 'independent',
        packages: ['packages/*', 'apps/*'],
      },
      null,
      2
    )
  );

  await writeFile(
    path.join(workspacePath, 'turbo.json'),
    JSON.stringify(
      {
        schema: 'https://turbo.build/schema.json',
        pipeline: {
          build: {
            dependsOn: ['^build'],
          },
          test: {},
        },
      },
      null,
      2
    )
  );

  await writeFile(
    path.join(workspacePath, 'nx.json'),
    JSON.stringify(
      {
        version: 3,
        projects: {
          'multi-app': 'apps/multi-app',
          'multi-lib': 'packages/multi-lib',
        },
      },
      null,
      2
    )
  );

  // Create packages
  await ensureDir(path.join(workspacePath, 'packages', 'multi-lib'));
  await writeFile(
    path.join(workspacePath, 'packages', 'multi-lib', 'package.json'),
    JSON.stringify(
      {
        name: 'multi-lib',
        version: '1.0.0',
        scripts: {
          build: 'echo "Building multi-lib"',
          test: 'echo "Testing multi-lib"',
        },
      },
      null,
      2
    )
  );

  await ensureDir(path.join(workspacePath, 'apps', 'multi-app'));
  await writeFile(
    path.join(workspacePath, 'apps', 'multi-app', 'package.json'),
    JSON.stringify(
      {
        name: 'multi-app',
        version: '1.0.0',
        dependencies: {
          'multi-lib': '^1.0.0',
        },
        scripts: {
          build: 'echo "Building multi-app"',
          test: 'echo "Testing multi-app"',
        },
      },
      null,
      2
    )
  );
}

describe('Workspace Plugin - Comprehensive Tests', () => {
  let mockWorkspace: MockWorkspace;

  afterEach(async () => {
    if (mockWorkspace) {
      await mockWorkspace.cleanup();
    }
  });

  describe('Workspace Detection', () => {
    it('should detect Nx workspace correctly', async () => {
      mockWorkspace = await createMockWorkspace('nx');

      expect(await isWorkspace(mockWorkspace.path)).toBe(true);
      expect(await detectWorkspaceType(mockWorkspace.path)).toBe('nx');
      expect(await detectPackageManager(mockWorkspace.path)).toBe('npm');
    });

    it('should detect Lerna workspace correctly', async () => {
      mockWorkspace = await createMockWorkspace('lerna');

      expect(await isWorkspace(mockWorkspace.path)).toBe(true);
      expect(await detectWorkspaceType(mockWorkspace.path)).toBe('lerna');
      expect(await detectPackageManager(mockWorkspace.path)).toBe('npm');
    });

    it('should detect Rush workspace correctly', async () => {
      mockWorkspace = await createMockWorkspace('rush');

      expect(await isWorkspace(mockWorkspace.path)).toBe(true);
      expect(await detectWorkspaceType(mockWorkspace.path)).toBe('rush');
      expect(await detectPackageManager(mockWorkspace.path)).toBe('rush');
    });

    it('should detect pnpm workspace correctly', async () => {
      mockWorkspace = await createMockWorkspace('pnpm');

      expect(await isWorkspace(mockWorkspace.path)).toBe(true);
      expect(await detectWorkspaceType(mockWorkspace.path)).toBe('pnpm-workspace');
      expect(await detectPackageManager(mockWorkspace.path)).toBe('pnpm');
    });

    it('should detect yarn workspace correctly', async () => {
      mockWorkspace = await createMockWorkspace('yarn');

      expect(await isWorkspace(mockWorkspace.path)).toBe(true);
      expect(await detectWorkspaceType(mockWorkspace.path)).toBe('yarn-workspace');
      expect(await detectPackageManager(mockWorkspace.path)).toBe('yarn');
    });

    it('should detect npm workspace correctly', async () => {
      mockWorkspace = await createMockWorkspace('npm');

      expect(await isWorkspace(mockWorkspace.path)).toBe(true);
      expect(await detectWorkspaceType(mockWorkspace.path)).toBe('npm-workspace');
      expect(await detectPackageManager(mockWorkspace.path)).toBe('npm');
    });

    it('should detect multi-tool workspace correctly', async () => {
      mockWorkspace = await createMockWorkspace('multi');

      expect(await isWorkspace(mockWorkspace.path)).toBe(true);
      expect(await detectWorkspaceType(mockWorkspace.path)).toBe('nx'); // Nx has priority in multi-tool setup
    });
  });

  describe('Package Discovery', () => {
    it('should discover Nx packages correctly', async () => {
      mockWorkspace = await createMockWorkspace('nx');
      const packages = await discoverPackages(mockWorkspace.path);

      expect(packages).toHaveLength(2);
      expect(packages.map((p) => p.name)).toContain('app-one');
      expect(packages.map((p) => p.name)).toContain('lib-shared');

      const appOne = packages.find((p) => p.name === 'app-one');
      expect(appOne).toBeDefined();
      if (appOne) {
        expect(appOne.isPrivate).toBe(true);
        expect(appOne.dependencies.has('lib-shared')).toBe(true);
      }
    });

    it('should discover Lerna packages correctly', async () => {
      mockWorkspace = await createMockWorkspace('lerna');
      const packages = await discoverPackages(mockWorkspace.path);

      expect(packages).toHaveLength(2);
      expect(packages.map((p) => p.name)).toContain('pkg-a');
      expect(packages.map((p) => p.name)).toContain('pkg-b');

      const pkgA = packages.find((p) => p.name === 'pkg-a');
      expect(pkgA).toBeDefined();
      if (pkgA) {
        expect(pkgA.version).toBe('1.2.0');
        expect(pkgA.dependencies.has('pkg-b')).toBe(true);
        expect(pkgA.dependencies.has('lodash')).toBe(true);
      }
    });

    it('should discover Rush packages correctly', async () => {
      mockWorkspace = await createMockWorkspace('rush');
      const packages = await discoverPackages(mockWorkspace.path);

      expect(packages).toHaveLength(2);
      expect(packages.map((p) => p.name)).toContain('service-api');
      expect(packages.map((p) => p.name)).toContain('shared-utils');

      const serviceApi = packages.find((p) => p.name === 'service-api');
      expect(serviceApi).toBeDefined();
      expect(serviceApi?.dependencies.has('shared-utils')).toBe(true);
      expect(serviceApi?.dependencies.has('express')).toBe(true);
    });

    it('should discover pnpm workspace packages correctly', async () => {
      mockWorkspace = await createMockWorkspace('pnpm');
      const packages = await discoverPackages(mockWorkspace.path);

      expect(packages).toHaveLength(2);
      expect(packages.map((p) => p.name)).toContain('@workspace/utils');
      expect(packages.map((p) => p.name)).toContain('@workspace/web');

      const web = packages.find((p) => p.name === '@workspace/web');
      expect(web).toBeDefined();
      expect(web?.dependencies.has('@workspace/utils')).toBe(true);
    });
  });

  describe('Workspace Configuration Loading', () => {
    it('should load complete workspace configuration', async () => {
      mockWorkspace = await createMockWorkspace('nx');
      const workspace = await loadWorkspace(mockWorkspace.path);

      expect(workspace.type).toBe('nx');
      expect(workspace.packageManager).toBe('npm');
      expect(workspace.packages).toHaveLength(2);
      expect(workspace.tools.hasNx).toBe(true);
      expect(workspace.tools.configurations.nx).toBeDefined();
      expect(workspace.dependencyGraph.nodes.size).toBe(2);
    });

    it('should build dependency graph correctly', async () => {
      mockWorkspace = await createMockWorkspace('nx');
      const workspace = await loadWorkspace(mockWorkspace.path);

      const libSharedNode = workspace.dependencyGraph.nodes.get('lib-shared');
      const appOneNode = workspace.dependencyGraph.nodes.get('app-one');

      expect(libSharedNode).toBeDefined();
      expect(appOneNode).toBeDefined();
      expect(libSharedNode?.dependents.has('app-one')).toBe(true);
      expect(appOneNode?.dependencies.has('lib-shared')).toBe(true);
      expect(workspace.dependencyGraph.topologicalOrder).toEqual(['lib-shared', 'app-one']);
    });

    it('should detect circular dependencies', async () => {
      mockWorkspace = await createMockWorkspace('lerna');

      // Modify pkg-b to depend on pkg-a, creating a circular dependency
      const pkgBPath = path.join(mockWorkspace.path, 'packages', 'pkg-b', 'package.json');
      const pkgBJson = {
        name: 'pkg-b',
        version: '2.0.0',
        dependencies: {
          'pkg-a': '^1.2.0', // This creates a circular dependency
        },
        scripts: {
          build: 'echo "Building pkg-b"',
        },
      };
      await writeFile(pkgBPath, JSON.stringify(pkgBJson, null, 2));

      const workspace = await loadWorkspace(mockWorkspace.path);
      expect(workspace.dependencyGraph.circularDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('Package Filtering', () => {
    it('should filter packages by name', async () => {
      mockWorkspace = await createMockWorkspace('nx');
      const packages = await discoverPackages(mockWorkspace.path);

      const filter: PackageFilter = { names: ['app-one'] };
      const filtered = filterPackages(packages, filter);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('app-one');
    });

    it('should filter packages by script presence', async () => {
      mockWorkspace = await createMockWorkspace('pnpm');
      const packages = await discoverPackages(mockWorkspace.path);

      const filter: PackageFilter = { hasScript: 'dev' };
      const filtered = filterPackages(packages, filter);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('@workspace/web');
    });

    it('should filter packages by dependency', async () => {
      mockWorkspace = await createMockWorkspace('lerna');
      const packages = await discoverPackages(mockWorkspace.path);

      const filter: PackageFilter = { hasDependency: 'lodash' };
      const filtered = filterPackages(packages, filter);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('pkg-a');
    });

    it('should filter packages with custom function', async () => {
      mockWorkspace = await createMockWorkspace('nx');
      const packages = await discoverPackages(mockWorkspace.path);

      const filter: PackageFilter = {
        custom: (pkg) => pkg.name.startsWith('lib-'),
      };
      const filtered = filterPackages(packages, filter);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('lib-shared');
    });
  });

  describe('Workspace Validation', () => {
    it('should validate workspace without errors', async () => {
      mockWorkspace = await createMockWorkspace('nx');
      const workspace = await loadWorkspace(mockWorkspace.path);
      const validation = await validateWorkspace(workspace);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect circular dependency errors', async () => {
      mockWorkspace = await createMockWorkspace('lerna');

      // Create circular dependency
      const pkgBPath = path.join(mockWorkspace.path, 'packages', 'pkg-b', 'package.json');
      const pkgBJson = {
        name: 'pkg-b',
        version: '2.0.0',
        dependencies: {
          'pkg-a': '^1.2.0',
        },
      };
      await writeFile(pkgBPath, JSON.stringify(pkgBJson, null, 2));

      const workspace = await loadWorkspace(mockWorkspace.path);
      const validation = await validateWorkspace(workspace);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Circular dependency'))).toBe(true);
    });

    it('should warn about inconsistent dependency versions', async () => {
      mockWorkspace = await createMockWorkspace('multi');

      // Create another package that depends on multi-lib with a different version
      await ensureDir(path.join(mockWorkspace.path, 'apps', 'multi-app2'));
      const app2Json = {
        name: 'multi-app2',
        version: '1.0.0',
        dependencies: {
          'multi-lib': '^2.0.0', // Different version than multi-app (^1.0.0)
        },
      };
      await writeFile(
        path.join(mockWorkspace.path, 'apps', 'multi-app2', 'package.json'),
        JSON.stringify(app2Json, null, 2)
      );

      // Update nx.json to include the new package
      const nxConfigPath = path.join(mockWorkspace.path, 'nx.json');
      const nxConfig = {
        version: 3,
        projects: {
          'multi-app': 'apps/multi-app',
          'multi-app2': 'apps/multi-app2',
          'multi-lib': 'packages/multi-lib',
        },
      };
      await writeFile(nxConfigPath, JSON.stringify(nxConfig, null, 2));

      const workspace = await loadWorkspace(mockWorkspace.path);
      const validation = await validateWorkspace(workspace);

      expect(validation.warnings.some((w) => w.includes('Inconsistent versions'))).toBe(true);
    });
  });

  describe('Workspace Summary', () => {
    it('should generate correct workspace summary', async () => {
      mockWorkspace = await createMockWorkspace('nx');
      const workspace = await loadWorkspace(mockWorkspace.path);
      const summary = getWorkspaceSummary(workspace);

      expect(summary.totalPackages).toBe(2);
      expect(summary.packagesByType.private).toBe(2);
      expect(summary.packagesByType.public).toBe(0);
      expect(summary.tools).toContain('Nx');
      expect(summary.dependencyStats.workspaceDependencies).toBe(1);
    });

    it('should handle multi-tool workspace summary', async () => {
      mockWorkspace = await createMockWorkspace('multi');
      const workspace = await loadWorkspace(mockWorkspace.path);
      const summary = getWorkspaceSummary(workspace);

      expect(summary.tools.length).toBeGreaterThan(1);
      expect(summary.tools).toContain('Nx');
      expect(summary.tools).toContain('Lerna');
      expect(summary.tools).toContain('Workspaces');
    });
  });
});
