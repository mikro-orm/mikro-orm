import {
  type EntitySchemaWithMeta,
  EntityManager,
  raw,
  Utils,
  type AnyEntity,
  type ConnectionType,
  type CountByOptions,
  type Dictionary,
  type EntityData,
  type EntityKey,
  type EntityName,
  type EntityRepository,
  type FilterQuery,
  type GetRepository,
  type LoggingOptions,
  type QueryResult,
  type RawQueryFragment,
} from '@mikro-orm/core';
import type { AbstractSqlDriver } from './AbstractSqlDriver.js';
import type { NativeQueryBuilder } from './query/NativeQueryBuilder.js';
import type { QueryBuilder } from './query/QueryBuilder.js';
import type { SqlEntityRepository } from './SqlEntityRepository.js';
import type { Kysely } from 'kysely';
import type { InferClassEntityDB, InferKyselyDB } from './typings.js';
import { MikroKyselyPlugin, type MikroKyselyPluginOptions } from './plugin/index.js';

/** Options for `SqlEntityManager.getKysely()`. */
export interface GetKyselyOptions extends MikroKyselyPluginOptions {
  /** Connection type to use (`'read'` or `'write'`). */
  type?: ConnectionType;
}

/**
 * @inheritDoc
 */
export class SqlEntityManager<Driver extends AbstractSqlDriver = AbstractSqlDriver> extends EntityManager<Driver> {
  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder<Entity extends object, RootAlias extends string = never>(
    entityName: EntityName<Entity> | QueryBuilder<Entity>,
    alias?: RootAlias,
    type?: ConnectionType,
    loggerContext?: LoggingOptions,
  ): QueryBuilder<Entity, RootAlias> {
    const context = this.getContext(false);
    return this.driver.createQueryBuilder(
      entityName as EntityName<Entity>,
      context.getTransactionContext(),
      type,
      true,
      loggerContext ?? context.loggerContext,
      alias,
      this,
    ) as any;
  }

  /**
   * Shortcut for `createQueryBuilder()`
   */
  qb<Entity extends object, RootAlias extends string = never>(
    entityName: EntityName<Entity>,
    alias?: RootAlias,
    type?: ConnectionType,
    loggerContext?: LoggingOptions,
  ): QueryBuilder<Entity, RootAlias> {
    return this.createQueryBuilder(entityName, alias, type, loggerContext);
  }

  /**
   * Returns configured Kysely instance.
   */
  getKysely<TDB = undefined, TOptions extends GetKyselyOptions = GetKyselyOptions>(
    options: TOptions = {} as TOptions,
  ): Kysely<
    TDB extends undefined
      ? InferKyselyDB<EntitiesFromManager<this>, TOptions> & InferClassEntityDB<AllEntitiesFromManager<this>, TOptions>
      : TDB
  > {
    let kysely = this.getConnection(options.type).getClient();
    if (
      options.columnNamingStrategy != null ||
      options.tableNamingStrategy != null ||
      options.processOnCreateHooks != null ||
      options.processOnUpdateHooks != null ||
      options.convertValues != null
    ) {
      kysely = kysely.withPlugin(new MikroKyselyPlugin(this, options));
    }
    return kysely;
  }

  /** Executes a raw SQL query, using the current transaction context if available. */
  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(
    query: string | NativeQueryBuilder | RawQueryFragment,
    params: any[] = [],
    method: 'all' | 'get' | 'run' = 'all',
    loggerContext?: LoggingOptions,
  ): Promise<T> {
    return this.getDriver().execute(
      query,
      params,
      method,
      this.getContext(false).getTransactionContext(),
      loggerContext,
    );
  }

  /**
   * @inheritDoc
   */
  override async countBy<Entity extends object>(
    entityName: EntityName<Entity>,
    groupBy: EntityKey<Entity> | readonly EntityKey<Entity>[],
    options: CountByOptions<Entity> = {},
  ): Promise<Dictionary<number>> {
    const em = this.getContext(false) as SqlEntityManager;
    const meta = em.getMetadata().find(entityName)!;
    const fields = Utils.asArray(groupBy);
    const { where: rawWhere, ...countOptions } = options;

    await em.tryFlush(entityName, options);
    const where = await em.processWhere(entityName, rawWhere ?? ({} as FilterQuery<Entity>), options as any, 'read');

    const qb = em.createQueryBuilder(meta.class);

    (qb as any)
      .select([...fields, raw('count(*) as cnt')])
      .where(where)
      .groupBy(fields as string[]);

    if (countOptions.having) {
      (qb as any).having(countOptions.having);
    }

    if (countOptions.schema) {
      qb.withSchema(countOptions.schema);
    }

    const rows: any[] = await qb.execute('all', { mapResults: false });
    const results: Dictionary<number> = {};

    for (const row of rows) {
      const keyParts = fields.map(f => {
        const col = meta.properties[f as EntityKey<Entity>]?.fieldNames?.[0] ?? f;
        return String(row[col]);
      });
      const key = keyParts.join(Utils.PK_SEPARATOR);
      results[key] = +row.cnt;
    }

    return results;
  }

  override getRepository<T extends object, U extends EntityRepository<T> = SqlEntityRepository<T>>(
    entityName: EntityName<T>,
  ): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

  protected override applyDiscriminatorCondition<Entity extends object>(
    entityName: EntityName<Entity>,
    where: FilterQuery<Entity>,
  ): FilterQuery<Entity> {
    // this is handled in QueryBuilder now for SQL drivers
    return where;
  }
}

type EntitiesFromManager<TEntityManager extends EntityManager<any>> =
  NonNullable<TEntityManager['~entities']> extends any[]
    ? Extract<NonNullable<TEntityManager['~entities']>[number], EntitySchemaWithMeta>
    : never;

type AllEntitiesFromManager<TEntityManager extends EntityManager<any>> =
  NonNullable<TEntityManager['~entities']> extends any[] ? NonNullable<TEntityManager['~entities']>[number] : never;
