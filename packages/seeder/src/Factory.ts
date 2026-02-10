import type { RequiredEntityData, EntityData, EntityManager, Constructor } from '@mikro-orm/core';

export abstract class Factory<TEntity extends object, TInput = EntityData<TEntity>> {
  abstract readonly model: Constructor<TEntity>;
  private eachFunction?: (entity: TEntity, index: number) => void;

  constructor(protected readonly em: EntityManager) {}

  protected abstract definition(input?: TInput): EntityData<TEntity>;

  /**
   * Make a single entity instance, without persisting it.
   * @param input Object specifying what default attributes of the entity factory should be overridden
   */
  makeEntity(input?: TInput, index = 0): TEntity {
    const data =
      this.definition.length === 0
        ? {
            ...this.definition(),
            ...input,
          }
        : this.definition(input);
    const entity = this.em.create(this.model, data as unknown as RequiredEntityData<TEntity>, { persist: false });

    this.eachFunction?.(entity, index);

    return entity;
  }

  /**
   * Make a single entity and persist (not flush)
   * @param input Object specifying what default attributes of the entity factory should be overridden
   */
  makeOne(input?: TInput): TEntity {
    const entity = this.makeEntity(input);
    this.em.persist(entity);
    return entity;
  }

  /**
   * Make multiple entities and then persist them (not flush)
   * @param amount Number of entities that should be generated
   * @param input Object specifying what default attributes of the entity factory should be overridden
   */
  make(amount: number, input?: TInput): TEntity[] {
    const entities = [...Array(amount)].map((_, index) => {
      return this.makeEntity(input, index);
    });
    this.em.persist(entities);
    return entities;
  }

  /**
   * Create (and flush) a single entity
   * @param input Object specifying what default attributes of the entity factory should be overridden
   */
  async createOne(input?: TInput): Promise<TEntity> {
    const entity = this.makeOne(input);
    await this.em.flush();
    return entity;
  }

  /**
   * Create (and flush) multiple entities
   * @param amount Number of entities that should be generated
   * @param input Object specifying what default attributes of the entity factory should be overridden
   */
  async create(amount: number, input?: TInput): Promise<TEntity[]> {
    const entities = this.make(amount, input);
    await this.em.flush();
    return entities;
  }

  /**
   * Set a function that is applied to each entity before it is returned
   * In case of `createOne` or `create` it is applied before the entity is persisted
   * @param eachFunction The function that is applied on every entity
   */
  each(eachFunction: (entity: TEntity, index: number) => void) {
    this.eachFunction = eachFunction;
    return this;
  }
}
