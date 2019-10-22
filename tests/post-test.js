const { writeFileSync, readFileSync, existsSync, unlinkSync } = require('fs');

/**
 * This un-patches the graceful-fs library which is causing memory leaks when running via jest
 */
const path = process.cwd() + '/node_modules/graceful-fs/graceful-fs.js';
const backup = process.cwd() + '/node_modules/graceful-fs/graceful-fs.js.backup';

if (existsSync(backup)) {
  const original = readFileSync(backup);
  writeFileSync(path, original);
  unlinkSync(backup);
}
