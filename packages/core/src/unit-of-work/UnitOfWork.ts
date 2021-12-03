import type { AnyEntity, EntityData, EntityMetadata, EntityProperty, FilterQuery, IPrimaryKeyValue, Primary } from '../typings';
import { Collection, EntityIdentifier, Reference } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { ChangeSetComputer } from './ChangeSetComputer';
import { ChangeSetPersister } from './ChangeSetPersister';
import { CommitOrderCalculator } from './CommitOrderCalculator';
import { Utils } from '../utils/Utils';
import type { EntityManager } from '../EntityManager';
import { Cascade, EventType, LockMode, ReferenceType } from '../enums';
import { OptimisticLockError, ValidationError } from '../errors';
import type { Transaction } from '../connections';
import { TransactionEventBroadcaster } from '../events';
import { IdentityMap } from './IdentityMap';
import type { LockOptions } from '../drivers/IDatabaseDriver';

export class UnitOfWork {

  /** map of references to managed entities */
  private readonly identityMap = new IdentityMap();

  private readonly persistStack = new Set<AnyEntity>();
  private readonly removeStack = new Set<AnyEntity>();
  private readonly orphanRemoveStack = new Set<AnyEntity>();
  private readonly changeSets = new Map<AnyEntity, ChangeSet<AnyEntity>>();
  private readonly collectionUpdates = new Set<Collection<AnyEntity>>();
  private readonly collectionDeletions = new Set<Collection<AnyEntity>>();
  private readonly extraUpdates = new Set<[AnyEntity, string | string[], AnyEntity | AnyEntity[] | Reference<any> | Collection<any>]>();
  private readonly metadata = this.em.getMetadata();
  private readonly platform = this.em.getPlatform();
  private readonly eventManager = this.em.getEventManager();
  private readonly comparator = this.em.getComparator();
  private readonly changeSetComputer = new ChangeSetComputer(this.em.getValidator(), this.collectionUpdates, this.removeStack, this.metadata, this.platform, this.em.config, this.comparator);
  private readonly changeSetPersister = new ChangeSetPersister(this.em.getDriver(), this.metadata, this.em.config.getHydrator(this.metadata), this.em.getEntityFactory(), this.em.config);
  private readonly queue: (() => Promise<void>)[] = [];
  private working = false;
  private insideHooks = false;

  constructor(private readonly em: EntityManager) { }

  merge<T extends AnyEntity<T>>(entity: T, visited?: Set<AnyEntity>): void {
    const wrapped = entity.__helper!;
    wrapped.__em = this.em;
    wrapped.__populated = true;

    if (!wrapped.hasPrimaryKey()) {
      return;
    }

    // skip new entities that could be linked from already persisted entity
    // that is being re-fetched (but allow calling `merge(e)` explicitly for those)
    if (!wrapped.__managed && visited) {
      return;
    }

    this.identityMap.store(entity);
    wrapped.__populated = true;

    // if visited is available, we are cascading, and need to be careful when resetting the entity data
    // as there can be some entity with already changed state that is not yet flushed
    if (wrapped.__initialized && (!visited || !wrapped.__originalEntityData)) {
      wrapped.__originalEntityData = this.comparator.prepareEntity(entity);
    }

    this.cascade(entity, Cascade.MERGE, visited ?? new Set<AnyEntity>());
  }

  /**
   * @internal
   */
  registerManaged<T extends AnyEntity<T>>(entity: T, data?: EntityData<T>, refresh?: boolean, newEntity?: boolean): T {
    this.identityMap.store(entity);

    if (newEntity) {
      return entity;
    }

    const helper = entity.__helper!;
    helper!.__em ??= this.em;

    if (data && helper!.__initialized && (refresh || !helper!.__originalEntityData)) {
      // we can't use the `data` directly here as it can contain fetch joined data, that can't be used for diffing the state
      helper!.__originalEntityData = this.comparator.prepareEntity(entity);
      Object.keys(data).forEach(key => entity.__helper!.__loadedProperties.add(key));
    }

    return entity;
  }

  /**
   * Returns entity from the identity map. For composite keys, you need to pass an array of PKs in the same order as they are defined in `meta.primaryKeys`.
   */
  getById<T extends AnyEntity<T>>(entityName: string, id: Primary<T> | Primary<T>[], schema?: string): T | undefined {
    if (!id || (Array.isArray(id) && id.length === 0)) {
      return undefined;
    }

    const meta = this.metadata.find(entityName)!.root;
    let hash = Array.isArray(id) ? Utils.getPrimaryKeyHash(id as string[]) : '' + id;
    schema ??= meta.schema;

    if (schema) {
      hash = `${schema}:${hash}`;
    }

    return this.identityMap.getByHash(meta, hash);
  }

  tryGetById<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, schema?: string, strict = true): T | null {
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
   * @deprecated use `uow.getOriginalEntityData(entity)`
   */
  getOriginalEntityData<T extends AnyEntity<T>>(): AnyEntity[];

  /**
   * Returns stored snapshot of entity state that is used for change set computation.
   */
  getOriginalEntityData<T extends AnyEntity<T>>(entity: T): EntityData<T> | undefined;

  /**
   * Returns stored snapshot of entity state that is used for change set computation.
   */
  getOriginalEntityData<T extends AnyEntity<T>>(entity?: T): EntityData<AnyEntity>[] | EntityData<T> | undefined {
    if (!entity) {
      return this.identityMap.values().map(e => {
        return e.__helper!.__originalEntityData!;
      });
    }

    return entity.__helper!.__originalEntityData;
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

  getExtraUpdates(): Set<[AnyEntity, string | string[], (AnyEntity | AnyEntity[] | Reference<any> | Collection<any>)]> {
    return this.extraUpdates;
  }

  computeChangeSet<T extends AnyEntity<T>>(entity: T): void {
    const cs = this.changeSetComputer.computeChangeSet(entity);

    if (!cs || this.checkUniqueProps(cs)) {
      return;
    }

    this.initIdentifier(entity);
    this.checkOrphanRemoval(cs);
    this.changeSets.set(entity, cs);
    this.persistStack.delete(entity);
    entity.__helper!.__originalEntityData = this.comparator.prepareEntity(entity);
  }

  recomputeSingleChangeSet<T extends AnyEntity<T>>(entity: T): void {
    const changeSet = this.changeSets.get(entity);

    if (!changeSet) {
      return;
    }

    const cs = this.changeSetComputer.computeChangeSet(entity);

    /* istanbul ignore else */
    if (cs && !this.checkUniqueProps(changeSet)) {
      this.checkOrphanRemoval(cs);
      Object.assign(changeSet.payload, cs.payload);
      entity.__helper!.__originalEntityData = this.comparator.prepareEntity(entity);
    }
  }

  persist<T extends AnyEntity<T>>(entity: T, visited?: Set<AnyEntity>, options: { checkRemoveStack?: boolean; cascade?: boolean } = {}): void {
    if (this.persistStack.has(entity)) {
      return;
    }

    if (options.checkRemoveStack && this.removeStack.has(entity)) {
      return;
    }

    this.persistStack.add(entity);
    this.removeStack.delete(entity);

    if (options.cascade ?? true) {
      this.cascade(entity, Cascade.PERSIST, visited, options);
    }
  }

  remove(entity: AnyEntity, visited = new Set<AnyEntity>()): void {
    if (!entity || this.removeStack.has(entity)) {
      return;
    }

    if (entity.__helper!.hasPrimaryKey()) {
      this.removeStack.add(entity);
    }

    this.persistStack.delete(entity);
    this.cascade(entity, Cascade.REMOVE, visited);
  }

  async commit(): Promise<void> {
    if (this.working) {
      if (this.insideHooks) {
        throw ValidationError.cannotCommit();
      }

      return await new Promise<void>((resolve, reject) => {
        this.queue.push(async () => {
          await this.doCommit().then(resolve, reject);
        });
      });
    }

    this.working = true;
    await this.doCommit();

    while (this.queue.length) {
      await this.queue.shift()!();
    }

    this.working = false;
  }

  private async doCommit(): Promise<void> {
    const oldTx = this.em.getTransactionContext();

    try {
      await this.eventManager.dispatchEvent(EventType.beforeFlush, { em: this.em, uow: this });
      this.computeChangeSets();
      await this.eventManager.dispatchEvent(EventType.onFlush, { em: this.em, uow: this });

      // nothing to do, do not start transaction
      if (this.changeSets.size === 0 && this.collectionUpdates.size === 0 && this.collectionDeletions.size === 0 && this.extraUpdates.size === 0) {
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
      await this.eventManager.dispatchEvent(EventType.afterFlush, { em: this.em, uow: this });
    } finally {
      this.postCommitCleanup();
      this.resetTransaction(oldTx);
    }
  }

  async lock<T extends AnyEntity<T>>(entity: T, options: LockOptions): Promise<void> {
    if (!this.getById(entity.constructor.name, entity.__helper!.__primaryKeys, entity.__helper!.__schema)) {
      throw ValidationError.entityNotManaged(entity);
    }

    const meta = this.metadata.find<T>(entity.constructor.name)!;

    if (options.lockMode === LockMode.OPTIMISTIC) {
      await this.lockOptimistic(entity, meta, options.lockVersion!);
    } else if (options.lockMode != null) {
      await this.lockPessimistic(entity, options);
    }
  }

  clear(): void {
    this.identityMap.clear();
    this.postCommitCleanup();
  }

  unsetIdentity(entity: AnyEntity): void {
    this.identityMap.delete(entity);
    const wrapped = entity.__helper!;

    wrapped.__meta.relations
      .filter(prop => prop.mappedBy && entity[prop.name] && entity[prop.name][prop.mappedBy])
      .forEach(prop => delete entity[prop.name][prop.mappedBy]);

    delete wrapped.__identifier;
    delete wrapped.__originalEntityData;
  }

  computeChangeSets(): void {
    this.changeSets.clear();

    for (const entity of this.persistStack) {
      this.cascade(entity, Cascade.PERSIST, new Set<AnyEntity>(), { checkRemoveStack: true });
    }

    for (const entity of this.identityMap) {
      if (!this.removeStack.has(entity) && !this.persistStack.has(entity) && !this.orphanRemoveStack.has(entity)) {
        this.persistStack.add(entity);
        this.cascade(entity, Cascade.PERSIST, new Set<AnyEntity>(), { checkRemoveStack: true });
      }
    }

    for (const entity of this.persistStack) {
      this.findNewEntities(entity);
    }

    for (const entity of this.orphanRemoveStack) {
      this.removeStack.add(entity);
      this.cascade(entity, Cascade.REMOVE);
    }

    for (const entity of this.removeStack) {
      this.changeSets.set(entity, new ChangeSet(entity, ChangeSetType.DELETE, {}, entity.__meta!));
    }
  }

  scheduleExtraUpdate<T>(changeSet: ChangeSet<T>, props: EntityProperty<T>[]): void {
    if (props.length === 0) {
      return;
    }

    this.extraUpdates.add([changeSet.entity, props.map(p => p.name), props.map(p => changeSet.entity[p.name])]);
    props.forEach(p => delete changeSet.entity[p.name]);
    props.forEach(p => delete changeSet.payload[p.name]);
  }

  scheduleOrphanRemoval(entity?: AnyEntity): void {
    if (entity) {
      this.orphanRemoveStack.add(entity);
    }
  }

  cancelOrphanRemoval(entity: AnyEntity): void {
    this.orphanRemoveStack.delete(entity);
  }

  /**
   * Schedules a complete collection for removal when this UnitOfWork commits.
   */
  scheduleCollectionDeletion(collection: Collection<AnyEntity>): void {
    this.collectionDeletions.add(collection);
  }

  /**
   * Gets the currently scheduled complete collection deletions
   */
  getScheduledCollectionDeletions() {
    return [...this.collectionDeletions];
  }

  private findNewEntities<T extends AnyEntity<T>>(entity: T, visited = new Set<AnyEntity>(), idx = 0): void {
    if (visited.has(entity)) {
      return;
    }

    visited.add(entity);
    const wrapped = entity.__helper!;

    if (!wrapped.__initialized || this.removeStack.has(entity) || this.orphanRemoveStack.has(entity)) {
      return;
    }

    this.initIdentifier(entity);

    for (const prop of entity.__meta!.relations) {
      const targets = Utils.unwrapProperty(entity, entity.__meta!, prop);
      targets.forEach(([target]) => {
        const reference = Reference.unwrapReference(target as AnyEntity);
        this.processReference(entity, prop, reference, visited, idx);
      });
    }

    const changeSet = this.changeSetComputer.computeChangeSet(entity);

    if (changeSet && !this.checkUniqueProps(changeSet)) {
      this.checkOrphanRemoval(changeSet);
      this.changeSets.set(entity, changeSet);
      this.persistStack.delete(entity);
    }
  }

  private checkUniqueProps<T extends AnyEntity<T>>(changeSet: ChangeSet<T>): boolean {
    if (this.platform.allowsUniqueBatchUpdates() || changeSet.type !== ChangeSetType.UPDATE) {
      return false;
    }

    // when changing a unique nullable property (or a 1:1 relation), we can't do it in a single query as it would cause unique constraint violations
    const uniqueProps = changeSet.entity.__meta!.props.filter(prop => prop.unique && prop.nullable && changeSet.payload[prop.name] != null);
    this.scheduleExtraUpdate(changeSet, uniqueProps);

    return changeSet.type === ChangeSetType.UPDATE && !Utils.hasObjectKeys(changeSet.payload);
  }

  private checkOrphanRemoval<T extends AnyEntity<T>>(changeSet: ChangeSet<T>): void {
    const meta = this.metadata.find(changeSet.name)!;
    const props = meta.relations.filter(prop => prop.reference === ReferenceType.ONE_TO_ONE);

    for (const prop of props) {
      // check diff, if we had a value on 1:1 before and now it changed (nulled or replaced), we need to trigger orphan removal
      const wrapped = changeSet.entity.__helper!;
      const data = wrapped.__originalEntityData;

      if (prop.orphanRemoval && data && data[prop.name] && prop.name in changeSet.payload) {
        const orphan = this.getById(prop.type, data[prop.name], wrapped.__schema);
        this.scheduleOrphanRemoval(orphan);
      }
    }
  }

  private initIdentifier<T extends AnyEntity<T>>(entity: T): void {
    const wrapped = entity.__helper!;

    if (wrapped.__identifier || wrapped.hasPrimaryKey()) {
      return;
    }

    wrapped.__identifier = new EntityIdentifier();
  }

  private processReference<T extends AnyEntity<T>>(parent: T, prop: EntityProperty<T>, reference: any, visited: Set<AnyEntity>, idx: number): void {
    const isToOne = prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE;

    if (isToOne && Utils.isEntity(reference)) {
      return this.processToOneReference(reference, visited, idx);
    }

    if (Utils.isCollection<any>(reference, prop, ReferenceType.MANY_TO_MANY) && reference.isDirty()) {
      this.processToManyReference(reference, visited, parent, prop);
    }
  }

  private processToOneReference<T extends AnyEntity<T>>(reference: any, visited: Set<AnyEntity>, idx: number): void {
    if (!reference.__helper!.__managed) {
      this.findNewEntities(reference, visited, idx);
    }
  }

  private processToManyReference<T extends AnyEntity<T>>(reference: Collection<AnyEntity>, visited: Set<AnyEntity>, parent: T, prop: EntityProperty<T>): void {
    if (this.isCollectionSelfReferenced(reference, visited)) {
      this.extraUpdates.add([parent, prop.name, reference]);
      parent[prop.name as keyof T] = new Collection<AnyEntity>(parent) as unknown as T[keyof T];

      return;
    }

    reference.getItems(false)
      .filter(item => !item.__helper!.__originalEntityData)
      .forEach(item => this.findNewEntities(item, visited));
  }

  private async runHooks<T extends AnyEntity<T>>(type: EventType, changeSet: ChangeSet<T>, sync = false): Promise<unknown> {
    this.insideHooks = true;
    const hasListeners = this.eventManager.hasListeners(type, changeSet.entity.__meta!);

    if (!hasListeners) {
      return;
    }

    if (!sync) {
      return this.eventManager.dispatchEvent(type, { entity: changeSet.entity, em: this.em, changeSet });
    }

    const copy = this.comparator.prepareEntity(changeSet.entity) as T;
    await this.eventManager.dispatchEvent(type, { entity: changeSet.entity, em: this.em, changeSet });
    const current = this.comparator.prepareEntity(changeSet.entity) as T;
    const diff = this.comparator.diffEntities<T>(changeSet.name, copy, current);
    Object.assign(changeSet.payload, diff);
    const wrapped = changeSet.entity.__helper!;

    if (wrapped.__identifier && diff[wrapped.__meta.primaryKeys[0]]) {
      wrapped.__identifier.setValue(diff[wrapped.__meta.primaryKeys[0]] as IPrimaryKeyValue);
    }

    this.insideHooks = false;
  }

  private postCommitCleanup(): void {
    this.persistStack.clear();
    this.removeStack.clear();
    this.orphanRemoveStack.clear();
    this.changeSets.clear();
    this.collectionUpdates.clear();
    this.collectionDeletions.clear();
    this.extraUpdates.clear();
    this.working = false;
    this.insideHooks = false;
  }

  private cascade<T extends AnyEntity<T>>(entity: T, type: Cascade, visited = new Set<AnyEntity>(), options: { checkRemoveStack?: boolean; cascade?: boolean } = {}): void {
    if (visited.has(entity)) {
      return;
    }

    visited.add(entity);

    switch (type) {
      case Cascade.PERSIST: this.persist(entity, visited, options); break;
      case Cascade.MERGE: this.merge(entity, visited); break;
      case Cascade.REMOVE: this.remove(entity, visited); break;
    }

    for (const prop of entity.__meta!.relations) {
      this.cascadeReference<T>(entity, prop, type, visited, options);
    }
  }

  private cascadeReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>, type: Cascade, visited: Set<AnyEntity>, options: { checkRemoveStack?: boolean }): void {
    this.fixMissingReference(entity, prop);

    if (!this.shouldCascade(prop, type)) {
      return;
    }

    const reference = Reference.unwrapReference(entity[prop.name]) as unknown as T | Collection<AnyEntity>;

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference) && Utils.isEntity(reference)) {
      return this.cascade(reference as T, type, visited, options);
    }

    const collection = reference as Collection<AnyEntity>;
    const requireFullyInitialized = type === Cascade.PERSIST; // only cascade persist needs fully initialized items

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference) && collection) {
      if (type === Cascade.MERGE && collection.isInitialized()) {
        collection.populated();
      }

      collection
        .getItems(false)
        .filter(item => !requireFullyInitialized || item.__helper!.__initialized)
        .forEach(item => this.cascade(item, type, visited, options));
    }
  }

  private isCollectionSelfReferenced(collection: Collection<AnyEntity>, visited: Set<AnyEntity>): boolean {
    const filtered = collection.getItems(false).filter(item => !item.__helper!.__originalEntityData);
    return filtered.some(items => visited.has(items));
  }

  private shouldCascade(prop: EntityProperty, type: Cascade): boolean {
    if (type === Cascade.REMOVE && prop.orphanRemoval) {
      return true;
    }

    // ignore user settings for merge, it is kept only for back compatibility, this should have never been configurable
    if (type === Cascade.MERGE) {
      return true;
    }

    return prop.cascade && (prop.cascade.includes(type) || prop.cascade.includes(Cascade.ALL));
  }

  private async lockPessimistic<T extends AnyEntity<T>>(entity: T, options: LockOptions): Promise<void> {
    if (!this.em.isInTransaction()) {
      throw ValidationError.transactionRequired();
    }

    await this.em.getDriver().lockPessimistic(entity, { ctx: this.em.getTransactionContext(), ...options });
  }

  private async lockOptimistic<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, version: number | Date): Promise<void> {
    if (!meta.versionProperty) {
      throw OptimisticLockError.notVersioned(meta);
    }

    if (!Utils.isDefined<number | Date>(version)) {
      return;
    }

    const wrapped = entity.__helper!;

    if (!wrapped.__initialized) {
      await wrapped.init();
    }

    const previousVersion = entity[meta.versionProperty] as unknown as Date | number;

    if (previousVersion !== version) {
      throw OptimisticLockError.lockFailedVersionMismatch(entity, version, previousVersion);
    }
  }

  private fixMissingReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>): void {
    const reference = Reference.unwrapReference(entity[prop.name]) as AnyEntity;

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference) && reference && !prop.mapToPk) {
      if (!Utils.isEntity(reference)) {
        entity[prop.name] = this.em.getReference(prop.type, reference as Primary<T[string & keyof T]>, { wrapped: !!prop.wrappedReference }) as T[string & keyof T];
      } else if (!reference.__helper!.__initialized && !reference.__helper!.__em) {
        const pk = reference.__helper!.getSerializedPrimaryKey();
        entity[prop.name] = this.em.getReference(prop.type, pk as Primary<T[string & keyof T]>, { wrapped: !!prop.wrappedReference }) as T[string & keyof T];
      }
    }

    const isCollection = [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference);

    if (isCollection && Array.isArray(reference)) {
      const collection = new Collection<AnyEntity>(entity);
      entity[prop.name as keyof T] = collection as unknown as T[keyof T];
      collection.set(reference as AnyEntity[]);
    }
  }

  private async persistToDatabase(groups: { [K in ChangeSetType]: Map<string, ChangeSet<any>[]> }, ctx?: Transaction): Promise<void> {
    if (ctx) {
      this.em.setTransactionContext(ctx);
    }

    const commitOrder = this.getCommitOrder();
    const commitOrderReversed = [...commitOrder].reverse();

    // 1. whole collection deletions
    for (const coll of this.collectionDeletions) {
      await this.em.getDriver().clearCollection(coll, { ctx });
      coll.takeSnapshot();
    }

    // 2. create
    for (const name of commitOrder) {
      await this.commitCreateChangeSets(groups[ChangeSetType.CREATE].get(name) ?? [], ctx);
    }

    // 3. update
    for (const name of commitOrder) {
      await this.commitUpdateChangeSets(groups[ChangeSetType.UPDATE].get(name) ?? [], ctx);
    }

    // 4. extra updates
    const extraUpdates: ChangeSet<any>[] = [];

    for (const extraUpdate of this.extraUpdates) {
      if (Array.isArray(extraUpdate[1])) {
        extraUpdate[1].forEach((p, i) => extraUpdate[0][p] = extraUpdate[2][i]);
      } else {
        extraUpdate[0][extraUpdate[1]] = extraUpdate[2];
      }

      const changeSet = this.changeSetComputer.computeChangeSet(extraUpdate[0])!;

      if (changeSet) {
        extraUpdates.push(changeSet);
      }
    }

    await this.commitUpdateChangeSets(extraUpdates, ctx, false);

    // 5. collection updates
    for (const coll of this.collectionUpdates) {
      await this.em.getDriver().syncCollection(coll, { ctx });
      coll.takeSnapshot();
    }

    // 6. delete - entity deletions need to be in reverse commit order
    for (const name of commitOrderReversed) {
      await this.commitDeleteChangeSets(groups[ChangeSetType.DELETE].get(name) ?? [], ctx);
    }

    // 7. take snapshots of all persisted collections
    const visited = new Set<object>();
    for (const changeSet of this.changeSets.values()) {
      this.takeCollectionSnapshots(changeSet.entity, visited);
    }
  }

  private async commitCreateChangeSets<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    if (changeSets.length === 0) {
      return;
    }

    const meta = changeSets[0].entity.__meta!;
    const props = meta.relations.filter(prop => {
      return (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner) || prop.reference === ReferenceType.MANY_TO_ONE;
    });

    for (const changeSet of changeSets) {
      this.findExtraUpdates(changeSet, props);
      await this.runHooks(EventType.beforeCreate, changeSet, true);
    }

    await this.changeSetPersister.executeInserts(changeSets, { ctx });

    for (const changeSet of changeSets) {
      this.registerManaged<T>(changeSet.entity, changeSet.payload, true);
      await this.runHooks(EventType.afterCreate, changeSet);
    }
  }

  private findExtraUpdates<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, props: EntityProperty<T>[]): void {
    for (const prop of props) {
      if (!changeSet.entity[prop.name]) {
        continue;
      }

      const cs = this.changeSets.get(Reference.unwrapReference(changeSet.entity[prop.name]));
      const isScheduledForInsert = cs && cs.type === ChangeSetType.CREATE && !cs.persisted;

      if (isScheduledForInsert) {
        this.scheduleExtraUpdate(changeSet, [prop]);
      }
    }
  }

  private async commitUpdateChangeSets<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], ctx?: Transaction, batched = true): Promise<void> {
    if (changeSets.length === 0) {
      return;
    }

    for (const changeSet of changeSets) {
      await this.runHooks(EventType.beforeUpdate, changeSet, true);
    }

    await this.changeSetPersister.executeUpdates(changeSets, batched, { ctx });

    for (const changeSet of changeSets) {
      changeSet.entity.__helper!.__originalEntityData = this.comparator.prepareEntity(changeSet.entity);
      await this.runHooks(EventType.afterUpdate, changeSet);
    }
  }

  private async commitDeleteChangeSets<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
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

  /**
   * Orders change sets so FK constrains are maintained, ensures stable order (needed for node < 11)
   */
  private getChangeSetGroups(): { [K in ChangeSetType]: Map<string, ChangeSet<any>[]> } {
    const groups = {
      [ChangeSetType.CREATE]: new Map<string, ChangeSet<any>[]>(),
      [ChangeSetType.UPDATE]: new Map<string, ChangeSet<any>[]>(),
      [ChangeSetType.DELETE]: new Map<string, ChangeSet<any>[]>(),
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
  private takeCollectionSnapshots<T extends AnyEntity<T>>(entity: T, visited: Set<object>) {
    if (visited.has(entity)) {
      return;
    }

    visited.add(entity);
    entity.__meta?.relations.forEach(prop => {
      const value = entity[prop.name];

      if (Utils.isCollection(value)) {
        value.takeSnapshot();
      }

      // cascade to m:1 relations as we need to snapshot the 1:m inverse side (for `removeAll()` with orphan removal)
      if (prop.reference === ReferenceType.MANY_TO_ONE && value) {
        this.takeCollectionSnapshots(Reference.unwrapReference(value), visited);
      }
    });
  }

}
