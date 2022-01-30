/**
 * @packageDocumentation
 * @module seeder
 */
/* istanbul ignore file */

export * from './seeder';
export * from './factory';
export * from './seed-manager';

// reexport faker instance and Faker type
import faker, { Faker } from '@faker-js/faker';
export { faker, Faker };
