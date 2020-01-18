import { AnyEntity, EntityProperty, FilterQuery, Primary } from '../typings';
import { EntityManager } from '../EntityManager';
import { ReferenceType } from './enums';
import { Utils, ValidationError } from '../utils';
import { Collection } from './Collection';
import { QueryOrder, QueryOrderMap } from '../query';
import { Reference } from './Reference';
import { wrap } from './EntityHelper';

export class EntityLoader {

  private readonly metadata = this.em.getMetadata();
  private readonly driver = this.em.getDriver();

  constructor(private readonly em: EntityManager) { }

  async populate<T extends AnyEntity<T>>(entityName: string, entities: T[], populate: string[] | boolean, where: FilterQuery<T> = {}, orderBy: QueryOrderMap = {}, refresh = false, validate = true, lookup = true): Promise<void> {
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
      throw ValidationError.invalidPropertyName(entityName, invalid);
    }

    for (const field of populate) {
      await this.populateField<T>(entityName, entities, field, where, orderBy, refresh);
    }
  }

  /**
   * preload everything in one call (this will update already existing references in IM)
   */
  private async populateMany<T extends AnyEntity<T>>(entityName: string, entities: T[], field: keyof T, where: FilterQuery<T>, orderBy: QueryOrderMap, refresh: boolean): Promise<AnyEntity[]> {
    // set populate flag
    entities.forEach(entity => {
      if (Utils.isEntity(entity[field], true) || entity[field] as unknown instanceof Collection) {
        wrap(entity[field]).populated();
      }
    });

    const prop = this.metadata.get<T>(entityName).properties[field as string];
    const filtered = this.filterCollections<T>(entities, field, refresh);
    const innerOrderBy = Utils.isObject(orderBy[prop.name]) ? orderBy[prop.name] : undefined;

    if (prop.reference === ReferenceType.MANY_TO_MANY && this.driver.getPlatform().usesPivotTable()) {
      return this.findChildrenFromPivotTable<T>(filtered, prop, field, refresh, where[prop.name], innerOrderBy as QueryOrderMap);
    }

    const data = await this.findChildren<T>(entities, prop, refresh, where[prop.name], innerOrderBy as QueryOrderMap);
    this.initializeCollections<T>(filtered, prop, field, data);

    return data;
  }

  private initializeCollections<T extends AnyEntity<T>>(filtered: T[], prop: EntityProperty, field: keyof T, children: AnyEntity[]): void {
    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      this.initializeOneToMany<T>(filtered, children, prop, field);
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner && !this.driver.getPlatform().usesPivotTable()) {
      this.initializeManyToMany<T>(filtered, children, prop, field);
    }
  }

  private initializeOneToMany<T extends AnyEntity<T>>(filtered: T[], children: AnyEntity[], prop: EntityProperty, field: keyof T): void {
    for (const entity of filtered) {
      const items = children.filter(child => Utils.unwrapReference(child[prop.mappedBy]) as object === entity);
      (entity[field] as unknown as Collection<AnyEntity>).hydrate(items);
    }
  }

  private initializeManyToMany<T extends AnyEntity<T>>(filtered: T[], children: AnyEntity[], prop: EntityProperty, field: keyof T): void {
    for (const entity of filtered) {
      const items = children.filter(child => (child[prop.mappedBy] as object as Collection<AnyEntity>).contains(entity));
      (entity[field] as unknown as Collection<AnyEntity>).hydrate(items);
    }
  }

  private async findChildren<T extends AnyEntity<T>>(entities: T[], prop: EntityProperty, refresh: boolean, where: FilterQuery<T> = {}, orderBy?: QueryOrderMap): Promise<AnyEntity[]> {
    const children = this.getChildReferences<T>(entities, prop, refresh);
    const meta = this.metadata.get(prop.type);
    let fk = meta.primaryKey;

    if (prop.reference === ReferenceType.ONE_TO_MANY || (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner)) {
      fk = meta.properties[prop.mappedBy].name;
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner && !this.em.config.get('autoJoinOneToOneOwner')) {
      children.length = 0;
      children.push(...entities);
      fk = meta.properties[prop.mappedBy].name;
    }

    if (children.length === 0) {
      return [];
    }

    const ids = Utils.unique(children.map(e => e.__primaryKey));
    where = { [fk]: { $in: ids }, ...where };
    orderBy = orderBy || prop.orderBy || { [fk]: QueryOrder.ASC };

    return this.em.find<T>(prop.type, where, { orderBy, refresh });
  }

  private async populateField<T extends AnyEntity<T>>(entityName: string, entities: T[], field: string, where: FilterQuery<T>, orderBy: QueryOrderMap, refresh: boolean): Promise<void> {
    if (!field.includes('.')) {
      return void await this.populateMany<T>(entityName, entities, field as keyof T, where, orderBy, refresh);
    }

    // nested populate
    const [f, ...parts] = field.split('.');
    await this.populateMany<T>(entityName, entities, f as keyof T, where, orderBy, refresh);
    const children: T[] = [];

    for (const entity of entities) {
      if (Utils.isEntity(entity[f])) {
        children.push(entity[f]);
      } else if (entity[f] instanceof Reference) {
        children.push(entity[f].unwrap());
      } else if (entity[f] as object instanceof Collection) {
        children.push(...entity[f].getItems());
      }
    }

    const filtered = Utils.unique(children);
    const prop = this.metadata.get(entityName).properties[f];
    await this.populate<T>(prop.type, filtered, [parts.join('.')], where[prop.name], orderBy[prop.name] as QueryOrderMap, refresh, false, false);
  }

  private async findChildrenFromPivotTable<T extends AnyEntity<T>>(filtered: T[], prop: EntityProperty, field: keyof T, refresh: boolean, where?: FilterQuery<T>, orderBy?: QueryOrderMap): Promise<AnyEntity[]> {
    const map = await this.driver.loadFromPivotTable(prop, filtered.map(e => wrap(e).__primaryKey) as Primary<T>[], where, orderBy, this.em.getTransactionContext());
    const children: AnyEntity[] = [];

    for (const entity of filtered) {
      const items = map[wrap(entity).__primaryKey as number].map(item => this.em.merge(prop.type, item, refresh));
      (entity[field] as unknown as Collection<AnyEntity>).hydrate(items);
      children.push(...items);
    }

    return children;
  }

  private getChildReferences<T extends AnyEntity<T>>(entities: T[], prop: EntityProperty<T>, refresh: boolean): AnyEntity[] {
    const filtered = this.filterCollections(entities, prop.name, refresh);
    const children: AnyEntity[] = [];

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      children.push(...filtered.map(e => (e[prop.name] as unknown as Collection<T>).owner));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      children.push(...filtered.reduce((a, b) => [...a, ...(b[prop.name] as unknown as Collection<AnyEntity>).getItems()], [] as AnyEntity[]));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) { // inversed side
      children.push(...filtered);
    } else { // MANY_TO_ONE or ONE_TO_ONE
      children.push(...this.filterReferences(entities, prop.name, refresh));
    }

    return children;
  }

  private filterCollections<T extends AnyEntity<T>>(entities: T[], field: keyof T, refresh: boolean): T[] {
    if (refresh) {
      return entities.filter(e => e[field]);
    }

    return entities.filter(e => e[field] && !(e[field] as unknown as Collection<AnyEntity>).isInitialized(true));
  }

  private filterReferences<T extends AnyEntity<T>>(entities: T[], field: keyof T, refresh: boolean): T[keyof T][] {
    const children = entities.filter(e => Utils.isEntity(e[field], true));

    if (refresh) {
      return children.map(e => Utils.unwrapReference(e[field]));
    }

    return children.filter(e => !(e[field] as AnyEntity).isInitialized()).map(e => Utils.unwrapReference(e[field]));
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
