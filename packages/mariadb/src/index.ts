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

// Override the `MySqlDriver`-pinned `EntityManager` default that
// `@mikro-orm/mysql` re-exports — for MariaDB consumers the default is
// narrowed to `MariaDbDriver`; explicit `EntityManager<XxxDriver>` is
// still accepted as before.
export type EntityManager<Driver extends AbstractSqlDriver = MariaDbDriver> = SqlEntityManager<Driver>;
export const EntityManager = SqlEntityManager;
