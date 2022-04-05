import { SchemaHelper } from '@mikro-orm/knex';

export class MsSqlSchemaHelper extends SchemaHelper {

  static readonly DEFAULT_VALUES = {
    0: ['0', 'false'],
  };

  getManagementDbName(): string {
    return 'master';
  }

  // TODO? https://stackoverflow.com/questions/159038/how-can-foreign-key-constraints-be-temporarily-disabled-using-t-sql
  getSchemaBeginning(): string {
    // return 'EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"';
    return '';
  }

  // TODO? https://stackoverflow.com/questions/159038/how-can-foreign-key-constraints-be-temporarily-disabled-using-t-sql
  getSchemaEnd(): string {
    // return 'exec sp_MSforeachtable @command1="print \'?\'", @command2="ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"\n';
    return '';
  }

  // TODO is this needed?
  getDatabaseExistsSQL(name: string): string {
    return `select 1 from master.sys.databases where name = N'${name}'`;
  }

  getListTablesSQL(): string {
    return `SELECT table_name FROM information_schema.tables WHERE table_type = 'base table'`;
  }

  normalizeDefaultValue(defaultValue: string, length: number) {
    return super.normalizeDefaultValue(defaultValue, length, MsSqlSchemaHelper.DEFAULT_VALUES);
  }

}
