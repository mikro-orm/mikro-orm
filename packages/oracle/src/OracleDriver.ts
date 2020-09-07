import { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { OracleConnection } from './OracleConnection';
import { OraclePlatform } from './OraclePlatform';

export class OracleDriver extends AbstractSqlDriver<OracleConnection> {

  constructor(config: Configuration) {
    super(config, new OraclePlatform(), OracleConnection, ['knex', 'oracledb']);
  }

}
