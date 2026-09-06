const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

const PACKAGES = ['core', 'sql', 'sqlite'];
const packagesDir = path.resolve(__dirname, '../../../packages');

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

function parseConfig(configPath) {
  const host = {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  };

  return ts.getParsedCommandLineOfConfigFile(configPath, {}, host);
}

/**
 * Emits declarations for the monorepo packages straight from their sources, so the playground
 * types never depend on a prior `yarn build` nor on a published version from npm.
 */
function emitDeclarations() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mikro-orm-playground-types-'));
  const rootFiles = [];
  let options;

  for (const pkg of PACKAGES) {
    const config = parseConfig(path.join(packagesDir, pkg, 'tsconfig.build.json'));
    rootFiles.push(...config.fileNames);
    options ??= config.options;
  }

  const program = ts.createProgram(rootFiles, {
    ...options,
    // a single program over all three packages, so the shared `core` sources are checked once
    rootDir: packagesDir,
    outDir,
    declaration: true,
    emitDeclarationOnly: true,
    noEmitOnError: false,
    skipLibCheck: true,
    incremental: false,
    composite: false,
    tsBuildInfoFile: undefined,
  });
  program.emit();

  return outDir;
}

/** Builds a virtual filesystem of `.d.ts` files so the playground editor resolves real types. */
function collectTypes(outDir) {
  const vfs = {};

  for (const pkg of PACKAGES) {
    // mirror `scripts/copy.mjs`: the published `package.json` points at the flat build output
    const source = fs.readFileSync(path.join(packagesDir, pkg, 'package.json'), 'utf8');
    const real = JSON.parse(source.replace(/dist\//g, '').replace(/src\/(.*)\.ts/g, '$1.js'));

    // Add a `types` export condition: the published packages point `.` at `./index.js` and ship
    // the `.d.ts` beside it, while we only bundle the `.d.ts` files into the VFS.
    const withTypes = target =>
      typeof target === 'string' ? { types: target.replace(/\.js$/, '.d.ts'), default: target } : target;
    if (typeof real.exports === 'string') {
      real.exports = { '.': withTypes(real.exports) };
    } else if (real.exports && typeof real.exports['.'] === 'string') {
      real.exports['.'] = withTypes(real.exports['.']);
    }
    real.types = './index.d.ts';
    vfs[`file:///node_modules/@mikro-orm/${pkg}/package.json`] = JSON.stringify(real);

    const pkgDir = path.join(outDir, pkg, 'src');
    const files = [];
    walkDts(pkgDir, pkgDir, files);
    for (const rel of files) {
      vfs[`file:///node_modules/@mikro-orm/${pkg}/${rel.split(path.sep).join('/')}`] = fs.readFileSync(
        path.join(pkgDir, rel),
        'utf8',
      );
    }
  }

  return vfs;
}

module.exports = function playgroundTypesPlugin(context) {
  const start = Date.now();
  const outDir = path.join(context.siteDir, 'static', 'playground');
  const typesDir = emitDeclarations();
  const vfs = collectTypes(typesDir);
  fs.rmSync(typesDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'mikro-orm-types.json'), JSON.stringify(vfs));
  console.log(`[playground-types] emitted ${Object.keys(vfs).length} type files in ${Date.now() - start}ms`);

  return { name: 'playground-types' };
};
