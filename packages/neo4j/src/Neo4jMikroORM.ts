import { defineConfig, MikroORM, type EntityManager, type EntityManagerType, type IDatabaseDriver, type Options } from '@mikro-orm/core';
import { Neo4jDriver } from './Neo4jDriver';
import type { Neo4jEntityManager } from './Neo4jEntityManager';

export class Neo4jMikroORM<EM extends EntityManager = Neo4jEntityManager> extends MikroORM<Neo4jDriver, EM> {

  private static DRIVER = Neo4jDriver;

  static override async init<D extends IDatabaseDriver = Neo4jDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options?: Options<D, EM>): Promise<MikroORM<D, EM>> {
    return super.init(options);
  }

  static override initSync<D extends IDatabaseDriver = Neo4jDriver, EM extends EntityManager = D[typeof EntityManagerType] & EntityManager>(options: Options<D, EM>): MikroORM<D, EM> {
    return super.initSync(options);
  }

}

export type Neo4jOptions = Options<Neo4jDriver>;

/* istanbul ignore next */
export function defineNeo4jConfig(options: Neo4jOptions) {
  return defineConfig({ driver: Neo4jDriver, ...options });
}
