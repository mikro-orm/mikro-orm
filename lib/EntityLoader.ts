import { Utils } from './utils/Utils';
import { Collection } from './Collection';
import { EntityProperty, IEntity, IEntityType, ReferenceType } from './decorators/Entity';
import { MetadataStorage } from './metadata/MetadataStorage';
import { EntityManager } from './EntityManager';

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

      // nested populate
      if (field.includes('.')) {
        const [f, ...parts] = field.split('.');
        await this.populateMany<T>(entityName, entities, f as keyof T);
        const children: IEntity[] = [];
        entities.forEach(entity => {
          if (Utils.isEntity(entity[f as keyof T])) {
            children.push(entity[f as keyof T]);
          } else if (entity[f as keyof T] as any instanceof Collection) {
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
  }

  /**
   * preload everything in one call (this will update already existing references in IM)
   */
  private async populateMany<T extends IEntityType<T>>(entityName: string, entities: T[], field: keyof T): Promise<IEntity[]> {
    // set populate flag
    entities.forEach(entity => {
      if (Utils.isEntity(entity[field]) || entity[field] as any instanceof Collection) {
        (entity[field] as IEntity).populated();
      }
    });

    const prop = this.metadata[entityName].properties[field as string];
    const filtered = entities.filter(e => e[field] as any instanceof Collection && !(e[field] as Collection<IEntity>).isInitialized(true));

    if (prop.reference === ReferenceType.MANY_TO_MANY && this.driver.usesPivotTable()) {
      const map = await this.driver.loadFromPivotTable(prop, filtered.map(e => e.id));
      const children: IEntity[] = [];

      for (const entity of filtered) {
        const items = map[entity.id as number].map(item => this.em.merge(prop.type, item));
        (entity[field] as Collection<IEntity>).set(items, true);
        children.push(...items);
      }

      return children;
    }

    const data = await this.findChildren<T>(entities, prop);

    if (data.length === 0) {
      return [];
    }

    // initialize collections for one to many
    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      for (const entity of filtered) {
        const items = data.filter(child => child[prop.fk] === entity);
        (entity[field] as Collection<IEntity>).set(items, true);
      }
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner && !this.driver.usesPivotTable()) {
      for (const entity of filtered) {
        const items = data.filter(child => (child[prop.mappedBy] as Collection<IEntity>).contains(entity));
        (entity[field] as Collection<IEntity>).set(items, true);
      }
    }

    return data;
  }

  private async findChildren<T extends IEntityType<T>>(entities: T[], prop: EntityProperty): Promise<IEntityType<any>[]> {
    const name = prop.name as keyof T;
    const filtered = entities.filter(e => e[name] as any instanceof Collection && !(e[name] as any as Collection<IEntity>).isInitialized(true));
    const children: IEntity[] = [];
    let fk = this.metadata[prop.type].primaryKey;

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      children.push(...filtered.map(e => e[name].owner));
      fk = this.metadata[prop.type].properties[prop.fk].fieldName;
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      children.push(...filtered.reduce((a, b) => [...a, ...(b[name] as Collection<IEntity>).getItems()], [] as IEntity[]));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) { // inversed side
      children.push(...filtered);
      fk = this.metadata[prop.type].properties[prop.mappedBy].fieldName;
    } else { // MANY_TO_ONE
      children.push(...entities.filter(e => Utils.isEntity(e[name]) && !(e[name] as IEntity).isInitialized()).map(e => e[name]));
    }

    if (children.length === 0) {
      return [];
    }

    const ids = Utils.unique(children.map(e => e.id));

    return this.em.find<IEntity>(prop.type, { [fk]: { $in: ids } });
  }

}
