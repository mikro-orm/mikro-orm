import { DatabaseTable } from './DatabaseTable';
import { SchemaHelper } from './SchemaHelper';
import { AbstractSqlConnection } from '../connections/AbstractSqlConnection';
import { Configuration } from '../utils';

export class DatabaseSchema {

  private readonly tables: DatabaseTable[] = [];

  addTable(name: string, schema: string | undefined): DatabaseTable {
    const table = new DatabaseTable(name, schema);
    this.tables.push(table);

    return table;
  }

  getTables(): DatabaseTable[] {
    return this.tables;
  }

  getTable(name: string): DatabaseTable | undefined {
    return this.tables.find(t => t.name === name);
  }

  static async create(connection: AbstractSqlConnection, helper: SchemaHelper, config: Configuration) {
    const schema = new DatabaseSchema();
    const tables = await connection.execute<Table[]>(helper.getListTablesSQL());

    for (const t of tables) {
      if (t.table_name === config.get('migrations').tableName!) {
        continue;
      }

      const table = schema.addTable(t.table_name, t.schema_name);
      const cols = await helper.getColumns(connection, t.table_name, t.schema_name);
      const indexes = await helper.getIndexes(connection, t.table_name, t.schema_name);
      const pks = await helper.getPrimaryKeys(connection, indexes, t.table_name, t.schema_name);
      const fks = await helper.getForeignKeys(connection, t.table_name, t.schema_name);
      table.init(cols, indexes, pks, fks);
    }

    return schema;
  }

}

export interface Table {
  table_name: string;
  schema_name?: string;
}
