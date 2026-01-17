import { type Dictionary, raw, RawQueryFragment, Utils } from '@mikro-orm/core';
import { QueryType } from '../../query/enums.js';
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

  override compile(): { sql: string; params: unknown[] } {
    if (!this.type) {
      throw new Error('No query type provided');
    }

    this.parts.length = 0;
    this.params.length = 0;

    if (this.options.comment) {
      this.parts.push(...this.options.comment.map(comment => `/* ${comment} */`));
    }

    if (this.options.onConflict && !Utils.isEmpty(Utils.asArray(this.options.data)[0])) {
      this.compileUpsert();
      return this.combineParts();
    }

    let copy!: any[];

    if (this.options.returning && Array.isArray(this.options.data) && this.options.data.length > 1) {
      copy = [...this.options.data];
      this.options.data.length = 1;
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

    if (this.options.returning) {
      const fields = this.options.returning.map(field => this.quote(Array.isArray(field) ? field[0] : field));
      const into = this.options.returning.map(field => ':out_' + (Array.isArray(field) ? field[0] : field));
      const outBindings = this.options.returning.map(field => {
        const name = 'out_' + (Array.isArray(field) ? field[0] : field);
        const type = Array.isArray(field) ? field[1] : 'string';
        return [name, type];
      });
      Object.defineProperty(outBindings, '__outBindings', { value: true, writable: true, configurable: true, enumerable: false });
      this.parts.push(`returning ${fields.join(', ')}`);
      this.parts.push(`into ${into.join(', ')}`);
      this.params.push(outBindings);
    }

    this.addLockClause();

    if (!copy) {
      return this.combineParts();
    }

    // multi insert with returning
    const sql = this.parts.join(' ');
    let block = 'begin\n';
    let block2 = 'begin\n';
    const keys = Object.keys(copy[0]);
    const last = this.params[this.params.length - 1];

    /* v8 ignore next 3 */
    if (!Array.isArray(last) || !('__outBindings' in last) || !last.__outBindings) {
      throw new Error('Output bindings are required for multi insert with returning');
    }

    const outBindings: Dictionary = {};
    Object.defineProperty(outBindings, '__outBindings', { value: true, writable: true, configurable: true, enumerable: false });

    for (let i = 0; i < copy.length; i++) {
      const params: unknown[] = [];

      for (const key of keys) {
        if (typeof copy[i][key] === 'undefined') {
          params.push(this.platform.usesDefaultKeyword() ? raw('default') : null);
        } else {
          params.push(copy[i][key]);
        }
      }

      // we need to interpolate to allow proper escaping
      const formatted = this.platform.formatQuery(sql, params).replaceAll(`'`, `''`);
      const mapToOracleType = (this.platform as any).mapToOracleType; // we can't import it here
      const using = this.options.returning!.map(field => {
        const name = Array.isArray(field) ? field[0] : field;
        const type = Array.isArray(field) ? field[1] as string : 'string';
        outBindings[`out_${name}__${i}`] = {
          dir: mapToOracleType('out'),
          type: mapToOracleType(type),
        };

        return `out :out_${name}__${i}`;
      });
      block += ` execute immediate '${formatted}' using ${using.join(', ')};\n`;
      block2 += ` execute immediate '${sql}' using ${using.join(', ')};\n`;
    }

    block += ' end;';
    block2 += ' end;';

    // save raw query without interpolation for logging,
    Object.defineProperty(outBindings, '__rawQuery', { value: block2, writable: true, configurable: true, enumerable: false });

    return { sql: block, params: [outBindings] };
  }

  protected override compileTruncate() {
    super.compileTruncate();
    this.parts.push('drop all storage cascade');
  }

  protected override combineParts() {
    let sql = this.parts.join(' ');
    const last = this.params[this.params.length - 1];
    const mapToOracleType = (this.platform as any).mapToOracleType; // we can't import it here

    if (this.options.wrap) {
      const [a, b] = this.options.wrap;
      sql = `${a}${sql}${b}`;
    }

    if (!(Array.isArray(last) && '__outBindings' in last && last.__outBindings)) {
      return { sql, params: this.params };
    }

    const out = this.params.pop() as [string, string][];
    const outBindings: Dictionary = {};
    Object.defineProperty(outBindings, '__outBindings', { value: true, writable: true, configurable: true, enumerable: false });
    this.params.push(outBindings);

    for (const item of out) {
      outBindings[item[0]] = {
        dir: mapToOracleType('out'),
        type: mapToOracleType(item[1]),
      };
    }

    return { sql, params: this.params };
  }

  private compileUpsert() {
    const clause = this.options.onConflict!;
    const dataAsArray = Utils.asArray(this.options.data);
    const keys = Object.keys(dataAsArray[0]);
    const parts = [];

    for (const data of dataAsArray) {
      for (const key of keys) {
        this.params.push(data![key]);
      }

      parts.push(keys.map(k => `? as ${this.quote(k)}`).join(', '));
    }

    this.parts.push(`merge into ${this.getTableName()}`);
    this.parts.push(`using (select ${parts.join(', ')} from dual) tsource`);

    if (clause.fields instanceof RawQueryFragment) {
      this.parts.push(clause.fields.sql);
      this.params.push(...clause.fields.params);
    } else if (clause.fields.length > 0) {
      const fields = clause.fields.map(field => {
        const col = this.quote(field);
        return `${this.getTableName()}.${col} = tsource.${col}`;
      });
      this.parts.push(`on (${fields.join(' and ')})`);
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
        const parts = (clause.merge || keys)
          .filter(field => !Array.isArray(clause.fields) || !clause.fields.includes(field))
          .map((column: any) => `${this.quote(column)} = tsource.${this.quote(column)}`);
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

    if (this.options.offset != null) {
      this.parts.push(`offset ? rows`);
      this.params.push(this.options.offset);
    }

    if (this.options.limit != null) {
      this.parts.push(`fetch next ? rows only`);
      this.params.push(this.options.limit);
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
