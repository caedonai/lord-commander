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
  isGitRepository,
  isGitAvailable,
  getRepositoryRoot,
  init as gitInit,
  clone,
  getStatus,
  add,
  commit,
  getCommits,
  getDiff,
  getBranches,
  createBranch,
  checkout,
  getCurrentCommit,
  isClean,
  type GitStatus,
  type GitCommit,
  type CloneOptions,
  type CommitOptions
} from './git.js';

// Updater Plugin  
export {
  parseVersion,
  compareVersions,
  satisfiesRange,
  getChangeType,
  getAllTags,
  getLatestTag,
  tagExists,
  createTag,
  getVersionDiff,
  createUpdatePlan,
  applyUpdate,
  type SemanticVersion,
  type VersionDiff,
  type UpdatePlan,
  type UpdateStrategy,
  type UpdateConflict,
  type UpdateOptions,
  type FileDiff
} from './updater.js';

// Workspace Plugin
export {
  isWorkspace,
  detectWorkspaceType,
  detectPackageManager,
  discoverPackages,
  loadWorkspace,
  filterPackages,
  runScript,
  installDependencies,
  getAffectedPackages,
  validateWorkspace,
  getWorkspaceSummary,
  type WorkspaceConfiguration,
  type WorkspacePackage,
  type WorkspaceType,
  type PackageManager as WorkspacePackageManager,
  type PackageFilter,
  type BatchOperationOptions,
  type ChangeDetectionOptions
} from './workspace.js';