export * from '@mikro-orm/sql';
export * from './SqlJsConnection.js';
export * from './SqlJsDriver.js';
export type * from './typings.js';
export {
  SqlJsMikroORM as MikroORM,
  type SqlJsOptions as Options,
  defineSqlJsConfig as defineConfig,
} from './SqlJsMikroORM.js';

import { type AbstractSqlDriver, SqlEntityManager } from '@mikro-orm/sql';
import type { SqlJsDriver } from './SqlJsDriver.js';

export type EntityManager<Driver extends AbstractSqlDriver = SqlJsDriver> = SqlEntityManager<Driver>;
export const EntityManager = SqlEntityManager;
