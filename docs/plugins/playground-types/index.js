const fs = require('node:fs');
const path = require('node:path');

const PACKAGES = ['@mikro-orm/core', '@mikro-orm/sql', '@mikro-orm/sqlite'];

function walkDts(dir, base, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDts(full, base, out);
    } else if (entry.name.endsWith('.d.ts')) {
      out.push(path.relative(base, full));
    }
  }
}

/** Builds a virtual filesystem of `.d.ts` files so the playground editor resolves real types. */
function collectTypes() {
  const vfs = {};

  for (const pkg of PACKAGES) {
    const pkgDir = path.dirname(require.resolve(`${pkg}/package.json`));
    const real = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));

    // Mirror the real package.json so NodeNext resolution behaves exactly as in a local
    // project, but add a `types` export condition: these packages point `.` at `./index.js`
    // and ship the `.d.ts` beside it, while we only bundle the `.d.ts` files into the VFS.
    const withTypes = target =>
      typeof target === 'string' ? { types: target.replace(/\.js$/, '.d.ts'), default: target } : target;
    if (typeof real.exports === 'string') {
      real.exports = { '.': withTypes(real.exports) };
    } else if (real.exports && typeof real.exports['.'] === 'string') {
      real.exports['.'] = withTypes(real.exports['.']);
    }
    real.types = './index.d.ts';
    vfs[`file:///node_modules/${pkg}/package.json`] = JSON.stringify(real);

    const files = [];
    walkDts(pkgDir, pkgDir, files);
    for (const rel of files) {
      vfs[`file:///node_modules/${pkg}/${rel.split(path.sep).join('/')}`] = fs.readFileSync(
        path.join(pkgDir, rel),
        'utf8',
      );
    }
  }

  return vfs;
}

module.exports = function playgroundTypesPlugin(context) {
  const outDir = path.join(context.siteDir, 'static', 'playground');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'mikro-orm-types.json'), JSON.stringify(collectTypes()));

  return { name: 'playground-types' };
};
