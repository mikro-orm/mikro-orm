export * from '@mikro-orm/sql';
export * from './SqlJsConnection';
export * from './SqlJsDriver';
export { setSqlJsLoader, type SqlJsLoader, type SqlJsStatic } from './sql-js-database';
export {
  SqlJsMikroORM as MikroORM,
  type SqlJsOptions as Options,
  defineSqlJsConfig as defineConfig,
} from './SqlJsMikroORM';

import { type AbstractSqlDriver, SqlEntityManager } from '@mikro-orm/sql';
import type { SqlJsDriver } from './SqlJsDriver';

export type EntityManager<Driver extends AbstractSqlDriver = SqlJsDriver> = SqlEntityManager<Driver>;
export const EntityManager = SqlEntityManager;
