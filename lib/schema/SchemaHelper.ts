import { TableBuilder } from 'knex';
import { EntityProperty } from '../decorators';
import { AbstractSqlConnection } from '../connections/AbstractSqlConnection';

export abstract class SchemaHelper {

  getSchemaBeginning(): string {
    return '';
  }

  getSchemaEnd(): string {
    return '';
  }

  finalizeTable(table: TableBuilder): void {
    //
  }

  getTypeDefinition(prop: EntityProperty, types: Record<string, string[]> = {}, lengths: Record<string, number> = {}, allowZero = false): string {
    const t = prop.type.toLowerCase();
    let type = (types[t] || types.json || types.text || [t])[0];

    if (type.includes('(?)')) {
      type = this.processTypeWildCard(prop, lengths, t, allowZero, type);
    }

    return type;
  }

  supportsSchemaConstraints(): boolean {
    return true;
  }

  indexForeignKeys() {
    return true;
  }

  getTypeFromDefinition(type: string, types?: Record<string, string[]>): string {
    type = type.replace(/\(.+\)/, '');

    return Object.entries(types!)
      .filter(([, tt]) => tt.find(ttt => ttt.replace(/\(.+\)/, '') === type))
      .map(([t]) => t)[0];
  }

  async getPrimaryKeys(connection: AbstractSqlConnection, indexes: Record<string, any[]>, tableName: string, schemaName?: string): Promise<string[]> {
    const ret = [];

    for (const idx of Object.values(indexes)) {
      const pks = idx.filter(i => i.primary).map(i => i.columnName);
      ret.push(...pks);
    }

    return ret;
  }

  getListTablesSQL(): string {
    throw new Error('Not supported by given driver');
  }

  async getColumns(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<any[]> {
    throw new Error('Not supported by given driver');
  }

  async getIndexes(connection: AbstractSqlConnection, tableName: string, schemaName?: string): Promise<Record<string, any[]>> {
    throw new Error('Not supported by given driver');
  }

  getForeignKeysSQL(tableName: string, schemaName?: string): string {
    throw new Error('Not supported by given driver');
  }

  mapForeignKeys(fks: any[]): Record<string, any> {
    return fks.reduce((ret, fk: any) => {
      ret[fk.column_name] = {
        columnName: fk.column_name,
        constraintName: fk.constraint_name,
        referencedTableName: fk.referenced_table_name,
        referencedColumnName: fk.referenced_column_name,
        updateRule: fk.update_rule,
        deleteRule: fk.delete_rule,
      };

      return ret;
    }, {});
  }

  private processTypeWildCard(prop: EntityProperty, lengths: Record<string, number>, propType: string, allowZero: boolean, type: string): string {
    let length = prop.length || lengths[propType];

    if (allowZero) {
      length = '' + length;
    }

    type = length ? type.replace('?', length) : type.replace('(?)', '');

    return type;
  }

}
