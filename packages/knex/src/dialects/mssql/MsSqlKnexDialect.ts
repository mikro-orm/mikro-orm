import { MonkeyPatchable } from '../../MonkeyPatchable';
import { MsSqlTableCompiler } from './MsSqlTableCompiler';
import { MsSqlColumnCompiler } from './MsSqlColumnCompiler';
import { MsSqlQueryCompiler } from './MsSqlQueryCompiler';
import { MsSqlTransaction } from './MsSqlTransaction';

type Work = (done: () => void) => void;

interface RequestQueue {
  pending: Work[];
  active: boolean;
  idleWaiters: (() => void)[];
}

/**
 * knex 3.2.10 keeps one request queue on `Client_MSSQL.prototype`, shared by every connection
 * and every knex instance, and `_chomp()` runs the newest queued request on whichever connection
 * just became idle. With concurrent transactions, a query issued in parallel inside one
 * transaction runs on another transaction's connection. The queue has to be per connection.
 * Fixed upstream in https://github.com/knex/knex/pull/6554, remove once knex is bumped.
 */
const requestQueues = new WeakMap<object, RequestQueue>();

export class MsSqlKnexDialect extends MonkeyPatchable.MsSqlDialect {

  tableCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlTableCompiler as any)(this, ...arguments);
  }

  columnCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlColumnCompiler as any)(this, ...arguments);
  }

  queryCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlQueryCompiler as any)(this, ...arguments);
  }

  transaction() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlTransaction as any)(this, ...arguments);
  }

  /** Sends the next queued request once the connection is idle, also after a failed request. */
  _chomp(connection: any) {
    const queue = this._requestQueue(connection);

    if (queue.active) {
      return;
    }

    const work = queue.pending.shift();

    if (!work) {
      const idleWaiters = queue.idleWaiters;
      queue.idleWaiters = [];
      idleWaiters.forEach(resolve => resolve());
      return;
    }

    queue.active = true;
    work(() => {
      queue.active = false;
      process.nextTick(() => this._chomp(connection));
    });
  }

  /** Runs `work` once every request queued before it on the connection has completed, and holds the connection until `done` is called. */
  _enqueueWork(connection: any, work: Work) {
    this._requestQueue(connection).pending.push(work);
    this._chomp(connection);
  }

  _enqueueRequest(request: any, connection: any) {
    this._enqueueWork(connection, done => {
      request.once('requestCompleted', done);
      connection.execSql(request);
    });
  }

  /** Resolves once nothing is queued or in flight on the connection. */
  _waitForIdle(connection: any): Promise<void> {
    const queue = this._requestQueue(connection);

    if (!queue.active && queue.pending.length === 0) {
      return Promise.resolve();
    }

    return new Promise(resolve => queue.idleWaiters.push(resolve));
  }

  /** A request queued on a transaction's connection must not run on the next transaction that gets that connection from the pool. */
  releaseConnection(connection: any) {
    return this._waitForIdle(connection).then(() => super.releaseConnection(connection));
  }

  private _requestQueue(connection: object): RequestQueue {
    let queue = requestQueues.get(connection);

    if (!queue) {
      queue = { pending: [], active: false, idleWaiters: [] };
      requestQueues.set(connection, queue);
    }

    return queue;
  }

}
