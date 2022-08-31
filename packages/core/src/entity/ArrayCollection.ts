import { inspect } from 'util';
import type { EntityDTO, EntityProperty, IPrimaryKey, Primary } from '../typings';
import { Reference } from './Reference';
import { helper, wrap } from './wrap';
import { ReferenceType } from '../enums';
import { MetadataError } from '../errors';
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

  toArray(): EntityDTO<T>[] {
    if (this.items.size === 0) {
      return [];
    }

    const meta = this.property.targetMeta!;
    const args = [...meta.toJsonParams.map(() => undefined)];

    return this.getItems().map(item => wrap(item).toJSON(...args));
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
        return wrap(i[field as keyof T], true).getPrimaryKey();
      }

      return i[field as keyof T];
    }) as unknown as U[];
  }

  add(...items: (T | Reference<T>)[]): void {
    for (const item of items) {
      const entity = Reference.unwrapReference(item) as T;

      if (!this.contains(entity, false)) {
        this.incrementCount(1);
        this[this.items.size] = entity;
        this.items.add(entity);
        this.propagate(entity, 'add');
      }
    }
  }

  set(items: (T | Reference<T>)[]): void {
    this.remove(...this.items);
    this.add(...items);
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
    this.add(...items);
  }

  /**
   * Remove specified item(s) from the collection. Note that removing item from collection does necessarily imply deleting the target entity,
   * it means we are disconnecting the relation - removing items from collection, not removing entities from database - `Collection.remove()`
   * is not the same as `em.remove()`. If we want to delete the entity by removing it from collection, we need to enable `orphanRemoval: true`,
   * which tells the ORM we don't want orphaned entities to exist, so we know those should be removed.
   */
  remove(...items: (T | Reference<T>)[]): void {
    for (const item of items) {
      if (!item) {
        continue;
      }

      const entity = Reference.unwrapReference(item) as T;

      if (this.items.delete(entity)) {
        this.incrementCount(-1);
        delete this[this.items.size]; // remove last item
        Object.assign(this, [...this.items]); // reassign array access
        this.propagate(entity, 'remove');
      }
    }
  }

  /**
   * Remove all items from the collection. Note that removing items from collection does necessarily imply deleting the target entity,
   * it means we are disconnecting the relation - removing items from collection, not removing entities from database - `Collection.remove()`
   * is not the same as `em.remove()`. If we want to delete the entity by removing it from collection, we need to enable `orphanRemoval: true`,
   * which tells the ORM we don't want orphaned entities to exist, so we know those should be removed.
   */
  removeAll(): void {
    this.remove(...this.items);
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

  count(): number {
    return this.items.size;
  }

  isInitialized(fully = false): boolean {
    if (fully) {
      return this.initialized && [...this.items].every((item: T) => helper(item).__initialized);
    }

    return this.initialized;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  setDirty(dirty = true): void {
    this.dirty = dirty;
  }

  get length(): number {
    return this.count();
  }

  * [Symbol.iterator](): IterableIterator<T> {
    for (const item of this.items) {
      yield item;
    }
  }

  /**
   * @internal
   */
  get property(): EntityProperty<T> {
    if (!this._property) {
      const meta = helper(this.owner).__meta;

      /* istanbul ignore if */
      if (!meta) {
        throw MetadataError.fromUnknownEntity((this.owner as object).constructor.name, 'Collection.property getter, maybe you just forgot to initialize the ORM?');
      }

      const field = Object.keys(meta.properties).find(k => this.owner[k] === this);
      this._property = meta.properties[field!];
    }

    return this._property!;
  }

  protected propagate(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    if (this.property.owner && this.property.inversedBy) {
      this.propagateToInverseSide(item, method);
    } else if (!this.property.owner && this.property.mappedBy) {
      this.propagateToOwningSide(item, method);
    }
  }

  protected propagateToInverseSide(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    const collection = item[this.property.inversedBy as keyof T] as unknown as ArrayCollection<O, T>;

    if (this.shouldPropagateToCollection(collection, method)) {
      collection[method](this.owner);
    }
  }

  protected propagateToOwningSide(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    const collection = item[this.property.mappedBy as keyof T] as unknown as ArrayCollection<O, T>;

    if (this.property.reference === ReferenceType.MANY_TO_MANY) {
      if (this.shouldPropagateToCollection(collection, method)) {
        collection[method](this.owner);
      }
    } else if (this.property.reference === ReferenceType.ONE_TO_MANY && method !== 'takeSnapshot' && !(this.property.orphanRemoval && method === 'remove')) {
      const prop2 = this.property.targetMeta!.properties[this.property.mappedBy];
      const owner = prop2.mapToPk ? helper(this.owner).getPrimaryKey() : this.owner;
      const value = method === 'add' ? owner : null;

      // skip if already propagated
      if (Reference.unwrapReference(item[this.property.mappedBy]) !== value) {
        item[this.property.mappedBy] = value;
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
    if (typeof this._count === 'number') {
      this._count += value;
    }
  }

  [inspect.custom](depth: number) {
    const object = { ...this };
    const hidden = ['items', 'owner', '_property', '_count', 'snapshot', '_populated', '_lazyInitialized'];
    hidden.forEach(k => delete object[k]);
    const ret = inspect(object, { depth });
    const name = `${this.constructor.name}<${this.property.type}>`;

    return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
  }

}

Object.defineProperties(ArrayCollection.prototype, {
  __collection: { value: true, enumerable: false, writable: false },
});

export interface ArrayCollection<T, O> {
  [k: number]: T;
}
