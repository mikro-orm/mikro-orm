import { EntityData, EntityMetadata, EntityProperty, IEntity, IEntityType, IPrimaryKey } from '../decorators';
import { MetadataStorage } from '../metadata';
import { Cascade, Collection, EntityIdentifier, ReferenceType } from '../entity';
import { ChangeSetComputer } from './ChangeSetComputer';
import { ChangeSetPersister } from './ChangeSetPersister';
import { ChangeSet } from './ChangeSet';
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
  private readonly changeSetComputer = new ChangeSetComputer(this.em.getValidator(), this.originalEntityData, this.identifierMap);
  private readonly changeSetPersister = new ChangeSetPersister(this.em.getDriver(), this.identifierMap);

  constructor(private readonly em: EntityManager) { }

  addToIdentityMap(entity: IEntity): void {
    this.identityMap[`${entity.constructor.name}-${entity.id}`] = entity;
    this.originalEntityData[entity.__uuid] = Utils.copy(entity);
  }

  getById<T extends IEntityType<T>>(entityName: string, id: IPrimaryKey): T {
    const token = `${entityName}-${id}`;
    return this.identityMap[token] as T;
  }

  tryGetById<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | IPrimaryKey): T | null {
    if (!Utils.isPrimaryKey(where)) {
      return null;
    }

    where = this.em.getDriver().normalizePrimaryKey<IPrimaryKey>(where);

    return this.getById<T>(entityName, where);
  }

  getIdentityMap(): Record<string, IEntity> {
    return this.identityMap;
  }

  persist<T extends IEntityType<T>>(entity: T, visited: IEntity[] = []): void {
    if (this.persistStack.includes(entity)) {
      return;
    }

    if (!entity.id) {
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

    if (entity.id) {
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
    delete this.identityMap[`${entity.constructor.name}-${entity.id}`];
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
      this.changeSets.push({ entity, delete: true, name: meta.name, collection: meta.collection, payload: {} } as ChangeSet<IEntity>);
    }
  }

  private findNewEntities<T extends IEntityType<T>>(entity: T): void {
    const meta = this.metadata[entity.constructor.name] as EntityMetadata<T>;

    if (!entity.id && !this.identifierMap[entity.__uuid]) {
      this.identifierMap[entity.__uuid] = new EntityIdentifier();
    }

    for (const prop of Object.values(meta.properties)) {
      const reference = entity[prop.name as keyof T];
      this.processReference(entity, prop, reference);
    }

    const changeSet = this.changeSetComputer.computeChangeSet(entity);

    if (changeSet) {
      this.changeSets.push(changeSet);
      this.cleanUpStack(this.persistStack, entity);
      this.originalEntityData[entity.__uuid] = Utils.copy(entity);
    }
  }

  private processReference<T extends IEntityType<T>>(parent: T, prop: EntityProperty, reference: any): void {
    if (parent === reference && !this.hasIdentifier(parent)) {
      this.extraUpdates.push([parent, prop.name as keyof IEntity, parent]);
      delete parent[prop.name as keyof T];

      return;
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY && (reference as Collection<IEntity>).isDirty()) {
      (reference as Collection<IEntity>).getItems()
        .filter(item => !this.hasIdentifier(item))
        .forEach(item => this.findNewEntities(item));
    } else if (prop.reference === ReferenceType.MANY_TO_ONE && reference && !this.hasIdentifier(reference)) {
      this.findNewEntities(reference);
    }
  }

  private async commitChangeSet<T extends IEntityType<T>>(changeSet: ChangeSet<T>): Promise<void> {
    const meta = this.metadata[changeSet.name];
    const pk = meta.primaryKey as keyof T;
    const type = changeSet.entity[pk] ? (changeSet.delete ? 'Delete' : 'Update') : 'Create';

    await this.runHooks(`before${type}`, changeSet.entity, changeSet.payload);
    await this.changeSetPersister.persistToDatabase(changeSet);

    if (!changeSet.delete) {
      this.em.merge(changeSet.name, changeSet.entity);
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
      case Cascade.PERSIST: this.persist<T>(entity, visited); break;
      case Cascade.REMOVE: this.remove(entity, visited); break;
    }

    const meta = this.metadata[entity.constructor.name];

    for (const prop of Object.values(meta.properties)) {
      this.cascadeReference<T>(entity, prop, type, visited);
    }
  }

  private cascadeReference<T extends IEntityType<T>>(entity: T, prop: EntityProperty, type: Cascade, visited: IEntity[]): void {
    if (!prop.cascade || !prop.cascade.includes(type)) {
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

