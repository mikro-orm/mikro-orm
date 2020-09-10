import { AnyEntity, EntityData, EntityMetadata, EntityProperty, FilterQuery, Primary } from '../typings';
import { Collection, EntityIdentifier, Reference } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { ChangeSetComputer } from './ChangeSetComputer';
import { ChangeSetPersister } from './ChangeSetPersister';
import { CommitOrderCalculator } from './CommitOrderCalculator';
import { Utils } from '../utils';
import { EntityManager } from '../EntityManager';
import { EventType, Cascade, LockMode, ReferenceType } from '../enums';
import { ValidationError, OptimisticLockError } from '../errors';
import { Transaction } from '../connections';

export class UnitOfWork {

  /** map of references to managed entities */
  private readonly identityMap = new Map<string, AnyEntity>();

  /** holds copy of identity map so we can compute changes when persisting managed entities */
  private readonly originalEntityData = new Map<string, EntityData<AnyEntity>>();

  /** map of wrapped primary keys so we can compute change set without eager commit */
  private readonly identifierMap = new Map<string, EntityIdentifier>();

  private readonly persistStack = new Set<AnyEntity>();
  private readonly removeStack = new Set<AnyEntity>();
  private readonly orphanRemoveStack = new Set<AnyEntity>();
  private readonly changeSets: ChangeSet<AnyEntity>[] = [];
  private readonly collectionUpdates: Collection<AnyEntity>[] = [];
  private readonly extraUpdates = new Set<[AnyEntity, string, AnyEntity | Reference<AnyEntity>]>();
  private readonly metadata = this.em.getMetadata();
  private readonly platform = this.em.getDriver().getPlatform();
  private readonly changeSetComputer = new ChangeSetComputer(this.em.getValidator(), this.originalEntityData, this.identifierMap, this.collectionUpdates, this.removeStack, this.metadata, this.platform);
  private readonly changeSetPersister = new ChangeSetPersister(this.em.getDriver(), this.identifierMap, this.metadata, this.em.config.getHydrator(this.em.getEntityFactory(), this.em), this.em.config);
  private working = false;

  constructor(private readonly em: EntityManager) { }

  merge<T extends AnyEntity<T>>(entity: T, visited = new Set<AnyEntity>(), mergeData = true): void {
    const wrapped = entity.__helper!;
    wrapped.__em = this.em;

    if (!Utils.isDefined(wrapped.__primaryKey, true)) {
      return;
    }

    // skip new entities that could be linked from already persisted entity that is being re-fetched
    if (!entity.__helper!.__managed) {
      return;
    }

    const root = Utils.getRootEntity(this.metadata, wrapped.__meta);
    this.identityMap.set(`${root.name}-${wrapped.__serializedPrimaryKey}`, entity);

    if (mergeData || !this.originalEntityData.has(entity.__helper!.__uuid)) {
      this.originalEntityData.set(entity.__helper!.__uuid, Utils.prepareEntity(entity, this.metadata, this.platform));
    }

    this.cascade(entity, Cascade.MERGE, visited, { mergeData: false });
  }

  /**
   * Returns entity from the identity map. For composite keys, you need to pass an array of PKs in the same order as they are defined in `meta.primaryKeys`.
   */
  getById<T extends AnyEntity<T>>(entityName: string, id: Primary<T> | Primary<T>[]): T {
    const root = Utils.getRootEntity(this.metadata, this.metadata.find(entityName)!);
    const hash = Utils.getPrimaryKeyHash(Utils.asArray(id) as string[]);
    const token = `${root.name}-${hash}`;

    return this.identityMap.get(token) as T;
  }

  tryGetById<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, strict = true): T | null {
    const pk = Utils.extractPK(where, this.metadata.find<T>(entityName)!, strict);

    if (!pk) {
      return null;
    }

    return this.getById<T>(entityName, pk);
  }

  getIdentityMap(): Map<string, AnyEntity> {
    return this.identityMap;
  }

  getOriginalEntityData(): Map<string, EntityData<AnyEntity>> {
    return this.originalEntityData;
  }

  getPersistStack(): Set<AnyEntity> {
    return this.persistStack;
  }

  getRemoveStack(): Set<AnyEntity> {
    return this.removeStack;
  }

  getChangeSets(): ChangeSet<AnyEntity>[] {
    return this.changeSets;
  }

  getCollectionUpdates(): Collection<AnyEntity>[] {
    return this.collectionUpdates;
  }

  getExtraUpdates(): Set<[AnyEntity, string, (AnyEntity | Reference<AnyEntity>)]> {
    return this.extraUpdates;
  }

  computeChangeSet<T extends AnyEntity<T>>(entity: T): void {
    const cs = this.changeSetComputer.computeChangeSet(entity);

    if (!cs) {
      return;
    }

    this.initIdentifier(entity);
    this.changeSets.push(cs);
    this.persistStack.delete(entity);
    this.originalEntityData.set(entity.__helper!.__uuid, Utils.prepareEntity(entity, this.metadata, this.platform));
  }

  recomputeSingleChangeSet<T extends AnyEntity<T>>(entity: T): void {
    const idx = this.changeSets.findIndex(cs => cs.entity === entity);

    if (idx === -1) {
      return;
    }

    const cs = this.changeSetComputer.computeChangeSet(entity);

    if (cs) {
      Object.assign(this.changeSets[idx].payload, cs.payload);
      this.originalEntityData.set(entity.__helper!.__uuid, Utils.prepareEntity(entity, this.metadata, this.platform));
    }
  }

  persist<T extends AnyEntity<T>>(entity: T, visited = new Set<AnyEntity>(), checkRemoveStack = false): void {
    if (this.persistStack.has(entity)) {
      return;
    }

    if (checkRemoveStack && this.removeStack.has(entity)) {
      return;
    }

    if (!Utils.isDefined(entity.__helper!.__primaryKey, true)) {
      this.identifierMap.set(entity.__helper!.__uuid, new EntityIdentifier());
    }

    this.persistStack.add(entity);
    this.removeStack.delete(entity);
    this.cascade(entity, Cascade.PERSIST, visited, { checkRemoveStack });
  }

  remove(entity: AnyEntity, visited = new Set<AnyEntity>()): void {
    if (this.removeStack.has(entity)) {
      return;
    }

    if (entity.__helper!.__primaryKey) {
      this.removeStack.add(entity);
    }

    this.persistStack.delete(entity);
    this.unsetIdentity(entity);
    this.cascade(entity, Cascade.REMOVE, visited);
  }

  async commit(): Promise<void> {
    if (this.working) {
      throw ValidationError.cannotCommit();
    }

    await this.em.getEventManager().dispatchEvent(EventType.beforeFlush, { em: this.em, uow: this });
    this.working = true;
    this.computeChangeSets();
    await this.em.getEventManager().dispatchEvent(EventType.onFlush, { em: this.em, uow: this });

    // nothing to do, do not start transaction
    if (this.changeSets.length === 0 && this.collectionUpdates.length === 0 && this.extraUpdates.size === 0) {
      await this.em.getEventManager().dispatchEvent(EventType.afterFlush, { em: this.em, uow: this });
      this.postCommitCleanup();

      return;
    }

    const groups = this.getChangeSetGroups();
    const platform = this.em.getDriver().getPlatform();
    const runInTransaction = !this.em.isInTransaction() && platform.supportsTransactions() && this.em.config.get('implicitTransactions');

    if (runInTransaction) {
      await this.em.getConnection('write').transactional(trx => this.persistToDatabase(groups, trx));
    } else {
      await this.persistToDatabase(groups, this.em.getTransactionContext());
    }

    await this.em.getEventManager().dispatchEvent(EventType.afterFlush, { em: this.em, uow: this });
    this.postCommitCleanup();
  }

  async lock<T extends AnyEntity<T>>(entity: T, mode: LockMode, version?: number | Date): Promise<void> {
    if (!this.getById(entity.constructor.name, entity.__helper!.__primaryKeys)) {
      throw ValidationError.entityNotManaged(entity);
    }

    const meta = this.metadata.find<T>(entity.constructor.name)!;

    if (mode === LockMode.OPTIMISTIC) {
      await this.lockOptimistic(entity, meta, version!);
    } else if ([LockMode.NONE, LockMode.PESSIMISTIC_READ, LockMode.PESSIMISTIC_WRITE].includes(mode)) {
      await this.lockPessimistic(entity, mode);
    }
  }

  clear(): void {
    this.identityMap.clear();
    this.originalEntityData.clear();
    this.postCommitCleanup();
  }

  unsetIdentity(entity: AnyEntity): void {
    const wrapped = entity.__helper!;
    const root = Utils.getRootEntity(this.metadata, wrapped.__meta);
    this.identityMap.delete(`${root.name}-${wrapped.__serializedPrimaryKey}`);
    this.identifierMap.delete(wrapped.__uuid);
    this.originalEntityData.delete(wrapped.__uuid);
  }

  computeChangeSets(): void {
    this.changeSets.length = 0;

    for (const entity of this.identityMap.values()) {
      if (!this.removeStack.has(entity) && !this.orphanRemoveStack.has(entity)) {
        this.persist(entity, undefined, true);
      }
    }

    for (const entity of this.persistStack) {
      this.findNewEntities(entity);
    }

    for (const entity of this.orphanRemoveStack) {
      this.remove(entity);
    }

    for (const entity of this.removeStack) {
      const meta = this.metadata.find(entity.constructor.name)!;
      this.changeSets.push({ entity, type: ChangeSetType.DELETE, name: meta.name, collection: meta.collection, payload: {} } as ChangeSet<AnyEntity>);
    }
  }

  scheduleOrphanRemoval(entity: AnyEntity): void {
    this.orphanRemoveStack.add(entity);
  }

  cancelOrphanRemoval(entity: AnyEntity): void {
    this.orphanRemoveStack.delete(entity);
  }

  private findNewEntities<T extends AnyEntity<T>>(entity: T, visited = new Set<AnyEntity>()): void {
    if (visited.has(entity)) {
      return;
    }

    visited.add(entity);
    const wrapped = entity.__helper!;

    if (!wrapped.isInitialized() || this.removeStack.has(entity) || this.orphanRemoveStack.has(entity)) {
      return;
    }

    this.initIdentifier(entity);

    for (const prop of Object.values<EntityProperty>(wrapped.__meta.properties)) {
      const reference = this.unwrapReference(entity, prop);
      this.processReference(entity, prop, reference, visited);
    }

    const changeSet = this.changeSetComputer.computeChangeSet<AnyEntity>(entity);

    if (changeSet) {
      this.changeSets.push(changeSet);
      this.persistStack.delete(entity);
      this.originalEntityData.set(wrapped.__uuid, Utils.prepareEntity(entity, this.metadata, this.platform));
    }
  }

  private initIdentifier<T extends AnyEntity<T>>(entity: T): void {
    const wrapped = entity.__helper!;

    if (Utils.isDefined(wrapped.__primaryKey, true) || this.identifierMap.has(wrapped.__uuid)) {
      return;
    }

    this.identifierMap.set(wrapped.__uuid, new EntityIdentifier());
  }

  private processReference<T extends AnyEntity<T>>(parent: T, prop: EntityProperty<T>, reference: any, visited: Set<AnyEntity>): void {
    const isToOne = prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE;

    if (isToOne && reference) {
      return this.processToOneReference(reference, visited);
    }

    if (Utils.isCollection<any>(reference, prop, ReferenceType.MANY_TO_MANY) && reference.isDirty()) {
      this.processToManyReference(reference, visited, parent, prop);
    }
  }

  private processToOneReference<T extends AnyEntity<T>>(reference: any, visited: Set<AnyEntity>): void {
    if (!this.originalEntityData.has(reference.__helper!.__uuid)) {
      this.findNewEntities(reference, visited);
    }
  }

  private processToManyReference<T extends AnyEntity<T>>(reference: Collection<AnyEntity>, visited: Set<AnyEntity>, parent: T, prop: EntityProperty<T>): void {
    if (this.isCollectionSelfReferenced(reference, visited)) {
      this.extraUpdates.add([parent, prop.name, reference]);
      parent[prop.name as keyof T] = new Collection<AnyEntity>(parent) as unknown as T[keyof T];

      return;
    }

    reference.getItems(false)
      .filter(item => !this.originalEntityData.has(item.__helper!.__uuid))
      .forEach(item => this.findNewEntities(item, visited));
  }

  private async runHooks<T extends AnyEntity<T>>(type: EventType, changeSet: ChangeSet<T>) {
    await this.em.getEventManager().dispatchEvent(type, { entity: changeSet.entity, em: this.em, changeSet });
  }

  private postCommitCleanup(): void {
    this.identifierMap.clear();
    this.persistStack.clear();
    this.removeStack.clear();
    this.orphanRemoveStack.clear();
    this.changeSets.length = 0;
    this.collectionUpdates.length = 0;
    this.extraUpdates.clear();
    this.working = false;
  }

  private cascade<T extends AnyEntity<T>>(entity: T, type: Cascade, visited: Set<AnyEntity>, options: { checkRemoveStack?: boolean; mergeData?: boolean } = {}): void {
    if (visited.has(entity)) {
      return;
    }

    visited.add(entity);

    switch (type) {
      case Cascade.PERSIST: this.persist(entity, visited, options.checkRemoveStack); break;
      case Cascade.MERGE: this.merge(entity, visited, options.mergeData); break;
      case Cascade.REMOVE: this.remove(entity, visited); break;
    }

    const meta = this.metadata.find<T>(entity.constructor.name)!;

    for (const prop of Object.values<EntityProperty>(meta.properties).filter(prop => prop.reference !== ReferenceType.SCALAR)) {
      this.cascadeReference<T>(entity, prop, type, visited, options);
    }
  }

  private cascadeReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>, type: Cascade, visited: Set<AnyEntity>, options: { checkRemoveStack?: boolean; mergeData?: boolean }): void {
    this.fixMissingReference(entity, prop);

    if (!this.shouldCascade(prop, type)) {
      return;
    }

    const reference = this.unwrapReference(entity, prop);

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference) && reference) {
      return this.cascade(reference as T, type, visited, options);
    }

    const collection = reference as Collection<AnyEntity>;
    const requireFullyInitialized = type === Cascade.PERSIST; // only cascade persist needs fully initialized items

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference) && collection) {
      collection
        .getItems(false)
        .filter(item => !requireFullyInitialized || item.__helper!.isInitialized())
        .forEach(item => this.cascade(item, type, visited, options));
    }
  }

  private isCollectionSelfReferenced(collection: Collection<AnyEntity>, visited: Set<AnyEntity>): boolean {
    const filtered = collection.getItems(false).filter(item => !this.originalEntityData.has(item.__helper!.__uuid));
    return filtered.some(items => visited.has(items));
  }

  private shouldCascade(prop: EntityProperty, type: Cascade): boolean {
    if (type === Cascade.REMOVE && prop.orphanRemoval) {
      return true;
    }

    return prop.cascade && (prop.cascade.includes(type) || prop.cascade.includes(Cascade.ALL));
  }

  private async lockPessimistic<T extends AnyEntity<T>>(entity: T, mode: LockMode): Promise<void> {
    if (!this.em.isInTransaction()) {
      throw ValidationError.transactionRequired();
    }

    await this.em.getDriver().lockPessimistic(entity, mode, this.em.getTransactionContext());
  }

  private async lockOptimistic<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, version: number | Date): Promise<void> {
    if (!meta.versionProperty) {
      throw OptimisticLockError.notVersioned(meta);
    }

    if (!Utils.isDefined<number | Date>(version)) {
      return;
    }

    const wrapped = entity.__helper!;

    if (!wrapped.isInitialized()) {
      await wrapped.init();
    }

    const previousVersion = entity[meta.versionProperty] as unknown as Date | number;

    if (previousVersion !== version) {
      throw OptimisticLockError.lockFailedVersionMismatch(entity, version, previousVersion);
    }
  }

  private fixMissingReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>): void {
    const reference = this.unwrapReference(entity, prop);

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference) && reference && !Utils.isEntity(reference)) {
      entity[prop.name] = this.em.getReference(prop.type, reference as Primary<T[string & keyof T]>, !!prop.wrappedReference) as T[string & keyof T];
    }

    const isCollection = [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference);

    if (isCollection && Array.isArray(reference)) {
      const collection = new Collection<AnyEntity>(entity);
      entity[prop.name as keyof T] = collection as unknown as T[keyof T];
      collection.set(reference as AnyEntity[]);
    }
  }

  private unwrapReference<T extends AnyEntity<T>, U extends AnyEntity | Reference<T> | Collection<AnyEntity> | Primary<T> | (AnyEntity | Primary<T>)[]>(entity: T, prop: EntityProperty<T>): U {
    const reference = entity[prop.name] as U;

    if (Reference.isReference(reference)) {
      return reference.unwrap() as U;
    }

    return reference;
  }

  private async persistToDatabase(groups: { [K in ChangeSetType]: Map<string, ChangeSet<any>[]> }, tx?: Transaction): Promise<void> {
    const commitOrder = this.getCommitOrder();
    const commitOrderReversed = [...commitOrder].reverse();

    // 1. create
    for (const name of commitOrder) {
      await this.commitCreateChangeSets(groups[ChangeSetType.CREATE][name] ?? [], tx);
    }

    // 2. update
    for (const name of commitOrder) {
      await this.commitUpdateChangeSets(groups[ChangeSetType.UPDATE][name] ?? [], tx);
    }

    // 3. delete - entity deletions need to be in reverse commit order
    for (const name of commitOrderReversed) {
      await this.commitDeleteChangeSets(groups[ChangeSetType.DELETE][name] ?? [], tx);
    }

    // 4. extra updates
    const extraUpdates: ChangeSet<any>[] = [];

    for (const extraUpdate of this.extraUpdates) {
      extraUpdate[0][extraUpdate[1]] = extraUpdate[2];
      const changeSet = this.changeSetComputer.computeChangeSet(extraUpdate[0])!;

      if (changeSet) {
        extraUpdates.push(changeSet);
      }
    }

    await this.commitUpdateChangeSets(extraUpdates, tx);

    // 5. collection updates
    for (const coll of this.collectionUpdates) {
      await this.em.getDriver().syncCollection(coll, tx);
      coll.takeSnapshot();
    }
  }

  private async commitCreateChangeSets<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    if (changeSets.length === 0) {
      return;
    }

    for (const changeSet of changeSets) {
      Object.values<EntityProperty>(changeSet.entity.__helper!.__meta.properties)
        .filter(prop => (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner) || prop.reference === ReferenceType.MANY_TO_ONE)
        .filter(prop => changeSet.entity[prop.name])
        .forEach(prop => {
          const cs = this.changeSets.find(cs => cs.entity === Reference.unwrapReference(changeSet.entity[prop.name]));
          const isScheduledForInsert = cs && cs.type === ChangeSetType.CREATE && !cs.persisted;

          if (isScheduledForInsert) {
            this.extraUpdates.add([changeSet.entity, prop.name, changeSet.entity[prop.name]]);
            delete changeSet.entity[prop.name];
            delete changeSet.payload[prop.name];
          }
        });

      const copy = Utils.prepareEntity(changeSet.entity, this.metadata, this.platform) as T;
      await this.runHooks(EventType.beforeCreate, changeSet);
      Object.assign(changeSet.payload, Utils.diffEntities<T>(copy, changeSet.entity, this.metadata, this.platform));
    }

    await this.changeSetPersister.executeInserts(changeSets, ctx);

    for (const changeSet of changeSets) {
      this.em.merge(changeSet.entity as T, true);
      await this.runHooks(EventType.afterCreate, changeSet);
    }
  }

  private async commitUpdateChangeSets<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    if (changeSets.length === 0) {
      return;
    }

    for (const changeSet of changeSets) {
      const copy = Utils.prepareEntity(changeSet.entity, this.metadata, this.platform) as T;
      await this.runHooks(EventType.beforeUpdate, changeSet);
      Object.assign(changeSet.payload, Utils.diffEntities<T>(copy, changeSet.entity, this.metadata, this.platform));
    }

    await this.changeSetPersister.executeUpdates(changeSets, ctx);

    for (const changeSet of changeSets) {
      this.merge(changeSet.entity as T);
      await this.runHooks(EventType.afterUpdate, changeSet);
    }
  }

  private async commitDeleteChangeSets<T extends AnyEntity<T>>(changeSets: ChangeSet<T>[], ctx?: Transaction): Promise<void> {
    if (changeSets.length === 0) {
      return;
    }

    for (const changeSet of changeSets) {
      const copy = Utils.prepareEntity(changeSet.entity, this.metadata, this.platform) as T;
      await this.runHooks(EventType.beforeDelete, changeSet);
      Object.assign(changeSet.payload, Utils.diffEntities<T>(copy, changeSet.entity, this.metadata, this.platform));
    }

    await this.changeSetPersister.executeDeletes(changeSets, ctx);

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
      group[cs.name] = group[cs.name] ?? [];
      group[cs.name].push(cs);
    });

    return groups;
  }

  private getCommitOrder(): string[] {
    const calc = new CommitOrderCalculator();
    const types = Utils.unique(this.changeSets.map(cs => cs.name));
    types.forEach(entityName => calc.addNode(entityName));
    let entityName = types.pop();

    while (entityName) {
      for (const prop of Object.values<EntityProperty>(this.metadata.find(entityName)!.properties)) {
        if (!calc.hasNode(prop.type)) {
          continue;
        }

        this.addCommitDependency(calc, prop, entityName);
      }

      entityName = types.pop();
    }

    return calc.sort();
  }

  private addCommitDependency(calc: CommitOrderCalculator, prop: EntityProperty, entityName: string): void {
    if (!(prop.reference === ReferenceType.ONE_TO_ONE && prop.owner) && prop.reference !== ReferenceType.MANY_TO_ONE) {
      return;
    }

    calc.addDependency(prop.type, entityName, prop.nullable ? 0 : 1);
  }

}
