import { EntityData, EntityMetadata, EntityProperty, IEntity, IEntityType, IPrimaryKey } from '../decorators';
import { MetadataStorage } from '../metadata';
import { Cascade, Collection, EntityIdentifier, ReferenceType } from '../entity';
import { ChangeSetComputer } from './ChangeSetComputer';
import { ChangeSetPersister } from './ChangeSetPersister';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { EntityManager } from '../EntityManager';
import { Utils, ValidationError } from '../utils';
import { FilterQuery, LockMode } from '..';

export class UnitOfWork {

  /** map of references to managed entities */
  private readonly identityMap = {} as Record<string, IEntity>;

  /** holds copy of identity map so we can compute changes when persisting managed entities */
  private readonly originalEntityData = {} as Record<string, EntityData<IEntity>>;

  /** map of wrapped primary keys so we can compute change set without eager commit */
  private readonly identifierMap = {} as Record<string, EntityIdentifier>;

  private readonly persistStack: IEntity[] = [];
  private readonly removeStack: IEntity[] = [];
  private readonly orphanRemoveStack: IEntity[] = [];
  private readonly changeSets: ChangeSet<IEntity>[] = [];
  private readonly extraUpdates: [IEntityType<IEntity>, string & keyof IEntity, IEntityType<IEntity> | Collection<IEntity>][] = [];
  private readonly metadata = MetadataStorage.getMetadata();
  private readonly platform = this.em.getDriver().getPlatform();
  private readonly changeSetComputer = new ChangeSetComputer(this.em.getValidator(), this.originalEntityData, this.identifierMap);
  private readonly changeSetPersister = new ChangeSetPersister(this.em.getDriver(), this.identifierMap);

  constructor(private readonly em: EntityManager) { }

  merge<T extends IEntityType<T>>(entity: T, visited: IEntity[] = [], mergeData = true): void {
    if (!entity.__primaryKey) {
      return;
    }

    this.identityMap[`${entity.constructor.name}-${entity.__serializedPrimaryKey}`] = entity;

    if (!this.originalEntityData[entity.__uuid] || mergeData) {
      this.originalEntityData[entity.__uuid] = Utils.prepareEntity(entity);
    }

    this.cascade(entity, Cascade.MERGE, visited);
  }

  getById<T extends IEntityType<T>>(entityName: string, id: IPrimaryKey): T {
    const token = `${entityName}-${this.platform.normalizePrimaryKey(id)}`;
    return this.identityMap[token] as T;
  }

  tryGetById<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey): T | null {
    const pk = Utils.extractPK(where, this.metadata[entityName]);

    if (!pk) {
      return null;
    }

    return this.getById<T>(entityName, pk);
  }

  getIdentityMap(): Record<string, IEntity> {
    return this.identityMap;
  }

  persist<T extends IEntityType<T>>(entity: T, visited: IEntity[] = []): void {
    if (this.persistStack.includes(entity)) {
      return;
    }

    if (!entity.__primaryKey) {
      this.identifierMap[entity.__uuid] = new EntityIdentifier();
    }

    this.persistStack.push(entity);
    this.cleanUpStack(this.removeStack, entity);
    this.cascade(entity, Cascade.PERSIST, visited);
  }

  remove(entity: IEntity, visited: IEntity[] = []): void {
    if (this.removeStack.includes(entity)) {
      return;
    }

    if (entity.__primaryKey) {
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

    const driver = this.em.getDriver();
    const runInTransaction = !driver.isInTransaction() && driver.getPlatform().supportsTransactions();
    const promise = Utils.runSerial(this.changeSets, changeSet => this.commitChangeSet(changeSet));

    if (runInTransaction) {
      await driver.transactional(() => promise);
    } else {
      await promise;
    }

    this.postCommitCleanup();
  }

  async lock<T extends IEntityType<T>>(entity: T, mode: LockMode, version?: number | Date): Promise<void> {
    if (!this.getById(entity.constructor.name, entity.__primaryKey)) {
      throw ValidationError.entityNotManaged(entity);
    }

    const meta = this.metadata[entity.constructor.name] as EntityMetadata<T>;

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

  unsetIdentity(entity: IEntity): void {
    delete this.identityMap[`${entity.constructor.name}-${entity.__serializedPrimaryKey}`];
    delete this.identifierMap[entity.__uuid];
    delete this.originalEntityData[entity.__uuid];
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
      this.changeSets.push(changeSet);
    }

    for (const entity of Object.values(this.orphanRemoveStack)) {
      this.remove(entity);
    }

    for (const entity of Object.values(this.removeStack)) {
      const meta = this.metadata[entity.constructor.name];
      this.changeSets.push({ entity, type: ChangeSetType.DELETE, name: meta.name, collection: meta.collection, payload: {} } as ChangeSet<IEntity>);
    }
  }

  scheduleOrphanRemoval(entity: IEntity): void {
    this.orphanRemoveStack.push(entity);
  }

  cancelOrphanRemoval(entity: IEntity): void {
    this.cleanUpStack(this.orphanRemoveStack, entity);
  }

  private findNewEntities<T extends IEntityType<T>>(entity: T, visited: IEntity[] = []): void {
    visited.push(entity);
    const meta = this.metadata[entity.constructor.name] as EntityMetadata<T>;

    if (!entity.__primaryKey && !this.identifierMap[entity.__uuid]) {
      this.identifierMap[entity.__uuid] = new EntityIdentifier();
    }

    for (const prop of Object.values(meta.properties)) {
      const reference = entity[prop.name as keyof T];
      this.processReference(entity, prop, reference, visited);
    }

    const changeSet = this.changeSetComputer.computeChangeSet(entity);

    if (changeSet) {
      this.changeSets.push(changeSet);
      this.cleanUpStack(this.persistStack, entity);
      this.originalEntityData[entity.__uuid] = Utils.prepareEntity(entity);
    }
  }

  private processReference<T extends IEntityType<T>>(parent: T, prop: EntityProperty<T>, reference: any, visited: IEntity[]): void {
    const isToOne = prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE;

    if (isToOne && reference) {
      return this.processToOneReference(parent, prop, reference, visited);
    }

    if (Utils.isCollection(reference, prop, ReferenceType.MANY_TO_MANY) && reference.isDirty()) {
      this.processToManyReference(reference, visited, parent, prop);
    }
  }

  private processToOneReference<T extends IEntityType<T>>(parent: T, prop: EntityProperty<T>, reference: any, visited: IEntity[]): void {
    if (!this.hasIdentifier(reference) && visited.includes(reference)) {
      this.extraUpdates.push([parent, prop.name as keyof IEntity, reference]);
      delete parent[prop.name as keyof T];
    }

    if (!this.originalEntityData[reference.__uuid]) {
      this.findNewEntities(reference, visited);
    }
  }

  private processToManyReference<T extends IEntityType<T>>(reference: Collection<IEntity>, visited: IEntity[], parent: T, prop: EntityProperty<T>): void {
    if (this.isCollectionSelfReferenced(reference, visited)) {
      this.extraUpdates.push([parent, prop.name as keyof IEntity, reference]);
      parent[prop.name] = new Collection<IEntity>(parent) as T[keyof T];

      return;
    }

    reference.getItems()
      .filter(item => !this.originalEntityData[item.__uuid])
      .forEach(item => this.findNewEntities(item, visited));
  }

  private async commitChangeSet<T extends IEntityType<T>>(changeSet: ChangeSet<T>): Promise<void> {
    const type = changeSet.type.charAt(0).toUpperCase() + changeSet.type.slice(1);
    await this.runHooks(`before${type}`, changeSet.entity, changeSet.payload);
    await this.changeSetPersister.persistToDatabase(changeSet);

    switch (changeSet.type) {
      case ChangeSetType.CREATE: this.em.merge(changeSet.entity); break;
      case ChangeSetType.UPDATE: this.merge(changeSet.entity); break;
      case ChangeSetType.DELETE: this.unsetIdentity(changeSet.entity); break;
    }

    await this.runHooks(`after${type}`, changeSet.entity);
  }

  private async runHooks<T extends IEntityType<T>>(type: string, entity: IEntityType<T>, payload?: EntityData<T>) {
    const hooks = this.metadata[entity.constructor.name].hooks;

    if (hooks && hooks[type] && hooks[type].length > 0) {
      const copy = Utils.copy(entity);
      await Utils.runSerial(hooks[type], hook => entity[hook as keyof T]());

      if (payload) {
        Object.assign(payload, Utils.diffEntities(copy, entity));
      }
    }
  }

  /**
   * clean up persist/remove stack from previous persist/remove calls for this entity done before flushing
   */
  private cleanUpStack(stack: IEntity[], entity: IEntity): void {
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

  private hasIdentifier<T extends IEntityType<T>>(entity: T): boolean {
    const pk = this.metadata[entity.constructor.name].primaryKey as keyof T;

    if (entity[pk]) {
      return true;
    }

    return this.identifierMap[entity.__uuid] && this.identifierMap[entity.__uuid].getValue();
  }

  private cascade<T extends IEntityType<T>>(entity: T, type: Cascade, visited: IEntity[]): void {
    if (visited.includes(entity)) {
      return;
    }

    visited.push(entity);

    switch (type) {
      case Cascade.PERSIST: this.persist(entity, visited); break;
      case Cascade.MERGE: this.merge(entity, visited, false); break;
      case Cascade.REMOVE: this.remove(entity, visited); break;
    }

    const meta = this.metadata[entity.constructor.name];

    for (const prop of Object.values(meta.properties)) {
      this.cascadeReference<T>(entity, prop, type, visited);
    }
  }

  private cascadeReference<T extends IEntityType<T>>(entity: T, prop: EntityProperty, type: Cascade, visited: IEntity[]): void {
    if (!this.shouldCascade(prop, type)) {
      return;
    }

    if ((prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) && entity[prop.name as keyof T]) {
      return this.cascade(entity[prop.name as keyof T], type, visited);
    }

    const collection = entity[prop.name as keyof T] as Collection<IEntity>;
    const requireFullyInitialized = type === Cascade.PERSIST; // only cascade persist needs fully initialized items

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference) && collection.isInitialized(requireFullyInitialized)) {
      collection.getItems().forEach(item => this.cascade(item, type, visited));
    }
  }

  private isCollectionSelfReferenced(collection: Collection<IEntity>, visited: IEntity[]): boolean {
    const filtered = collection.getItems().filter(item => !this.originalEntityData[item.__uuid]);
    return filtered.some(items => visited.includes(items));
  }

  private shouldCascade(prop: EntityProperty, type: Cascade): boolean {
    if (type === Cascade.REMOVE && prop.orphanRemoval) {
      return true;
    }

    return prop.cascade && (prop.cascade.includes(type) || prop.cascade.includes(Cascade.ALL));
  }

  private async lockPessimistic<T extends IEntityType<T>>(entity: T, mode: LockMode): Promise<void> {
    if (!this.em.getDriver().isInTransaction()) {
      throw ValidationError.transactionRequired();
    }

    const qb = this.em.createQueryBuilder(entity.constructor.name);
    await qb.select('1').where({ [entity.__primaryKeyField]: entity.__primaryKey }).setLockMode(mode).execute();
  }

  private async lockOptimistic<T extends IEntityType<T>>(entity: T, meta: EntityMetadata<T>, version: number | Date): Promise<void> {
    if (!meta.versionProperty) {
      throw ValidationError.notVersioned(meta);
    }

    if (!Utils.isDefined(version)) {
      return;
    }

    if (!entity.isInitialized()) {
      await entity.init();
    }

    if (entity[meta.versionProperty] !== version) {
      throw ValidationError.lockFailedVersionMismatch(entity, version, entity[meta.versionProperty]);
    }
  }

}

