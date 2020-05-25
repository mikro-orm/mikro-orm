import { Utils } from '../utils';
import { MetadataStorage } from '../metadata';
import { AnyEntity, Dictionary, EntityData, EntityProperty, Primary } from '../typings';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { Collection, EntityIdentifier, EntityValidator, ReferenceType, wrap } from '../entity';
import { Platform } from '../platforms';

export class ChangeSetComputer {

  constructor(private readonly validator: EntityValidator,
              private readonly originalEntityData: Dictionary<EntityData<AnyEntity>>,
              private readonly identifierMap: Dictionary<EntityIdentifier>,
              private readonly collectionUpdates: Collection<AnyEntity>[],
              private readonly removeStack: AnyEntity[],
              private readonly metadata: MetadataStorage,
              private readonly platform: Platform) { }

  computeChangeSet<T extends AnyEntity<T>>(entity: T): ChangeSet<T> | null {
    const changeSet = { entity } as ChangeSet<T>;
    const meta = this.metadata.get(entity.constructor.name);

    changeSet.name = meta.name;
    changeSet.type = this.originalEntityData[wrap(entity, true).__uuid] ? ChangeSetType.UPDATE : ChangeSetType.CREATE;
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
    const wrapped = wrap(entity, true);

    if (this.originalEntityData[wrapped.__uuid]) {
      return Utils.diffEntities<T>(this.originalEntityData[wrapped.__uuid] as T, entity, this.metadata, this.platform);
    }

    return Utils.prepareEntity(entity, this.metadata, this.platform);
  }

  private processReference<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, prop: EntityProperty<T>): void {
    const isToOneOwner = prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference) && (changeSet.entity[prop.name] as unknown as Collection<T>).isInitialized()) {
      const collection = changeSet.entity[prop.name] as unknown as Collection<AnyEntity>;
      collection.getItems()
        .filter(item => this.removeStack.includes(item))
        .forEach(item => collection.remove(item));
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner && (changeSet.entity[prop.name] as unknown as Collection<T>).isDirty()) {
      this.collectionUpdates.push(changeSet.entity[prop.name] as unknown as Collection<AnyEntity>);
    } else if (isToOneOwner && changeSet.entity[prop.name]) {
      this.processManyToOne(prop, changeSet);
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE) {
      this.processOneToOne(prop, changeSet);
    }
  }

  private processManyToOne<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const pks = this.metadata.get(prop.type).primaryKeys;
    const entity = changeSet.entity[prop.name] as unknown as T;

    if (pks.length === 1 && !Utils.isDefined(entity[pks[0]], true)) {
      changeSet.payload[prop.name] = this.identifierMap[wrap(entity, true).__uuid];
    }
  }

  private processOneToOne<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    // check diff, if we had a value on 1:1 before and now it changed (nulled or replaced), we need to trigger orphan removal
    const wrapped = wrap(changeSet.entity, true);
    const data = this.originalEntityData[wrapped.__uuid] as EntityData<T>;
    const em = wrapped.__em;

    if (prop.orphanRemoval && data && data[prop.name] && prop.name in changeSet.payload && em) {
      const orphan = em.getReference(prop.type, data[prop.name] as Primary<T>);
      em.getUnitOfWork().scheduleOrphanRemoval(orphan);
    }
  }

}
