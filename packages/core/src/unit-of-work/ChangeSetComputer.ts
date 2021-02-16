import { Configuration, Utils } from '../utils';
import { MetadataStorage } from '../metadata';
import { AnyEntity, EntityData, EntityProperty } from '../typings';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { Collection, EntityIdentifier, EntityValidator } from '../entity';
import { Platform } from '../platforms';
import { ReferenceType } from '../enums';
import { EntityComparator } from '../utils/EntityComparator';

export class ChangeSetComputer {

  private readonly comparator = new EntityComparator(this.metadata, this.platform);

  constructor(private readonly validator: EntityValidator,
              private readonly collectionUpdates: Set<Collection<AnyEntity>>,
              private readonly removeStack: Set<AnyEntity>,
              private readonly metadata: MetadataStorage,
              private readonly platform: Platform,
              private readonly config: Configuration) { }

  computeChangeSet<T extends AnyEntity<T>>(entity: T): ChangeSet<T> | null {
    const meta = this.metadata.find(entity.constructor.name)!;

    if (meta.readonly) {
      return null;
    }

    const type = entity.__helper!.__originalEntityData ? ChangeSetType.UPDATE : ChangeSetType.CREATE;
    const changeSet = new ChangeSet(entity, type, this.computePayload(entity), meta);

    if (changeSet.type === ChangeSetType.UPDATE) {
      changeSet.originalEntity = entity.__helper!.__originalEntityData;
    }

    if (this.config.get('validate')) {
      this.validator.validate<T>(changeSet.entity, changeSet.payload, meta);
    }

    for (const prop of meta.relations) {
      this.processProperty(changeSet, prop);
    }

    if (changeSet.type === ChangeSetType.UPDATE && !Utils.hasObjectKeys(changeSet.payload)) {
      return null;
    }

    return changeSet;
  }

  private computePayload<T extends AnyEntity<T>>(entity: T): EntityData<T> {
    const data = this.comparator.prepareEntity(entity);
    const entityName = entity.__meta!.root.className;
    const originalEntityData = entity.__helper!.__originalEntityData;

    if (originalEntityData) {
      const comparator = this.comparator.getEntityComparator(entityName);
      return comparator(originalEntityData, data);
    }

    return data;
  }

  private processProperty<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, prop: EntityProperty<T>): void {
    const target = changeSet.entity[prop.name];

    if (Utils.isCollection(target)) { // m:n or 1:m
      this.processToMany(prop, changeSet);
    } else if (prop.reference !== ReferenceType.SCALAR && target) { // m:1 or 1:1
      this.processToOne(prop, changeSet);
    }
  }

  private processToOne<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const entity = changeSet.entity[prop.name] as unknown as T;
    const isToOneOwner = prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);

    if (isToOneOwner && !entity.__helper!.hasPrimaryKey()) {
      entity.__helper!.__identifier = entity.__helper!.__identifier ?? new EntityIdentifier();
      changeSet.payload[prop.name] = entity.__helper!.__identifier;
    }
  }

  private processToMany<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const target = changeSet.entity[prop.name] as unknown as Collection<any>;

    // remove items from collection based on removeStack
    if (target.isInitialized() && this.removeStack.size > 0) {
      target.getItems()
        .filter(item => this.removeStack.has(item))
        .forEach(item => target.remove(item));
    }

    if (!target.isDirty()) {
      return;
    }

    if (prop.owner || target.getItems(false).filter(item => !item.__helper!.__initialized).length > 0) {
      this.collectionUpdates.add(target);
    } else {
      target.setDirty(false); // inverse side with only populated items, nothing to persist
    }
  }

}
