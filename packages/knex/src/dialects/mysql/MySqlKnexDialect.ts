// @ts-ignore
import MySql2Dialect from 'knex/lib/dialects/mysql2';
import { MySqlQueryCompiler } from './MySqlQueryCompiler';
import { MySqlColumnCompiler } from './MySqlColumnCompiler';

export class MySqlKnexDialect extends MySql2Dialect {

  queryCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MySqlQueryCompiler as any)(this, ...arguments);
  }

  columnCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MySqlColumnCompiler as any)(this, ...arguments);
  }

}
