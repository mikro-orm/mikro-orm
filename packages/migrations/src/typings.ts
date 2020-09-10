declare module 'umzug' {

  interface MigrationDefinitionWithName extends UmzugMigration {
    name: string;
  }

  interface UmzugStatic {
    migrationsList(migrations: MigrationDefinitionWithName[], parameters?: any[]): UmzugMigration[];
  }

}

export type UmzugMigration = { name?: string; path?: string; file: string };
export type MigrateOptions = { from?: string | number; to?: string | number; migrations?: string[] };
export type MigrationResult = { fileName: string; code: string; diff: string[] };
export type MigrationRow = { name: string; executed_at: Date };
