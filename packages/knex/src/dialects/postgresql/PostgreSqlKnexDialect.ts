// @ts-ignore
import PostgresDialect from 'knex/lib/dialects/postgres';
import type { Configuration } from '@mikro-orm/core';
import { PostgreSqlTableCompiler } from './PostgreSqlTableCompiler';

export class PostgreSqlKnexDialect extends PostgresDialect {

  ormConfig!: Configuration;

  tableCompiler() {
    // eslint-disable-next-line prefer-rest-params
    const tableCompiler = new (PostgreSqlTableCompiler as any)(this, ...arguments);
    tableCompiler.ormConfig = this.ormConfig;

    return tableCompiler;
  }

}
