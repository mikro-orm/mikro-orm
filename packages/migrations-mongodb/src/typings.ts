export type { MigrationInfo, MigrateOptions, MigrationResult, MigrationRow } from '@mikro-orm/core';

/** @internal */
export function rejectRuntimeSchema(schema: string | undefined): void {
  if (schema) {
    throw new Error('Runtime schema for migrations is not supported by the MongoDriver');
  }
}
