import { SchemaHelper } from '@mikro-orm/knex';

export class MsSqlSchemaHelper extends SchemaHelper {

  static readonly DEFAULT_VALUES = {
    0: ['0', 'false'],
  };

  override getManagementDbName(): string {
    return 'master';
  }

  override disableForeignKeysSQL() {
    return 'exec sp_MSforeachtable "alter table ? nocheck constraint all"';
  }

  override enableForeignKeysSQL() {
    return 'exec sp_MSforeachtable @command1="print \'?\'", @command2="alter table ? with check check constraint all"\n';
  }

  override getDatabaseExistsSQL(name: string): string {
    return `select 1 from master.sys.databases where name = N'${name}'`;
  }

  override getListTablesSQL(): string {
    return `select table_name from information_schema.tables where table_type = 'base table'`;
  }

  override normalizeDefaultValue(defaultValue: string, length: number) {
    return super.normalizeDefaultValue(defaultValue, length, MsSqlSchemaHelper.DEFAULT_VALUES);
  }

}
