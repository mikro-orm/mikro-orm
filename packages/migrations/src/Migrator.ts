import { Umzug, type InputMigrations, type MigrateDownOptions, type MigrateUpOptions, type MigrationParams, type RunnableMigration } from 'umzug';
import { basename, join } from 'path';
import { ensureDir, pathExists, writeJSON } from 'fs-extra';
import { t, Type, UnknownType, Utils, type Constructor, type Dictionary, type IMigrationGenerator, type IMigrator, type MikroORM, type Transaction } from '@mikro-orm/core';
import { DatabaseSchema, DatabaseTable, SqlSchemaGenerator, type EntityManager } from '@mikro-orm/knex';
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
  private readonly schemaGenerator = new SqlSchemaGenerator(this.em);
  private readonly config = this.em.config;
  private readonly options = this.config.get('migrations');
  private readonly absolutePath: string;
  private readonly snapshotPath: string;

  constructor(private readonly em: EntityManager) {
    /* istanbul ignore next */
    const key = (this.config.get('tsNode', Utils.detectTsNode()) && this.options.pathTs) ? 'pathTs' : 'path';
    this.absolutePath = Utils.absolutePath(this.options[key]!, this.config.get('baseDir'));
    // for snapshots, we always want to use the path based on `emit` option, regardless of whether we run in ts-node context
    /* istanbul ignore next */
    const snapshotPath = this.options.emit === 'ts' && this.options.pathTs ? this.options.pathTs : this.options.path!;
    const absoluteSnapshotPath = Utils.absolutePath(snapshotPath, this.config.get('baseDir'));
    const dbName = basename(this.config.get('dbName'));
    const snapshotName = this.options.snapshotName ?? `.snapshot-${dbName}`;
    this.snapshotPath = Utils.normalizePath(absoluteSnapshotPath, `${snapshotName}.json`);
    this.createUmzug();
  }

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/migrator', () => new Migrator(orm.em as EntityManager));
  }

  /**
   * @inheritDoc
   */
  async createMigration(path?: string, blank = false, initial = false, name?: string): Promise<MigrationResult> {
    if (initial) {
      return this.createInitialMigration(path, name);
    }

    await this.ensureMigrationsDirExists();
    const diff = await this.getSchemaDiff(blank, initial);

    if (diff.up.length === 0) {
      return { fileName: '', code: '', diff };
    }

    await this.storeCurrentSchema();
    const migration = await this.generator.generate(diff, path, name);
    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  async checkMigrationNeeded(): Promise<boolean> {
    await this.ensureMigrationsDirExists();
    const diff = await this.getSchemaDiff(false, false);
    return diff.up.length > 0;
  }

  /**
   * @inheritDoc
   */
  async createInitialMigration(path?: string, name?: string): Promise<MigrationResult> {
    await this.ensureMigrationsDirExists();
    const schemaExists = await this.validateInitialMigration();
    const diff = await this.getSchemaDiff(false, true);
    await this.storeCurrentSchema();
    const migration = await this.generator.generate(diff, path, name);

    if (schemaExists) {
      await this.storage.logMigration({ name: migration[1], context: null });
    }

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  private createUmzug(): void {
    this.runner = new MigrationRunner(this.driver, this.options, this.config);
    this.storage = new MigrationStorage(this.driver, this.options);

    let migrations: InputMigrations<any> = {
      glob: join(this.absolutePath, this.options.glob!).replace(/\\/g, '/'),
      resolve: (params: MigrationParams<any>) => this.resolve(params),
    };

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
  private async validateInitialMigration(): Promise<boolean> {
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();

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

    if (expected.size === 0) {
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
  async getExecutedMigrations(): Promise<MigrationRow[]> {
    await this.ensureDatabase();
    return this.storage.getExecutedMigrations();
  }

  private async ensureDatabase(): Promise<void> {
    await this.ensureMigrationsDirExists();
    const created = await this.schemaGenerator.ensureDatabase();

    /* istanbul ignore next */
    if (created) {
      this.createUmzug();
    }

    await this.storage.ensureTable();
  }

  /**
   * @inheritDoc
   */
  async getPendingMigrations(): Promise<UmzugMigration[]> {
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

  protected async getSchemaFromSnapshot() {
    if (!this.options.snapshot || !await pathExists(this.snapshotPath)) {
      return undefined;
    }

    const data = await Utils.dynamicImport(this.snapshotPath);
    const schema = new DatabaseSchema(this.driver.getPlatform(), this.config.get('schema'));
    const { tables, namespaces, ...rest } = data;
    const tableInstances = tables.map((tbl: Dictionary) => {
      const table = new DatabaseTable(this.driver.getPlatform(), tbl.name);
      const { columns, ...restTable } = tbl;
      Object.assign(table, restTable);
      Object.keys(columns).forEach(col => {
        const column = { ...columns[col] };
        /* istanbul ignore next */
        column.mappedType = Type.getType(t[columns[col].mappedType] ?? UnknownType);
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
    await writeJSON(this.snapshotPath, schema, { spaces: 2 });
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
    } else if (initial) {
      const dump = await this.schemaGenerator.getCreateSchemaSQL({ wrap: false });
      up.push(...dump.split('\n'));
    } else {
      const diff = await this.schemaGenerator.getUpdateSchemaMigrationSQL({
        wrap: false,
        safe: this.options.safe,
        dropTables: this.options.dropTables,
        fromSchema: await this.getSchemaFromSnapshot(),
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

    ['from', 'to'].filter(k => options[k]).forEach(k => options[k] = this.getMigrationFilename(options[k]));

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

  private async ensureMigrationsDirExists() {
    if (!this.options.migrationsList) {
      await ensureDir(this.absolutePath);
    }
  }

}
