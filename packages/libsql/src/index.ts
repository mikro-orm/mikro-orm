export * from '@mikro-orm/sql';
export * from './LibSqlConnection.js';
export * from './LibSqlDriver.js';
export {
  LibSqlMikroORM as MikroORM,
  type LibSqlOptions as Options,
  defineLibSqlConfig as defineConfig,
} from './LibSqlMikroORM.js';

import { SqlEntityManager } from '@mikro-orm/sql';
import type { LibSqlDriver } from './LibSqlDriver.js';

export type EntityManager = SqlEntityManager<LibSqlDriver>;
export const EntityManager = SqlEntityManager;
