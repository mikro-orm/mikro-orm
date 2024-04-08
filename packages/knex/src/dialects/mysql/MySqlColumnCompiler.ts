// @ts-ignore
import BaseMySqlColumnCompiler from 'knex/lib/dialects/mysql/schema/mysql-columncompiler';

export class MySqlColumnCompiler extends BaseMySqlColumnCompiler {

  // we need the old behaviour to be able to add auto_increment to a column that is already PK
  increments(this: any, options = { primaryKey: true }) {
    return 'int unsigned not null auto_increment' + (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '');
  }

  /* istanbul ignore next */
  bigincrements(this: any, options = { primaryKey: true }) {
    return 'bigint unsigned not null auto_increment' + (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '');
  }

}
