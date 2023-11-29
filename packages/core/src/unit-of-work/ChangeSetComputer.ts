import { Utils, type Configuration, type EntityComparator } from '../utils';
import type { MetadataStorage } from '../metadata';
import type { AnyEntity, EntityData, EntityKey, EntityProperty, EntityValue } from '../typings';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { helper, type Collection, type EntityValidator } from '../entity';
import type { Platform } from '../platforms';
import { ReferenceKind } from '../enums';

export class ChangeSetComputer {

  private readonly comparator: EntityComparator;

  constructor(private readonly validator: EntityValidator,
              private readonly collectionUpdates: Set<Collection<AnyEntity>>,
              private readonly metadata: MetadataStorage,
              private readonly platform: Platform,
              private readonly config: Configuration) {
    this.comparator = this.config.getComparator(this.metadata);
  }

  computeChangeSet<T extends object>(entity: T): ChangeSet<T> | null {
    const meta = this.metadata.get((entity as AnyEntity).constructor.name);

    if (meta.readonly) {
      return null;
    }

    const wrapped = helper(entity);
    const type = wrapped.__originalEntityData ? ChangeSetType.UPDATE : ChangeSetType.CREATE;
    const map = new Map<T, [EntityKey<T>, unknown][]>();

    // Execute `onCreate` and `onUpdate` on properties recursively, saves `onUpdate` results
    // to the `map` as we want to apply those only if something else changed.
    if (type === ChangeSetType.CREATE) { // run update hooks only after we know there are other changes
      for (const prop of meta.hydrateProps) {
        this.processPropertyInitializers(entity, prop, type, map);
      }
    }

    if (type === ChangeSetType.UPDATE && !wrapped.__initialized && !wrapped.isTouched()) {
      return null;
    }

    const changeSet = new ChangeSet(entity, type, this.computePayload(entity), meta);
    changeSet.originalEntity = wrapped.__originalEntityData;

    if (this.config.get('validate')) {
      this.validator.validate(changeSet.entity, changeSet.payload, meta);
    }

    for (const prop of meta.relations.filter(prop => prop.persist !== false || prop.userDefined === false)) {
      this.processProperty(changeSet, prop);
    }

    if (changeSet.type === ChangeSetType.UPDATE && !Utils.hasObjectKeys(changeSet.payload)) {
      return null;
    }

    // Execute `onCreate` and `onUpdate` on properties recursively, saves `onUpdate` results
    // to the `map` as we want to apply those only if something else changed.
    if (type === ChangeSetType.UPDATE) {
      for (const prop of meta.hydrateProps) {
        this.processPropertyInitializers(entity, prop, type, map);
      }
    }

    if (map.size > 0) {
      for (const [entity, pairs] of map) {
        for (const [prop, value] of pairs) {
          entity[prop] = value as EntityValue<T>;
        }
      }

      // Recompute the changeset, we need to merge this as here we ignore relations.
      const diff = this.computePayload(entity, true);
      Utils.merge(changeSet.payload, diff);
    }

    return changeSet;
  }

  /**
   * Traverses entity graph and executes `onCreate` and `onUpdate` methods, assigning the values to given properties.
   */
  private processPropertyInitializers<T>(entity: T, prop: EntityProperty<T>, type: ChangeSetType, map: Map<T, [string, unknown][]>, nested?: boolean): void {
    if (prop.onCreate && type === ChangeSetType.CREATE && entity[prop.name] == null) {
      entity[prop.name] = prop.onCreate(entity);
    }

    if (prop.onUpdate && type === ChangeSetType.UPDATE) {
      const pairs = map.get(entity) ?? [];
      pairs.push([prop.name, prop.onUpdate(entity)]);
      map.set(entity, pairs);
    }

    if (prop.kind === ReferenceKind.EMBEDDED && entity[prop.name]) {
      for (const embeddedProp of prop.targetMeta!.hydrateProps) {
        this.processPropertyInitializers(entity[prop.name] as T, embeddedProp, type, map, nested || prop.object);
      }
    }
  }

  private computePayload<T extends object>(entity: T, ignoreUndefined = false): EntityData<T> {
    const data = this.comparator.prepareEntity(entity);
    const entityName = helper(entity).__meta.className;
    const originalEntityData = helper(entity).__originalEntityData;

    if (originalEntityData) {
      const comparator = this.comparator.getEntityComparator(entityName);
      const diff = comparator(originalEntityData, data);

      if (ignoreUndefined) {
        Utils.keys(diff)
          .filter(k => diff[k] === undefined)
          .forEach(k => delete diff[k]);
      }

      return diff;
    }

    return data;
  }

  private processProperty<T extends object>(changeSet: ChangeSet<T>, prop: EntityProperty<T>, target?: unknown): void {
    if (!target) {
      const targets = Utils.unwrapProperty(changeSet.entity, changeSet.meta, prop);
      targets.forEach(([t]) => this.processProperty(changeSet, prop, t));

      return;
    }

    if (Utils.isCollection(target)) { // m:n or 1:m
      this.processToMany(prop, changeSet);
    }

    if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
      this.processToOne(prop, changeSet);
    }
  }

  private processToOne<T extends object>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const isToOneOwner = prop.kind === ReferenceKind.MANY_TO_ONE || (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner);

    if (!isToOneOwner || prop.mapToPk) {
      return;
    }

    const targets = Utils.unwrapProperty(changeSet.entity, changeSet.meta, prop) as [AnyEntity, number[]][];

    targets.forEach(([target, idx]) => {
      if (!target.__helper!.hasPrimaryKey()) {
        Utils.setPayloadProperty<T>(changeSet.payload, this.metadata.find(changeSet.name)!, prop, target.__helper!.__identifier, idx);
      }
    });
  }

  private processToMany<T extends object>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const target = changeSet.entity[prop.name] as Collection<any>;

    if (!target.isDirty()) {
      return;
    }

    if (prop.owner || target.getItems(false).filter(item => !item.__helper!.__initialized).length > 0) {
      if (this.platform.usesPivotTable()) {
        this.collectionUpdates.add(target);
      } else {
        changeSet.payload[prop.name] = target.getItems(false).map((item: AnyEntity) => item.__helper!.__identifier ?? item.__helper!.getPrimaryKey());
      }
    } else if (prop.kind === ReferenceKind.ONE_TO_MANY && target.getSnapshot() === undefined) {
      this.collectionUpdates.add(target);
    } else if (prop.kind === ReferenceKind.MANY_TO_MANY && !prop.owner) {
      this.collectionUpdates.add(target);
    }
  }

}
