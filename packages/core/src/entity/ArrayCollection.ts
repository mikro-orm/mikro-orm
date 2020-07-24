import { AnyEntity, Dictionary, EntityProperty, IPrimaryKey, Primary } from '../typings';
import { ReferenceType } from './enums';
import { Collection } from './Collection';
import { Reference } from './Reference';
import { wrap } from './wrap';

export class ArrayCollection<T extends AnyEntity<T>, O extends AnyEntity<O>> {

  [k: number]: T;

  protected readonly items: T[] = [];
  private _property?: EntityProperty;

  constructor(readonly owner: O, items?: T[]) {
    if (items) {
      this.items = items;
      Object.assign(this, items);
    }

    Object.defineProperty(this, 'items', { enumerable: false });
    Object.defineProperty(this, 'owner', { enumerable: false, writable: true });
    Object.defineProperty(this, '_property', { enumerable: false, writable: true });
  }

  getItems(): T[] {
    return [...this.items];
  }

  toArray(): Dictionary[] {
    return this.getItems().map(item => {
      const meta = wrap(item, true).__meta;
      const args = [...meta.toJsonParams.map(() => undefined), [this.property.name]];

      return wrap(item).toJSON(...args);
    });
  }

  getIdentifiers<U extends IPrimaryKey = Primary<T> & IPrimaryKey>(field?: string): U[] {
    const items = this.getItems();

    if (items.length === 0) {
      return [];
    }

    field = field || wrap(this.items[0], true).__meta.serializedPrimaryKey;

    return this.getItems().map(i => i[field as keyof T]) as unknown as U[];
  }

  add(...items: (T | Reference<T>)[]): void {
    for (const item of items) {
      const entity = Reference.unwrapReference(item);

      if (!this.contains(entity, false)) {
        this.items.push(entity);
        this.propagate(entity, 'add');
      }
    }

    Object.assign(this, this.items);
  }

  set(items: (T | Reference<T>)[]): void {
    this.removeAll();
    this.add(...items);
  }

  /**
   * @internal
   */
  hydrate(items: T[]): void {
    this.items.length = 0;
    this.add(...items);
  }

  remove(...items: (T | Reference<T>)[]): void {
    for (const item of items) {
      const entity = Reference.unwrapReference(item);
      const idx = this.items.findIndex(i => wrap(i, true).__serializedPrimaryKey === wrap(entity, true).__serializedPrimaryKey);

      if (idx !== -1) {
        delete this[this.items.length - 1]; // remove last item
        this.items.splice(idx, 1);
        Object.assign(this, this.items); // reassign array access
      }

      this.propagate(entity, 'remove');
    }
  }

  removeAll(): void {
    this.remove(...this.items);
  }

  contains(item: T | Reference<T>, check?: boolean): boolean {
    const entity = Reference.unwrapReference(item);

    return !!this.items.find(i => {
      const objectIdentity = i === entity;
      const primaryKeyIdentity = !!wrap(i, true).__primaryKey && !!wrap(entity, true).__primaryKey && wrap(i, true).__serializedPrimaryKey === wrap(entity, true).__serializedPrimaryKey;

      return objectIdentity || primaryKeyIdentity;
    });
  }

  count(): number {
    return this.items.length;
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
  get property(): EntityProperty {
    if (!this._property) {
      const meta = wrap(this.owner, true).__meta;
      const field = Object.keys(meta.properties).find(k => this.owner[k] === this);
      this._property = meta.properties[field!];
    }

    return this._property!;
  }

  protected propagate(item: T, method: 'add' | 'remove'): void {
    if (this.property.owner && this.property.inversedBy) {
      this.propagateToInverseSide(item, method);
    } else if (!this.property.owner && this.property.mappedBy) {
      this.propagateToOwningSide(item, method);
    }
  }

  protected propagateToInverseSide(item: T, method: 'add' | 'remove'): void {
    const collection = item[this.property.inversedBy as keyof T] as unknown as Collection<O, T>;

    if (this.shouldPropagateToCollection(collection, method)) {
      collection[method](this.owner);
    }
  }

  protected propagateToOwningSide(item: T, method: 'add' | 'remove'): void {
    const collection = item[this.property.mappedBy as keyof T] as unknown as Collection<O, T>;

    if (this.property.reference === ReferenceType.MANY_TO_MANY && this.shouldPropagateToCollection(collection, method)) {
      collection[method](this.owner);
    } else if (this.property.reference === ReferenceType.ONE_TO_MANY && !(this.property.orphanRemoval && method === 'remove')) {
      item[this.property.mappedBy] = method === 'add' ? this.owner : null;
    }
  }

  protected shouldPropagateToCollection(collection: Collection<O, T>, method: 'add' | 'remove'): boolean {
    if (!collection || !collection.isInitialized()) {
      return false;
    }

    if (method === 'add') {
      return !collection.contains(this.owner, false);
    }

    // remove
    return collection.contains(this.owner, false);
  }

}
