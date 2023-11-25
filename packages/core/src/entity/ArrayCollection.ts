import { inspect } from 'util';
import type { Dictionary, EntityDTO, EntityKey, EntityProperty, EntityValue, IPrimaryKey, Primary } from '../typings';
import { Reference } from './Reference';
import { helper, wrap } from './wrap';
import { MetadataError, ValidationError } from '../errors';
import { ReferenceKind } from '../enums';
import { Utils } from '../utils/Utils';

export class ArrayCollection<T extends object, O extends object> {

  protected readonly items = new Set<T>();
  protected initialized = true;
  protected dirty = false;
  protected _count?: number;
  private _property?: EntityProperty;

  constructor(readonly owner: O, items?: T[]) {
    /* istanbul ignore next */
    if (items) {
      let i = 0;
      this.items = new Set(items);
      this.items.forEach(item => this[i++] = item);
    }
  }

  async loadCount(): Promise<number> {
    return this.items.size;
  }

  getItems(): T[] {
    return [...this.items];
  }

  toArray<TT extends T>(): EntityDTO<TT>[] {
    if (this.items.size === 0) {
      return [];
    }

    const meta = this.property.targetMeta!;
    const args = [...meta.toJsonParams.map(() => undefined)];

    return this.map(item => wrap(item as TT).toJSON(...args));
  }

  toJSON(): EntityDTO<T>[] {
    return this.toArray();
  }

  getIdentifiers<U extends IPrimaryKey = Primary<T> & IPrimaryKey>(field?: string): U[] {
    const items = this.getItems();

    if (items.length === 0) {
      return [];
    }

    field ??= this.property.targetMeta!.serializedPrimaryKey;

    return items.map(i => {
      if (Utils.isEntity(i[field as keyof T], true)) {
        return wrap(i[field as keyof T]!, true).getPrimaryKey();
      }

      return i[field as keyof T];
    }) as unknown as U[];
  }

  add(entity: T | Reference<T> | Iterable<T | Reference<T>>, ...entities: (T | Reference<T>)[]): void {
    entities = Utils.asArray(entity).concat(entities);

    for (const item of entities) {
      const entity = Reference.unwrapReference(item) as T;

      if (!this.contains(entity, false)) {
        this.incrementCount(1);
        this[this.items.size] = entity;
        this.items.add(entity);
        this.propagate(entity, 'add');
      }
    }
  }

  set(items: Iterable<T | Reference<T>>): void {
    if (this.compare(Utils.asArray(items).map(item => Reference.unwrapReference(item)))) {
      return;
    }

    this.remove(this.items);
    this.add(items);
  }

  private compare(items: T[]): boolean {
    if (items.length !== this.items.size) {
      return false;
    }

    let idx = 0;

    for (const item of this.items) {
      if (item !== items[idx++]) {
        return false;
      }
    }

    return true;
  }

  /**
   * @internal
   */
  hydrate(items: T[]): void {
    for (let i = 0; i < this.items.size; i++) {
      delete this[i];
    }

    this.items.clear();
    this._count = 0;
    this.add(items);
  }

  /**
   * Remove specified item(s) from the collection. Note that removing item from collection does not necessarily imply deleting the target entity,
   * it means we are disconnecting the relation - removing items from collection, not removing entities from database - `Collection.remove()`
   * is not the same as `em.remove()`. If we want to delete the entity by removing it from collection, we need to enable `orphanRemoval: true`,
   * which tells the ORM we don't want orphaned entities to exist, so we know those should be removed.
   */
  remove(entity: T | Reference<T> | Iterable<T | Reference<T>>, ...entities: (T | Reference<T>)[]): void {
    entities = Utils.asArray(entity).concat(entities);
    let modified = false;

    for (const item of entities) {
      if (!item) {
        continue;
      }

      const entity = Reference.unwrapReference(item) as T;

      if (this.items.delete(entity)) {
        this.incrementCount(-1);
        delete this[this.items.size]; // remove last item
        this.propagate(entity, 'remove');
        modified = true;
      }
    }

    if (modified) {
      Object.assign(this, [...this.items]); // reassign array access
    }
  }

  /**
   * Remove all items from the collection. Note that removing items from collection does necessarily imply deleting the target entity,
   * it means we are disconnecting the relation - removing items from collection, not removing entities from database - `Collection.remove()`
   * is not the same as `em.remove()`. If we want to delete the entity by removing it from collection, we need to enable `orphanRemoval: true`,
   * which tells the ORM we don't want orphaned entities to exist, so we know those should be removed.
   */
  removeAll(): void {
    for (const item of this.items) {
      this.remove(item);
    }
  }

  /**
   * @internal
   */
  removeWithoutPropagation(entity: T): void {
    if (!this.items.delete(entity)) {
      return;
    }

    this.incrementCount(-1);
    delete this[this.items.size];
    Object.assign(this, [...this.items]);
  }

  contains(item: T | Reference<T>, check?: boolean): boolean {
    const entity = Reference.unwrapReference(item) as T;
    return this.items.has(entity);
  }

  /**
   * Extracts a slice of the collection items starting at position start to end (exclusive) of the collection.
   * If end is null it returns all elements from start to the end of the collection.
   */
  slice(start = 0, end?: number): T[] {
    let index = 0;
    end ??= this.items.size;
    const items: T[] = [];

    for (const item of this.items) {
      if (index === end) {
        break;
      }

      if (index >= start && index < end) {
        items.push(item);
      }

      index++;
    }

    return items;
  }

  /**
   * Tests for the existence of an element that satisfies the given predicate.
   */
  exists(cb: (item: T) => boolean): boolean {
    for (const item of this.items) {
      if (cb(item)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns the first element of this collection that satisfies the predicate.
   */
  find(cb: (item: T, index: number) => boolean): T | undefined {
    let index = 0;

    for (const item of this.items) {
      if (cb(item, index++)) {
        return item;
      }
    }

    return undefined;
  }

  /**
   * Extracts a subset of the collection items.
   */
  filter(cb: (item: T, index: number) => boolean): T[] {
    const items: T[] = [];
    let index = 0;

    for (const item of this.items) {
      if (cb(item, index++)) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Maps the collection items based on your provided mapper function.
   */
  map<R>(mapper: (item: T, index: number) => R): R[] {
    const items: R[] = [];
    let index = 0;

    for (const item of this.items) {
      items.push(mapper(item, index++));
    }

    return items;
  }

  /**
   * Maps the collection items based on your provided mapper function to a single object.
   */
  reduce<R>(cb: (obj: R, item: T, index: number) => R, initial = {} as R): R {
    let index = 0;

    for (const item of this.items) {
      initial = cb(initial, item, index++);
    }

    return initial;
  }

  /**
   * Maps the collection items to a dictionary, indexed by the key you specify.
   * If there are more items with the same key, only the first one will be present.
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1): Record<T[K1] & PropertyKey, T>;

  /**
   * Maps the collection items to a dictionary, indexed by the key you specify.
   * If there are more items with the same key, only the first one will be present.
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1, valueKey: K2): Record<T[K1] & PropertyKey, T[K2]>;

  /**
   * Maps the collection items to a dictionary, indexed by the key you specify.
   * If there are more items with the same key, only the first one will be present.
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1, valueKey?: K2): Record<T[K1] & PropertyKey, T> | Record<T[K1] & PropertyKey, T[K2]> {
    return this.reduce((obj, item) => {
      obj[item[key] as string] ??= valueKey ? item[valueKey] : item;
      return obj;
    }, {} as any);
  }

  count(): number {
    return this.items.size;
  }

  isInitialized(fully = false): boolean {
    if (!this.initialized || !fully) {
      return this.initialized;
    }

    for (const item of this.items) {
      if (!helper(item).__initialized) {
        return false;
      }
    }

    return true;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  isEmpty(): boolean {
    return this.count() === 0;
  }

  setDirty(dirty = true): void {
    this.dirty = dirty;
  }

  get length(): number {
    return this.count();
  }

  * [Symbol.iterator](): IterableIterator<T> {
    for (const item of this.getItems()) {
      yield item;
    }
  }

  /**
   * @internal
   */
  get property(): EntityProperty { // cannot be typed to `EntityProperty<O, T>` as it causes issues in assignability of `Loaded` type
    if (!this._property) {
      const meta = helper(this.owner).__meta;

      /* istanbul ignore if */
      if (!meta) {
        throw MetadataError.fromUnknownEntity(this.owner.constructor.name, 'Collection.property getter, maybe you just forgot to initialize the ORM?');
      }

      this._property = meta.relations.find(prop => this.owner[prop.name] === this)!;
    }

    return this._property;
  }

  /**
   * @internal
   */
  set property(prop: EntityProperty) { // cannot be typed to `EntityProperty<O, T>` as it causes issues in assignability of `Loaded` type
    this._property = prop;
  }

  protected propagate(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    if (this.property.owner && this.property.inversedBy) {
      this.propagateToInverseSide(item, method);
    } else if (!this.property.owner && this.property.mappedBy) {
      this.propagateToOwningSide(item, method);
    }
  }

  protected propagateToInverseSide(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    const collection = item[this.property.inversedBy as keyof T] as ArrayCollection<O, T>;

    if (this.shouldPropagateToCollection(collection, method)) {
      collection[method as 'add'](this.owner);
    }
  }

  protected propagateToOwningSide(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    const mappedBy = this.property.mappedBy as EntityKey<T>;
    const collection = item[mappedBy] as ArrayCollection<O, T>;

    if (this.property.kind === ReferenceKind.MANY_TO_MANY) {
      if (this.shouldPropagateToCollection(collection, method)) {
        collection[method as 'add'](this.owner);
      }
    } else if (this.property.kind === ReferenceKind.ONE_TO_MANY && method !== 'takeSnapshot') {
      const prop2 = this.property.targetMeta!.properties[mappedBy];
      const owner = prop2.mapToPk ? helper(this.owner).getPrimaryKey() : this.owner;
      const value = method === 'add' ? owner : null;

      if (this.property.orphanRemoval && method === 'remove') {
        // cache the PK before we propagate, as its value might be needed when flushing
        helper(item).__pk = helper(item).getPrimaryKey()!;
      }

      if (!prop2.nullable && prop2.updateRule !== 'cascade' && method === 'remove') {
        if (!this.property.orphanRemoval) {
          throw ValidationError.cannotRemoveFromCollectionWithoutOrphanRemoval(this.owner, this.property);
        }

        return;
      }

      // skip if already propagated
      if (Reference.unwrapReference(item[mappedBy] as object) !== value) {
        item[mappedBy] = value as EntityValue<T>;
      }
    }
  }

  protected shouldPropagateToCollection(collection: ArrayCollection<O, T>, method: 'add' | 'remove' | 'takeSnapshot'): boolean {
    if (!collection) {
      return false;
    }

    switch (method) {
      case 'add':
        return !collection.contains(this.owner, false);
      case 'remove':
        return collection.isInitialized() && collection.contains(this.owner, false);
      case 'takeSnapshot':
        return collection.isDirty();
    }
  }

  protected incrementCount(value: number) {
    if (typeof this._count === 'number' && this.initialized) {
      this._count += value;
    }
  }

  /** @ignore */
  [inspect.custom](depth: number) {
    const object = { ...this } as Dictionary;
    const hidden = ['items', 'owner', '_property', '_count', 'snapshot', '_populated', '_lazyInitialized', '_em', 'readonly'];
    hidden.forEach(k => delete object[k]);
    const ret = inspect(object, { depth });
    const name = `${this.constructor.name}<${this.property?.type ?? 'unknown'}>`;

    return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
  }

}

Object.defineProperties(ArrayCollection.prototype, {
  __collection: { value: true, enumerable: false, writable: false },
});

export interface ArrayCollection<T, O> {
  [k: number]: T;
}
