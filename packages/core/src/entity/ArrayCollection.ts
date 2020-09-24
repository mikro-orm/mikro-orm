import { AnyEntity, Dictionary, EntityProperty, IPrimaryKey, Primary } from '../typings';
import { Reference } from './Reference';
import { wrap } from './wrap';
import { ReferenceType } from '../enums';

export class ArrayCollection<T, O> {

  [k: number]: T;

  protected readonly items = new Set<T>();
  protected initialized = true;
  protected _firstItem?: T;
  private _property?: EntityProperty;

  constructor(readonly owner: O & AnyEntity<O>, items?: T[]) {
    if (items) {
      this.items = new Set(items);
      let i = 0;
      items.forEach(item => this[i++] = item);
    }

    Object.defineProperty(this, 'items', { enumerable: false });
    Object.defineProperty(this, 'owner', { enumerable: false, writable: true });
    Object.defineProperty(this, '_property', { enumerable: false, writable: true });
    Object.defineProperty(this, '_firstItem', { enumerable: false, writable: true });
    Object.defineProperty(this, '__collection', { value: true });
  }

  getItems(): T[] {
    return [...this.items];
  }

  toArray(): Dictionary[] {
    if (this.items.size === 0) {
      return [];
    }

    const meta = (this._firstItem as AnyEntity<T>).__meta!;
    const args = [...meta.toJsonParams.map(() => undefined), [this.property.name]];

    return this.getItems().map(item => wrap(item).toJSON(...args));
  }

  toJSON(): Dictionary[] {
    return this.toArray();
  }

  getIdentifiers<U extends IPrimaryKey = Primary<T> & IPrimaryKey>(field?: string): U[] {
    const items = this.getItems();

    if (items.length === 0) {
      return [];
    }

    field = field ?? (this._firstItem as AnyEntity<T>).__meta!.serializedPrimaryKey;

    return this.getItems().map(i => i[field as keyof T]) as unknown as U[];
  }

  add(...items: (T | Reference<T>)[]): void {
    for (const item of items) {
      const entity = Reference.unwrapReference(item);
      this._firstItem = entity;

      if (!this.contains(entity, false)) {
        this[this.items.size] = entity;
        this.items.add(entity);
        this.propagate(entity, 'add');
      }
    }
  }

  set(items: (T | Reference<T>)[]): void {
    this.removeAll();
    this.add(...items);
  }

  /**
   * @internal
   */
  hydrate(items: T[]): void {
    this.items.clear();
    this.add(...items);
  }

  remove(...items: (T | Reference<T>)[]): void {
    for (const item of items) {
      const entity = Reference.unwrapReference(item);
      delete this[this.items.size - 1]; // remove last item
      this.items.delete(entity);
      Object.assign(this, [...this.items]); // reassign array access
      this.propagate(entity, 'remove');
    }
  }

  removeAll(): void {
    this.remove(...this.items);
  }

  contains(item: T | Reference<T>, check?: boolean): boolean {
    const entity = Reference.unwrapReference(item);
    return this.items.has(entity);
  }

  count(): number {
    return this.items.size;
  }

  isInitialized(fully = false): boolean {
    if (fully) {
      return this.initialized && [...this.items].every((item: AnyEntity<T>) => item.__helper!.__initialized);
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
      const meta = this.owner.__meta!;
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
