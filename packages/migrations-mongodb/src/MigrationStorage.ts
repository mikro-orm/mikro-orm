import { defineEntity, type Dictionary, type EntitySchema, type MigrationsOptions, p, type Transaction } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import type { MigrationParams, UmzugStorage } from 'umzug';
import { parse } from 'node:path';
import type { MigrationRow } from './typings.js';

export class MigrationStorage implements UmzugStorage {

  private masterTransaction?: Transaction;

  constructor(protected readonly driver: MongoDriver,
              protected readonly options: MigrationsOptions) { }

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    return migrations.map(({ name }) => `${this.getMigrationName(name)}`);
  }

  async logMigration(params: MigrationParams<any>): Promise<void> {
    const name = this.getMigrationName(params.name);
    const entity = this.getEntityDefinition();
    await this.driver.nativeInsert(entity, { name, executed_at: new Date() }, { ctx: this.masterTransaction });
  }

  async unlogMigration(params: MigrationParams<any>): Promise<void> {
    const withoutExt = this.getMigrationName(params.name);
    const entity = this.getEntityDefinition();
    await this.driver.nativeDelete(entity, { name: { $in: [params.name, withoutExt] } }, { ctx: this.masterTransaction });
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    const entity = this.getEntityDefinition();
    return this.driver.find(entity, {}, { ctx: this.masterTransaction, orderBy: { _id: 'asc' } as Dictionary }) as Promise<MigrationRow[]>;
  }

  setMasterMigration(trx: Transaction) {
    this.masterTransaction = trx;
  }

  unsetMasterMigration() {
    delete this.masterTransaction;
  }

  /**
   * @internal
   */
  getMigrationName(name: string) {
    const parsedName = parse(name);

    if (['.js', '.ts'].includes(parsedName.ext)) {
      // strip extension
      return parsedName.name;
    }

    return name;
  }

  /**
   * @internal
   */
  getEntityDefinition(): EntitySchema {
    const entity = defineEntity({
      name: 'Migration',
      tableName: this.options.tableName,
      properties: {
        id: p.integer().primary().fieldNames('id'),
        name: p.string().fieldNames('name'),
        executedAt: p.datetime().defaultRaw('current_timestamp').fieldNames('executed_at'),
      },
    }).init();
    entity.meta.sync();

    return entity;
  }

}
