import { inspect } from 'util';
import type { EntityDTO, EntityProperty, IPrimaryKey, Primary } from '../typings';
import { Reference } from './Reference';
import { helper, wrap } from './wrap';
import { ReferenceType } from '../enums';
import { MetadataError, ValidationError } from '../errors';
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

  add(entity: T | Reference<T> | (T | Reference<T>)[], ...entities: (T | Reference<T>)[]): void {
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

  set(items: (T | Reference<T>)[]): void {
    if (this.compare(items.map(item => Reference.unwrapReference(item)))) {
      return;
    }

    this.removeAll();
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
  remove(entity: T | Reference<T> | (T | Reference<T>)[], ...entities: (T | Reference<T>)[]): void {
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
   * Extracts a slice of elements starting at position start to end (exclusive) of the Collection.
   * If end is null it returns all elements from $start to the end of the Collection.
   */
  slice(start = 0, end?: number): T[] {
    let index = 0;
    end ??= this.items.size;
    const items = new Set<T>();

    for (const item of this.items) {

    if (counter === end) { break; } // break the loop if we reach the end of the slice

    if (counter >= start &&  counter < end) {
      items.add(item);
    }

    counter++;
  }

  return [...items];

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
    for (const item of this.items) {
      yield item;
    }
  }

  /**
   * @internal
   */
  get property(): EntityProperty<O> {
    if (!this._property) {
      const meta = helper(this.owner).__meta;

      /* istanbul ignore if */
      if (!meta) {
        throw MetadataError.fromUnknownEntity((this.owner as object).constructor.name, 'Collection.property getter, maybe you just forgot to initialize the ORM?');
      }

      this._property = meta.relations.find(prop => this.owner[prop.name] === this)!;
    }

    return this._property;
  }

  /**
   * @internal
   */
  set property(prop: EntityProperty<O>) {
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
    } else if (this.property.reference === ReferenceType.ONE_TO_MANY && method !== 'takeSnapshot') {
      const prop2 = this.property.targetMeta!.properties[this.property.mappedBy];
      const owner = prop2.mapToPk ? helper(this.owner).getPrimaryKey() : this.owner;
      const value = method === 'add' ? owner : null;

      if (this.property.orphanRemoval && method === 'remove') {
        // cache the PK before we propagate, as its value might be needed when flushing
        helper(item).__pk = helper(item).getPrimaryKey()!;
      }

      if (!prop2.nullable && prop2.onDelete !== 'cascade' && method === 'remove') {
        if (!this.property.orphanRemoval) {
          throw ValidationError.cannotRemoveFromCollectionWithoutOrphanRemoval(this.owner, this.property);
        }

        return;
      }

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
