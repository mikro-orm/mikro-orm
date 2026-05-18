export * from '@mikro-orm/mysql';
export * from './MariaDbSchemaHelper.js';
export * from './MariaDbPlatform.js';
export * from './MariaDbDriver.js';
export {
  MariaDbMikroORM as MikroORM,
  type MariaDbOptions as Options,
  defineMariaDbConfig as defineConfig,
} from './MariaDbMikroORM.js';

import { type AbstractSqlDriver, SqlEntityManager } from '@mikro-orm/sql';
import type { MariaDbDriver } from './MariaDbDriver.js';

export type EntityManager<Driver extends AbstractSqlDriver = MariaDbDriver> = SqlEntityManager<Driver>;
export const EntityManager = SqlEntityManager;
