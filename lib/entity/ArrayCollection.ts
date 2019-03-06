import { EntityProperty, IEntity, IEntityType } from '../decorators/Entity';
import { EntityTransformer } from './EntityTransformer';
import { IPrimaryKey } from '..';
import { MetadataStorage } from '../metadata/MetadataStorage';

export class ArrayCollection<T extends IEntityType<T>> {

  [k: number]: T;

  protected readonly items: T[] = [];
  private _property: EntityProperty;

  constructor(readonly owner: IEntityType<any>, items?: T[]) {
    if (items) {
      this.items = items;
      Object.assign(this, items);
    }
  }

  getItems(): T[] {
    return [...this.items];
  }

  toArray(parent: IEntity = this.owner): Record<string, any>[] {
    return this.getItems().map(item => EntityTransformer.toObject(item, parent, true));
  }

  getIdentifiers(field = 'id'): IPrimaryKey[] {
    return this.getItems().map(i => i[field as keyof T]);
  }

  add(...items: T[]): void {
    for (const item of items) {
      if (!this.contains(item)) {
        this.handleInverseSide(item, 'add');
        this.items.push(item);
      }
    }

    Object.assign(this, items);
  }

  set(items: T[]): void {
    this.removeAll();
    this.add(...items);
  }

  remove(...items: T[]): void {
    for (const item of items) {
      this.handleInverseSide(item, 'remove');
      const idx = this.items.findIndex(i => i.id === item.id);

      if (idx !== -1) {
        delete this[this.items.length]; // remove last item
        this.items.splice(idx, 1);
        Object.assign(this, this.items); // reassign array access
      }
    }
  }

  removeAll(): void {
    this.remove(...this.items);
  }

  contains(item: T): boolean {
    return !!this.items.find(i => i === item || !!(i.id && item.id && i.id === item.id));
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

  protected handleInverseSide(item: T, method: string): void {
    if (this.property.owner && this.property.inversedBy && item[this.property.inversedBy as keyof T].isInitialized()) {
      item[this.property.inversedBy as keyof T][method](this.owner);
    }
  }

  protected get property() {
    if (!this._property) {
      const meta = MetadataStorage.getMetadata(this.owner.constructor.name);
      const field = Object.keys(meta.properties).find(k => this.owner[k] === this);
      this._property = meta.properties[field!];
    }

    return this._property;
  }

}
