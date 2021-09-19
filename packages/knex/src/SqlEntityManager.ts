import type { Knex } from 'knex';
import type { AnyEntity, Dictionary, EntityData, EntityName, EntityRepository, GetRepository, QueryResult } from '@mikro-orm/core';
import { EntityManager, Utils } from '@mikro-orm/core';
import type { AbstractSqlDriver } from './AbstractSqlDriver';
import { QueryBuilder } from './query';
import type { SqlEntityRepository } from './SqlEntityRepository';

/**
 * @inheritDoc
 */
export class SqlEntityManager<D extends AbstractSqlDriver = AbstractSqlDriver> extends EntityManager<D> {

  /**
   * Creates a QueryBuilder instance
   */
  createQueryBuilder<T>(entityName: EntityName<T>, alias?: string, type?: 'read' | 'write'): QueryBuilder<T> {
    entityName = Utils.className(entityName);
    return new QueryBuilder<T>(entityName, this.getMetadata(), this.getDriver(), this.getTransactionContext(), alias, type, this);
  }

  /**
   * Creates raw SQL query that won't be escaped when used as a parameter.
   */
  raw<R = Knex.Raw>(sql: string, bindings: Knex.RawBinding[] | Knex.ValueDict = []): R {
    const raw = this.getKnex().raw(sql, bindings);
    (raw as Dictionary).__raw = true; // tag it as there is now way to check via `instanceof`

    return raw as unknown as R;
  }

  /**
   * Returns configured knex instance.
   */
  getKnex(type?: 'read' | 'write') {
    return this.getConnection(type).getKnex();
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | Knex.QueryBuilder | Knex.Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<T> {
    return this.getDriver().execute(queryOrKnex, params, method, this.getTransactionContext());
  }

  getRepository<T extends AnyEntity<T>, U extends EntityRepository<T> = SqlEntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

}
