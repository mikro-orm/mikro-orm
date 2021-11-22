import type { AnyEntity, Dictionary, EntityProperty, FilterQuery, PopulateOptions, Primary } from '../typings';
import type { EntityManager } from '../EntityManager';
import { QueryHelper } from '../utils/QueryHelper';
import { Utils } from '../utils/Utils';
import { ValidationError } from '../errors';
import type { Collection } from './Collection';
import type { QueryOrderMap , LockMode } from '../enums';
import { LoadStrategy, QueryOrder, ReferenceType } from '../enums';
import { Reference } from './Reference';
import type { EntityField, FindOptions } from '../drivers/IDatabaseDriver';

export type EntityLoaderOptions<T, P extends string = never> = {
  where?: FilterQuery<T>;
  fields?: readonly EntityField<T, P>[];
  orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[];
  refresh?: boolean;
  validate?: boolean;
  lookup?: boolean;
  convertCustomTypes?: boolean;
  filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
  strategy?: LoadStrategy;
  lockMode?: Exclude<LockMode, LockMode.OPTIMISTIC>;
};

export class EntityLoader {

  private readonly metadata = this.em.getMetadata();
  private readonly driver = this.em.getDriver();

  constructor(private readonly em: EntityManager) { }

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<T extends AnyEntity<T>, P extends string = never>(entityName: string, entities: T[], populate: PopulateOptions<T>[] | boolean, options: EntityLoaderOptions<T, P>): Promise<void> {
    if (entities.length === 0 || populate === false) {
      return;
    }

    options.where ??= {} as FilterQuery<T>;
    options.orderBy ??= {};
    options.filters ??= {};
    options.lookup ??= true;
    options.validate ??= true;
    options.refresh ??= false;
    options.convertCustomTypes ??= true;
    populate = this.normalizePopulate<T>(entityName, populate, options.strategy, options.lookup);
    const invalid = populate.find(({ field }) => !this.em.canPopulate(entityName, field));

    if (options.validate && invalid) {
      throw ValidationError.invalidPropertyName(entityName, invalid.field);
    }

    entities.forEach(e => e.__helper!.__serializationContext.populate = e.__helper!.__serializationContext.populate ?? populate as PopulateOptions<T>[]);

    for (const pop of populate) {
      await this.populateField<T>(entityName, entities, pop, options as Required<EntityLoaderOptions<T>>);
    }
  }

  normalizePopulate<T>(entityName: string, populate: PopulateOptions<T>[] | true, strategy?: LoadStrategy, lookup = true): PopulateOptions<T>[] {
    if (populate === true || populate.some(p => p.all)) {
      populate = this.lookupAllRelationships(entityName, strategy);
    } else {
      populate = Utils.asArray(populate);
    }

    if (lookup) {
      populate = this.lookupEagerLoadedRelationships(entityName, populate, strategy);
    }

    // convert nested `field` with dot syntax to PopulateOptions with children array
    populate.forEach(p => {
      if (!p.field.includes('.')) {
        return;
      }

      const [f, ...parts] = p.field.split('.');
      p.field = f;
      p.children = p.children || [];
      const prop = this.metadata.find(entityName)!.properties[f];
      p.children.push(this.expandNestedPopulate(prop.type, parts, p.strategy));
    });

    // merge same fields
    return this.mergeNestedPopulate(populate);
  }

  /**
   * merge multiple populates for the same entity with different children
   */
  private mergeNestedPopulate<T>(populate: PopulateOptions<T>[]): PopulateOptions<T>[] {
    const tmp = populate.reduce((ret, item) => {
      if (!ret[item.field]) {
        ret[item.field] = item;
        return ret;
      }

      if (!ret[item.field].children && item.children) {
        ret[item.field].children = item.children;
      } else if (ret[item.field].children && item.children) {
        ret[item.field].children!.push(...item.children!);
      }

      return ret;
    }, {} as Dictionary<PopulateOptions<T>>);

    return Object.values(tmp).map(item => {
      if (item.children) {
        item.children = this.mergeNestedPopulate<T>(item.children);
      }

      return item;
    });
  }

  /**
   * Expands `books.perex` like populate to use `children` array instead of the dot syntax
   */
  private expandNestedPopulate<T>(entityName: string, parts: string[], strategy?: LoadStrategy): PopulateOptions<T> {
    const meta = this.metadata.find(entityName)!;
    const field = parts.shift()!;
    const prop = meta.properties[field];
    const ret = { field, strategy } as PopulateOptions<T>;

    if (parts.length > 0) {
      ret.children = [this.expandNestedPopulate(prop.type, parts, strategy)];
    }

    return ret;
  }

  /**
   * preload everything in one call (this will update already existing references in IM)
   */
  private async populateMany<T extends AnyEntity<T>>(entityName: string, entities: T[], populate: PopulateOptions<T>, options: Required<EntityLoaderOptions<T>>): Promise<AnyEntity[]> {
    const field = populate.field as keyof T;
    const meta = this.metadata.find<T>(entityName)!;
    const prop = meta.properties[field as string];

    if ((prop.reference === ReferenceType.SCALAR && prop.lazy) || prop.reference === ReferenceType.EMBEDDED) {
      return [];
    }

    // set populate flag
    entities.forEach(entity => {
      const value = entity[field];

      if (Utils.isEntity(value, true)) {
        (value as AnyEntity).__helper!.populated();
      } else if (Utils.isCollection(value)) {
        value.populated();
      }
    });

    const filtered = this.filterCollections<T>(entities, field, options.refresh);
    const innerOrderBy = Utils.asArray(options.orderBy)
      .filter(orderBy => Utils.isObject(orderBy[prop.name]))
      .map(orderBy => orderBy[prop.name]);

    if (prop.reference === ReferenceType.MANY_TO_MANY && this.driver.getPlatform().usesPivotTable()) {
      return this.findChildrenFromPivotTable<T>(filtered, prop, options, innerOrderBy, populate);
    }

    const where = await this.extractChildCondition(options, prop);
    const data = await this.findChildren<T>(entities, prop, populate, { ...options, where, orderBy: innerOrderBy! });
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
      const items = children.filter(child => {
        if (prop.targetMeta!.properties[prop.mappedBy].mapToPk) {
          return child[prop.mappedBy] as unknown === entity.__helper!.getPrimaryKey();
        }

        return Reference.unwrapReference(child[prop.mappedBy]) as unknown === entity;
      });

      (entity[field] as unknown as Collection<AnyEntity>).hydrate(items);
    }
  }

  private initializeManyToMany<T extends AnyEntity<T>>(filtered: T[], children: AnyEntity[], prop: EntityProperty, field: keyof T): void {
    for (const entity of filtered) {
      const items = children.filter(child => (child[prop.mappedBy] as unknown as Collection<AnyEntity>).contains(entity));
      (entity[field] as unknown as Collection<AnyEntity>).hydrate(items);
    }
  }

  private async findChildren<T extends AnyEntity<T>>(entities: T[], prop: EntityProperty<T>, populate: PopulateOptions<T>, options: Required<EntityLoaderOptions<T>>): Promise<AnyEntity[]> {
    const children = this.getChildReferences<T>(entities, prop, options.refresh);
    const meta = this.metadata.find(prop.type)!;
    let fk = Utils.getPrimaryKeyHash(meta.primaryKeys);

    if (prop.reference === ReferenceType.ONE_TO_MANY || (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner)) {
      fk = meta.properties[prop.mappedBy].name;
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner && populate.strategy !== LoadStrategy.JOINED && !this.em.config.get('autoJoinOneToOneOwner')) {
      children.length = 0;
      children.push(...entities);
      fk = meta.properties[prop.mappedBy].name;
    }

    if (children.length === 0) {
      return [];
    }

    const ids = Utils.unique(children.map(e => Utils.getPrimaryKeyValues(e, e.__meta!.primaryKeys, true)));
    const cond1 = QueryHelper.processWhere({ [fk]: { $in: ids } }, meta.name!, this.metadata, this.driver.getPlatform(), !options.convertCustomTypes);

    const where = options.where[fk]
      ? { $and: [cond1, options.where] }
      : { ...cond1, ...(options.where as Dictionary) };
    const fields = this.buildFields<T>(prop, options);
    const { refresh, filters, convertCustomTypes, lockMode, strategy } = options;

    return this.em.find<T>(prop.type, where as FilterQuery<T>, {
      refresh, filters, convertCustomTypes, lockMode, strategy,
      orderBy: [...Utils.asArray(options.orderBy), ...Utils.asArray(prop.orderBy), { [fk]: QueryOrder.ASC }] as QueryOrderMap<T>[],
      populate: populate.children as never,
      fields: fields.length > 0 ? fields : undefined,
    }) as Promise<T[]>;
  }

  private async populateField<T extends AnyEntity<T>>(entityName: string, entities: T[], populate: PopulateOptions<T>, options: Required<EntityLoaderOptions<T>>): Promise<void> {
    if (!populate.children) {
      return void await this.populateMany<T>(entityName, entities, populate, options);
    }

    await this.populateMany<T>(entityName, entities, populate, options);
    const prop = this.metadata.find(entityName)!.properties[populate.field];
    const children: T[] = [];

    for (const entity of entities) {
      if (Utils.isEntity(entity[populate.field])) {
        children.push(entity[populate.field]);
      } else if (Reference.isReference(entity[populate.field])) {
        children.push(entity[populate.field].unwrap());
      } else if (Utils.isCollection(entity[populate.field])) {
        children.push(...entity[populate.field].getItems());
      } else if (entity[populate.field] && prop.reference === ReferenceType.EMBEDDED) {
        children.push(...Utils.asArray(entity[populate.field]));
      }
    }

    const filtered = Utils.unique(children);
    const fields = this.buildFields<T>(prop, options);
    const innerOrderBy = Utils.asArray(options.orderBy)
      .filter(orderBy => Utils.isObject(orderBy[prop.name]))
      .map(orderBy => orderBy[prop.name]);

    await this.populate<T>(prop.type, filtered, populate.children, {
      where: await this.extractChildCondition(options, prop, false) as FilterQuery<T>,
      orderBy: innerOrderBy,
      refresh: options.refresh,
      fields: fields.length > 0 ? fields : undefined,
      filters: options.filters,
      validate: false,
      lookup: false,
    });
  }

  private async findChildrenFromPivotTable<T extends AnyEntity<T>>(filtered: T[], prop: EntityProperty<T>, options: Required<EntityLoaderOptions<T>>, orderBy?: QueryOrderMap<T>[], populate?: PopulateOptions<T>): Promise<AnyEntity[]> {
    const ids = filtered.map((e: AnyEntity<T>) => e.__helper!.__primaryKeys);
    const refresh = options.refresh;
    const where = await this.extractChildCondition(options, prop, true);
    const fields = this.buildFields(prop, options);
    const options2 = { ...options } as FindOptions<T>;
    delete options2.limit;
    delete options2.offset;
    options2.fields = (fields.length > 0 ? fields : undefined) as EntityField<T>[];
    options2.populate = (populate?.children ?? []) as never;

    if (prop.customType) {
      ids.forEach((id, idx) => ids[idx] = QueryHelper.processCustomType<T>(prop, id as FilterQuery<T>, this.driver.getPlatform()) as Primary<T>[]);
    }

    const map = await this.driver.loadFromPivotTable(prop, ids, where, orderBy, this.em.getTransactionContext(), options2);
    const children: AnyEntity[] = [];

    for (const entity of filtered) {
      const items = map[entity.__helper!.getSerializedPrimaryKey()].map(item => {
        const entity = this.em.getEntityFactory().create<T>(prop.type, item, { refresh, merge: true, convertCustomTypes: true });
        return this.em.getUnitOfWork().registerManaged<T>(entity, item, refresh);
      });
      (entity[prop.name] as unknown as Collection<AnyEntity>).hydrate(items);
      children.push(...items);
    }

    return children;
  }

  private async extractChildCondition<T>(options: Required<EntityLoaderOptions<T>>, prop: EntityProperty<T>, filters = false) {
    const subCond = Utils.isPlainObject(options.where[prop.name as string]) ? options.where[prop.name as string] : {};
    const meta2 = this.metadata.find(prop.type)!;
    const pk = Utils.getPrimaryKeyHash(meta2.primaryKeys);

    ['$and', '$or'].forEach(op => {
      if (options.where[op]) {
        const child = options.where[op]
          .map((cond: Dictionary) => cond[prop.name])
          .filter((sub: unknown) => sub != null && !(Utils.isPlainObject(sub) && Object.keys(sub).every(key => Utils.isOperator(key, false))))
          .map((cond: Dictionary) => {
            if (Utils.isPrimaryKey(cond)) {
              return { [pk]: cond };
            }

            return cond;
          });

        if (child.length > 0) {
          subCond[op] = child;
        }
      }
    });

    const operators = Object.keys(subCond).filter(key => Utils.isOperator(key, false));

    if (operators.length > 0) {
      operators.forEach(op => {
        subCond[pk] ??= {};
        subCond[pk][op] = subCond[op];
        delete subCond[op];
      });
    }

    if (filters) {
      return this.em.applyFilters(prop.type, subCond, options.filters, 'read');
    }

    return subCond;
  }

  private buildFields<T>(prop: EntityProperty<T>, options: Required<EntityLoaderOptions<T>>): EntityField<T>[] {
    return (options.fields || []).reduce((ret, f) => {
      if (Utils.isPlainObject(f)) {
        Object.keys(f)
          .filter(ff => ff === prop.name)
          .forEach(ff => ret.push(...f[ff] as EntityField<T>[]));
      } else if (f.toString().includes('.')) {
        const parts = f.toString().split('.');
        const propName = parts.shift();
        const childPropName = parts.join('.') as EntityField<T>;

        /* istanbul ignore else */
        if (propName === prop.name) {
          ret.push(childPropName);
        }
      }

      return ret;
    }, [] as EntityField<T>[]);
  }

  private getChildReferences<T extends AnyEntity<T>>(entities: T[], prop: EntityProperty<T>, refresh: boolean): AnyEntity[] {
    const filtered = this.filterCollections(entities, prop.name, refresh);
    const children: AnyEntity[] = [];

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      children.push(...filtered.map(e => (e[prop.name] as unknown as Collection<T>).owner));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      children.push(...filtered.reduce((a, b) => [...a, ...(b[prop.name] as unknown as Collection<AnyEntity>).getItems()], [] as AnyEntity[]));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) { // inverse side
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

    return entities.filter(e => Utils.isCollection(e[field]) && !(e[field] as unknown as Collection<AnyEntity>).isInitialized(true));
  }

  private filterReferences<T extends AnyEntity<T>>(entities: T[], field: keyof T, refresh: boolean): T[keyof T][] {
    const children = entities.filter(e => Utils.isEntity(e[field], true));

    if (refresh) {
      return children.map(e => Reference.unwrapReference(e[field]));
    }

    return children.filter(e => !(e[field] as AnyEntity).__helper!.__initialized).map(e => Reference.unwrapReference(e[field]));
  }

  private lookupAllRelationships<T>(entityName: string, strategy?: LoadStrategy, prefix = '', visited: string[] = []): PopulateOptions<T>[] {
    if (visited.includes(entityName)) {
      return [];
    }

    visited.push(entityName);
    const ret: PopulateOptions<T>[] = [];
    const meta = this.metadata.find(entityName)!;

    meta.relations.forEach(prop => {
      const prefixed = prefix ? `${prefix}.${prop.name}` : prop.name;
      const nested = this.lookupAllRelationships(prop.type, strategy, prefixed, visited);

      if (nested.length > 0) {
        ret.push(...nested);
      } else {
        ret.push({
          field: prefixed,
          strategy: strategy ?? prop.strategy ?? this.em.config.get('loadStrategy'),
        });
      }
    });

    return ret;
  }

  private lookupEagerLoadedRelationships<T>(entityName: string, populate: PopulateOptions<T>[], strategy?: LoadStrategy, prefix = '', visited: string[] = []): PopulateOptions<T>[] {
    if (visited.includes(entityName)) {
      return [];
    }

    visited.push(entityName);
    const meta = this.metadata.find(entityName)!;
    const ret: PopulateOptions<T>[] = prefix === '' ? [...populate] : [];

    meta.relations
      .filter(prop => prop.eager || populate.some(p => p.field === prop.name))
      .forEach(prop => {
        const prefixed = prefix ? `${prefix}.${prop.name}` : prop.name;
        const nestedPopulate = populate.find(p => p.field === prop.name)?.children ?? [];
        const nested = this.lookupEagerLoadedRelationships(prop.type, nestedPopulate, strategy, prefixed, visited);

        if (nested.length > 0) {
          ret.push(...nested);
        } else {
          ret.push({
            field: prefixed,
            strategy: strategy ?? prop.strategy ?? this.em.config.get('loadStrategy'),
          });
        }
      });

    return ret;
  }

}
