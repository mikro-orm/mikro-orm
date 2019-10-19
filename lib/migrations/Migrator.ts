import umzug, { Migration as UmzugMigration, Umzug } from 'umzug';

import { AbstractSqlDriver, Constructor } from '../drivers';
import { Configuration } from '../utils';
import { SchemaGenerator } from '../schema';
import { Migration } from './Migration';
import { MigrationRunner } from './MigrationRunner';
import { MigrationGenerator } from './MigrationGenerator';
import { MigrationRow, MigrationStorage } from './MigrationStorage';

export class Migrator {

  private readonly umzug: Umzug;
  private readonly options = this.config.get('migrations');
  private readonly runner = new MigrationRunner(this.driver, this.config.get('migrations'));
  private readonly generator = new MigrationGenerator(this.driver, this.config.get('migrations'));
  private readonly storage = new MigrationStorage(this.driver, this.config.get('migrations'));

  constructor(private readonly driver: AbstractSqlDriver,
              private readonly schemaGenerator: SchemaGenerator,
              private readonly config: Configuration) {
    this.umzug = new umzug({
      storage: this.storage,
      logging: this.config.get('logger'),
      migrations: {
        path: this.options.path,
        pattern: this.options.pattern,
        customResolver: file => this.resolve(file),
      },
    });
  }

  async createMigration(): Promise<string> {
    const diff = await this.getSchemaDiff();
    return this.generator.generate(diff);
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    return this.storage.getExecutedMigrations();
  }

  async up(migration?: string): Promise<UmzugMigration[]> {
    await this.storage.ensureTable();
    return this.umzug.up(migration);
  }

  async down(migration?: string): Promise<UmzugMigration[]> {
    await this.storage.ensureTable();
    return this.umzug.down(migration);
  }

  private async getSchemaDiff(): Promise<string[]> {
    const dump = await this.schemaGenerator.getUpdateSchemaSQL(false);
    const lines = dump.split('\n');

    for (let i = lines.length - 1; i > 0; i--) {
      if (lines[i]) {
        break;
      }

      delete lines[i];
    }

    return lines;
  }

  private resolve(file: string) {
    const migration = require(file);
    const MigrationClass = Object.values(migration)[0] as Constructor<Migration>;
    const instance = new MigrationClass(this.driver.getConnection(), this.config);

    return {
      up: () => this.runner.run(instance, 'up'),
      down: () => this.runner.run(instance, 'down'),
    };
  }

}
