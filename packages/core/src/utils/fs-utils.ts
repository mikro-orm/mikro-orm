import { existsSync, globSync, mkdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url'; // replace Utils.fileURLToPath with this
import { colors, type Dictionary, Utils } from '@mikro-orm/core';

export const fs = {
  pathExists(path: string): boolean {
    if (/[*?[\]]/.test(path)) {
      const found = globSync(path);
      return found.length > 0;
    }

    return existsSync(path);
  },

  pathToFileURL,

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
      return input.flatMap(paths => fs.glob(paths, cwd));
    }

    const hasGlobChars = /[*?[\]]/.test(input);

    if (!hasGlobChars) {
      try {
        const s = statSync(cwd ? Utils.normalizePath(cwd, input) : input);

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

  async getPackageConfig<T extends Dictionary>(basePath = process.cwd()): Promise<T> {
    if (fs.pathExists(`${basePath}/package.json`)) {
      try {
        return await Utils.dynamicImport<T>(`${basePath}/package.json`);
      } catch (e) {
        return {} as T;
      }
    }

    const parentFolder = realpathSync(`${basePath}/..`);

    // we reached the root folder
    if (basePath === parentFolder) {
      return {} as T;
    }

    return fs.getPackageConfig(parentFolder);
  },

  async getORMPackages(): Promise<Set<string>> {
    const pkg = await fs.getPackageConfig();
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
  },

  getORMPackageVersion(name: string): string | undefined {
    try {
      const path = import.meta.resolve(`${name}/package.json`);
      const pkg = fs.readJSONSync(fileURLToPath(path));
      return pkg?.version;
    } catch (e) {
      return undefined;
    }
  },

  // inspired by https://github.com/facebook/docusaurus/pull/3386
  async checkPackageVersion(): Promise<void> {
    const coreVersion = Utils.getORMVersion();

    if (process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH || coreVersion === '[[MIKRO_ORM_VERSION]]') {
      return;
    }

    const deps = await fs.getORMPackages();
    const exceptions = new Set(['nestjs', 'sql-highlighter', 'mongo-highlighter']);
    const ormPackages = [...deps].filter(d => d.startsWith('@mikro-orm/') && d !== '@mikro-orm/core' && !exceptions.has(d.substring('@mikro-orm/'.length)));

    for (const ormPackage of ormPackages) {
      const version = fs.getORMPackageVersion(ormPackage);

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

};
