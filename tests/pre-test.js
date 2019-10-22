const { writeFileSync, readFileSync } = require('fs');

/**
 * This patches the graceful-fs library which is causing memory leaks when running via jest
 */
const replacement = `const fs = require('fs'); module.exports = Object.assign(fs, { gracefulify: () => {} });`;
const path = process.cwd() + '/node_modules/graceful-fs/graceful-fs.js';
const backup = process.cwd() + '/node_modules/graceful-fs/graceful-fs.js.backup';
const original = readFileSync(path);
writeFileSync(backup, original);
writeFileSync(path, replacement);
