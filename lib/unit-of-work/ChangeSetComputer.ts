import { Utils } from '../utils';
import { MetadataStorage } from '../metadata';
import { EntityData, EntityProperty, IEntity, IEntityType } from '../decorators';
import { ChangeSet } from './ChangeSet';
import { Collection, EntityIdentifier, EntityValidator, ReferenceType } from '../entity';

export class ChangeSetComputer {

  private readonly metadata = MetadataStorage.getMetadata();

  constructor(private readonly validator: EntityValidator,
              private readonly originalEntityData: Record<string, EntityData<IEntity>>,
              private readonly identifierMap: Record<string, EntityIdentifier>) { }

  computeChangeSet<T extends IEntityType<T>>(entity: T): ChangeSet<T> | null {
    const changeSet = { entity } as ChangeSet<T>;
    const meta = this.metadata[entity.constructor.name];

    changeSet.name = meta.name;
    changeSet.collection = meta.collection;
    changeSet.payload = this.computePayload(entity);

    this.validator.validate<T>(changeSet.entity, changeSet.payload, meta);

    for (const prop of Object.values(meta.properties)) {
      this.processReference(changeSet, prop);
    }

    if (this.originalEntityData[entity.__uuid] && Object.keys(changeSet.payload).length === 0) {
      return null;
    }

    return changeSet;
  }

  private computePayload<T extends IEntityType<T>>(entity: T): EntityData<T> {
    if (this.originalEntityData[entity.__uuid]) {
      return Utils.diffEntities<T>(this.originalEntityData[entity.__uuid] as T, entity);
    } else {
      return Utils.prepareEntity(entity);
    }
  }

  private processReference<T extends IEntityType<T>>(changeSet: ChangeSet<T>, prop: EntityProperty): void {
    if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      this.processManyToMany(changeSet, prop, changeSet.entity[prop.name as keyof T]);
    } else if (prop.reference === ReferenceType.MANY_TO_ONE && changeSet.entity[prop.name as keyof T]) {
      this.processManyToOne(prop, changeSet);
    }
  }

  private processManyToOne<T extends IEntityType<T>>(prop: EntityProperty, changeSet: ChangeSet<T>): void {
    const pk = this.metadata[prop.type].primaryKey;
    const entity = changeSet.entity[prop.name as keyof T];

    if (!entity[pk]) {
      changeSet.payload[prop.name] = this.identifierMap[entity.uuid];
    }
  }

  private processManyToMany<T extends IEntityType<T>>(changeSet: ChangeSet<T>, prop: EntityProperty, collection: Collection<IEntity>): void {
    if (prop.owner && collection.isDirty()) {
      const pk = this.metadata[prop.type].primaryKey as keyof IEntity;
      changeSet.payload[prop.name] = collection.getItems().map(item => item[pk] || this.identifierMap[item.__uuid]);
      collection.setDirty(false);
    }
  }

}
