import { describe, it, expect } from 'vitest';

describe('Tree-shaking Tests', () => {
  describe('Core Module Exports', () => {
    it('should export expected core functions', async () => {
      const coreModule = await import('../core/index');
      
      // Test key core exports are available
      expect(coreModule.exec).toBeDefined();
      expect(coreModule.createLogger).toBeDefined();
      expect(coreModule.readFile).toBeDefined();
      expect(coreModule.writeFile).toBeDefined();
      expect(coreModule.intro).toBeDefined();
      expect(coreModule.outro).toBeDefined();
      
      // Test CLI creation functions are available
      expect(coreModule.createCLI).toBeDefined();
      expect(coreModule.registerCommands).toBeDefined();
      expect(coreModule.Command).toBeDefined();
      
      // Test autocomplete functions are available
      expect(coreModule.generateCompletion).toBeDefined();
      expect(coreModule.installCompletion).toBeDefined();
      expect(coreModule.uninstallCompletion).toBeDefined();
      expect(coreModule.checkCompletionStatus).toBeDefined();
      expect(coreModule.detectShell).toBeDefined();
      
      // Test constants are available
      expect(coreModule.PACKAGE_MANAGER_COMMANDS).toBeDefined();
      expect(coreModule.DEFAULT_IGNORE_PATTERNS).toBeDefined();
      
      // Test error classes are available
      expect(coreModule.CLIError).toBeDefined();
      expect(coreModule.ProcessError).toBeDefined();
    });
    
    it('should not export plugin functionality from core', async () => {
      const coreModule = await import('../core/index');
      
      // Ensure plugin functions are not in core (runtime checks)
      expect('isGitRepository' in coreModule).toBe(false);
      expect('parseVersion' in coreModule).toBe(false);
      expect('isWorkspace' in coreModule).toBe(false);
    });
  });
  
  describe('Plugins Module Exports', () => {
    it('should export expected plugin functions', async () => {
      const pluginsModule = await import('../plugins/index');
      
      // Test git plugin exports
      expect(pluginsModule.isGitRepository).toBeDefined();
      expect(pluginsModule.gitInit).toBeDefined();
      expect(pluginsModule.clone).toBeDefined();
      expect(pluginsModule.commit).toBeDefined();
      
      // Test updater plugin exports
      expect(pluginsModule.parseVersion).toBeDefined();
      expect(pluginsModule.compareVersions).toBeDefined();
      expect(pluginsModule.getVersionDiff).toBeDefined();
      expect(pluginsModule.applyUpdate).toBeDefined();
      
      // Test workspace plugin exports
      expect(pluginsModule.isWorkspace).toBeDefined();
      expect(pluginsModule.detectWorkspaceType).toBeDefined();
      expect(pluginsModule.discoverPackages).toBeDefined();
      expect(pluginsModule.loadWorkspace).toBeDefined();
    });
    
    it('should not export core functionality from plugins', async () => {
      const pluginsModule = await import('../plugins/index');
      
      // Ensure core functions are not in plugins (runtime checks)
      expect('exec' in pluginsModule).toBe(false);
      expect('readFile' in pluginsModule).toBe(false);
      expect('createLogger' in pluginsModule).toBe(false);
    });
  });
  
  describe('Selective Imports', () => {
    it('should allow selective core imports', async () => {
      // Test that we can import individual functions
      const { exec, readFile } = await import('../core/index');
      
      expect(exec).toBeDefined();
      expect(typeof exec).toBe('function');
      expect(readFile).toBeDefined();
      expect(typeof readFile).toBe('function');
    });
    
    it('should allow selective plugin imports', async () => {
      // Test that we can import individual plugin functions
      const { parseVersion, isGitRepository } = await import('../plugins/index');
      
      expect(parseVersion).toBeDefined();
      expect(typeof parseVersion).toBe('function');
      expect(isGitRepository).toBeDefined();
      expect(typeof isGitRepository).toBe('function');
    });
    
    it('should allow Command usage without external dependencies', async () => {
      // Test that Command can be used for custom CLI creation
      const { Command } = await import('../core/index');
      
      expect(Command).toBeDefined();
      expect(typeof Command).toBe('function');
      
      // Test that Command is actually usable (constructor test)
      const program = new Command();
      program.name('test-cli');
      program.description('Test CLI built with SDK Command');
      
      expect(program.name()).toBe('test-cli');
      expect(program.description()).toBe('Test CLI built with SDK Command');
      expect(typeof program.command).toBe('function');
      expect(typeof program.parse).toBe('function');
    });
  });
  
  describe('Type Exports', () => {
    it('should export TypeScript types for tree-shaking', async () => {
      // Import types - this validates they exist for TypeScript
      const typesModule = await import('../types/index');
      
      expect(typesModule).toBeDefined();
      // Types don't have runtime presence, but importing validates they exist
    });
  });
});