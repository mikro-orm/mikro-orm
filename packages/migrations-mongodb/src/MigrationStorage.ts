import type { Dictionary, MigrationsOptions, Transaction } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import type { MigrationParams, UmzugStorage } from 'umzug';
import * as path from 'node:path';
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
    const tableName = this.options.tableName!;
    const name = this.getMigrationName(params.name);
    await this.driver.nativeInsert(tableName, { name, executed_at: new Date() }, { ctx: this.masterTransaction });
  }

  async unlogMigration(params: MigrationParams<any>): Promise<void> {
    const tableName = this.options.tableName!;
    const withoutExt = this.getMigrationName(params.name);
    await this.driver.nativeDelete(tableName, { name: { $in: [params.name, withoutExt] } }, { ctx: this.masterTransaction });
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    const tableName = this.options.tableName!;
    return this.driver.find(tableName, {}, { ctx: this.masterTransaction, orderBy: { _id: 'asc' } as Dictionary }) as Promise<MigrationRow[]>;
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
    const parsedName = path.parse(name);

    if (['.js', '.ts'].includes(parsedName.ext)) {
      // strip extension
      return parsedName.name;
    }

    return name;
  }

}
