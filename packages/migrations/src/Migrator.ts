import umzug, { migrationsList, Umzug } from 'umzug';
import { ensureDir } from 'fs-extra';
import { Constructor, Dictionary, Transaction, Utils } from '@mikro-orm/core';
import { EntityManager, SchemaGenerator } from '@mikro-orm/knex';
import { Migration } from './Migration';
import { MigrationRunner } from './MigrationRunner';
import { MigrationGenerator } from './MigrationGenerator';
import { MigrationStorage } from './MigrationStorage';
import { MigrateOptions, MigrationResult, MigrationRow, UmzugMigration } from './typings';

export class Migrator {

  private readonly umzug: Umzug;
  private readonly driver = this.em.getDriver();
  private readonly schemaGenerator = new SchemaGenerator(this.em);
  private readonly config = this.em.config;
  private readonly options = this.config.get('migrations');
  private readonly runner = new MigrationRunner(this.driver, this.options, this.config);
  private readonly generator = new MigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
  private readonly storage = new MigrationStorage(this.driver, this.options);

  constructor(private readonly em: EntityManager) {
    let migrations: Dictionary = {
      path: Utils.absolutePath(this.options.path!, this.config.get('baseDir')),
      pattern: this.options.pattern,
      customResolver: (file: string) => this.resolve(file),
    };

    if (this.options.migrationsList?.length) {
      const list = this.options.migrationsList.map(migration => this.initialize(migration.class as Constructor<Migration>, migration.name));
      migrations = migrationsList(list as any[]);
    }

    this.umzug = new umzug({
      storage: this.storage,
      logging: this.config.get('logger'),
      migrations,
    });
  }

  async createMigration(path?: string, blank = false, initial = false): Promise<MigrationResult> {
    await ensureDir(Utils.normalizePath(this.options.path!));

    if (initial) {
      await this.validateInitialMigration();
    }

    const diff = await this.getSchemaDiff(blank, initial);

    if (diff.length === 0) {
      return { fileName: '', code: '', diff };
    }

    const migration = await this.generator.generate(diff, path);

    if (initial) {
      await this.storage.logMigration(migration[1]);
    }

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  async validateInitialMigration() {
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();

    if (executed.length > 0 || pending.length > 0) {
      throw new Error('Initial migration cannot be created, as some migrations already exist');
    }
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    await ensureDir(Utils.normalizePath(this.options.path!));
    await this.storage.ensureTable();
    return this.storage.getExecutedMigrations();
  }

  async getPendingMigrations(): Promise<UmzugMigration[]> {
    await ensureDir(Utils.normalizePath(this.options.path!));
    await this.storage.ensureTable();
    return this.umzug.pending();
  }

  async up(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]> {
    return this.runMigrations('up', options);
  }

  async down(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]> {
    return this.runMigrations('down', options);
  }

  getStorage(): MigrationStorage {
    return this.storage;
  }

  protected resolve(file: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const migration = require(file);
    const MigrationClass = Object.values(migration)[0] as Constructor<Migration>;

    return this.initialize(MigrationClass);
  }

  protected initialize(MigrationClass: Constructor<Migration>, name?: string) {
    const instance = new MigrationClass(this.driver, this.config);

    return {
      name,
      up: () => this.runner.run(instance, 'up'),
      down: () => this.runner.run(instance, 'down'),
    };
  }

  private async getSchemaDiff(blank: boolean, initial: boolean): Promise<string[]> {
    const lines: string[] = [];

    if (blank) {
      lines.push('select 1');
    } else if (initial) {
      const dump = await this.schemaGenerator.getCreateSchemaSQL(false);
      lines.push(...dump.split('\n'));
    } else {
      const dump = await this.schemaGenerator.getUpdateSchemaSQL(false, this.options.safe, this.options.dropTables);
      lines.push(...dump.split('\n'));
    }

    for (let i = lines.length - 1; i > 0; i--) {
      if (lines[i]) {
        break;
      }

      delete lines[i];
    }

    return lines;
  }

  private prefix<T extends string | string[] | { from?: string; to?: string; migrations?: string[]; transaction?: Transaction }>(options?: T): T {
    if (Utils.isString(options) || Array.isArray(options)) {
      return Utils.asArray(options).map(m => {
        const name = m.replace(/\.[jt]s$/, '');
        return name.match(/^\d{14}$/) ? this.options.fileName!(name) : m;
      }) as T;
    }

    if (!Utils.isObject<{ from?: string; to?: string; migrations?: string[]; transaction?: Transaction }>(options)) {
      return options as T;
    }

    if (options.migrations) {
      options.migrations = options.migrations.map(m => this.prefix(m));
    }

    if (options.transaction) {
      delete options.transaction;
    }

    ['from', 'to'].filter(k => options[k]).forEach(k => options[k] = this.prefix(options[k]));

    return options as T;
  }

  private async runMigrations(method: 'up' | 'down', options?: string | string[] | MigrateOptions) {
    await ensureDir(Utils.normalizePath(this.options.path!));
    await this.storage.ensureTable();

    if (!this.options.transactional || !this.options.allOrNothing) {
      return this.umzug[method](this.prefix(options as string[]));
    }

    if (Utils.isObject<MigrateOptions>(options) && options.transaction) {
      return this.runInTransaction(options.transaction, method, options);
    }

    return this.driver.getConnection().transactional(trx => this.runInTransaction(trx, method, options));
  }

  private async runInTransaction(trx: Transaction, method: 'up' | 'down', options: string | string[] | undefined | MigrateOptions) {
    this.runner.setMasterMigration(trx);
    this.storage.setMasterMigration(trx);
    const ret = await this.umzug[method](this.prefix(options as string[]));
    this.runner.unsetMasterMigration();
    this.storage.unsetMasterMigration();

    return ret;
  }

}
