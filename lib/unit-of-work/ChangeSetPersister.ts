import { MetadataStorage } from '../metadata';
import { EntityProperty, IEntityType } from '../decorators';
import { EntityIdentifier } from '../entity';
import { ChangeSet } from './ChangeSet';
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
    const pk = this.metadata[changeSet.name].primaryKey as keyof T;

    if (changeSet.delete) {
      await this.driver.nativeDelete(changeSet.name, changeSet.entity[pk]);
    } else if (changeSet.entity[pk]) {
      await this.driver.nativeUpdate(changeSet.name, changeSet.entity[pk], changeSet.payload);
    } else {
      changeSet.entity[pk] = await this.driver.nativeInsert(changeSet.name, changeSet.payload) as T[keyof T];
      this.identifierMap[changeSet.entity.uuid].setValue(changeSet.entity[pk]);
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
