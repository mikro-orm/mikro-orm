import { basename } from 'node:path';
import { fs } from '../utils/fs-utils.js';

import { type Constructor, type Dictionary } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import { MetadataStorage } from './MetadataStorage.js';
import { EntitySchema } from './EntitySchema.js';

async function getEntityClassOrSchema(
  filepath: string,
  allTargets: Map<Constructor | EntitySchema, string>,
  baseDir: string,
): Promise<void> {
  const path = fs.normalizePath(baseDir, filepath);
  const raw = await fs.dynamicImport(path);

  // CJS modules loaded via `import()` wrap named exports inside `default`.
  // Merge them to the top level so they are discoverable.
  const exports: Dictionary = { ...raw };

  if (raw.default != null && typeof raw.default === 'object' && !Array.isArray(raw.default)) {
    Object.assign(exports, raw.default);
  }

  const targets = Object.values<Constructor | EntitySchema>(exports);

  // ignore class implementations that are linked from an EntitySchema
  for (const item of targets) {
    if (EntitySchema.is(item)) {
      for (const item2 of targets) {
        if (item.meta.class === item2) {
          targets.splice(targets.indexOf(item2), 1);
        }
      }
    }
  }

  for (const item of targets) {
    const validTarget = EntitySchema.is(item) || (item instanceof Function && MetadataStorage.isKnownEntity(item.name));

    if (validTarget && !allTargets.has(item)) {
      allTargets.set(item, path);
    }
  }
}

export async function discoverEntities(
  paths: string | string[],
  options?: { baseDir?: string },
): Promise<Iterable<EntitySchema | Constructor>> {
  paths = Utils.asArray(paths).map(path => fs.normalizePath(path));
  const baseDir = fs.absolutePath(options?.baseDir ?? process.cwd());
  const files = fs.glob(paths, fs.normalizePath(baseDir));
  const found = new Map<Constructor | EntitySchema, string>();

  for (const filepath of files) {
    const filename = basename(filepath);

    if (!/\.[cm]?[jt]s$/.exec(filename) || /\.d\.[cm]?ts/.exec(filename)) {
      continue;
    }

    await getEntityClassOrSchema(filepath, found, baseDir);
  }

  return found.keys();
}
