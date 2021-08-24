import { Transaction } from '@mikro-orm/core';

export type UmzugMigration = { name?: string; path?: string; file: string };
export type MigrateOptions = { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction };
export type MigrationResult = { fileName: string; code: string; diff: { up: string[]; down: string[] } };
export type MigrationRow = { name: string; executed_at: Date };
