import { MetadataStorage } from '../metadata/MetadataStorage';
import { EntityProperty, IEntityType } from '../decorators/Entity';
import { ChangeSet, UnitOfWork } from './UnitOfWork';
import { EntityIdentifier } from '../entity/EntityIdentifier';
import { EntityManager } from '../EntityManager';

export class ChangeSetPersister {

  private readonly metadata = MetadataStorage.getMetadata();

  constructor(private readonly em: EntityManager,
              private readonly uow: UnitOfWork,
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
      await this.em.getDriver().nativeDelete(changeSet.name, changeSet.entity[pk]);
    } else if (changeSet.entity[pk]) {
      await this.em.getDriver().nativeUpdate(changeSet.name, changeSet.entity[pk], changeSet.payload);
      this.uow.addToIdentityMap(changeSet.entity);
    } else {
      changeSet.entity[pk] = await this.em.getDriver().nativeInsert(changeSet.name, changeSet.payload) as T[keyof T];
      this.identifierMap[changeSet.entity.uuid].setValue(changeSet.entity[pk]);
      delete changeSet.entity.__initialized;
      this.em.merge(changeSet.name, changeSet.entity);
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
