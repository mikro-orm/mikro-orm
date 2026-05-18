export * from '@mikro-orm/sql';
export * from './SqliteConnection.js';
export { SqliteDriver } from './SqliteDriver.js';
export {
  SqliteMikroORM as MikroORM,
  type SqliteOptions as Options,
  defineSqliteConfig as defineConfig,
} from './SqliteMikroORM.js';

import { SqlEntityManager } from '@mikro-orm/sql';
import type { SqliteDriver as SqliteDriverType } from './SqliteDriver.js';

export type EntityManager = SqlEntityManager<SqliteDriverType>;
export const EntityManager = SqlEntityManager;
