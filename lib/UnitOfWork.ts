import { Utils } from './utils/Utils';
import { EntityManager } from './EntityManager';
import { EntityData, EntityMetadata, IEntity, IEntityType, ReferenceType } from './decorators/Entity';
import { MetadataStorage } from './metadata/MetadataStorage';
import { Collection } from './Collection';
import { EntityIdentifier } from './utils/EntityIdentifier';
import { IPrimaryKey } from './decorators/PrimaryKey';

export class UnitOfWork {

  /** map of references to managed entities */
  private readonly identityMap = {} as Record<string, IEntity>;

  /** holds copy of identity map so we can compute changes when persisting managed entities */
  private readonly originalEntityData = {} as Record<string, IEntity>;

  /** map of wrapped primary keys so we can compute change set without eager commit */
  private readonly identifierMap = {} as Record<string, EntityIdentifier>;

  private readonly persistStack: IEntity[] = [];
  private readonly removeStack: IEntity[] = [];
  private readonly changeSets: ChangeSet[] = [];
  private readonly metadata = MetadataStorage.getMetadata();

  constructor(private em: EntityManager) { }

  addToIdentityMap(entity: IEntity): void {
    this.identityMap[`${entity.constructor.name}-${entity.id}`] = entity;
    this.originalEntityData[entity.uuid] = Utils.copy(entity);
  }

  getById<T extends IEntityType<T>>(entityName: string, id: IPrimaryKey): T {
    const token = `${entityName}-${id}`;
    return this.identityMap[token] as T;
  }

  getIdentityMap(): Record<string, IEntity> {
    return this.identityMap;
  }

  persist<T extends IEntityType<T>>(entity: T): void {
    if (this.persistStack.includes(entity)) {
      return;
    }

    if (!entity.id) {
      this.identifierMap[entity.uuid] = new EntityIdentifier();
    }

    this.persistStack.push(entity);
    this.cleanUpStack(this.removeStack, entity);
  }

  remove(entity: IEntity): void {
    if (this.removeStack.includes(entity)) {
      return;
    }

    if (entity.id) {
      this.removeStack.push(entity);
    }

    this.cleanUpStack(this.persistStack, entity);
    this.unsetIdentity(entity);
  }

  async commit(): Promise<void> {
    this.computeChangeSets();

    if (this.changeSets.length === 0) {
      return this.postCommitCleanup(); // nothing to do, do not start transaction
    }

    const driver = this.em.getDriver();
    const runInTransaction = !driver.isInTransaction() && driver.getConfig().supportsTransactions;

    if (runInTransaction) {
      await driver.transactional(async () => {
        for (const changeSet of this.changeSets) {
          await this.commitChangeSet(changeSet);
        }
      });
    } else {
      for (const changeSet of this.changeSets) {
        await this.commitChangeSet(changeSet);
      }
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
    delete this.identifierMap[entity.uuid];
    delete this.originalEntityData[entity.uuid];
  }

  computeChangeSets(): void {
    this.changeSets.length = 0;

    while (this.persistStack.length) {
      this.findNewEntities(this.persistStack.shift()!);
    }

    for (const entity of Object.values(this.removeStack)) {
      const meta = this.metadata[entity.constructor.name];
      this.changeSets.push({ entity, delete: true, name: meta.name, collection: meta.collection, payload: {} } as ChangeSet);
    }
  }

  computeChangeSet(entity: IEntity): ChangeSet | null {
    const changeSet = { entity } as ChangeSet;
    const meta = this.metadata[entity.constructor.name];

    changeSet.name = meta.name;
    changeSet.collection = meta.collection;

    if (entity.id && this.originalEntityData[entity.uuid]) {
      changeSet.payload = Utils.diffEntities(this.originalEntityData[entity.uuid], entity);
    } else {
      changeSet.payload = Utils.prepareEntity(entity);
    }

    this.em.validator.validate<typeof entity>(changeSet.entity, changeSet.payload, meta);
    this.processReferences(changeSet, meta);

    if (entity.id && Object.keys(changeSet.payload).length === 0) {
      return null;
    }

    this.changeSets.push(changeSet);
    this.cleanUpStack(this.persistStack, entity);
    this.originalEntityData[entity.uuid] = Utils.copy(entity);

    return changeSet;
  }

  private processReferences(changeSet: ChangeSet, meta: EntityMetadata): void {
    for (const prop of Object.values(meta.properties)) {
      if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
        const collection = changeSet.entity[prop.name] as Collection<IEntity>;

        if (prop.owner && collection.isDirty()) {
          const pk = this.metadata[prop.type].primaryKey as keyof IEntity;
          changeSet.payload[prop.name] = collection.getItems().map(item => item[pk] || this.identifierMap[item.uuid]);
          collection.setDirty(false);
        }
      } else if (prop.reference === ReferenceType.MANY_TO_ONE && changeSet.entity[prop.name]) {
        const pk = this.metadata[prop.type].primaryKey;
        const entity = changeSet.entity[prop.name];

        if (!entity[pk]) {
          changeSet.payload[prop.name] = this.identifierMap[entity.uuid];
        }
      }
    }
  }

  private findNewEntities<T extends IEntityType<T>>(entity: T, visited: IEntity[] = []): void {
    if (visited.includes(entity)) {
      return;
    }

    const meta = this.metadata[entity.constructor.name] as EntityMetadata<T>;
    visited.push(entity);

    if (!entity.id && !this.identifierMap[entity.uuid]) {
      this.identifierMap[entity.uuid] = new EntityIdentifier();
    }

    for (const prop of Object.values(meta.properties)) {
      const reference = entity[prop.name as keyof T];

      if (prop.reference === ReferenceType.MANY_TO_MANY && (reference as Collection<IEntity>).isDirty()) {
        for (const item of (reference as Collection<IEntity>).getItems()) {
          if (!this.hasIdentifier(item)) {
            this.findNewEntities(item, visited);
          }
        }
      } else if (prop.reference === ReferenceType.MANY_TO_ONE && reference) {
        if (!this.hasIdentifier(reference)) {
          this.findNewEntities(reference, visited);
        }
      }
    }

    this.computeChangeSet(entity);
  }

  private async commitChangeSet<T extends IEntityType<T>>(changeSet: ChangeSet<T>): Promise<void> {
    const meta = this.metadata[changeSet.name];
    const pk = meta.primaryKey as keyof T;
    const type = changeSet.entity[pk] ? (changeSet.delete ? 'Delete' : 'Update') : 'Create';
    await this.runHooks(`before${type}`, changeSet.entity, changeSet.payload);

    // process references first
    for (const prop of Object.values(meta.properties)) {
      const value = changeSet.payload[prop.name];

      if (value instanceof EntityIdentifier) {
        changeSet.payload[prop.name] = value.getValue();
      } else if (Array.isArray(value) && value.some(item => item instanceof EntityIdentifier)) {
        changeSet.payload[prop.name] = value.map(item => item instanceof EntityIdentifier ? item.getValue() : item);
      }

      if (prop.onUpdate) {
        changeSet.entity[prop.name as keyof T] = changeSet.payload[prop.name] = prop.onUpdate();
      }
    }

    // persist the entity itself
    if (changeSet.delete) {
      await this.em.getDriver().nativeDelete(changeSet.name, changeSet.entity[pk]);
    } else if (changeSet.entity[pk]) {
      await this.em.getDriver().nativeUpdate(changeSet.name, changeSet.entity[pk], changeSet.payload);
      this.addToIdentityMap(changeSet.entity);
    } else {
      changeSet.entity[pk] = await this.em.getDriver().nativeInsert(changeSet.name, changeSet.payload) as T[keyof T];
      this.identifierMap[changeSet.entity.uuid].setValue(changeSet.entity[pk]);
      delete changeSet.entity.__initialized;
      this.em.merge(changeSet.name, changeSet.entity);
    }

    await this.runHooks(`after${type}`, changeSet.entity);
  }

  private async runHooks<T extends IEntityType<T>>(type: string, entity: IEntityType<T>, payload?: EntityData<T>) {
    const hooks = this.metadata[entity.constructor.name].hooks;

    if (hooks && hooks[type] && hooks[type].length > 0) {
      const copy = Utils.copy(entity);

      for (const hook of hooks[type]) {
        await entity[hook as keyof T]();
      }

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

    return this.identifierMap[entity.uuid] && this.identifierMap[entity.uuid].getValue();
  }

}

export interface ChangeSet<T extends IEntityType<T> = IEntityType<any>> {
  index: number;
  name: string;
  collection: string;
  delete: boolean;
  entity: T;
  payload: EntityData<T>;
}
