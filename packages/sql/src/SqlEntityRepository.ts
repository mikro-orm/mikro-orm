import {
  EntityRepository,
  type Cursor,
  type EntityName,
  type FilterQuery,
  type Loaded,
} from '@mikro-orm/core';
import type { SqlEntityManager } from './SqlEntityManager.js';
import type { QueryBuilder } from './query/QueryBuilder.js';
import type {
  SqlCountOptions,
  SqlFindAllOptions,
  SqlFindByCursorOptions,
  SqlFindOneOptions,
  SqlFindOneOrFailOptions,
  SqlFindOptions,
  SqlStreamOptions,
} from './typings.js';

export class SqlEntityRepository<Entity extends object> extends EntityRepository<Entity> {

  constructor(
    protected override readonly em: SqlEntityManager,
    entityName: EntityName<Entity>,
  ) {
    super(em, entityName);
  }

  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder<RootAlias extends string = never>(alias?: RootAlias): QueryBuilder<Entity, RootAlias> {
    return this.getEntityManager().createQueryBuilder(this.entityName, alias);
  }

  /**
   * Shortcut for `createQueryBuilder()`
   */
  qb<RootAlias extends string = never>(alias?: RootAlias): QueryBuilder<Entity, RootAlias> {
    return this.createQueryBuilder(alias);
  }

  /**
   * @inheritDoc
   */
  override async findOne<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(where: FilterQuery<Entity>, options?: SqlFindOneOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    return this.getEntityManager().findOne<Entity, Hint, Fields, Excludes>(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override async findOneOrFail<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(where: FilterQuery<Entity>, options?: SqlFindOneOrFailOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>> {
    return this.getEntityManager().findOneOrFail<Entity, Hint, Fields, Excludes>(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override async find<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(where: FilterQuery<Entity>, options?: SqlFindOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    return this.getEntityManager().find(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override async findAndCount<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(where: FilterQuery<Entity>, options?: SqlFindOptions<Entity, Hint, Fields, Excludes>): Promise<[Loaded<Entity, Hint, Fields, Excludes>[], number]> {
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
  >(options: SqlFindByCursorOptions<Entity, Hint, Fields, Excludes, IncludeCount>): Promise<Cursor<Entity, Hint, Fields, Excludes, IncludeCount>> {
    return this.getEntityManager().findByCursor(this.entityName, options);
  }

  /**
   * @inheritDoc
   */
  override async findAll<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(options?: SqlFindAllOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    return this.getEntityManager().findAll(this.entityName, options);
  }

  /**
   * @inheritDoc
   */
  override async *stream<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(options?: SqlStreamOptions<Entity, Hint, Fields, Excludes>): AsyncIterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
    yield* this.getEntityManager().stream(this.entityName, options);
  }

  /**
   * @inheritDoc
   */
  override async count<Hint extends string = never>(where: FilterQuery<Entity> = {} as FilterQuery<Entity>, options: SqlCountOptions<Entity, Hint> = {}): Promise<number> {
    return this.getEntityManager().count<Entity, Hint>(this.entityName, where as any, options);
  }

  /**
   * @inheritDoc
   */
  override getEntityManager(): SqlEntityManager {
    return this.em;
  }

}
