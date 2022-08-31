import type { Faker } from '@faker-js/faker';
import { faker } from '@faker-js/faker';
import type { RequiredEntityData, EntityData, EntityManager, Constructor } from '@mikro-orm/core';

export abstract class Factory<T extends object> {

  abstract readonly model: Constructor<T>;
  private eachFunction?: (entity: T) => void;

  constructor(private readonly em: EntityManager) { }

  protected abstract definition(faker: Faker): EntityData<T>;

  private makeEntity(overrideParameters?: EntityData<T>): T {
    const entity = this.em.create(this.model, {
      ...this.definition(faker),
      ...overrideParameters,
    } as unknown as RequiredEntityData<T>);

    if (this.eachFunction) {
      this.eachFunction(entity);
    }

    return entity;
  }

  /**
   * Make a single entity and persist (not flush)
   * @param overrideParameters Object specifying what default attributes of the entity factory should be overridden
   */
  makeOne(overrideParameters?: EntityData<T>): T {
    const entity = this.makeEntity(overrideParameters);
    this.em.persist(entity);
    return entity;
  }

  /**
   * Make multiple entities and then persist them (not flush)
   * @param amount Number of entities that should be generated
   * @param overrideParameters Object specifying what default attributes of the entity factory should be overridden
   */
  make(amount: number, overrideParameters?: EntityData<T>): T[] {
    const entities = [...Array(amount)].map(() => {
      return this.makeEntity(overrideParameters);
    });
    this.em.persist(entities);
    return entities;
  }

  /**
   * Create (and flush) a single entity
   * @param overrideParameters Object specifying what default attributes of the entity factory should be overridden
   */
  async createOne(overrideParameters?: EntityData<T>): Promise<T> {
    const entity = this.makeOne(overrideParameters);
    await this.em.flush();
    return entity;
  }

  /**
   * Create (and flush) multiple entities
   * @param amount Number of entities that should be generated
   * @param overrideParameters Object specifying what default attributes of the entity factory should be overridden
   */
  async create(amount: number, overrideParameters?: EntityData<T>): Promise<T[]> {
    const entities = this.make(amount, overrideParameters);
    await this.em.flush();
    return entities;
  }

  /**
   * Set a function that is applied to each entity before it is returned
   * In case of `createOne` or `create` it is applied before the entity is persisted
   * @param eachFunction The function that is applied on every entity
   */
  each(eachFunction: (entity: T) => void) {
    this.eachFunction = eachFunction;
    return this;
  }

}
