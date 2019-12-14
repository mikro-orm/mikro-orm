import { Utils } from '../utils';
import { MetadataStorage } from '../metadata';
import { EntityData, EntityProperty, AnyEntity, Primary } from '../typings';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { Collection, EntityIdentifier, EntityValidator, ReferenceType, wrap } from '../entity';

export class ChangeSetComputer {

  constructor(private readonly validator: EntityValidator,
              private readonly originalEntityData: Record<string, EntityData<AnyEntity>>,
              private readonly identifierMap: Record<string, EntityIdentifier>,
              private readonly metadata: MetadataStorage) { }

  computeChangeSet<T extends AnyEntity<T>>(entity: T): ChangeSet<T> | null {
    const changeSet = { entity } as ChangeSet<T>;
    const meta = this.metadata.get(entity.constructor.name);

    changeSet.name = meta.name;
    changeSet.type = this.originalEntityData[wrap(entity).__uuid] ? ChangeSetType.UPDATE : ChangeSetType.CREATE;
    changeSet.collection = meta.collection;
    changeSet.payload = this.computePayload(entity);

    this.validator.validate<T>(changeSet.entity, changeSet.payload, meta);

    for (const prop of Object.values(meta.properties)) {
      this.processReference(changeSet, prop);
    }

    if (changeSet.type === ChangeSetType.UPDATE && Object.keys(changeSet.payload).length === 0) {
      return null;
    }

    return changeSet;
  }

  private computePayload<T extends AnyEntity<T>>(entity: T): EntityData<T> {
    const wrapped = wrap(entity);
    const platform = wrapped.__internal.platform;

    if (this.originalEntityData[wrapped.__uuid]) {
      return Utils.diffEntities<T>(this.originalEntityData[wrapped.__uuid] as T, entity, this.metadata, platform);
    }

    return Utils.prepareEntity(entity, this.metadata, platform);
  }

  private processReference<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, prop: EntityProperty<T>): void {
    const isToOneOwner = prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);

    if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      this.processManyToMany(changeSet, prop, changeSet.entity[prop.name as keyof T] as unknown as Collection<T>);
    } else if (isToOneOwner && changeSet.entity[prop.name as keyof T]) {
      this.processManyToOne(prop, changeSet);
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE) {
      this.processOneToOne(prop, changeSet);
    }
  }

  private processManyToOne<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const pk = this.metadata.get(prop.type).primaryKey as keyof T;
    const entity = changeSet.entity[prop.name as keyof T] as unknown as T;

    if (!entity[pk]) {
      changeSet.payload[prop.name] = this.identifierMap[wrap(entity).__uuid];
    }
  }

  private processManyToMany<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, prop: EntityProperty<T>, collection: Collection<T>): void {
    if (collection.isDirty()) {
      const pk = this.metadata.get(prop.type).primaryKey as keyof T;
      changeSet.payload[prop.name] = collection.getItems().map(item => item[pk] || this.identifierMap[wrap(item).__uuid]);
      collection.setDirty(false);
    }
  }

  private processOneToOne<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    // check diff, if we had a value on 1:1 before and now it changed (nulled or replaced), we need to trigger orphan removal)
    const data = this.originalEntityData[changeSet.entity.__uuid] as EntityData<T>;
    const em = changeSet.entity.__em;

    if (prop.orphanRemoval && data && data[prop.name] && prop.name in changeSet.payload && em) {
      const orphan = em.getReference(prop.type, data[prop.name] as Primary<T>);
      em.getUnitOfWork().scheduleOrphanRemoval(orphan);
    }
  }

}
