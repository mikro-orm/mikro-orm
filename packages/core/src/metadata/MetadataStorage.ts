import { type Dictionary, type EntityCtor, EntityMetadata, type EntityName } from '../typings.js';
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
  static readonly META_SYMBOL = Symbol.for('@mikro-orm/core/MetadataStorage.META_SYMBOL');

  static readonly #metadata: Dictionary<EntityMetadata> = getGlobalStorage('metadata');
  readonly #metadataMap = new Map<EntityName, EntityMetadata>();
  readonly #idMap: Record<number, EntityMetadata>;
  readonly #classNameMap: Record<string, EntityMetadata>;
  readonly #uniqueNameMap: Record<string, EntityMetadata>;
  readonly #ambiguousNames = new Set<string>();

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

  /** Returns the global metadata dictionary, or a specific entry by entity name and path (keyed by the class reference when `target` is provided). */
  static getMetadata(): Dictionary<EntityMetadata>;
  static getMetadata<T = any>(entity: string, path: string, target?: EntityCtor): EntityMetadata<T>;
  static getMetadata<T = any>(
    entity?: string,
    path?: string,
    target?: EntityCtor & { [MetadataStorage.META_SYMBOL]?: EntityMetadata },
  ): Dictionary<EntityMetadata> | EntityMetadata<T> {
    const key = entity && path ? entity + '-' + Utils.hash(path) : null;

    // Key the registry by the class reference when available, so two classes minified
    // to the same mangled name don't collide on the `className-path` key.
    if (key && target) {
      if (!Object.hasOwn(target, MetadataStorage.META_SYMBOL)) {
        Object.defineProperty(target, MetadataStorage.META_SYMBOL, {
          value: new EntityMetadata({ className: entity, path }),
          writable: true,
        });
      }

      // Keep the name-keyed entry in sync, the class-keyed metadata survives `MetadataStorage.clear()`.
      MetadataStorage.#metadata[key] = target[MetadataStorage.META_SYMBOL]!;

      return target[MetadataStorage.META_SYMBOL]!;
    }

    if (key && !MetadataStorage.#metadata[key]) {
      MetadataStorage.#metadata[key] = new EntityMetadata({ className: entity, path });
    }

    if (key) {
      return MetadataStorage.#metadata[key];
    }

    return MetadataStorage.#metadata;
  }

  /** Checks whether an entity with the given class name exists in the global metadata. */
  static isKnownEntity(name: string): boolean {
    return !!Object.values(this.#metadata).find(meta => meta.className === name);
  }

  /** Clears all entries from the global metadata registry. */
  static clear(): void {
    Object.keys(this.#metadata).forEach(k => delete this.#metadata[k]);
  }

  /** Returns the map of all registered entity metadata. */
  getAll(): Map<EntityName, EntityMetadata> {
    return this.#metadataMap;
  }

  /** Returns metadata for the given entity, optionally initializing it if not found. */
  get<T = any>(entityName: EntityName<T>, init = false): EntityMetadata<T> {
    // string lookups cannot be resolved when several classes were minified to the same name
    if (typeof entityName === 'string' && this.#ambiguousNames.has(entityName)) {
      throw MetadataError.ambiguousEntityName(entityName);
    }

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
    const className = Utils.className(entityName);
    const existing = this.#classNameMap[className];

    // track name collisions caused by minifiers mangling two classes to the same name
    if (existing && existing !== meta && existing.class !== meta.class) {
      this.#ambiguousNames.add(className);
    }

    this.#classNameMap[className] = meta;

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

      // the name may still be ambiguous among the remaining metas
      const remaining = new Set(
        [...this.#metadataMap.values()].filter(m => m.className === meta.className).map(m => m.class),
      );

      if (remaining.size <= 1) {
        this.#ambiguousNames.delete(meta.className);
      }
    }
  }

  /** Decorates all entity prototypes with helper methods (e.g. init, toJSON). */
  decorate(em: EntityManager): void {
    [...this.#metadataMap.values()].filter(meta => meta.prototype).forEach(meta => EntityHelper.decorate(meta, em));
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
