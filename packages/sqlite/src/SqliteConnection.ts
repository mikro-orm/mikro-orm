import { SqliteKnexDialect, BaseSqliteConnection } from '@mikro-orm/knex';

export class SqliteConnection extends BaseSqliteConnection {

  override createKnex() {
    this.client = this.createKnexClient(SqliteKnexDialect as any);
    this.connected = true;
  }

  protected override transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res[0];
    }

    if (method === 'all') {
      return res;
    }

    if (Array.isArray(res)) {
      return {
        insertId: res[res.length - 1]?.id ?? 0,
        affectedRows: res.length,
        row: res[0],
        rows: res,
      } as T;
    }

    return {
      insertId: res.lastID,
      affectedRows: res.changes,
    } as unknown as T;
  }

}
