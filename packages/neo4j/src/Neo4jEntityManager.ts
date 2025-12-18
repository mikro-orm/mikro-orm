import {
  EntityManager,
  type EntityName,
  type EntityRepository,
  type GetRepository,
  type TransactionOptions,
} from '@mikro-orm/core';
import type { Neo4jDriver } from './Neo4jDriver';
import type { Neo4jEntityRepository } from './Neo4jEntityRepository';

export class Neo4jEntityManager<
  Driver extends Neo4jDriver = Neo4jDriver
> extends EntityManager<Driver> {

  override getRepository<
    T extends object,
    U extends EntityRepository<T> = Neo4jEntityRepository<T>
  >(entityName: EntityName<T>): GetRepository<T, U> {
    return super.getRepository<T, U>(entityName);
  }

  override async begin(options: TransactionOptions = {}): Promise<void> {
    return super.begin(options);
  }

  override async transactional<T>(
    cb: (em: this) => Promise<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    return super.transactional(cb, options);
  }

  async run<T = any>(
    cypher: string,
    params?: Record<string, unknown>,
  ): Promise<T[]> {
    const res = await this.getConnection().executeRaw(cypher, params);
    return res.records.map((r: any) => {
      // Instead of using toObject(), manually extract each field to preserve types
      const converted: any = {};
      for (const key of r.keys) {
        const value = r.get(key);
        converted[key] = this.convertNeo4jValue(value);
      }
      return converted as T;
    });
  }

  private convertNeo4jValue(value: any): any {
    // Handle Neo4j Integer objects
    if (
      value &&
      typeof value === 'object' &&
      'low' in value &&
      'high' in value
    ) {
      return value.toNumber ? value.toNumber() : Number(value.low);
    }
    // Handle arrays recursively
    if (Array.isArray(value)) {
      return value.map(v => this.convertNeo4jValue(v));
    }
    // Handle objects recursively
    if (value && typeof value === 'object' && value.constructor === Object) {
      const converted: any = {};
      for (const key in value) {
        converted[key] = this.convertNeo4jValue(value[key]);
      }
      return converted;
    }
    return value;
  }

  async aggregate<T = any>(
    cypher: string,
    params?: Record<string, unknown>,
  ): Promise<T[]> {
    return this.run<T>(cypher, params);
  }

  override getConnection(type?: any): ReturnType<Driver['getConnection']> {
    return this.getDriver().getConnection(type) as ReturnType<
      Driver['getConnection']
    >;
  }

}
