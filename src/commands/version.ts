import type { Command } from 'commander';
import { isGitRepository } from '../plugins/git.js';
import {
  compareVersions,
  createUpdatePlan,
  getAllTags,
  getChangeType,
  getVersionDiff,
  parseVersion,
} from '../plugins/updater.js';
import type { CommandContext } from '../types/cli.js';

/**
 * Version management command using the updater plugin
 */
export default function (program: Command, context: CommandContext) {
  const { logger, prompts } = context;
  const log = logger as any;
  const prompt = prompts as any;

  program
    .command('version')
    .description('Version management and update utilities')
    .option('-c, --compare <versions>', 'compare two versions (format: v1,v2)')
    .option('-l, --list-tags', 'list all git tags sorted by version')
    .option('-d, --diff <versions>', 'show diff between two versions (format: from,to)')
    .option('--plan <versions>', 'create update plan between versions (format: from,to)')
    .option('--validate <version>', 'validate semantic version format')
    .action(async (options) => {
      try {
        log.intro('Version Management');

        // Validate semantic version
        if (options.validate) {
          try {
            const version = parseVersion(options.validate);
            log.success(`✓ Valid semantic version: ${version.raw}`);
            log.info(
              `  Major: ${version.major}, Minor: ${version.minor}, Patch: ${version.patch}`
            );
            if (version.prerelease) log.info(`  Prerelease: ${version.prerelease}`);
            if (version.build) log.info(`  Build: ${version.build}`);
          } catch (error) {
            log.error(
              `✗ Invalid semantic version: ${error instanceof Error ? error.message : String(error)}`
            );
          }
          return;
        }

        // Compare two versions
        if (options.compare) {
          const [v1, v2] = options.compare.split(',');
          if (!v1 || !v2) {
            log.error('Please provide two versions: --compare v1.0.0,v2.0.0');
            return;
          }

          try {
            const version1 = parseVersion(v1.trim());
            const version2 = parseVersion(v2.trim());
            const comparison = compareVersions(version1, version2);

            let result: string;
            if (comparison < 0) {
              result = `${v1} < ${v2}`;
            } else if (comparison > 0) {
              result = `${v1} > ${v2}`;
            } else {
              result = `${v1} === ${v2}`;
            }

            log.success(`Comparison: ${result}`);

            if (comparison !== 0) {
              const changeType =
                compareVersions(version1, version2) < 0
                  ? getChangeType(version1, version2)
                  : getChangeType(version2, version1);
              log.info(`Change type: ${changeType}`);
            }
          } catch (error) {
            log.error(
              `Comparison failed: ${error instanceof Error ? error.message : String(error)}`
            );
          }
          return;
        }

        // Check if we're in a git repository for git-based commands
        const isGitRepo = await isGitRepository();
        if (!isGitRepo && (options.listTags || options.diff || options.plan)) {
          log.error('Git-based commands require a git repository');
          return;
        }

        // List all tags
        if (options.listTags) {
          try {
            const tags = await getAllTags();
            if (tags.length === 0) {
              log.info('No tags found in repository');
            } else {
              log.success(`Found ${tags.length} tags:`);
              tags.forEach((tag, index) => {
                try {
                  const version = parseVersion(tag);
                  log.info(
                    `  ${index + 1}. ${tag} (v${version.major}.${version.minor}.${version.patch})`
                  );
                } catch {
                  log.info(`  ${index + 1}. ${tag} (non-semver)`);
                }
              });
            }
          } catch (error) {
            log.error(
              `Failed to list tags: ${error instanceof Error ? error.message : String(error)}`
            );
          }
          return;
        }

        // Show diff between versions
        if (options.diff) {
          const [from, to] = options.diff.split(',');
          if (!from || !to) {
            log.error('Please provide two versions: --diff v1.0.0,v2.0.0');
            return;
          }

          try {
            log.step(`Getting diff from ${from} to ${to}...`);
            const diff = await getVersionDiff(from.trim(), to.trim());

            log.success(`Version Diff: ${diff.from.raw} → ${diff.to.raw}`);
            log.info(`Change Type: ${diff.changeType}`);
            log.info(`Breaking Changes: ${diff.breaking ? 'Yes' : 'No'}`);
            log.info(`Files Changed: ${diff.files.length}`);
            log.info(`Commits: ${diff.commits.length}`);

            if (diff.files.length > 0) {
              log.info('\nFile Changes:');
              diff.files.slice(0, 10).forEach((file) => {
                const status = file.status.charAt(0).toUpperCase() + file.status.slice(1);
                log.info(`  ${status}: ${file.path} (+${file.insertions}/-${file.deletions})`);
              });
              if (diff.files.length > 10) {
                log.info(`  ... and ${diff.files.length - 10} more files`);
              }
            }

            if (diff.commits.length > 0) {
              log.info('\nRecent Commits:');
              diff.commits.slice(0, 5).forEach((commit) => {
                log.info(`  ${commit.shortHash}: ${commit.message}`);
              });
              if (diff.commits.length > 5) {
                log.info(`  ... and ${diff.commits.length - 5} more commits`);
              }
            }
          } catch (error) {
            log.error(`Diff failed: ${error instanceof Error ? error.message : String(error)}`);
          }
          return;
        }

        // Create update plan
        if (options.plan) {
          const [from, to] = options.plan.split(',');
          if (!from || !to) {
            log.error('Please provide two versions: --plan v1.0.0,v2.0.0');
            return;
          }

          try {
            log.step(`Creating update plan from ${from} to ${to}...`);
            const plan = await createUpdatePlan(from.trim(), to.trim(), process.cwd());

            log.success(`Update Plan: ${plan.fromVersion} → ${plan.toVersion}`);
            log.info(`Strategy: ${plan.strategy.type}`);
            log.info(`Backup Required: ${plan.backupRequired ? 'Yes' : 'No'}`);
            log.info(`Files to Update: ${plan.diff.files.length}`);
            log.info(`Conflicts: ${plan.conflicts.length}`);

            if (plan.conflicts.length > 0) {
              log.warn('\nPotential Conflicts:');
              plan.conflicts.forEach((conflict) => {
                log.warn(`  ${conflict.file}: ${conflict.description}`);
              });
            }

            if (plan.diff.files.length > 0) {
              log.info('\nPlanned Changes:');
              plan.diff.files.slice(0, 10).forEach((file) => {
                log.info(`  ${file.status}: ${file.path}`);
              });
              if (plan.diff.files.length > 10) {
                log.info(`  ... and ${plan.diff.files.length - 10} more files`);
              }
            }
          } catch (error) {
            log.error(
              `Update plan failed: ${error instanceof Error ? error.message : String(error)}`
            );
          }
          return;
        }

        // Interactive mode if no specific option provided
        log.info('Interactive version management');

        const action = await prompt.select({
          message: 'What would you like to do?',
          options: [
            { value: 'validate', label: 'Validate semantic version' },
            { value: 'compare', label: 'Compare two versions' },
            ...(isGitRepo
              ? [
                  { value: 'list', label: 'List repository tags' },
                  { value: 'diff', label: 'Show version diff' },
                  { value: 'plan', label: 'Create update plan' },
                ]
              : []),
          ],
        });

        switch (action) {
          case 'validate': {
            const version = await prompt.text({
              message: 'Enter version to validate:',
              placeholder: '1.2.3',
            });

            try {
              const parsed = parseVersion(version);
              log.success(`✓ Valid semantic version: ${parsed.raw}`);
            } catch (error) {
              log.error(`✗ Invalid: ${error instanceof Error ? error.message : String(error)}`);
            }
            break;
          }

          case 'compare': {
            const v1 = await prompt.text({
              message: 'Enter first version:',
              placeholder: '1.0.0',
            });

            const v2 = await prompt.text({
              message: 'Enter second version:',
              placeholder: '2.0.0',
            });

            try {
              const version1 = parseVersion(v1);
              const version2 = parseVersion(v2);
              const comparison = compareVersions(version1, version2);

              if (comparison < 0) {
                log.success(`${v1} < ${v2}`);
              } else if (comparison > 0) {
                log.success(`${v1} > ${v2}`);
              } else {
                log.success(`${v1} === ${v2}`);
              }
            } catch (error) {
              log.error(
                `Comparison failed: ${error instanceof Error ? error.message : String(error)}`
              );
            }
            break;
          }

          case 'list': {
            const tags = await getAllTags();
            if (tags.length === 0) {
              log.info('No tags found');
            } else {
              log.success(`Found ${tags.length} tags`);
              for (const tag of tags) {
                log.info(`  ${tag}`);
              }
            }
            break;
          }

          case 'diff':
          case 'plan': {
            const tags = await getAllTags();
            if (tags.length < 2) {
              log.error('Need at least 2 tags for diff/plan operations');
              break;
            }

            const from = await prompt.select({
              message: 'Select source version:',
              options: tags.map((tag) => ({ value: tag, label: tag })),
            });

            const to = await prompt.select({
              message: 'Select target version:',
              options: tags
                .filter((tag) => tag !== from)
                .map((tag) => ({ value: tag, label: tag })),
            });

            if (action === 'diff') {
              const diff = await getVersionDiff(from, to);
              log.success(`Diff: ${diff.from.raw} → ${diff.to.raw}`);
              log.info(`Files changed: ${diff.files.length}, Commits: ${diff.commits.length}`);
            } else {
              const plan = await createUpdatePlan(from, to, process.cwd());
              log.success(`Plan: ${plan.fromVersion} → ${plan.toVersion}`);
              log.info(`Strategy: ${plan.strategy.type}, Conflicts: ${plan.conflicts.length}`);
            }
            break;
          }
        }

        log.outro('Version management completed');
      } catch (error) {
        log.error(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}
