import { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityProperty, FilterQuery, Primary } from '../typings';
import { Cascade, Collection, EntityIdentifier, Reference, ReferenceType, wrap } from '../entity';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { ChangeSetComputer, ChangeSetPersister, CommitOrderCalculator } from './index';
import { EntityManager, EventType } from '../index';
import { Utils, ValidationError } from '../utils';
import { LockMode } from './enums';
import { Transaction } from '../connections';

export class UnitOfWork {

  /** map of references to managed entities */
  private readonly identityMap = Object.create(null) as Dictionary<AnyEntity>;

  /** holds copy of identity map so we can compute changes when persisting managed entities */
  private readonly originalEntityData = Object.create(null) as Dictionary<EntityData<AnyEntity>>;

  /** map of wrapped primary keys so we can compute change set without eager commit */
  private readonly identifierMap = Object.create(null) as Dictionary<EntityIdentifier>;

  private readonly persistStack: AnyEntity[] = [];
  private readonly removeStack: AnyEntity[] = [];
  private readonly orphanRemoveStack: AnyEntity[] = [];
  private readonly changeSets: ChangeSet<AnyEntity>[] = [];
  private readonly collectionUpdates: Collection<AnyEntity>[] = [];
  private readonly extraUpdates: [AnyEntity, string, AnyEntity | Reference<AnyEntity>][] = [];
  private readonly metadata = this.em.getMetadata();
  private readonly platform = this.em.getDriver().getPlatform();
  private readonly changeSetComputer = new ChangeSetComputer(this.em.getValidator(), this.originalEntityData, this.identifierMap, this.collectionUpdates, this.removeStack, this.metadata, this.platform);
  private readonly changeSetPersister = new ChangeSetPersister(this.em.getDriver(), this.identifierMap, this.metadata);
  private working = false;

  constructor(private readonly em: EntityManager) { }

  merge<T extends AnyEntity<T>>(entity: T, visited: AnyEntity[] = [], mergeData = true): void {
    const wrapped = wrap(entity, true);
    wrapped.__em = this.em;

    if (!Utils.isDefined(wrapped.__primaryKey, true)) {
      return;
    }

    const root = Utils.getRootEntity(this.metadata, wrapped.__meta);
    this.identityMap[`${root.name}-${wrapped.__serializedPrimaryKey}`] = entity;

    if (mergeData || !this.originalEntityData[wrapped.__uuid]) {
      this.originalEntityData[wrapped.__uuid] = Utils.prepareEntity(entity, this.metadata, this.platform);
    }

    this.cascade(entity, Cascade.MERGE, visited, { mergeData: false });
  }

  /**
   * Returns entity from the identity map. For composite keys, you need to pass an array of PKs in the same order as they are defined in `meta.primaryKeys`.
   */
  getById<T extends AnyEntity<T>>(entityName: string, id: Primary<T> | Primary<T>[]): T {
    const root = Utils.getRootEntity(this.metadata, this.metadata.get(entityName));
    const hash = Utils.getPrimaryKeyHash(Utils.asArray(id) as string[]);
    const token = `${root.name}-${hash}`;

    return this.identityMap[token] as T;
  }

  tryGetById<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, strict = true): T | null {
    const pk = Utils.extractPK(where, this.metadata.get<T>(entityName), strict);

    if (!pk) {
      return null;
    }

    return this.getById<T>(entityName, pk);
  }

  getIdentityMap(): Dictionary<AnyEntity> {
    return this.identityMap;
  }

  getOriginalEntityData(): Dictionary<EntityData<AnyEntity>> {
    return this.originalEntityData;
  }

  getPersistStack(): AnyEntity[] {
    return this.persistStack;
  }

  getRemoveStack(): AnyEntity[] {
    return this.removeStack;
  }

  getChangeSets(): ChangeSet<AnyEntity>[] {
    return this.changeSets;
  }

  computeChangeSet<T>(entity: T): void {
    const cs = this.changeSetComputer.computeChangeSet(entity);

    if (!cs) {
      return;
    }

    const wrapped = wrap(entity, true);
    this.initIdentifier(entity);
    this.changeSets.push(cs);
    this.cleanUpStack(this.persistStack, entity);
    this.originalEntityData[wrapped.__uuid] = Utils.prepareEntity(entity, this.metadata, this.platform);
  }

  recomputeSingleChangeSet<T>(entity: T): void {
    const idx = this.changeSets.findIndex(cs => cs.entity === entity);

    if (idx === -1) {
      return;
    }

    const cs = this.changeSetComputer.computeChangeSet(entity);

    if (cs) {
      Object.assign(this.changeSets[idx].payload, cs.payload);
      const uuid = wrap(entity, true).__uuid;
      this.originalEntityData[uuid] = Utils.prepareEntity(entity, this.metadata, this.platform);
    }
  }

  persist<T extends AnyEntity<T>>(entity: T, visited: AnyEntity[] = [], checkRemoveStack = false): void {
    if (this.persistStack.includes(entity)) {
      return;
    }

    if (checkRemoveStack && this.removeStack.includes(entity)) {
      return;
    }

    if (!Utils.isDefined(wrap(entity, true).__primaryKey, true)) {
      this.identifierMap[wrap(entity, true).__uuid] = new EntityIdentifier();
    }

    this.persistStack.push(entity);
    this.cleanUpStack(this.removeStack, entity);
    this.cascade(entity, Cascade.PERSIST, visited, { checkRemoveStack });
  }

  remove(entity: AnyEntity, visited: AnyEntity[] = []): void {
    if (this.removeStack.includes(entity)) {
      return;
    }

    if (wrap(entity, true).__primaryKey) {
      this.removeStack.push(entity);
    }

    this.cleanUpStack(this.persistStack, entity);
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
    if (this.changeSets.length === 0 && this.collectionUpdates.length === 0 && this.extraUpdates.length === 0) {
      await this.em.getEventManager().dispatchEvent(EventType.afterFlush, { em: this.em, uow: this });
      this.postCommitCleanup();

      return;
    }

    this.reorderChangeSets();
    const platform = this.em.getDriver().getPlatform();
    const runInTransaction = !this.em.isInTransaction() && platform.supportsTransactions() && this.em.config.get('implicitTransactions');

    if (runInTransaction) {
      await this.em.getConnection('write').transactional(trx => this.persistToDatabase(trx));
    } else {
      await this.persistToDatabase(this.em.getTransactionContext());
    }

    await this.em.getEventManager().dispatchEvent(EventType.afterFlush, { em: this.em, uow: this });
    this.postCommitCleanup();
  }

  async lock<T extends AnyEntity<T>>(entity: T, mode: LockMode, version?: number | Date): Promise<void> {
    if (!this.getById(entity.constructor.name, wrap(entity, true).__primaryKeys)) {
      throw ValidationError.entityNotManaged(entity);
    }

    const meta = this.metadata.get<T>(entity.constructor.name);

    if (mode === LockMode.OPTIMISTIC) {
      await this.lockOptimistic(entity, meta, version!);
    } else if ([LockMode.NONE, LockMode.PESSIMISTIC_READ, LockMode.PESSIMISTIC_WRITE].includes(mode)) {
      await this.lockPessimistic(entity, mode);
    }
  }

  clear(): void {
    Object.keys(this.identityMap).forEach(key => delete this.identityMap[key]);
    Object.keys(this.originalEntityData).forEach(key => delete this.originalEntityData[key]);
    this.postCommitCleanup();
  }

  unsetIdentity(entity: AnyEntity): void {
    const wrapped = wrap(entity, true);
    const root = Utils.getRootEntity(this.metadata, wrapped.__meta);
    delete this.identityMap[`${root.name}-${wrapped.__serializedPrimaryKey}`];
    delete this.identifierMap[wrapped.__uuid];
    delete this.originalEntityData[wrapped.__uuid];
  }

  computeChangeSets(): void {
    this.changeSets.length = 0;

    Object.values(this.identityMap)
      .filter(entity => !this.removeStack.includes(entity) && !this.orphanRemoveStack.includes(entity))
      .forEach(entity => this.persist(entity, [], true));

    while (this.persistStack.length) {
      this.findNewEntities(this.persistStack.shift()!);
    }

    for (const entity of Object.values(this.orphanRemoveStack)) {
      this.remove(entity);
    }

    for (const entity of this.removeStack) {
      const meta = this.metadata.get(entity.constructor.name);
      this.changeSets.push({ entity, type: ChangeSetType.DELETE, name: meta.name, collection: meta.collection, payload: {} } as ChangeSet<AnyEntity>);
    }
  }

  scheduleOrphanRemoval(entity: AnyEntity): void {
    this.orphanRemoveStack.push(entity);
  }

  cancelOrphanRemoval(entity: AnyEntity): void {
    this.cleanUpStack(this.orphanRemoveStack, entity);
  }

  private findNewEntities<T extends AnyEntity<T>>(entity: T, visited: AnyEntity[] = []): void {
    if (visited.includes(entity)) {
      return;
    }

    visited.push(entity);
    const wrapped = wrap(entity, true);

    if (!wrapped.isInitialized() || this.removeStack.includes(entity) || this.orphanRemoveStack.includes(entity)) {
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
      this.cleanUpStack(this.persistStack, entity);
      this.originalEntityData[wrapped.__uuid] = Utils.prepareEntity(entity, this.metadata, this.platform);
    }
  }

  private initIdentifier<T>(entity: T): void {
    const wrapped = wrap(entity, true);

    if (Utils.isDefined(wrapped.__primaryKey, true) || this.identifierMap[wrapped.__uuid]) {
      return;
    }

    this.identifierMap[wrapped.__uuid] = new EntityIdentifier();
  }

  private processReference<T extends AnyEntity<T>>(parent: T, prop: EntityProperty<T>, reference: any, visited: AnyEntity[]): void {
    const isToOne = prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE;

    if (isToOne && reference) {
      return this.processToOneReference(reference, visited);
    }

    if (Utils.isCollection<any>(reference, prop, ReferenceType.MANY_TO_MANY) && reference.isDirty()) {
      this.processToManyReference(reference, visited, parent, prop);
    }
  }

  private processToOneReference<T extends AnyEntity<T>>(reference: any, visited: AnyEntity[]): void {
    if (!this.originalEntityData[wrap(reference, true).__uuid]) {
      this.findNewEntities(reference, visited);
    }
  }

  private processToManyReference<T extends AnyEntity<T>>(reference: Collection<AnyEntity>, visited: AnyEntity[], parent: T, prop: EntityProperty<T>): void {
    if (this.isCollectionSelfReferenced(reference, visited)) {
      this.extraUpdates.push([parent, prop.name, reference]);
      parent[prop.name as keyof T] = new Collection<AnyEntity>(parent) as unknown as T[keyof T];

      return;
    }

    reference.getItems(false)
      .filter(item => !this.originalEntityData[wrap(item, true).__uuid])
      .forEach(item => this.findNewEntities(item, visited));
  }

  private async commitChangeSet<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, ctx?: Transaction): Promise<void> {
    if (changeSet.type === ChangeSetType.CREATE) {
      Object.values<EntityProperty>(wrap(changeSet.entity, true).__meta.properties)
        .filter(prop => (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner) || prop.reference === ReferenceType.MANY_TO_ONE)
        .filter(prop => changeSet.entity[prop.name])
        .forEach(prop => {
          const cs = this.changeSets.find(cs => cs.entity === Reference.unwrapReference(changeSet.entity[prop.name]));
          const isScheduledForInsert = cs && cs.type === ChangeSetType.CREATE && !cs.persisted;

          if (isScheduledForInsert) {
            this.extraUpdates.push([changeSet.entity, prop.name, changeSet.entity[prop.name]]);
            delete changeSet.entity[prop.name];
            delete changeSet.payload[prop.name];
          }
        });
    }

    const type = changeSet.type.charAt(0).toUpperCase() + changeSet.type.slice(1);
    const copy = Utils.prepareEntity(changeSet.entity, this.metadata, this.platform) as T;
    await this.runHooks(`before${type}` as EventType, changeSet);
    Object.assign(changeSet.payload, Utils.diffEntities<T>(copy, changeSet.entity, this.metadata, this.platform));
    await this.changeSetPersister.persistToDatabase(changeSet, ctx);

    switch (changeSet.type) {
      case ChangeSetType.CREATE: this.em.merge(changeSet.entity as T, true); break;
      case ChangeSetType.UPDATE: this.merge(changeSet.entity as T); break;
      case ChangeSetType.DELETE: this.unsetIdentity(changeSet.entity as T); break;
    }

    await this.runHooks(`after${type}` as EventType, changeSet);
  }

  private async runHooks<T extends AnyEntity<T>>(type: EventType, changeSet: ChangeSet<T>) {
    await this.em.getEventManager().dispatchEvent(type, { entity: changeSet.entity, em: this.em, changeSet });
  }

  /**
   * clean up persist/remove stack from previous persist/remove calls for this entity done before flushing
   */
  private cleanUpStack(stack: AnyEntity[], entity: AnyEntity): void {
    for (const index in stack) {
      if (stack[index] === entity) {
        stack.splice(+index, 1);
      }
    }
  }

  private postCommitCleanup(): void {
    Object.keys(this.identifierMap).forEach(key => delete this.identifierMap[key]);
    this.persistStack.length = 0;
    this.removeStack.length = 0;
    this.orphanRemoveStack.length = 0;
    this.changeSets.length = 0;
    this.collectionUpdates.length = 0;
    this.extraUpdates.length = 0;
    this.working = false;
  }

  private cascade<T extends AnyEntity<T>>(entity: T, type: Cascade, visited: AnyEntity[], options: { checkRemoveStack?: boolean; mergeData?: boolean } = {}): void {
    if (visited.includes(entity)) {
      return;
    }

    visited.push(entity);

    switch (type) {
      case Cascade.PERSIST: this.persist(entity, visited, options.checkRemoveStack); break;
      case Cascade.MERGE: this.merge(entity, visited, options.mergeData); break;
      case Cascade.REMOVE: this.remove(entity, visited); break;
    }

    const meta = this.metadata.get<T>(entity.constructor.name);

    for (const prop of Object.values<EntityProperty>(meta.properties).filter(prop => prop.reference !== ReferenceType.SCALAR)) {
      this.cascadeReference<T>(entity, prop, type, visited, options);
    }
  }

  private cascadeReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>, type: Cascade, visited: AnyEntity[], options: { checkRemoveStack?: boolean; mergeData?: boolean }): void {
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
        .filter(item => !requireFullyInitialized || wrap(item, true).isInitialized())
        .forEach(item => this.cascade(item, type, visited, options));
    }
  }

  private isCollectionSelfReferenced(collection: Collection<AnyEntity>, visited: AnyEntity[]): boolean {
    const filtered = collection.getItems(false).filter(item => !this.originalEntityData[wrap(item, true).__uuid]);
    return filtered.some(items => visited.includes(items));
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
      throw ValidationError.notVersioned(meta);
    }

    if (!Utils.isDefined<number | Date>(version)) {
      return;
    }

    if (!wrap(entity, true).isInitialized()) {
      await wrap(entity, true).init();
    }

    const previousVersion = entity[meta.versionProperty] as unknown as Date | number;

    if (previousVersion !== version) {
      throw ValidationError.lockFailedVersionMismatch(entity, version, previousVersion);
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

  private async persistToDatabase(tx?: Transaction): Promise<void> {
    for (const changeSet of this.changeSets) {
      await this.commitChangeSet(changeSet, tx);
    }

    while (this.extraUpdates.length) {
      const extraUpdate = this.extraUpdates.shift()!;
      extraUpdate[0][extraUpdate[1]] = extraUpdate[2];
      const changeSet = this.changeSetComputer.computeChangeSet(extraUpdate[0])!;

      if (changeSet) {
        await this.commitChangeSet(changeSet, tx);
      }
    }

    for (const coll of this.collectionUpdates) {
      await this.em.getDriver().syncCollection(coll, tx);
      coll.takeSnapshot();
    }
  }

  /**
   * Orders change sets so FK constrains are maintained, ensures stable order (needed for node < 11)
   */
  private reorderChangeSets() {
    const commitOrder = this.getCommitOrder();
    const commitOrderReversed = [...commitOrder].reverse();
    const typeOrder = [ChangeSetType.CREATE, ChangeSetType.UPDATE, ChangeSetType.DELETE];
    const compare = <T, K extends keyof T>(base: T[], arr: T[K][], a: T, b: T, key: K) => {
      if (arr.indexOf(a[key]) === arr.indexOf(b[key])) {
        return base.indexOf(a) - base.indexOf(b); // ensure stable order
      }

      return arr.indexOf(a[key]) - arr.indexOf(b[key]);
    };

    const copy = this.changeSets.slice(); // make copy to maintain commitOrder
    this.changeSets.sort((a, b) => {
      if (a.type !== b.type) {
        return compare(copy, typeOrder, a, b, 'type');
      }

      // Entity deletions come last and need to be in reverse commit order
      if (a.type === ChangeSetType.DELETE) {
        return compare(copy, commitOrderReversed, a, b, 'name');
      }

      return compare(copy, commitOrder, a, b, 'name');
    });
  }

  private getCommitOrder(): string[] {
    const calc = new CommitOrderCalculator();
    const types = Utils.unique(this.changeSets.map(cs => cs.name));
    types.forEach(entityName => calc.addNode(entityName));
    let entityName = types.pop();

    while (entityName) {
      for (const prop of Object.values<EntityProperty>(this.metadata.get(entityName).properties)) {
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
