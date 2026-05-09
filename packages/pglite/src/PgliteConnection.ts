import { PGlite, type PGliteOptions } from '@electric-sql/pglite';
import { PGliteDialect } from 'kysely';
import array from 'postgres-array';
import { AbstractSqlConnection, type Dictionary, createPostgreSqlTypeParsers } from '@mikro-orm/sql';

/**
 * Driver-specific options accepted via the `driverOptions` config key.
 * Anything in here is forwarded to `PGlite.create()` (extensions, parsers, ...).
 *
 * Pass an existing `PGlite` instance or factory under `pglite` to skip our
 * default construction (parser overrides won't be applied in that case —
 * you're responsible for configuring them yourself, and `dataDir` from
 * `dbName` is ignored — your instance keeps whatever it was constructed with).
 *
 * @internal — kept module-local so `@electric-sql/pglite`'s d.ts (which
 * references DOM/Emscripten/WebAssembly ambient globals) doesn't leak into
 * downstream type graphs.
 */
type PgliteDriverOptions = Partial<PGliteOptions> & {
  pglite?: PGlite | (() => PGlite | Promise<PGlite>);
};

const isInMemoryDataDir = (dataDir: string | undefined): boolean =>
  !dataDir || dataDir === 'memory://' || dataDir.startsWith('memory:');

/** PostgreSQL-in-WASM database connection using `@electric-sql/pglite`. */
export class PgliteConnection extends AbstractSqlConnection {
  // Stored as a Promise so `createKyselyDialect` can stay synchronous (else
  // `getClient()` would throw "Current driver requires async initialization")
  // while `executeDump` and the kysely dialect both `await` the same instance.
  #pglite?: Promise<PGlite>;
  #neuterClose = false;
  #ownsPglite = true;

  override createKyselyDialect(overrides: Dictionary): PGliteDialect {
    const onCreateConnection = this.options.onCreateConnection ?? this.config.get('onCreateConnection');
    const options = (overrides ?? {}) as PgliteDriverOptions;
    const { pglite: userPglite, ...pgliteOptions } = options;
    const dataDir = options.dataDir ?? (this.config.get('dbName') as string | undefined);
    const parsers = { ...createPostgreSqlTypeParsers(s => array.parse(s)), ...options.parsers };

    this.#ownsPglite = !userPglite;
    // Skip `pglite.close()` (called by kysely's `PGliteDriver.destroy()`) when:
    //   - the user owns the instance (closing it is their responsibility), or
    //   - we hold an in-memory DB whose data would otherwise be lost on
    //     reconnect (e.g. test harnesses that drive `orm.close()` + `orm.connect()`).
    // For file/IDB-backed instances we let kysely close so file handles / IDB
    // connections are released; we drop our cached promise in `close()` below
    // so the next dialect-construction rebuilds the PGlite instance.
    this.#neuterClose = !this.#ownsPglite || isInMemoryDataDir(dataDir);

    if (!this.#pglite) {
      if (userPglite) {
        this.#pglite = typeof userPglite === 'function' ? Promise.resolve(userPglite()) : Promise.resolve(userPglite);
      } else {
        this.#pglite = PGlite.create({ ...pgliteOptions, dataDir, parsers });
      }
    }

    if (this.#neuterClose) {
      // Hand kysely a delegating wrapper rather than mutating the underlying
      // instance — proxies can't pierce PGlite's private fields, and patching
      // `close` directly would orphan a user-supplied PGlite (its real `close`
      // would stay neutered after `orm.close()`). Each method call hits the
      // original `p`, so `#private` fields stay reachable.
      const sharedPglitePromise = this.#pglite.then(
        p =>
          ({
            query: p.query.bind(p),
            transaction: p.transaction.bind(p),
            close: () => Promise.resolve(),
            get closed() {
              return p.closed;
            },
            get ready() {
              return p.ready;
            },
            // `waitReady` is a stable Promise on the underlying instance — capture it
            // directly so coverage doesn't hinge on `kysely` actually awaiting it (which
            // only happens in the WASM-not-yet-loaded transient window).
            waitReady: p.waitReady,
          }) as PGlite,
      );
      return new PGliteDialect({ pglite: () => sharedPglitePromise, onCreateConnection });
    }

    return new PGliteDialect({ pglite: () => this.#pglite!, onCreateConnection });
  }

  override async close(force?: boolean): Promise<void> {
    await super.close(force);
    // Persistent backings (file/IDB) we own get really closed by kysely — drop
    // the cached promise so a subsequent reconnect rebuilds a fresh instance
    // (which then re-reads the persisted data from disk / IDB).
    if (this.#ownsPglite && !this.#neuterClose) {
      this.#pglite = undefined;
    }
  }

  /** PGlite supports multi-statement scripts via `exec()`, which is what schema dumps need. */
  override async executeDump(source: string): Promise<void> {
    await this.ensureConnection();
    const pglite = await this.#pglite!;
    await pglite.exec(source);
  }
}
