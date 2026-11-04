import {
  defineEntity,
  type Dictionary,
  type EntitySchema,
  type MigrationsOptions,
  p,
  type Transaction,
} from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { rejectRuntimeSchema, type MigrationRow } from './typings.js';

/** Tracks executed MongoDB migrations in a collection. */
export class MigrationStorage {
  private masterTransaction?: Transaction;

  constructor(
    protected readonly driver: MongoDriver,
    protected readonly options: MigrationsOptions,
  ) {}

  async executed(): Promise<string[]> {
    const migrations = await this.getExecutedMigrations();
    return migrations.map(({ name }) => this.getMigrationName(name));
  }

  async logMigration(params: { name: string }, tx?: Transaction): Promise<void> {
    const name = this.getMigrationName(params.name);
    const entity = this.getEntityDefinition();
    await this.driver.nativeInsert(entity, { name, executed_at: new Date() }, { ctx: tx ?? this.masterTransaction });
  }

  async unlogMigration(params: { name: string }, tx?: Transaction): Promise<void> {
    const withoutExt = this.getMigrationName(params.name);
    const entity = this.getEntityDefinition();
    await this.driver.nativeDelete(
      entity,
      { name: { $in: [params.name, withoutExt] } },
      { ctx: tx ?? this.masterTransaction },
    );
  }

  async setBreakpoint(params: { name: string; breakpoint: boolean }): Promise<void> {
    const name = this.getMigrationName(params.name);
    const row = (await this.getExecutedMigrations()).find(migration => this.getMigrationName(migration.name) === name);

    if (!row) {
      throw new Error(`Cannot set breakpoint on a migration that has not been executed: ${name}`);
    }

    await this.driver.nativeUpdate(
      this.getEntityDefinition(),
      { name: { $in: [name, `${name}.js`, `${name}.ts`] } },
      { breakpoint: params.breakpoint },
      { ctx: this.masterTransaction },
    );
  }

  async getExecutedMigrations(): Promise<MigrationRow[]> {
    const entity = this.getEntityDefinition();
    return this.driver.find(
      entity,
      {},
      { ctx: this.masterTransaction, orderBy: { _id: 'asc' } as Dictionary },
    ) as Promise<MigrationRow[]>;
  }

  setMasterMigration(trx: Transaction) {
    this.masterTransaction = trx;
  }

  unsetMasterMigration() {
    delete this.masterTransaction;
  }

  setRunSchema(schema?: string) {
    rejectRuntimeSchema(schema);
  }

  unsetRunSchema() {
    /* nothing to do */
  }

  /**
   * @internal
   */
  getMigrationName(name: string): string {
    return name.replace(/\.[jt]s$/, '');
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
        breakpoint: p.boolean().nullable(),
      },
    }).init();
    entity.meta.sync();

    return entity;
  }
}
