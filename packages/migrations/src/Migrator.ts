import {
  type Dictionary,
  type IMigrationGenerator,
  type IMigrationRunner,
  type IMigratorStorage,
  type MigrateOptions,
  type MigrationInfo,
  type MikroORM,
  t,
  Type,
  UnknownType,
} from '@mikro-orm/core';
import { AbstractMigrator } from '@mikro-orm/core/migrations';
import {
  type AbstractSqlDriver,
  DatabaseSchema,
  DatabaseTable,
  type EntityManager,
  type SqlSchemaGenerator,
} from '@mikro-orm/sql';
import { MigrationRunner } from './MigrationRunner.js';
import { MigrationStorage } from './MigrationStorage.js';
import type { MigrationResult } from './typings.js';
import { TSMigrationGenerator } from './TSMigrationGenerator.js';
import { JSMigrationGenerator } from './JSMigrationGenerator.js';

export class Migrator extends AbstractMigrator<AbstractSqlDriver> {

  private readonly schemaGenerator: SqlSchemaGenerator;
  private snapshotPath?: string;

  constructor(em: EntityManager) {
    super(em);
    this.schemaGenerator = this.config.getExtension('@mikro-orm/schema-generator')!;
  }

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/migrator', () => new Migrator(orm.em as EntityManager));
  }

  protected createRunner(): IMigrationRunner {
    return new MigrationRunner(this.driver, this.options, this.config);
  }

  protected createStorage(): IMigratorStorage {
    return new MigrationStorage(this.driver, this.options);
  }

  protected getDefaultGenerator(): IMigrationGenerator {
    if (this.options.emit === 'js' || this.options.emit === 'cjs') {
      return new JSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
    }

    return new TSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
  }

  private async getSnapshotPath(): Promise<string> {
    if (!this.snapshotPath) {
      const { fs } = await import('@mikro-orm/core/fs-utils');
      // for snapshots, we always want to use the path based on `emit` option, regardless of whether we run in TS context
      /* v8 ignore next */
      const snapshotPath = this.options.emit === 'ts' && this.options.pathTs ? this.options.pathTs : this.options.path!;
      const absoluteSnapshotPath = fs.absolutePath(snapshotPath, this.config.get('baseDir'));
      const dbName = this.config.get('dbName')!.replace(/\\/g, '/').split('/').pop()!.replace(/:/g, '');
      const snapshotName = this.options.snapshotName ?? `.snapshot-${dbName}`;
      this.snapshotPath = fs.normalizePath(absoluteSnapshotPath, `${snapshotName}.json`);
    }

    return this.snapshotPath;
  }

  protected override async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await super.init();
    const created = await this.schemaGenerator.ensureDatabase();

    /* v8 ignore next */
    if (created) {
      this.initServices();
    }

    await (this.storage as MigrationStorage).ensureTable();
  }

  /**
   * @inheritDoc
   */
  async create(path?: string, blank = false, initial = false, name?: string): Promise<MigrationResult> {
    await this.init();

    if (initial) {
      return this.createInitial(path, name, blank);
    }

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
    await this.init();
    const diff = await this.getSchemaDiff(false, false);
    return diff.up.length > 0;
  }

  /**
   * @inheritDoc
   */
  async createInitial(path?: string, name?: string, blank = false): Promise<MigrationResult> {
    await this.init();
    const schemaExists = await this.validateInitialMigration(blank);
    const diff = await this.getSchemaDiff(blank, true);
    const migration = await this.generator.generate(diff, path, name);
    await this.storeCurrentSchema();

    if (schemaExists && !blank) {
      await this.storage.logMigration({ name: migration[1] });
    }

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  protected override async runMigrations(method: 'up' | 'down', options?: string | string[] | MigrateOptions): Promise<MigrationInfo[]> {
    const result = await super.runMigrations(method, options);

    if (result.length > 0 && this.options.snapshot) {
      const schema = await DatabaseSchema.create(this.em.getConnection(), this.em.getPlatform(), this.config);
      await this.storeCurrentSchema(schema);
    }

    return result;
  }

  override getStorage(): MigrationStorage {
    return this.storage as MigrationStorage;
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

    [...this.em.getMetadata().getAll().values()]
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

  protected async getSchemaFromSnapshot() {
    if (!this.options.snapshot) {
      return undefined;
    }

    const snapshotPath = await this.getSnapshotPath();
    const { fs } = await import('@mikro-orm/core/fs-utils');

    if (!fs.pathExists(snapshotPath)) {
      return undefined;
    }

    const data = fs.readJSONSync(snapshotPath);
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

  protected async storeCurrentSchema(schema?: DatabaseSchema): Promise<void> {
    if (!this.options.snapshot) {
      return;
    }

    const snapshotPath = await this.getSnapshotPath();
    schema ??= this.schemaGenerator.getTargetSchema();
    const { fs } = await import('@mikro-orm/core/fs-utils');
    await fs.writeFile(snapshotPath, JSON.stringify(schema, null, 2));
  }

  private async getSchemaDiff(blank: boolean, initial: boolean): Promise<{ up: string[]; down: string[] }> {
    const up: string[] = [];
    const down: string[] = [];

    // Split SQL by statement boundaries (semicolons followed by newline) rather than
    // just newlines, to preserve multiline statements like view definitions.
    // Blank lines (from double newlines) are preserved as empty strings for grouping.
    // Splits inside single-quoted string literals are re-merged (GH #7185).
    const splitStatements = (sql: string) => {
      const result: string[] = [];
      let buf = '';

      for (const chunk of sql.split(/;\n/)) {
        buf += (buf ? ';\n' : '') + chunk;

        // odd number of single quotes means we're inside a string literal
        if (buf.split(`'`).length % 2 === 0) {
          continue;
        }

        // A chunk starting with \n indicates there was a blank line (grouping separator)
        if (buf.startsWith('\n')) {
          result.push('');
        }

        const trimmed = buf.trim();

        if (trimmed) {
          result.push(trimmed.endsWith(';') ? trimmed : trimmed + ';');
        }

        buf = '';
      }

      return result;
    };

    if (blank) {
      up.push('select 1');
      down.push('select 1');
    } else if (initial) {
      const dump = await this.schemaGenerator.getCreateSchemaSQL({ wrap: false });
      up.push(...splitStatements(dump));
    } else {
      const diff = await this.schemaGenerator.getUpdateSchemaMigrationSQL({
        wrap: false,
        safe: this.options.safe,
        dropTables: this.options.dropTables,
        fromSchema: await this.getSchemaFromSnapshot(),
      });
      up.push(...splitStatements(diff.up));
      down.push(...splitStatements(diff.down));
    }

    const cleanUp = (diff: string[]) => {
      for (let i = diff.length - 1; i >= 0; i--) {
        if (diff[i]) {
          break;
        }

        /* v8 ignore next */
        diff.splice(i, 1);
      }
    };
    cleanUp(up);
    cleanUp(down);

    return { up, down };
  }

}
