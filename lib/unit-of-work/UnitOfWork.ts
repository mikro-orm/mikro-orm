import { EntityData, EntityMetadata, EntityProperty, IEntity, IEntityType, IPrimaryKey } from '../decorators';
import { MetadataStorage } from '../metadata';
import { Cascade, Collection, EntityIdentifier, ReferenceType } from '../entity';
import { ChangeSetComputer } from './ChangeSetComputer';
import { ChangeSetPersister } from './ChangeSetPersister';
import { ChangeSet, ChangeSetType } from './ChangeSet';
import { EntityManager } from '../EntityManager';
import { Utils } from '../utils';
import { FilterQuery } from '..';

export class UnitOfWork {

  /** map of references to managed entities */
  private readonly identityMap = {} as Record<string, IEntity>;

  /** holds copy of identity map so we can compute changes when persisting managed entities */
  private readonly originalEntityData = {} as Record<string, IEntity>;

  /** map of wrapped primary keys so we can compute change set without eager commit */
  private readonly identifierMap = {} as Record<string, EntityIdentifier>;

  private readonly persistStack: IEntity[] = [];
  private readonly removeStack: IEntity[] = [];
  private readonly changeSets: ChangeSet<IEntity>[] = [];
  private readonly extraUpdates: [IEntityType<IEntity>, string & keyof IEntity, IEntityType<IEntity>][] = [];
  private readonly metadata = MetadataStorage.getMetadata();
  private readonly platform = this.em.getDriver().getPlatform();
  private readonly changeSetComputer = new ChangeSetComputer(this.em.getValidator(), this.originalEntityData, this.identifierMap);
  private readonly changeSetPersister = new ChangeSetPersister(this.em.getDriver(), this.identifierMap);

  constructor(private readonly em: EntityManager) { }

  merge<T extends IEntityType<T>>(entity: T, visited: IEntity[] = []): void {
    if (!entity.__primaryKey) {
      return;
    }

    this.identityMap[`${entity.constructor.name}-${entity.__serializedPrimaryKey}`] = entity;
    this.originalEntityData[entity.__uuid] = Utils.copy(entity);
    this.cascade(entity, Cascade.MERGE, visited);
  }

  getById<T extends IEntityType<T>>(entityName: string, id: IPrimaryKey): T {
    const token = `${entityName}-${this.platform.normalizePrimaryKey(id)}`;
    return this.identityMap[token] as T;
  }

  tryGetById<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey): T | null {
    if (!Utils.isPrimaryKey(where)) {
      return null;
    }

    return this.getById<T>(entityName, where);
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

    while (this.persistStack.length) {
      this.findNewEntities(this.persistStack.shift()!);
    }

    while (this.extraUpdates.length) {
      const extraUpdate = this.extraUpdates.shift()!;
      extraUpdate[0][extraUpdate[1]] = extraUpdate[2];
      const changeSet = this.changeSetComputer.computeChangeSet(extraUpdate[0])!;
      this.changeSets.push(changeSet);
    }

    for (const entity of Object.values(this.removeStack)) {
      const meta = this.metadata[entity.constructor.name];
      this.changeSets.push({ entity, type: ChangeSetType.DELETE, name: meta.name, collection: meta.collection, payload: {} } as ChangeSet<IEntity>);
    }
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
      this.originalEntityData[entity.__uuid] = Utils.copy(entity);
    }
  }

  private processReference<T extends IEntityType<T>>(parent: T, prop: EntityProperty, reference: any, visited: IEntity[]): void {
    if (prop.reference === ReferenceType.MANY_TO_ONE && reference && !this.hasIdentifier(reference) && visited.includes(reference)) {
      this.extraUpdates.push([parent, prop.name as keyof IEntity, reference]);
      delete parent[prop.name as keyof T];

      return;
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY && (reference as Collection<IEntity>).isDirty()) {
      (reference as Collection<IEntity>).getItems()
        .filter(item => !this.originalEntityData[item.__uuid])
        .forEach(item => this.findNewEntities(item, visited));
    } else if (prop.reference === ReferenceType.MANY_TO_ONE && reference && !this.originalEntityData[reference.__uuid]) {
      this.findNewEntities(reference, visited);
    }
  }

  private async commitChangeSet<T extends IEntityType<T>>(changeSet: ChangeSet<T>): Promise<void> {
    const type = changeSet.type.charAt(0).toUpperCase() + changeSet.type.slice(1);
    await this.runHooks(`before${type}`, changeSet.entity, changeSet.payload);
    await this.changeSetPersister.persistToDatabase(changeSet);

    if (changeSet.type !== ChangeSetType.DELETE) {
      this.em.merge(changeSet.entity);
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
      case Cascade.MERGE: this.merge(entity, visited); break;
      case Cascade.REMOVE: this.remove(entity, visited); break;
    }

    const meta = this.metadata[entity.constructor.name];

    for (const prop of Object.values(meta.properties)) {
      this.cascadeReference<T>(entity, prop, type, visited);
    }
  }

  private cascadeReference<T extends IEntityType<T>>(entity: T, prop: EntityProperty, type: Cascade, visited: IEntity[]): void {
    if (!prop.cascade || !(prop.cascade.includes(type) || prop.cascade.includes(Cascade.ALL))) {
      return;
    }

    if (prop.reference === ReferenceType.MANY_TO_ONE && entity[prop.name as keyof T]) {
      return this.cascade(entity[prop.name as keyof T], type, visited);
    }

    const collection = entity[prop.name as keyof T] as Collection<IEntity>;

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference) && collection.isInitialized(true)) {
      collection.getItems().forEach(item => this.cascade(item, type, visited));
    }
  }

}

