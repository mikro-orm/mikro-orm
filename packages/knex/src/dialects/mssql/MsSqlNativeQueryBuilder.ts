import { LockMode, QueryFlag, RawQueryFragment, Utils } from '@mikro-orm/core';
import { NativeQueryBuilder } from '../../query/NativeQueryBuilder.js';
import { QueryType } from '../../query/enums.js';

/** @internal */
export class MsSqlNativeQueryBuilder extends NativeQueryBuilder {

  override compile(): { sql: string; params: unknown[] } {
    if (!this.type) {
      throw new Error('No query type provided');
    }

    this.parts.length = 0;
    this.params.length = 0;

    if (this.options.flags?.has(QueryFlag.IDENTITY_INSERT)) {
      this.parts.push(`set identity_insert ${this.getTableName()} on;`);
    }

    if (this.options.comment) {
      this.parts.push(...this.options.comment.map(comment => `/* ${comment} */`));
    }

    if (this.options.onConflict && !Utils.isEmpty(Utils.asArray(this.options.data)[0])) {
      this.compileUpsert();
    } else {
      switch (this.type) {
        case QueryType.SELECT:
        case QueryType.COUNT: this.compileSelect(); break;
        case QueryType.INSERT: this.compileInsert(); break;
        case QueryType.UPDATE: this.compileUpdate(); break;
        case QueryType.DELETE: this.compileDelete(); break;
        case QueryType.TRUNCATE: this.compileTruncate(); break;
      }

      if ([QueryType.INSERT, QueryType.UPDATE, QueryType.DELETE].includes(this.type)) {
        this.parts[this.parts.length - 1] += '; select @@rowcount;';
      }
    }

    if (this.options.flags?.has(QueryFlag.IDENTITY_INSERT)) {
      this.parts.push(`set identity_insert ${this.getTableName()} off;`);
    }

    return this.combineParts();
  }

  private compileUpsert() {
    const clause = this.options.onConflict!;
    const dataAsArray = Utils.asArray(this.options.data);
    const keys = Object.keys(dataAsArray[0]);
    const values = keys.map(() => '?');
    const parts = [];

    for (const data of dataAsArray) {
      for (const key of keys) {
        this.params.push(data![key]);
      }

      parts.push(`(${values.join(', ')})`);
    }

    this.parts.push(`merge into ${this.getTableName()}`);
    this.parts.push(`using (values ${parts.join(', ')}) as tsource(${keys.map(key => this.quote(key)).join(', ')})`);

    if (clause.fields instanceof RawQueryFragment) {
      this.parts.push(clause.fields.sql);
      this.params.push(...clause.fields.params);
    } else if (clause.fields.length > 0) {
      const fields = clause.fields.map(field => {
        const col = this.quote(field);
        return `${this.getTableName()}.${col} = tsource.${col}`;
      });
      this.parts.push(`on ${fields.join(' and ')}`);
    }

    const sourceColumns = keys.map(field => `tsource.${this.quote(field)}`).join(', ');
    const destinationColumns = keys.map(field => this.quote(field)).join(', ');

    this.parts.push(`when not matched then insert (${destinationColumns}) values (${sourceColumns})`);

    if (!clause.ignore) {
      this.parts.push('when matched');

      if (clause.where) {
        this.parts.push(`and ${clause.where.sql}`);
        this.params.push(...clause.where.params);
      }

      this.parts.push('then update set');

      if (!clause.merge || Array.isArray(clause.merge)) {
        const parts = keys.map((column: any) => `${this.quote(column)} = tsource.${this.quote(column)}`);
        this.parts.push(parts.join(', '));
      } else if (typeof clause.merge === 'object') {
        const parts = Object.entries(clause.merge).map(([key, value]) => {
          this.params.push(value);
          return `${this.getTableName()}.${this.quote(key)} = ?`;
        });
        this.parts.push(parts.join(', '));
      }
    }

    this.addOutputClause('inserted');
    this.parts[this.parts.length - 1] += ';';
  }

  protected override compileSelect() {
    this.parts.push('select');

    if (this.options.limit != null && this.options.offset == null) {
      this.parts.push(`top (?)`);
      this.params.push(this.options.limit);
    }

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

  protected override addLockClause() {
    if (!this.options.lockMode || ![LockMode.PESSIMISTIC_READ, LockMode.PESSIMISTIC_WRITE].includes(this.options.lockMode)) {
      return;
    }

    const map = {
      [LockMode.PESSIMISTIC_READ]: 'with (holdlock)',
      [LockMode.PESSIMISTIC_WRITE]: 'with (updlock)',
    } as const;

    if (this.options.lockMode !== LockMode.OPTIMISTIC) {
      this.parts.push(map[this.options.lockMode as keyof typeof map]);
    }
  }

  protected override compileTruncate() {
    const tableName = this.getTableName();
    const sql = `delete from ${tableName}; declare @count int = case @@rowcount when 0 then 1 else 0 end; dbcc checkident ('${tableName.replace(/[[\]]/g, '')}', reseed, @count)`;
    this.parts.push(sql);
  }

}
