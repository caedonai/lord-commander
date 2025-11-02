/**
 * Workspace Plugin - Monorepo detection and management utilities
 *
 * Provides comprehensive monorepo support for CLI tools including:
 * - Multi-tool monorepo detection (Nx, Lerna, Rush, Turborepo, pnpm, yarn, npm workspaces)
 * - Package discovery and workspace mapping
 * - Dependency analysis and graph building
 * - Batch operations across packages
 * - Change detection and affected package identification
 */

import path from 'node:path';
import { exists, readDir, readFile } from '../core/execution/fs.js';
import { CLIError } from '../core/foundation/errors/errors.js';
import { createLogger } from '../core/ui/logger.js';
import { ConfigValue } from '../types/common.js';

const workspaceLogger = createLogger({ prefix: 'workspace' });

// Simple glob pattern matching for workspace patterns
async function simpleGlob(
  pattern: string,
  options: { cwd: string; onlyDirectories?: boolean }
): Promise<string[]> {
  const { cwd, onlyDirectories = false } = options;

  // Handle simple wildcard patterns like "packages/*" or "apps/*"
  if (pattern.endsWith('/*')) {
    const baseDir = pattern.slice(0, -2);
    const fullPath = path.join(cwd, baseDir);

    if (!exists(fullPath)) {
      return [];
    }

    try {
      const entries = await readDir(fullPath);
      const results = [];

      for (const entry of entries) {
        if (onlyDirectories && !entry.isDirectory) continue;
        results.push(path.join(baseDir, entry.name));
      }

      return results;
    } catch {
      return [];
    }
  }

  // For exact patterns, just check if they exist
  const fullPath = path.join(cwd, pattern);
  if (exists(fullPath)) {
    return [pattern];
  }

  return [];
}

// Core workspace interfaces
export interface WorkspacePackage {
  name: string;
  version: string;
  path: string;
  relativePath: string;
  packageJson: PackageJson;
  dependencies: Map<string, string>;
  devDependencies: Map<string, string>;
  peerDependencies: Map<string, string>;
  scripts: Map<string, string>;
  isPrivate: boolean;
  workspaceDependencies: string[];
}

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  module?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  private?: boolean;
  workspaces?: string[] | { packages: string[]; nohoist?: string[] };
  nx?: Record<string, ConfigValue>;
  turbo?: Record<string, ConfigValue>;
  packageManager?: string;
}

export interface WorkspaceConfiguration {
  type: WorkspaceType;
  root: string;
  packages: WorkspacePackage[];
  packageMap: Map<string, WorkspacePackage>;
  dependencyGraph: DependencyGraph;
  tools: WorkspaceTools;
  packageManager: PackageManager;
  scripts: Map<string, string>;
}

export interface WorkspaceTools {
  hasNx: boolean;
  hasLerna: boolean;
  hasRush: boolean;
  hasTurbo: boolean;
  hasWorkspaces: boolean;
  configurations: {
    nx?: NxConfiguration;
    lerna?: LernaConfiguration;
    rush?: RushConfiguration;
    turbo?: TurboConfiguration;
    workspaces?: WorkspacesConfiguration;
  };
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
  topologicalOrder: string[];
  circularDependencies: string[][];
}

export interface DependencyNode {
  name: string;
  package: WorkspacePackage;
  dependencies: Set<string>;
  dependents: Set<string>;
  depth: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies';
}

// Workspace tool configurations
export interface NxConfiguration {
  version: string;
  projects: Record<string, ConfigValue>;
  targetDefaults?: Record<string, ConfigValue>;
  namedInputs?: Record<string, ConfigValue>;
  generators?: Record<string, ConfigValue>;
  tasksRunnerOptions?: Record<string, ConfigValue>;
}

export interface LernaConfiguration {
  version: string;
  packages: string[];
  npmClient?: string;
  useWorkspaces?: boolean;
  command?: Record<string, ConfigValue>;
}

export interface RushConfiguration {
  rushVersion: string;
  projects: Array<{
    packageName: string;
    projectFolder: string;
    reviewCategory?: string;
  }>;
  nodeSupportedVersionRange?: string;
}

export interface TurboConfiguration {
  schema?: string;
  globalDependencies?: string[];
  pipeline: Record<string, ConfigValue>;
  globalEnv?: string[];
}

export interface WorkspacesConfiguration {
  packages: string[];
  nohoist?: string[];
}

// Enums and types
export type WorkspaceType =
  | 'nx'
  | 'lerna'
  | 'rush'
  | 'turbo'
  | 'pnpm-workspace'
  | 'yarn-workspace'
  | 'npm-workspace'
  | 'multi-tool'
  | 'single-package';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'rush' | 'auto';

export interface BatchOperationOptions {
  concurrency?: number;
  continueOnError?: boolean;
  filter?: PackageFilter;
  scope?: string[];
  ignore?: string[];
  since?: string;
  onProgress?: (current: number, total: number, packageName: string) => void;
  onPackageComplete?: (pkg: WorkspacePackage, result: unknown) => void;
  onPackageError?: (pkg: WorkspacePackage, error: Error) => void;
}

export interface PackageFilter {
  names?: string[];
  paths?: string[];
  hasScript?: string;
  hasDependency?: string;
  isPrivate?: boolean;
  custom?: (pkg: WorkspacePackage) => boolean;
}

export interface ChangeDetectionOptions {
  since?: string;
  base?: string;
  head?: string;
  includeUncommitted?: boolean;
  includeDependents?: boolean;
  maxDepth?: number;
}

// Package manager detection
const LOCKFILE_PATTERNS: Record<PackageManager, string[]> = {
  npm: ['package-lock.json'],
  yarn: ['yarn.lock'],
  pnpm: ['pnpm-lock.yaml'],
  bun: ['bun.lockb'],
  rush: ['rush.json', 'common/config/rush/rush.json'],
  auto: [],
};

/**
 * Detect if the current directory contains a monorepo workspace
 */
export async function isWorkspace(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await detectWorkspaceType(cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect the type of workspace/monorepo setup
 */
export async function detectWorkspaceType(cwd: string = process.cwd()): Promise<WorkspaceType> {
  const detectors = [
    { type: 'nx' as const, files: ['nx.json', 'workspace.json'] },
    { type: 'rush' as const, files: ['rush.json'] },
    { type: 'lerna' as const, files: ['lerna.json'] },
    { type: 'turbo' as const, files: ['turbo.json'] },
    { type: 'pnpm-workspace' as const, files: ['pnpm-workspace.yaml'] },
  ];

  const detectedTools: WorkspaceType[] = [];

  // Check for specific workspace configuration files
  for (const detector of detectors) {
    for (const file of detector.files) {
      if (await exists(path.join(cwd, file))) {
        detectedTools.push(detector.type);
        break;
      }
    }
  }

  // Check for npm/yarn workspaces in package.json
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (await exists(packageJsonPath)) {
      const packageJson: PackageJson = JSON.parse(await readFile(packageJsonPath));

      if (packageJson.workspaces) {
        // Determine if it's npm or yarn based on lockfiles
        if (await exists(path.join(cwd, 'yarn.lock'))) {
          detectedTools.push('yarn-workspace');
        } else {
          detectedTools.push('npm-workspace');
        }
      }
    }
  } catch {
    // Ignore package.json parse errors
  }

  // Return the most specific type (prioritize explicit tool configs over generic workspaces)
  if (detectedTools.length === 0) {
    return 'single-package';
  } else if (detectedTools.length === 1) {
    return detectedTools[0];
  } else {
    // When multiple tools are detected, prioritize specific tools over generic workspaces
    const priorityOrder: WorkspaceType[] = [
      'nx',
      'rush',
      'lerna',
      'turbo',
      'pnpm-workspace',
      'yarn-workspace',
      'npm-workspace',
    ];
    for (const tool of priorityOrder) {
      if (detectedTools.includes(tool)) {
        return tool;
      }
    }
    return 'multi-tool';
  }
}

/**
 * Detect the package manager being used
 */
export async function detectPackageManager(cwd: string = process.cwd()): Promise<PackageManager> {
  // Check for specific lockfiles
  for (const [manager, patterns] of Object.entries(LOCKFILE_PATTERNS)) {
    if (manager === 'auto') continue;

    for (const pattern of patterns) {
      if (await exists(path.join(cwd, pattern))) {
        return manager as PackageManager;
      }
    }
  }

  // Check for packageManager field in package.json
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (await exists(packageJsonPath)) {
      const packageJson: PackageJson = JSON.parse(await readFile(packageJsonPath));

      if (packageJson.packageManager && typeof packageJson.packageManager === 'string') {
        const manager = packageJson.packageManager.split('@')[0];
        if (['npm', 'yarn', 'pnpm', 'bun'].includes(manager)) {
          return manager as PackageManager;
        }
      }
    }
  } catch {
    // Ignore parse errors
  }

  return 'npm'; // Default fallback
}

/**
 * Discover all packages in the workspace
 */
export async function discoverPackages(
  cwd: string = process.cwd(),
  workspaceType?: WorkspaceType
): Promise<WorkspacePackage[]> {
  const type = workspaceType || (await detectWorkspaceType(cwd));
  const packages: WorkspacePackage[] = [];

  try {
    let packagePaths: string[] = [];

    switch (type) {
      case 'nx':
        packagePaths = await discoverNxPackages(cwd);
        break;
      case 'lerna':
        packagePaths = await discoverLernaPackages(cwd);
        break;
      case 'rush':
        packagePaths = await discoverRushPackages(cwd);
        break;
      case 'pnpm-workspace':
      case 'yarn-workspace':
      case 'npm-workspace':
        packagePaths = await discoverWorkspacesPackages(cwd);
        break;
      case 'turbo':
        // Turbo usually relies on other workspace configurations
        packagePaths = await discoverWorkspacesPackages(cwd);
        break;
      case 'multi-tool':
        // Try multiple discovery methods
        packagePaths = await discoverMultiToolPackages(cwd);
        break;
      case 'single-package':
        packagePaths = [cwd];
        break;
    }

    // Process each discovered package
    for (const packagePath of packagePaths) {
      try {
        const pkg = await loadPackage(packagePath, cwd);
        if (pkg) {
          packages.push(pkg);
        }
      } catch (error) {
        workspaceLogger.warn(`Failed to load package at ${packagePath}: ${error}`);
      }
    }

    return packages;
  } catch (error) {
    throw new CLIError(`Failed to discover packages in workspace`, {
      code: 'WORKSPACE_DISCOVERY_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd, workspaceType: type },
    });
  }
}

/**
 * Load a single package from a directory
 */
async function loadPackage(
  packagePath: string,
  workspaceRoot: string
): Promise<WorkspacePackage | null> {
  const packageJsonPath = path.join(packagePath, 'package.json');

  if (!(await exists(packageJsonPath))) {
    return null;
  }

  try {
    const packageJson: PackageJson = JSON.parse(await readFile(packageJsonPath));

    if (!packageJson.name) {
      workspaceLogger.warn(`Package at ${packagePath} has no name field`);
      return null;
    }

    const dependencies = new Map(Object.entries(packageJson.dependencies || {}));
    const devDependencies = new Map(Object.entries(packageJson.devDependencies || {}));
    const peerDependencies = new Map(Object.entries(packageJson.peerDependencies || {}));
    const scripts = new Map(Object.entries(packageJson.scripts || {}));

    return {
      name: packageJson.name,
      version: packageJson.version || '0.0.0',
      path: packagePath,
      relativePath: path.relative(workspaceRoot, packagePath),
      packageJson,
      dependencies,
      devDependencies,
      peerDependencies,
      scripts,
      isPrivate: packageJson.private || false,
      workspaceDependencies: [], // Will be populated later
    };
  } catch (error) {
    throw new CLIError(`Failed to parse package.json at ${packagePath}`, {
      code: 'PACKAGE_JSON_PARSE_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { packagePath },
    });
  }
}

// Package discovery methods for different workspace types
async function discoverNxPackages(cwd: string): Promise<string[]> {
  const paths: string[] = [];

  try {
    // Try nx.json first
    const nxJsonPath = path.join(cwd, 'nx.json');
    if (await exists(nxJsonPath)) {
      const nxConfig: NxConfiguration = JSON.parse(await readFile(nxJsonPath));

      if (nxConfig.projects) {
        for (const [, projectConfig] of Object.entries(nxConfig.projects)) {
          if (typeof projectConfig === 'string') {
            paths.push(path.join(cwd, projectConfig));
          } else if (
            projectConfig &&
            typeof projectConfig === 'object' &&
            'root' in projectConfig
          ) {
            paths.push(path.join(cwd, projectConfig.root as string));
          }
        }
      }
    }

    // Try workspace.json as fallback
    const workspaceJsonPath = path.join(cwd, 'workspace.json');
    if (paths.length === 0 && (await exists(workspaceJsonPath))) {
      const workspaceConfig = JSON.parse(await readFile(workspaceJsonPath));

      if (workspaceConfig.projects) {
        for (const [, projectConfig] of Object.entries(workspaceConfig.projects)) {
          if (projectConfig && typeof projectConfig === 'object' && 'root' in projectConfig) {
            paths.push(path.join(cwd, (projectConfig as any).root));
          }
        }
      }
    }

    // If no explicit projects, scan common patterns
    if (paths.length === 0) {
      const patterns = ['apps/*', 'libs/*', 'packages/*', 'projects/*'];
      for (const pattern of patterns) {
        const matches = await simpleGlob(pattern, {
          cwd,
          onlyDirectories: true,
        });
        paths.push(...matches.map((match: string) => path.join(cwd, match)));
      }
    }

    return paths;
  } catch (error) {
    throw new CLIError('Failed to discover Nx packages', {
      code: 'NX_DISCOVERY_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd },
    });
  }
}

async function discoverLernaPackages(cwd: string): Promise<string[]> {
  try {
    const lernaJsonPath = path.join(cwd, 'lerna.json');
    const lernaConfig: LernaConfiguration = JSON.parse(await readFile(lernaJsonPath));

    const patterns = lernaConfig.packages || ['packages/*'];
    const paths: string[] = [];

    for (const pattern of patterns) {
      const matches = await simpleGlob(pattern, {
        cwd,
        onlyDirectories: true,
      });
      paths.push(...matches.map((match: string) => path.join(cwd, match)));
    }

    return paths;
  } catch (error) {
    throw new CLIError('Failed to discover Lerna packages', {
      code: 'LERNA_DISCOVERY_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd },
    });
  }
}

async function discoverRushPackages(cwd: string): Promise<string[]> {
  try {
    const rushJsonPath = path.join(cwd, 'rush.json');
    const rushConfig: RushConfiguration = JSON.parse(await readFile(rushJsonPath));

    return rushConfig.projects.map((project) => path.join(cwd, project.projectFolder));
  } catch (error) {
    throw new CLIError('Failed to discover Rush packages', {
      code: 'RUSH_DISCOVERY_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd },
    });
  }
}

async function discoverWorkspacesPackages(cwd: string): Promise<string[]> {
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    const packageJson: PackageJson = JSON.parse(await readFile(packageJsonPath));

    let workspacePatterns: string[] = [];

    if (packageJson.workspaces) {
      if (Array.isArray(packageJson.workspaces)) {
        workspacePatterns = packageJson.workspaces;
      } else if (packageJson.workspaces.packages) {
        workspacePatterns = packageJson.workspaces.packages;
      }
    }

    // Check pnpm-workspace.yaml
    const pnpmWorkspacePath = path.join(cwd, 'pnpm-workspace.yaml');
    if (workspacePatterns.length === 0 && (await exists(pnpmWorkspacePath))) {
      try {
        // Simple YAML parsing for packages field
        const yamlContent = await readFile(pnpmWorkspacePath);
        const packagesMatch = yamlContent.match(/packages:\s*\n((?:\s*-\s*.+\n?)*)/);
        if (packagesMatch) {
          workspacePatterns = packagesMatch[1]
            .split('\n')
            .map((line) =>
              line
                .trim()
                .replace(/^-\s*/, '')
                .replace(/['"](.+)['"]/, '$1')
            )
            .filter(Boolean);
        }
      } catch (error) {
        workspaceLogger.warn(`Failed to parse pnpm-workspace.yaml: ${error}`);
      }
    }

    if (workspacePatterns.length === 0) {
      // Default patterns if none specified
      workspacePatterns = ['packages/*'];
    }

    const paths: string[] = [];
    for (const pattern of workspacePatterns) {
      const matches = await simpleGlob(pattern, {
        cwd,
        onlyDirectories: true,
      });
      paths.push(...matches.map((match: string) => path.join(cwd, match)));
    }

    return paths;
  } catch (error) {
    throw new CLIError('Failed to discover workspace packages', {
      code: 'WORKSPACES_DISCOVERY_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd },
    });
  }
}

async function discoverMultiToolPackages(cwd: string): Promise<string[]> {
  const allPaths: Set<string> = new Set();

  // Try all discovery methods and combine results
  const discoveryMethods = [
    () => discoverNxPackages(cwd),
    () => discoverLernaPackages(cwd),
    () => discoverWorkspacesPackages(cwd),
    () => discoverRushPackages(cwd),
  ];

  for (const method of discoveryMethods) {
    try {
      const paths = await method();
      for (const p of paths) {
        allPaths.add(p);
      }
    } catch {
      // Ignore errors from individual discovery methods
    }
  }

  return Array.from(allPaths);
}

/**
 * Load complete workspace configuration
 */
export async function loadWorkspace(cwd: string = process.cwd()): Promise<WorkspaceConfiguration> {
  try {
    const workspaceType = await detectWorkspaceType(cwd);
    const packageManager = await detectPackageManager(cwd);
    const packages = await discoverPackages(cwd, workspaceType);
    const tools = await loadWorkspaceTools(cwd);

    // Create package map for quick lookups
    const packageMap = new Map<string, WorkspacePackage>();
    for (const pkg of packages) {
      packageMap.set(pkg.name, pkg);
    }

    // Build dependency graph
    const dependencyGraph = buildDependencyGraph(packages);

    // Load workspace-level scripts
    const scripts = await loadWorkspaceScripts(cwd);

    return {
      type: workspaceType,
      root: cwd,
      packages,
      packageMap,
      dependencyGraph,
      tools,
      packageManager,
      scripts,
    };
  } catch (error) {
    throw new CLIError(`Failed to load workspace configuration`, {
      code: 'WORKSPACE_LOAD_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { cwd },
    });
  }
}

/**
 * Load workspace tools configuration
 */
async function loadWorkspaceTools(cwd: string): Promise<WorkspaceTools> {
  const tools: WorkspaceTools = {
    hasNx: false,
    hasLerna: false,
    hasRush: false,
    hasTurbo: false,
    hasWorkspaces: false,
    configurations: {},
  };

  // Check for Nx
  const nxJsonPath = path.join(cwd, 'nx.json');
  if (await exists(nxJsonPath)) {
    tools.hasNx = true;
    try {
      tools.configurations.nx = JSON.parse(await readFile(nxJsonPath));
    } catch (error) {
      workspaceLogger.warn(`Failed to parse nx.json: ${error}`);
    }
  }

  // Check for Lerna
  const lernaJsonPath = path.join(cwd, 'lerna.json');
  if (await exists(lernaJsonPath)) {
    tools.hasLerna = true;
    try {
      tools.configurations.lerna = JSON.parse(await readFile(lernaJsonPath));
    } catch (error) {
      workspaceLogger.warn(`Failed to parse lerna.json: ${error}`);
    }
  }

  // Check for Rush
  const rushJsonPath = path.join(cwd, 'rush.json');
  if (await exists(rushJsonPath)) {
    tools.hasRush = true;
    try {
      tools.configurations.rush = JSON.parse(await readFile(rushJsonPath));
    } catch (error) {
      workspaceLogger.warn(`Failed to parse rush.json: ${error}`);
    }
  }

  // Check for Turbo
  const turboJsonPath = path.join(cwd, 'turbo.json');
  if (await exists(turboJsonPath)) {
    tools.hasTurbo = true;
    try {
      tools.configurations.turbo = JSON.parse(await readFile(turboJsonPath));
    } catch (error) {
      workspaceLogger.warn(`Failed to parse turbo.json: ${error}`);
    }
  }

  // Check for workspaces
  const packageJsonPath = path.join(cwd, 'package.json');
  if (await exists(packageJsonPath)) {
    try {
      const packageJson: PackageJson = JSON.parse(await readFile(packageJsonPath));
      if (packageJson.workspaces) {
        tools.hasWorkspaces = true;
        if (Array.isArray(packageJson.workspaces)) {
          tools.configurations.workspaces = { packages: packageJson.workspaces };
        } else if (packageJson.workspaces.packages) {
          tools.configurations.workspaces = packageJson.workspaces;
        }
      }
    } catch (error) {
      workspaceLogger.warn(`Failed to parse package.json: ${error}`);
    }
  }

  return tools;
}

/**
 * Load workspace-level scripts
 */
async function loadWorkspaceScripts(cwd: string): Promise<Map<string, string>> {
  const scripts = new Map<string, string>();

  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (await exists(packageJsonPath)) {
      const packageJson: PackageJson = JSON.parse(await readFile(packageJsonPath));
      if (packageJson.scripts) {
        Object.entries(packageJson.scripts).forEach(([name, script]) => {
          scripts.set(name, script);
        });
      }
    }
  } catch (error) {
    workspaceLogger.warn(`Failed to load workspace scripts: ${error}`);
  }

  return scripts;
}

/**
 * Build dependency graph for workspace packages
 */
function buildDependencyGraph(packages: WorkspacePackage[]): DependencyGraph {
  const nodes = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];
  const packageNames = new Set(packages.map((pkg) => pkg.name));

  // Initialize nodes
  packages.forEach((pkg) => {
    nodes.set(pkg.name, {
      name: pkg.name,
      package: pkg,
      dependencies: new Set(),
      dependents: new Set(),
      depth: 0,
    });
  });

  // Build edges and populate workspace dependencies
  packages.forEach((pkg) => {
    const node = nodes.get(pkg.name);
    if (!node) return;

    // Process dependencies
    ['dependencies', 'devDependencies', 'peerDependencies'].forEach((depType) => {
      const deps = pkg[depType as keyof WorkspacePackage] as Map<string, string> | undefined;
      if (!deps) return;

      deps.forEach((_, depName) => {
        if (packageNames.has(depName)) {
          // This is a workspace dependency
          pkg.workspaceDependencies.push(depName);
          node.dependencies.add(depName);

          const targetNode = nodes.get(depName);
          if (targetNode) {
            targetNode.dependents.add(pkg.name);
          }

          edges.push({
            from: pkg.name,
            to: depName,
            type: depType as 'dependencies' | 'devDependencies' | 'peerDependencies',
          });
        }
      });
    });
  });

  // Calculate depths (topological sort)
  const topologicalOrder = topologicalSort(nodes);

  // Detect circular dependencies
  const circularDependencies = detectCircularDependencies(nodes);

  return {
    nodes,
    edges,
    topologicalOrder,
    circularDependencies,
  };
}

/**
 * Perform topological sort on dependency graph
 */
function topologicalSort(nodes: Map<string, DependencyNode>): string[] {
  const visited = new Set<string>();
  const temp = new Set<string>();
  const result: string[] = [];

  function visit(nodeName: string): void {
    if (temp.has(nodeName)) return; // Circular dependency
    if (visited.has(nodeName)) return;

    temp.add(nodeName);
    const node = nodes.get(nodeName);
    if (node) {
      for (const depName of node.dependencies) {
        visit(depName);
      }
      node.depth = Math.max(
        node.depth,
        ...Array.from(node.dependencies).map((dep) => (nodes.get(dep)?.depth || 0) + 1)
      );
    }
    temp.delete(nodeName);
    visited.add(nodeName);
    result.push(nodeName);
  }

  nodes.forEach((_, nodeName) => {
    if (!visited.has(nodeName)) {
      visit(nodeName);
    }
  });

  return result;
}

/**
 * Detect circular dependencies in the graph
 */
function detectCircularDependencies(nodes: Map<string, DependencyNode>): string[][] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];
  const currentPath: string[] = [];

  function dfs(nodeName: string): boolean {
    visited.add(nodeName);
    recursionStack.add(nodeName);
    currentPath.push(nodeName);

    const node = nodes.get(nodeName);
    if (node) {
      for (const depName of node.dependencies) {
        if (!visited.has(depName)) {
          if (dfs(depName)) return true;
        } else if (recursionStack.has(depName)) {
          // Found a cycle
          const cycleStart = currentPath.indexOf(depName);
          cycles.push(currentPath.slice(cycleStart).concat([depName]));
          return true;
        }
      }
    }

    currentPath.pop();
    recursionStack.delete(nodeName);
    return false;
  }

  nodes.forEach((_, nodeName) => {
    if (!visited.has(nodeName)) {
      dfs(nodeName);
    }
  });

  return cycles;
}

// Batch operations and utility functions
/**
 * Filter packages based on criteria
 */
export function filterPackages(
  packages: WorkspacePackage[],
  filter: PackageFilter
): WorkspacePackage[] {
  return packages.filter((pkg) => {
    if (filter.names && !filter.names.includes(pkg.name)) return false;
    if (filter.paths && !filter.paths.some((p) => pkg.relativePath.includes(p))) return false;
    if (filter.hasScript && !pkg.scripts.has(filter.hasScript)) return false;
    if (filter.hasDependency) {
      const hasDep =
        pkg.dependencies.has(filter.hasDependency) ||
        pkg.devDependencies.has(filter.hasDependency) ||
        pkg.peerDependencies.has(filter.hasDependency);
      if (!hasDep) return false;
    }
    if (filter.isPrivate !== undefined && pkg.isPrivate !== filter.isPrivate) return false;
    if (filter.custom && !filter.custom(pkg)) return false;

    return true;
  });
}

/**
 * Run a script across multiple packages
 */
export async function runScript(
  packages: WorkspacePackage[],
  scriptName: string,
  options: BatchOperationOptions = {}
): Promise<Map<string, { success: boolean; output?: string; error?: Error }>> {
  const {
    concurrency = 4,
    continueOnError = false,
    filter,
    scope,
    ignore = [],
    onProgress,
    onPackageComplete,
    onPackageError,
  } = options;

  const results = new Map<string, { success: boolean; output?: string; error?: Error }>();
  let filteredPackages = packages;

  // Apply filters
  if (filter) {
    filteredPackages = filterPackages(filteredPackages, filter);
  }

  if (scope) {
    filteredPackages = filteredPackages.filter((pkg) =>
      scope.some((pattern) => pkg.name.includes(pattern) || pkg.relativePath.includes(pattern))
    );
  }

  if (ignore.length > 0) {
    filteredPackages = filteredPackages.filter(
      (pkg) =>
        !ignore.some((pattern) => pkg.name.includes(pattern) || pkg.relativePath.includes(pattern))
    );
  }

  // Filter packages that have the script
  const packagesWithScript = filteredPackages.filter((pkg) => pkg.scripts.has(scriptName));

  if (packagesWithScript.length === 0) {
    workspaceLogger.warn(`No packages found with script "${scriptName}"`);
    return results;
  }

  // Import execa here to avoid circular dependencies
  const { execa } = await import('../core/execution/execa.js');

  let completed = 0;
  const total = packagesWithScript.length;

  const runPackageScript = async (pkg: WorkspacePackage): Promise<void> => {
    try {
      // Get the script command (we know it exists from the filter)
      const scriptCommand = pkg.scripts.get(scriptName);
      if (!scriptCommand) {
        throw new Error(`Script '${scriptName}' not found in package ${pkg.name}`);
      }

      const result = await execa('npm', ['run', scriptName], {
        cwd: pkg.path,
        silent: true,
      });

      results.set(pkg.name, {
        success: true,
        output: result.stdout,
      });

      onPackageComplete?.(pkg, result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      results.set(pkg.name, {
        success: false,
        error: err,
      });

      onPackageError?.(pkg, err);

      if (!continueOnError) {
        throw err;
      }
    } finally {
      completed++;
      onProgress?.(completed, total, pkg.name);
    }
  };

  // Execute with concurrency limit
  const semaphore = Array(concurrency).fill(null);
  const packageQueue = [...packagesWithScript];

  await Promise.all(
    semaphore.map(async () => {
      while (packageQueue.length > 0) {
        const pkg = packageQueue.shift();
        if (pkg) {
          await runPackageScript(pkg);
        }
      }
    })
  );

  return results;
}

/**
 * Install dependencies for packages
 */
export async function installDependencies(
  packages: WorkspacePackage[],
  packageManager: PackageManager = 'npm',
  options: BatchOperationOptions = {}
): Promise<Map<string, { success: boolean; output?: string; error?: Error }>> {
  const { execa } = await import('../core/execution/execa.js');
  const results = new Map<string, { success: boolean; output?: string; error?: Error }>();

  let filteredPackages = packages;
  if (options.filter) {
    filteredPackages = filterPackages(filteredPackages, options.filter);
  }

  const commands: Record<PackageManager, string[]> = {
    npm: ['npm', 'install'],
    yarn: ['yarn', 'install'],
    pnpm: ['pnpm', 'install'],
    bun: ['bun', 'install'],
    rush: ['rush', 'install'],
    auto: ['npm', 'install'], // fallback
  };

  const [cmd, ...args] = commands[packageManager];
  let completed = 0;
  const total = filteredPackages.length;

  for (const pkg of filteredPackages) {
    try {
      const result = await execa(cmd, args, {
        cwd: pkg.path,
        silent: true,
      });

      results.set(pkg.name, {
        success: true,
        output: result.stdout,
      });

      options.onPackageComplete?.(pkg, result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      results.set(pkg.name, {
        success: false,
        error: err,
      });

      options.onPackageError?.(pkg, err);

      if (!options.continueOnError) {
        throw err;
      }
    } finally {
      completed++;
      options.onProgress?.(completed, total, pkg.name);
    }
  }

  return results;
}

/**
 * Get packages affected by changes since a specific commit/branch
 */
export async function getAffectedPackages(
  workspace: WorkspaceConfiguration,
  options: ChangeDetectionOptions = {}
): Promise<WorkspacePackage[]> {
  const {
    since = 'HEAD~1',
    includeUncommitted = true,
    includeDependents = true,
    maxDepth = Infinity,
  } = options;

  const { execa } = await import('../core/execution/execa.js');
  const affectedPackages = new Set<string>();

  try {
    // Get list of changed files
    const changedFiles = new Set<string>();

    // Get committed changes
    try {
      const gitDiffResult = await execa('git', ['diff', '--name-only', since], {
        cwd: workspace.root,
        silent: true,
      });
      const files = gitDiffResult.stdout.trim().split('\n').filter(Boolean);
      for (const file of files) {
        changedFiles.add(file);
      }
    } catch (error) {
      workspaceLogger.warn(`Failed to get git diff: ${error}`);
    }

    // Get uncommitted changes if requested
    if (includeUncommitted) {
      try {
        const statusResult = await execa('git', ['status', '--porcelain'], {
          cwd: workspace.root,
          silent: true,
        });
        statusResult.stdout
          .trim()
          .split('\n')
          .filter(Boolean)
          .forEach((line) => {
            const file = line.substring(3); // Remove status prefix
            changedFiles.add(file);
          });
      } catch (error) {
        workspaceLogger.warn(`Failed to get git status: ${error}`);
      }
    }

    // Find packages containing changed files
    for (const file of changedFiles) {
      for (const pkg of workspace.packages) {
        const relativePath = pkg.relativePath || path.relative(workspace.root, pkg.path);
        if (file.startsWith(`${relativePath}/`) || file === relativePath) {
          affectedPackages.add(pkg.name);
          break;
        }
      }
    }

    // Include dependents if requested
    if (includeDependents && affectedPackages.size > 0) {
      const dependentsToAdd = new Set<string>();
      let currentDepth = 0;
      let currentLevel = new Set(affectedPackages);

      while (currentLevel.size > 0 && currentDepth < maxDepth) {
        const nextLevel = new Set<string>();

        for (const pkgName of currentLevel) {
          const node = workspace.dependencyGraph.nodes.get(pkgName);
          if (node) {
            node.dependents.forEach((dependent) => {
              if (!affectedPackages.has(dependent) && !dependentsToAdd.has(dependent)) {
                dependentsToAdd.add(dependent);
                nextLevel.add(dependent);
              }
            });
          }
        }

        for (const dep of dependentsToAdd) {
          affectedPackages.add(dep);
        }
        currentLevel = nextLevel;
        currentDepth++;
      }
    }
  } catch (error) {
    throw new CLIError('Failed to detect affected packages', {
      code: 'AFFECTED_DETECTION_FAILED',
      cause: error instanceof Error ? error : undefined,
      context: { options },
    });
  }

  return workspace.packages.filter((pkg) => affectedPackages.has(pkg.name));
}

/**
 * Validate workspace configuration and packages
 */
export async function validateWorkspace(
  workspace: WorkspaceConfiguration
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for circular dependencies
  if (workspace.dependencyGraph.circularDependencies.length > 0) {
    workspace.dependencyGraph.circularDependencies.forEach((cycle) => {
      errors.push(`Circular dependency detected: ${cycle.join(' → ')}`);
    });
  }

  // Check for missing workspace dependencies
  workspace.packages.forEach((pkg) => {
    pkg.workspaceDependencies.forEach((depName) => {
      if (!workspace.packageMap.has(depName)) {
        errors.push(
          `Package "${pkg.name}" depends on workspace package "${depName}" which doesn't exist`
        );
      }
    });
  });

  // Check for duplicate package names
  const packageNames = new Map<string, string[]>();
  workspace.packages.forEach((pkg) => {
    if (!packageNames.has(pkg.name)) {
      packageNames.set(pkg.name, []);
    }
    packageNames.get(pkg.name)?.push(pkg.relativePath);
  });

  packageNames.forEach((paths, name) => {
    if (paths.length > 1) {
      errors.push(`Duplicate package name "${name}" found in: ${paths.join(', ')}`);
    }
  });

  // Check for inconsistent versions of workspace dependencies
  const dependencyVersions = new Map<string, Map<string, string[]>>();
  workspace.packages.forEach((pkg) => {
    // Check all dependencies that are also workspace packages
    ['dependencies', 'devDependencies', 'peerDependencies'].forEach((depType) => {
      const deps = pkg[depType as keyof WorkspacePackage] as Map<string, string> | undefined;
      if (!deps) return;

      deps.forEach((version, depName) => {
        // Only check if this is a workspace package
        if (workspace.packageMap.has(depName)) {
          if (!dependencyVersions.has(depName)) {
            dependencyVersions.set(depName, new Map());
          }

          const versionMap = dependencyVersions.get(depName);
          if (versionMap) {
            if (!versionMap.has(version)) {
              versionMap.set(version, []);
            }
            versionMap.get(version)?.push(pkg.name);
          }
        }
      });
    });
  });

  dependencyVersions.forEach((versionMap, depName) => {
    if (versionMap.size > 1) {
      const versions = Array.from(versionMap.entries()).map(
        ([version, packages]) => `${version} (used by: ${packages.join(', ')})`
      );
      warnings.push(
        `Inconsistent versions for workspace dependency "${depName}": ${versions.join('; ')}`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get workspace summary information
 */
export function getWorkspaceSummary(workspace: WorkspaceConfiguration): {
  totalPackages: number;
  packagesByType: Record<string, number>;
  dependencyStats: {
    totalDependencies: number;
    workspaceDependencies: number;
    externalDependencies: number;
    circularDependencies: number;
  };
  tools: string[];
} {
  const packagesByType: Record<string, number> = {
    private: 0,
    public: 0,
  };

  let totalDeps = 0;
  let workspaceDeps = 0;
  let externalDeps = 0;

  workspace.packages.forEach((pkg) => {
    if (pkg.isPrivate) {
      packagesByType.private++;
    } else {
      packagesByType.public++;
    }

    const allDeps = pkg.dependencies.size + pkg.devDependencies.size + pkg.peerDependencies.size;
    totalDeps += allDeps;
    workspaceDeps += pkg.workspaceDependencies.length;
    externalDeps += allDeps - pkg.workspaceDependencies.length;
  });

  const tools: string[] = [];
  if (workspace.tools.hasNx) tools.push('Nx');
  if (workspace.tools.hasLerna) tools.push('Lerna');
  if (workspace.tools.hasRush) tools.push('Rush');
  if (workspace.tools.hasTurbo) tools.push('Turbo');
  if (workspace.tools.hasWorkspaces) tools.push('Workspaces');

  return {
    totalPackages: workspace.packages.length,
    packagesByType,
    dependencyStats: {
      totalDependencies: totalDeps,
      workspaceDependencies: workspaceDeps,
      externalDependencies: externalDeps,
      circularDependencies: workspace.dependencyGraph.circularDependencies.length,
    },
    tools,
  };
}
