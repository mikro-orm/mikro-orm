// @ts-ignore
import BaseMySqlColumnCompiler from 'knex/lib/dialects/mysql/schema/mysql-columncompiler';
import type { IncrementOptions } from '../../typings';

export class MySqlColumnCompiler extends BaseMySqlColumnCompiler {

  // we need the old behaviour to be able to add auto_increment to a column that is already PK
  increments(options: IncrementOptions) {
    return this.generateDDL(options);
  }

  /* istanbul ignore next */
  bigincrements(options: IncrementOptions) {
    return this.generateDDL(options);
  }

  private generateDDL(this: any, options: IncrementOptions = {}) {
    const { primaryKey = true, unsigned = true, type = 'int' } = options;
    return type
      + (unsigned ? ' unsigned' : '')
      + ' not null auto_increment'
      + (this.tableCompiler._canBeAddPrimaryKey({ primaryKey }) ? ' primary key' : '');
  }

}
