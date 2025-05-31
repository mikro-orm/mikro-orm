import { AbstractSqlConnection, type ConnectionConfig, Utils } from '@mikro-orm/knex';
import { OracleDialect } from 'kysely-oracledb';
import oracledb, { type PoolAttributes } from 'oracledb';

export class OracleConnection extends AbstractSqlConnection {

  override async createKyselyDialect(overrides: PoolAttributes) {
    const options = this.mapOptions(overrides);
    const password = options.password as ConnectionConfig['password'];
    const onCreateConnection = this.options.onCreateConnection ?? this.config.get('onCreateConnection');

    const pool = await oracledb.createPool({
      ...options,
      password: typeof password === 'function' ? await password() : password,
      sessionCallback: onCreateConnection,
    });

    return new OracleDialect({ pool });
  }

  mapOptions(overrides: PoolAttributes): PoolAttributes {
    const ret = { ...this.getConnectionOptions() } as PoolAttributes;
    const pool = this.config.get('pool');
    ret.poolMin = pool?.min;
    ret.poolMax = pool?.max;
    ret.poolTimeout = pool?.idleTimeoutMillis;
    ret.connectionString = this.config.getClientUrl();
    console.log(ret);

    return Utils.mergeConfig(ret, overrides);
  }

  protected override transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'run' && res[0].constructor.name === 'ResultSetHeader') {
      return {
        insertId: res[0].insertId,
        affectedRows: res[0].affectedRows,
      } as unknown as T;
    }

    if (method === 'get') {
      return res[0][0];
    }

    return res;
  }

}
