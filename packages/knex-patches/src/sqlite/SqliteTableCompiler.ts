import type { Dictionary } from '@mikro-orm/core';
import { MonkeyPatchable } from '../MonkeyPatchable';

export class SqliteTableCompiler extends MonkeyPatchable.Sqlite3DialectTableCompiler {

  foreign(this: any, foreignInfo: Dictionary) {
    foreignInfo.column = Array.isArray(foreignInfo.column)
      ? foreignInfo.column
      : [foreignInfo.column];
    foreignInfo.column = foreignInfo.column.map((column: unknown) =>
      this.client.customWrapIdentifier(column, (a: unknown) => a),
    );
    foreignInfo.inTable = this.client.customWrapIdentifier(
      foreignInfo.inTable,
      (a: unknown) => a,
    );
    foreignInfo.references = Array.isArray(foreignInfo.references)
      ? foreignInfo.references
      : [foreignInfo.references];
    foreignInfo.references = foreignInfo.references.map((column: unknown) =>
      this.client.customWrapIdentifier(column, (a: unknown) => a),
    );
    // quoted versions
    const column = this.formatter.columnize(foreignInfo.column);
    const inTable = this.formatter.columnize(foreignInfo.inTable);
    const references = this.formatter.columnize(foreignInfo.references);
    const keyName = this.formatter.columnize(foreignInfo.keyName);

    const addColumnQuery = this.sequence.find((query: { sql: string }) => query.sql.includes(`add column ${column[0]}`));

    // no need for temp tables if we just add a column
    if (addColumnQuery) {
      /* istanbul ignore next */
      const onUpdate = foreignInfo.onUpdate ? ` on update ${foreignInfo.onUpdate}` : '';
      /* istanbul ignore next */
      const onDelete = foreignInfo.onDelete ? ` on delete ${foreignInfo.onDelete}` : '';
      addColumnQuery.sql += ` constraint ${keyName} references ${inTable} (${references})${onUpdate}${onDelete}`;
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const compiler = this;

    if (this.method !== 'create' && this.method !== 'createIfNot') {
      this.pushQuery({
        sql: `PRAGMA table_info(${this.tableName()})`,
        statementsProducer(pragma: any, connection: any) {
          return compiler.client
            .ddl(compiler, pragma, connection)
            .foreign(foreignInfo);
        },
      });
    }
  }

}
