/**
 * Plugin SDK modules - Extended functionality for specific use cases
 *
 * These modules provide advanced features that extend the core functionality:
 * - Git operations and version diffing
 * - Workspace management and monorepo utilities
 * - Version management and update planning
 *
 * Tree-shakeable imports - import only the plugins you need:
 * import { git } from '@caedonai/lord-commander/plugins/git';
 * import { workspace } from '@caedonai/lord-commander/plugins/workspace';
 * import { updater } from '@caedonai/lord-commander/plugins/updater';
 */

// NOTE: This barrel file is deprecated for tree-shaking optimization.
// Import plugins directly from their individual modules:
//   import * as git from './git.js';
//   import * as workspace from './workspace.js';
//   import * as updater from './updater.js';

// Git Plugin
export {
  add,
  type CloneOptions,
  type CommitOptions,
  checkout,
  clone,
  commit,
  createBranch,
  type GitCommit,
  type GitStatus,
  getBranches,
  getCommits,
  getCurrentCommit,
  getDiff,
  getRepositoryRoot,
  getStatus,
  init as gitInit,
  isClean,
  isGitAvailable,
  isGitRepository,
} from './git.js';

// Updater Plugin
export {
  applyUpdate,
  compareVersions,
  createTag,
  createUpdatePlan,
  type FileDiff,
  getAllTags,
  getChangeType,
  getLatestTag,
  getVersionDiff,
  parseVersion,
  type SemanticVersion,
  satisfiesRange,
  tagExists,
  type UpdateConflict,
  type UpdateOptions,
  type UpdatePlan,
  type UpdateStrategy,
  type VersionDiff,
} from './updater.js';

// Workspace Plugin
export {
  type BatchOperationOptions,
  type ChangeDetectionOptions,
  detectPackageManager,
  detectWorkspaceType,
  discoverPackages,
  filterPackages,
  getAffectedPackages,
  getWorkspaceSummary,
  installDependencies,
  isWorkspace,
  loadWorkspace,
  type PackageFilter,
  type PackageManager as WorkspacePackageManager,
  runScript,
  validateWorkspace,
  type WorkspaceConfiguration,
  type WorkspacePackage,
  type WorkspaceType,
} from './workspace.js';
