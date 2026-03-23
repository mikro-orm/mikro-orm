import { Utils } from '../utils/Utils.js';
import { QueryHelper } from '../utils/QueryHelper.js';
import { type Configuration } from '../utils/Configuration.js';
import { type EntityComparator } from '../utils/EntityComparator.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { AnyEntity, EntityData, EntityKey, EntityProperty, EntityValue } from '../typings.js';
import { ChangeSet, ChangeSetType } from './ChangeSet.js';
import { helper } from '../entity/wrap.js';
import { validateEntity } from '../entity/validators.js';
import { Reference } from '../entity/Reference.js';
import { PolymorphicRef } from '../entity/PolymorphicRef.js';
import { type Collection } from '../entity/Collection.js';
import type { Platform } from '../platforms/Platform.js';
import { ReferenceKind } from '../enums.js';
import { isRaw } from '../utils/RawQueryFragment.js';
import type { EntityManager } from '../EntityManager.js';

/** @internal Computes change sets by comparing entity state against original snapshots. */
export class ChangeSetComputer {
  readonly #comparator: EntityComparator;
  readonly #metadata: MetadataStorage;
  readonly #platform: Platform;
  readonly #config: Configuration;

  readonly #em: EntityManager;
  readonly #collectionUpdates: Set<Collection<AnyEntity>>;

  constructor(em: EntityManager, collectionUpdates: Set<Collection<AnyEntity>>) {
    this.#em = em;
    this.#collectionUpdates = collectionUpdates;
    this.#config = this.#em.config;
    this.#metadata = this.#em.getMetadata();
    this.#platform = this.#em.getPlatform();
    this.#comparator = this.#config.getComparator(this.#metadata);
  }

  /** Computes a change set for the given entity by diffing against its original state. */
  computeChangeSet<T extends object>(entity: T): ChangeSet<T> | null {
    const meta = this.#metadata.get((entity as AnyEntity).constructor);

    if (meta.readonly) {
      return null;
    }

    const wrapped = helper(entity);
    const type = wrapped.__originalEntityData ? ChangeSetType.UPDATE : ChangeSetType.CREATE;
    const map = new Map<T, [EntityKey<T>, unknown][]>();

    // Execute `onCreate` and `onUpdate` on properties recursively, saves `onUpdate` results
    // to the `map` as we want to apply those only if something else changed.
    if (type === ChangeSetType.CREATE) {
      // run update hooks only after we know there are other changes
      for (const prop of meta.hydrateProps) {
        this.processPropertyInitializers(entity, prop, type, map);
      }
    }

    if (type === ChangeSetType.UPDATE && !wrapped.__initialized) {
      const data = this.#comparator.prepareEntity(entity);

      if (meta.root.discriminatorColumn) {
        delete data[meta.root.discriminatorColumn as EntityKey<T>];
      }

      if (Utils.equals(data, wrapped.__originalEntityData)) {
        return null;
      }
    }

    const changeSet = new ChangeSet(entity, type, this.computePayload(entity), meta);
    changeSet.originalEntity = wrapped.__originalEntityData;

    for (const prop of meta.relations.filter(prop => prop.persist !== false || prop.userDefined === false)) {
      this.processProperty(changeSet, prop);
    }

    if (changeSet.type === ChangeSetType.UPDATE && !Utils.hasObjectKeys(changeSet.payload)) {
      return null;
    }

    validateEntity(changeSet.entity, meta);

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
  private processPropertyInitializers<T>(
    entity: T,
    prop: EntityProperty<T>,
    type: ChangeSetType,
    map: Map<T, [string, unknown][]>,
    nested?: boolean,
  ): void {
    if (
      prop.onCreate &&
      type === ChangeSetType.CREATE &&
      (entity[prop.name] == null ||
        (Utils.isScalarReference(entity[prop.name]) && (entity[prop.name] as Reference<any>).unwrap() == null))
    ) {
      entity[prop.name] = prop.onCreate(entity, this.#em);
    } else if (
      prop.default != null &&
      !isRaw(prop.default) &&
      ![ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) &&
      type === ChangeSetType.CREATE &&
      entity[prop.name] === undefined
    ) {
      entity[prop.name] = prop.default as EntityValue<T>;
    }

    if (prop.onUpdate && type === ChangeSetType.UPDATE) {
      const pairs = map.get(entity) ?? [];
      pairs.push([prop.name, prop.onUpdate(entity, this.#em)]);
      map.set(entity, pairs);
    }

    if (prop.kind === ReferenceKind.EMBEDDED && entity[prop.name]) {
      const items = prop.array ? (entity[prop.name] as T[]) : [entity[prop.name] as T];

      for (const item of items) {
        for (const embeddedProp of prop.targetMeta!.hydrateProps) {
          this.processPropertyInitializers(item, embeddedProp, type, map, nested || prop.object);
        }
      }
    }
  }

  private computePayload<T extends object>(entity: T, ignoreUndefined = false): EntityData<T> {
    const data = this.#comparator.prepareEntity(entity);
    const wrapped = helper(entity);
    const entityName = wrapped.__meta.class;
    const originalEntityData = wrapped.__originalEntityData;

    if (!wrapped.__initialized) {
      for (const prop of wrapped.__meta.primaryKeys) {
        delete data[prop];
      }

      // strip discriminator column for STI entities — it's always hardcoded
      // in the snapshot generator and not present in __originalEntityData,
      // causing false dirty detection on uninitialized reference proxies
      if (wrapped.__meta.root.discriminatorColumn) {
        delete data[wrapped.__meta.root.discriminatorColumn as EntityKey<T>];
      }

      return data;
    }

    if (originalEntityData) {
      const comparator = this.#comparator.getEntityComparator(entityName);
      const diff = comparator(originalEntityData as T, data as T);

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

    if (Utils.isCollection(target)) {
      // m:n or 1:m
      this.processToMany(prop, changeSet);
    }

    if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
      this.processToOne(prop, changeSet);
    }
  }

  private processToOne<T extends object>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const isToOneOwner =
      prop.kind === ReferenceKind.MANY_TO_ONE || (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner);

    if (!isToOneOwner || prop.mapToPk) {
      return;
    }

    const targets = Utils.unwrapProperty(changeSet.entity, changeSet.meta, prop) as [AnyEntity, number[]][];

    targets.forEach(([rawTarget, idx]) => {
      const target = Reference.unwrapReference(rawTarget);
      const needsProcessing = target != null && (prop.targetKey != null || !target.__helper!.hasPrimaryKey());

      if (needsProcessing) {
        let value = prop.targetKey ? target[prop.targetKey] : target.__helper!.__identifier;

        /* v8 ignore next */
        if (prop.targetKey && prop.targetMeta) {
          const targetProp = prop.targetMeta.properties[prop.targetKey];

          if (targetProp?.customType) {
            value = targetProp.customType.convertToDatabaseValue(value, this.#platform, { mode: 'serialization' });
          }
        }

        if (prop.polymorphic) {
          const discriminator = QueryHelper.findDiscriminatorValue(prop.discriminatorMap!, target.constructor)!;
          Utils.setPayloadProperty<T>(
            changeSet.payload,
            changeSet.meta,
            prop,
            new PolymorphicRef(discriminator, value),
            idx,
          );
        } else {
          Utils.setPayloadProperty<T>(changeSet.payload, changeSet.meta, prop, value, idx);
        }
      }
    });
  }

  private processToMany<T extends object>(prop: EntityProperty<T>, changeSet: ChangeSet<T>): void {
    const target = changeSet.entity[prop.name] as Collection<any>;

    if (!target.isDirty() && changeSet.type !== ChangeSetType.CREATE) {
      return;
    }

    if (target.isDirty()) {
      this.#collectionUpdates.add(target);
    }

    if (prop.owner && !this.#platform.usesPivotTable()) {
      changeSet.payload[prop.name] = target.getItems(false).map((item: AnyEntity) => {
        return item.__helper!.__identifier ?? item.__helper!.getPrimaryKey();
      });
    }
  }
}
