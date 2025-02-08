import { TypeOverrides } from 'pg';
import array from 'postgres-array';
import { AbstractSqlConnection, type Knex } from '@mikro-orm/knex';

export class PostgreSqlConnection extends AbstractSqlConnection {

  override createKnex() {
    this.client = this.createKnexClient('postgresql');
    this.client.client.ormConfig = this.config;
    this.connected = true;
  }

  getDefaultClientUrl(): string {
    return 'postgresql://postgres@127.0.0.1:5432';
  }

  override getConnectionOptions(): Knex.PgConnectionConfig {
    const ret = super.getConnectionOptions() as Knex.PgConnectionConfig;
    // use `select typname, oid, typarray from pg_type order by oid` to get the list of OIDs
    const types = new TypeOverrides();
    [
      1082, // date
      1114, // timestamp
      1184, // timestamptz
      1186, // interval
    ].forEach(oid => types.setTypeParser(oid, str => str));
    [
      1182, // date[]
      1115, // timestamp[]
      1185, // timestamptz[]
      1187, // interval[]
    ].forEach(oid => types.setTypeParser(oid, str => array.parse(str)));
    ret.types = types as any;

    return ret;
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (Array.isArray(res)) {
      return res.map(row => this.transformRawResult(row, method)) as T;
    }

    if (method === 'get') {
      return res.rows[0];
    }

    if (method === 'all') {
      return res.rows;
    }

    return {
      affectedRows: res.rowCount,
      insertId: res.rows[0] ? res.rows[0].id : 0,
      row: res.rows[0],
      rows: res.rows,
    } as unknown as T;
  }

}
