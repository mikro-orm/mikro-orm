import type { AnyEntity, Constructor, EntityMetadata } from '../typings';

export class IdentityMap {

  private readonly registry = new Map<Constructor<AnyEntity>, Map<string, AnyEntity>>();

  store<T extends AnyEntity<T>>(item: T) {
    this.getStore(item.__meta!.root).set(item.__helper!.getSerializedPrimaryKey(), item);
  }

  delete<T extends AnyEntity<T>>(item: T) {
    this.getStore(item.__meta!.root).delete(item.__helper!.getSerializedPrimaryKey());
  }

  getByHash<T>(meta: EntityMetadata<T>, hash: string): T | undefined {
    const store = this.getStore(meta);
    return store.has(hash) ? store.get(hash) : undefined;
  }

  getStore<T extends AnyEntity<T>>(meta: EntityMetadata<T>): Map<string, T> {
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

}
