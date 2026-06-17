#!/usr/bin/env node
/**
 * Auto-detect and fix missing dependencies in service package.json files.
 * 
 * Scans .js and .ts files for require() and import statements,
 * checks if those modules exist in package.json dependencies,
 * and adds missing ones.
 * 
 * Usage: node scripts/fix-dependencies.js
 */

const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.join(__dirname, '..', 'services');
const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

// Node.js built-in modules to skip
const BUILTIN_MODULES = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'http2',
  'https', 'module', 'net', 'os', 'path', 'process', 'punycode', 'querystring',
  'readline', 'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls',
  'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
  'node:assert', 'node:buffer', 'node:child_process', 'node:cluster',
  'node:console', 'node:constants', 'node:crypto', 'node:dgram', 'node:dns',
  'node:domain', 'node:events', 'node:fs', 'node:http', 'node:http2',
  'node:https', 'node:module', 'node:net', 'node:os', 'node:path',
  'node:process', 'node:punycode', 'node:querystring', 'node:readline',
  'node:repl', 'node:stream', 'node:string_decoder', 'node:sys',
  'node:timers', 'node:tls', 'node:tty', 'node:url', 'node:util',
  'node:v8', 'node:vm', 'node:wasi', 'node:worker_threads', 'node:zlib',
]);

function findAllServices() {
  const services = [];
  for (const dir of fs.readdirSync(SERVICES_DIR)) {
    const pkgPath = path.join(SERVICES_DIR, dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      services.push({ name: dir, dir: path.join(SERVICES_DIR, dir), pkgPath });
    }
  }
  return services;
}

function findSourceFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      files.push(...findSourceFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const modules = new Set();

  // Match require('module') and require("module")
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = requireRegex.exec(content)) !== null) {
    modules.add(match[1]);
  }

  // Match import ... from 'module' and import 'module'
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    modules.add(match[1]);
  }

  return modules;
}

function getModuleName(importPath) {
  // Handle scoped packages: @org/package
  if (importPath.startsWith('@')) {
    const parts = importPath.split('/');
    if (parts.length >= 2) {
      return parts[0] + '/' + parts[1];
    }
    return importPath;
  }
  // Handle regular packages: package/subpath
  return importPath.split('/')[0];
}

function isExternalModule(moduleName) {
  // Skip relative paths
  if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
    return false;
  }
  // Skip built-in modules
  if (BUILTIN_MODULES.has(moduleName)) {
    return false;
  }
  // Skip internal workspace packages
  if (moduleName.startsWith('@montezuma/') || moduleName.startsWith('@restpoint/')) {
    return false;
  }
  return true;
}

function getLatestVersion(packageName) {
  try {
    const result = require('child_process').execSync(
      `npm view ${packageName} version`,
      { encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    return result || 'latest';
  } catch {
    return 'latest';
  }
}

function fixService(service) {
  const pkg = JSON.parse(fs.readFileSync(service.pkgPath, 'utf8'));
  const dependencies = pkg.dependencies || {};
  const devDependencies = pkg.devDependencies || {};

  const sourceFiles = findSourceFiles(service.dir);
  const allImports = new Set();

  for (const file of sourceFiles) {
    const imports = extractImports(file);
    for (const imp of imports) {
      allImports.add(imp);
    }
  }

  const missing = [];
  for (const imp of allImports) {
    const moduleName = getModuleName(imp);
    if (!isExternalModule(moduleName)) continue;
    if (dependencies[moduleName] || devDependencies[moduleName]) continue;
    missing.push(moduleName);
  }

  if (missing.length === 0) {
    console.log(`  ✅ ${service.name}: no missing dependencies`);
    return false;
  }

  console.log(`  🔧 ${service.name}: adding ${missing.length} missing dependency(ies): ${missing.join(', ')}`);

  for (const mod of missing) {
    const version = getLatestVersion(mod);
    dependencies[mod] = `^${version}`;
    console.log(`     + ${mod}@^${version}`);
  }

  pkg.dependencies = dependencies;
  fs.writeFileSync(service.pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  return true;
}

// Main
console.log('🔍 Scanning services for missing dependencies...\n');

const services = findAllServices();
let fixedCount = 0;

for (const service of services) {
  if (fixService(service)) {
    fixedCount++;
  }
}

console.log(`\n✨ Done! Fixed ${fixedCount}/${services.length} services.`);