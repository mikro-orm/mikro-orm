/* istanbul ignore file */
import { MonkeyPatchable } from '../../MonkeyPatchable';
import { Utils } from '@mikro-orm/core';

// upsert support from https://github.com/knex/knex/pull/6050
export class MsSqlQueryCompiler extends MonkeyPatchable.MsSqlQueryCompiler {

  constructor(client: any, builder: any, formatter: any) {
    const onConflict = builder._single.onConflict;
    delete builder._single.onConflict;
    super(client, builder, formatter);
    (this as any).single.onConflict = onConflict;
  }

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert(this: any) {
    if (this.single.onConflict) {
      return this._insertWithMerge();
    }

    return super.insert();
  }

  _mergeAnd(this: any) {
    const wheres = this.where();

    if (!wheres) {
      return '';
    }

    return `and ${wheres.slice(6)} `;
  }

  _mergeWhenMatched(this: any, columns: any, updates: any) {
    let columnsData: any = [];

    if (!updates || Array.isArray(updates)) {
      columnsData = (updates || columns)
        .map((column: any) => `${this.formatter.columnize(column)}=tsource.${this.formatter.columnize(column)}`)
        .join(', ');
    }

    if (typeof updates === 'string') {
      columnsData = `${this.formatter.columnize(updates)}=tsource.${this.formatter.columnize(updates)}`;
    }

    if (!Array.isArray(updates) && typeof updates === 'object') {
      columnsData = Object.entries(updates)
        .map(([key, value]) => `${this.tableName}.${this.formatter.columnize(key)}=(${this._getParameters([value])})`);
    }

    const sql =  ` when matched ${this._mergeAnd()}then update set ${columnsData}`;

    return sql;
  }

  _mergeWhenNotMatched(this: any, columns: any) {
    const destinationColumns = this.formatter.columnize(columns);
    const sourceColumns = this.formatter.columnizeWithPrefix('tsource.', columns);

    const sql = ` when not matched then insert (${destinationColumns}) values (${sourceColumns})`;

    return sql;
  }

  _getParameters(this: any, params: any) {
    const sql = this.client.parameterize(
      params,
      this.client.valueForUndefined,
      this.builder,
      this.bindingsHolder,
    );

    return sql;
  }

  _mergeInsertIsEmpty(this: any, insert: any) {
    return (Array.isArray(insert) && insert.length === 0)
      || (typeof insert === 'object' && Utils.isEmpty(insert));
  }

  _mergeOn(this: any, conflict: any) {
    if (!Array.isArray(conflict)) {
      return 'on 1=1';
    }

    const parts: string[] = [];

    for (const col of conflict) {
      const conflictColumn = this.formatter.columnize(col);
      parts.push(`${this.tableName}.${conflictColumn} = tsource.${conflictColumn}`);
    }

    return `on ${parts.join(' and ')}`;
  }

  _insertWithMerge(this: any) {
    const { insert = [], onConflict, ignore, merge, returning, options = {} } = this.single;
    if (this._mergeInsertIsEmpty(insert)) {
      return '';
    }

    const insertData = this._prepInsert(insert);
    const insertParameters = insertData.values.map((value: any) => `(${this._getParameters(value)})`).join(', ');
    const sourceColumns = this.formatter.columnize(insertData.columns);

    const returningSql = returning
      ? ` ${this._returning('insert', returning, options.includeTriggerModifications)}`
      : '';

    let sql = `merge into ${this.tableName} using (values ${insertParameters}) as tsource(${sourceColumns}) `;

    sql += this._mergeOn(onConflict);

    sql += this._mergeWhenNotMatched(insertData.columns);

    if (!ignore) {
      sql += this._mergeWhenMatched(insertData.columns, merge.updates);
    }

    sql += returningSql;

    if (options.includeTriggerModifications) {
      sql = this._buildTempTable(returning) + sql + this._buildReturningSelect(returning);
    }

    sql = this.with() + sql + ';';

    return sql;
  }

}
