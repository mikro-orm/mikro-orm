import { ObjectID } from 'bson';
import { BaseEntity, EntityProperty, ReferenceType } from './BaseEntity';
import { getEntityManager } from './MikroORM';

export class Collection<T extends BaseEntity> {

  private initialized = false;
  private dirty = false;
  private readonly items: T[] = [];

  constructor(private readonly property: EntityProperty,
              private readonly owner: BaseEntity,
              items: T[] = null) {
    if (items) {
      this.initialized = true;
      this.items = items;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  async init(): Promise<Collection<T>> {
    const cond = {} as any;

    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.fk] = this.owner._id;
    } else if (this.property.reference === ReferenceType.MANY_TO_MANY) {
      if (this.property.owner) {
        cond._id = { $in: this.items.map(item => item._id) };
      } else {
        cond[this.property.mappedBy] = this.owner._id;
      }
    }

    this.items.length = 0;
    const em = getEntityManager();
    const items = await em.find<T>(this.property.type, cond);
    this.items.push(...items);
    this.initialized = true;
    this.dirty = false;

    return this;
  }

  getItems(): T[] {
    this.checkInitialized();
    return this.items;
  }

  getIdentifiers(): ObjectID[] {
    return this.getItems().map(i => i._id);
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

  private handleInverseSide(item: T, method: string) {
    if (this.property.owner && this.property.inversedBy && item[this.property.inversedBy].isInitialized()) {
      item[this.property.inversedBy][method](this.owner);
    }
  }

}

