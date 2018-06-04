import { Utils } from './Utils';
import { EntityManager } from './EntityManager';
import { BaseEntity, EntityMetadata } from './BaseEntity';

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
      ret.payload = Utils.diff(this.identityMap[`${entity.constructor.name}-${entity.id}`], entity);
    } else {
      ret.payload = Object.assign({}, entity); // TODO maybe we need deep copy? or no copy at all?
    }

    if (ret.payload.id) {
      ret.payload._id = ret.payload.id;
    }

    delete ret.payload.id;
    delete ret.payload._initialized;

    await this.processReferences(ret, meta);

    return ret;
  }

  private async processReferences(changeSet: ChangeSet, meta: EntityMetadata): Promise<void> {
    const properties = Object.keys(meta.properties);

    for (const p of properties) {
      const prop = meta.properties[p];

      if (prop.collection) {
        // TODO cascade persist...
        delete changeSet.payload[prop.name];
      } else if (prop.reference) {
        // when new entity found in reference, cascade persist it first so we have its id
        if (!changeSet.payload[prop.name]._id) {
          const propChangeSet = await this.persist(changeSet.entity[prop.name]);
          await this.immediateCommit(propChangeSet);
        }

        changeSet.payload[prop.name] = changeSet.payload[prop.name]._id;
      }
    }
  }

  private async immediateCommit(changeSet: ChangeSet, removeFromStack = true): Promise<void> {
    const metadata = this.em.entityFactory.getMetadata();
    const meta = metadata[changeSet.entity.constructor.name];
    const properties = Object.keys(meta.properties);
    // const payload = Utils.copy(changeSet.payload);

    for (const p of properties) {
      const prop = meta.properties[p];

      if (prop.reference && !prop.collection && !changeSet.entity[prop.name]._id) {
        const propChangeSet = await this.persist(changeSet.entity[prop.name]);
        await this.immediateCommit(propChangeSet);
        changeSet.payload[prop.name] = changeSet.payload[prop.name]._id;
      }

      // TODO many to one collection support
      if (prop.reference && prop.collection) {
        // const propChangeSet = await this.persist(changeSet.entity[prop.name]);
        // await this.immediateCommit(propChangeSet);
      }

      if (changeSet.payload._id) {
        changeSet.entity.updatedAt = changeSet.payload.updatedAt = new Date();
        await this.em.getCollection(changeSet.collection).updateOne({ _id: changeSet.payload._id }, { $set: changeSet.payload });
      } else {
        const result = await this.em.getCollection(changeSet.collection).insertOne(changeSet.payload);
        changeSet.payload._id = changeSet.entity._id = result.insertedId;
        delete changeSet.entity['_initialized'];
        this.em.merge(changeSet.name, changeSet.payload);
      }
    }

    if (removeFromStack) {
      this.persistStack.splice(changeSet.index, 1);
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
