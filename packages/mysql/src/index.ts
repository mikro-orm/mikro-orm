export * from '@mikro-orm/sql';
export * from './MySqlDriver.js';
export * from './MySqlPlatform.js';
export * from './MySqlConnection.js';
export {
  MySqlMikroORM as MikroORM,
  type MySqlOptions as Options,
  defineMySqlConfig as defineConfig,
} from './MySqlMikroORM.js';

import { type AbstractSqlDriver, SqlEntityManager } from '@mikro-orm/sql';
import type { MySqlDriver } from './MySqlDriver.js';

export type EntityManager<Driver extends AbstractSqlDriver = MySqlDriver> = SqlEntityManager<Driver>;
export const EntityManager = SqlEntityManager;
