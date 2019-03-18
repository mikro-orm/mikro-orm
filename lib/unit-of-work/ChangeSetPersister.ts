import { MetadataStorage } from '../metadata';
import { EntityProperty, IEntityType } from '../decorators';
import { EntityIdentifier } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { IDatabaseDriver } from '..';

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
    await this.persistEntity(changeSet);
  }

  private async persistEntity<T extends IEntityType<T>>(changeSet: ChangeSet<T>): Promise<void> {
    if (changeSet.type === ChangeSetType.DELETE) {
      await this.driver.nativeDelete(changeSet.name, changeSet.entity.__primaryKey);
    } else if (changeSet.type === ChangeSetType.UPDATE) {
      await this.driver.nativeUpdate(changeSet.name, changeSet.entity.__primaryKey, changeSet.payload);
    } else if (changeSet.entity.__primaryKey) { // ChangeSetType.CREATE with primary key
      await this.driver.nativeInsert(changeSet.name, changeSet.payload);
      delete changeSet.entity.__initialized;
    } else { // ChangeSetType.CREATE without primary key
      changeSet.entity.__primaryKey = await this.driver.nativeInsert(changeSet.name, changeSet.payload) as T[keyof T];
      this.identifierMap[changeSet.entity.__uuid].setValue(changeSet.entity.__primaryKey);
      delete changeSet.entity.__initialized;
    }
  }

  private processReference<T extends IEntityType<T>>(changeSet: ChangeSet<T>, prop: EntityProperty): void {
    const value = changeSet.payload[prop.name];

    if (value instanceof EntityIdentifier) {
      changeSet.payload[prop.name] = value.getValue();
    } else if (Array.isArray(value) && value.some(item => item instanceof EntityIdentifier)) {
      changeSet.payload[prop.name] = value.map(item => item instanceof EntityIdentifier ? item.getValue() : item);
    }

    if (prop.onUpdate) {
      changeSet.entity[prop.name as keyof T] = changeSet.payload[prop.name] = prop.onUpdate();
    }
  }

}
