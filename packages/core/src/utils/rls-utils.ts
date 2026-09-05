import { MetadataError, ValidationError } from '../errors.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { Dictionary, FilterDef } from '../typings.js';
import { QueryHelper } from './QueryHelper.js';
import { Utils } from './Utils.js';

/** An `rls`-flagged filter definition together with the entity it is declared on. */
export interface RlsFilterEntry {
  filter: FilterDef;
  entityName: string;
}

/** Lazily-built `rls` filter lookup keyed by the shared (immutable) MetadataStorage, so all forks reuse it. */
const rlsFilterDefs = new WeakMap<MetadataStorage, Map<string, RlsFilterEntry[]>>();

/**
 * Collects all `rls`-flagged filter definitions with the given name (only entity-scoped filters can be `rls`).
 * The full name -> defs lookup is built once and cached on the shared (immutable) MetadataStorage, so repeated
 * `setFilterParams` calls and forks reuse it instead of walking every entity each time.
 */
export function findRlsFilterDefs(metadata: MetadataStorage, name: string): RlsFilterEntry[] {
  let cache = rlsFilterDefs.get(metadata);

  if (!cache) {
    cache = new Map();

    for (const meta of metadata) {
      for (const filterName of Object.keys(meta.filters)) {
        const filter = meta.filters[filterName];

        if (!filter.rls) {
          continue;
        }

        const defs = cache.get(filterName) ?? [];

        // inheritance shares the same filter object across base and child metadata — keep a single entry
        if (!defs.some(d => d.filter === filter)) {
          defs.push({ filter, entityName: meta.className });
        }

        cache.set(filterName, defs);
      }
    }

    rlsFilterDefs.set(metadata, cache);
  }

  return cache.get(name) ?? [];
}

/**
 * Drops the cached `rls` filter lookup — `MikroORM.discoverEntity()` mutates the shared MetadataStorage,
 * so a lookup built before the call would miss the newly discovered filters.
 *
 * @internal
 */
export function clearRlsFilterDefsCache(metadata: MetadataStorage): void {
  rlsFilterDefs.delete(metadata);
}

/**
 * Computes the `rls` session variables a set of same-named filter defs stages for the given args, mirroring the
 * policy compilation (`current_setting` names and custom `setting` binding). Shared by staging and `fork({ session })`.
 */
export function computeRlsFilterVariables(
  filters: RlsFilterEntry[],
  args: Dictionary,
): Dictionary<string | number | boolean | Date> {
  const variables: Dictionary<string | number | boolean | Date> = {};

  for (const { filter, entityName } of filters) {
    const setting = typeof filter.rls === 'object' ? filter.rls.setting : undefined;
    let settingArg: string | undefined;

    if (setting) {
      // mirror the policy compilation — a custom `setting` binds the single argument the condition accesses
      const accessed = new Set<string>();
      QueryHelper.resolveRlsFilterCond(filter, accessed, entityName);

      if (accessed.size > 1) {
        throw MetadataError.rlsFilterMultiArgSetting(filter.name, [...accessed]);
      }

      settingArg = [...accessed][0];
    }

    for (const key of Object.keys(args)) {
      const value = args[key];

      // treat `undefined` like an omitted arg — staging it would serialize as the literal string 'undefined'
      if (value === undefined) {
        continue;
      }

      // a non-scalar arg has no equivalent in the compiled `= current_setting(...)` comparison — the app-level
      // filter would apply `$in`/`is null` semantics while the policy compares against `String(value)`
      if (value === null || (typeof value === 'object' && !(value instanceof Date))) {
        throw ValidationError.cannotStageNonScalarSessionVariable(filter.name, key);
      }

      const settingName = key === settingArg ? setting! : Utils.getRlsSettingName(filter.name, key);
      variables[settingName] = value;
    }
  }

  return variables;
}

/**
 * Computes which staged session variables a `setFilterParams` call may prune: the variables the OLD args staged for
 * this filter that the new args no longer set, minus any variable another filter's current params still stage
 * (a custom `setting` name can be shared by differently named filters). Recomputing from the old args rather than
 * matching by prefix keeps a filter named `tenant` from also pruning a `tenant.x` filter's `mikro.tenant.x.*` variables.
 */
export function computeRemovedRlsVariables(
  metadata: MetadataStorage,
  name: string,
  filters: RlsFilterEntry[],
  previousArgs: Dictionary,
  nextVariables: Dictionary,
  allFilterParams: Dictionary<Dictionary>,
): string[] {
  const removed = Object.keys(computeRlsFilterVariables(filters, previousArgs)).filter(key => !(key in nextVariables));
  const keptByOthers = new Set<string>();

  for (const otherName of removed.length > 0 ? Object.keys(allFilterParams) : []) {
    if (otherName !== name) {
      for (const key of Object.keys(
        computeRlsFilterVariables(findRlsFilterDefs(metadata, otherName), allFilterParams[otherName]),
      )) {
        keptByOthers.add(key);
      }
    }
  }

  return removed.filter(key => !keptByOthers.has(key));
}
