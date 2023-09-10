import {
  type Constructor,
  type EntityManager,
  type EntityRepository,
  type IDatabaseDriver,
  JsonProperty,
  type MikroORM,
  Platform,
  raw,
  Utils,
} from '@mikro-orm/core';
import { escape } from 'sqlstring';
import { type SchemaHelper, SqlSchemaGenerator } from './schema';
import { SqlEntityRepository } from './SqlEntityRepository';

export abstract class AbstractSqlPlatform extends Platform {
  protected readonly schemaHelper?: SchemaHelper;

  override usesPivotTable(): boolean {
    return true;
  }

  override indexForeignKeys() {
    return true;
  }

  override getRepositoryClass<T extends object>(): Constructor<EntityRepository<T>> {
    return SqlEntityRepository as unknown as Constructor<EntityRepository<T>>;
  }

  override getSchemaHelper(): SchemaHelper | undefined {
    return this.schemaHelper;
  }

  /** @inheritDoc */
  override lookupExtensions(orm: MikroORM): void {
    SqlSchemaGenerator.register(orm);
  }

  /* istanbul ignore next: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): SqlSchemaGenerator {
    return new SqlSchemaGenerator(em ?? driver as any);
  }

  override quoteValue(value: any): string {
    if (Utils.isRawSql(value)) {
      return this.formatQuery(value.sql, value.params ?? []);
    }

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

    if (sql[0] === '?') {
      if (sql[1] === '?') {
        ret += this.quoteIdentifier(params[j++]);
        pos = 2;
      } else {
        ret += this.quoteValue(params[j++]);
        pos = 1;
      }
    }

    while (pos < sql.length) {
      const idx = sql.indexOf('?', pos + 1);

      if (idx === -1) {
        ret += sql.substring(pos, sql.length);
        break;
      }

      if (sql.substring(idx - 1, idx + 1) === '\\?') {
        ret += sql.substring(pos, idx - 1) + '?';
        pos = idx + 1;
      } else if (sql.substring(idx, idx + 2) === '??') {
        ret += sql.substring(pos, idx) + this.quoteIdentifier(params[j++]);
        pos = idx + 2;
      } else {
        ret += sql.substring(pos, idx) + this.quoteValue(params[j++]);
        pos = idx + 1;
      }
    }

    return ret;
  }

  override getSearchJsonPropertySQL(path: string, type: string, aliased: boolean): string {
    return this.getSearchJsonPropertyKey(path.split('->'), type, aliased);
  }

  override getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean): string {
    const [a, ...b] = path;
    const quoteKey = (key: string) => key.match(/^[a-z]\w*$/i) ? key : `"${key}"`;

    if (aliased) {
      return raw(alias => `json_extract(${this.quoteIdentifier(`${alias}.${a}`)}, '$.${b.map(quoteKey).join('.')}')`);
    }

    return raw(`json_extract(${this.quoteIdentifier(a)}, '$.${b.map(quoteKey).join('.')}')`);
  }

  override isRaw(value: any): boolean {
    return super.isRaw(value)
      || (typeof value === 'object' && value !== null && value.client
        && ['Ref', 'Raw'].includes(value.constructor.name));
  }

  supportsSchemas(): boolean {
    return false;
  }

  /** @inheritDoc */
  override generateCustomOrder(escapedColumn: string, values: unknown[]): string {
    let ret = '(case ';
    values.forEach((v, i) => {
      ret += `when ${escapedColumn} = ${this.quoteValue(v)} then ${i} `;
    });
    return ret + 'else null end)';
  }
}
