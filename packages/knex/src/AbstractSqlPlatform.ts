import { escape } from 'sqlstring';
import {
  type Constructor,
  type EntityManager,
  type EntityRepository,
  type IDatabaseDriver,
  isRaw,
  JsonProperty,
  type MikroORM,
  Platform,
  raw,
  Utils,
} from '@mikro-orm/core';
import { SqlEntityRepository } from './SqlEntityRepository';
import { SqlSchemaGenerator } from './schema/SqlSchemaGenerator';
import { type SchemaHelper } from './schema/SchemaHelper';
import type { IndexDef } from './typings';
import { NativeQueryBuilder } from './query/NativeQueryBuilder';

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

  /* istanbul ignore next */
  /** @internal */
  createNativeQueryBuilder(): NativeQueryBuilder {
    return new NativeQueryBuilder(this);
  }

  override quoteValue(value: any): string {
    if (isRaw(value)) {
      return this.formatQuery(value.sql, value.params);
    }

    if (Utils.isPlainObject(value) || value?.[JsonProperty]) {
      return this.escape(JSON.stringify(value));
    }

    return this.escape(value);
  }

  override escape(value: any): string {
    return escape(value, true, this.timezone);
  }

  override getSearchJsonPropertySQL(path: string, type: string, aliased: boolean): string {
    return this.getSearchJsonPropertyKey(path.split('->'), type, aliased);
  }

  override getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean, value?: unknown): string {
    const [a, ...b] = path;
    const quoteKey = (key: string) => key.match(/^[a-z]\w*$/i) ? key : `"${key}"`;

    if (aliased) {
      return raw(alias => `json_extract(${this.quoteIdentifier(`${alias}.${a}`)}, '$.${b.map(quoteKey).join('.')}')`);
    }

    return raw(`json_extract(${this.quoteIdentifier(a)}, '$.${b.map(quoteKey).join('.')}')`);
  }

  override getJsonIndexDefinition(index: IndexDef): string[] {
    return index.columnNames
      .map(column => {
        if (!column.includes('.')) {
          return column;
        }

        const [root, ...path] = column.split('.');
        return `(json_extract(${root}, '$.${path.join('.')}'))`;
      });
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

  /**
   * @internal
   */
  getOrderByExpression(column: string, direction: string): string[] {
    return [ `${column} ${direction.toLowerCase()}` ];
  }

}
