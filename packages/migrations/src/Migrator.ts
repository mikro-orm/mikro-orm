import {
  type InputMigrations,
  type MigrateDownOptions,
  type MigrateUpOptions,
  type MigrationParams,
  type RunnableMigration,
  Umzug,
} from 'umzug';
import { basename, join } from 'node:path';
import { existsSync, writeFileSync } from 'node:fs';
import {
  type Configuration,
  type Constructor,
  type Dictionary,
  type IMigrationGenerator,
  type IMigrator,
  type MaybePromise,
  type MigrationsOptions,
  type MigratorEvent,
  type MikroORM,
  t,
  type Transaction,
  Type,
  UnknownType,
  Utils,
} from '@mikro-orm/core';
import { fs } from '@mikro-orm/core/fs-utils';
import {
  type AbstractSqlDriver,
  DatabaseSchema,
  DatabaseTable,
  type EntityManager,
  type SqlSchemaGenerator,
} from '@mikro-orm/knex';
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
  private readonly driver: AbstractSqlDriver;
  private readonly schemaGenerator: SqlSchemaGenerator;
  private readonly config: Configuration;
  private readonly options: MigrationsOptions;
  private readonly absolutePath: string;
  private readonly snapshotPath: string;

  constructor(private readonly em: EntityManager) {
    this.driver = this.em.getDriver();
    this.config = this.em.config;
    this.options = this.config.get('migrations');
    this.schemaGenerator = this.config.getExtension('@mikro-orm/schema-generator')!;
    this.detectSourceFolder();

    /* v8 ignore next */
    const key = (this.config.get('preferTs', Utils.detectTypeScriptSupport()) && this.options.pathTs) ? 'pathTs' : 'path';
    this.absolutePath = Utils.absolutePath(this.options[key]!, this.config.get('baseDir'));
    // for snapshots, we always want to use the path based on `emit` option, regardless of whether we run in TS context
    /* v8 ignore next */
    const snapshotPath = this.options.emit === 'ts' && this.options.pathTs ? this.options.pathTs : this.options.path!;
    const absoluteSnapshotPath = Utils.absolutePath(snapshotPath, this.config.get('baseDir'));
    const dbName = basename(this.config.get('dbName'));
    const snapshotName = this.options.snapshotName ?? `.snapshot-${dbName}`;
    this.snapshotPath = Utils.normalizePath(absoluteSnapshotPath, `${snapshotName}.json`);
    this.createUmzug();
  }

  /**
   * Checks if `src` folder exists, it so, tries to adjust the migrations and seeders paths automatically to use it.
   * If there is a `dist` or `build` folder, it will be used for the JS variant (`path` option), while the `src` folder will be
   * used for the TS variant (`pathTs` option).
   *
   * If the default folder exists (e.g. `/migrations`), the config will respect that, so this auto-detection should not
   * break existing projects, only help with the new ones.
   */
  private detectSourceFolder(): void {
    const baseDir = this.config.get('baseDir');
    const defaultPath = './migrations';

    if (!fs.pathExists(baseDir + '/src')) {
      this.options.path ??= defaultPath;
      return;
    }

    const exists = fs.pathExists(`${baseDir}/${defaultPath}`);
    const distDir = fs.pathExists(baseDir + '/dist');
    const buildDir = fs.pathExists(baseDir + '/build');
    // if neither `dist` nor `build` exist, we use the `src` folder as it might be a JS project without building, but with `src` folder
    /* v8 ignore next */
    const path = distDir ? './dist' : (buildDir ? './build' : './src');

    // only if the user did not provide any values and if the default path does not exist
    if (!this.options.path && !this.options.pathTs && !exists) {
      this.options.path = `${path}/migrations`;
      this.options.pathTs = './src/migrations';
    }
  }

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/migrator', () => new Migrator(orm.em as EntityManager));
  }

  /**
   * @inheritDoc
   */
  async create(path?: string, blank = false, initial = false, name?: string): Promise<MigrationResult> {
    if (initial) {
      return this.createInitial(path, name, blank);
    }

    this.ensureMigrationsDirExists();
    const diff = await this.getSchemaDiff(blank, initial);

    if (diff.up.length === 0) {
      return { fileName: '', code: '', diff };
    }

    const migration = await this.generator.generate(diff, path, name);
    await this.storeCurrentSchema();

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  async checkSchema(): Promise<boolean> {
    this.ensureMigrationsDirExists();
    const diff = await this.getSchemaDiff(false, false);
    return diff.up.length > 0;
  }

  /**
   * @inheritDoc
   */
  async createInitial(path?: string, name?: string, blank = false): Promise<MigrationResult> {
    this.ensureMigrationsDirExists();
    const schemaExists = await this.validateInitialMigration(blank);
    const diff = await this.getSchemaDiff(blank, true);
    const migration = await this.generator.generate(diff, path, name);
    await this.storeCurrentSchema();

    if (schemaExists && !blank) {
      await this.storage.logMigration({ name: migration[1], context: null });
    }

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
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
    this.runner = new MigrationRunner(this.driver, this.options, this.config);
    this.storage = new MigrationStorage(this.driver, this.options);

    let migrations: InputMigrations<any> = {
      glob: join(this.absolutePath, this.options.glob!).replace(/\\/g, '/'),
      resolve: (params: MigrationParams<any>) => this.resolve(params),
    };

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

    /* v8 ignore else */
    if (!this.options.silent) {
      const logger = this.config.getLogger();
      this.umzug.on('migrating', event => logger.log('migrator', `Processing '${event.name}'`, { enabled: true }));
      this.umzug.on('migrated', event => logger.log('migrator', `Applied '${event.name}'`, { enabled: true }));
      this.umzug.on('reverting', event => logger.log('migrator', `Processing '${event.name}'`, { enabled: true }));
      this.umzug.on('reverted', event => logger.log('migrator', `Reverted '${event.name}'`, { enabled: true }));
    }

    if (this.options.generator) {
      this.generator = new this.options.generator(this.driver, this.config.getNamingStrategy(), this.options);
    } else if (this.options.emit === 'js' || this.options.emit === 'cjs') {
      this.generator = new JSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
    } else {
      this.generator = new TSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
    }
  }

  /**
   * Initial migration can be created only if:
   * 1. no previous migrations were generated or executed
   * 2. existing schema do not contain any of the tables defined by metadata
   *
   * If existing schema contains all of the tables already, we return true, based on that we mark the migration as already executed.
   * If only some of the tables are present, exception is thrown.
   */
  private async validateInitialMigration(blank: boolean): Promise<boolean> {
    const executed = await this.getExecuted();
    const pending = await this.getPending();

    if (executed.length > 0 || pending.length > 0) {
      throw new Error('Initial migration cannot be created, as some migrations already exist');
    }

    const schema = await DatabaseSchema.create(this.em.getConnection(), this.em.getPlatform(), this.config);
    const exists = new Set<string>();
    const expected = new Set<string>();

    Object.values(this.em.getMetadata().getAll())
      .filter(meta => meta.tableName && !meta.embeddable && !meta.virtual)
      .forEach(meta => {
        const schema = meta.schema ?? this.config.get('schema', this.em.getPlatform().getDefaultSchemaName());
        expected.add(schema ? `${schema}.${meta.collection}` : meta.collection);
      });

    schema.getTables().forEach(table => {
      const schema = table.schema ?? this.em.getPlatform().getDefaultSchemaName();
      const tableName = schema ? `${schema}.${table.name}` : table.name;

      if (expected.has(tableName)) {
        exists.add(table.schema ? `${table.schema}.${table.name}` : table.name);
      }
    });

    if (expected.size === 0 && !blank) {
      throw new Error('No entities found');
    }

    if (exists.size > 0 && expected.size !== exists.size) {
      throw new Error(`Some tables already exist in your schema, remove them first to create the initial migration: ${[...exists].join(', ')}`);
    }

    return expected.size === exists.size;
  }

  /**
   * @inheritDoc
   */
  async getExecuted(): Promise<MigrationRow[]> {
    await this.ensureDatabase();
    return this.storage.getExecutedMigrations();
  }

  private async ensureDatabase(): Promise<void> {
    this.ensureMigrationsDirExists();
    const created = await this.schemaGenerator.ensureDatabase();

    /* v8 ignore next */
    if (created) {
      this.createUmzug();
    }

    await this.storage.ensureTable();
  }

  /**
   * @inheritDoc
   */
  async getPending(): Promise<UmzugMigration[]> {
    await this.ensureDatabase();
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
      const MigrationClass = Object.values(migration).find(cls => typeof cls === 'function' && typeof cls.constructor === 'function') as Constructor<Migration>;
      const instance = new MigrationClass(this.driver, this.config);

      await this.runner.run(instance, method);
    };

    return {
      name: this.storage.getMigrationName(params.name),
      up: () => createMigrationHandler('up'),
      down: () => createMigrationHandler('down'),
    };
  }

  protected getSchemaFromSnapshot() {
    if (!this.options.snapshot || !existsSync(this.snapshotPath)) {
      return undefined;
    }

    const data = fs.readJSONSync(this.snapshotPath);
    const schema = new DatabaseSchema(this.driver.getPlatform(), this.config.get('schema'));
    const { tables, namespaces, ...rest } = data;
    const tableInstances = tables.map((tbl: Dictionary) => {
      const table = new DatabaseTable(this.driver.getPlatform(), tbl.name);
      const { columns, ...restTable } = tbl;
      Object.assign(table, restTable);
      Object.keys(columns).forEach(col => {
        const column = { ...columns[col] };
        /* v8 ignore next */
        column.mappedType = Type.getType(t[columns[col].mappedType as keyof typeof t] as any ?? UnknownType);
        table.addColumn(column);
      });

      return table;
    });
    Object.assign(schema, { tables: tableInstances, namespaces: new Set(namespaces), ...rest });

    return schema;
  }

  protected async storeCurrentSchema(): Promise<void> {
    if (!this.options.snapshot) {
      return;
    }

    const schema = this.schemaGenerator.getTargetSchema();
    writeFileSync(this.snapshotPath, JSON.stringify(schema, null, 2));
  }

  protected initialize(MigrationClass: Constructor<Migration>, name: string): RunnableMigration<any> {
    const instance = new MigrationClass(this.driver, this.config);

    return {
      name: this.storage.getMigrationName(name),
      up: () => this.runner.run(instance, 'up'),
      down: () => this.runner.run(instance, 'down'),
    };
  }

  private async getSchemaDiff(blank: boolean, initial: boolean): Promise<{ up: string[]; down: string[] }> {
    const up: string[] = [];
    const down: string[] = [];

    if (blank) {
      up.push('select 1');
      down.push('select 1');
    } else if (initial) {
      const dump = await this.schemaGenerator.getCreateSchemaSQL({ wrap: false });
      up.push(...dump.split('\n'));
    } else {
      const diff = await this.schemaGenerator.getUpdateSchemaMigrationSQL({
        wrap: false,
        safe: this.options.safe,
        dropTables: this.options.dropTables,
        fromSchema: this.getSchemaFromSnapshot(),
      });
      up.push(...diff.up.split('\n'));
      down.push(...diff.down.split('\n'));
    }

    const cleanUp = (diff: string[]) => {
      for (let i = diff.length - 1; i >= 0; i--) {
        if (diff[i]) {
          break;
        }

        diff.splice(i, 1);
      }
    };
    cleanUp(up);
    cleanUp(down);

    return { up, down };
  }

  private getMigrationFilename(name: string): string {
    name = name.replace(/\.[jt]s$/, '');
    return name.match(/^\d{14}$/) ? this.options.fileName!(name) : name;
  }

  private prefix<T extends string | string[] | { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction }>(options?: T): MigrateUpOptions & MigrateDownOptions {
    if (typeof options === 'string' || Array.isArray(options)) {
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
    await this.ensureDatabase();

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
      fs.ensureDir(this.absolutePath);
    }
  }

}
