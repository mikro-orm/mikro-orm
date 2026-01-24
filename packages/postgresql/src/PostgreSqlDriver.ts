import { type Configuration, type Constructor, EntityManagerType } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/sql';
import { PostgreSqlConnection } from './PostgreSqlConnection.js';
import { PostgreSqlPlatform } from './PostgreSqlPlatform.js';
import { PostgreSqlMikroORM } from './PostgreSqlMikroORM.js';
import { PostgreSqlEntityManager } from './PostgreSqlEntityManager.js';

export class PostgreSqlDriver extends AbstractSqlDriver<PostgreSqlConnection> {

  override [EntityManagerType]!: PostgreSqlEntityManager<this>;

  constructor(config: Configuration) {
    super(config, new PostgreSqlPlatform(), PostgreSqlConnection, ['kysely', 'pg']);
  }

  override createEntityManager(useContext?: boolean): this[typeof EntityManagerType] {
    const EntityManagerClass = this.config.get('entityManager', PostgreSqlEntityManager);
    return new EntityManagerClass(this.config, this, this.metadata, useContext) as this[typeof EntityManagerType];
  }

  /** @inheritDoc */
  override getORMClass(): Constructor<PostgreSqlMikroORM> {
    return PostgreSqlMikroORM;
  }

}
