// @ts-ignore
import BaseMySqlColumnCompiler from 'knex/lib/dialects/mysql/schema/mysql-columncompiler';
import type { MySqlIncrementOptions } from '../..//typings';

export class MySqlColumnCompiler extends BaseMySqlColumnCompiler {

  // we need the old behaviour to be able to add auto_increment to a column that is already PK
  increments(options: MySqlIncrementOptions) {
    return this.generateDDL(options);
  }

  /* istanbul ignore next */
  bigincrements(options: MySqlIncrementOptions) {
    return this.generateDDL(options);
  }

  private generateDDL(this: any, options: MySqlIncrementOptions = {}) {
    const { primaryKey = true, unsigned = true, type = 'int' } = options;
    return type
      + (unsigned ? ' unsigned' : '')
      + ' not null auto_increment'
      + (this.tableCompiler._canBeAddPrimaryKey({ primaryKey }) ? ' primary key' : '');
  }

}
