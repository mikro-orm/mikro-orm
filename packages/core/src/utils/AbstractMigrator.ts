import type {
  Constructor,
  IMigrationGenerator,
  IMigrationRunner,
  IMigrator,
  IMigratorStorage,
  MaybePromise,
  Migration,
  MigrationInfo,
  MigrationRow,
  MigratorEvent,
} from '../typings.js';
import type { Transaction } from '../connections/Connection.js';
import type { Configuration, MigrationsOptions } from './Configuration.js';
import type { EntityManagerType, IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import { Utils } from './Utils.js';

interface RunnableMigration {
  name: string;
  path?: string;
  up: () => MaybePromise<void>;
  down: () => MaybePromise<void>;
}

type NormalizedMigrateOptions = {
  from?: string;
  /** After normalization, `to` is either a migration name (string) or `0` to revert all. */
  to?: string | 0;
  migrations?: string[];
};

type MigrateOptions = { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction };

export abstract class AbstractMigrator<D extends IDatabaseDriver> implements IMigrator {

  protected runner!: IMigrationRunner;
  protected storage!: IMigratorStorage;
  protected generator!: IMigrationGenerator;
  protected readonly driver: D;
  protected readonly config: Configuration;
  protected readonly options: MigrationsOptions;
  protected absolutePath!: string;
  protected initialized = false;
  private readonly listeners = new Map<string, Set<(event: MigrationInfo) => MaybePromise<void>>>();

  constructor(protected readonly em: D[typeof EntityManagerType]) {
    this.driver = this.em.getDriver() as D;
    this.config = this.em.config;
    this.options = this.config.get('migrations');
    this.initServices();
    this.registerDefaultListeners();
  }

  protected abstract createRunner(): IMigrationRunner;
  protected abstract createStorage(): IMigratorStorage;
  protected abstract getDefaultGenerator(): IMigrationGenerator;
  abstract create(path?: string, blank?: boolean, initial?: boolean, name?: string): Promise<{ fileName: string; code: string; diff: { up: string[]; down: string[] } }>;
  abstract checkSchema(): Promise<boolean>;
  abstract createInitial(path?: string, name?: string, blank?: boolean): Promise<{ fileName: string; code: string; diff: { up: string[]; down: string[] } }>;

  /**
   * @inheritDoc
   */
  on(eventName: MigratorEvent, listener: (event: MigrationInfo) => MaybePromise<void>): this {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(listener);

    return this;
  }

  /**
   * @inheritDoc
   */
  off(eventName: MigratorEvent, listener: (event: MigrationInfo) => MaybePromise<void>): this {
    this.listeners.get(eventName)?.delete(listener);
    return this;
  }

  /**
   * @inheritDoc
   */
  async getExecuted(): Promise<MigrationRow[]> {
    await this.init();
    return this.storage.getExecutedMigrations();
  }

  /**
   * @inheritDoc
   */
  async getPending(): Promise<MigrationInfo[]> {
    await this.init();
    const all = await this.discoverMigrations();
    const executed = new Set(await this.storage.executed());

    return all
      .filter(m => !executed.has(m.name))
      .map(m => ({ name: m.name, path: m.path }));
  }

  /**
   * @inheritDoc
   */
  async up(options?: string | string[] | MigrateOptions): Promise<MigrationInfo[]> {
    return this.runMigrations('up', options);
  }

  /**
   * @inheritDoc
   */
  async down(options?: string | string[] | Omit<MigrateOptions, 'from'>): Promise<MigrationInfo[]> {
    return this.runMigrations('down', options);
  }

  abstract getStorage(): IMigratorStorage;

  protected async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    if (!this.options.migrationsList) {
      const { fs } = await import('@mikro-orm/core/fs-utils');
      this.detectSourceFolder(fs);

      /* v8 ignore next */
      const key = (this.config.get('preferTs', Utils.detectTypeScriptSupport()) && this.options.pathTs) ? 'pathTs' : 'path';
      this.absolutePath = fs.absolutePath(this.options[key]!, this.config.get('baseDir'));
      fs.ensureDir(this.absolutePath);
    }
  }

  protected initServices(): void {
    this.runner = this.createRunner();
    this.storage = this.createStorage();

    if (this.options.generator) {
      this.generator = new this.options.generator(this.driver, this.config.getNamingStrategy(), this.options);
    } else {
      this.generator = this.getDefaultGenerator();
    }
  }

  protected resolve(params: { name: string; path: string }): RunnableMigration {
    const createMigrationHandler = async (method: 'up' | 'down') => {
      const { fs } = await import('@mikro-orm/core/fs-utils');
      const migration = await fs.dynamicImport(params.path);
      const MigrationClass = Object.values(migration).find(cls => typeof cls === 'function' && typeof cls.constructor === 'function') as Constructor<Migration>;
      const instance = new MigrationClass(this.driver, this.config);

      await this.runner.run(instance, method);
    };

    return {
      name: this.storage.getMigrationName(params.name),
      path: params.path,
      up: () => createMigrationHandler('up'),
      down: () => createMigrationHandler('down'),
    };
  }

  protected initialize(MigrationClass: Constructor<Migration>, name: string): RunnableMigration {
    const instance = new MigrationClass(this.driver, this.config);

    return {
      name: this.storage.getMigrationName(name),
      up: () => this.runner.run(instance, 'up'),
      down: () => this.runner.run(instance, 'down'),
    };
  }

  /**
   * Checks if `src` folder exists, it so, tries to adjust the migrations and seeders paths automatically to use it.
   * If there is a `dist` or `build` folder, it will be used for the JS variant (`path` option), while the `src` folder will be
   * used for the TS variant (`pathTs` option).
   *
   * If the default folder exists (e.g. `/migrations`), the config will respect that, so this auto-detection should not
   * break existing projects, only help with the new ones.
   */
  private detectSourceFolder(fs: { pathExists(path: string): boolean }): void {
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

  private registerDefaultListeners(): void {
    /* v8 ignore else */
    if (!this.options.silent) {
      const logger = this.config.getLogger();
      this.on('migrating', event => logger.log('migrator', `Processing '${event.name}'`, { enabled: true }));
      this.on('migrated', event => logger.log('migrator', `Applied '${event.name}'`, { enabled: true }));
      this.on('reverting', event => logger.log('migrator', `Processing '${event.name}'`, { enabled: true }));
      this.on('reverted', event => logger.log('migrator', `Reverted '${event.name}'`, { enabled: true }));
    }
  }

  private async emit(event: string, data: MigrationInfo): Promise<void> {
    for (const listener of this.listeners.get(event) ?? []) {
      await listener(data);
    }
  }

  private async discoverMigrations(): Promise<RunnableMigration[]> {
    if (this.options.migrationsList) {
      return this.options.migrationsList.map(migration => {
        if (typeof migration === 'function') {
          return this.initialize(migration as Constructor<Migration>, migration.name);
        }

        return this.initialize(migration.class as Constructor<Migration>, migration.name);
      });
    }

    const { fs } = await import('@mikro-orm/core/fs-utils');
    const pattern = fs.normalizePath(this.absolutePath, this.options.glob!);
    const files: string[] = fs.glob(pattern).sort();

    return files.map(filePath => this.resolve({
      name: filePath.replace(/\\/g, '/').split('/').pop()!,
      path: filePath,
    }));
  }

  private async executeMigrations(
    method: 'up' | 'down',
    options: NormalizedMigrateOptions = {},
  ): Promise<MigrationInfo[]> {
    const all = await this.discoverMigrations();
    const executed = await this.storage.executed();
    const executedSet = new Set(executed);
    let toRun: RunnableMigration[];

    if (method === 'up') {
      toRun = this.filterUp(all, executedSet, options);
    } else {
      toRun = this.filterDown(all, executed, options);
    }

    const result: MigrationInfo[] = [];
    const eventBefore: MigratorEvent = method === 'up' ? 'migrating' : 'reverting';
    const eventAfter: MigratorEvent = method === 'up' ? 'migrated' : 'reverted';

    for (const migration of toRun) {
      const event: MigrationInfo = { name: migration.name, path: migration.path };
      await this.emit(eventBefore, event);
      await migration[method]();

      if (method === 'up') {
        await this.storage.logMigration({ name: migration.name });
      } else {
        await this.storage.unlogMigration({ name: migration.name });
      }

      await this.emit(eventAfter, event);
      result.push(event);
    }

    return result;
  }

  private filterUp(all: RunnableMigration[], executed: Set<string>, options: NormalizedMigrateOptions): RunnableMigration[] {
    let pending = all.filter(m => !executed.has(m.name));

    if (options.migrations) {
      const set = new Set(options.migrations);
      return pending.filter(m => set.has(m.name));
    }

    if (options.from) {
      const idx = all.findIndex(m => m.name === options.from);

      if (idx >= 0) {
        const names = new Set(all.slice(idx + 1).map(m => m.name));
        pending = pending.filter(m => names.has(m.name));
      }
    }

    if (options.to && typeof options.to === 'string') {
      const idx = all.findIndex(m => m.name === options.to);

      if (idx >= 0) {
        const names = new Set(all.slice(0, idx + 1).map(m => m.name));
        pending = pending.filter(m => names.has(m.name));
      }
    }

    return pending;
  }

  private filterDown(all: RunnableMigration[], executed: string[], options: NormalizedMigrateOptions): RunnableMigration[] {
    const migrationMap = new Map(all.map(m => [m.name, m]));
    const executedReversed = [...executed].reverse();

    if (options.migrations) {
      const set = new Set(options.migrations);
      return executedReversed
        .filter(name => set.has(name))
        .map(name => migrationMap.get(name)!)
        .filter(Boolean);
    }

    if (options.to === 0) {
      return executedReversed.map(name => migrationMap.get(name)!).filter(Boolean);
    }

    if (options.to) {
      const result: RunnableMigration[] = [];

      for (const name of executedReversed) {
        if (name === String(options.to)) {
          break;
        }

        const m = migrationMap.get(name);

        if (m) {
          result.push(m);
        }
      }

      return result;
    }

    // Default: revert last 1
    if (executedReversed.length > 0) {
      const m = migrationMap.get(executedReversed[0]);
      return m ? [m] : [];
    }

    return [];
  }

  private getMigrationFilename(name: string): string {
    name = name.replace(/\.[jt]s$/, '');
    return name.match(/^\d{14}$/) ? this.options.fileName!(name) : name;
  }

  private prefix<T extends string | string[] | { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction }>(options?: T): NormalizedMigrateOptions {
    if (typeof options === 'string' || Array.isArray(options)) {
      return { migrations: Utils.asArray(options).map(name => this.getMigrationFilename(name)) };
    }

    if (!options) {
      return {};
    }

    const result: NormalizedMigrateOptions = {};

    if (options.migrations) {
      result.migrations = options.migrations.map(name => this.getMigrationFilename(name));
    }

    if (options.from) {
      result.from = this.getMigrationFilename(String(options.from));
    }

    if (options.to && options.to !== 0) {
      result.to = this.getMigrationFilename(String(options.to));
    } else if (options.to === 0) {
      result.to = 0;
    }

    return result;
  }

  private async runMigrations(method: 'up' | 'down', options?: string | string[] | MigrateOptions) {
    await this.init();

    if (!this.options.transactional || !this.options.allOrNothing) {
      return this.executeMigrations(method, this.prefix(options as string[]));
    }

    if (Utils.isObject<MigrateOptions>(options) && options.transaction) {
      return this.runInTransaction(options.transaction, method, options);
    }

    return this.driver.getConnection().transactional(trx => this.runInTransaction(trx, method, options));
  }

  private async runInTransaction(trx: Transaction, method: 'up' | 'down', options: string | string[] | undefined | MigrateOptions) {
    this.runner.setMasterMigration(trx);
    this.storage.setMasterMigration(trx);

    try {
      return await this.executeMigrations(method, this.prefix(options));
    } finally {
      this.runner.unsetMasterMigration();
      this.storage.unsetMasterMigration();
    }
  }

}
