import { MetadataStorage } from '../metadata';
import { EntityMetadata, EntityProperty, IEntityType } from '../decorators';
import { EntityIdentifier } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { IDatabaseDriver } from '..';
import { QueryResult } from '../connections';
import { ValidationError } from '../utils';

export class ChangeSetPersister {

  private readonly metadata = MetadataStorage.getMetadata();

  constructor(private readonly driver: IDatabaseDriver,
              private readonly identifierMap: Record<string, EntityIdentifier>) { }

  async persistToDatabase<T extends IEntityType<T>>(changeSet: ChangeSet<T>): Promise<void> {
    const meta = this.metadata[changeSet.name];

    // process references first
    for (const prop of Object.values(meta.properties)) {
      this.processReference(changeSet, prop);
    }

    // persist the entity itself
    await this.persistEntity(changeSet, meta);
  }

  private async persistEntity<T extends IEntityType<T>>(changeSet: ChangeSet<T>, meta: EntityMetadata<T>): Promise<void> {
    let res: QueryResult | undefined;

    if (changeSet.type === ChangeSetType.DELETE) {
      await this.driver.nativeDelete(changeSet.name, changeSet.entity.__primaryKey);
    } else if (changeSet.type === ChangeSetType.UPDATE) {
      res = await this.updateEntity(meta, changeSet);
      this.mapReturnedValues(changeSet.entity, res, meta);
    } else if (changeSet.entity.__primaryKey) { // ChangeSetType.CREATE with primary key
      res = await this.driver.nativeInsert(changeSet.name, changeSet.payload);
      this.mapReturnedValues(changeSet.entity, res, meta);
      delete changeSet.entity.__initialized;
    } else { // ChangeSetType.CREATE without primary key
      res = await this.driver.nativeInsert(changeSet.name, changeSet.payload);
      this.mapReturnedValues(changeSet.entity, res, meta);
      changeSet.entity.__primaryKey = res.insertId;
      this.identifierMap[changeSet.entity.__uuid].setValue(changeSet.entity.__primaryKey);
      delete changeSet.entity.__initialized;
    }

    await this.processOptimisticLock(meta, changeSet, res);
  }

  private async updateEntity<T extends IEntityType<T>>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>): Promise<QueryResult> {
    if (!meta.versionProperty || !changeSet.entity[meta.versionProperty]) {
      return this.driver.nativeUpdate(changeSet.name, changeSet.entity.__primaryKey, changeSet.payload);
    }

    const cond = {
      [changeSet.entity.__primaryKeyField]: changeSet.entity.__primaryKey,
      [meta.versionProperty]: changeSet.entity[meta.versionProperty],
    };

    return this.driver.nativeUpdate(changeSet.name, cond, changeSet.payload);
  }

  private async processOptimisticLock<T extends IEntityType<T>>(meta: EntityMetadata<T>, changeSet: ChangeSet<T>, res: QueryResult | undefined) {
    if (meta.versionProperty && changeSet.type === ChangeSetType.UPDATE && res && !res.affectedRows) {
      throw ValidationError.lockFailed(changeSet.entity);
    }

    if (meta.versionProperty && [ChangeSetType.CREATE, ChangeSetType.UPDATE].includes(changeSet.type)) {
      const e = await this.driver.findOne<T>(meta.name, changeSet.entity.__primaryKey, [], {}, [meta.versionProperty]);
      changeSet.entity[meta.versionProperty as keyof T] = e![meta.versionProperty] as T[keyof T];
    }
  }

  private processReference<T extends IEntityType<T>>(changeSet: ChangeSet<T>, prop: EntityProperty): void {
    const value = changeSet.payload[prop.name];

    if (value instanceof EntityIdentifier) {
      changeSet.payload[prop.name as keyof T] = value.getValue();
    } else if (Array.isArray(value) && value.some(item => item instanceof EntityIdentifier)) {
      changeSet.payload[prop.name as keyof T] = value.map(item => item instanceof EntityIdentifier ? item.getValue() : item) as T[keyof T];
    }

    if (prop.onUpdate) {
      changeSet.entity[prop.name as keyof T] = changeSet.payload[prop.name as keyof T] = prop.onUpdate();
    }
  }

  private mapReturnedValues<T extends IEntityType<T>>(entity: T, res: QueryResult, meta: EntityMetadata<T>): void {
    if (res.row && Object.keys(res.row).length > 0) {
      Object.values(meta.properties).forEach(prop => {
        if (res.row![prop.fieldName]) {
          entity[prop.name as keyof T] = res.row![prop.fieldName] as T[keyof T];
        }
      });
    }
  }

}
