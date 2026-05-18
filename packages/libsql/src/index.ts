export * from '@mikro-orm/sql';
export * from './LibSqlConnection.js';
export * from './LibSqlDriver.js';
export {
  LibSqlMikroORM as MikroORM,
  type LibSqlOptions as Options,
  defineLibSqlConfig as defineConfig,
} from './LibSqlMikroORM.js';

import { type AbstractSqlDriver, SqlEntityManager } from '@mikro-orm/sql';
import type { LibSqlDriver } from './LibSqlDriver.js';

export type EntityManager<Driver extends AbstractSqlDriver = LibSqlDriver> = SqlEntityManager<Driver>;
export const EntityManager = SqlEntityManager;
