import Faker from 'faker';
import type { EntityManager } from '@mikro-orm/core';

export abstract class Factory<C> {

  abstract readonly model: { new(): C };
  private eachFunction?: (entity: C) => void;

  constructor(private readonly em: EntityManager) {
  }

  protected abstract definition(faker: typeof Faker): Partial<C>;

  /**
   * Make a single entity
   * @param overrideParameters Object specifying what default attributes of the entity factory should be overridden
   */
  makeOne(overrideParameters?: Partial<C>): C {
    const entity = this.em.create(this.model, Object.assign({}, this.definition(Faker), overrideParameters));
    if (this.eachFunction) {
      this.eachFunction(entity);
    }
    return entity;
  }

  /**
   * Make multiple entities
   * @param amount Number of entities that should be generated
   * @param overrideParameters Object specifying what default attributes of the entity factory should be overridden
   */
  make(amount: number, overrideParameters?: Partial<C>): C[] {
    return [...Array(amount)].map(() => {
      return this.makeOne(overrideParameters);
    });
  }

  /**
   * Create (and persist) a single entity
   * @param overrideParameters Object specifying what default attributes of the entity factory should be overridden
   */
  async createOne(overrideParameters?: Partial<C>): Promise<C> {
    const entity = this.makeOne(overrideParameters);
    await this.em.persistAndFlush(entity);
    return entity;
  }

  /**
   * Create (and persist) multiple entities
   * @param amount Number of entities that should be generated
   * @param overrideParameters Object specifying what default attributes of the entity factory should be overridden
   */
  async create(amount: number, overrideParameters?: Partial<C>): Promise<C[]> {
    const entities = this.make(amount, overrideParameters);
    await this.em.persistAndFlush(entities);
    return entities;
  }

  /**
   * Set a function that is applied to each entity before it is returned
   * In case of `createOne` or `create` it is applied before the entity is persisted
   * @param eachFunction The function that is applied on every entity
   */
  each(eachFunction: (entity: C) => void) {
    this.eachFunction = eachFunction;
    return this;
  }

}
