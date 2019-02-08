import { Utils } from './utils/Utils';
import { EntityManager } from './EntityManager';
import { EntityMetadata, EntityProperty, IEntity, IEntityType, ReferenceType } from './decorators/Entity';
import { MetadataStorage } from './metadata/MetadataStorage';
import { Collection } from './Collection';

export class UnitOfWork {

  // holds copy of entity manager's identity map so we can compute changes when persisting
  private readonly identityMap = {} as any;
  private readonly persistStack: ChangeSet[] = [];
  private readonly metadata = MetadataStorage.getMetadata();

  constructor(private em: EntityManager) { }

  addToIdentityMap(entity: IEntity): void {
    this.identityMap[`${entity.constructor.name}-${entity.id}`] = Utils.copy(entity);
  }

  async persist(entity: IEntity): Promise<ChangeSet | null> {
    const changeSet = await this.computeChangeSet(entity);

    if (!changeSet) {
      return null;
    }

    changeSet.index = this.persistStack.length;
    this.persistStack.push(changeSet);
    this.addToIdentityMap(entity);

    return changeSet;
  }

  async remove(entity: IEntity): Promise<ChangeSet | null> {
    const meta = this.metadata[entity.constructor.name];

    // clean up persist stack from previous change sets for this entity (in case there was persist call without flushing)
    this.persistStack.forEach(changeSet => {
      if (changeSet.entity === entity) {
        this.persistStack.splice(changeSet.index, 1);
      }
    });

    if (!entity.id) {
      return null;
    }

    const changeSet = { entity, delete: true, name: meta.name, collection: meta.collection, payload: {} } as ChangeSet;
    changeSet.index = this.persistStack.length;
    this.persistStack.push(changeSet);

    return changeSet;
  }

  async commit(): Promise<void> {
    for (const changeSet of this.persistStack) {
      await this.immediateCommit(changeSet, false);
    }

    this.persistStack.length = 0;
  }

  clear(): void {
    Object.keys(this.identityMap).forEach(key => delete this.identityMap[key]);
  }

  unsetIdentity(entity: IEntity): void {
    delete this.identityMap[`${entity.constructor.name}-${entity.id}`];
  }

  private async computeChangeSet(entity: IEntity): Promise<ChangeSet | null> {
    const ret = { entity } as ChangeSet;
    const meta = this.metadata[entity.constructor.name];

    ret.name = meta.name;
    ret.collection = meta.collection;

    if (entity.id && this.identityMap[`${meta.name}-${entity.id}`]) {
      ret.payload = Utils.diffEntities(this.identityMap[`${meta.name}-${entity.id}`], entity);
    } else {
      ret.payload = Utils.prepareEntity(entity);
    }

    this.em.validator.validate<typeof entity>(ret.entity, ret.payload, meta);
    await this.processReferences(ret, meta);

    if (entity.id && Object.keys(ret.payload).length === 0) {
      return null;
    }

    return ret;
  }

  private async processReferences(changeSet: ChangeSet, meta: EntityMetadata): Promise<void> {
    for (const prop of Object.values(meta.properties)) {
      if (prop.reference === ReferenceType.ONE_TO_MANY) {
        const collection = changeSet.entity[prop.name] as Collection<IEntity>;
        collection.setDirty(false);
      } else if (prop.reference === ReferenceType.MANY_TO_MANY) {
        await this.processManyToMany(changeSet, prop);
      } else if (prop.reference === ReferenceType.MANY_TO_ONE && changeSet.entity[prop.name]) {
        await this.processManyToOne(changeSet, prop);
      }
    }
  }

  private async processManyToOne(changeSet: ChangeSet, prop: EntityProperty): Promise<void> {
    const pk = this.metadata[prop.type].primaryKey;

    // when new entity found in reference, cascade persist it first so we have its id
    if (!changeSet.entity[prop.name][pk]) {
      const propChangeSet = await this.persist(changeSet.entity[prop.name]);
      await this.immediateCommit(propChangeSet!);
      changeSet.payload[prop.name] = changeSet.entity[prop.name][pk];
    }
  }

  private async processManyToMany<T>(changeSet: ChangeSet, prop: EntityProperty): Promise<void> {
    const collection = changeSet.entity[prop.name] as Collection<IEntity>;

    if (prop.owner && collection.isDirty()) {
      for (const item of collection.getItems()) {
        const pk = this.metadata[prop.type].primaryKey as keyof typeof item;

        // when new entity found in reference, cascade persist it first so we have its id
        if (!item[pk]) {
          const itemChangeSet = await this.persist(item);
          await this.immediateCommit(itemChangeSet!);
        }
      }

      const pk = this.metadata[prop.type].primaryKey;
      changeSet.payload[prop.name] = collection.getIdentifiers(pk);
      collection.setDirty(false);
    }
  }

  private async immediateCommit(changeSet: ChangeSet, removeFromStack = true): Promise<void> {
    const meta = this.metadata[changeSet.name];
    const pk = meta.primaryKey;
    const type = changeSet.entity[pk] ? (changeSet.delete ? 'Delete' : 'Update') : 'Create';
    await this.runHooks(`before${type}`, changeSet.entity, changeSet.payload);

    // process references first
    for (const prop of Object.values(meta.properties)) {
      if (prop.onUpdate) {
        changeSet.entity[prop.name] = changeSet.payload[prop.name] = prop.onUpdate();
      }
    }

    // persist the entity itself
    if (changeSet.delete) {
      await this.em.getDriver().nativeDelete(changeSet.name, changeSet.entity[pk]);
    } else if (changeSet.entity[pk]) {
      await this.em.getDriver().nativeUpdate(changeSet.name, changeSet.entity[pk], changeSet.payload);
      this.addToIdentityMap(changeSet.entity);
    } else {
      changeSet.entity[pk] = await this.em.getDriver().nativeInsert(changeSet.name, changeSet.payload);
      delete changeSet.entity.__initialized;
      this.em.merge(changeSet.name, changeSet.entity);
    }

    await this.runHooks(`after${type}`, changeSet.entity);

    if (removeFromStack) {
      this.persistStack.splice(changeSet.index, 1);
    }
  }

  private async runHooks<T>(type: string, entity: IEntityType<T>, payload: any = null) {
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

}

export interface ChangeSet {
  index: number;
  payload: any;
  collection: string;
  name: string;
  entity: IEntityType<any>;
  delete: boolean;
}
