import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const flags = dryRun ? ' --dry-run --allow-dirty' : '';

// Collect all packages that have jsr.json, ordered by dependency depth.
// We scan source imports to determine the correct publish order,
// since yarn's topological sort doesn't account for peerDependencies.
const packagesDir = resolve(import.meta.dirname, '..', 'packages');
const packages = new Map();

for (const name of readdirSync(packagesDir)) {
  const jsrPath = resolve(packagesDir, name, 'jsr.json');

  if (!existsSync(jsrPath)) {
    continue;
  }

  const jsr = JSON.parse(readFileSync(jsrPath, 'utf8'));
  const pkgJson = JSON.parse(readFileSync(resolve(packagesDir, name, 'package.json'), 'utf8'));

  // Use package.json dependencies and peerDependencies to build the graph,
  // filtering to only @mikro-orm/* packages that are also being published to JSR.
  const deps = new Set();

  for (const section of ['dependencies', 'peerDependencies']) {
    for (const dep of Object.keys(pkgJson[section] ?? {})) {
      if (dep.startsWith('@mikro-orm/')) {
        deps.add(dep);
      }
    }
  }

  packages.set(jsr.name, { dir: resolve(packagesDir, name), deps: [...deps].filter(d => d !== jsr.name) });
}

// Filter deps to only packages that are being published (have jsr.json).
for (const [name, pkg] of packages) {
  pkg.deps = pkg.deps.filter(d => packages.has(d));
}

// Topological sort.
const sorted = [];
const visited = new Set();

function visit(name) {
  if (visited.has(name)) return;
  visited.add(name);
  const pkg = packages.get(name);

  if (!pkg) return;

  for (const dep of pkg.deps) {
    visit(dep);
  }

  sorted.push({ name, dir: pkg.dir });
}

for (const name of packages.keys()) {
  visit(name);
}

for (const { name, dir } of sorted) {
  console.log(`\nPublishing ${name}...`);
  execSync(`cd ${dir} && jsr publish${flags}`, { stdio: 'inherit' });
}
