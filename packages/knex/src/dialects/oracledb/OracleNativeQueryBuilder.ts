import { raw, RawQueryFragment } from '@mikro-orm/core';
import { NativeQueryBuilder, type TableOptions } from '../../query/NativeQueryBuilder.js';

/** @internal */
export class OracleNativeQueryBuilder extends NativeQueryBuilder {

  override as(alias: string): this {
    this.wrap('(', `) ${this.platform.quoteIdentifier(alias)}`);
    return this;
  }

  override from(tableName: string | RawQueryFragment | NativeQueryBuilder, options?: TableOptions) {
    if (tableName instanceof NativeQueryBuilder) {
      const { sql, params } = tableName.compile();
      tableName = raw(sql, params);
    }

    if (typeof tableName === 'string') {
      const alias = options?.alias ? ` ${this.platform.quoteIdentifier(options.alias)}` : '';
      const schema = options?.schema && options.schema !== this.platform.getDefaultSchemaName() ? `${options.schema}.` : '';
      tableName = this.quote(schema + tableName) + alias;
    }

    this.options.tableName = tableName as string | RawQueryFragment;
    this.options.indexHint = options?.indexHint;

    return this;
  }

  protected override compileSelect() {
    this.parts.push('select');

    this.addHintComment();
    this.parts.push(`${this.getFields()} from ${this.getTableName()}`);
    this.addLockClause();

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

    if (this.options.limit != null && this.options.offset == null) {
      if (!this.options.where?.sql.trim()) {
        this.parts.push('where');
      } else {
        this.parts.push('and');
      }

      this.parts.push('rownum <= ?');
      this.params.push(this.options.limit);
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

    if (this.options.offset != null) {
      /* v8 ignore next 3 */
      if (!this.options.orderBy) {
        throw new Error('Order by clause is required for pagination');
      }

      this.parts.push(`offset ? rows`);
      this.params.push(this.options.offset);

      if (this.options.limit != null) {
        this.parts.push(`fetch next ? rows only`);
        this.params.push(this.options.limit);
      }
    }
  }

  protected override quote(id: string | RawQueryFragment | NativeQueryBuilder): string {
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

      return `${a} ${b}`;
    }

    if (id === '*') {
      return id;
    }

    return this.platform.quoteIdentifier(id);
  }

}
