export * from '@mikro-orm/sql';
export * from './OracleConnection.js';
export * from './OracleDriver.js';
export * from './OraclePlatform.js';
export * from './OracleQueryBuilder.js';
export * from './OracleSchemaHelper.js';
export * from './OracleSchemaGenerator.js';
export * from './OracleExceptionConverter.js';
export type { OracleOptions as Options } from './OracleMikroORM.js';
export { OracleMikroORM as MikroORM, defineOracleConfig as defineConfig } from './OracleMikroORM.js';

import { SqlEntityManager } from '@mikro-orm/sql';
import type { OracleDriver } from './OracleDriver.js';

export type EntityManager = SqlEntityManager<OracleDriver>;
export const EntityManager = SqlEntityManager;
