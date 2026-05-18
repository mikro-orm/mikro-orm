export * from '@mikro-orm/sql';
export * from './PgliteConnection.js';
export * from './PgliteDriver.js';
export * from './PglitePlatform.js';
export * from './PgliteSchemaHelper.js';
export {
  PgliteMikroORM as MikroORM,
  type PgliteOptions as Options,
  definePgliteConfig as defineConfig,
} from './PgliteMikroORM.js';
export { raw } from './raw.js';

import { type AbstractSqlDriver, SqlEntityManager } from '@mikro-orm/sql';
import type { PgliteDriver } from './PgliteDriver.js';

export type EntityManager<Driver extends AbstractSqlDriver = PgliteDriver> = SqlEntityManager<Driver>;
export const EntityManager = SqlEntityManager;
