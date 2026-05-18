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

// Pin the *default* driver on the package-level `EntityManager` while
// keeping the generic surface intact — `EntityManager` (no generic) now
// resolves to `SqlEntityManager<MySqlDriver>`, but explicit
// `EntityManager<XxxDriver>` continues to work for anyone overriding it.
// The const re-export keeps the same `SqlEntityManager` class reference,
// so DI tokens match what `MikroOrmModule` registers.
export type EntityManager<Driver extends AbstractSqlDriver = MySqlDriver> = SqlEntityManager<Driver>;
export const EntityManager = SqlEntityManager;
