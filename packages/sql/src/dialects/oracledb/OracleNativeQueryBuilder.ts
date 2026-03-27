import { type Dictionary, raw, RawQueryFragment, Utils } from '@mikro-orm/core';
import { QueryType } from '../../query/enums.js';
import { NativeQueryBuilder } from '../../query/NativeQueryBuilder.js';

/** @internal */
export function markOutBindings(obj: Dictionary): void {
  Object.defineProperty(obj, '__outBindings', {
    value: true,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

/** @internal */
export class OracleNativeQueryBuilder extends NativeQueryBuilder {
  override as(alias: string): this {
    this.wrap('(', `) ${this.platform.quoteIdentifier(alias)}`);
    return this;
  }

  override compile(): { sql: string; params: unknown[] } {
    if (!this.type) {
      throw new Error('No query type provided');
    }

    this.parts.length = 0;
    this.params.length = 0;

    /* v8 ignore next 3: query comment branch */
    if (this.options.comment) {
      this.parts.push(...this.options.comment.map(comment => `/* ${comment} */`));
    }

    let copy!: any[];

    if (this.options.onConflict && !Utils.isEmpty(Utils.asArray(this.options.data)[0])) {
      this.compileUpsert();
    } else {
      if (this.options.returning && Array.isArray(this.options.data) && this.options.data.length > 1) {
        copy = [...this.options.data];
        this.options.data.length = 1;
      }

      switch (this.type) {
        case QueryType.SELECT:
        case QueryType.COUNT:
          this.compileSelect();
          break;
        case QueryType.INSERT:
          this.compileInsert();
          break;
        case QueryType.UPDATE:
          this.compileUpdate();
          break;
        case QueryType.DELETE:
          this.compileDelete();
          break;
        case QueryType.TRUNCATE:
          this.compileTruncate();
          break;
      }

      this.addOnConflictClause();
    }

    if (this.options.returning) {
      const isUpsert = this.options.onConflict && !Utils.isEmpty(Utils.asArray(this.options.data)[0]);
      const prefix = isUpsert ? `${this.getTableName()}.` : '';
      const fields = this.options.returning.map(field => prefix + this.quote(Array.isArray(field) ? field[0] : field));
      const into = this.options.returning.map(field => ':out_' + (Array.isArray(field) ? field[0] : field));
      const outBindings = this.options.returning.map(field => {
        const name = 'out_' + (Array.isArray(field) ? field[0] : field);
        const type = Array.isArray(field) ? field[1] : 'string';
        return [name, type];
      });
      markOutBindings(outBindings);
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
    const blockLines: string[] = [];
    const block2Lines: string[] = [];
    const keys = Object.keys(copy[0]);
    const last = this.params[this.params.length - 1];

    /* v8 ignore next 3: defensive check — output bindings are always set by compile() */
    if (!Array.isArray(last) || !('__outBindings' in last) || !last.__outBindings) {
      throw new Error('Output bindings are required for multi insert with returning');
    }

    const outBindings: Dictionary = {};
    markOutBindings(outBindings);

    for (let i = 0; i < copy.length; i++) {
      const params: unknown[] = [];

      for (const key of keys) {
        /* v8 ignore next 3: undefined value branch in multi-insert */
        if (typeof copy[i][key] === 'undefined') {
          params.push(this.platform.usesDefaultKeyword() ? raw('default') : null);
        } else {
          params.push(copy[i][key]);
        }
      }

      // we need to interpolate to allow proper escaping
      const formatted = this.platform.formatQuery(sql, params).replaceAll(`'`, `''`);
      /* v8 ignore next 3: returning field type branches */
      const using = this.options.returning!.map(field => {
        const name = Array.isArray(field) ? field[0] : field;
        const type = Array.isArray(field) ? (field[1] as string) : 'string';
        outBindings[`out_${name}__${i}`] = {
          dir: this.platform.mapToBindType('out'),
          type: this.platform.mapToBindType(type),
        };

        return `out :out_${name}__${i}`;
      });
      blockLines.push(` execute immediate '${formatted}' using ${using.join(', ')};`);
      block2Lines.push(` execute immediate '${sql}' using ${using.join(', ')};`);
    }

    const block = `begin\n${blockLines.join('\n')}\n end;`;
    const block2 = `begin\n${block2Lines.join('\n')}\n end;`;

    // save raw query without interpolation for logging,
    Object.defineProperty(outBindings, '__rawQuery', {
      value: block2,
      writable: true,
      configurable: true,
      enumerable: false,
    });

    this.options.data = copy;
    return { sql: block, params: [outBindings] };
  }

  protected override compileTruncate() {
    super.compileTruncate();
    this.parts.push('drop all storage cascade');
  }

  protected override combineParts(): { sql: string; params: unknown[] } {
    let sql = this.parts.join(' ');
    const last = this.params[this.params.length - 1];

    if (this.options.wrap) {
      const [a, b] = this.options.wrap;
      sql = `${a}${sql}${b}`;
    }

    if (!(Array.isArray(last) && '__outBindings' in last && last.__outBindings)) {
      return { sql, params: this.params };
    }

    const out = this.params.pop() as [string, string][];
    const outBindings: Dictionary = {};
    markOutBindings(outBindings);
    this.params.push(outBindings);

    for (const item of out) {
      outBindings[item[0]] = {
        dir: this.platform.mapToBindType('out'),
        type: this.platform.mapToBindType(item[1]),
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

      parts.push(`select ${keys.map(k => `? as ${this.quote(k)}`).join(', ')} from dual`);
    }

    this.parts.push(`merge into ${this.getTableName()}`);
    this.parts.push(`using (${parts.join(' union all ')}) tsource`);

    /* v8 ignore next 4: RawQueryFragment conflict fields branch */
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
      /* v8 ignore next: merge type branch */
      if (!clause.merge || Array.isArray(clause.merge)) {
        const mergeParts = (clause.merge || keys)
          .filter(field => !Array.isArray(clause.fields) || !clause.fields.includes(field))
          .filter((field: any) => keys.includes(field)) // only reference columns present in the source data
          .map((column: any) => `${this.quote(column)} = tsource.${this.quote(column)}`);

        /* v8 ignore next 10: empty mergeParts branch */
        if (mergeParts.length > 0) {
          this.parts.push('when matched');

          if (clause.where) {
            this.parts.push(`and ${clause.where.sql}`);
            this.params.push(...clause.where.params);
          }

          this.parts.push('then update set');
          this.parts.push(mergeParts.join(', '));
        }
      } /* v8 ignore start: object-form merge branch */ else if (typeof clause.merge === 'object') {
        this.parts.push('when matched');

        if (clause.where) {
          this.parts.push(`and ${clause.where.sql}`);
          this.params.push(...clause.where.params);
        }

        this.parts.push('then update set');
        const parts = Object.entries(clause.merge).map(([key, value]) => {
          this.params.push(value);
          return `${this.getTableName()}.${this.quote(key)} = ?`;
        });
        this.parts.push(parts.join(', '));
      }
      /* v8 ignore stop */
    }
  }

  protected override compileSelect() {
    const wrapCountSubquery = this.needsCountSubquery();

    if (wrapCountSubquery) {
      this.parts.push(`select count(*) as ${this.quote('count')} from (`);
    }

    this.parts.push('select');

    this.addHintComment();
    this.parts.push(`${this.getFields(wrapCountSubquery)} from ${this.getTableName()}`);

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

    if (!wrapCountSubquery) {
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

    if (wrapCountSubquery) {
      const asKeyword = this.platform.usesAsKeyword() ? ' as ' : ' ';
      this.parts.push(`)${asKeyword}${this.quote('dcnt')}`);
    }
  }
}
