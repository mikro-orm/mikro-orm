import { escape } from 'sqlstring';
import type { Constructor, EntityManager, EntityRepository, IDatabaseDriver } from '@mikro-orm/core';
import { JsonProperty, Platform, Utils } from '@mikro-orm/core';
import { SqlEntityRepository } from './SqlEntityRepository';
import type { SchemaHelper } from './schema';
import { SchemaGenerator } from './schema';

export abstract class AbstractSqlPlatform extends Platform {

  protected readonly schemaHelper?: SchemaHelper;

  usesPivotTable(): boolean {
    return true;
  }

  indexForeignKeys() {
    return true;
  }

  getRepositoryClass<T extends object>(): Constructor<EntityRepository<T>> {
    return SqlEntityRepository as Constructor<EntityRepository<T>>;
  }

  getSchemaHelper(): SchemaHelper | undefined {
    return this.schemaHelper;
  }

  getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): SchemaGenerator {
    /* istanbul ignore next */
    return this.config.getCachedService(SchemaGenerator, em ?? driver as any); // cast as `any` to get around circular dependencies
  }

  getEntityGenerator(em: EntityManager) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EntityGenerator } = require('@mikro-orm/entity-generator');
    return this.config.getCachedService(EntityGenerator, em);
  }

  getMigrator(em: EntityManager) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Migrator } = require('@mikro-orm/migrations');
    return this.config.getCachedService(Migrator, em);
  }

  quoteValue(value: any): string {
    if (this.isRaw(value)) {
      return value;
    }

    /* istanbul ignore if */
    if (Utils.isPlainObject(value) || value?.[JsonProperty]) {
      return escape(JSON.stringify(value));
    }

    // @ts-ignore
    return escape(value, true, this.timezone);
  }

  formatQuery(sql: string, params: readonly any[]): string {
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

      if (sql.substr(idx - 1, 2) === '\\?') {
        ret += sql.substr(pos, idx - pos - 1) + '?';
        pos = idx + 1;
      } else if (sql.substr(idx, 2) === '??') {
        ret += sql.substr(pos, idx - pos) + this.quoteIdentifier(params[j++]);
        pos = idx + 2;
      } else {
        ret += sql.substr(pos, idx - pos) + this.quoteValue(params[j++]);
        pos = idx + 1;
      }
    }

    return ret;
  }

  getSearchJsonPropertySQL(path: string, type: string, aliased: boolean): string {
    return this.getSearchJsonPropertyKey(path.split('->'), type, aliased);
  }

  isRaw(value: any): boolean {
    return super.isRaw(value) || (typeof value === 'object' && value !== null && value.client && ['Ref', 'Raw'].includes(value.constructor.name));
  }

  supportsSchemas(): boolean {
    return false;
  }

  /** @inheritDoc */
  generateCustomOrder(escapedColumn: string, values: unknown[]): string {
    let ret = '(case ';
    values.forEach((v, i) => {
      ret += `when ${escapedColumn} = ${this.quoteValue(v)} then ${i} `;
    });
    return ret + 'else null end)';
  }

}
