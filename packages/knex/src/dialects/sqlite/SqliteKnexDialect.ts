import { MonkeyPatchable } from '../../MonkeyPatchable';

export class SqliteKnexDialect extends MonkeyPatchable.Sqlite3Dialect {

  processResponse(obj: any, runner: any) {
    if (obj.method === 'raw' && this.isRunQuery(obj.sql)) {
      return obj.response ?? obj.context;
    }

    return super.processResponse(obj, runner);
  }

  _query(connection: any, obj: any) {
    const callMethod = this.getCallMethod(obj);

    return new Promise((resolve: any, reject: any) => {
      /* istanbul ignore if */
      if (!connection?.[callMethod]) {
        return reject(new Error(`Error calling ${callMethod} on connection.`));
      }

      connection[callMethod](obj.sql, obj.bindings, function (this: any, err: any, response: any) {
        if (err) {
          return reject(err);
        }

        obj.response = response;
        obj.context = this;

        return resolve(obj);
      });
    });
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

    if ((query.startsWith('insert into') || query.startsWith('update ')) && query.includes(' returning ')) {
      return false;
    }

    return query.startsWith('insert into') ||
      query.startsWith('update') ||
      query.startsWith('delete') ||
      query.startsWith('truncate');
  }

}
