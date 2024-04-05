import { MonkeyPatchable } from '../../MonkeyPatchable';

export class MsSqlTableCompiler extends MonkeyPatchable.MsSqlTableCompiler {

  lowerCase = true;
  addColumnsPrefix = 'add ';
  dropColumnPrefix = 'drop column ';
  alterColumnPrefix = 'alter column ';

  alterColumns(this: any, columns: any, colBuilder: any) {
    for (let i = 0, l = colBuilder.length; i < l; i++) {
      const builder = colBuilder[i];
      if (builder.modified.defaultTo) {
        const schema = this.schemaNameRaw || 'dbo';
        const baseQuery = `declare @constraint${i} varchar(100) = (select default_constraints.name from sys.all_columns`
          + ' join sys.tables on all_columns.object_id = tables.object_id'
          + ' join sys.schemas on tables.schema_id = schemas.schema_id'
          + ' join sys.default_constraints on all_columns.default_object_id = default_constraints.object_id'
          + ` where schemas.name = '${schema}' and tables.name = '${this.tableNameRaw}' and all_columns.name = '${builder.getColumnName()}')`
          + ` if @constraint${i} is not null exec('alter table ${this.tableNameRaw} drop constraint ' + @constraint${i})`;
        this.pushQuery(baseQuery);
      }
    }
    // in SQL server only one column can be altered at a time
    columns.sql.forEach((sql: string) => {
      this.pushQuery({
        sql: `alter table ${this.tableName()} ${this.alterColumnPrefix.toLowerCase()}${sql}`,
        bindings: columns.bindings,
      });
    });
  }

}
