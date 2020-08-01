import { Constructor, EntityRepository, Platform } from '@mikro-orm/core';
import { SqlEntityRepository } from './SqlEntityRepository';
import { SchemaHelper, SchemaGenerator } from './schema';
import { SqlEntityManager } from './SqlEntityManager';

export abstract class AbstractSqlPlatform extends Platform {

  protected readonly schemaHelper?: SchemaHelper;

  usesPivotTable(): boolean {
    return true;
  }

  getRepositoryClass<T>(): Constructor<EntityRepository<T>> {
    return SqlEntityRepository as Constructor<EntityRepository<T>>;
  }

  getSchemaHelper(): SchemaHelper | undefined {
    return this.schemaHelper;
  }

  getSchemaGenerator(em: SqlEntityManager): SchemaGenerator {
    return new SchemaGenerator(em);
  }

}
