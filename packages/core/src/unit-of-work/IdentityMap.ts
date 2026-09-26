import type { AnyEntity, Dictionary, EntityCtor, EntityMetadata } from '../typings.js';

/** @internal Stores managed entity instances keyed by their primary key hash (and `targetKey` values), ensuring each row is loaded once. */
export class IdentityMap {
  readonly #defaultSchema?: string;
  readonly #registry = new Map<EntityCtor, Map<string, AnyEntity>>();
  /** Tracks alternate key hashes for each entity so we can clean them up on delete */
  readonly #alternateKeys = new WeakMap<AnyEntity, Set<string>>();
  readonly #storesWithAlternateKeys = new WeakSet<Map<string, unknown>>();

  constructor(defaultSchema?: string) {
    this.#defaultSchema = defaultSchema;
  }

  /** Stores an entity in the identity map under its primary key hash and the `targetKey` values referencing it. */
  store<T>(item: T) {
    const meta = (item as AnyEntity).__meta!.root;
    const wrapped = (item as AnyEntity).__helper;

    // PK-less references (known only by a `targetKey`) would share one slot that outlives their later removal
    if (!meta.targetKeys || wrapped.hasPrimaryKey()) {
      this.getStore(meta).set(this.getPkHash(item), item);
    }

    // references resolved via `targetKey` look the entity up by that key instead of the PK
    for (const key of meta.targetKeys ?? []) {
      const value = (item as Dictionary)[key];

      if (value != null) {
        const schema = wrapped.__schema ?? meta.schema ?? this.#defaultSchema;
        this.storeByKey(item, key, '' + value, schema);
      }
    }
  }

  /**
   * Stores an entity under an alternate key (non-PK property).
   * This allows looking up entities by unique properties that are not the primary key.
   */
  storeByKey<T>(item: T, key: string, value: string, schema?: string) {
    const hash = this.getKeyHash(key, value, schema);
    const store = this.getStore((item as AnyEntity).__meta!.root);
    store.set(hash, item);
    this.#storesWithAlternateKeys.add(store);
    // Track this alternate key so we can clean it up when the entity is deleted
    let keys = this.#alternateKeys.get(item as AnyEntity);

    if (!keys) {
      keys = new Set();
      this.#alternateKeys.set(item as AnyEntity, keys);
    }

    keys.add(hash);
  }

  /** Removes an entity and its alternate key entries from the identity map. */
  delete<T>(item: T) {
    const meta = (item as AnyEntity).__meta!.root;
    const store = this.getStore(meta);
    store.delete(this.getPkHash(item));

    // Also delete any alternate key entries for this entity
    const altKeys = this.#alternateKeys.get(item as AnyEntity);

    if (altKeys) {
      for (const hash of altKeys) {
        // the hash might be owned by another entity by now, e.g. after swapping unique values
        if (store.get(hash) === item) {
          store.delete(hash);
        }
      }

      this.#alternateKeys.delete(item as AnyEntity);
    }
  }

  /**
   * Retrieves the entity occupying the same slot as the given one, if any. Hashes the entity the same way `store()`
   * does, so it matches regardless of the primary key shape — unlike hashing a primary key value obtained elsewhere.
   */
  getByEntity<T>(item: T): T | undefined {
    return this.getStore((item as AnyEntity).__meta!.root).get(this.getPkHash(item)) as T | undefined;
  }

  /** Retrieves an entity by its hash key from the identity map. */
  getByHash<T>(meta: EntityMetadata<T>, hash: string): T | undefined {
    const store = this.getStore(meta);
    return store.has(hash) ? store.get(hash) : undefined;
  }

  /** Returns (or creates) the per-entity-class store within the identity map. */
  getStore<T>(meta: EntityMetadata<T>): Map<string, T> {
    const store = this.#registry.get(meta.class) as Map<string, T>;

    if (store) {
      return store;
    }

    const newStore = new Map();
    this.#registry.set(meta.class, newStore);

    return newStore;
  }

  clear() {
    this.#registry.clear();
  }

  /** Returns all entities currently in the identity map. */
  values(): AnyEntity[] {
    const ret: AnyEntity[] = [];

    for (const store of this.#registry.values()) {
      for (const item of this.getEntities(store)) {
        ret.push(item);
      }
    }

    return ret;
  }

  *[Symbol.iterator](): IterableIterator<AnyEntity> {
    for (const store of this.#registry.values()) {
      for (const item of this.getEntities(store)) {
        yield item;
      }
    }
  }

  private getEntities(store: Map<string, AnyEntity>): Iterable<AnyEntity> {
    // an entity indexed by alternate keys occupies several slots of its store
    return this.#storesWithAlternateKeys.has(store) ? new Set(store.values()) : store.values();
  }

  /** Returns all hash keys currently in the identity map. */
  keys(): string[] {
    const ret: string[] = [];

    for (const [cls, store] of this.#registry) {
      for (const hash of store.keys()) {
        ret.push(`${cls.name}-${hash}`);
      }
    }

    return ret;
  }

  /**
   * For back compatibility only.
   */
  get<T>(hash: string): T | undefined {
    const [name, id] = hash.split('-', 2);
    const cls = [...this.#registry.keys()].find(k => k.name === name);

    if (!cls) {
      return undefined;
    }

    const store = this.#registry.get(cls) as Map<string, T>;
    return store.has(id) ? store.get(id) : undefined;
  }

  private getPkHash<T>(item: T): string {
    const wrapped = (item as AnyEntity).__helper;
    const meta = wrapped.__meta as EntityMetadata<T>;
    const hash = wrapped.getSerializedPrimaryKey();
    const schema = wrapped.__schema ?? meta.root.schema ?? this.#defaultSchema;

    if (schema) {
      return schema + ':' + hash;
    }

    return hash;
  }

  /**
   * Creates a hash for an alternate key lookup.
   * Format: `[key]value` or `schema:[key]value`
   */
  getKeyHash(key: string, value: string, schema?: string): string {
    const hash = `[${key}]${value}`;

    if (schema) {
      return schema + ':' + hash;
    }

    return hash;
  }
}
