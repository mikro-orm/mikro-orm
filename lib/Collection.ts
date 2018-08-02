import { ObjectID } from 'bson';
import { BaseEntity, EntityProperty, ReferenceType } from './BaseEntity';
import { getEntityManager } from './MikroORM';

export class Collection<T extends BaseEntity> {

  private initialized = false;
  private dirty = false;
  private _populated = false;
  private readonly items: T[] = [];

  constructor(public readonly owner: BaseEntity,
              private readonly property: EntityProperty,
              items: T[] = null) {
    if (items) {
      this.initialized = true;
      this.items = items;
    }
  }

  isInitialized(fully = false): boolean {
    if (fully) {
      return this.initialized && this.items.every(i => i.isInitialized());
    }

    return this.initialized;
  }

  shouldPopulate(): boolean {
    return this._populated;
  }

  populated(populated = true): void {
    this._populated = populated;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  async init(): Promise<Collection<T>> {
    // do not make db call if we know we will get no results
    if (this.property.reference === ReferenceType.MANY_TO_MANY && this.property.owner && this.items.length === 0) {
      this.initialized = true;
      this.dirty = false;
      this.populated();

      return this;
    }

    const cond = this.createCondition();
    const order = this.items.map(item => item.id);

    this.items.length = 0;
    const em = getEntityManager();
    const items = await em.find<T>(this.property.type, cond);

    // re-order items when searching with `$in` operator
    if (this.property.reference === ReferenceType.MANY_TO_MANY && this.property.owner) {
      items.sort((a: BaseEntity, b: BaseEntity) => {
        return order.indexOf(a.id) - order.indexOf(b.id);
      });
    }

    this.items.push(...items);
    this.initialized = true;
    this.dirty = false;
    this.populated();

    return this;
  }

  getItems(): T[] {
    this.checkInitialized();
    return this.items;
  }

  getIdentifiers(field = '_id'): ObjectID[] {
    return this.getItems().map(i => i[field]);
  }

  add(...items: T[]): void {
    this.checkInitialized();

    for (const item of items) {
      if (!this.contains(item)) {
        this.handleInverseSide(item, 'add');
        this.items.push(item);
      }
    }

    this.dirty = this.property.owner; // set dirty flag only to owning side
  }

  set(items: T[], initialize = false): void {
    if (initialize) {
      this.initialized = true;
    }

    this.removeAll();
    this.add(...items);

    if (initialize) {
      this.dirty = false;
    }
  }

  remove(...items: T[]): void {
    this.checkInitialized();

    for (const item of items) {
      this.handleInverseSide(item, 'remove');
      const idx = this.items.findIndex(i => i.id === item.id);

      if (idx !== -1) {
        this.items.splice(idx, 1);
      }
    }

    this.dirty = this.property.owner; // set dirty flag only to owning side
  }

  removeAll(): void {
    this.checkInitialized();

    if (this.property.owner && this.property.inversedBy && this.items.length > 0) {
      this.items[0][this.property.inversedBy].length = 0;
    }

    this.items.length = 0;
    this.dirty = this.property.owner; // set dirty flag only to owning side
  }

  contains(item: T): boolean {
    this.checkInitialized();
    return !!this.items.find(i => i.id !== null && i.id === item.id);
  }

  count(): number {
    this.checkInitialized();
    return this.items.length;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (const item of this.items) {
      yield item;
    }
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Collection ${this.property.type}[] of entity ${this.owner.constructor.name}[${this.owner.id}] not initialized`);
    }
  }

  private handleInverseSide(item: T, method: string): void {
    if (this.property.owner && this.property.inversedBy && item[this.property.inversedBy].isInitialized()) {
      item[this.property.inversedBy][method](this.owner);
    }
  }

  private createCondition(): any {
    const cond: any = {};

    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.fk] = this.owner._id;
    } else if (this.property.reference === ReferenceType.MANY_TO_MANY) {
      if (this.property.owner) {
        cond._id = { $in: this.items.map(item => item._id) };
      } else {
        cond[this.property.mappedBy] = this.owner._id;
      }
    }

    return cond;
  }

}

