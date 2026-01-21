import type { AnyEntity, EntityCtor, EntityMetadata } from '../typings.js';

export class IdentityMap {

  constructor(private readonly defaultSchema?: string) {}

  private readonly registry = new Map<EntityCtor, Map<string, AnyEntity>>();
  /** Tracks alternate key hashes for each entity so we can clean them up on delete */
  private readonly alternateKeys = new WeakMap<AnyEntity, Set<string>>();

  store<T>(item: T) {
    this.getStore((item as AnyEntity).__meta!.root).set(this.getPkHash(item), item);
  }

  /**
   * Stores an entity under an alternate key (non-PK property).
   * This allows looking up entities by unique properties that are not the primary key.
   */
  storeByKey<T>(item: T, key: string, value: string, schema?: string) {
    const hash = this.getKeyHash(key, value, schema);
    this.getStore((item as AnyEntity).__meta!.root).set(hash, item);
    // Track this alternate key so we can clean it up when the entity is deleted
    let keys = this.alternateKeys.get(item as AnyEntity);

    if (!keys) {
      keys = new Set();
      this.alternateKeys.set(item as AnyEntity, keys);
    }

    keys.add(hash);
  }

  delete<T>(item: T) {
    const meta = (item as AnyEntity).__meta!.root;
    const store = this.getStore(meta);
    store.delete(this.getPkHash(item));

    // Also delete any alternate key entries for this entity
    const altKeys = this.alternateKeys.get(item as AnyEntity);

    if (altKeys) {
      for (const hash of altKeys) {
        store.delete(hash);
      }

      this.alternateKeys.delete(item as AnyEntity);
    }
  }

  getByHash<T>(meta: EntityMetadata<T>, hash: string): T | undefined {
    const store = this.getStore(meta);
    return store.has(hash) ? store.get(hash) : undefined;
  }

  getStore<T>(meta: EntityMetadata<T>): Map<string, T> {
    const store = this.registry.get(meta.class) as Map<string, T>;

    if (store) {
      return store;
    }

    const newStore = new Map();
    this.registry.set(meta.class, newStore);

    return newStore;
  }

  clear() {
    this.registry.clear();
  }

  values(): AnyEntity[] {
    const ret: AnyEntity[] = [];

    for (const store of this.registry.values()) {
      ret.push(...store.values());
    }

    return ret;
  }

  * [Symbol.iterator](): IterableIterator<AnyEntity> {
    for (const store of this.registry.values()) {
      for (const item of store.values()) {
        yield item;
      }
    }
  }

  keys(): string[] {
    const ret: string[] = [];

    for (const [cls, store] of this.registry) {
      ret.push(...[...store.keys()].map(hash => `${cls.name}-${hash}`));
    }

    return ret;
  }

  /**
   * For back compatibility only.
   */
  get<T>(hash: string): T | undefined {
    const [name, id] = hash.split('-', 2);
    const cls = [...this.registry.keys()].find(k => k.name === name);

    if (!cls) {
      return undefined;
    }

    const store = this.registry.get(cls) as Map<string, T>;
    return store.has(id) ? store.get(id) : undefined;
  }

  private getPkHash<T>(item: T): string {
    const wrapped = (item as AnyEntity).__helper;
    const meta = wrapped.__meta as EntityMetadata<T>;
    const hash = wrapped.getSerializedPrimaryKey();
    const schema = wrapped.__schema ?? meta.root.schema ?? this.defaultSchema;

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
