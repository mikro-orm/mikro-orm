import { MetadataStorage } from '../metadata';
import { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityProperty, IPrimaryKey } from '../typings';
import { Collection, EntityIdentifier, wrap } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { FilterQuery, IDatabaseDriver, Transaction } from '..';
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

  async persistCollectionToDatabase<T extends AnyEntity<T>>(coll: Collection<T>, ctx?: Transaction): Promise<void> {
    const pk = this.metadata.get(coll.property.type).primaryKey;
    const data = { [coll.property.name]: coll.getIdentifiers(pk) } as EntityData<T>;
    await this.driver.nativeUpdate(coll.owner.constructor.name, wrap(coll.owner).__primaryKey, data, ctx);
    coll.setDirty(false);
  }

  private async persistEntity<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, meta: EntityMetadata<T>, ctx?: Transaction): Promise<void> {
    let res: QueryResult | undefined;

    if (changeSet.type === ChangeSetType.DELETE) {
      await this.driver.nativeDelete(changeSet.name, changeSet.entity.__primaryKey as {}, ctx);
    } else if (changeSet.type === ChangeSetType.UPDATE) {
      res = await this.updateEntity(meta, changeSet, ctx);
      this.mapReturnedValues(changeSet.entity, res, meta);
    } else if (changeSet.entity.__primaryKey) { // ChangeSetType.CREATE with primary key
      res = await this.driver.nativeInsert(changeSet.name, changeSet.payload, ctx);
      this.mapReturnedValues(changeSet.entity, res, meta);
      delete changeSet.entity.__initialized;
    } else { // ChangeSetType.CREATE without primary key
      res = await this.driver.nativeInsert(changeSet.name, changeSet.payload, ctx);
      this.mapReturnedValues(changeSet.entity, res, meta);
      wrap(changeSet.entity).__primaryKey = changeSet.entity.__primaryKey || res.insertId as any;
      this.identifierMap[changeSet.entity.__uuid].setValue(changeSet.entity.__primaryKey as IPrimaryKey);
      delete changeSet.entity.__initialized;
    }

    await this.processOptimisticLock(meta, changeSet, res, ctx);
    changeSet.persisted = true;
  }

  private async updateEntity<T extends AnyEntity<T>>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, ctx?: Transaction): Promise<QueryResult> {
    if (!meta.versionProperty || !changeSet.entity[meta.versionProperty]) {
      return this.driver.nativeUpdate(changeSet.name, changeSet.entity.__primaryKey as {}, changeSet.payload, ctx);
    }

    const cond = {
      [changeSet.entity.__meta.primaryKey]: changeSet.entity.__primaryKey,
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
      changeSet.entity[meta.versionProperty] = e![meta.versionProperty] as any;
    }
  }

  private processReference<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, prop: EntityProperty): void {
    const value = changeSet.payload[prop.name];

    if (value instanceof EntityIdentifier) {
      changeSet.payload[prop.name as keyof T] = value.getValue();
    }

    if (prop.onCreate && changeSet.type === ChangeSetType.CREATE) {
      changeSet.entity[prop.name as keyof T] = changeSet.payload[prop.name as keyof T] = prop.onCreate();
    }

    if (prop.onUpdate) {
      changeSet.entity[prop.name as keyof T] = changeSet.payload[prop.name as keyof T] = prop.onUpdate();
    }
  }

  private mapReturnedValues<T extends AnyEntity<T>>(entity: T, res: QueryResult, meta: EntityMetadata<T>): void {
    if (res.row && Object.keys(res.row).length > 0) {
      Object.values<EntityProperty>(meta.properties).forEach(prop => {
        if (res.row![prop.fieldName]) {
          entity[prop.name as keyof T] = res.row![prop.fieldName] as T[keyof T];
        }
      });
    }
  }

}
