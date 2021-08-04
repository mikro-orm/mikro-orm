/**
 * @packageDocumentation
 * @module knex
 */
/* istanbul ignore file */
export * from './AbstractSqlConnection';
export * from './AbstractSqlDriver';
export * from './AbstractSqlPlatform';
export * from './MonkeyPatchable';
export * from './SqlEntityManager';
export * from './SqlEntityRepository';
export * from './query';
export * from './schema';
export * from './typings';
export { SqlEntityManager as EntityManager } from './SqlEntityManager';
export { SqlEntityRepository as EntityRepository } from './SqlEntityRepository';

/** @ignore */
export { Knex, knex } from 'knex';
