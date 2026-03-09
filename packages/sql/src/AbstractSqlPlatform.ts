import {
  type RawQueryFragment,
  type Constructor,
  type EntityManager,
  type EntityRepository,
  type IDatabaseDriver,
  type IsolationLevel,
  isRaw,
  JsonProperty,
  type MikroORM,
  Platform,
  raw,
  Utils,
} from '@mikro-orm/core';
import { SqlEntityRepository } from './SqlEntityRepository.js';
import { SqlSchemaGenerator } from './schema/SqlSchemaGenerator.js';
import { type SchemaHelper } from './schema/SchemaHelper.js';
import type { IndexDef } from './typings.js';
import { NativeQueryBuilder } from './query/NativeQueryBuilder.js';

export abstract class AbstractSqlPlatform extends Platform {
  protected readonly schemaHelper?: SchemaHelper;

  override usesPivotTable(): boolean {
    return true;
  }

  override indexForeignKeys(): boolean {
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

  /* v8 ignore next: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): SqlSchemaGenerator {
    return new SqlSchemaGenerator(em ?? (driver as any));
  }

  /** @internal */
  /* v8 ignore next */
  createNativeQueryBuilder(): NativeQueryBuilder {
    return new NativeQueryBuilder(this);
  }

  getBeginTransactionSQL(options?: { isolationLevel?: IsolationLevel; readOnly?: boolean }): string[] {
    if (options?.isolationLevel) {
      return [`set transaction isolation level ${options.isolationLevel}`, 'begin'];
    }

    return ['begin'];
  }

  getCommitTransactionSQL(): string {
    return 'commit';
  }

  getRollbackTransactionSQL(): string {
    return 'rollback';
  }

  getSavepointSQL(savepointName: string): string {
    return `savepoint ${this.quoteIdentifier(savepointName)}`;
  }

  getRollbackToSavepointSQL(savepointName: string): string {
    return `rollback to savepoint ${this.quoteIdentifier(savepointName)}`;
  }

  getReleaseSavepointSQL(savepointName: string): string {
    return `release savepoint ${this.quoteIdentifier(savepointName)}`;
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

  override getSearchJsonPropertySQL(path: string, type: string, aliased: boolean): string | RawQueryFragment {
    return this.getSearchJsonPropertyKey(path.split('->'), type, aliased);
  }

  override getSearchJsonPropertyKey(
    path: string[],
    type: string,
    aliased: boolean,
    value?: unknown,
  ): string | RawQueryFragment {
    const [a, ...b] = path;
    const quoteKey = (key: string) => (/^[a-z]\w*$/i.exec(key) ? key : `"${key}"`);

    if (aliased) {
      return raw(alias => `json_extract(${this.quoteIdentifier(`${alias}.${a}`)}, '$.${b.map(quoteKey).join('.')}')`);
    }

    return raw(`json_extract(${this.quoteIdentifier(a)}, '$.${b.map(quoteKey).join('.')}')`);
  }

  override getJsonIndexDefinition(index: IndexDef): string[] {
    return index.columnNames.map(column => {
      if (!column.includes('.')) {
        return column;
      }

      const [root, ...path] = column.split('.');
      return `(json_extract(${root}, '$.${path.join('.')}'))`;
    });
  }

  override supportsUnionWhere(): boolean {
    return true;
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
  getOrderByExpression(column: string, direction: string, collation?: string): string[] {
    if (collation) {
      return [`${column} collate ${this.quoteCollation(collation)} ${direction.toLowerCase()}`];
    }

    return [`${column} ${direction.toLowerCase()}`];
  }

  /**
   * Quotes a collation name for use in COLLATE clauses.
   * @internal
   */
  quoteCollation(collation: string): string {
    this.validateCollationName(collation);
    return this.quoteIdentifier(collation);
  }

  /** @internal */
  protected validateCollationName(collation: string): void {
    if (!/^[\w]+$/.test(collation)) {
      throw new Error(`Invalid collation name: '${collation}'. Collation names must contain only word characters.`);
    }
  }

  /**
   * Returns FROM clause for JSON array iteration.
   * Default implementation uses SQLite's json_each.
   * @internal
   */
  getJsonArrayFromSQL(column: string, alias: string, _properties: { name: string; type: string }[]): string {
    return `json_each(${column}) as ${this.quoteIdentifier(alias)}`;
  }

  /**
   * Returns SQL expression to access an element's property within a JSON array iteration.
   * Default implementation uses SQLite's json_extract on the value.
   * @internal
   */
  getJsonArrayElementPropertySQL(alias: string, property: string, _type: string): string {
    return `json_extract(${this.quoteIdentifier(alias)}.value, '$.${property}')`;
  }

  /**
   * Maps a runtime type name (e.g. 'string', 'number') to a driver-specific bind type constant.
   * Used by NativeQueryBuilder for output bindings.
   * @internal
   */
  mapToBindType(type: string): unknown {
    return type;
  }
}
