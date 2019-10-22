import umzug, { DownToOptions, Migration as UmzugMigration, Umzug, UpDownMigrationsOptions, UpToOptions } from 'umzug';

import { AbstractSqlDriver, Constructor } from '../drivers';
import { Configuration, Utils } from '../utils';
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

  async createMigration(path?: string, blank = false): Promise<[string, string, string[]]> {
    const diff = blank ? ['select 1'] : await this.getSchemaDiff();
    const migration = await this.generator.generate(diff, path);

    return [...migration, diff] as [string, string, string[]];
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    await this.storage.ensureTable();
    return this.storage.getExecutedMigrations();
  }

  async getPendingMigrations(): Promise<UmzugMigration[]> {
    await this.storage.ensureTable();
    return this.umzug.pending();
  }

  async up(migration?: string): Promise<UmzugMigration[]>; // tslint:disable-next-line:lines-between-class-members
  async up(migrations?: string[]): Promise<UmzugMigration[]>; // tslint:disable-next-line:lines-between-class-members
  async up(options?: UpToOptions | UpDownMigrationsOptions): Promise<UmzugMigration[]>; // tslint:disable-next-line:lines-between-class-members
  async up(options?: string | string[] | UpToOptions | UpDownMigrationsOptions): Promise<UmzugMigration[]> {
    await this.storage.ensureTable();
    return this.umzug.up(this.prefix(options) as string[]);
  }

  async down(migration?: string): Promise<UmzugMigration[]>; // tslint:disable-next-line:lines-between-class-members
  async down(migrations?: string[]): Promise<UmzugMigration[]>; // tslint:disable-next-line:lines-between-class-members
  async down(options?: DownToOptions | UpDownMigrationsOptions): Promise<UmzugMigration[]>; // tslint:disable-next-line:lines-between-class-members
  async down(options?: string | string[] | DownToOptions | UpDownMigrationsOptions): Promise<UmzugMigration[]> {
    await this.storage.ensureTable();
    return this.umzug.down(this.prefix(options as string[]));
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

  private prefix<T extends string | string[] | { from?: string; to?: string; migrations?: string[] }>(options?: T): T {
    if (Utils.isObject<{ migrations: string[] }>(options) && options.migrations) {
      options.migrations = options.migrations.map(m => this.prefix(m));
    }

    if (Utils.isObject<{ to: string }>(options) && options.to) {
      options.to = this.prefix(options.to);
    }

    if (Utils.isObject<{ from: string }>(options) && options.from) {
      options.from = this.prefix(options.from);
    }

    if (Utils.isString(options) || Array.isArray(options)) {
      return Utils.asArray(options).map(m => m.startsWith('Migration') ? m : 'Migration' + m) as T;
    }

    return options as T;
  }

}
