import { MetadataStorage } from '../metadata';
import { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityProperty, FilterQuery, IHydrator, IPrimaryKey } from '../typings';
import { EntityFactory, EntityIdentifier } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { QueryResult, Transaction } from '../connections';
import { Configuration, Utils } from '../utils';
import { IDatabaseDriver } from '../drivers';
import { OptimisticLockError } from '../errors';

export class ChangeSetPersister {

  private readonly platform = this.driver.getPlatform();

  constructor(private readonly driver: IDatabaseDriver,
              private readonly metadata: MetadataStorage,
              private readonly hydrator: IHydrator,
              private readonly factory: EntityFactory,
              private readonly config: Configuration) { }

  async executeInserts<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    const meta = this.metadata.find(changeSets[0].name)!;
    changeSets.forEach(changeSet => this.processProperties(changeSet));

    if (changeSets.length > 1 && this.config.get('useBatchInserts', this.platform.usesBatchInserts())) {
      return this.persistNewEntities(meta, changeSets, ctx);
    }

    for (const changeSet of changeSets) {
      await this.persistNewEntity(meta, changeSet, ctx);
    }
  }

  async executeUpdates<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], batched: boolean, ctx?: Transaction): Promise<void> {
    const meta = this.metadata.find(changeSets[0].name)!;
    changeSets.forEach(changeSet => this.processProperties(changeSet));

    if (batched && changeSets.length > 1 && this.config.get('useBatchUpdates', this.platform.usesBatchUpdates())) {
      return this.persistManagedEntities(meta, changeSets, ctx);
    }

    for (const changeSet of changeSets) {
      await this.persistManagedEntity(changeSet, ctx);
    }
  }

  async executeDeletes<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    const size = this.config.get('batchSize');
    const meta = changeSets[0].entity.__meta!;
    const pk = Utils.getPrimaryKeyHash(meta.primaryKeys);

    for (let i = 0; i < changeSets.length; i += size) {
      const chunk = changeSets.slice(i, i + size);
      const pks = chunk.map(cs => cs.getPrimaryKey());
      await this.driver.nativeDelete(meta.className, { [pk]: { $in: pks } }, ctx);
    }
  }

  private processProperties<T extends AnyEntity<T>>(changeSet: ChangeSet<T>): void {
    const meta = this.metadata.find(changeSet.name)!;

    for (const prop of meta.props) {
      this.processProperty(changeSet, prop);
    }
  }

  private async persistNewEntity<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, ctx?: Transaction): Promise<void> {
    const wrapped = changeSet.entity.__helper!;
    const res = await this.driver.nativeInsert(changeSet.name, changeSet.payload, ctx, false);

    if (!wrapped.hasPrimaryKey()) {
      this.mapPrimaryKey(meta, res.insertId, changeSet);
    }

    this.mapReturnedValues(changeSet, res, meta);
    this.markAsPopulated(changeSet, meta);
    wrapped.__initialized = true;
    wrapped.__managed = true;

    if (!this.platform.usesReturningStatement()) {
      await this.reloadVersionValues(meta, [changeSet], ctx);
    }

    changeSet.persisted = true;
  }

  private async persistNewEntities<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    const size = this.config.get('batchSize');

    for (let i = 0; i < changeSets.length; i += size) {
      const chunk = changeSets.slice(i, i + size);
      await this.persistNewEntitiesBatch(meta, chunk, ctx);

      if (!this.platform.usesReturningStatement()) {
        await this.reloadVersionValues(meta, chunk, ctx);
      }
    }
  }

  private async persistNewEntitiesBatch<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    const res = await this.driver.nativeInsertMany(meta.className, changeSets.map(cs => cs.payload), ctx, false, false);

    for (let i = 0; i < changeSets.length; i++) {
      const changeSet = changeSets[i];
      const wrapped = changeSet.entity.__helper!;

      if (!wrapped.hasPrimaryKey()) {
        const field = meta.getPrimaryProps()[0].fieldNames[0];
        this.mapPrimaryKey(meta, res.rows![i][field], changeSet);
      }

      this.mapReturnedValues(changeSet, res, meta);
      this.markAsPopulated(changeSet, meta);
      wrapped.__initialized = true;
      wrapped.__managed = true;
      changeSet.persisted = true;
    }
  }

  private async persistManagedEntity<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, ctx?: Transaction): Promise<void> {
    const meta = this.metadata.find(changeSet.name)!;
    const res = await this.updateEntity(meta, changeSet, ctx);
    this.checkOptimisticLock(meta, changeSet, res);
    await this.reloadVersionValues(meta, [changeSet], ctx);
    changeSet.persisted = true;
  }

  private async persistManagedEntities<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    const size = this.config.get('batchSize');

    for (let i = 0; i < changeSets.length; i += size) {
      const chunk = changeSets.slice(i, i + size);
      await this.persistManagedEntitiesBatch(meta, chunk, ctx);
      await this.reloadVersionValues(meta, chunk, ctx);
    }
  }

  private async persistManagedEntitiesBatch<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    await this.checkOptimisticLocks(meta, changeSets, ctx);
    await this.driver.nativeUpdateMany(meta.className, changeSets.map(cs => cs.getPrimaryKey() as Dictionary), changeSets.map(cs => cs.payload), ctx, false, false);
    changeSets.forEach(cs => cs.persisted = true);
  }

  private mapPrimaryKey<T extends AnyEntity<T>>(meta: EntityMetadata<T>, value: IPrimaryKey, changeSet: ChangeSet<T>): void {
    const prop = meta.properties[meta.primaryKeys[0]];
    const insertId = prop.customType ? prop.customType.convertToJSValue(value, this.platform) : value;
    const wrapped = changeSet.entity.__helper!;

    if (!wrapped.hasPrimaryKey()) {
      wrapped.setPrimaryKey(insertId);
    }

    // some drivers might be returning bigint PKs as numbers when the number is small enough,
    // but we need to have it as string so comparison works in change set tracking, so instead
    // of using the raw value from db, we convert it back to the db value explicitly
    value = prop.customType ? prop.customType.convertToDatabaseValue(insertId, this.platform) : value;
    changeSet.payload[wrapped.__meta.primaryKeys[0]] = value;
    wrapped.__identifier!.setValue(value);
  }

  /**
   * Sets populate flag to new entities so they are serialized like if they were loaded from the db
   */
  private markAsPopulated<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, meta: EntityMetadata<T>) {
    if (!this.config.get('populateAfterFlush')) {
      return;
    }

    changeSet.entity.__helper!.populated();
    meta.relations.forEach(prop => {
      const value = changeSet.entity[prop.name];

      if (Utils.isEntity(value, true)) {
        (value as AnyEntity).__helper!.populated();
      } else if (Utils.isCollection(value)) {
        value.populated();
      }
    });
  }

  private async updateEntity<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, ctx?: Transaction): Promise<QueryResult> {
    if (!meta.versionProperty || !changeSet.entity[meta.versionProperty]) {
      return this.driver.nativeUpdate(changeSet.name, changeSet.getPrimaryKey() as Dictionary, changeSet.payload, ctx, false);
    }

    const cond = {
      ...Utils.getPrimaryKeyCond<T>(changeSet.entity, meta.primaryKeys),
      [meta.versionProperty]: this.platform.quoteVersionValue(changeSet.entity[meta.versionProperty] as unknown as Date, meta.properties[meta.versionProperty]),
    } as FilterQuery<T>;

    return this.driver.nativeUpdate(changeSet.name, cond, changeSet.payload, ctx, false);
  }

  private async checkOptimisticLocks<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    if (!meta.versionProperty || changeSets.every(cs => !cs.entity[meta.versionProperty])) {
      return;
    }

    const $or = changeSets.map(cs => ({
      ...Utils.getPrimaryKeyCond<T>(cs.entity, meta.primaryKeys),
      [meta.versionProperty]: this.platform.quoteVersionValue(cs.entity[meta.versionProperty] as unknown as Date, meta.properties[meta.versionProperty]),
    }));

    const res = await this.driver.find<T>(meta.className, { $or } as FilterQuery<T>, { fields: meta.primaryKeys }, ctx);

    if (res.length !== changeSets.length) {
      const compare = (a: Dictionary, b: Dictionary, keys: string[]) => keys.every(k => a[k] === b[k]);
      const entity = changeSets.find(cs => !res.some(row => compare(Utils.getPrimaryKeyCond(cs.entity, meta.primaryKeys)!, row, meta.primaryKeys)))!.entity;
      throw OptimisticLockError.lockFailed(entity);
    }
  }

  private checkOptimisticLock<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, res?: QueryResult) {
    if (meta.versionProperty && res && !res.affectedRows) {
      throw OptimisticLockError.lockFailed(changeSet.entity);
    }
  }

  private async reloadVersionValues<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], ctx?: Transaction) {
    if (!meta.versionProperty) {
      return;
    }

    const pk = Utils.getPrimaryKeyHash(meta.primaryKeys);
    const pks = changeSets.map(cs => cs.getPrimaryKey());
    const data = await this.driver.find<T>(meta.name!, { [pk]: { $in: pks } }, {
      fields: [meta.versionProperty],
    }, ctx);
    const map = new Map<string, Date>();
    data.forEach(e => map.set(Utils.getCompositeKeyHash<T>(e as T, meta), e[meta.versionProperty] as Date));

    for (const changeSet of changeSets) {
      const version = map.get(changeSet.entity.__helper!.getSerializedPrimaryKey());

      // needed for sqlite
      if (meta.properties[meta.versionProperty].type.toLowerCase() === 'date') {
        changeSet.entity[meta.versionProperty] = new Date(version as unknown as string) as unknown as T[keyof T & string];
      } else {
        changeSet.entity[meta.versionProperty] = version as unknown as T[keyof T & string];
      }

      changeSet.payload![meta.versionProperty] = version;
    }
  }

  private processProperty<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, prop: EntityProperty<T>): void {
    const meta = this.metadata.find(changeSet.name)!;
    const values = Utils.unwrapProperty(changeSet.payload, meta, prop, true); // for object embeddables
    const value = changeSet.payload[prop.name] as unknown; // for inline embeddables

    if (value instanceof EntityIdentifier) {
      Utils.setPayloadProperty<T>(changeSet.payload, meta, prop, value.getValue());
    }

    values.forEach(([value, indexes]) => {
      if (value instanceof EntityIdentifier) {
        Utils.setPayloadProperty<T>(changeSet.payload, meta, prop, value.getValue(), indexes);
      }
    });

    if (prop.onCreate && changeSet.type === ChangeSetType.CREATE && changeSet.entity[prop.name] === undefined) {
      changeSet.entity[prop.name] = prop.onCreate(changeSet.entity);
      changeSet.payload[prop.name] = prop.customType ? prop.customType.convertToDatabaseValue(changeSet.entity[prop.name], this.platform) : changeSet.entity[prop.name];

      if (prop.primary) {
        this.mapPrimaryKey(changeSet.entity.__meta!, changeSet.entity[prop.name] as unknown as IPrimaryKey, changeSet);
      }
    }

    if (prop.onUpdate && changeSet.type === ChangeSetType.UPDATE) {
      changeSet.entity[prop.name] = prop.onUpdate(changeSet.entity);
      changeSet.payload[prop.name] = prop.customType ? prop.customType.convertToDatabaseValue(changeSet.entity[prop.name], this.platform) : changeSet.entity[prop.name];
    }

    if (changeSet.payload[prop.name] as unknown instanceof Date) {
      changeSet.payload[prop.name] = this.platform.processDateProperty(changeSet.payload[prop.name]);
    }
  }

  /**
   * Maps values returned via `returning` statement (postgres) or the inserted id (other sql drivers).
   * No need to handle composite keys here as they need to be set upfront.
   * We do need to map to the change set payload too, as it will be used in the originalEntityData for new entities.
   */
  private mapReturnedValues<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, res: QueryResult, meta: EntityMetadata<T>): void {
    if (this.platform.usesReturningStatement() && res.row && Utils.hasObjectKeys(res.row)) {
      const data = meta.props.reduce((ret, prop) => {
        if (prop.primary && !changeSet.entity.__helper!.hasPrimaryKey()) {
          this.mapPrimaryKey(meta, res.row![prop.fieldNames[0]], changeSet);
          return ret;
        }

        if (prop.fieldNames && Utils.isDefined(res.row![prop.fieldNames[0]], true) && !Utils.isDefined(changeSet.entity[prop.name], true)) {
          ret[prop.name] = changeSet.payload[prop.name] = res.row![prop.fieldNames[0]];
        }

        return ret;
      }, {} as Dictionary);

      if (Utils.hasObjectKeys(data)) {
        this.hydrator.hydrate<T>(changeSet.entity, meta, data as EntityData<T>, this.factory, 'returning', false, true);
      }
    }
  }

}
