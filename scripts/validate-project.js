#!/usr/bin/env node

/**
 * Project Validation Script
 * Validates that project is in working state
 * Run with: npm run validate:pre or npm run validate:post
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
let errors = [];
let warnings = [];

function checkFileExists(filePath, critical = false) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    const message = `Missing file: ${filePath}`;
    if (critical) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
    return false;
  }
  return true;
}

function checkCriticalFiles() {
  console.log('🔍 Checking critical files...');
  
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'src/app/layout.tsx',
    'src/middleware.ts',
    'src/lib/supabase/client.ts'
  ];

  criticalFiles.forEach(file => {
    checkFileExists(file, true);
  });
}

function checkBuild() {
  console.log('🔨 Checking build...');
  try {
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      timeout: 120000
    });
    console.log('✅ Build successful');
  } catch (error) {
    errors.push('Build failed!');
    console.error('❌ Build error:', error.message);
  }
}

function checkTypeScript() {
  console.log('📝 Checking TypeScript...');
  try {
    execSync('npx tsc --noEmit', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      timeout: 60000
    });
    console.log('✅ TypeScript check passed');
  } catch (error) {
    warnings.push('TypeScript errors found (non-blocking)');
    console.warn('⚠️  TypeScript warnings');
  }
}

function checkEnvFiles() {
  console.log('🔐 Checking environment files...');
  
  // Check if templates exist
  const templates = ['frontend-env-template.txt', 'backend-env-template.txt'];
  templates.forEach(template => {
    if (!checkFileExists(template, false)) {
      warnings.push(`Template missing: ${template}`);
    }
  });
}

function checkImports() {
  console.log('📦 Checking critical imports...');
  // This is a basic check - could be enhanced
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')
    );
    
    const criticalDeps = [
      'next',
      'react',
      '@supabase/supabase-js',
      '@supabase/ssr'
    ];

    criticalDeps.forEach(dep => {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        errors.push(`Missing critical dependency: ${dep}`);
      }
    });
  } catch (error) {
    errors.push('Could not read package.json');
  }
}

function printResults() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(50));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Project is in good state.');
    process.exit(0);
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):`);
    errors.forEach(e => console.log(`   - ${e}`));
    console.log('\n🚨 PROJECT IS NOT IN WORKING STATE!');
    console.log('⚠️  DO NOT DEPLOY OR MAKE CHANGES UNTIL ERRORS ARE FIXED!');
    process.exit(1);
  }

  console.log('\n✅ Project validation passed with warnings.');
  process.exit(0);
}

function main() {
  const mode = process.argv[2] || 'pre';
  
  console.log(`🔍 Running ${mode}-change validation...\n`);

  checkCriticalFiles();
  checkEnvFiles();
  checkImports();

  if (mode === 'post' || mode === 'full') {
    checkTypeScript();
  }

  if (mode === 'full') {
    checkBuild();
  }

  printResults();
}

main();

