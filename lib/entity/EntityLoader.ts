import { EntityProperty, IEntity, IEntityType } from '../decorators';
import { MetadataStorage } from '../metadata';
import { EntityManager } from '../EntityManager';
import { ReferenceType } from './enums';
import { Utils } from '../utils';
import { Collection } from './Collection';

export class EntityLoader {

  private readonly metadata = MetadataStorage.getMetadata();
  private readonly driver = this.em.getDriver();

  constructor(private readonly em: EntityManager) { }

  async populate<T extends IEntityType<T>>(entityName: string, entities: IEntityType<T>[], populate: string[], validate = true): Promise<void> {
    if (entities.length === 0) {
      return;
    }

    for (const field of populate) {
      if (validate && !this.em.canPopulate(entityName, field)) {
        throw new Error(`Entity '${entityName}' does not have property '${field}'`);
      }

      await this.populateField(entityName, entities, field);
    }
  }

  /**
   * preload everything in one call (this will update already existing references in IM)
   */
  private async populateMany<T extends IEntityType<T>>(entityName: string, entities: T[], field: keyof T): Promise<IEntity[]> {
    // set populate flag
    entities.forEach(entity => {
      if (Utils.isEntity(entity[field]) || entity[field] as object instanceof Collection) {
        (entity[field] as IEntity).populated();
      }
    });

    const prop = this.metadata[entityName].properties[field as string];
    const filtered = this.filterCollections<T>(entities, field);

    if (prop.reference === ReferenceType.MANY_TO_MANY && this.driver.getPlatform().usesPivotTable()) {
      return this.findChildrenFromPivotTable<T>(filtered, prop, field);
    }

    const data = await this.findChildren<T>(entities, prop);

    if (data.length === 0) {
      return [];
    }

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
      const items = children.filter(child => child[(prop.fk as keyof IEntity)] as object === entity);
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
    let fk = this.metadata[prop.type].primaryKey;

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      fk = this.metadata[prop.type].properties[prop.fk].fieldName;
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner) {
      fk = this.metadata[prop.type].properties[prop.mappedBy].fieldName;
    }

    if (children.length === 0) {
      return [];
    }

    const ids = Utils.unique(children.map(e => e.id));

    return this.em.find<IEntity>(prop.type, { [fk]: { $in: ids } });
  }

  private async populateField<T extends IEntityType<T>>(entityName: string, entities: IEntityType<T>[], field: string): Promise<void> {
    // nested populate
    if (field.includes('.')) {
      const [f, ...parts] = field.split('.');
      await this.populateMany<T>(entityName, entities, f as keyof T);
      const children: IEntity[] = [];
      entities.forEach(entity => {
        if (Utils.isEntity(entity[f as keyof T])) {
          children.push(entity[f as keyof T]);
        } else if (entity[f as keyof T] as object instanceof Collection) {
          children.push(...entity[f as keyof T].getItems());
        }
      });
      const filtered = Utils.unique(children);
      const prop = this.metadata[entityName].properties[f];
      await this.populate(prop.type, filtered, [parts.join('.')], false);
    } else {
      await this.populateMany<T>(entityName, entities, field as keyof T);
    }
  }

  private async findChildrenFromPivotTable<T extends IEntityType<T>>(filtered: T[], prop: EntityProperty, field: keyof T): Promise<IEntity[]> {
    const map = await this.driver.loadFromPivotTable(prop, filtered.map(e => e.id));
    const children: IEntity[] = [];

    for (const entity of filtered) {
      const items = map[entity.id as number].map(item => this.em.merge(prop.type, item));
      (entity[field] as Collection<IEntity>).set(items, true);
      children.push(...items);
    }

    return children;
  }

  private getChildReferences<T extends IEntityType<T>>(entities: T[], prop: EntityProperty): IEntity[] {
    const name = prop.name as keyof T;
    const filtered = this.filterCollections(entities, name);
    const children: IEntity[] = [];

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      children.push(...filtered.map(e => e[name].owner));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      children.push(...filtered.reduce((a, b) => [...a, ...(b[name] as Collection<IEntity>).getItems()], [] as IEntity[]));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) { // inversed side
      children.push(...filtered);
    } else { // MANY_TO_ONE
      children.push(...entities.filter(e => Utils.isEntity(e[name]) && !(e[name] as IEntity).isInitialized()).map(e => e[name]));
    }

    return children;
  }

  private filterCollections<T extends IEntityType<T>>(entities: T[], field: keyof T): T[] {
    return entities.filter(e => e[field] as object instanceof Collection && !(e[field] as Collection<IEntity>).isInitialized(true));
  }

}
