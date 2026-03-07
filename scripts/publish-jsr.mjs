import { execSync } from 'node:child_process';

const dryRun = process.argv.includes('--dry-run');
const flags = dryRun ? ' --dry-run --allow-dirty' : '';

// Yarn handles topological ordering via -t; the bash guard skips packages without jsr.json.
execSync(`yarn workspaces foreach -At exec bash -c 'if [ -f jsr.json ]; then jsr publish${flags}; fi'`, {
  stdio: 'inherit',
});
