import { Utils } from './Utils';
import { EntityManager } from './EntityManager';
import { BaseEntity, EntityMetadata } from './BaseEntity';
import { Collection } from './Collection';

export class UnitOfWork {

  // holds copy of entity manager's identity map so we can compute changes when persisting
  private readonly identityMap = {} as any;
  private readonly persistStack: any[] = [];

  constructor(private em: EntityManager) { }

  addToIdentityMap(entity: BaseEntity): void {
    this.identityMap[`${entity.constructor.name}-${entity.id}`] = Utils.copy(entity);
  }

  async persist(entity: BaseEntity): Promise<ChangeSet> {
    const changeSet = await this.computeChangeSet(entity);
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

  private async computeChangeSet(entity: BaseEntity): Promise<ChangeSet> {
    const ret = { entity } as ChangeSet;
    const metadata = this.em.entityFactory.getMetadata();
    const meta = metadata[entity.constructor.name];

    ret.name = meta.entity;
    ret.collection = meta.collection;

    if (entity.id && this.identityMap[`${entity.constructor.name}-${entity.id}`]) {
      ret.payload = Utils.diffEntities(this.identityMap[`${entity.constructor.name}-${entity.id}`], entity);
    } else {
      ret.payload = Object.assign({}, entity); // TODO maybe we need deep copy? or no copy at all?
    }

    delete ret.payload._id;
    delete ret.payload._initialized;

    await this.processReferences(ret, meta);
    this.removeUnknownProperties(ret, meta);

    return ret;
  }

  private async processReferences(changeSet: ChangeSet, meta: EntityMetadata): Promise<void> {
    const properties = Object.keys(meta.properties);

    for (const p of properties) {
      const prop = meta.properties[p];

      if (prop.collection) {
        // TODO cascade persist...
        delete changeSet.payload[prop.name];
      } else if (prop.reference && changeSet.entity[prop.name]) {
        // when new entity found in reference, cascade persist it first so we have its id
        if (!changeSet.entity[prop.name]._id) {
          const propChangeSet = await this.persist(changeSet.entity[prop.name]);
          await this.immediateCommit(propChangeSet);
        }

        changeSet.payload[prop.name] = changeSet.entity[prop.name]._id;
      }
    }
  }

  private removeUnknownProperties(changeSet: ChangeSet, meta: EntityMetadata): void {
    const properties = Object.keys(changeSet.payload);

    for (const p of properties) {
      if (!meta.properties[p] && !['_id', 'createdAt', 'updatedAt'].includes(p)) {
        delete changeSet.payload[p];
      }
    }
  }

  private async immediateCommit(changeSet: ChangeSet, removeFromStack = true): Promise<void> {
    this.runHooks(`before${changeSet.entity._id ? 'Update' : 'Create'}`, changeSet.entity);

    const metadata = this.em.entityFactory.getMetadata();
    const meta = metadata[changeSet.entity.constructor.name];
    const properties = Object.keys(meta.properties);

    // process references first
    for (const p of properties) {
      const prop = meta.properties[p];

      if (prop.reference && !prop.collection && changeSet.entity[prop.name]) {
        if (!changeSet.entity[prop.name]._id) {
          const propChangeSet = await this.persist(changeSet.entity[prop.name]);
          await this.immediateCommit(propChangeSet);
        }

        changeSet.payload[prop.name] = changeSet.entity[prop.name]._id;
      }

      if (prop.reference && prop.collection) {
        if (!changeSet.entity[prop.name]) { // create collection when missing (e.g. when persisting new entity)
          changeSet.entity[prop.name] = new Collection(prop, changeSet.entity);
        }

        // TODO many to one collection cascade support
        // ...
      }
    }

    // persist the entity itself
    if (changeSet.entity._id) {
      changeSet.entity.updatedAt = changeSet.payload.updatedAt = new Date();
      await this.em.getCollection(changeSet.collection).updateOne({ _id: changeSet.entity._id }, { $set: changeSet.payload });
    } else {
      const result = await this.em.getCollection(changeSet.collection).insertOne(changeSet.payload);
      changeSet.entity._id = result.insertedId;
      delete changeSet.entity['_initialized'];
      this.em.merge(changeSet.name, changeSet.entity);
    }

    this.runHooks(`after${changeSet.entity._id ? 'Update' : 'Create'}`, changeSet.entity);

    if (removeFromStack) {
      this.persistStack.splice(changeSet.index, 1);
    }
  }

  private runHooks(type: string, entity: BaseEntity) {
    const metadata = this.em.entityFactory.getMetadata();
    const hooks = metadata[entity.constructor.name].hooks;

    if (hooks && hooks[type] && hooks[type].length > 0) {
      hooks[type].forEach(hook => entity[hook]());
    }
  }

}

export interface ChangeSet {
  index: number;
  payload: any;
  collection: string;
  name: string;
  entity: BaseEntity;
}
