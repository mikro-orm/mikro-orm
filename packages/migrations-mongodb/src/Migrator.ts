import { Umzug, type InputMigrations, type MigrateDownOptions, type MigrateUpOptions, type MigrationParams, type RunnableMigration } from 'umzug';
import { join } from 'node:path';
import {
  Utils,
  type Constructor,
  type Configuration,
  type IMigrationGenerator,
  type IMigrator,
  type MikroORM,
  type Transaction,
  type MigrationsOptions,
  type MigratorEvent,
  type MaybePromise,
} from '@mikro-orm/core';
import type { EntityManager, MongoDriver } from '@mikro-orm/mongodb';
import type { Migration } from './Migration.js';
import { MigrationRunner } from './MigrationRunner.js';
import { MigrationStorage } from './MigrationStorage.js';
import type { MigrateOptions, MigrationResult, MigrationRow, UmzugMigration } from './typings.js';
import { TSMigrationGenerator } from './TSMigrationGenerator.js';
import { JSMigrationGenerator } from './JSMigrationGenerator.js';

export class Migrator implements IMigrator {

  private umzug!: Umzug;
  private runner!: MigrationRunner;
  private storage!: MigrationStorage;
  private generator!: IMigrationGenerator;
  private readonly driver: MongoDriver;
  private readonly config: Configuration;
  private readonly options: MigrationsOptions;
  private readonly absolutePath: string;

  constructor(private readonly em: EntityManager) {
    this.driver = this.em.getDriver();
    this.config = this.em.config;
    this.options = this.config.get('migrations');

    /* v8 ignore next */
    const key = (this.config.get('preferTs', Utils.detectTypeScriptSupport()) && this.options.pathTs) ? 'pathTs' : 'path';
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
    this.ensureMigrationsDirExists();
    const diff = { up: [], down: [] };
    const migration = await this.generator.generate(diff, path, name);

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  /* v8 ignore start */
  /**
   * @inheritDoc
   */
  async checkMigrationNeeded(): Promise<boolean> {
    return true;
  }
  /* v8 ignore stop */

  /**
   * @inheritDoc
   */
  async createInitialMigration(path?: string): Promise<MigrationResult> {
    return this.createMigration(path);
  }

  /**
   * @inheritDoc
   */
  on(eventName: MigratorEvent, listener: (event: UmzugMigration) => MaybePromise<void>): this {
    this.umzug.on(eventName, listener);
    return this;
  }

  /**
   * @inheritDoc
   */
  off(eventName: MigratorEvent, listener: (event: UmzugMigration) => MaybePromise<void>): this {
    this.umzug.off(eventName, listener);
    return this;
  }

  private createUmzug(): void {
    this.runner = new MigrationRunner(this.driver, this.options);
    this.storage = new MigrationStorage(this.driver, this.options);

    let migrations: InputMigrations<any> = {
      glob: join(this.absolutePath, this.options.glob!).replace(/\\/g, '/'),
      resolve: (params: MigrationParams<any>) => this.resolve(params),
    };

    /* v8 ignore next 8 */
    if (this.options.migrationsList) {
      migrations = this.options.migrationsList.map(migration => {
        if (typeof migration === 'function') {
          return this.initialize(migration as Constructor<Migration>, migration.name);
        }
        return this.initialize(migration.class as Constructor<Migration>, migration.name);
      });
    }

    this.umzug = new Umzug({
      storage: this.storage,
      logger: undefined,
      migrations,
    });

    if (!this.options.silent) {
      const logger = this.config.getLogger();
      this.umzug.on('migrating', event => logger.log('migrator', `Processing '${event.name}'`, { enabled: true }));
      this.umzug.on('migrated', event => logger.log('migrator', `Applied '${event.name}'`, { enabled: true }));
      this.umzug.on('reverting', event => logger.log('migrator', `Processing '${event.name}'`, { enabled: true }));
      this.umzug.on('reverted', event => logger.log('migrator', `Reverted '${event.name}'`, { enabled: true }));
    }

    /* v8 ignore next 3 */
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
    this.ensureMigrationsDirExists();
    return this.storage.getExecutedMigrations();
  }

  /**
   * @inheritDoc
   */
  async getPendingMigrations(): Promise<UmzugMigration[]> {
    this.ensureMigrationsDirExists();
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

  protected initialize(MigrationClass: Constructor<Migration>, name: string): RunnableMigration<any> {
    const instance = new MigrationClass(this.driver, this.config);

    return {
      name: this.storage.getMigrationName(name),
      up: () => this.runner.run(instance, 'up'),
      /* v8 ignore next */
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
    this.ensureMigrationsDirExists();

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

  private ensureMigrationsDirExists() {
    if (!this.options.migrationsList) {
      Utils.ensureDir(this.absolutePath);
    }
  }

}
