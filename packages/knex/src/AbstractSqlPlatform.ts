import { Constructor, Platform } from '@mikro-orm/core';
import { SqlEntityRepository } from './SqlEntityRepository';
import { SchemaHelper } from './schema';

export abstract class AbstractSqlPlatform extends Platform {

  protected readonly schemaHelper?: SchemaHelper;

  usesPivotTable(): boolean {
    return true;
  }

  getRepositoryClass<T>(): Constructor<SqlEntityRepository<T>> {
    return SqlEntityRepository;
  }

  getSchemaHelper(): SchemaHelper | undefined {
    return this.schemaHelper;
  }

}
