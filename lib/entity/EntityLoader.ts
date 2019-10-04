import { EntityProperty, IEntity, IEntityType } from '../decorators';
import { EntityManager } from '../EntityManager';
import { ReferenceType } from './enums';
import { Utils } from '../utils';
import { Collection } from './Collection';
import { QueryOrder } from '../query';
import { Reference } from './Reference';

export class EntityLoader {

  private readonly metadata = this.em.getMetadata();
  private readonly driver = this.em.getDriver();

  constructor(private readonly em: EntityManager) { }

  async populate<T extends IEntityType<T>>(entityName: string, entities: IEntityType<T>[], populate: string[] | boolean, validate = true, lookup = true): Promise<void> {
    if (entities.length === 0 || populate === false) {
      return;
    }

    if (populate === true) {
      populate = this.lookupAllRelationships(entityName);
    } else if (lookup) {
      populate = this.lookupEagerLoadedRelationships(entityName, populate);
    }

    const invalid = populate.find(field => !this.em.canPopulate(entityName, field));

    if (validate && invalid) {
      throw new Error(`Entity '${entityName}' does not have property '${invalid}'`);
    }

    for (const field of populate) {
      await this.populateField(entityName, entities, field);
    }
  }

  /**
   * preload everything in one call (this will update already existing references in IM)
   */
  private async populateMany<T extends IEntityType<T>>(entityName: string, entities: T[], field: keyof T): Promise<IEntity[]> {
    // set populate flag
    entities.forEach(entity => {
      if (Utils.isEntity(entity[field]) || entity[field] as object instanceof Collection || entity[field] as object instanceof Reference) {
        (entity[field] as IEntity).populated();
      }
    });

    const prop = this.metadata.get(entityName).properties[field as string];
    const filtered = this.filterCollections<T>(entities, field);

    if (prop.reference === ReferenceType.MANY_TO_MANY && this.driver.getPlatform().usesPivotTable()) {
      return this.findChildrenFromPivotTable<T>(filtered, prop, field);
    }

    const data = await this.findChildren<T>(entities, prop);
    this.initializeCollections<T>(filtered, prop, field, data);

    return data;
  }

  private initializeCollections<T extends IEntityType<T>>(filtered: T[], prop: EntityProperty, field: keyof T, children: IEntity[]): void {
    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      this.initializeOneToMany<T>(filtered, children, prop, field);
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner && !this.driver.getPlatform().usesPivotTable()) {
      this.initializeManyToMany<T>(filtered, children, prop, field);
    }
  }

  private initializeOneToMany<T extends IEntityType<T>>(filtered: T[], children: IEntity[], prop: EntityProperty, field: keyof T): void {
    for (const entity of filtered) {
      const items = children.filter(child => child[(prop.mappedBy as keyof IEntity)] as object === entity);
      (entity[field] as Collection<IEntity>).set(items, true);
    }
  }

  private initializeManyToMany<T extends IEntityType<T>>(filtered: T[], children: IEntity[], prop: EntityProperty, field: keyof T): void {
    for (const entity of filtered) {
      const items = children.filter(child => (child[prop.mappedBy as keyof IEntity] as object as Collection<IEntity>).contains(entity));
      (entity[field] as Collection<IEntity>).set(items, true);
    }
  }

  private async findChildren<T extends IEntityType<T>>(entities: T[], prop: EntityProperty): Promise<IEntityType<any>[]> {
    const children = this.getChildReferences<T>(entities, prop);
    const meta = this.metadata.get(prop.type);
    let fk = meta.primaryKey;

    if (prop.reference === ReferenceType.ONE_TO_MANY || (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner)) {
      fk = meta.properties[prop.mappedBy].fieldName;
    }

    if (children.length === 0) {
      return [];
    }

    const ids = Utils.unique(children.map(e => e.__primaryKey));
    const orderBy = prop.orderBy || { [fk]: QueryOrder.ASC };

    return this.em.find<IEntity>(prop.type, { [fk]: { $in: ids } }, [], orderBy);
  }

  private async populateField<T extends IEntityType<T>>(entityName: string, entities: IEntityType<T>[], field: string): Promise<void> {
    // nested populate
    if (field.includes('.')) {
      const [f, ...parts] = field.split('.');
      await this.populateMany<T>(entityName, entities, f as keyof T);
      const children: IEntity[] = [];
      entities.forEach(entity => {
        if (Utils.isEntity(entity[f])) {
          children.push(entity[f]);
        } else if (entity[f] instanceof Reference) {
          children.push(entity[f].unwrap());
        } else if (entity[f] as object instanceof Collection) {
          children.push(...entity[f].getItems());
        }
      });
      const filtered = Utils.unique(children);
      const prop = this.metadata.get(entityName).properties[f];
      await this.populate(prop.type, filtered, [parts.join('.')], false, false);
    } else {
      await this.populateMany<T>(entityName, entities, field as keyof T);
    }
  }

  private async findChildrenFromPivotTable<T extends IEntityType<T>>(filtered: T[], prop: EntityProperty, field: keyof T): Promise<IEntity[]> {
    const map = await this.driver.loadFromPivotTable(prop, filtered.map(e => e.__primaryKey), this.em.getTransactionContext());
    const children: IEntity[] = [];

    for (const entity of filtered) {
      const items = map[entity.__primaryKey as number].map(item => this.em.merge(prop.type, item));
      (entity[field] as Collection<IEntity>).set(items, true);
      children.push(...items);
    }

    return children;
  }

  private getChildReferences<T extends IEntityType<T>>(entities: T[], prop: EntityProperty<T>): IEntity[] {
    const filtered = this.filterCollections(entities, prop.name);
    const children: IEntity[] = [];

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      children.push(...filtered.map(e => e[prop.name].owner));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      children.push(...filtered.reduce((a, b) => [...a, ...(b[prop.name] as Collection<IEntity>).getItems()], [] as IEntity[]));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) { // inversed side
      children.push(...filtered);
    } else { // MANY_TO_ONE or ONE_TO_ONE
      children.push(...entities.filter(e => (Utils.isEntity(e[prop.name]) || e[prop.name] as object instanceof Reference) && !(e[prop.name] as IEntity).isInitialized()).map(e => {
        return e[prop.name] as object instanceof Reference ? e[prop.name].unwrap() : e[prop.name];
      }));
    }

    return children;
  }

  private filterCollections<T extends IEntityType<T>>(entities: T[], field: keyof T): T[] {
    return entities.filter(e => e[field] as object instanceof Collection && !(e[field] as Collection<IEntity>).isInitialized(true));
  }

  private lookupAllRelationships(entityName: string, prefix = '', visited: string[] = []): string[] {
    if (visited.includes(entityName)) {
      return [];
    }

    visited.push(entityName);
    const ret: string[] = [];
    const meta = this.metadata.get(entityName);

    Object.values(meta.properties)
      .filter(prop => prop.reference !== ReferenceType.SCALAR)
      .forEach(prop => {
        const prefixed = prefix ? `${prefix}.${prop.name}` : prop.name;
        const nested = this.lookupAllRelationships(prop.type, prefixed, visited);

        if (nested.length > 0) {
          ret.push(...nested);
        } else {
          ret.push(prefixed);
        }
      });

    return ret;
  }

  private lookupEagerLoadedRelationships(entityName: string, populate: string[], prefix = '', visited: string[] = []): string[] {
    if (visited.includes(entityName)) {
      return [];
    }

    visited.push(entityName);
    const meta = this.metadata.get(entityName);

    Object.values(meta.properties)
      .filter(prop => prop.eager)
      .forEach(prop => {
        const prefixed = prefix ? `${prefix}.${prop.name}` : prop.name;
        const nested = this.lookupEagerLoadedRelationships(prop.type, [], prefixed, visited);

        if (nested.length > 0) {
          populate.push(...nested);
        } else {
          populate.push(prefixed);
        }
      });

    return populate;
  }

}
