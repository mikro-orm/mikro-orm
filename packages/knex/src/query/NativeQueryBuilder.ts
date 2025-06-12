import { type Dictionary, LockMode, type QueryFlag, raw, RawQueryFragment, Utils } from '@mikro-orm/core';
import { QueryType } from './enums.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';

interface Options {
  tableName?: string | RawQueryFragment;
  indexHint?: string;
  select?: (string | RawQueryFragment)[];
  distinct?: boolean;
  distinctOn?: string[];
  joins?: { sql: string; params: unknown[] }[];
  groupBy?: (string | RawQueryFragment)[];
  where?: { sql: string; params: unknown[] };
  having?: { sql: string; params: unknown[] };
  orderBy?: string;
  limit?: number;
  offset?: number;
  data?: Dictionary;
  onConflict?: OnConflictClause;
  lockMode?: LockMode;
  lockTables?: string[];
  returning?: (string | RawQueryFragment | [name: string, type: unknown])[];
  comment?: string[];
  hintComment?: string[];
  flags?: Set<QueryFlag>;
  wrap?: [prefix: string, suffix: string];
}

export interface TableOptions {
  schema?: string;
  indexHint?: string;
  alias?: string;
}

interface OnConflictClause {
  fields: string[] | RawQueryFragment;
  ignore?: boolean;
  merge?: Dictionary | (string | RawQueryFragment)[];
  where?: { sql: string; params: unknown[] };
}

/** @internal */
export class NativeQueryBuilder {

  protected type?: QueryType;
  protected parts: string[] = [];
  protected params: unknown[] = [];
  protected options: Options = {};

  constructor(
    protected readonly platform: AbstractSqlPlatform,
  ) {}

  select(fields: string | RawQueryFragment | (string | RawQueryFragment)[]) {
    this.type = QueryType.SELECT;
    this.options.select ??= [];
    this.options.select.push(...Utils.asArray(fields));
    return this;
  }

  count(fields: string | RawQueryFragment | (string | RawQueryFragment)[] = '*', distinct?: boolean) {
    this.type = QueryType.COUNT;
    this.options.select = Utils.asArray(fields);
    this.options.distinct = distinct;
    return this;
  }

  into(tableName: string | RawQueryFragment | NativeQueryBuilder, options?: TableOptions) {
    return this.from(tableName, options);
  }

  from(tableName: string | RawQueryFragment | NativeQueryBuilder, options?: TableOptions) {
    if (tableName instanceof NativeQueryBuilder) {
      const { sql, params } = tableName.compile();
      tableName = raw(sql, params);
    }

    if (typeof tableName === 'string') {
      const alias = options?.alias ? ` as ${this.platform.quoteIdentifier(options.alias)}` : '';
      const schema = options?.schema && options.schema !== this.platform.getDefaultSchemaName() ? `${options.schema}.` : '';
      tableName = this.quote(schema + tableName) + alias;
    }

    this.options.tableName = tableName as string | RawQueryFragment;
    this.options.indexHint = options?.indexHint;

    return this;
  }

  where(sql: string, params: unknown[]) {
    this.options.where = { sql, params };
    return this;
  }

  having(sql: string, params: unknown[]) {
    this.options.having = { sql, params };
    return this;
  }

  groupBy(groupBy: (string | RawQueryFragment)[]) {
    this.options.groupBy = groupBy;
    return this;
  }

  join(sql: string, params: unknown[]) {
    this.options.joins ??= [];
    this.options.joins!.push({ sql, params });
    return this;
  }

  orderBy(orderBy: string) {
    this.options.orderBy = orderBy;
    return this;
  }

  toString(): string {
    const { sql, params } = this.compile();
    return this.platform.formatQuery(sql, params);
  }

  compile(): { sql: string; params: unknown[] } {
    if (!this.type) {
      throw new Error('No query type provided');
    }

    this.parts.length = 0;
    this.params.length = 0;

    if (this.options.comment) {
      this.parts.push(...this.options.comment.map(comment => `/* ${comment} */`));
    }

    switch (this.type) {
      case QueryType.SELECT:
      case QueryType.COUNT: this.compileSelect(); break;
      case QueryType.INSERT: this.compileInsert(); break;
      case QueryType.UPDATE: this.compileUpdate(); break;
      case QueryType.DELETE: this.compileDelete(); break;
      case QueryType.TRUNCATE: this.compileTruncate(); break;
    }

    this.addOnConflictClause();

    if (this.options.returning && this.platform.usesReturningStatement()) {
      const fields = this.options.returning.map(field => this.quote(field as string));
      this.parts.push(`returning ${fields.join(', ')}`);
    }

    this.addLockClause();

    return this.combineParts();
  }

  protected addLockClause() {
    if (!this.options.lockMode) {
      return;
    }

    if ([LockMode.PESSIMISTIC_READ, LockMode.PESSIMISTIC_PARTIAL_READ, LockMode.PESSIMISTIC_READ_OR_FAIL].includes(this.options.lockMode)) {
      this.parts.push('for share');
    }

    if ([LockMode.PESSIMISTIC_WRITE, LockMode.PESSIMISTIC_PARTIAL_WRITE, LockMode.PESSIMISTIC_WRITE_OR_FAIL].includes(this.options.lockMode)) {
      this.parts.push('for update');
    }

    if (this.options.lockTables?.length) {
      const fields = this.options.lockTables.map(field => this.quote(field));
      this.parts.push(`of ${fields.join(', ')}`);
    }

    if ([LockMode.PESSIMISTIC_PARTIAL_READ, LockMode.PESSIMISTIC_PARTIAL_WRITE].includes(this.options.lockMode)) {
      this.parts.push('skip locked');
    }

    if ([LockMode.PESSIMISTIC_READ_OR_FAIL, LockMode.PESSIMISTIC_WRITE_OR_FAIL].includes(this.options.lockMode)) {
      this.parts.push('nowait');
    }
  }

  protected addOnConflictClause() {
    const clause = this.options.onConflict;

    if (!clause) {
      return;
    }

    this.parts.push('on conflict');

    if (clause.fields instanceof RawQueryFragment) {
      this.parts.push(clause.fields.sql);
      this.params.push(...clause.fields.params);
    } else if (clause.fields.length > 0) {
      const fields = clause.fields.map(field => this.quote(field));
      this.parts.push(`(${fields.join(', ')})`);
    }

    if (clause.ignore) {
      this.parts.push('do nothing');
    }

    if (Utils.isObject(clause.merge)) {
      this.parts.push('do update set');
      const fields = Object.keys(clause.merge).map(field => {
        this.params.push((clause.merge as Dictionary)[field]);
        return `${this.quote(field)} = ?`;
      });
      this.parts.push(fields.join(', '));
    } else if (clause.merge) {
      this.parts.push('do update set');

      if ((clause.merge as string[]).length) {
        const fields = (clause.merge as string[]).map(field => `${this.quote(field)} = excluded.${this.quote(field)}`);
        this.parts.push(fields.join(', '));
      } else {
        const dataAsArray = Utils.asArray(this.options.data);
        const keys = Object.keys(dataAsArray[0]);
        const fields = keys.map(field => `${this.quote(field)} = excluded.${this.quote(field)}`);
        this.parts.push(fields.join(', '));
      }
    }

    if (clause.where) {
      this.parts.push(`where ${clause.where.sql}`);
      this.params.push(...clause.where.params);
    }
  }

  protected combineParts() {
    let sql = this.parts.join(' ');

    if (this.options.wrap) {
      const [a, b] = this.options.wrap;
      sql = `${a}${sql}${b}`;
    }

    return { sql, params: this.params };
  }

  limit(limit: number) {
    this.options.limit = limit;
    return this;
  }

  offset(offset: number) {
    this.options.offset = offset;
    return this;
  }

  insert(data: Dictionary) {
    this.type = QueryType.INSERT;
    this.options.data = data;
    return this;
  }

  update(data: Dictionary) {
    this.type = QueryType.UPDATE;
    this.options.data ??= {};
    Object.assign(this.options.data, data);

    return this;
  }

  delete() {
    this.type = QueryType.DELETE;
    return this;
  }

  truncate() {
    this.type = QueryType.TRUNCATE;
    return this;
  }

  distinct() {
    this.options.distinct = true;
    return this;
  }

  distinctOn(fields: string[]) {
    this.options.distinctOn = fields;
    return this;
  }

  onConflict(options: OnConflictClause) {
    this.options.onConflict = options;
    return options;
  }

  returning(fields: (string | RawQueryFragment | [name: string, type: unknown])[]) {
    this.options.returning = fields;
    return this;
  }

  lockMode(lockMode: LockMode, lockTables?: string[]) {
    this.options.lockMode = lockMode;
    this.options.lockTables = lockTables;
    return this;
  }

  comment(comment: string | string[]) {
    this.options.comment ??= [];
    this.options.comment.push(...Utils.asArray(comment));
    return this;
  }

  hintComment(comment: string | string[]) {
    this.options.hintComment ??= [];
    this.options.hintComment.push(...Utils.asArray(comment));
    return this;
  }

  setFlags(flags: Set<QueryFlag>) {
    this.options.flags = flags;
    return this;
  }

  clear(clause: keyof Options) {
    delete this.options[clause];
    return this;
  }

  wrap(prefix: string, suffix: string) {
    this.options.wrap = [prefix, suffix];
    return this;
  }

  as(alias: string) {
    this.wrap('(', `) as ${this.platform.quoteIdentifier(alias)}`);
    return this;
  }

  toRaw(): RawQueryFragment {
    const { sql, params } = this.compile();
    return raw(sql, params);
  }

  protected compileSelect() {
    this.parts.push('select');
    this.addHintComment();
    this.parts.push(`${this.getFields()} from ${this.getTableName()}`);

    if (this.options.joins) {
      for (const join of this.options.joins) {
        this.parts.push(join.sql);
        this.params.push(...join.params);
      }
    }

    if (this.options.where?.sql.trim()) {
      this.parts.push(`where ${this.options.where.sql}`);
      this.params.push(...this.options.where.params);
    }

    if (this.options.groupBy) {
      const fields = this.options.groupBy.map(field => this.quote(field));
      this.parts.push(`group by ${fields.join(', ')}`);
    }

    if (this.options.having) {
      this.parts.push(`having ${this.options.having.sql}`);
      this.params.push(...this.options.having.params);
    }

    if (this.options.orderBy) {
      this.parts.push(`order by ${this.options.orderBy}`);
    }

    if (this.options.limit != null) {
      this.parts.push(`limit ?`);
      this.params.push(this.options.limit);
    }

    if (this.options.offset != null) {
      this.parts.push(`offset ?`);
      this.params.push(this.options.offset);
    }
  }

  protected getFields() {
    if (!this.options.select || this.options.select.length === 0) {
      throw new Error('No fields selected');
    }

    let fields = this.options.select.map(field => this.quote(field)).join(', ');

    if (this.options.distinct) {
      fields = `distinct ${fields}`;
    } else if (this.options.distinctOn) {
      fields = `distinct on (${this.options.distinctOn.map(field => this.quote(field)).join(', ')}) ${fields}`;
    }

    if (this.type === QueryType.COUNT) {
      fields = `count(${fields}) as ${this.quote('count')}`;
    }

    return fields;
  }

  protected compileInsert() {
    if (!this.options.data) {
      throw new Error('No data provided');
    }

    this.parts.push('insert');
    this.addHintComment();
    this.parts.push(`into ${this.getTableName()}`);

    if (Object.keys(this.options.data).length === 0) {
      this.addOutputClause('inserted');
      this.parts.push('default values');
      return;
    }

    const parts = this.processInsertData();
    this.parts.push(parts.join(', '));
  }

  protected addOutputClause(type: 'inserted' | 'deleted') {
    if (this.options.returning && this.platform.usesOutputStatement()) {
      const fields = this.options.returning.map(field => `${type}.${this.quote(field as string)}`);
      this.parts.push(`output ${fields.join(', ')}`);
    }
  }

  protected processInsertData() {
    const dataAsArray = Utils.asArray(this.options.data);
    const keys = Object.keys(dataAsArray[0]);
    const values = keys.map(() => '?');
    const parts = [];
    this.parts.push(`(${keys.map(key => this.quote(key)).join(', ')})`);
    this.addOutputClause('inserted');
    this.parts.push('values');

    for (const data of dataAsArray) {
      for (const key of keys) {
        if (typeof data[key] === 'undefined') {
          this.params.push(this.platform.usesDefaultKeyword() ? raw('default') : null);
        } else {
          this.params.push(data[key]);
        }
      }

      parts.push(`(${values.join(', ')})`);
    }

    return parts;
  }

  protected compileUpdate() {
    if (!this.options.data || Object.keys(this.options.data).length === 0) {
      throw new Error('No data provided');
    }

    this.parts.push('update');
    this.addHintComment();
    this.parts.push(this.getTableName());

    if (this.options.joins) {
      for (const join of this.options.joins) {
        this.parts.push(join.sql);
        this.params.push(...join.params);
      }
    }

    this.parts.push('set');

    if (this.options.data) {
      const parts: string[] = [];

      for (const key of Object.keys(this.options.data)) {
        parts.push(`${this.quote(key)} = ?`);
        this.params.push(this.options.data![key]);
      }

      this.parts.push(parts.join(', '));
    }

    this.addOutputClause('inserted');

    if (this.options.where?.sql.trim()) {
      this.parts.push(`where ${this.options.where.sql}`);
      this.params.push(...this.options.where.params);
    }
  }

  protected compileDelete() {
    this.parts.push('delete');
    this.addHintComment();
    this.parts.push(`from ${this.getTableName()}`);
    this.addOutputClause('deleted');

    if (this.options.where?.sql.trim()) {
      this.parts.push(`where ${this.options.where.sql}`);
      this.params.push(...this.options.where.params);
    }
  }

  protected compileTruncate() {
    const sql = `truncate table ${this.getTableName()}`;
    this.parts.push(sql);
  }

  protected addHintComment() {
    if (this.options.hintComment) {
      this.parts.push(`/*+ ${this.options.hintComment.join(' ')} */`);
    }
  }

  protected getTableName(): string {
    if (!this.options.tableName) {
      throw new Error('No table name provided');
    }

    const indexHint = this.options.indexHint ? ' ' + this.options.indexHint : '';

    if (this.options.tableName instanceof RawQueryFragment) {
      this.params.push(...this.options.tableName.params);
      return this.options.tableName.sql + indexHint;
    }

    return this.options.tableName + indexHint;
  }

  protected quote(id: string | RawQueryFragment | NativeQueryBuilder): string {
    if (id instanceof RawQueryFragment) {
      return this.platform.formatQuery(id.sql, id.params);
    }

    if (id instanceof NativeQueryBuilder) {
      const { sql, params } = id.compile();
      return this.platform.formatQuery(sql, params);
    }

    if (id.endsWith('.*')) {
      const schema = this.platform.quoteIdentifier(id.substring(0, id.indexOf('.')));
      return schema + '.*';
    }

    if (id.toLowerCase().includes(' as ')) {
      const parts = id.split(/ as /i);
      const a = this.platform.quoteIdentifier(parts[0]);
      const b = this.platform.quoteIdentifier(parts[1]);

      return `${a} as ${b}`;
    }

    if (id === '*') {
      return id;
    }

    return this.platform.quoteIdentifier(id);
  }

}
