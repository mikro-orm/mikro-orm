import { escape } from 'sqlstring';
import { Constructor, EntityManager, EntityRepository, Platform, Utils } from '@mikro-orm/core';
import { SqlEntityRepository } from './SqlEntityRepository';
import { SchemaHelper, SchemaGenerator } from './schema';

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

  getSchemaGenerator(em: EntityManager): SchemaGenerator {
    return new SchemaGenerator(em as any); // cast as `any` to get around circular dependencies
  }

  quoteValue(value: any): string {
    /* istanbul ignore if */
    if (Utils.isPlainObject(value) || Array.isArray(value)) {
      return escape(JSON.stringify(value));
    }

    // @ts-ignore
    return escape(value, true, this.timezone);
  }

  formatQuery(sql: string, params: any[]): string {
    if (params.length === 0) {
      return sql;
    }

    // fast string replace without regexps
    let j = 0;
    let pos = 0;
    let ret = '';

    while (pos < sql.length) {
      const idx = sql.indexOf('?', pos + 1);
      if (idx === -1) {
        ret += sql.substring(pos, sql.length);
        break;
      }

      ret += sql.substr(pos, idx - pos) + this.quoteValue(params[j++]);
      pos = idx + 1;
    }

    return ret;
  }

}
