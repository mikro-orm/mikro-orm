import type { MetadataStorage } from '../metadata';
import type { AnyEntity, Dictionary, EntityData, EntityDictionary, EntityMetadata, EntityProperty, EntityKey, FilterQuery, IHydrator, IPrimaryKey } from '../typings';
import { EntityIdentifier, helper, type EntityFactory, type EntityValidator, type Collection } from '../entity';
import { ChangeSetType, type ChangeSet } from './ChangeSet';
import type { QueryResult } from '../connections';
import { Utils, type Configuration, type EntityComparator } from '../utils';
import type { DriverMethodOptions, IDatabaseDriver } from '../drivers';
import { OptimisticLockError } from '../errors';
import { ReferenceKind } from '../enums';
import type { Platform } from '../platforms/Platform';

export class ChangeSetPersister {

  private readonly platform: Platform;
  private readonly comparator: EntityComparator;

  constructor(private readonly driver: IDatabaseDriver,
              private readonly metadata: MetadataStorage,
              private readonly hydrator: IHydrator,
              private readonly factory: EntityFactory,
              private readonly validator: EntityValidator,
              private readonly config: Configuration) {
    this.platform = this.driver.getPlatform();
    this.comparator = this.config.getComparator(this.metadata);
  }

  async executeInserts<T extends object>(changeSets: ChangeSet<T>[], options?: DriverMethodOptions, withSchema?: boolean): Promise<void> {
    if (!withSchema) {
      return this.runForEachSchema(changeSets, 'executeInserts', options);
    }

    const meta = this.metadata.find(changeSets[0].name)!;
    changeSets.forEach(changeSet => this.processProperties(changeSet));

    if (changeSets.length > 1 && this.config.get('useBatchInserts', this.platform.usesBatchInserts())) {
      return this.persistNewEntities(meta, changeSets, options);
    }

    for (const changeSet of changeSets) {
      await this.persistNewEntity(meta, changeSet, options);
    }
  }

  async executeUpdates<T extends object>(changeSets: ChangeSet<T>[], batched: boolean, options?: DriverMethodOptions, withSchema?: boolean): Promise<void> {
    if (!withSchema) {
      return this.runForEachSchema(changeSets, 'executeUpdates', options, batched);
    }

    const meta = this.metadata.find(changeSets[0].name)!;
    changeSets.forEach(changeSet => this.processProperties(changeSet));

    if (batched && changeSets.length > 1 && this.config.get('useBatchUpdates', this.platform.usesBatchUpdates())) {
      return this.persistManagedEntities(meta, changeSets, options);
    }

    for (const changeSet of changeSets) {
      await this.persistManagedEntity(changeSet, options);
    }
  }

  async executeDeletes<T extends object>(changeSets: ChangeSet<T>[], options?: DriverMethodOptions, withSchema?: boolean): Promise<void> {
    if (!withSchema) {
      return this.runForEachSchema(changeSets, 'executeDeletes', options);
    }

    const size = this.config.get('batchSize');
    const meta = changeSets[0].meta;
    const pk = Utils.getPrimaryKeyHash(meta.primaryKeys);

    for (let i = 0; i < changeSets.length; i += size) {
      const chunk = changeSets.slice(i, i + size);
      const pks = chunk.map(cs => cs.getPrimaryKey());
      options = this.propagateSchemaFromMetadata(meta, options);
      await this.driver.nativeDelete(meta.className, { [pk]: { $in: pks } } as FilterQuery<T>, options);
    }
  }

  private async runForEachSchema<T extends object>(
    changeSets: ChangeSet<T>[],
    method: 'executeInserts' | 'executeUpdates' | 'executeDeletes',
    options?: DriverMethodOptions,
    ...args: unknown[]
  ): Promise<void> {
    const groups = new Map<string, ChangeSet<T>[]>();
    changeSets.forEach(cs => {
      const group = groups.get(cs.schema!) ?? [];
      group.push(cs);
      groups.set(cs.schema!, group);
    });

    for (const [key, group] of groups.entries()) {
      options = { ...options, schema: key };
      // @ts-ignore
      await this[method](group, ...args, options, true);
    }
  }

  private processProperties<T extends object>(changeSet: ChangeSet<T>): void {
    const meta = this.metadata.find(changeSet.name)!;

    for (const prop of meta.relations) {
      this.processProperty(changeSet, prop);
    }

    if (changeSet.type === ChangeSetType.CREATE && this.config.get('validateRequired')) {
      this.validator.validateRequired(changeSet.entity);
    }
  }

  private async persistNewEntity<T extends object>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, options?: DriverMethodOptions): Promise<void> {
    const wrapped = helper(changeSet.entity);
    options = this.propagateSchemaFromMetadata(meta, options, {
      convertCustomTypes: false,
    });
    const res = await this.driver.nativeInsertMany(meta.className, [changeSet.payload], options);

    if (!wrapped.hasPrimaryKey()) {
      this.mapPrimaryKey(meta, res.insertId as number, changeSet);
    }

    this.mapReturnedValues(changeSet.entity, changeSet.payload, res.row, meta);
    this.markAsPopulated(changeSet, meta);
    wrapped.__initialized = true;
    wrapped.__managed = true;

    if (!this.platform.usesReturningStatement()) {
      await this.reloadVersionValues(meta, [changeSet], options);
    }

    changeSet.persisted = true;
  }

  private async persistNewEntities<T extends object>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], options?: DriverMethodOptions): Promise<void> {
    const size = this.config.get('batchSize');

    for (let i = 0; i < changeSets.length; i += size) {
      const chunk = changeSets.slice(i, i + size);
      await this.persistNewEntitiesBatch(meta, chunk, options);

      if (!this.platform.usesReturningStatement()) {
        await this.reloadVersionValues(meta, chunk, options);
      }
    }
  }

  private propagateSchemaFromMetadata<T extends object>(meta: EntityMetadata<T>, options?: DriverMethodOptions, additionalOptions?: Dictionary): DriverMethodOptions {
    return {
      ...options,
      ...additionalOptions,
      schema: options?.schema ?? meta.schema,
    };
  }

  private async persistNewEntitiesBatch<T extends object>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], options?: DriverMethodOptions): Promise<void> {
    options = this.propagateSchemaFromMetadata(meta, options, {
      convertCustomTypes: false,
      processCollections: false,
    });
    const res = await this.driver.nativeInsertMany(meta.className, changeSets.map(cs => cs.payload), options);

    for (let i = 0; i < changeSets.length; i++) {
      const changeSet = changeSets[i];
      const wrapped = helper(changeSet.entity);

      if (!wrapped.hasPrimaryKey()) {
        const field = meta.getPrimaryProps()[0].fieldNames[0];
        this.mapPrimaryKey(meta, res.rows![i][field], changeSet);
      }

      if (res.rows) {
        this.mapReturnedValues(changeSet.entity, changeSet.payload, res.rows[i], meta);
      }
      this.markAsPopulated(changeSet, meta);
      wrapped.__initialized = true;
      wrapped.__managed = true;
      changeSet.persisted = true;
    }
  }

  private async persistManagedEntity<T extends object>(changeSet: ChangeSet<T>, options?: DriverMethodOptions): Promise<void> {
    const meta = this.metadata.find(changeSet.name)!;
    const res = await this.updateEntity(meta, changeSet, options);
    this.checkOptimisticLock(meta, changeSet, res);
    this.mapReturnedValues(changeSet.entity, changeSet.payload, res.row, meta);
    await this.reloadVersionValues(meta, [changeSet], options);
    changeSet.persisted = true;
  }

  private async persistManagedEntities<T extends object>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], options?: DriverMethodOptions): Promise<void> {
    const size = this.config.get('batchSize');

    for (let i = 0; i < changeSets.length; i += size) {
      const chunk = changeSets.slice(i, i + size);
      await this.persistManagedEntitiesBatch(meta, chunk, options);
      await this.reloadVersionValues(meta, chunk, options);
    }
  }

  private checkConcurrencyKeys<T extends object>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, cond: Dictionary): void {
    const tmp: string[] = [];
    cond = Utils.isPlainObject(cond) ? cond : { [meta.primaryKeys[0]]: cond };

    for (const key of meta.concurrencyCheckKeys) {
      cond[key] = changeSet.originalEntity![key];

      if (changeSet.payload[key]) {
        tmp.push(key);
      }
    }

    if (tmp.length === 0 && meta.concurrencyCheckKeys.size > 0) {
      throw OptimisticLockError.lockFailed(changeSet.entity);
    }
  }

  private async persistManagedEntitiesBatch<T extends object>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], options?: DriverMethodOptions): Promise<void> {
    await this.checkOptimisticLocks(meta, changeSets, options);
    options = this.propagateSchemaFromMetadata(meta, options, {
      convertCustomTypes: false,
      processCollections: false,
    });
    const cond = changeSets.map(cs => cs.getPrimaryKey(true) as FilterQuery<T>);

    changeSets.forEach((changeSet, idx) => {
      this.checkConcurrencyKeys(meta, changeSet, cond[idx]);
    });

    const res = await this.driver.nativeUpdateMany(meta.className, cond, changeSets.map(cs => cs.payload), options);

    changeSets.forEach((changeSet, idx) => {
      if (res.rows) {
        this.mapReturnedValues(changeSet.entity, changeSet.payload, res.rows[idx], meta);
      }

      changeSet.persisted = true;
    });
  }

  private mapPrimaryKey<T extends object>(meta: EntityMetadata<T>, value: IPrimaryKey, changeSet: ChangeSet<T>): void {
    const prop = meta.properties[meta.primaryKeys[0]];
    const insertId = prop.customType ? prop.customType.convertToJSValue(value, this.platform) : value;
    const wrapped = helper(changeSet.entity);

    if (!wrapped.hasPrimaryKey()) {
      wrapped.setPrimaryKey(insertId);
    }

    // some drivers might be returning bigint PKs as numbers when the number is small enough,
    // but we need to have it as string so comparison works in change set tracking, so instead
    // of using the raw value from db, we convert it back to the db value explicitly
    value = prop.customType ? prop.customType.convertToDatabaseValue(insertId, this.platform, { mode: 'serialization' }) : value;
    changeSet.payload[wrapped.__meta.primaryKeys[0]] = value;
    wrapped.__identifier?.setValue(value);
  }

  /**
   * Sets populate flag to new entities so they are serialized like if they were loaded from the db
   */
  private markAsPopulated<T extends object>(changeSet: ChangeSet<T>, meta: EntityMetadata<T>) {
    helper(changeSet.entity).__schema = this.driver.getSchemaName(meta, changeSet);

    if (!this.config.get('populateAfterFlush')) {
      return;
    }

    helper(changeSet.entity).populated();
    meta.relations.forEach(prop => {
      const value = changeSet.entity[prop.name];

      if (Utils.isEntity(value, true)) {
        (value as AnyEntity).__helper!.populated();
      } else if (Utils.isCollection(value)) {
        (value as Collection<any>).populated();
      }
    });
  }

  private async updateEntity<T extends object>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, options?: DriverMethodOptions): Promise<QueryResult<T>> {
    const cond = changeSet.getPrimaryKey(true) as Dictionary;
    options = this.propagateSchemaFromMetadata(meta, options, {
      convertCustomTypes: false,
    });

    if (meta.concurrencyCheckKeys.size === 0 && (!meta.versionProperty || changeSet.entity[meta.versionProperty] == null)) {
      return this.driver.nativeUpdate(changeSet.name, cond as FilterQuery<T>, changeSet.payload, options);
    }

    if (meta.versionProperty) {
      cond[meta.versionProperty] = this.platform.quoteVersionValue(changeSet.entity[meta.versionProperty] as unknown as Date, meta.properties[meta.versionProperty]);
    }

    this.checkConcurrencyKeys(meta, changeSet, cond);

    return this.driver.nativeUpdate<T>(changeSet.name, cond as FilterQuery<T>, changeSet.payload, options);
  }

  private async checkOptimisticLocks<T extends object>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], options?: DriverMethodOptions): Promise<void> {
    if (meta.concurrencyCheckKeys.size === 0 && (!meta.versionProperty || changeSets.every(cs => cs.entity[meta.versionProperty] == null))) {
      return;
    }

    // skip entity references as they don't have version values loaded
    changeSets = changeSets.filter(cs => helper(cs.entity).__initialized);

    const $or = changeSets.map(cs => {
      const cond = Utils.getPrimaryKeyCond<T>(cs.originalEntity as T, meta.primaryKeys.concat(...meta.concurrencyCheckKeys)) as FilterQuery<T>;

      if (meta.versionProperty) {
        // @ts-ignore
        cond[meta.versionProperty] = this.platform.quoteVersionValue(cs.entity[meta.versionProperty] as unknown as Date, meta.properties[meta.versionProperty]);
      }

      return cond;
    });

    const primaryKeys = meta.primaryKeys.concat(...meta.concurrencyCheckKeys);
    options = this.propagateSchemaFromMetadata(meta, options, {
      fields: primaryKeys,
    });
    const res = await this.driver.find<T>(meta.className, { $or } as FilterQuery<T>, options);

    if (res.length !== changeSets.length) {
      const compare = (a: Dictionary, b: Dictionary, keys: string[]) => keys.every(k => a[k] === b[k]);
      const entity = changeSets.find(cs => {
        return !res.some(row => compare(Utils.getPrimaryKeyCond(cs.entity, primaryKeys)!, row, primaryKeys));
      })!.entity;
      throw OptimisticLockError.lockFailed(entity);
    }
  }

  private checkOptimisticLock<T extends object>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, res?: QueryResult) {
    if ((meta.versionProperty || meta.concurrencyCheckKeys.size > 0) && res && !res.affectedRows) {
      throw OptimisticLockError.lockFailed(changeSet.entity);
    }
  }

  /**
   * This method also handles reloading of database default values for inserts and raw property updates,
   * so we use a single query in case of both versioning and default values is used.
   */
  private async reloadVersionValues<T extends object>(meta: EntityMetadata<T>, changeSets: ChangeSet<T>[], options?: DriverMethodOptions) {
    const reloadProps = meta.versionProperty && !this.platform.usesReturningStatement() ? [meta.properties[meta.versionProperty]] : [];

    if (changeSets[0].type === ChangeSetType.CREATE) {
      // do not reload things that already had a runtime value
      meta.props
        .filter(prop => prop.persist !== false && (prop.autoincrement || prop.generated || prop.defaultRaw))
        .filter(prop => (changeSets[0].entity[prop.name] == null && prop.defaultRaw !== 'null') || Utils.isRawSql(changeSets[0].entity[prop.name]))
        .forEach(prop => reloadProps.push(prop));
    }

    if (changeSets[0].type === ChangeSetType.UPDATE) {
      const returning = new Set<EntityProperty<T>>();
      changeSets.forEach(cs => {
        Utils.keys(cs.payload).forEach(k => {
          if (Utils.isRawSql(cs.payload[k]) && Utils.isRawSql(cs.entity[k as EntityKey<T>])) {
            returning.add(meta.properties[k as EntityKey<T>]);
          }
        });
      });
      // reload generated columns
      if (!this.platform.usesReturningStatement()) {
        meta.props
          .filter(prop => prop.generated && !prop.primary)
          .forEach(prop => reloadProps.push(prop));
        reloadProps.push(...returning);
      }
    }

    if (reloadProps.length === 0) {
      return;
    }

    reloadProps.unshift(...meta.getPrimaryProps());
    const pk = Utils.getPrimaryKeyHash(meta.primaryKeys);
    const pks = changeSets.map(cs => {
      const val = helper(cs.entity).getPrimaryKey(true);

      if (Utils.isPlainObject(val)) {
        return Utils.getCompositeKeyValue(val, meta, false, this.platform);
      }

      return val;
    });
    options = this.propagateSchemaFromMetadata(meta, options, {
      fields: Utils.unique(reloadProps.map(prop => prop.name)),
    });
    const data = await this.driver.find<T>(meta.name!, { [pk]: { $in: pks } } as FilterQuery<T>, options);
    const map = new Map<string, Dictionary>();
    data.forEach(item => map.set(Utils.getCompositeKeyHash(item, meta, true, this.platform, true), item));

    for (const changeSet of changeSets) {
      const data = map.get(helper(changeSet.entity).getSerializedPrimaryKey());
      this.hydrator.hydrate<T>(changeSet.entity, meta, data as EntityData<T>, this.factory, 'full', false, true);
      Object.assign(changeSet.payload, data); // merge to the changeset payload, so it gets saved to the entity snapshot
    }
  }

  private processProperty<T extends object>(changeSet: ChangeSet<T>, prop: EntityProperty<T>): void {
    const meta = this.metadata.find(changeSet.name)!;
    const value = changeSet.payload[prop.name] as unknown; // for inline embeddables

    if (value instanceof EntityIdentifier) {
      changeSet.payload[prop.name] = value.getValue();
      return;
    }

    if (prop.kind === ReferenceKind.MANY_TO_MANY && Array.isArray(value)) {
      changeSet.payload[prop.name] = value.map(val => val instanceof EntityIdentifier ? val.getValue() : val);
      return;
    }

    if (prop.name in changeSet.payload) {
      return;
    }

    const values = Utils.unwrapProperty(changeSet.payload, meta, prop, true); // for object embeddables

    values.forEach(([value, indexes]) => {
      if (value instanceof EntityIdentifier) {
        Utils.setPayloadProperty<T>(changeSet.payload, meta, prop, value.getValue(), indexes);
      }
    });
  }

  /**
   * Maps values returned via `returning` statement (postgres) or the inserted id (other sql drivers).
   * No need to handle composite keys here as they need to be set upfront.
   * We do need to map to the change set payload too, as it will be used in the originalEntityData for new entities.
   */
  mapReturnedValues<T extends object>(entity: T, payload: EntityDictionary<T>, row: Dictionary | undefined, meta: EntityMetadata<T>): void {
    if (this.platform.usesReturningStatement() && row && Utils.hasObjectKeys(row)) {
      const mapped = this.comparator.mapResult<T>(meta.className, row as EntityDictionary<T>);
      this.hydrator.hydrate(entity, meta, mapped, this.factory, 'full', false, true);
      Object.assign(payload, mapped); // merge to the changeset payload, so it gets saved to the entity snapshot
    }
  }

}
