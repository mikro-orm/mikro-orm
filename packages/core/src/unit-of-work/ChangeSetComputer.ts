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
              private readonly removeStack: Set<AnyEntity>,
              private readonly metadata: MetadataStorage,
              private readonly platform: Platform) { }

  computeChangeSet<T extends AnyEntity<T>>(entity: T): ChangeSet<T> | null {
    const changeSet = { entity } as ChangeSet<T>;
    const meta = this.metadata.get(entity.constructor.name);

    changeSet.name = meta.name;
    changeSet.type = this.originalEntityData[wrap(entity, true).__uuid] ? ChangeSetType.UPDATE : ChangeSetType.CREATE;
    changeSet.collection = meta.collection;
    changeSet.payload = this.computePayload(entity);

    if (changeSet.type === ChangeSetType.UPDATE) {
      changeSet.originalEntity = this.originalEntityData[wrap(entity, true).__uuid];
    }

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
    const target = changeSet.entity[prop.name];

    // remove items from collection based on removeStack
    if (Utils.isCollection<T>(target) && target.isInitialized()) {
      target.getItems()
        .filter(item => this.removeStack.has(item))
        .forEach(item => target.remove(item));
    }

    if (Utils.isCollection(target)) { // m:n or 1:m
      this.processToMany(prop, changeSet);
    } else if (prop.reference !== ReferenceType.SCALAR && target) { // m:1 or 1:1
      this.processToOne(prop, changeSet);
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE) {
      this.processOneToOne(prop, changeSet);
    }
  }

  private processToOne<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const pks = this.metadata.get(prop.type).primaryKeys;
    const entity = changeSet.entity[prop.name] as unknown as T;
    const isToOneOwner = prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);

    if (isToOneOwner && pks.length === 1 && !Utils.isDefined(entity[pks[0]], true)) {
      changeSet.payload[prop.name] = this.identifierMap[wrap(entity, true).__uuid];
    }
  }

  private processToMany<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const target = changeSet.entity[prop.name] as unknown as Collection<any>;

    if (!target.isDirty()) {
      return;
    }

    if (prop.owner || target.getItems(false).filter(item => !wrap(item).isInitialized()).length > 0) {
      this.collectionUpdates.push(target);
    } else {
      target.setDirty(false); // inverse side with only populated items, nothing to persist
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
