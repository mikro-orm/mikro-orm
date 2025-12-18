import { EntityManager, type EntityName, type EntityRepository, type GetRepository, type TransactionOptions } from '@mikro-orm/core';
import type { Neo4jDriver } from './Neo4jDriver';
import type { Neo4jEntityRepository } from './Neo4jEntityRepository';

export class Neo4jEntityManager<Driver extends Neo4jDriver = Neo4jDriver> extends EntityManager<Driver> {

  override getRepository<T extends object, U extends EntityRepository<T> = Neo4jEntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

  override async begin(options: TransactionOptions = {}): Promise<void> {
    return super.begin(options);
  }

  override async transactional<T>(cb: (em: this) => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    return super.transactional(cb, options);
  }

  async run<T = any>(cypher: string, params?: Record<string, unknown>): Promise<T[]> {
    const res = await this.getConnection().execute(cypher, params);
    return res.records.map((r: any) => r.toObject() as T);
  }

  async aggregate<T = any>(cypher: string, params?: Record<string, unknown>): Promise<T[]> {
    return this.run<T>(cypher, params);
  }

  override getConnection(type?: any): ReturnType<Driver['getConnection']> {
    return this.getDriver().getConnection(type) as ReturnType<Driver['getConnection']>;
  }

}
