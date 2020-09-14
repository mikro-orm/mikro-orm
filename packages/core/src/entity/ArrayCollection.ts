import { AnyEntity, Dictionary, EntityProperty, IPrimaryKey, Primary } from '../typings';
import { Reference } from './Reference';
import { wrap } from './wrap';
import { ReferenceType } from '../enums';

export class ArrayCollection<T, O> {

  [k: number]: T;

  protected readonly items: T[] = [];
  protected initialized = true;
  private _property?: EntityProperty;

  constructor(readonly owner: O & AnyEntity<O>, items?: T[]) {
    if (items) {
      this.items = items;
      Object.assign(this, items);
    }

    Object.defineProperty(this, 'items', { enumerable: false });
    Object.defineProperty(this, 'owner', { enumerable: false, writable: true });
    Object.defineProperty(this, '_property', { enumerable: false, writable: true });
    Object.defineProperty(this, '__collection', { value: true });
  }

  getItems(): T[] {
    return [...this.items];
  }

  toArray(): Dictionary[] {
    return this.getItems().map((item: AnyEntity<T>) => {
      const meta = item.__helper!.__meta;
      const args = [...meta.toJsonParams.map(() => undefined), [this.property.name]];

      return wrap(item).toJSON(...args);
    });
  }

  toJSON(): Dictionary[] {
    return this.toArray();
  }

  getIdentifiers<U extends IPrimaryKey = Primary<T> & IPrimaryKey>(field?: string): U[] {
    const items = this.getItems();

    if (items.length === 0) {
      return [];
    }

    field = field || (this.items[0] as AnyEntity<T>).__helper!.__meta.serializedPrimaryKey;

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
      const idx = this.items.findIndex((i: AnyEntity<T>) => i.__helper!.__serializedPrimaryKey === (entity as AnyEntity<T>).__helper!.__serializedPrimaryKey);

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
    const entity = Reference.unwrapReference(item) as AnyEntity<T>;

    return !!this.items.find((i: AnyEntity<T>) => {
      const objectIdentity = i === entity;
      const primaryKeyIdentity = i.__helper!.__primaryKey && entity.__helper!.__primaryKey && i.__helper!.__serializedPrimaryKey === entity.__helper!.__serializedPrimaryKey;

      return objectIdentity || primaryKeyIdentity;
    });
  }

  count(): number {
    return this.items.length;
  }

  isInitialized(fully = false): boolean {
    if (fully) {
      return this.initialized && this.items.every((item: AnyEntity<T>) => item.__helper!.isInitialized());
    }

    return this.initialized;
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
      const meta = this.owner.__helper!.__meta;
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
    const collection = item[this.property.inversedBy as keyof T] as unknown as ArrayCollection<O, T>;

    if (this.shouldPropagateToCollection(collection, method)) {
      collection[method](this.owner);
    }
  }

  protected propagateToOwningSide(item: T, method: 'add' | 'remove'): void {
    const collection = item[this.property.mappedBy as keyof T] as unknown as ArrayCollection<O, T>;

    if (this.property.reference === ReferenceType.MANY_TO_MANY && this.shouldPropagateToCollection(collection, method)) {
      collection[method](this.owner);
    } else if (this.property.reference === ReferenceType.ONE_TO_MANY && !(this.property.orphanRemoval && method === 'remove')) {
      item[this.property.mappedBy] = method === 'add' ? this.owner : null;
    }
  }

  protected shouldPropagateToCollection(collection: ArrayCollection<O, T>, method: 'add' | 'remove'): boolean {
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
