import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const flags = dryRun ? ' --dry-run --allow-dirty' : '';

// Collect all packages that have jsr.json, ordered by dependency depth.
// We scan source imports to determine the correct publish order,
// since yarn's topological sort doesn't account for peerDependencies.
const packagesDir = resolve(import.meta.dirname, '..', 'packages');
const packages = new Map();
const originals = new Map();

for (const name of readdirSync(packagesDir)) {
  const jsrPath = resolve(packagesDir, name, 'jsr.json');

  if (!existsSync(jsrPath)) {
    continue;
  }

  const original = readFileSync(jsrPath, 'utf8');
  const jsr = JSON.parse(original);
  const pkgJson = JSON.parse(readFileSync(resolve(packagesDir, name, 'package.json'), 'utf8'));

  // During dry-run, sync jsr.json from package.json so we validate against
  // current source. For real publishes, the sync is already committed by
  // the pin-versions step in copy.mjs.
  if (dryRun) {
    const imports = {};

    for (const section of ['dependencies', 'peerDependencies']) {
      for (const [dep, ver] of Object.entries(pkgJson[section] ?? {})) {
        const prefix = dep.startsWith('@mikro-orm/') ? 'jsr' : 'npm';
        // JSR doesn't support OR version ranges — pick the last alternative
        const version = ver.includes('||') ? ver.split('||').pop().trim() : ver;
        imports[dep] ??= `${prefix}:${dep}@${version}`;
      }
    }

    if (Object.keys(imports).length > 0) {
      jsr.imports = imports;
    } else {
      delete jsr.imports;
    }

    jsr.version = pkgJson.version;
    const synced = JSON.stringify(jsr, null, 2) + '\n';
    writeFileSync(jsrPath, synced, { flush: true });

    if (synced !== original) {
      originals.set(jsrPath, original);
    }
  }

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

const failed = [];

for (const { name, dir } of sorted) {
  console.log(`\nPublishing ${name}...`);

  try {
    execSync(`cd ${dir} && jsr publish${flags}`, { stdio: 'inherit' });
  } catch {
    failed.push(name);
  }
}

// Restore original jsr.json files during dry-run to avoid leaving a dirty tree.
if (dryRun) {
  for (const [path, content] of originals) {
    writeFileSync(path, content, { flush: true });
  }
}

if (failed.length > 0) {
  console.error(`\nFailed to publish: ${failed.join(', ')}`);
  process.exit(1);
}
