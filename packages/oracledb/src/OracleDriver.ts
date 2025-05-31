import { type Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { OracleConnection } from './OracleConnection.js';
import { OraclePlatform } from './OraclePlatform.js';

export class OracleDriver extends AbstractSqlDriver<OracleConnection> {

  constructor(config: Configuration) {
    super(config, new OraclePlatform(), OracleConnection, ['kysely', 'oracledb']);
  }

}
