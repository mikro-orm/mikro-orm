import { type Configuration, type Constructor, EntityManagerType } from '@mikro-orm/core';
import { AbstractSqlDriver, BasePostgreSqlEntityManager } from '@mikro-orm/sql';
import { PgliteConnection } from './PgliteConnection.js';
import { PglitePlatform } from './PglitePlatform.js';
import { PgliteMikroORM } from './PgliteMikroORM.js';

/** Database driver for PGlite (PostgreSQL in WASM). */
export class PgliteDriver extends AbstractSqlDriver<PgliteConnection> {
  override [EntityManagerType]!: BasePostgreSqlEntityManager<this>;

  constructor(config: Configuration) {
    super(config, new PglitePlatform(), PgliteConnection, ['kysely', '@electric-sql/pglite']);
  }

  override createEntityManager(useContext?: boolean): this[typeof EntityManagerType] {
    const EntityManagerClass = this.config.get('entityManager', BasePostgreSqlEntityManager);
    return new EntityManagerClass(this.config, this, this.metadata, useContext) as this[typeof EntityManagerType];
  }

  /** @inheritDoc */
  override getORMClass(): Constructor<PgliteMikroORM> {
    return PgliteMikroORM;
  }
}
