#!/usr/bin/env tsx

/**
 * Fix Broken Links in API Documentation
 * 
 * Automatically fixes common link issues in the generated API documentation:
 * 1. Converts backslashes to forward slashes in file paths
 * 2. Fixes incorrect relative path levels (../../ should be ../../../)
 * 3. Updates directory names to match actual structure
 */

import fs from 'fs/promises';
import path from 'path';

async function fixLinksInFile(filePath: string): Promise<void> {
  try {
    console.log(`📝 Fixing links in: ${path.relative(process.cwd(), filePath)}`);
    
    let content = await fs.readFile(filePath, 'utf8');
    let changeCount = 0;
    
    // Fix 1: Convert backslashes to forward slashes in source paths
    const backslashPattern = /\[`src\\([^`]+)`\]/g;
    const backslashMatches = content.match(backslashPattern);
    if (backslashMatches) {
      content = content.replace(backslashPattern, (match, pathPart) => {
        changeCount++;
        return `[\`src/${pathPart.replace(/\\/g, '/')}\`]`;
      });
      console.log(`  ✅ Fixed ${backslashMatches.length} backslash paths`);
    }
    
    // Fix 2: Fix relative path levels - should be ../../../src/ from docs/api/module/
    const relativePathPattern = /\]\(\.\.\/\.\.\/src\//g;
    const relativeMatches = content.match(relativePathPattern);
    if (relativeMatches) {
      content = content.replace(relativePathPattern, '](../../../src/');
      changeCount += relativeMatches.length;
      console.log(`  ✅ Fixed ${relativeMatches.length} relative path levels`);
    }
    
    // Fix 3: Convert any remaining backslashes in URLs to forward slashes
    const urlBackslashPattern = /\]\([^)]*\\[^)]*\)/g;
    const urlMatches = content.match(urlBackslashPattern);
    if (urlMatches) {
      content = content.replace(urlBackslashPattern, (match) => {
        changeCount++;
        return match.replace(/\\/g, '/');
      });
      console.log(`  ✅ Fixed ${urlMatches.length} URL backslashes`);
    }
    
    if (changeCount > 0) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`  💾 Saved ${changeCount} total fixes\n`);
    } else {
      console.log(`  ✨ No fixes needed\n`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
  }
}

async function findApiReadmeFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findApiReadmeFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name === 'README.md') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

async function main(): Promise<void> {
  console.log('🔧 API Documentation Link Fixer\n');
  
  const apiDocsDir = path.join(process.cwd(), 'docs', 'api');
  
  try {
    // Check if the API docs directory exists
    await fs.access(apiDocsDir);
    
    // Find all README.md files in the API docs
    console.log(`📂 Searching for README files in: ${path.relative(process.cwd(), apiDocsDir)}\n`);
    const readmeFiles = await findApiReadmeFiles(apiDocsDir);
    
    if (readmeFiles.length === 0) {
      console.log('⚠️  No README.md files found in API documentation');
      return;
    }
    
    console.log(`📋 Found ${readmeFiles.length} README files to process:\n`);
    
    // Fix each README file
    for (const file of readmeFiles) {
      await fixLinksInFile(file);
    }
    
    console.log('✅ API documentation link fixing completed!');
    console.log(`📊 Processed ${readmeFiles.length} files total`);
    
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.error('❌ API documentation directory not found: docs/api/');
      console.error('💡 Make sure to generate API documentation first');
    } else {
      console.error('❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

// Export for potential module usage
export { fixLinksInFile, findApiReadmeFiles };

// Run if called directly
main().catch(error => {
  console.error('❌ Link fixer execution failed:', error);
  process.exit(1);
});