import umzug, { migrationsList, Umzug } from 'umzug';
import { join } from 'path';
import { ensureDir, pathExists, writeJSON } from 'fs-extra';
import { Constructor, Dictionary, Transaction, Utils, t, Type, IMigrator, IMigrationGenerator } from '@mikro-orm/core';
import { DatabaseSchema, DatabaseTable, EntityManager, SchemaGenerator } from '@mikro-orm/knex';
import { Migration } from './Migration';
import { MigrationRunner } from './MigrationRunner';
import { MigrationStorage } from './MigrationStorage';
import { MigrateOptions, MigrationResult, MigrationRow, UmzugMigration } from './typings';
import { TSMigrationGenerator } from './TSMigrationGenerator';
import { JSMigrationGenerator } from './JSMigrationGenerator';

export class Migrator implements IMigrator {

  private readonly umzug: Umzug;
  private readonly driver = this.em.getDriver();
  private readonly schemaGenerator = new SchemaGenerator(this.em);
  private readonly config = this.em.config;
  private readonly options = this.config.get('migrations');
  private readonly runner = new MigrationRunner(this.driver, this.options, this.config);
  private readonly generator: IMigrationGenerator;
  private readonly storage = new MigrationStorage(this.driver, this.options);
  private readonly absolutePath = Utils.absolutePath(this.options.path!, this.config.get('baseDir'));
  private readonly snapshotPath = join(this.absolutePath, `.snapshot-${this.config.get('dbName')}.json`);

  constructor(private readonly em: EntityManager) {
    let migrations: Dictionary = {
      path: this.absolutePath,
      pattern: this.options.pattern,
      customResolver: (file: string) => this.resolve(file),
    };

    if (this.options.migrationsList) {
      const list = this.options.migrationsList.map(migration => this.initialize(migration.class as Constructor<Migration>, migration.name));
      migrations = migrationsList(list as any[]);
    }

    this.umzug = new umzug({
      storage: this.storage,
      logging: this.config.get('logger'),
      migrations,
    });

    if (this.options.generator) {
      this.generator = new this.options.generator(this.driver, this.config.getNamingStrategy(), this.options);
    } else if (this.options.emit === 'js') {
      this.generator = new JSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
    } else {
      this.generator = new TSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
    }
  }

  /**
   * @inheritDoc
   */
  async createMigration(path?: string, blank = false, initial = false): Promise<MigrationResult> {
    if (initial) {
      return this.createInitialMigration(path);
    }

    await this.ensureMigrationsDirExists();
    const diff = await this.getSchemaDiff(blank, initial);

    if (diff.up.length === 0) {
      return { fileName: '', code: '', diff };
    }

    await this.storeCurrentSchema();
    const migration = await this.generator.generate(diff, path);

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  /**
   * @inheritDoc
   */
  async createInitialMigration(path?: string): Promise<MigrationResult> {
    await this.ensureMigrationsDirExists();
    const schemaExists = await this.validateInitialMigration();
    const diff = await this.getSchemaDiff(false, true);
    const migration = await this.generator.generate(diff, path);

    if (schemaExists) {
      await this.storage.logMigration(migration[1]);
    }

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
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
      .filter(meta => meta.collection)
      .forEach(meta => expected.add(meta.collection));

    schema.getTables().forEach(table => {
      /* istanbul ignore next */
      const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;

      if (expected.has(tableName)) {
        exists.add(tableName);
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
    await this.ensureMigrationsDirExists();
    await this.schemaGenerator.ensureDatabase();
    await this.storage.ensureTable();
    return this.storage.getExecutedMigrations();
  }

  /**
   * @inheritDoc
   */
  async getPendingMigrations(): Promise<UmzugMigration[]> {
    await this.ensureMigrationsDirExists();
    await this.schemaGenerator.ensureDatabase();
    await this.storage.ensureTable();
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

  protected resolve(file: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const migration = require(file);
    const MigrationClass = Object.values(migration)[0] as Constructor<Migration>;

    return this.initialize(MigrationClass);
  }

  protected async getCurrentSchema(): Promise<DatabaseSchema> {
    if (!this.options.snapshot || !await pathExists(this.snapshotPath)) {
      return DatabaseSchema.create(this.driver.getConnection(), this.driver.getPlatform(), this.config);
    }

    const data = await import(this.snapshotPath);
    const schema = new DatabaseSchema(this.driver.getPlatform(), this.config.get('schema'));
    const { tables, ...rest } = data;
    const tableInstances = tables.map((tbl: Dictionary) => {
      const table = new DatabaseTable(this.driver.getPlatform(), tbl.name);
      const { columns, ...restTable } = tbl;
      Object.assign(table, restTable);
      Object.keys(columns).forEach(col => {
        const column = { ...columns[col] };
        column.mappedType = Type.getType(t[columns[col].mappedType]);
        table.addColumn(column);
      });

      return table;
    });
    Object.assign(schema, { tables: tableInstances, ...rest });

    return schema;
  }

  protected async storeCurrentSchema(): Promise<void> {
    if (!this.options.snapshot) {
      return;
    }

    const schema = this.schemaGenerator.getTargetSchema();
    await writeJSON(this.snapshotPath, schema, { spaces: 2 });
  }

  protected initialize(MigrationClass: Constructor<Migration>, name?: string) {
    const instance = new MigrationClass(this.driver, this.config);

    return {
      name,
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
        fromSchema: await this.getCurrentSchema(),
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

  private prefix<T extends string | string[] | { from?: string; to?: string; migrations?: string[]; transaction?: Transaction }>(options?: T): T {
    if (Utils.isString(options) || Array.isArray(options)) {
      return Utils.asArray(options as string | string[]).map(m => {
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
    await this.ensureMigrationsDirExists();
    await this.schemaGenerator.ensureDatabase();
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

  private async ensureMigrationsDirExists() {
    if (!this.options.migrationsList) {
      await ensureDir(Utils.normalizePath(this.options.path!));
    }
  }

}
