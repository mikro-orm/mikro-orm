import type { AnyEntity, Constructor, EntityMetadata } from '../typings';

export class IdentityMap {

  private readonly registry = new Map<Constructor<AnyEntity>, Map<string, AnyEntity>>();

  store<T>(item: T) {
    this.getStore((item as AnyEntity).__meta!.root).set(this.getPkHash(item), item);
  }

  delete<T>(item: T) {
    this.getStore((item as AnyEntity).__meta!.root).delete(this.getPkHash(item));
  }

  getByHash<T>(meta: EntityMetadata<T>, hash: string): T | undefined {
    const store = this.getStore(meta);
    return store.has(hash) ? store.get(hash) : undefined;
  }

  getStore<T>(meta: EntityMetadata<T>): Map<string, T> {
    const store = this.registry.get(meta.class as Constructor<AnyEntity>) as Map<string, T>;

    if (store) {
      return store;
    }

    const newStore = new Map();
    this.registry.set(meta.class as Constructor<AnyEntity>, newStore);

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
    const pkHash = (item as AnyEntity).__helper!.getSerializedPrimaryKey();
    const schema = (item as AnyEntity).__helper!.__schema || (item as AnyEntity).__meta!.root.schema;

    if (schema) {
      return schema + ':' + pkHash;
    }

    return pkHash;
  }

}
