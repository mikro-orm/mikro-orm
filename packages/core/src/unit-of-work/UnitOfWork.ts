import { AsyncLocalStorage } from 'async_hooks';
import type {
  AnyEntity,
  Dictionary,
  EntityData,
  EntityKey,
  EntityMetadata,
  EntityProperty,
  EntityValue,
  FilterQuery,
  IPrimaryKeyValue,
  Primary,
} from '../typings';
import { Collection, EntityHelper, EntityIdentifier, helper, Reference } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { ChangeSetComputer } from './ChangeSetComputer';
import { ChangeSetPersister } from './ChangeSetPersister';
import { CommitOrderCalculator } from './CommitOrderCalculator';
import { Utils } from '../utils/Utils';
import type { EntityManager } from '../EntityManager';
import { Cascade, EventType, LockMode, ReferenceKind } from '../enums';
import { OptimisticLockError, ValidationError } from '../errors';
import type { Transaction } from '../connections';
import { type EventManager, TransactionEventBroadcaster } from '../events';
import { IdentityMap } from './IdentityMap';
import type { LockOptions } from '../drivers/IDatabaseDriver';
import type { EntityComparator, MetadataStorage, Platform } from '@mikro-orm/core';

// to deal with validation for flush inside flush hooks and `Promise.all`
const insideFlush = new AsyncLocalStorage<boolean>();

export class UnitOfWork {

  /** map of references to managed entities */
  private readonly identityMap = new IdentityMap();

  private readonly persistStack = new Set<AnyEntity>();
  private readonly removeStack = new Set<AnyEntity>();
  private readonly orphanRemoveStack = new Set<AnyEntity>();
  private readonly changeSets = new Map<AnyEntity, ChangeSet<any>>();
  private readonly collectionUpdates = new Set<Collection<AnyEntity>>();
  private readonly extraUpdates = new Set<[AnyEntity, string | string[], AnyEntity | AnyEntity[] | Reference<any> | Collection<any>, ChangeSet<any> | undefined]>();
  private readonly metadata: MetadataStorage;
  private readonly platform: Platform;
  private readonly eventManager: EventManager;
  private readonly comparator: EntityComparator;
  private readonly changeSetComputer: ChangeSetComputer;
  private readonly changeSetPersister: ChangeSetPersister;
  private readonly queuedActions = new Set<string>();
  private readonly loadedEntities = new Set<AnyEntity>();
  private readonly flushQueue: (() => Promise<void>)[] = [];
  private working = false;

  constructor(private readonly em: EntityManager) {
    this.metadata = this.em.getMetadata();
    this.platform = this.em.getPlatform();
    this.eventManager = this.em.getEventManager();
    this.comparator = this.em.getComparator();
    this.changeSetComputer = new ChangeSetComputer(this.em.getValidator(), this.collectionUpdates, this.metadata, this.platform, this.em.config);
    this.changeSetPersister = new ChangeSetPersister(this.em.getDriver(), this.metadata, this.em.config.getHydrator(this.metadata), this.em.getEntityFactory(), this.em.getValidator(), this.em.config);
  }

  merge<T extends object>(entity: T, visited?: Set<AnyEntity>): void {
    const wrapped = helper(entity);
    wrapped.__em = this.em;

    if (!wrapped.hasPrimaryKey()) {
      return;
    }

    // skip new entities that could be linked from already persisted entity
    // that is being re-fetched (but allow calling `merge(e)` explicitly for those)
    if (!wrapped.__managed && visited) {
      return;
    }

    this.identityMap.store(entity);

    // if visited is available, we are cascading, and need to be careful when resetting the entity data
    // as there can be some entity with already changed state that is not yet flushed
    if (wrapped.__initialized && (!visited || !wrapped.__originalEntityData)) {
      wrapped.__originalEntityData = this.comparator.prepareEntity(entity);
      wrapped.__touched = false;
    }

    this.cascade(entity, Cascade.MERGE, visited ?? new Set<AnyEntity>());
  }

  /**
   * @internal
   */
  register<T extends object>(entity: T, data?: EntityData<T>, options?: RegisterOptions): T {
    this.identityMap.store(entity);
    EntityHelper.ensurePropagation(entity);

    if (options?.newEntity) {
      return entity;
    }

    const wrapped = helper(entity);

    if (options?.loaded && wrapped.__initialized && !wrapped.__onLoadFired) {
      this.loadedEntities.add(entity as AnyEntity);
    }

    wrapped.__em ??= this.em;
    wrapped.__managed = true;

    if (data && (options?.refresh || !wrapped.__originalEntityData)) {
      Object.keys(data).forEach(key => wrapped.__loadedProperties.add(key));

      wrapped.__meta.relations.forEach(prop => {
        if (Utils.isPlainObject(data[prop.name])) {
          data[prop.name] = Utils.getPrimaryKeyValues(data[prop.name], prop.targetMeta!.primaryKeys, true);
        }
      });

      wrapped.__meta.props.forEach(prop => {
        if (prop.kind === ReferenceKind.EMBEDDED && !prop.object && Utils.isPlainObject(data[prop.name])) {
          prop.targetMeta?.props.forEach(p => {
            const prefix = prop.prefix === false ? '' : prop.prefix === true ? prop.name + '_' : prop.prefix;
            data[prefix + p.name as EntityKey] = data[prop.name as EntityKey][p.name];
          });
          data[prop.name] = Utils.getPrimaryKeyValues(data[prop.name], prop.targetMeta!.primaryKeys, true);
        }
      });

      if (this.em.config.get('forceUndefined')) {
        Utils.keys(data).forEach(key => {
          if (data[key] === null) {
            data[key] = undefined;
          }
        });
      }

      wrapped.__originalEntityData = data;
      wrapped.__touched = false;
    }

    return entity;
  }

  /**
   * @internal
   */
  async dispatchOnLoadEvent(): Promise<void> {
    for (const entity of this.loadedEntities) {
      if (this.eventManager.hasListeners(EventType.onLoad, entity.__meta)) {
        await this.eventManager.dispatchEvent(EventType.onLoad, { entity, meta: entity.__meta, em: this.em });
        helper(entity).__onLoadFired = true;
      }
    }

    this.loadedEntities.clear();
  }

  /**
   * Returns entity from the identity map. For composite keys, you need to pass an array of PKs in the same order as they are defined in `meta.primaryKeys`.
   */
  getById<T extends object>(entityName: string, id: Primary<T> | Primary<T>[], schema?: string): T | undefined {
    if (id == null || (Array.isArray(id) && id.length === 0)) {
      return undefined;
    }

    const meta = this.metadata.find(entityName)!.root;
    let hash: string;

    if (meta.simplePK) {
      hash = '' + id;
    } else {
      const keys = Array.isArray(id) ? Utils.flatten(id as string[][]) : [id as string];
      hash = Utils.getPrimaryKeyHash(keys);
    }

    schema ??= meta.schema ?? this.em.config.get('schema');

    if (schema) {
      hash = `${schema}:${hash}`;
    }

    return this.identityMap.getByHash(meta, hash);
  }

  tryGetById<T extends object>(entityName: string, where: FilterQuery<T>, schema?: string, strict = true): T | null {
    const pk = Utils.extractPK(where, this.metadata.find<T>(entityName)!, strict);

    if (!pk) {
      return null;
    }

    return this.getById<T>(entityName, pk as Primary<T>, schema)!;
  }

  /**
   * Returns map of all managed entities.
   */
  getIdentityMap(): IdentityMap {
    return this.identityMap;
  }

  /**
   * Returns stored snapshot of entity state that is used for change set computation.
   */
  getOriginalEntityData<T extends object>(entity: T): EntityData<T> | undefined {
    return helper(entity as T).__originalEntityData;
  }

  getPersistStack(): Set<AnyEntity> {
    return this.persistStack;
  }

  getRemoveStack(): Set<AnyEntity> {
    return this.removeStack;
  }

  getChangeSets(): ChangeSet<AnyEntity>[] {
    return [...this.changeSets.values()];
  }

  getCollectionUpdates(): Collection<AnyEntity>[] {
    return [...this.collectionUpdates];
  }

  getExtraUpdates(): Set<[AnyEntity, string | string[], (AnyEntity | AnyEntity[] | Reference<any> | Collection<any>), ChangeSet<any> | undefined]> {
    return this.extraUpdates;
  }

  shouldAutoFlush<T extends object>(meta: EntityMetadata<T>): boolean {
    if (insideFlush.getStore()) {
      return false;
    }

    if (this.queuedActions.has(meta.className) || this.queuedActions.has(meta.root.className)) {
      return true;
    }

    for (const entity of this.identityMap.getStore(meta).values()) {
      if (helper(entity).__initialized && helper(entity).isTouched()) {
        return true;
      }
    }

    return false;
  }

  clearActionsQueue(): void {
    this.queuedActions.clear();
  }

  computeChangeSet<T extends object>(entity: T, type?: ChangeSetType): void {
    const wrapped = helper(entity);

    if (type) {
      this.changeSets.set(entity, new ChangeSet(entity, type, {}, wrapped.__meta));
      return;
    }

    const cs = this.changeSetComputer.computeChangeSet(entity);

    if (!cs || this.checkUniqueProps(cs)) {
      return;
    }

    this.initIdentifier(entity);
    this.changeSets.set(entity, cs);
    this.persistStack.delete(entity);
    wrapped.__originalEntityData = this.comparator.prepareEntity(entity);
    wrapped.__touched = false;
  }

  recomputeSingleChangeSet<T extends object>(entity: T): void {
    const changeSet = this.changeSets.get(entity);

    if (!changeSet) {
      return;
    }

    const cs = this.changeSetComputer.computeChangeSet(entity);

    /* istanbul ignore else */
    if (cs && !this.checkUniqueProps(cs)) {
      Object.assign(changeSet.payload, cs.payload);
      helper(entity).__originalEntityData = this.comparator.prepareEntity(entity);
      helper(entity).__touched = false;
    }
  }

  persist<T extends object>(entity: T, visited?: Set<AnyEntity>, options: { checkRemoveStack?: boolean; cascade?: boolean } = {}): void {
    EntityHelper.ensurePropagation(entity);

    if (options.checkRemoveStack && this.removeStack.has(entity)) {
      return;
    }

    const wrapped = helper(entity);
    this.persistStack.add(entity);
    this.queuedActions.add(wrapped.__meta.className);
    this.removeStack.delete(entity);

    if (!wrapped.__managed && wrapped.hasPrimaryKey()) {
      this.identityMap.store(entity);
    }

    if (options.cascade ?? true) {
      this.cascade(entity, Cascade.PERSIST, visited, options);
    }
  }

  remove<T extends object>(entity: T, visited?: Set<AnyEntity>, options: { cascade?: boolean } = {}): void {
    if (helper(entity).__managed) {
      this.removeStack.add(entity);
      this.queuedActions.add(helper(entity).__meta.className);
    } else {
      this.persistStack.delete(entity);
      this.identityMap.delete(entity);
    }

    // remove from referencing relations that are nullable
    for (const prop of helper(entity).__meta.bidirectionalRelations) {
      const inverseProp = prop.mappedBy || prop.inversedBy;
      const relation = Reference.unwrapReference(entity[prop.name] as T);
      const prop2 = prop.targetMeta!.properties[inverseProp];

      if (prop.kind === ReferenceKind.ONE_TO_MANY && prop2.nullable && Utils.isCollection<AnyEntity>(relation)) {
        relation.getItems(false).forEach(item => delete item[inverseProp]);
        continue;
      }

      const target = relation && relation[inverseProp as keyof typeof relation] as unknown;

      if (relation && Utils.isCollection(target)) {
        target.removeWithoutPropagation(entity);
      }
    }

    if (options.cascade ?? true) {
      this.cascade(entity, Cascade.REMOVE, visited);
    }
  }

  async commit(): Promise<void> {
    if (this.working) {
      if (insideFlush.getStore()) {
        throw ValidationError.cannotCommit();
      }

      return new Promise<void>((resolve, reject) => {
        this.flushQueue.push(() => {
          return insideFlush.run(true, () => {
            return this.doCommit().then(resolve, reject);
          });
        });
      });
    }

    try {
      this.working = true;
      await insideFlush.run(true, () => this.doCommit());

      while (this.flushQueue.length) {
        await this.flushQueue.shift()!();
      }
    } finally {
      this.postCommitCleanup();
      this.working = false;
    }
  }

  private async doCommit(): Promise<void> {
    const oldTx = this.em.getTransactionContext();

    try {
      await this.eventManager.dispatchEvent(EventType.beforeFlush, { em: this.em, uow: this });
      this.computeChangeSets();
      this.changeSets.forEach(cs => {
        cs.entity.__helper.__processing = true;
      });
      await this.eventManager.dispatchEvent(EventType.onFlush, { em: this.em, uow: this });

      // nothing to do, do not start transaction
      if (this.changeSets.size === 0 && this.collectionUpdates.size === 0 && this.extraUpdates.size === 0) {
        return void await this.eventManager.dispatchEvent(EventType.afterFlush, { em: this.em, uow: this });
      }

      const groups = this.getChangeSetGroups();
      const platform = this.em.getPlatform();
      const runInTransaction = !this.em.isInTransaction() && platform.supportsTransactions() && this.em.config.get('implicitTransactions');

      if (runInTransaction) {
        await this.em.getConnection('write').transactional(trx => this.persistToDatabase(groups, trx), {
          ctx: oldTx,
          eventBroadcaster: new TransactionEventBroadcaster(this.em, this),
        });
      } else {
        await this.persistToDatabase(groups, this.em.getTransactionContext());
      }
      this.resetTransaction(oldTx);

      this.changeSets.forEach(cs => {
        cs.entity.__helper.__processing = false;
      });

      await this.eventManager.dispatchEvent(EventType.afterFlush, { em: this.em, uow: this });
    } finally {
      this.resetTransaction(oldTx);
    }
  }

  async lock<T extends object>(entity: T, options: LockOptions): Promise<void> {
    if (!this.getById((entity as Dictionary).constructor.name, helper(entity).__primaryKeys, helper(entity).__schema)) {
      throw ValidationError.entityNotManaged(entity);
    }

    const meta = this.metadata.find<T>((entity as Dictionary).constructor.name)!;

    if (options.lockMode === LockMode.OPTIMISTIC) {
      await this.lockOptimistic(entity, meta, options.lockVersion!);
    } else if (options.lockMode != null) {
      await this.lockPessimistic(entity, options);
    }
  }

  clear(): void {
    this.identityMap.clear();
    this.loadedEntities.clear();
    this.postCommitCleanup();
  }

  unsetIdentity(entity: AnyEntity): void {
    this.identityMap.delete(entity);
    const wrapped = helper(entity);

    // remove references of this entity in all managed entities, otherwise flushing could reinsert the entity
    for (const { meta, prop } of wrapped.__meta.referencingProperties) {
      for (const referrer of this.identityMap.getStore(meta).values()) {
        const rel = Reference.unwrapReference(referrer[prop.name] as object);

        if (Utils.isCollection(rel)) {
          rel.removeWithoutPropagation(entity);
        } else if (rel === entity) {
          delete helper(referrer).__data[prop.name];
        }
      }
    }

    delete wrapped.__identifier;
    delete wrapped.__originalEntityData;
    wrapped.__touched = false;
    wrapped.__managed = false;
  }

  computeChangeSets(): void {
    this.changeSets.clear();
    const visited = new Set<AnyEntity>();

    for (const entity of this.removeStack) {
      this.cascade(entity, Cascade.REMOVE, visited);
    }

    visited.clear();

    for (const entity of this.persistStack) {
      this.cascade(entity, Cascade.PERSIST, visited, { checkRemoveStack: true });
    }

    for (const entity of this.identityMap) {
      if (!this.removeStack.has(entity) && !this.persistStack.has(entity) && !this.orphanRemoveStack.has(entity)) {
        this.persistStack.add(entity);
        this.cascade(entity, Cascade.PERSIST, visited, { checkRemoveStack: true });
      }
    }

    visited.clear();

    for (const entity of this.persistStack) {
      this.findNewEntities(entity, visited);
    }

    for (const entity of this.orphanRemoveStack) {
      if (!helper(entity).__processing) {
        this.removeStack.add(entity);
      }
    }

    // Check insert stack if there are any entities matching something from delete stack. This can happen when recreating entities.
    const inserts: Dictionary<ChangeSet<any>[]> = {};

    for (const cs of this.changeSets.values()) {
      if (cs.type === ChangeSetType.CREATE) {
        inserts[cs.meta.className] ??= [];
        inserts[cs.meta.className].push(cs);
      }
    }

    for (const cs of this.changeSets.values()) {
      if (cs.type === ChangeSetType.UPDATE) {
        this.findEarlyUpdates(cs, inserts[cs.meta.className]);
      }
    }

    for (const entity of this.removeStack) {
      const wrapped = helper(entity);

      /* istanbul ignore next */
      if (wrapped.__processing) {
        continue;
      }

      const deletePkHash = [wrapped.getSerializedPrimaryKey(), ...this.expandUniqueProps(entity)];
      let type = ChangeSetType.DELETE;

      for (const cs of inserts[wrapped.__meta.className] ?? []) {
        if (deletePkHash.some(hash => hash === cs.getSerializedPrimaryKey() || this.expandUniqueProps(cs.entity).find(child => hash === child))) {
          type = ChangeSetType.DELETE_EARLY;
        }
      }

      this.computeChangeSet(entity, type);
    }
  }

  scheduleExtraUpdate<T extends object>(changeSet: ChangeSet<T>, props: EntityProperty<T>[]): void {
    if (props.length === 0) {
      return;
    }

    this.extraUpdates.add([changeSet.entity, props.map(p => p.name), props.map(p => changeSet.entity[p.name]), changeSet]);
    props.forEach(p => delete changeSet.entity[p.name]);
    props.forEach(p => delete changeSet.payload[p.name]);
  }

  scheduleOrphanRemoval(entity?: AnyEntity, visited?: Set<AnyEntity>): void {
    if (entity) {
      this.orphanRemoveStack.add(entity);
      this.queuedActions.add(entity.__meta!.className);
      this.cascade(entity, Cascade.SCHEDULE_ORPHAN_REMOVAL, visited);
    }
  }

  cancelOrphanRemoval(entity: AnyEntity, visited?: Set<AnyEntity>): void {
    this.orphanRemoveStack.delete(entity);
    this.cascade(entity, Cascade.CANCEL_ORPHAN_REMOVAL, visited);
  }

  getOrphanRemoveStack(): Set<AnyEntity> {
    return this.orphanRemoveStack;
  }

  getChangeSetPersister(): ChangeSetPersister {
    return this.changeSetPersister;
  }

  private findNewEntities<T extends object>(entity: T, visited: Set<AnyEntity>, idx = 0, processed = new Set<AnyEntity>()): void {
    if (visited.has(entity)) {
      return;
    }

    visited.add(entity);
    processed.add(entity);
    const wrapped = helper(entity);

    if (wrapped.__processing || this.removeStack.has(entity) || this.orphanRemoveStack.has(entity)) {
      return;
    }

    // Set entityManager default schema
    wrapped.__schema ??= this.em.schema;
    this.initIdentifier(entity);

    for (const prop of helper(entity).__meta.relations) {
      const targets = Utils.unwrapProperty(entity, helper(entity).__meta, prop);
      targets.forEach(([target]) => {
        const kind = Reference.unwrapReference(target as object);
        this.processReference(entity, prop, kind, visited, processed, idx);
      });
    }

    const changeSet = this.changeSetComputer.computeChangeSet(entity);

    if (changeSet && !this.checkUniqueProps(changeSet)) {
      this.changeSets.set(entity, changeSet);
    }
  }

  /**
   * Returns `true` when the change set should be skipped as it will be empty after the extra update.
   */
  private checkUniqueProps<T extends object>(changeSet: ChangeSet<T>): boolean {
    if (this.platform.allowsUniqueBatchUpdates() || changeSet.type !== ChangeSetType.UPDATE) {
      return false;
    }

    // when changing a unique nullable property (or a 1:1 relation), we can't do it in a single query as it would cause unique constraint violations
    const uniqueProps = changeSet.meta.uniqueProps.filter(prop => prop.nullable && changeSet.payload[prop.name] != null);
    this.scheduleExtraUpdate(changeSet, uniqueProps);

    return changeSet.type === ChangeSetType.UPDATE && !Utils.hasObjectKeys(changeSet.payload);
  }

  private expandUniqueProps<T extends object>(entity: T): string[] {
    const wrapped = helper(entity);

    if (!wrapped.__meta.hasUniqueProps) {
      return [];
    }

    const simpleUniqueHashes = wrapped.__meta.uniqueProps.map(prop => {
      if (entity[prop.name] != null) {
        return prop.kind === ReferenceKind.SCALAR || prop.mapToPk ? entity[prop.name] : helper(entity[prop.name]!).getSerializedPrimaryKey();
      }

      if (wrapped.__originalEntityData?.[prop.name] != null) {
        return Utils.getPrimaryKeyHash(Utils.asArray(wrapped.__originalEntityData![prop.name] as string));
      }

      return undefined;
    }).filter(i => i) as string[];

    const compoundUniqueHashes = wrapped.__meta.uniques.map(unique => {
      const props = Utils.asArray<EntityKey<T>>(unique.properties);

      if (props.every(prop => entity[prop] != null)) {
        return Utils.getPrimaryKeyHash(props.map(p => {
          const prop = wrapped.__meta.properties[p];
          return prop.kind === ReferenceKind.SCALAR || prop.mapToPk ? entity[prop.name] : helper(entity[prop.name as EntityKey]!).getSerializedPrimaryKey();
        }) as any);
      }

      if (props.every(prop => wrapped.__originalEntityData?.[prop] != null)) {
        return Utils.getPrimaryKeyHash(props.map(p => {
          return wrapped.__originalEntityData![p];
        }) as string[]);
      }

      return undefined;
    }).filter(i => i) as string[];

    return simpleUniqueHashes.concat(compoundUniqueHashes);
  }

  private initIdentifier<T extends object>(entity: T): void {
    const wrapped = entity && helper(entity);

    if (!wrapped || wrapped.__identifier || wrapped.hasPrimaryKey()) {
      return;
    }

    const pk = wrapped.__meta.getPrimaryProps()[0];

    if (pk.kind === ReferenceKind.SCALAR) {
      wrapped.__identifier = new EntityIdentifier();
    } else if (entity[pk.name]) {
      this.initIdentifier(entity[pk.name] as object);
      wrapped.__identifier = helper(entity[pk.name] as AnyEntity)?.__identifier;
    }
  }

  private processReference<T extends object>(parent: T, prop: EntityProperty<T>, kind: any, visited: Set<AnyEntity>, processed: Set<AnyEntity>, idx: number): void {
    const isToOne = prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE;

    if (isToOne && Utils.isEntity(kind)) {
      return this.processToOneReference(kind, visited, processed, idx);
    }

    if (Utils.isCollection<any>(kind)) {
      kind.getItems(false)
        .filter(item => !item.__helper!.__originalEntityData)
        .forEach(item => {
          // propagate schema from parent
          item.__helper!.__schema ??= helper(parent).__schema;
        });

      if (prop.kind === ReferenceKind.MANY_TO_MANY && kind.isDirty()) {
        this.processToManyReference(kind, visited, processed, parent, prop);
      }
    }
  }

  private processToOneReference(kind: any, visited: Set<AnyEntity>, processed: Set<AnyEntity>, idx: number): void {
    if (!kind.__helper!.__managed) {
      this.findNewEntities(kind, visited, idx, processed);
    }
  }

  private processToManyReference<T extends object>(collection: Collection<AnyEntity>, visited: Set<AnyEntity>, processed: Set<AnyEntity>, parent: T, prop: EntityProperty<T>): void {
    if (this.isCollectionSelfReferenced(collection, processed)) {
      this.extraUpdates.add([parent, prop.name, collection, undefined]);
      const coll = new Collection<AnyEntity, T>(parent);
      coll.property = prop as EntityProperty<any>;
      parent[prop.name as keyof T] = coll as unknown as T[keyof T];

      return;
    }

    collection.getItems(false)
      .filter(item => !item.__helper!.__originalEntityData)
      .forEach(item => this.findNewEntities(item, visited, 0, processed));
  }

  private async runHooks<T extends object>(type: EventType, changeSet: ChangeSet<T>, sync = false): Promise<void> {
    const meta = changeSet.meta;

    if (!this.eventManager.hasListeners(type, meta)) {
      return;
    }

    if (!sync) {
      await this.eventManager.dispatchEvent(type, { entity: changeSet.entity, meta, em: this.em, changeSet });
      return;
    }

    const copy = this.comparator.prepareEntity(changeSet.entity) as T;
    await this.eventManager.dispatchEvent(type, { entity: changeSet.entity, meta, em: this.em, changeSet });
    const current = this.comparator.prepareEntity(changeSet.entity) as T;
    const diff = this.comparator.diffEntities<T>(changeSet.name, copy, current);
    Object.assign(changeSet.payload, diff);
    const wrapped = helper(changeSet.entity);

    if (wrapped.__identifier && diff[wrapped.__meta.primaryKeys[0]]) {
      wrapped.__identifier.setValue(diff[wrapped.__meta.primaryKeys[0]] as IPrimaryKeyValue);
    }
  }

  private postCommitCleanup(): void {
    this.changeSets.forEach(cs => {
      const wrapped = helper(cs.entity);
      wrapped.__processing = false;
      delete wrapped.__pk;
    });
    this.persistStack.clear();
    this.removeStack.clear();
    this.orphanRemoveStack.clear();
    this.changeSets.clear();
    this.collectionUpdates.clear();
    this.extraUpdates.clear();
    this.queuedActions.clear();
    this.working = false;
  }

  private cascade<T extends object>(entity: T, type: Cascade, visited = new Set<AnyEntity>(), options: { checkRemoveStack?: boolean; cascade?: boolean } = {}): void {
    if (visited.has(entity)) {
      return;
    }

    visited.add(entity);

    switch (type) {
      case Cascade.PERSIST: this.persist(entity, visited, options); break;
      case Cascade.MERGE: this.merge(entity, visited); break;
      case Cascade.REMOVE: this.remove(entity, visited, options); break;
      case Cascade.SCHEDULE_ORPHAN_REMOVAL: this.scheduleOrphanRemoval(entity, visited); break;
      case Cascade.CANCEL_ORPHAN_REMOVAL: this.cancelOrphanRemoval(entity, visited); break;
    }

    for (const prop of helper(entity).__meta.relations) {
      this.cascadeReference<T>(entity, prop, type, visited, options);
    }
  }

  private cascadeReference<T extends object>(entity: T, prop: EntityProperty<T>, type: Cascade, visited: Set<AnyEntity>, options: { checkRemoveStack?: boolean }): void {
    this.fixMissingReference(entity, prop);

    if (!this.shouldCascade(prop, type)) {
      return;
    }

    const kind = Reference.unwrapReference(entity[prop.name] as object) as T | Collection<AnyEntity>;

    if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) && Utils.isEntity(kind)) {
      return this.cascade(kind as T, type, visited, options);
    }

    const collection = kind as Collection<AnyEntity>;

    if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind) && collection) {
      collection
        .getItems(false)
        .forEach(item => this.cascade(item, type, visited, options));
    }
  }

  private isCollectionSelfReferenced(collection: Collection<AnyEntity>, processed: Set<AnyEntity>): boolean {
    const filtered = collection.getItems(false).filter(item => !helper(item).__originalEntityData);
    return filtered.some(items => processed.has(items));
  }

  private shouldCascade(prop: EntityProperty, type: Cascade): boolean {
    if ([Cascade.REMOVE, Cascade.SCHEDULE_ORPHAN_REMOVAL, Cascade.CANCEL_ORPHAN_REMOVAL, Cascade.ALL].includes(type) && prop.orphanRemoval) {
      return true;
    }

    // ignore user settings for merge, it is kept only for back compatibility, this should have never been configurable
    if (type === Cascade.MERGE) {
      return true;
    }

    return prop.cascade && (prop.cascade.includes(type) || prop.cascade.includes(Cascade.ALL));
  }

  private async lockPessimistic<T extends object>(entity: T, options: LockOptions): Promise<void> {
    if (!this.em.isInTransaction()) {
      throw ValidationError.transactionRequired();
    }

    await this.em.getDriver().lockPessimistic(entity, { ctx: this.em.getTransactionContext(), ...options });
  }

  private async lockOptimistic<T extends object>(entity: T, meta: EntityMetadata<T>, version: number | Date): Promise<void> {
    if (!meta.versionProperty) {
      throw OptimisticLockError.notVersioned(meta);
    }

    if (!Utils.isDefined<number | Date>(version)) {
      return;
    }

    const wrapped = helper(entity);

    if (!wrapped.__initialized) {
      await wrapped.init();
    }

    const previousVersion = entity[meta.versionProperty] as unknown as Date | number;

    if (previousVersion !== version) {
      throw OptimisticLockError.lockFailedVersionMismatch(entity, version, previousVersion);
    }
  }

  private fixMissingReference<T extends object>(entity: T, prop: EntityProperty<T>): void {
    const reference = entity[prop.name] as object;
    const kind = Reference.unwrapReference(reference);

    if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) && kind && !prop.mapToPk) {
      if (!Utils.isEntity(kind)) {
        entity[prop.name] = this.em.getReference(prop.type, kind, { wrapped: !!prop.ref }) as EntityValue<T>;
      } else if (!helper(kind).__initialized && !helper(kind).__em) {
        const pk = helper(kind).getPrimaryKey();
        entity[prop.name] = this.em.getReference(prop.type, pk, { wrapped: !!prop.ref }) as EntityValue<T>;
      }
    }

    // perf: set the `Collection._property` to skip the getter, as it can be slow when there is a lot of relations
    if (Utils.isCollection<AnyEntity, T>(kind)) {
      kind.property = prop as EntityProperty<any>;
    }

    const isCollection = [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind);

    if (isCollection && Array.isArray(kind)) {
      const collection = new Collection<AnyEntity>(entity);
      collection.property = prop as EntityProperty;
      entity[prop.name as keyof T] = collection as unknown as T[keyof T];
      collection.set(kind as AnyEntity[]);
    }
  }

  private async persistToDatabase(groups: { [K in ChangeSetType]: Map<string, ChangeSet<any>[]> }, ctx?: Transaction): Promise<void> {
    if (ctx) {
      this.em.setTransactionContext(ctx);
    }

    const commitOrder = this.getCommitOrder();
    const commitOrderReversed = [...commitOrder].reverse();

    // 1. early delete - when we recreate entity in the same UoW, we need to issue those delete queries before inserts
    for (const name of commitOrderReversed) {
      await this.commitDeleteChangeSets(groups[ChangeSetType.DELETE_EARLY].get(name) ?? [], ctx);
    }

    // 2. early update - when we recreate entity in the same UoW, we need to issue those delete queries before inserts
    for (const name of commitOrder) {
      await this.commitUpdateChangeSets(groups[ChangeSetType.UPDATE_EARLY].get(name) ?? [], ctx);
    }

    // 3. create
    for (const name of commitOrder) {
      await this.commitCreateChangeSets(groups[ChangeSetType.CREATE].get(name) ?? [], ctx);
    }

    // 4. update
    for (const name of commitOrder) {
      await this.commitUpdateChangeSets(groups[ChangeSetType.UPDATE].get(name) ?? [], ctx);
    }

    // 5. extra updates
    await this.commitExtraUpdates(ctx);

    // 6. collection updates
    await this.em.getDriver().syncCollections(this.collectionUpdates, { ctx });

    for (const coll of this.collectionUpdates) {
      coll.takeSnapshot();
    }

    // 7. delete - entity deletions need to be in reverse commit order
    for (const name of commitOrderReversed) {
      await this.commitDeleteChangeSets(groups[ChangeSetType.DELETE].get(name) ?? [], ctx);
    }

    // 8. take snapshots of all persisted collections
    const visited = new Set<object>();

    for (const changeSet of this.changeSets.values()) {
      this.takeCollectionSnapshots(changeSet.entity, visited);
    }
  }

  private async commitCreateChangeSets<T extends object>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    if (changeSets.length === 0) {
      return;
    }

    const props = changeSets[0].meta.root.relations.filter(prop => {
      return (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner)
        || prop.kind === ReferenceKind.MANY_TO_ONE
        || (prop.kind === ReferenceKind.MANY_TO_MANY && prop.owner && !this.platform.usesPivotTable());
    });

    for (const changeSet of changeSets) {
      this.findExtraUpdates(changeSet, props);
      await this.runHooks(EventType.beforeCreate, changeSet, true);
    }

    await this.changeSetPersister.executeInserts(changeSets, { ctx });

    for (const changeSet of changeSets) {
      this.register<T>(changeSet.entity, changeSet.payload, { refresh: true });
      await this.runHooks(EventType.afterCreate, changeSet);
    }
  }

  private findExtraUpdates<T extends object>(changeSet: ChangeSet<T>, props: EntityProperty<T>[]): void {
    for (const prop of props) {
      const ref = changeSet.entity[prop.name];

      if (!ref) {
        continue;
      }

      if (Utils.isCollection(ref)) {
        ref.getItems(false).some(item => {
          const cs = this.changeSets.get(Reference.unwrapReference(item));
          const isScheduledForInsert = cs && cs.type === ChangeSetType.CREATE && !cs.persisted;

          if (isScheduledForInsert) {
            this.scheduleExtraUpdate(changeSet, [prop]);
            return true;
          }

          return false;
        });
      }

      const cs = this.changeSets.get(Reference.unwrapReference(ref));
      const isScheduledForInsert = cs && cs.type === ChangeSetType.CREATE && !cs.persisted;

      if (isScheduledForInsert) {
        this.scheduleExtraUpdate(changeSet, [prop]);
      }
    }
  }

  private findEarlyUpdates<T extends object>(changeSet: ChangeSet<T>, inserts: ChangeSet<T>[] = []): void {
    const props = changeSet.meta.uniqueProps;

    for (const prop of props) {
      const insert = inserts.find(c => Utils.equals(c.payload[prop.name], changeSet.originalEntity![prop.name]));
      const propEmpty = changeSet.payload[prop.name] === null || changeSet.payload[prop.name] === undefined;

      if (
        prop.name in changeSet.payload &&
        insert &&
        // We only want to update early if the unique property on the changeset is going to be empty, so that
        // the previous unique value can be set on a different entity without constraint issues
        propEmpty
      ) {
        changeSet.type = ChangeSetType.UPDATE_EARLY;
      }
    }
  }

  private async commitUpdateChangeSets<T extends object>(changeSets: ChangeSet<T>[], ctx?: Transaction, batched = true): Promise<void> {
    if (changeSets.length === 0) {
      return;
    }

    for (const changeSet of changeSets) {
      await this.runHooks(EventType.beforeUpdate, changeSet, true);
    }

    await this.changeSetPersister.executeUpdates(changeSets, batched, { ctx });

    for (const changeSet of changeSets) {
      helper(changeSet.entity).__originalEntityData = this.comparator.prepareEntity(changeSet.entity);
      helper(changeSet.entity).__touched = false;
      helper(changeSet.entity).__initialized = true;
      await this.runHooks(EventType.afterUpdate, changeSet);
    }
  }

  private async commitDeleteChangeSets<T extends object>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    if (changeSets.length === 0) {
      return;
    }

    for (const changeSet of changeSets) {
      await this.runHooks(EventType.beforeDelete, changeSet, true);
    }

    await this.changeSetPersister.executeDeletes(changeSets, { ctx });

    for (const changeSet of changeSets) {
      this.unsetIdentity(changeSet.entity);
      await this.runHooks(EventType.afterDelete, changeSet);
    }
  }

  private async commitExtraUpdates<T extends object>(ctx?: Transaction): Promise<void> {
    const extraUpdates: [ChangeSet<any>, ChangeSet<any> | undefined][] = [];

    for (const extraUpdate of this.extraUpdates) {
      if (Array.isArray(extraUpdate[1])) {
        extraUpdate[1].forEach((p, i) => extraUpdate[0][p] = (extraUpdate[2] as unknown[])[i]);
      } else {
        extraUpdate[0][extraUpdate[1]] = extraUpdate[2];
      }

      const changeSet = this.changeSetComputer.computeChangeSet(extraUpdate[0])!;

      if (changeSet) {
        extraUpdates.push([changeSet, extraUpdate[3]]);
      }
    }

    await this.commitUpdateChangeSets(extraUpdates.map(u => u[0]), ctx, false);

    // propagate the new values to the original changeset
    for (const extraUpdate of extraUpdates) {
      if (extraUpdate[1]) {
        Object.assign(extraUpdate[1].payload, extraUpdate[0].payload);
      }
    }
  }

  /**
   * Orders change sets so FK constrains are maintained, ensures stable order (needed for node < 11)
   */
  private getChangeSetGroups(): { [K in ChangeSetType]: Map<string, ChangeSet<any>[]> } {
    const groups = {
      [ChangeSetType.CREATE]: new Map<string, ChangeSet<any>[]>(),
      [ChangeSetType.UPDATE]: new Map<string, ChangeSet<any>[]>(),
      [ChangeSetType.DELETE]: new Map<string, ChangeSet<any>[]>(),
      [ChangeSetType.UPDATE_EARLY]: new Map<string, ChangeSet<any>[]>(),
      [ChangeSetType.DELETE_EARLY]: new Map<string, ChangeSet<any>[]>(),
    };

    this.changeSets.forEach(cs => {
      const group = groups[cs.type];
      const classGroup = group.get(cs.rootName) ?? [];
      classGroup.push(cs);

      if (!group.has(cs.rootName)) {
        group.set(cs.rootName, classGroup);
      }
    });

    return groups;
  }

  private getCommitOrder(): string[] {
    const calc = new CommitOrderCalculator();
    const set = new Set<string>();
    this.changeSets.forEach(cs => set.add(cs.rootName));
    set.forEach(entityName => calc.addNode(entityName));

    for (const entityName of set) {
      for (const prop of this.metadata.find(entityName)!.props) {
        calc.discoverProperty(prop, entityName);
      }
    }

    return calc.sort();
  }

  private resetTransaction(oldTx: Transaction): void {
    if (oldTx) {
      this.em.setTransactionContext(oldTx);
    } else {
      this.em.resetTransactionContext();
    }
  }

  /**
   * Takes snapshots of all processed collections
   */
  private takeCollectionSnapshots<T extends object>(entity: T, visited: Set<unknown>) {
    if (visited.has(entity)) {
      return;
    }

    visited.add(entity);
    helper(entity)?.__meta.relations.forEach(prop => {
      const value = entity[prop.name];

      if (Utils.isCollection(value)) {
        value.takeSnapshot();
      }

      // cascade to m:1 relations as we need to snapshot the 1:m inverse side (for `removeAll()` with orphan removal)
      if (prop.kind === ReferenceKind.MANY_TO_ONE && value) {
        this.takeCollectionSnapshots(Reference.unwrapReference(value), visited);
      }
    });
  }

}

export interface RegisterOptions {
  refresh?: boolean;
  newEntity?: boolean;
  loaded?: boolean;
}
