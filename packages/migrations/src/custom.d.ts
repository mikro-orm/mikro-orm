import { Migration } from 'umzug';

declare module 'umzug' {
  interface MigrationDefinitionWithName extends Migration {
    name: string;
  }

  interface UmzugStatic {
    migrationsList(migrations: MigrationDefinitionWithName[], parameters?: any[]): Migration[];
  }
}
