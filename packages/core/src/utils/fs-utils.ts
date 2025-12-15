import { existsSync, globSync, mkdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Utils } from './Utils.js';
import { type Dictionary } from '../typings.js';
import { colors } from '../logging/colors.js';

export const fs = {
  pathExists(path: string): boolean {
    if (/[*?[\]]/.test(path)) {
      return globSync(path).length > 0;
    }

    return existsSync(path);
  },

  ensureDir(path: string): void {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  },

  readJSONSync<T = Dictionary>(path: string): T {
    const file = readFileSync(path);
    return JSON.parse(file.toString());
  },

  glob(input: string | string[], cwd?: string): string[] {
    if (Array.isArray(input)) {
      return input.flatMap(paths => this.glob(paths, cwd));
    }

    const hasGlobChars = /[*?[\]]/.test(input);

    if (!hasGlobChars) {
      try {
        const s = statSync(cwd ? this.normalizePath(cwd, input) : input);

        if (s.isDirectory()) {
          const files = globSync(join(input, '**'), { cwd, withFileTypes: true });
          return files.filter(f => f.isFile()).map(f => join(f.parentPath, f.name));
        }
      } catch {
        // ignore
      }
    }

    const files = globSync(input, { cwd, withFileTypes: true });
    return files.filter(f => f.isFile()).map(f => join(f.parentPath, f.name));
  },

  getPackageConfig<T extends Dictionary>(basePath = process.cwd()): T {
    if (this.pathExists(`${basePath}/package.json`)) {
      try {
        const path = import.meta.resolve(`${basePath}/package.json`);
        return this.readJSONSync(fileURLToPath(path));
      } catch (e) {
        /* v8 ignore next */
        return {} as T;
      }
    }

    const parentFolder = realpathSync(`${basePath}/..`);

    // we reached the root folder
    if (basePath === parentFolder) {
      return {} as T;
    }

    return this.getPackageConfig(parentFolder);
  },

  getORMPackages(): Set<string> {
    const pkg = this.getPackageConfig();
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
  },

  getORMPackageVersion(name: string): string | undefined {
    try {
      const path = import.meta.resolve(`${name}/package.json`);
      const pkg = this.readJSONSync(fileURLToPath(path));
      return pkg?.version;
    } catch (e) {
      return undefined;
    }
  },

  // inspired by https://github.com/facebook/docusaurus/pull/3386
  checkPackageVersion(): void {
    const coreVersion = Utils.getORMVersion();

    if (process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH || coreVersion === '[[MIKRO_ORM_VERSION]]') {
      return;
    }

    const deps = this.getORMPackages();
    const exceptions = new Set(['nestjs', 'sql-highlighter', 'mongo-highlighter']);
    const ormPackages = [...deps].filter(d => d.startsWith('@mikro-orm/') && d !== '@mikro-orm/core' && !exceptions.has(d.substring('@mikro-orm/'.length)));

    for (const ormPackage of ormPackages) {
      const version = this.getORMPackageVersion(ormPackage);

      if (version != null && version !== coreVersion) {
        throw new Error(
          `Bad ${colors.cyan(ormPackage)} version ${colors.yellow('' + version)}.\n` +
          `All official @mikro-orm/* packages need to have the exact same version as @mikro-orm/core (${colors.green(coreVersion)}).\n` +
          `Only exceptions are packages that don't live in the 'mikro-orm' repository: ${[...exceptions].join(', ')}.\n` +
          `Maybe you want to check, or regenerate your yarn.lock or package-lock.json file?`,
        );
      }
    }
  },

  fileURLToPath,

  /**
   * Resolves and normalizes a series of path parts relative to each preceding part.
   * If any part is a `file:` URL, it is converted to a local path. If any part is an
   * absolute path, it replaces preceding paths (similar to `path.resolve` in NodeJS).
   * Trailing directory separators are removed, and all directory separators are converted
   * to POSIX-style separators (`/`).
   */
  normalizePath(...parts: string[]): string {
    let start = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (isAbsolute(part)) {
        start = i;
      } else if (part.startsWith('file:')) {
        start = i;
        parts[i] = this.fileURLToPath(part);
      }
    }

    if (start > 0) {
      parts = parts.slice(start);
    }

    let path = parts.join('/').replace(/\\/g, '/').replace(/\/$/, '');
    path = normalize(path).replace(/\\/g, '/');

    return (path.match(/^[/.]|[a-zA-Z]:/) || path.startsWith('!')) ? path : './' + path;
  },

  /**
   * Determines the relative path between two paths. If either path is a `file:` URL,
   * it is converted to a local path.
   */
  relativePath(path: string, relativeTo: string): string {
    if (!path) {
      return path;
    }

    path = this.normalizePath(path);

    if (path.startsWith('.')) {
      return path;
    }

    path = relative(this.normalizePath(relativeTo), path);

    return this.normalizePath(path);
  },

  /**
   * Computes the absolute path to for the given path relative to the provided base directory.
   * If either `path` or `baseDir` are `file:` URLs, they are converted to local paths.
   */
  absolutePath(path: string, baseDir = process.cwd()): string {
    if (!path) {
      return this.normalizePath(baseDir);
    }

    if (!isAbsolute(path) && !path.startsWith('file://')) {
      path = baseDir + '/' + path;
    }

    return this.normalizePath(path);
  },

  async dynamicImport<T = any>(id: string): Promise<T> {
    /* v8 ignore next */
    const specifier = id.startsWith('file://') ? id : pathToFileURL(id).href;
    const dynamicImportProvider = (globalThis as any).dynamicImportProvider ?? ((id: string) => import(id));
    return dynamicImportProvider(specifier);
  },
};

export * from '../cache/FileCacheAdapter.js';
