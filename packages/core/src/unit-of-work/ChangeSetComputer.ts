import type { Configuration } from '../utils';
import { Utils } from '../utils';
import type { MetadataStorage } from '../metadata';
import type { AnyEntity, EntityData, EntityProperty } from '../typings';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import type { Collection, EntityValidator } from '../entity';
import type { Platform } from '../platforms';
import { ReferenceType } from '../enums';
import { EntityComparator } from '../utils/EntityComparator';

export class ChangeSetComputer {


  constructor(private readonly validator: EntityValidator,
              private readonly collectionUpdates: Set<Collection<AnyEntity>>,
              private readonly removeStack: Set<AnyEntity>,
              private readonly metadata: MetadataStorage,
              private readonly platform: Platform,
              private readonly config: Configuration,
              private readonly comparator = config.getComparator(metadata)) { }

  computeChangeSet<T extends AnyEntity<T>>(entity: T): ChangeSet<T> | null {
    const meta = this.metadata.get(entity.constructor.name);

    if (meta.readonly) {
      return null;
    }

    const type = entity.__helper!.__originalEntityData ? ChangeSetType.UPDATE : ChangeSetType.CREATE;
    const map = new Map();

    // Execute `onCreate` and `onUpdate` on properties recursively, saves `onUpdate` results
    // to the `map` as we want to apply those only if something else changed.
    for (const prop of meta.hydrateProps) {
      this.processPropertyInitializers(entity, prop, type, map);
    }

    const changeSet = new ChangeSet(entity, type, this.computePayload(entity), meta);
    changeSet.originalEntity = entity.__helper!.__originalEntityData;

    if (this.config.get('validate')) {
      this.validator.validate<T>(changeSet.entity, changeSet.payload, meta);
    }

    for (const prop of meta.relations) {
      this.processProperty(changeSet, prop);
    }

    if (changeSet.type === ChangeSetType.UPDATE && !Utils.hasObjectKeys(changeSet.payload)) {
      return null;
    }

    if (map.size > 0) {
      for (const [entity, [prop, value]] of map) {
        entity[prop] = value;
      }

      // Recompute the changeset, we need to merge this as here we ignore relations.
      const diff = this.computePayload(entity);
      Utils.merge(changeSet.payload, diff);
    }

    return changeSet;
  }

  /**
   * Traverses entity graph and executes `onCreate` and `onUpdate` methods, assigning the values to given properties.
   */
  private processPropertyInitializers<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>, type: ChangeSetType, map: Map<T, unknown>, nested?: boolean): void {
    if (prop.onCreate && type === ChangeSetType.CREATE && entity[prop.name] == null) {
      entity[prop.name] = prop.onCreate(entity);
    }

    if (prop.onUpdate && type === ChangeSetType.UPDATE) {
      map.set(entity, [prop.name, prop.onUpdate(entity)]);
    }

    if (prop.reference === ReferenceType.EMBEDDED && entity[prop.name]) {
      for (const embeddedProp of prop.targetMeta!.hydrateProps) {
        this.processPropertyInitializers(entity[prop.name], embeddedProp, type, map, nested || prop.object);
      }
    }
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

  private processProperty<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, prop: EntityProperty<T>, target?: unknown): void {
    if (!target) {
      const targets = Utils.unwrapProperty(changeSet.entity, changeSet.entity.__meta!, prop);
      targets.forEach(([t]) => this.processProperty(changeSet, prop, t));
      return;
    }

    if (Utils.isCollection(target)) { // m:n or 1:m
      this.processToMany(prop, changeSet);
    }

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
      this.processToOne(prop, changeSet);
    }
  }

  private processToOne<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const isToOneOwner = prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);

    if (!isToOneOwner || prop.mapToPk) {
      return;
    }

    const targets = Utils.unwrapProperty(changeSet.entity, changeSet.entity.__meta!, prop) as [AnyEntity, number[]][];

    targets.forEach(([target, idx]) => {
      if (!target.__helper!.hasPrimaryKey()) {
        Utils.setPayloadProperty<T>(changeSet.payload, this.metadata.find(changeSet.name)!, prop, target.__helper!.__identifier, idx);
      }
    });
  }

  private processToMany<T extends AnyEntity<T>>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const target = changeSet.entity[prop.name] as unknown as Collection<any>;

    // remove items from collection based on removeStack
    if (target.isInitialized() && this.removeStack.size > 0) {
      target.getItems(false)
        .filter(item => this.removeStack.has(item))
        .forEach(item => target.remove(item));
    }

    if (!target.isDirty()) {
      return;
    }

    if (prop.owner || target.getItems(false).filter(item => !item.__helper!.__initialized).length > 0) {
      if (this.platform.usesPivotTable()) {
        this.collectionUpdates.add(target);
      } else {
        changeSet.payload[prop.name] = target.getItems(false).map((item: AnyEntity) => item.__helper!.__identifier ?? item.__helper!.getPrimaryKey());
      }
    } else {
      target.setDirty(false); // inverse side with only populated items, nothing to persist
    }
  }

}
