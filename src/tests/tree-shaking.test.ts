import { describe, it, expect } from 'vitest';

// Define expected exports in a maintainable data structure
const EXPECTED_EXPORTS = {
  core: {
    // Foundation - Constants (from actual exports)
    constants: ['BRANDING', 'CLI_CONFIG_PATHS', 'DEFAULT_IGNORE_PATTERNS', 'DEFAULT_PORTS', 'ERROR_MESSAGES', 'FILE_EXTENSIONS', 'FRAMEWORK_PATTERNS', 'GIT_PATTERNS', 'PACKAGE_MANAGER_COMMANDS', 'TELEMETRY_CONFIG', 'TEMP_DIR_PREFIX'],
    
    // Foundation - Errors (from actual exports)
    errors: ['CLIError', 'ConfigurationError', 'ERROR_RECOVERY_SUGGESTIONS', 'FileSystemError', 'NetworkError', 'ProcessError', 'UserCancelledError', 'ValidationError', 'formatError', 'getRecoverySuggestion', 'gracefulExit', 'handleCancel', 'isCancel', 'setupGlobalErrorHandlers', 'withErrorHandling'],
    
    // CLI creation (from actual exports)
    cli: ['Command', 'createCLI', 'registerBuiltinCommands', 'registerCommands'],
    
    // Autocomplete system (from actual exports)
    autocomplete: ['analyzeProgram', 'checkCompletionStatus', 'detectShell', 'generateBashCompletion', 'generateCompletion', 'generateCompletionScript', 'generateFishCompletion', 'generatePowerShellCompletion', 'generateZshCompletion', 'installCompletion', 'uninstallCompletion'],
    
    // Execution utilities (from actual exports)
    execution: ['exec', 'execStream', 'execSync'],
    
    // File system utilities (from actual exports)
    fileSystem: ['cleanDir', 'copy', 'copyDir', 'copyFile', 'ensureDir', 'exists', 'findFiles', 'getSize', 'move', 'readDir', 'readFile', 'readJSON', 'remove', 'stat', 'writeFile', 'writeJSON'],
    
    // UI utilities (from actual exports)
    ui: ['cancel', 'confirm', 'createLogger', 'intro', 'log', 'multiselect', 'note', 'outro', 'password', 'select', 'spinner', 'text'],
    
    // Should NOT be present (plugin functionality)
    excluded: ['isGitRepository', 'parseVersion', 'isWorkspace', 'detectWorkspaceType', 'gitInit', 'clone', 'commit', 'getCommits', 'createTag', 'compareVersions', 'getVersionDiff', 'createUpdatePlan', 'applyUpdate', 'discoverPackages', 'loadWorkspace', 'discoverWorkspace']
  },
  
  plugins: {
    // Git plugin (from actual exports)
    git: ['add', 'checkout', 'clone', 'commit', 'createBranch', 'getBranches', 'getCommits', 'getCurrentCommit', 'getDiff', 'getRepositoryRoot', 'getStatus', 'gitInit', 'isClean', 'isGitAvailable', 'isGitRepository'],
    
    // Updater plugin (from actual exports)
    updater: ['applyUpdate', 'compareVersions', 'createTag', 'createUpdatePlan', 'getAllTags', 'getChangeType', 'getLatestTag', 'getVersionDiff', 'parseVersion', 'satisfiesRange', 'tagExists'],
    
    // Workspace plugin (from actual exports)
    workspace: ['detectPackageManager', 'detectWorkspaceType', 'discoverPackages', 'filterPackages', 'getAffectedPackages', 'getWorkspaceSummary', 'installDependencies', 'isWorkspace', 'loadWorkspace', 'runScript', 'validateWorkspace'],
    
    // Should NOT be present (core functionality)
    excluded: ['exec', 'readFile', 'createLogger', 'intro', 'outro', 'registerCommands', 'Command', 'generateCompletion', 'CLIError', 'PACKAGE_MANAGER_COMMANDS']
  }
};

describe('Tree-shaking Tests', () => {
  describe('Core Module Exports', () => {
    it('should export all expected core functions', async () => {
      const coreModule = await import('../core/index') as any;
      
      // Test all expected exports are present
      Object.entries(EXPECTED_EXPORTS.core).forEach(([category, functions]) => {
        if (category === 'excluded') return; // Skip excluded check here
        
        functions.forEach(funcName => {
          expect(coreModule[funcName], `${funcName} should be exported from core (${category})`).toBeDefined();
          
          // Special handling for different types
          if (funcName === 'Command') {
            expect(typeof coreModule[funcName], `${funcName} should be a class constructor`).toBe('function');
          } else if (category === 'constants') {
            // Constants can be strings, arrays, objects - just check they're defined
            expect(coreModule[funcName], `${funcName} should be a defined constant`).toBeDefined();
          } else if (funcName.startsWith('ERROR_') || funcName.endsWith('_PATTERNS') || funcName.endsWith('_COMMANDS') || funcName.endsWith('_CONFIG') || funcName === 'BRANDING') {
            // Legacy constants handling for backwards compatibility
            expect(coreModule[funcName], `${funcName} should be a defined constant`).toBeDefined();
          } else {
            expect(typeof coreModule[funcName], `${funcName} should be a function`).toBe('function');
          }
        });
      });
      
      // Calculate count of non-excluded exports
      const nonExcludedCount = Object.entries(EXPECTED_EXPORTS.core)
        .filter(([category]) => category !== 'excluded')
        .reduce((total, [, functions]) => total + functions.length, 0);
      console.log(`✅ Verified ${nonExcludedCount} core exports`);
    });
    
    it('should not export plugin functionality from core', async () => {
      const coreModule = await import('../core/index');
      
      // Test excluded functions are NOT present
      EXPECTED_EXPORTS.core.excluded.forEach(funcName => {
        expect(funcName in coreModule, `${funcName} should NOT be in core module`).toBe(false);
      });
      
      console.log(`✅ Verified ${EXPECTED_EXPORTS.core.excluded.length} plugin functions correctly excluded from core`);
    });
  });
  
  describe('Plugins Module Exports', () => {
    it('should export all expected plugin functions', async () => {
      const pluginsModule = await import('../plugins/index') as any;
      
      // Test all expected exports are present
      Object.entries(EXPECTED_EXPORTS.plugins).forEach(([category, functions]) => {
        if (category === 'excluded') return; // Skip excluded check here
        
        functions.forEach(funcName => {
          expect(pluginsModule[funcName], `${funcName} should be exported from plugins (${category})`).toBeDefined();
          expect(typeof pluginsModule[funcName], `${funcName} should be a function`).toBe('function');
        });
      });
      
      // Calculate count of non-excluded exports
      const nonExcludedCount = Object.entries(EXPECTED_EXPORTS.plugins)
        .filter(([category]) => category !== 'excluded')
        .reduce((total, [, functions]) => total + functions.length, 0);
      console.log(`✅ Verified ${nonExcludedCount} plugin exports`);
    });
    
    it('should not export core functionality from plugins', async () => {
      const pluginsModule = await import('../plugins/index') as any;
      
      // Test excluded functions are NOT present
      EXPECTED_EXPORTS.plugins.excluded.forEach(funcName => {
        expect(funcName in pluginsModule, `${funcName} should NOT be in plugins module`).toBe(false);
      });
      
      console.log(`✅ Verified ${EXPECTED_EXPORTS.plugins.excluded.length} core functions correctly excluded from plugins`);
    });
  });
  
  describe('Selective Imports', () => {
    it('should allow selective core imports', async () => {
      // Test dynamic selective imports with various function types
      const testFunctions = [
        { name: 'exec', expectedType: 'function' },
        { name: 'readFile', expectedType: 'function' },
        { name: 'createLogger', expectedType: 'function' },
        { name: 'Command', expectedType: 'function' },
        { name: 'DEFAULT_IGNORE_PATTERNS', expectedType: 'object' }
      ];
      
      for (const { name, expectedType } of testFunctions) {
        const module = await import('../core/index') as any;
        const importedItem = module[name];
        expect(importedItem, `${name} should be selectively importable`).toBeDefined();
        expect(typeof importedItem, `${name} should be a ${expectedType}`).toBe(expectedType);
      }
      
      console.log(`✅ Verified selective imports work for ${testFunctions.length} core functions`);
    });
    
    it('should allow selective plugin imports', async () => {
      // Test dynamic selective imports for plugins
      const testFunctions = ['parseVersion', 'isGitRepository', 'isWorkspace'];
      
      for (const funcName of testFunctions) {
        const module = await import('../plugins/index') as any;
        const importedFunc = module[funcName];
        expect(importedFunc, `${funcName} should be selectively importable`).toBeDefined();
        expect(typeof importedFunc, `${funcName} should be a function`).toBe('function');
      }
      
      console.log(`✅ Verified selective imports work for ${testFunctions.length} plugin functions`);
    });
    
    it('should allow Command usage without external dependencies', async () => {
      const { Command } = await import('../core/index');
      
      expect(Command).toBeDefined();
      expect(typeof Command).toBe('function');
      
      // Test Command functionality works correctly
      const program = new Command();
      program.name('test-cli').description('Test CLI built with SDK Command');
      
      expect(program.name()).toBe('test-cli');
      expect(program.description()).toBe('Test CLI built with SDK Command');
      expect(typeof program.command).toBe('function');
      expect(typeof program.parse).toBe('function');
      
      console.log('✅ Verified Command constructor and basic functionality');
    });
  });
  
  describe('Module Boundaries', () => {
    it('should maintain clear separation between core and plugins', async () => {
      const [coreModule, pluginsModule] = await Promise.all([
        import('../core/index'),
        import('../plugins/index')
      ]);
      
      // Get all exports from both modules
      const coreExports = Object.keys(coreModule);
      const pluginExports = Object.keys(pluginsModule);
      
      // Check for any overlap (there should be none)
      const overlap = coreExports.filter(name => pluginExports.includes(name));
      expect(overlap, 'Core and plugins should not export the same functions').toEqual([]);
      
      // Verify minimum export counts to ensure modules aren't empty
      expect(coreExports.length, 'Core should export multiple functions').toBeGreaterThan(30);
      expect(pluginExports.length, 'Plugins should export multiple functions').toBeGreaterThan(10);
      
      console.log(`✅ Verified module boundaries: Core(${coreExports.length}) vs Plugins(${pluginExports.length}), no overlap`);
    });
    
    it('should have consistent export patterns', async () => {
      const [coreModule, pluginsModule] = await Promise.all([
        import('../core/index'),
        import('../plugins/index')
      ]);
      
      // Verify that both modules export actual values (not undefined)
      const coreExports = Object.entries(coreModule);
      const pluginExports = Object.entries(pluginsModule);
      
      const undefinedCoreExports = coreExports.filter(([_, value]) => value === undefined);
      const undefinedPluginExports = pluginExports.filter(([_, value]) => value === undefined);
      
      expect(undefinedCoreExports, 'Core should not export undefined values').toEqual([]);
      expect(undefinedPluginExports, 'Plugins should not export undefined values').toEqual([]);
      
      console.log('✅ Verified all exports have defined values');
    });
  });
  
  describe('Type Exports', () => {
    it('should export TypeScript types for tree-shaking', async () => {
      // Import types - this validates they exist for TypeScript
      const typesModule = await import('../types/index');
      
      expect(typesModule).toBeDefined();
      // Types don't have runtime presence, but importing validates they exist
      
      console.log('✅ Verified TypeScript types can be imported');
    });
  });
});