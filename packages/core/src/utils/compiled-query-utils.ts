import type { EntityManager } from '../EntityManager.js';
import { ValidationError } from '../errors.js';
import { inspect } from '../logging/inspect.js';
import type { Dictionary, EntityMetadata, EntityName, FilterDef, FilterQuery } from '../typings.js';
import {
  clonePopulate,
  CompiledQueryCache,
  CompiledQueryRecording,
  type CompiledQueryKind,
  type CompiledQueryLookup,
  type QueryCompilation,
  type ReplayedFilterCond,
} from './CompiledQueryCache.js';
import { Utils } from './Utils.js';

type FilterType = 'read' | 'update' | 'delete';

/** Compilations of the dry runs, keyed by the throwaway fork that performs them. */
const compilations = new WeakMap<EntityManager, QueryCompilation>();

function getFilterArgs(em: EntityManager, options: unknown, name: string): Dictionary | undefined {
  const args = (options as Dictionary | undefined)?.[name];

  return Utils.isPlainObject(args) ? args : em.getFilterParams(name);
}

/**
 * Looks up the compiled query for this call. The result carries `params` on a cache hit.
 * @internal
 */
export function lookupCompiledQuery(
  em: EntityManager,
  caller: EntityManager,
  kind: CompiledQueryKind,
  meta: EntityMetadata<any>,
  where: unknown,
  options: Dictionary,
): CompiledQueryLookup | undefined {
  const cache = em.config.getCompiledQueryCache();

  // a dry run only compiles the query on a throwaway fork
  if (!cache || options._compile || meta.virtual) {
    return undefined;
  }

  const filters = em.getFiltersKey();

  // the joined filters are resolved on the caller, a compiled query only knows the filters of the context
  if (caller !== em && caller.getFiltersKey() !== filters) {
    return undefined;
  }

  const leaves: unknown[] = [];
  const entry = cache.lookup(kind, meta, where, options, filters, leaves);

  if (!entry) {
    return undefined;
  }

  where = cache.pad(where);
  const query = entry.query;
  const base = leaves.length;

  if (!query) {
    return { entry, leaves, base, where, prepared: { ...options } };
  }

  const lookup: CompiledQueryLookup = { entry, leaves, base, where, prepared: options, query, verify: cache.verify };

  if (!query.filterCalls) {
    lookup.params = query.bind(leaves, em.getPlatform());
  }

  return lookup;
}

/**
 * Returns the condition a replayed filter callback already produced for this filter, if any.
 * @internal
 */
export function takeReplayedFilterCond(
  findOptions: Dictionary | undefined,
  filter: FilterDef,
  type: FilterType,
  entity: string,
): Dictionary | undefined {
  const replayed = findOptions?._filterConds as ReplayedFilterCond[] | undefined;
  const idx = replayed?.findIndex(
    ({ call }) => call.filter.name === filter.name && call.type === type && call.entity === entity,
  );

  return idx != null && idx >= 0 ? replayed!.splice(idx, 1)[0].cond : undefined;
}

/**
 * Records a filter callback invoked by a dry run, so it can be invoked again when the compiled query is used.
 * @internal
 */
export function recordFilterCall(
  em: EntityManager,
  filter: FilterDef,
  cond: Dictionary,
  args: Dictionary | undefined,
  type: FilterType,
  entity: string,
): Dictionary {
  const compilation = compilations.get(em);

  if (!compilation) {
    return cond;
  }

  const leaves: unknown[] = [];
  const shape = CompiledQueryCache.filterKey(cond, leaves);

  // callbacks reading the EntityManager or the options, and arguments overridden on a relation, cannot be repeated
  if (
    shape === undefined ||
    (filter.cond as Function).length > 2 ||
    args !== getFilterArgs(em, compilation.filters, filter.name)
  ) {
    compilation.dynamic = true;
    return cond;
  }

  (compilation.filterCalls ??= []).push({ filter, entity, type, shape });
  (compilation.filterLeaves ??= []).push(...leaves);

  return compilation.recording ? (compilation.recording.substituteFilter(cond, leaves) as Dictionary) : cond;
}

/**
 * Invokes the filter callbacks of a compiled query and binds its parameters when they return the same shapes.
 * @internal
 */
export async function replayFilterCalls(
  em: EntityManager,
  lookup: CompiledQueryLookup,
  options: Dictionary,
): Promise<void> {
  const { leaves, query } = lookup;
  const conds: ReplayedFilterCond[] = [];

  for (const call of query!.filterCalls!) {
    const cond = call.filter.cond as Function;
    const args = getFilterArgs(em, options.filters, call.filter.name);

    // the regular path reports the missing arguments
    if (!args && cond.length > 0 && call.filter.args !== false) {
      return;
    }

    const ret = await cond(args, call.type, em, options, call.entity);

    if (CompiledQueryCache.filterKey(ret, leaves) !== call.shape) {
      return;
    }

    conds.push({ call, cond: ret });
  }

  lookup.params = query!.bind(leaves, em.getPlatform());
  lookup.filterConds = conds;
}

async function compileDry(
  em: EntityManager,
  kind: CompiledQueryKind,
  entityName: EntityName,
  where: unknown,
  options: Dictionary,
  recording?: CompiledQueryRecording,
): Promise<QueryCompilation> {
  const compilation: QueryCompilation = { dry: true, filters: options.filters, recording };
  const fork = em.fork();
  compilations.set(fork, compilation);
  const opts = { ...options, ctx: undefined, _compile: compilation };

  if (kind === 'find') {
    await fork.find(entityName, where as FilterQuery<object>, opts);
  } else if (kind === 'findOne') {
    await fork.findOne(entityName, where as FilterQuery<object>, opts);
  } else {
    await fork.count(entityName, where as FilterQuery<object>, opts);
  }

  return compilation;
}

/** Compiles the query the regular way and compares it with the one served from the cache. */
async function verifyCompiledQuery(
  em: EntityManager,
  kind: CompiledQueryKind,
  entityName: EntityName,
  lookup: CompiledQueryLookup,
): Promise<void> {
  const dry = await compileDry(em, kind, entityName, lookup.where, lookup.prepared);
  const query = lookup.query!;
  // the callbacks can return other values every time, so the parameters are compared for the ones of the dry run
  const leaves = [...lookup.leaves.slice(0, lookup.base), ...(dry.filterLeaves ?? [])];
  const params = query.bind(leaves, em.getPlatform());

  if (dry.sql !== query.sql || !Utils.equals(dry.params, params)) {
    throw new ValidationError(
      `Compiled query cache mismatch in ${kind}(${Utils.className(entityName)}): expected '${dry.sql}' with ${inspect(dry.params)}, got '${query.sql}' with ${inspect(params)}`,
    );
  }
}

/**
 * Replaces the option processing with the outcome stored in the compiled query.
 * Joined filters holding values of filter callbacks are computed for every call, as the loader passes them to the child queries.
 * @internal
 */
export async function useCompiledQuery<Options extends Dictionary>(
  em: EntityManager,
  kind: CompiledQueryKind,
  entityName: EntityName,
  lookup: CompiledQueryLookup,
  options: Options,
  getJoinedFilters?: (options: Options) => Promise<unknown>,
): Promise<Options> {
  const query = lookup.query!;
  const ret: Dictionary = { ...options, ...query.overrides };

  if (query.populate) {
    ret.populate = clonePopulate(query.populate);
  }

  if (query.joinedFilters && getJoinedFilters) {
    // the replayed callbacks already returned the conditions, do not invoke them again
    ret.populateFilter = await getJoinedFilters({ ...ret, _filterConds: lookup.filterConds } as Dictionary as Options);
  }

  if (lookup.verify) {
    await verifyCompiledQuery(em, kind, entityName, lookup);
  }

  lookup.internal = { _compiled: lookup };

  return ret as Options;
}

/**
 * Starts recording the query when its shape was seen before, and captures the processed options.
 * @internal
 */
export function startCompilation(lookup: CompiledQueryLookup | undefined, options: Dictionary): void {
  const entry = lookup?.entry;

  // a recording that never finished (e.g. the query failed) is retried after a while
  if (!entry || lookup.query || entry.seen < 2 || (entry.pending && entry.seen - entry.pending < 64)) {
    return;
  }

  entry.pending = entry.seen;
  lookup.recording = new CompiledQueryRecording(lookup.leaves, lookup.where, lookup.prepared);
  lookup.recording.capture(options);

  lookup.internal = { _compile: lookup.recording.compilation };
}

/**
 * Compiles the recorded query again with placeholder values to learn where its parameters come from.
 * @internal
 */
export async function finishCompilation(
  em: EntityManager,
  kind: CompiledQueryKind,
  entityName: EntityName,
  lookup: CompiledQueryLookup,
): Promise<void> {
  const entry = lookup.entry;
  const recording = lookup.recording!;
  entry.pending = undefined;

  // only one recording at a time can observe the custom type conversions, retry on the next call
  if (CompiledQueryCache.recording) {
    return;
  }

  CompiledQueryCache.recording = recording;

  try {
    const dry = await compileDry(em, kind, entityName, recording.where, recording.options, recording).finally(
      () => (CompiledQueryCache.recording = undefined),
    );
    // the values the callbacks returned for the real query are not known, so compile it once more to learn them
    const reference = dry.filterCalls
      ? await compileDry(em, kind, entityName, lookup.where, lookup.prepared)
      : undefined;
    entry.query = recording.build(dry, em.getPlatform(), reference);
  } catch {
    // the query cannot be built with placeholder values
  }

  entry.bypass = !entry.query;
}
