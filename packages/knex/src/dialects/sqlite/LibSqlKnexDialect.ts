import { MonkeyPatchable } from '../../MonkeyPatchable';

export class LibSqlKnexDialect extends MonkeyPatchable.BetterSqlite3Dialect {

  get driverName() {
    return 'libsql';
  }

  _driver() {
    return require('libsql');
  }

  async _query(this: any, connection: any, obj: any) {
    /* istanbul ignore next */
    if (!obj.sql) {
      throw new Error('The query is empty');
    }

    /* istanbul ignore next */
    if (!connection) {
      throw new Error('No connection provided');
    }

    const callMethod = this.getCallMethod(obj);
    const statement = connection.prepare(obj.sql);
    const bindings = this._formatBindings(obj.bindings);
    const response = await statement[callMethod](bindings);
    obj.response = response;
    obj.context = {
      lastID: response.lastInsertRowid,
      changes: response.changes,
    };

    return obj;
  }

  async acquireRawConnection(this: any) {
    const connection = new this.driver(this.connectionSettings.filename, {
      ...this.connectionSettings,
    });
    connection.__created = Date.now();

    return connection;
  }

  validateConnection(connection: any) {
    if (connection.memory) {
      return true;
    }

    /* istanbul ignore next */
    return connection.__created > Date.now() - 10_000;
  }

  private getCallMethod(obj: any): string {
    if (obj.method === 'raw') {
      const query = obj.sql.trim().toLowerCase();

      if ((query.startsWith('insert into') || query.startsWith('update ')) && query.includes(' returning ')) {
        return 'all';
      }

      if (this.isRunQuery(query)) {
        return 'run';
      }
    }

    /* istanbul ignore next */
    switch (obj.method) {
      case 'insert':
      case 'update':
        return obj.returning ? 'all' : 'run';
      case 'counter':
      case 'del':
        return 'run';
      default:
        return 'all';
    }
  }

  private isRunQuery(query: string): boolean {
    query = query.trim().toLowerCase();

    /* istanbul ignore next */
    if ((query.startsWith('insert into') || query.startsWith('update ')) && query.includes(' returning ')) {
      return false;
    }

    return query.startsWith('insert into') ||
      query.startsWith('update') ||
      query.startsWith('delete') ||
      query.startsWith('truncate');
  }

}
