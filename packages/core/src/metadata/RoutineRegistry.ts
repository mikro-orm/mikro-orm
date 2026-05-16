import { MetadataError } from '../errors.js';
import type { EntityName, RoutineMetadata } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import { MetadataValidator } from './MetadataValidator.js';
import { Routine } from './Routine.js';

/**
 * Validates and indexes the `routines` config entries for lookup by class, class name, or DB
 * routine name. Treated as immutable — built once during MikroORM init (via
 * `Configuration.getRoutines()`) and then queried.
 *
 * Routines never participate in unit-of-work, identity map, or query building, so this lives on
 * `Configuration` rather than `MetadataStorage` — the registry is a thin wrapper around
 * user-supplied input, not derived entity metadata.
 */
export class RoutineRegistry {
  readonly #byClass = new Map<EntityName, RoutineMetadata>();
  readonly #byClassName: Record<string, RoutineMetadata> = {};

  constructor(routines: Iterable<unknown>) {
    const validator = new MetadataValidator();
    const seenKeys = new Set<string>();

    for (const item of routines) {
      if (!Routine.is(item)) {
        throw new MetadataError(`'routines' entry is not a stored routine declaration. Use a Routine class instance.`);
      }

      const meta = item.meta;
      validator.validateRoutineDefinition(meta);

      // Collide on `(schema?, routineName)` — same pair would emit the same CREATE DDL and
      // overwrite each other in the index. Surface this loudly rather than letting it silently
      // become last-wins.
      const key = (meta.schema ? `${meta.schema}.` : '') + meta.routineName;

      if (seenKeys.has(key)) {
        throw new MetadataError(
          `Duplicate routine '${key}' declared more than once in the 'routines' config. Routine names must be unique within a schema.`,
        );
      }

      seenKeys.add(key);
      this.#byClass.set(meta.class, meta);
      this.#byClassName[Utils.className(meta.class)] = meta;
    }
  }

  /** Number of registered routines. */
  get size(): number {
    return this.#byClass.size;
  }

  /** Iterates all registered routines. */
  all(): IterableIterator<RoutineMetadata> {
    return this.#byClass.values();
  }

  /**
   * Resolves a routine by class, class-name string, or DB routine-name string. The two-string
   * lookup paths exist because a user-defined class name (`HashDecor`) may differ from the
   * DB-side routine name (`hash_decor`); callers like `em.callRoutine('hash_decor', …)` need to
   * resolve via either form.
   */
  find<T = any>(name: EntityName<T> | string): RoutineMetadata<T> | undefined {
    if (typeof name !== 'string') {
      const hit = this.#byClass.get(name);

      if (hit) {
        return hit as RoutineMetadata<T>;
      }
    }

    const key = typeof name === 'string' ? name : Utils.className(name);
    const byClassName = this.#byClassName[key];

    if (byClassName) {
      return byClassName as RoutineMetadata<T>;
    }

    // Fall back to DB-name lookup so `find('hash_decor')` works for routines whose class name
    // (`HashDecor`) differs from their declared routine name.
    return Object.values(this.#byClassName).find(r => r.routineName === key) as RoutineMetadata<T> | undefined;
  }
}
