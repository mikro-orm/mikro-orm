import { EntityData, EntityMetadata, EntityProperty, FilterQuery, HookType, AnyEntity, Primary } from '../types';
import { Cascade, Collection, EntityIdentifier, Reference, ReferenceType, wrap } from '../entity';
import { ChangeSetComputer } from './ChangeSetComputer';
import { ChangeSetPersister } from './ChangeSetPersister';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { EntityManager } from '../EntityManager';
import { Utils, ValidationError } from '../utils';
import { IPrimaryKey, LockMode, Transaction } from '..';

export class UnitOfWork {

  /** map of references to managed entities */
  private readonly identityMap = Object.create(null) as Record<string, AnyEntity>;

  /** holds copy of identity map so we can compute changes when persisting managed entities */
  private readonly originalEntityData = Object.create(null) as Record<string, EntityData<AnyEntity>>;

  /** map of wrapped primary keys so we can compute change set without eager commit */
  private readonly identifierMap = Object.create(null) as Record<string, EntityIdentifier>;

  private readonly persistStack: AnyEntity[] = [];
  private readonly removeStack: AnyEntity[] = [];
  private readonly orphanRemoveStack: AnyEntity[] = [];
  private readonly changeSets: ChangeSet<AnyEntity>[] = [];
  private readonly extraUpdates: [AnyEntity, string, AnyEntity | Reference<AnyEntity>][] = [];
  private readonly metadata = this.em.getMetadata();
  private readonly platform = this.em.getDriver().getPlatform();
  private readonly changeSetComputer = new ChangeSetComputer(this.em.getValidator(), this.originalEntityData, this.identifierMap, this.metadata);
  private readonly changeSetPersister = new ChangeSetPersister(this.em.getDriver(), this.identifierMap, this.metadata);

  constructor(private readonly em: EntityManager) { }

  merge<T extends AnyEntity<T>>(entity: T, visited: AnyEntity[] = [], mergeData = true): void {
    const wrapped = wrap(entity);

    if (!wrapped.__primaryKey) {
      return;
    }

    this.identityMap[`${wrapped.constructor.name}-${wrapped.__serializedPrimaryKey}`] = wrapped;

    if (!this.originalEntityData[wrapped.__uuid] || mergeData) {
      this.originalEntityData[wrapped.__uuid] = Utils.prepareEntity(entity, this.metadata);
    }

    this.cascade(entity, Cascade.MERGE, visited);
  }

  getById<T extends AnyEntity<T>>(entityName: string, id: Primary<T>): T {
    const token = `${entityName}-${this.platform.normalizePrimaryKey(id as IPrimaryKey)}`;
    return this.identityMap[token] as T;
  }

  tryGetById<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>): T | null {
    const pk = Utils.extractPK(where, this.metadata.get(entityName));

    if (!pk) {
      return null;
    }

    return this.getById<T>(entityName, pk);
  }

  getIdentityMap(): Record<string, AnyEntity> {
    return this.identityMap;
  }

  persist<T extends AnyEntity<T>>(entity: T, visited: AnyEntity[] = []): void {
    if (this.persistStack.includes(entity)) {
      return;
    }

    if (!wrap(entity).__primaryKey) {
      this.identifierMap[wrap(entity).__uuid] = new EntityIdentifier();
    }

    this.persistStack.push(entity);
    this.cleanUpStack(this.removeStack, entity);
    this.cascade(entity, Cascade.PERSIST, visited);
  }

  remove(entity: AnyEntity, visited: AnyEntity[] = []): void {
    if (this.removeStack.includes(entity)) {
      return;
    }

    if (wrap(entity).__primaryKey) {
      this.removeStack.push(entity);
    }

    this.cleanUpStack(this.persistStack, entity);
    this.unsetIdentity(entity);
    this.cascade(entity, Cascade.REMOVE, visited);
  }

  async commit(): Promise<void> {
    this.computeChangeSets();

    if (this.changeSets.length === 0) {
      return this.postCommitCleanup(); // nothing to do, do not start transaction
    }

    const runInTransaction = !this.em.isInTransaction() && this.em.getDriver().getPlatform().supportsTransactions();
    const promise = async (tx: Transaction) => await Utils.runSerial(this.changeSets, changeSet => this.commitChangeSet(changeSet, tx));

    if (runInTransaction) {
      await this.em.getConnection('write').transactional(trx => promise(trx));
    } else {
      await promise(this.em.getTransactionContext());
    }

    this.postCommitCleanup();
  }

  async lock<T extends AnyEntity<T>>(entity: T, mode: LockMode, version?: number | Date): Promise<void> {
    if (!this.getById(entity.constructor.name, wrap(entity).__primaryKey as Primary<T>)) {
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
    delete this.identityMap[`${entity.constructor.name}-${wrap(entity).__serializedPrimaryKey}`];
    delete this.identifierMap[wrap(entity).__uuid];
    delete this.originalEntityData[wrap(entity).__uuid];
  }

  computeChangeSets(): void {
    this.changeSets.length = 0;

    Object.values(this.identityMap)
      .filter(entity => !this.removeStack.includes(entity) && !this.orphanRemoveStack.includes(entity))
      .forEach(entity => this.persist(entity));

    while (this.persistStack.length) {
      this.findNewEntities(this.persistStack.shift()!);
    }

    while (this.extraUpdates.length) {
      const extraUpdate = this.extraUpdates.shift()!;
      extraUpdate[0][extraUpdate[1]] = extraUpdate[2];
      const changeSet = this.changeSetComputer.computeChangeSet(extraUpdate[0])!;

      if (changeSet) {
        this.changeSets.push(changeSet);
      }
    }

    for (const entity of Object.values(this.orphanRemoveStack)) {
      this.remove(entity);
    }

    for (const entity of Object.values(this.removeStack)) {
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
    visited.push(entity);
    const meta = this.metadata.get<T>(entity.constructor.name);
    const wrapped = wrap(entity);

    if (!wrapped.__primaryKey && !this.identifierMap[wrapped.__uuid]) {
      this.identifierMap[wrapped.__uuid] = new EntityIdentifier();
    }

    for (const prop of Object.values<EntityProperty>(meta.properties)) {
      const reference = this.unwrapReference(entity, prop);
      this.processReference(entity, prop, reference, visited);
    }

    const changeSet = this.changeSetComputer.computeChangeSet<AnyEntity>(wrapped);

    if (changeSet) {
      this.changeSets.push(changeSet);
      this.cleanUpStack(this.persistStack, wrapped);
      this.originalEntityData[wrapped.__uuid] = Utils.prepareEntity(entity, this.metadata);
    }
  }

  private processReference<T extends AnyEntity<T>>(parent: T, prop: EntityProperty<T>, reference: any, visited: AnyEntity[]): void {
    const isToOne = prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE;

    if (isToOne && reference) {
      return this.processToOneReference(parent, prop, reference, visited);
    }

    if (Utils.isCollection(reference, prop, ReferenceType.MANY_TO_MANY) && reference.isDirty()) {
      this.processToManyReference(reference, visited, parent, prop);
    }
  }

  private processToOneReference<T extends AnyEntity<T>>(parent: T, prop: EntityProperty<T>, reference: any, visited: AnyEntity[]): void {
    if (!this.hasIdentifier(reference) && visited.includes(reference)) {
      this.extraUpdates.push([parent, prop.name, reference]);
      delete parent[prop.name];
    }

    if (!this.originalEntityData[reference.__uuid]) {
      this.findNewEntities(reference, visited);
    }
  }

  private processToManyReference<T extends AnyEntity<T>>(reference: Collection<AnyEntity>, visited: AnyEntity[], parent: T, prop: EntityProperty<T>): void {
    if (this.isCollectionSelfReferenced(reference, visited)) {
      this.extraUpdates.push([parent, prop.name, reference]);
      parent[prop.name as keyof T] = new Collection<AnyEntity>(parent) as unknown as T[keyof T];

      return;
    }

    reference.getItems()
      .filter(item => !this.originalEntityData[wrap(item).__uuid])
      .forEach(item => this.findNewEntities(item, visited));
  }

  private async commitChangeSet<T extends AnyEntity<T>>(changeSet: ChangeSet<T>, ctx: Transaction): Promise<void> {
    const type = changeSet.type.charAt(0).toUpperCase() + changeSet.type.slice(1);
    await this.runHooks(`before${type}` as HookType, changeSet.entity, changeSet.payload);
    await this.changeSetPersister.persistToDatabase(changeSet, ctx);

    switch (changeSet.type) {
      case ChangeSetType.CREATE: this.em.merge(changeSet.entity as T); break;
      case ChangeSetType.UPDATE: this.merge(changeSet.entity as T); break;
      case ChangeSetType.DELETE: this.unsetIdentity(changeSet.entity as T); break;
    }

    await this.runHooks(`after${type}` as HookType, changeSet.entity as T);
  }

  private async runHooks<T extends AnyEntity<T>>(type: HookType, entity: T, payload?: EntityData<T>) {
    const hooks = this.metadata.get<T>(entity.constructor.name).hooks;

    if (hooks && hooks[type] && hooks[type]!.length > 0) {
      const copy = Utils.copy(entity);
      await Utils.runSerial(hooks[type]!, hook => (entity[hook] as unknown as () => Promise<any>)());

      if (payload) {
        Object.assign(payload, Utils.diffEntities(copy, entity, this.metadata));
      }
    }
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
  }

  private hasIdentifier<T extends AnyEntity<T>>(entity: T): boolean {
    const pk = this.metadata.get<T>(entity.constructor.name).primaryKey;

    if (entity[pk]) {
      return true;
    }

    return this.identifierMap[wrap(entity).__uuid] && !!this.identifierMap[wrap(entity).__uuid].getValue();
  }

  private cascade<T extends AnyEntity<T>>(entity: T, type: Cascade, visited: AnyEntity[]): void {
    if (visited.includes(entity)) {
      return;
    }

    visited.push(entity);

    switch (type) {
      case Cascade.PERSIST: this.persist(entity, visited); break;
      case Cascade.MERGE: this.merge(entity, visited, false); break;
      case Cascade.REMOVE: this.remove(entity, visited); break;
    }

    const meta = this.metadata.get<T>(entity.constructor.name);

    for (const prop of Object.values<EntityProperty>(meta.properties)) {
      this.cascadeReference<T>(entity, prop, type, visited);
    }
  }

  private cascadeReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>, type: Cascade, visited: AnyEntity[]): void {
    this.fixMissingReference(entity, prop);

    if (!this.shouldCascade(prop, type)) {
      return;
    }

    const reference = this.unwrapReference(entity, prop);

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference) && reference) {
      return this.cascade(reference as T, type, visited);
    }

    const collection = reference as Collection<AnyEntity>;
    const requireFullyInitialized = type === Cascade.PERSIST; // only cascade persist needs fully initialized items

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference) && collection.isInitialized(requireFullyInitialized)) {
      collection.getItems().forEach(item => this.cascade(item, type, visited));
    }
  }

  private isCollectionSelfReferenced(collection: Collection<AnyEntity>, visited: AnyEntity[]): boolean {
    const filtered = collection.getItems().filter(item => !this.originalEntityData[wrap(item).__uuid]);
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

    const qb = this.em.createQueryBuilder(entity.constructor.name);
    await qb.select('1').where({ [wrap(entity).__meta.primaryKey]: wrap(entity).__primaryKey }).setLockMode(mode).execute();
  }

  private async lockOptimistic<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, version: number | Date): Promise<void> {
    if (!meta.versionProperty) {
      throw ValidationError.notVersioned(meta);
    }

    if (!Utils.isDefined<number | Date>(version)) {
      return;
    }

    if (!wrap(entity).isInitialized()) {
      await wrap(entity).init();
    }

    const previousVersion = entity[meta.versionProperty] as unknown as Date | number;

    if (previousVersion !== version) {
      throw ValidationError.lockFailedVersionMismatch(entity, version, previousVersion);
    }
  }

  private fixMissingReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>): void {
    const reference = this.unwrapReference(entity, prop);

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference) && reference && !Utils.isEntity(reference)) {
      entity[prop.name] = this.em.getReference<T[string & keyof T]>(prop.type, reference as Primary<T[string & keyof T]>);
    }

    const isCollection = [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference);

    if (isCollection && Array.isArray(reference)) {
      const collection = new Collection<AnyEntity>(entity);
      entity[prop.name as keyof T] = collection as unknown as T[keyof T];
      collection.set(reference as AnyEntity[]);
      collection.setDirty();
    }
  }

  private unwrapReference<T extends AnyEntity<T>, U extends AnyEntity | Reference<T> | Collection<AnyEntity> | Primary<T> | (AnyEntity | Primary<T>)[]>(entity: T, prop: EntityProperty<T>): U {
    const reference = entity[prop.name] as U;

    if (reference instanceof Reference) {
      return reference.unwrap();
    }

    return reference;
  }

}
