import { BaseEntity, EntityProperty } from './BaseEntity';
import { EntityManager } from './EntityManager';
import { ObjectID } from 'bson';

export class Collection<T extends BaseEntity> {

  private initialized = false;
  private items: T[] = [];

  constructor(private readonly property: EntityProperty,
              private readonly owner: BaseEntity) { }

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(em: EntityManager): Promise<Collection<T>> {
    this.items.length = 0;
    this.items.push(...(await em.find<T>(this.property.type, { [this.property.fk]: this.owner._id })));
    this.initialized = true;

    return this;
  }

  getItems(): T[] {
    if (!this.isInitialized()) {
      throw new Error(`Collection ${this.property.type}[] of entity ${this.owner.id} not initialized`);
    }

    return this.items;
  }

  getIdentifiers(): ObjectID[] {
    return this.getItems().map(i => i._id);
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (const item of this.items) {
      yield item;
    }
  }

}

export interface CollectionAttributes {
  [attribute: string]: any;
}
