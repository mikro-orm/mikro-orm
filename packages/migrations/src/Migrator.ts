import umzug, { Umzug } from 'umzug';
import { Utils, Constructor } from '@mikro-orm/core';
import { SchemaGenerator, EntityManager } from '@mikro-orm/knex';
import { Migration } from './Migration';
import { MigrationRunner } from './MigrationRunner';
import { MigrationGenerator } from './MigrationGenerator';
import { MigrationStorage } from './MigrationStorage';

export class Migrator {

  private readonly umzug: Umzug;
  private readonly driver = this.em.getDriver();
  private readonly schemaGenerator = new SchemaGenerator(this.em);
  private readonly config = this.em.config;
  private readonly options = this.config.get('migrations');
  private readonly runner = new MigrationRunner(this.driver, this.options);
  private readonly generator = new MigrationGenerator(this.driver, this.options);
  private readonly storage = new MigrationStorage(this.driver, this.options);

  constructor(private readonly em: EntityManager) {
    this.umzug = new umzug({
      storage: this.storage,
      logging: this.config.get('logger'),
      migrations: {
        path: Utils.absolutePath(this.options.path!, this.config.get('baseDir')),
        pattern: this.options.pattern,
        customResolver: file => this.resolve(file),
      },
    });
  }

  async createMigration(path?: string, blank = false): Promise<MigrationResult> {
    const diff = blank ? ['select 1'] : await this.getSchemaDiff();

    if (diff.length === 0) {
      return { fileName: '', code: '', diff };
    }

    const migration = await this.generator.generate(diff, path);

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    await this.storage.ensureTable();
    return this.storage.getExecutedMigrations();
  }

  async getPendingMigrations(): Promise<UmzugMigration[]> {
    await this.storage.ensureTable();
    return this.umzug.pending();
  }

  async up(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]> {
    return this.runMigrations('up', options);
  }

  async down(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]> {
    return this.runMigrations('down', options);
  }

  protected resolve(file: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const migration = require(file);
    const MigrationClass = Object.values(migration)[0] as Constructor<Migration>;
    const instance = new MigrationClass(this.driver.getConnection(), this.config);

    return {
      up: () => this.runner.run(instance, 'up'),
      down: () => this.runner.run(instance, 'down'),
    };
  }

  private async getSchemaDiff(): Promise<string[]> {
    const dump = await this.schemaGenerator.getUpdateSchemaSQL(false, this.options.safe, this.options.dropTables);
    const lines = dump.split('\n');

    for (let i = lines.length - 1; i > 0; i--) {
      if (lines[i]) {
        break;
      }

      delete lines[i];
    }

    return lines;
  }

  private prefix<T extends string | string[] | { from?: string; to?: string; migrations?: string[] }>(options?: T): T {
    if (Utils.isString(options) || Array.isArray(options)) {
      return Utils.asArray(options).map(m => m.startsWith('Migration') ? m : 'Migration' + m) as T;
    }

    if (!Utils.isObject<{ from?: string; to?: string; migrations?: string[] }>(options)) {
      return options as T;
    }

    if (options.migrations) {
      options.migrations = options.migrations.map(m => this.prefix(m));
    }

    ['from', 'to'].filter(k => options[k]).forEach(k => options[k] = this.prefix(options[k]));

    return options as T;
  }

  private async runMigrations(method: 'up' | 'down', options?: string | string[] | MigrateOptions) {
    await this.storage.ensureTable();

    if (!this.options.transactional || !this.options.allOrNothing) {
      return this.umzug[method](this.prefix(options as string[]));
    }

    return this.driver.getConnection().transactional(async trx => {
      this.runner.setMasterMigration(trx);
      this.storage.setMasterMigration(trx);
      const ret = await this.umzug[method](this.prefix(options as string[]));
      this.runner.unsetMasterMigration();
      this.storage.unsetMasterMigration();

      return ret;
    });
  }

}

export type UmzugMigration = { path?: string; file: string };
export type MigrateOptions = { from?: string | number; to?: string | number; migrations?: string[] };
export type MigrationResult = { fileName: string; code: string; diff: string[] };
export type MigrationRow = { name: string; executed_at: Date };
