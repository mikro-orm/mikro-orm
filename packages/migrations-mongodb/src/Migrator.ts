import { Umzug, type InputMigrations, type MigrateDownOptions, type MigrateUpOptions, type MigrationParams, type RunnableMigration } from 'umzug';
import { join } from 'path';
import { ensureDir } from 'fs-extra';
import { Utils, type Constructor, type IMigrationGenerator, type IMigrator, type MikroORM, type Transaction } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/mongodb';
import type { Migration } from './Migration';
import { MigrationRunner } from './MigrationRunner';
import { MigrationStorage } from './MigrationStorage';
import type { MigrateOptions, MigrationResult, MigrationRow, UmzugMigration } from './typings';
import { TSMigrationGenerator } from './TSMigrationGenerator';
import { JSMigrationGenerator } from './JSMigrationGenerator';

export class Migrator implements IMigrator {

  private umzug!: Umzug;
  private runner!: MigrationRunner;
  private storage!: MigrationStorage;
  private generator!: IMigrationGenerator;
  private readonly driver = this.em.getDriver();
  private readonly config = this.em.config;
  private readonly options = this.config.get('migrations');
  private readonly absolutePath: string;

  constructor(private readonly em: EntityManager) {
    /* istanbul ignore next */
    const key = (this.config.get('tsNode', Utils.detectTsNode()) && this.options.pathTs) ? 'pathTs' : 'path';
    this.absolutePath = Utils.absolutePath(this.options[key]!, this.config.get('baseDir'));
    this.createUmzug();
  }

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/migrator', () => new Migrator(orm.em as EntityManager));
  }

  /**
   * @inheritDoc
   */
  async createMigration(path?: string, blank = false, initial = false, name?: string): Promise<MigrationResult> {
    await this.ensureMigrationsDirExists();
    const diff = { up: [], down: [] };
    const migration = await this.generator.generate(diff, path, name);

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  /**
   * @inheritDoc
   */
  async checkMigrationNeeded(): Promise<boolean> {
    return true;
  }

  /**
   * @inheritDoc
   */
  async createInitialMigration(path?: string): Promise<MigrationResult> {
    return this.createMigration(path);
  }

  private createUmzug(): void {
    this.runner = new MigrationRunner(this.driver, this.options);
    this.storage = new MigrationStorage(this.driver, this.options);

    let migrations: InputMigrations<any> = {
      glob: join(this.absolutePath, this.options.glob!).replace(/\\/g, '/'),
      resolve: (params: MigrationParams<any>) => this.resolve(params),
    };

    /* istanbul ignore next */
    if (this.options.migrationsList) {
      migrations = this.options.migrationsList.map(migration => this.initialize(migration.class as Constructor<Migration>, migration.name));
    }

    this.umzug = new Umzug({
      storage: this.storage,
      logger: undefined,
      migrations,
    });

    if (!this.options.silent) {
      const logger = this.config.get('logger');
      this.umzug.on('migrating', event => logger(`Processing '${event.name}'`));
      this.umzug.on('migrated', event => logger(`Applied '${event.name}'`));
      this.umzug.on('reverting', event => logger(`Processing '${event.name}'`));
      this.umzug.on('reverted', event => logger(`Reverted '${event.name}'`));
    }

    /* istanbul ignore next */
    if (this.options.generator) {
      this.generator = new this.options.generator(this.driver, this.config.getNamingStrategy(), this.options);
    } else if (this.options.emit === 'js' || this.options.emit === 'cjs') {
      this.generator = new JSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
    } else {
      this.generator = new TSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
    }
  }

  /**
   * @inheritDoc
   */
  async getExecutedMigrations(): Promise<MigrationRow[]> {
    await this.ensureMigrationsDirExists();
    return this.storage.getExecutedMigrations();
  }

  /**
   * @inheritDoc
   */
  async getPendingMigrations(): Promise<UmzugMigration[]> {
    await this.ensureMigrationsDirExists();
    return this.umzug.pending();
  }

  /**
   * @inheritDoc
   */
  async up(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]> {
    return this.runMigrations('up', options);
  }

  /**
   * @inheritDoc
   */
  async down(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]> {
    return this.runMigrations('down', options);
  }

  getStorage(): MigrationStorage {
    return this.storage;
  }

  protected resolve(params: MigrationParams<any>): RunnableMigration<any> {
    const createMigrationHandler = async (method: 'up' | 'down') => {
      const migration = await Utils.dynamicImport(params.path!);
      const MigrationClass = Object.values(migration)[0] as Constructor<Migration>;
      const instance = new MigrationClass(this.driver, this.config);

      await this.runner.run(instance, method);
    };

    return {
      name: this.storage.getMigrationName(params.name),
      up: () => createMigrationHandler('up'),
      down: () => createMigrationHandler('down'),
    };
  }

  /* istanbul ignore next */
  protected initialize(MigrationClass: Constructor<Migration>, name: string): RunnableMigration<any> {
    const instance = new MigrationClass(this.driver, this.config);

    return {
      name: this.storage.getMigrationName(name),
      up: () => this.runner.run(instance, 'up'),
      down: () => this.runner.run(instance, 'down'),
    };
  }

  private getMigrationFilename(name: string): string {
    name = name.replace(/\.[jt]s$/, '');
    return name.match(/^\d{14}$/) ? this.options.fileName!(name) : name;
  }

  private prefix<T extends string | string[] | { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction }>(options?: T): MigrateUpOptions & MigrateDownOptions {
    if (Utils.isString(options) || Array.isArray(options)) {
      return { migrations: Utils.asArray(options).map(name => this.getMigrationFilename(name)) };
    }

    if (!options) {
      return {};
    }

    if (options.migrations) {
      options.migrations = options.migrations.map(name => this.getMigrationFilename(name));
    }

    if (options.transaction) {
      delete options.transaction;
    }

    (['from', 'to'] as const).filter(k => options[k]).forEach(k => options[k] = this.getMigrationFilename(options[k] as string));

    return options as MigrateUpOptions;
  }

  private async runMigrations(method: 'up' | 'down', options?: string | string[] | MigrateOptions) {
    await this.ensureMigrationsDirExists();

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
    const ret = await this.umzug[method](this.prefix(options));
    this.runner.unsetMasterMigration();
    this.storage.unsetMasterMigration();

    return ret;
  }

  private async ensureMigrationsDirExists() {
    if (!this.options.migrationsList) {
      await ensureDir(this.absolutePath);
    }
  }

}
