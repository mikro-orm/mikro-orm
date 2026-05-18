export * from '@mikro-orm/sql';
export * from './MsSqlConnection.js';
export * from './MsSqlDriver.js';
export * from './MsSqlPlatform.js';
export * from './MsSqlSchemaHelper.js';
export * from './UnicodeStringType.js';
export {
  MsSqlMikroORM as MikroORM,
  type MsSqlOptions as Options,
  defineMsSqlConfig as defineConfig,
} from './MsSqlMikroORM.js';

import { SqlEntityManager } from '@mikro-orm/sql';
import type { MsSqlDriver } from './MsSqlDriver.js';

export type EntityManager = SqlEntityManager<MsSqlDriver>;
export const EntityManager = SqlEntityManager;
