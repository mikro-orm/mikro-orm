/**
 * @packageDocumentation
 * @module knex
 */
/* istanbul ignore file */
export * from './AbstractSqlConnection';
export * from './AbstractSqlDriver';
export * from './AbstractSqlPlatform';
export * from './MonkeyPatchable';
export * from './query';
export * from './schema';
export * from './SqlEntityManager';
export { SqlEntityManager as EntityManager } from './SqlEntityManager';
export * from './SqlEntityRepository';
export { SqlEntityRepository as EntityRepository } from './SqlEntityRepository';
export * from './typings';

/** @ignore */
export * from '@mikro-orm/core';
export { Knex, knex } from 'knex';
