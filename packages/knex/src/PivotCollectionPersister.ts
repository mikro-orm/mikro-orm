import {
  type Dictionary,
  type EntityData,
  type EntityKey,
  type EntityMetadata,
  type EntityProperty,
  type FilterQuery,
  type Primary,
  type Transaction,
  Utils,
} from '@mikro-orm/core';
import { type AbstractSqlDriver } from './AbstractSqlDriver.js';
import { type AbstractSqlPlatform } from './AbstractSqlPlatform.js';

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

  private readonly platform: AbstractSqlPlatform;
  private readonly inserts = new Map<string, InsertStatement<Entity>>();
  private readonly deletes = new Map<string, DeleteStatement<Entity>>();
  private readonly batchSize: number;
  private order = 0;

  constructor(
    private readonly meta: EntityMetadata<Entity>,
    private readonly driver: AbstractSqlDriver,
    private readonly ctx?: Transaction,
    private readonly schema?: string,
  ) {
    this.platform = this.driver.getPlatform();
    this.batchSize = this.driver.config.get('batchSize');
  }

  enqueueUpdate(
    prop: EntityProperty<Entity>,
    insertDiff: Primary<Entity>[][],
    deleteDiff: Primary<Entity>[][] | boolean,
    pks: Primary<Entity>[],
  ) {
    if (insertDiff.length) {
      this.enqueueInsert(prop, insertDiff, pks);
    }

    if (deleteDiff === true || (Array.isArray(deleteDiff) && deleteDiff.length)) {
      this.enqueueDelete(prop, deleteDiff, pks);
    }
  }

  private enqueueInsert(prop: EntityProperty<Entity>, insertDiff: Primary<Entity>[][], pks: Primary<Entity>[]) {
    for (const fks of insertDiff) {
      const data = prop.owner ? [...fks, ...pks] : [...pks, ...fks];
      const keys = prop.owner
        ? [...prop.inverseJoinColumns, ...prop.joinColumns]
        : [...prop.joinColumns, ...prop.inverseJoinColumns];

      const statement = new InsertStatement(keys, data, this.order++);
      const hash = statement.getHash();

      if (prop.owner || !this.inserts.has(hash)) {
        this.inserts.set(hash, statement);
      }
    }
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

  async execute(): Promise<void> {
    if (this.deletes.size > 0) {
      const deletes = [...this.deletes.values()];

      for (let i = 0; i < deletes.length; i += this.batchSize) {
        const chunk = deletes.slice(i, i + this.batchSize);
        const cond = { $or: [] } as Dictionary;

        for (const item of chunk) {
          cond.$or.push(item.getCondition());
        }

        await this.driver.nativeDelete(this.meta.className, cond, {
          ctx: this.ctx,
          schema: this.schema,
        });
      }
    }

    if (this.inserts.size === 0) {
      return;
    }

    let items: EntityData<Entity>[] = [];

    for (const insert of this.inserts.values()) {
      items[insert.order] = insert.getData();
    }

    items = items.filter(i => i);

    if (this.platform.allowsMultiInsert()) {
      for (let i = 0; i < items.length; i += this.batchSize) {
        const chunk = items.slice(i, i + this.batchSize);
        await this.driver.nativeInsertMany<Entity>(this.meta.className, chunk, {
          ctx: this.ctx,
          schema: this.schema,
          convertCustomTypes: false,
          processCollections: false,
        });
      }
      /* v8 ignore start */
    } else {
      await Utils.runSerial(items, item => {
        return this.driver.createQueryBuilder(this.meta.className, this.ctx, 'write')
          .withSchema(this.schema)
          .insert(item)
          .execute('run', false);
      });
    }
    /* v8 ignore stop */
  }

}
