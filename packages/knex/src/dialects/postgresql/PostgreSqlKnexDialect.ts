import type { Configuration } from '@mikro-orm/core';
import { PostgreSqlTableCompiler } from './PostgreSqlTableCompiler';
import { MonkeyPatchable } from '../../MonkeyPatchable';

export class PostgreSqlKnexDialect extends MonkeyPatchable.PostgresDialect {

  ormConfig!: Configuration;

  tableCompiler() {
    // eslint-disable-next-line prefer-rest-params
    const tableCompiler = new (PostgreSqlTableCompiler as any)(this, ...arguments);
    tableCompiler.ormConfig = this.ormConfig;

    return tableCompiler;
  }

}
