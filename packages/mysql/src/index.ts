export * from '@mikro-orm/sql';
export * from './MySqlDriver.js';
export * from './MySqlPlatform.js';
export * from './MySqlConnection.js';
export {
  MySqlMikroORM as MikroORM,
  type MySqlOptions as Options,
  defineMySqlConfig as defineConfig,
} from './MySqlMikroORM.js';

import { SqlEntityManager } from '@mikro-orm/sql';
import type { MySqlDriver } from './MySqlDriver.js';

// Pin the driver generic on the package-level `EntityManager`. The type
// shadow narrows the driver to `MySqlDriver` so consumers (NestJS DI,
// repository helpers, etc.) get specific-driver typing without filling in
// the generic; the const re-export keeps the same `SqlEntityManager` class
// reference, so DI tokens match what `MikroOrmModule` registers.
export type EntityManager = SqlEntityManager<MySqlDriver>;
export const EntityManager = SqlEntityManager;
