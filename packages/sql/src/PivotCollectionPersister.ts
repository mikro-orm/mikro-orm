import {
  type Dictionary,
  type EntityData,
  type EntityKey,
  type EntityMetadata,
  type EntityProperty,
  type FilterQuery,
  type Primary,
  type Transaction,
} from '@mikro-orm/core';
import { type AbstractSqlDriver } from './AbstractSqlDriver.js';

class InsertStatement<Entity> {

  constructor(
    private readonly keys: string[],
    private readonly data: EntityData<Entity>,
    readonly order: number,
  ) {}

  getHash(): string {
    return JSON.stringify(this.data);
  }

  getData(): EntityData<Entity> {
    const data = {} as Dictionary;
    this.keys.forEach((key, idx) => data[key] = (this.data as Dictionary)[idx]);
    return data as EntityData<Entity>;
  }

}

class DeleteStatement<Entity> {

  constructor(
    private readonly keys: EntityKey<Entity>[],
    private readonly cond: FilterQuery<Entity>,
  ) {}

  getHash(): string {
    return JSON.stringify(this.cond);
  }

  getCondition(): FilterQuery<Entity> {
    const cond = {} as Dictionary;
    this.keys.forEach((key, idx) => cond[key] = (this.cond as Dictionary)[idx]);
    return cond as FilterQuery<Entity>;
  }

}

export class PivotCollectionPersister<Entity extends object> {

  private readonly inserts = new Map<string, InsertStatement<Entity>>();
  private readonly upserts = new Map<string, InsertStatement<Entity>>();
  private readonly deletes = new Map<string, DeleteStatement<Entity>>();
  private readonly batchSize: number;
  private order = 0;

  constructor(
    private readonly meta: EntityMetadata<Entity>,
    private readonly driver: AbstractSqlDriver,
    private readonly ctx?: Transaction,
    private readonly schema?: string,
    private readonly loggerContext?: Dictionary,
  ) {
    this.batchSize = this.driver.config.get('batchSize');
  }

  enqueueUpdate(
    prop: EntityProperty<Entity>,
    insertDiff: Primary<Entity>[][],
    deleteDiff: Primary<Entity>[][] | boolean,
    pks: Primary<Entity>[],
    isInitialized = true,
  ) {
    if (insertDiff.length) {
      if (isInitialized) {
        this.enqueueInsert(prop, insertDiff, pks);
      } else {
        this.enqueueUpsert(prop, insertDiff, pks);
      }
    }

    if (deleteDiff === true || (Array.isArray(deleteDiff) && deleteDiff.length)) {
      this.enqueueDelete(prop, deleteDiff, pks);
    }
  }

  private enqueueInsert(prop: EntityProperty<Entity>, insertDiff: Primary<Entity>[][], pks: Primary<Entity>[]) {
    for (const fks of insertDiff) {
      const statement = this.createInsertStatement(prop, fks, pks);
      const hash = statement.getHash();

      if (prop.owner || !this.inserts.has(hash)) {
        this.inserts.set(hash, statement);
      }
    }
  }

  private enqueueUpsert(prop: EntityProperty<Entity>, insertDiff: Primary<Entity>[][], pks: Primary<Entity>[]) {
    for (const fks of insertDiff) {
      const statement = this.createInsertStatement(prop, fks, pks);
      const hash = statement.getHash();

      if (prop.owner || !this.upserts.has(hash)) {
        this.upserts.set(hash, statement);
      }
    }
  }

  private createInsertStatement(prop: EntityProperty<Entity>, fks: Primary<Entity>[], pks: Primary<Entity>[]) {
    const data = prop.owner ? [...fks, ...pks] : [...pks, ...fks];
    const keys = prop.owner
      ? [...prop.inverseJoinColumns, ...prop.joinColumns]
      : [...prop.joinColumns, ...prop.inverseJoinColumns];

    return new InsertStatement(keys, data, this.order++);
  }

  private enqueueDelete(prop: EntityProperty<Entity>, deleteDiff: Primary<Entity>[][] | true, pks: Primary<Entity>[]) {
    if (deleteDiff === true) {
      const statement = new DeleteStatement(prop.joinColumns as EntityKey<Entity>[], pks as FilterQuery<Entity>);
      this.deletes.set(statement.getHash(), statement);

      return;
    }

    for (const fks of deleteDiff) {
      const data = prop.owner ? [...fks, ...pks] : [...pks, ...fks];
      const keys = prop.owner
        ? [...prop.inverseJoinColumns, ...prop.joinColumns]
        : [...prop.joinColumns, ...prop.inverseJoinColumns];

      const statement = new DeleteStatement(keys as EntityKey<Entity>[], data as FilterQuery<Entity>);
      this.deletes.set(statement.getHash(), statement);
    }
  }

  private collectStatements(statements: Map<string, InsertStatement<Entity>>): EntityData<Entity>[] {
    const items: EntityData<Entity>[] = [];

    for (const statement of statements.values()) {
      items[statement.order] = statement.getData();
    }

    return items.filter(Boolean);
  }

  async execute(): Promise<void> {
    if (this.deletes.size > 0) {
      const deletes = [...this.deletes.values()];

      for (let i = 0; i < deletes.length; i += this.batchSize) {
        const chunk = deletes.slice(i, i + this.batchSize);
        const cond = { $or: [] } as Dictionary;

        for (const item of chunk) {
          cond.$or.push(item.getCondition());
        }

        await this.driver.nativeDelete(this.meta.class, cond, {
          ctx: this.ctx,
          schema: this.schema,
          loggerContext: this.loggerContext,
        });
      }
    }

    if (this.inserts.size > 0) {
      const filtered = this.collectStatements(this.inserts);

      for (let i = 0; i < filtered.length; i += this.batchSize) {
        const chunk = filtered.slice(i, i + this.batchSize);
        await this.driver.nativeInsertMany<Entity>(this.meta.class, chunk, {
          ctx: this.ctx,
          schema: this.schema,
          convertCustomTypes: false,
          processCollections: false,
          loggerContext: this.loggerContext,
        });
      }
    }

    if (this.upserts.size > 0) {
      const filtered = this.collectStatements(this.upserts);

      for (let i = 0; i < filtered.length; i += this.batchSize) {
        const chunk = filtered.slice(i, i + this.batchSize);
        await this.driver.nativeUpdateMany<Entity>(this.meta.class, [], chunk, {
          ctx: this.ctx,
          schema: this.schema,
          convertCustomTypes: false,
          processCollections: false,
          upsert: true,
          onConflictAction: 'ignore',
          loggerContext: this.loggerContext,
        });
      }
    }
  }

}
