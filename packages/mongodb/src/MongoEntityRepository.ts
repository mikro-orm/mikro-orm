import {
  EntityRepository,
  type Cursor,
  type EntityName,
  type FilterQuery,
  type Loaded,
} from '@mikro-orm/core';
import type { Collection } from 'mongodb';
import type { MongoEntityManager } from './MongoEntityManager.js';
import type {
  MongoCountOptions,
  MongoFindAllOptions,
  MongoFindByCursorOptions,
  MongoFindOneOptions,
  MongoFindOneOrFailOptions,
  MongoFindOptions,
  MongoStreamOptions,
} from './typings.js';

export class MongoEntityRepository<Entity extends object> extends EntityRepository<Entity> {

  constructor(protected override readonly em: MongoEntityManager,
              entityName: EntityName<Entity>) {
    super(em, entityName);
  }

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.getEntityManager().aggregate(this.entityName, pipeline);
  }

  getCollection(): Collection<Entity> {
    return this.getEntityManager().getCollection(this.entityName);
  }

  /**
   * @inheritDoc
   */
  override async findOne<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(where: FilterQuery<Entity>, options?: MongoFindOneOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    return this.getEntityManager().findOne<Entity, Hint, Fields, Excludes>(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override async findOneOrFail<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(where: FilterQuery<Entity>, options?: MongoFindOneOrFailOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>> {
    return this.getEntityManager().findOneOrFail<Entity, Hint, Fields, Excludes>(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override async find<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(where: FilterQuery<Entity>, options?: MongoFindOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    return this.getEntityManager().find(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override async findAndCount<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(where: FilterQuery<Entity>, options?: MongoFindOptions<Entity, Hint, Fields, Excludes>): Promise<[Loaded<Entity, Hint, Fields, Excludes>[], number]> {
    return this.getEntityManager().findAndCount(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override async findByCursor<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
    IncludeCount extends boolean = true,
  >(options: MongoFindByCursorOptions<Entity, Hint, Fields, Excludes, IncludeCount>): Promise<Cursor<Entity, Hint, Fields, Excludes, IncludeCount>> {
    return this.getEntityManager().findByCursor(this.entityName, options);
  }

  /**
   * @inheritDoc
   */
  override async findAll<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(options?: MongoFindAllOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    return this.getEntityManager().findAll(this.entityName, options);
  }

  /**
   * @inheritDoc
   */
  override async *stream<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(options?: MongoStreamOptions<Entity, Hint, Fields, Excludes>): AsyncIterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
    yield* this.getEntityManager().stream(this.entityName, options);
  }

  /**
   * @inheritDoc
   */
  override async count<Hint extends string = never>(where: FilterQuery<Entity> = {} as FilterQuery<Entity>, options: MongoCountOptions<Entity, Hint> = {}): Promise<number> {
    return this.getEntityManager().count<Entity, Hint>(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override getEntityManager(): MongoEntityManager {
    return this.em;
  }

}
