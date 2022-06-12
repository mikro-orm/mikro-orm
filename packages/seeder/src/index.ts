/**
 * @packageDocumentation
 * @module seeder
 */
/* istanbul ignore file */

export * from './Seeder';
export * from './Factory';
export * from './SeedManager';

// reexport faker instance and Faker type
import { faker, Faker } from '@faker-js/faker';
export { faker, Faker };
