import { MetadataStorage } from '../metadata';
import { AnyEntity, Dictionary, EntityMetadata, EntityProperty, IPrimaryKey } from '../typings';
import { EntityIdentifier, wrap } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { FilterQuery, IDatabaseDriver, Transaction, Utils } from '..';
import { QueryResult } from '../connections';
import { ValidationError } from '../utils';

export class ChangeSetPersister {

  constructor(private readonly driver: IDatabaseDriver,
              private readonly identifierMap: Dictionary<EntityIdentifier>,
              private readonly metadata: MetadataStorage) { }

  async persistToDatabase<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, ctx?: Transaction): Promise<void> {
    const meta = this.metadata.get(changeSet.name);

    // process references first
    for (const prop of Object.values(meta.properties)) {
      this.processReference(changeSet, prop);
    }

    // persist the entity itself
    await this.persistEntity(changeSet, meta, ctx);
  }

  private async persistEntity<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, meta: EntityMetadata<T>, ctx?: Transaction): Promise<void> {
    let res: QueryResult | undefined;

    if (changeSet.type === ChangeSetType.DELETE) {
      await this.driver.nativeDelete(changeSet.name, changeSet.entity.__primaryKey as {}, ctx);
    } else if (changeSet.type === ChangeSetType.UPDATE) {
      res = await this.updateEntity(meta, changeSet, ctx);
      this.mapReturnedValues(changeSet.entity, res, meta);
    } else if (Utils.isDefined(changeSet.entity.__primaryKey, true)) { // ChangeSetType.CREATE with primary key
      res = await this.driver.nativeInsert(changeSet.name, changeSet.payload, ctx);
      this.mapReturnedValues(changeSet.entity, res, meta);
      delete changeSet.entity.__initialized;
    } else { // ChangeSetType.CREATE without primary key
      res = await this.driver.nativeInsert(changeSet.name, changeSet.payload, ctx);
      this.mapReturnedValues(changeSet.entity, res, meta);
      this.mapPrimaryKey(meta, res, changeSet);
      delete changeSet.entity.__initialized;
    }

    await this.processOptimisticLock(meta, changeSet, res, ctx);
    changeSet.persisted = true;
  }

  private mapPrimaryKey<T>(meta: EntityMetadata<T>, res: QueryResult, changeSet: ChangeSet<T>): void {
    const prop = meta.properties[meta.primaryKeys[0]];
    const insertId = prop.customType ? prop.customType.convertToJSValue(res.insertId, this.driver.getPlatform()) : res.insertId;
    wrap(changeSet.entity).__primaryKey = Utils.isDefined(changeSet.entity.__primaryKey, true) ? changeSet.entity.__primaryKey : insertId;
    this.identifierMap[changeSet.entity.__uuid].setValue(changeSet.entity[prop.name] as unknown as IPrimaryKey);
  }

  private async updateEntity<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, ctx?: Transaction): Promise<QueryResult> {
    if (!meta.versionProperty || !changeSet.entity[meta.versionProperty]) {
      return this.driver.nativeUpdate(changeSet.name, changeSet.entity.__primaryKey as {}, changeSet.payload, ctx);
    }

    const cond = {
      ...Utils.getPrimaryKeyCond<T>(changeSet.entity, meta.primaryKeys),
      [meta.versionProperty]: changeSet.entity[meta.versionProperty],
    } as FilterQuery<T>;

    return this.driver.nativeUpdate(changeSet.name, cond, changeSet.payload, ctx);
  }

  private async processOptimisticLock<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, res: QueryResult | undefined, ctx?: Transaction) {
    if (meta.versionProperty && changeSet.type === ChangeSetType.UPDATE && res && !res.affectedRows) {
      throw ValidationError.lockFailed(changeSet.entity);
    }

    if (meta.versionProperty && [ChangeSetType.CREATE, ChangeSetType.UPDATE].includes(changeSet.type)) {
      const e = await this.driver.findOne<T>(meta.name, changeSet.entity.__primaryKey, { populate: [meta.versionProperty] }, ctx);
      (changeSet.entity as T)[meta.versionProperty] = e![meta.versionProperty];
    }
  }

  private processReference<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, prop: EntityProperty<T>): void {
    const value = changeSet.payload[prop.name];

    if (value as unknown instanceof EntityIdentifier) {
      changeSet.payload[prop.name] = value.getValue();
    }

    if (prop.onCreate && changeSet.type === ChangeSetType.CREATE) {
      changeSet.entity[prop.name] = changeSet.payload[prop.name] = prop.onCreate();
    }

    if (prop.onUpdate) {
      changeSet.entity[prop.name] = changeSet.payload[prop.name] = prop.onUpdate();
    }
  }

  /**
   * Maps values returned via `returning` statement (postgres) or the inserted id (other sql drivers).
   * No need to handle composite keys here as they need to be set upfront.
   */
  private mapReturnedValues<T extends AnyEntity<T>>(entity: T, res: QueryResult, meta: EntityMetadata<T>): void {
    if (res.row && Object.keys(res.row).length > 0) {
      Object.values<EntityProperty>(meta.properties).forEach(prop => {
        if (prop.fieldNames && res.row![prop.fieldNames[0]] && !Utils.isDefined(entity[prop.name], true)) {
          entity[prop.name] = res.row![prop.fieldNames[0]];
        }
      });
    }
  }

}
