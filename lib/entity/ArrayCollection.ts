import { Dictionary, EntityProperty, AnyEntity, IPrimaryKey, Primary } from '../typings';
import { ReferenceType } from './enums';
import { Collection } from './Collection';
import { wrap } from './EntityHelper';

export class ArrayCollection<T extends AnyEntity<T>> {

  [k: number]: T;

  protected readonly items: T[] = [];
  private _property?: EntityProperty;

  constructor(readonly owner: AnyEntity, items?: T[]) {
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
      const meta = wrap(this.owner).__internal.metadata.get(item.constructor.name);
      const args = [...meta.toJsonParams.map(() => undefined), [this.property.name]];

      return wrap(item).toJSON(...args);
    });
  }

  getIdentifiers<U extends IPrimaryKey = Primary<T> & IPrimaryKey>(field?: string): U[] {
    const items = this.getItems();

    if (items.length === 0) {
      return [];
    }

    field = field || wrap(this.items[0]).__meta.serializedPrimaryKey;

    return this.getItems().map(i => i[field as keyof T]) as unknown as U[];
  }

  add(...items: T[]): void {
    for (const item of items) {
      if (!this.contains(item)) {
        this.items.push(item);
        this.propagate(item, 'add');
      }
    }

    Object.assign(this, this.items);
  }

  set(items: T[]): void {
    this.removeAll();
    this.add(...items);
  }

  hydrate(items: T[]): void {
    this.items.length = 0;
    this.items.push(...items);
    Object.assign(this, this.items);
  }

  remove(...items: T[]): void {
    for (const item of items) {
      const idx = this.items.findIndex(i => wrap(i).__serializedPrimaryKey === wrap(item).__serializedPrimaryKey);

      if (idx !== -1) {
        delete this[this.items.length - 1]; // remove last item
        this.items.splice(idx, 1);
        Object.assign(this, this.items); // reassign array access
      }

      this.propagate(item, 'remove');
    }
  }

  removeAll(): void {
    this.remove(...this.items);
  }

  contains(item: T): boolean {
    return !!this.items.find(i => {
      const objectIdentity = i === item;
      const primaryKeyIdentity = !!wrap(i).__primaryKey && !!wrap(item).__primaryKey && wrap(i).__serializedPrimaryKey === wrap(item).__serializedPrimaryKey;

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
  get property() {
    if (!this._property) {
      const meta = wrap(this.owner).__meta;
      const field = Object.keys(meta.properties).find(k => this.owner[k] === this);
      this._property = meta.properties[field!];
    }

    return this._property;
  }

  protected propagate(item: T, method: 'add' | 'remove'): void {
    if (this.property.owner && this.property.inversedBy) {
      this.propagateToInverseSide(item, method);
    } else if (!this.property.owner && this.property.mappedBy) {
      this.propagateToOwningSide(item, method);
    }
  }

  protected propagateToInverseSide(item: T, method: 'add' | 'remove'): void {
    const collection = item[this.property.inversedBy as keyof T] as unknown as Collection<T>;

    if (this.shouldPropagateToCollection(collection, method)) {
      collection[method](this.owner as T);
    }
  }

  protected propagateToOwningSide(item: T, method: 'add' | 'remove'): void {
    const collection = item[this.property.mappedBy as keyof T] as unknown as Collection<T>;

    if (this.property.reference === ReferenceType.MANY_TO_MANY && this.shouldPropagateToCollection(collection, method)) {
      collection[method](this.owner as T);
    } else if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      const value = method === 'add' ? this.owner : null;
      item[this.property.mappedBy as keyof T] = value as T[keyof T];
    }
  }

  protected shouldPropagateToCollection(collection: Collection<T>, method: 'add' | 'remove'): boolean {
    if (!collection || !collection.isInitialized()) {
      return false;
    }

    if (method === 'add') {
      return !collection.contains(this.owner as T);
    }

    // remove
    return collection.contains(this.owner as T);
  }

}
