export * from '@mikro-orm/mysql';
export * from './MariaDbSchemaHelper.js';
export * from './MariaDbPlatform.js';
export * from './MariaDbDriver.js';
export {
  MariaDbMikroORM as MikroORM,
  type MariaDbOptions as Options,
  defineMariaDbConfig as defineConfig,
} from './MariaDbMikroORM.js';

import { SqlEntityManager } from '@mikro-orm/sql';
import type { MariaDbDriver } from './MariaDbDriver.js';

// Override the `MySqlDriver`-pinned `EntityManager` that `@mikro-orm/mysql`
// re-exports — for MariaDB consumers we want the driver narrowed further.
export type EntityManager = SqlEntityManager<MariaDbDriver>;
export const EntityManager = SqlEntityManager;
