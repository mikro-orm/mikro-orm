import { Utils } from './Utils';
import { EntityManager } from './EntityManager';
import { EntityMetadata, EntityProperty, IEntity, ReferenceType } from './decorators/Entity';

export class UnitOfWork {

  // holds copy of entity manager's identity map so we can compute changes when persisting
  private readonly identityMap = {} as any;
  private readonly persistStack: ChangeSet[] = [];
  private readonly foreignKey = this.em.getNamingStrategy().referenceColumnName();

  constructor(private em: EntityManager) { }

  addToIdentityMap(entity: IEntity): void {
    this.identityMap[`${entity.constructor.name}-${entity.id}`] = Utils.copy(entity);
  }

  async persist(entity: IEntity): Promise<ChangeSet> {
    const changeSet = await this.computeChangeSet(entity);

    if (!changeSet) {
      return null;
    }

    changeSet.index = this.persistStack.length;
    this.persistStack.push(changeSet);

    return changeSet;
  }

  async remove(entity: IEntity): Promise<ChangeSet> {
    const metadata = this.em.entityFactory.getMetadata();
    const meta = metadata[entity.constructor.name];

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

  private async computeChangeSet(entity: IEntity): Promise<ChangeSet> {
    const ret = { entity } as ChangeSet;
    const metadata = this.em.entityFactory.getMetadata();
    const meta = metadata[entity.constructor.name];

    ret.name = meta.name;
    ret.collection = meta.collection;

    if (entity.id && this.identityMap[`${meta.name}-${entity.id}`]) {
      ret.payload = Utils.diffEntities(this.identityMap[`${meta.name}-${entity.id}`], entity, this.foreignKey);
    } else {
      ret.payload = Utils.prepareEntity(entity, this.foreignKey);
    }

    await this.processReferences(ret, meta);
    this.em.validator.validate(ret.entity, ret.payload, meta);

    if (entity.id && Object.keys(ret.payload).length === 0) {
      return null;
    }

    return ret;
  }

  private async processReferences(changeSet: ChangeSet, meta: EntityMetadata): Promise<void> {
    for (const p of Object.keys(meta.properties)) {
      const prop = meta.properties[p];

      if (prop.reference === ReferenceType.ONE_TO_MANY) {
        await this.processOneToMany(changeSet, prop);
      } else if (prop.reference === ReferenceType.MANY_TO_MANY) {
        await this.processManyToMany(changeSet, prop);
      } else if (prop.reference === ReferenceType.MANY_TO_ONE && changeSet.entity[prop.name]) {
        await this.processManyToOne(changeSet, prop);
      }
    }
  }

  private async processManyToOne(changeSet: ChangeSet, prop: EntityProperty) {
    // when new entity found in reference, cascade persist it first so we have its id
    if (!changeSet.entity[prop.name][this.foreignKey]) {
      const propChangeSet = await this.persist(changeSet.entity[prop.name]);
      await this.immediateCommit(propChangeSet);
      changeSet.payload[prop.name] = changeSet.entity[prop.name][this.foreignKey];
    }
  }

  private async processOneToMany(changeSet: ChangeSet, prop: EntityProperty) {
    // if (changeSet.entity[prop.name].isDirty()) {
    //   // TODO cascade persist...
    // }

    delete changeSet.payload[prop.name];
  }

  private async processManyToMany(changeSet: ChangeSet, prop: EntityProperty) {
    if (prop.owner && changeSet.entity[prop.name].isDirty()) {
      for (const item of changeSet.entity[prop.name].getItems()) {
        // when new entity found in reference, cascade persist it first so we have its id
        if (!item[this.foreignKey]) {
          const itemChangeSet = await this.persist(item);
          await this.immediateCommit(itemChangeSet);
        }
      }

      changeSet.payload[prop.name] = changeSet.entity[prop.name].getIdentifiers(this.foreignKey);
    } else {
      delete changeSet.payload[prop.name];
    }
  }

  private async immediateCommit(changeSet: ChangeSet, removeFromStack = true): Promise<void> {
    const type = changeSet.entity[this.foreignKey] ? (changeSet.delete ? 'Delete' : 'Update') : 'Create';
    await this.runHooks(`before${type}`, changeSet.entity, changeSet.payload);

    const metadata = this.em.entityFactory.getMetadata();
    const meta = metadata[changeSet.entity.constructor.name];
    const properties = Object.keys(meta.properties);

    // process references first
    for (const p of properties) {
      const prop = meta.properties[p];
      const reference = changeSet.entity[prop.name];

      if (prop.reference === ReferenceType.MANY_TO_ONE && reference) {
        // TODO many to one cascade support
        // ...
      }

      if (prop.reference === ReferenceType.ONE_TO_MANY) {
        // TODO one to many collection cascade support
        // ...

        reference.dirty = false;
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
        // TODO many to many collection cascade support
        // ...

        reference.dirty = false;
      }

      if (prop.onUpdate) {
        changeSet.entity[prop.name] = changeSet.payload[prop.name] = prop.onUpdate();
      }
    }

    // persist the entity itself
    const entityName = changeSet.entity.constructor.name;

    if (changeSet.delete) {
      await this.em.getDriver().nativeDelete(entityName, changeSet.entity[this.foreignKey]);
    } else if (changeSet.entity[this.foreignKey]) {
      await this.em.getDriver().nativeUpdate(entityName, changeSet.entity[this.foreignKey], changeSet.payload);
      this.addToIdentityMap(changeSet.entity);
    } else {
      changeSet.entity[this.foreignKey] = await this.em.getDriver().nativeInsert(entityName, changeSet.payload);
      delete changeSet.entity['__initialized'];
      this.em.merge(changeSet.name, changeSet.entity);
    }

    await this.runHooks(`after${type}`, changeSet.entity);

    if (removeFromStack) {
      this.persistStack.splice(changeSet.index, 1);
    }
  }

  private async runHooks(type: string, entity: IEntity, payload: any = null) {
    const metadata = this.em.entityFactory.getMetadata();
    const hooks = metadata[entity.constructor.name].hooks;

    if (hooks && hooks[type] && hooks[type].length > 0) {
      const copy = Utils.copy(entity);
      for (const hook of hooks[type]) {
        await entity[hook]();
      }

      if (payload) {
        Object.assign(payload, Utils.diffEntities(copy, entity, this.foreignKey));
      }
    }
  }

}

export interface ChangeSet {
  index: number;
  payload: any;
  collection: string;
  name: string;
  entity: IEntity;
  delete: boolean;
}
