import {
  type IMigrationGenerator,
  type IMigrationRunner,
  type IMigratorStorage,
  type MikroORM,
} from '@mikro-orm/core';
import { AbstractMigrator } from '@mikro-orm/core/migrations';
import type { EntityManager, MongoDriver } from '@mikro-orm/mongodb';
import { MigrationRunner } from './MigrationRunner.js';
import { MigrationStorage } from './MigrationStorage.js';
import type { MigrationResult } from './typings.js';
import { TSMigrationGenerator } from './TSMigrationGenerator.js';
import { JSMigrationGenerator } from './JSMigrationGenerator.js';

export class Migrator extends AbstractMigrator<MongoDriver> {

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/migrator', () => new Migrator(orm.em as EntityManager));
  }

  protected createRunner(): IMigrationRunner {
    return new MigrationRunner(this.driver, this.options);
  }

  protected createStorage(): IMigratorStorage {
    return new MigrationStorage(this.driver, this.options);
  }

  protected getDefaultGenerator(): IMigrationGenerator {
    /* v8 ignore next */
    if (this.options.emit === 'js' || this.options.emit === 'cjs') {
      return new JSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
    }

    return new TSMigrationGenerator(this.driver, this.config.getNamingStrategy(), this.options);
  }

  /**
   * @inheritDoc
   */
  async create(path?: string, blank = false, initial = false, name?: string): Promise<MigrationResult> {
    await this.init();
    const diff = { up: [] as string[], down: [] as string[] };
    const migration = await this.generator.generate(diff, path, name);

    return {
      fileName: migration[1],
      code: migration[0],
      diff,
    };
  }

  /** @inheritDoc */
  /* v8 ignore next */
  async checkSchema(): Promise<boolean> {
    return true;
  }

  /**
   * @inheritDoc
   */
  async createInitial(path?: string): Promise<MigrationResult> {
    return this.create(path);
  }

  override getStorage(): MigrationStorage {
    return this.storage as MigrationStorage;
  }

}
