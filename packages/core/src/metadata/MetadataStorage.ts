import { type Dictionary, type EntityCtor, EntityMetadata, type EntityName, RoutineMetadata } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import { MetadataError } from '../errors.js';
import type { EntityManager } from '../EntityManager.js';
import { EntityHelper } from '../entity/EntityHelper.js';
import { EntitySchema } from './EntitySchema.js';

function getGlobalStorage(namespace: string): Dictionary {
  const key = `mikro-orm-${namespace}` as keyof typeof globalThis;
  (globalThis as Dictionary)[key] = globalThis[key] || {};

  return globalThis[key];
}

/** Registry that stores and provides access to entity metadata by class, name, or id. */
export class MetadataStorage {
  static readonly PATH_SYMBOL = Symbol.for('@mikro-orm/core/MetadataStorage.PATH_SYMBOL');

  static readonly #metadata: Dictionary<EntityMetadata> = getGlobalStorage('metadata');
  static readonly #routineMetadata: Dictionary<RoutineMetadata> = getGlobalStorage('routine-metadata');
  readonly #metadataMap = new Map<EntityName, EntityMetadata>();
  readonly #idMap: Record<number, EntityMetadata>;
  readonly #classNameMap: Record<string, EntityMetadata>;
  readonly #uniqueNameMap: Record<string, EntityMetadata>;
  readonly #routinesMap = new Map<EntityName, RoutineMetadata>();
  readonly #routinesByClassName: Record<string, RoutineMetadata> = {};

  constructor(metadata: Dictionary<EntityMetadata> = {}) {
    this.#idMap = {};
    this.#uniqueNameMap = {};
    this.#classNameMap = Utils.copy(metadata, false);

    for (const meta of Object.values(this.#classNameMap)) {
      this.#idMap[meta._id] = meta;
      this.#uniqueNameMap[meta.uniqueName] = meta;
      this.#metadataMap.set(meta.class, meta);
    }
  }

  /** Returns the global metadata dictionary, or a specific entry by entity name and path. */
  static getMetadata(): Dictionary<EntityMetadata>;
  static getMetadata<T = any>(entity: string, path: string): EntityMetadata<T>;
  static getMetadata<T = any>(entity?: string, path?: string): Dictionary<EntityMetadata> | EntityMetadata<T> {
    const key = entity && path ? entity + '-' + Utils.hash(path) : null;

    if (key && !MetadataStorage.#metadata[key]) {
      MetadataStorage.#metadata[key] = new EntityMetadata({ className: entity, path });
    }

    if (key) {
      return MetadataStorage.#metadata[key];
    }

    return MetadataStorage.#metadata;
  }

  /** Returns the global routine metadata dictionary, or a specific entry by routine class name and path. */
  static getRoutineMetadata(): Dictionary<RoutineMetadata>;
  static getRoutineMetadata<T = any>(routine: string, path: string): RoutineMetadata<T>;
  static getRoutineMetadata<T = any>(
    routine?: string,
    path?: string,
  ): Dictionary<RoutineMetadata> | RoutineMetadata<T> {
    const key = routine && path ? routine + '-' + Utils.hash(path) : null;

    if (key && !MetadataStorage.#routineMetadata[key]) {
      MetadataStorage.#routineMetadata[key] = new RoutineMetadata({ className: routine, path });
    }

    if (key) {
      return MetadataStorage.#routineMetadata[key];
    }

    return MetadataStorage.#routineMetadata;
  }

  /** Checks whether an entity with the given class name exists in the global metadata. */
  static isKnownEntity(name: string): boolean {
    return !!Object.values(this.#metadata).find(meta => meta.className === name);
  }

  /** Clears all entries from the global metadata registry. */
  static clear(): void {
    Object.keys(this.#metadata).forEach(k => delete this.#metadata[k]);
    Object.keys(this.#routineMetadata).forEach(k => delete this.#routineMetadata[k]);
  }

  /** Returns the map of all registered entity metadata. */
  getAll(): Map<EntityName, EntityMetadata> {
    return this.#metadataMap;
  }

  /** Returns metadata for the given entity, optionally initializing it if not found. */
  get<T = any>(entityName: EntityName<T>, init = false): EntityMetadata<T> {
    const exists = this.find(entityName);

    if (exists) {
      return exists;
    }

    const className = Utils.className(entityName);

    if (!init) {
      throw MetadataError.missingMetadata(className);
    }

    const meta = new EntityMetadata({ class: entityName as EntityCtor, name: className });
    this.set(entityName, meta);

    return meta;
  }

  /** Finds metadata for the given entity, returning undefined if not registered. */
  find<T = any>(entityName: EntityName<T>): EntityMetadata<T> | undefined {
    if (!entityName) {
      return;
    }

    const meta = this.#metadataMap.get(entityName);

    if (meta) {
      return meta;
    }

    if (EntitySchema.is(entityName)) {
      return this.#metadataMap.get(entityName.meta.class) ?? entityName.meta;
    }

    return this.#classNameMap[Utils.className(entityName)];
  }

  /** Checks whether metadata exists for the given entity. */
  has<T>(entityName: EntityName<T>): boolean {
    return this.#metadataMap.has(entityName);
  }

  /** Registers metadata for the given entity. */
  set<T>(entityName: EntityName<T>, meta: EntityMetadata): EntityMetadata {
    this.#metadataMap.set(entityName, meta);
    this.#idMap[meta._id] = meta;
    this.#uniqueNameMap[meta.uniqueName] = meta;
    this.#classNameMap[Utils.className(entityName)] = meta;

    return meta;
  }

  /** Removes metadata for the given entity from all internal maps. */
  reset<T>(entityName: EntityName<T>): void {
    const meta = this.find(entityName);

    if (meta) {
      this.#metadataMap.delete(meta.class);
      delete this.#idMap[meta._id];
      delete this.#uniqueNameMap[meta.uniqueName];
      delete this.#classNameMap[meta.className];
    }
  }

  /** Decorates all entity prototypes with helper methods (e.g. init, toJSON). */
  decorate(em: EntityManager): void {
    [...this.#metadataMap.values()].filter(meta => meta.prototype).forEach(meta => EntityHelper.decorate(meta, em));
  }

  /** Returns the map of all registered routine metadata. */
  getAllRoutines(): Map<EntityName, RoutineMetadata> {
    return this.#routinesMap;
  }

  /**
   * Finds metadata for the given routine, returning undefined if not registered. Accepts the
   * routine's class, an `EntitySchema`-like instance, the class name, or the database routine
   * name (since decorator-defined routines are keyed under the class name while the DB-side
   * routine name may differ).
   */
  findRoutine<T = any>(name: EntityName<T> | string): RoutineMetadata<T> | undefined {
    if (!name) {
      return;
    }

    const routine = typeof name === 'string' ? undefined : this.#routinesMap.get(name);

    if (routine) {
      return routine as RoutineMetadata<T>;
    }

    const key = Utils.className(name as EntityName<T>);
    const byClassName = this.#routinesByClassName[key];

    if (byClassName) {
      return byClassName as RoutineMetadata<T>;
    }

    // Fall back to a DB-name lookup so `findRoutine('hash_decor')` works for routines whose
    // class name (`HashDecor`) differs from their declared routine name (`hash_decor`).
    return Object.values(this.#routinesByClassName).find(r => r.routineName === key) as RoutineMetadata<T> | undefined;
  }

  /** Registers metadata for the given routine. */
  setRoutine<T>(name: EntityName<T>, meta: RoutineMetadata): RoutineMetadata {
    this.#routinesMap.set(name, meta);
    this.#routinesByClassName[Utils.className(name)] = meta;
    return meta;
  }

  *[Symbol.iterator](): IterableIterator<EntityMetadata> {
    for (const meta of this.#metadataMap.values()) {
      yield meta;
    }
  }

  /** Returns metadata by its internal numeric id. */
  getById<T>(id: number): EntityMetadata<T> {
    return this.#idMap[id];
  }

  /** Returns metadata by class name, optionally throwing if not found. */
  getByClassName<T = any, V extends boolean = true>(
    className: string,
    validate = true as V,
  ): V extends true ? EntityMetadata<T> : EntityMetadata<T> | undefined {
    return this.validate(this.#classNameMap[className], className, validate);
  }

  /** Returns metadata by unique name, optionally throwing if not found. */
  getByUniqueName<T = any, V extends boolean = true>(
    uniqueName: string,
    validate = true as V,
  ): V extends true ? EntityMetadata<T> : EntityMetadata<T> | undefined {
    return this.validate(this.#uniqueNameMap[uniqueName], uniqueName, validate);
  }

  private validate<T = any, V extends boolean = true>(
    meta: EntityMetadata | undefined,
    id: string,
    validate: boolean,
  ): V extends true ? EntityMetadata<T> : EntityMetadata<T> | undefined {
    if (!meta && validate) {
      throw MetadataError.missingMetadata(id);
    }

    return meta as any;
  }
}
