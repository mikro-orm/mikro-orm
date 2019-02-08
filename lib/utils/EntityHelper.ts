import { Collection } from '../Collection';
import { SCALAR_TYPES } from '../EntityFactory';
import { EntityManager } from '../EntityManager';
import { EntityMetadata, EntityProperty, IEntity, IEntityType, ReferenceType } from '../decorators/Entity';
import { Utils } from './Utils';
import { MetadataStorage } from '../metadata/MetadataStorage';

export class EntityHelper {

  static async init(entity: IEntity, populated = true): Promise<IEntity> {
    await entity.__em.findOne(entity.constructor.name, entity.id);
    entity.populated(populated);

    return entity;
  }

  static assign<T extends IEntityType<T>>(entity: T, data: any): void {
    const metadata = MetadataStorage.getMetadata();
    const meta = metadata[entity.constructor.name];
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (props[prop] && props[prop].reference === ReferenceType.MANY_TO_ONE && data[prop]) {
        return EntityHelper.assignReference<T>(entity, data[prop], props[prop], entity.__em);
      }

      const isCollection = props[prop] && [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference);

      if (isCollection && Array.isArray(data[prop])) {
        return EntityHelper.assignCollection<T>(entity, data[prop], props[prop], entity.__em);
      }

      if (props[prop] && props[prop].reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(props[prop].type)) {
        entity[prop as keyof T] = entity.__em.validator.validateProperty(props[prop], data[prop], entity)
      }

      entity[prop as keyof T] = data[prop];
    });
  }

  static toObject<T extends IEntityType<T>>(entity: T, parent?: IEntity, isCollection = false): { [field: string]: any } {
    parent = parent || entity;
    const ret = entity.id ? { id: entity.id } : {} as any;

    if (!entity.isInitialized() && entity.id) {
      return ret;
    }

    Object.keys(entity).forEach(prop => {
      if (prop === 'id' || prop.startsWith('_')) {
        return;
      }

      if (entity[prop as keyof T] as any instanceof Collection) {
        const col = entity[prop as keyof T] as Collection<IEntity>;

        if (col.isInitialized(true) && col.shouldPopulate()) {
          ret[prop] = col.toArray(entity);
        } else if (col.isInitialized() && !col.shouldPopulate()) {
          ret[prop] = col.getIdentifiers();
        }

        return;
      }

      if (Utils.isEntity(entity[prop as keyof T])) {
        const child = entity[prop as keyof T] as IEntity;

        if (child.isInitialized() && child.__populated && !isCollection && child !== parent) {
          return ret[prop] = EntityHelper.toObject(child, entity);
        }

        return ret[prop] = entity[prop as keyof T].id;
      }

      ret[prop] = entity[prop as keyof T];
    });

    return ret;
  }

  private static assignReference<T extends IEntityType<T>>(entity: T, value: any, prop: EntityProperty, em: EntityManager): void {
    if (Utils.isEntity(value)) {
      entity[prop.name as keyof T] = value;
      return;
    }

    const id = Utils.extractPK(value);

    if (id) {
      const normalized = em.getDriver().normalizePrimaryKey(id);
      entity[prop.name as keyof T] = em.getReference(prop.type, normalized);
      return;
    }

    const name = entity.constructor.name;
    throw new Error(`Invalid reference value provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(value)}`);
  }

  private static assignCollection<T extends IEntityType<T>>(entity: T, value: any[], prop: EntityProperty, em: EntityManager): void {
    const invalid: any[] = [];
    const items = value.map((item: any) => {
      if (Utils.isEntity(item)) {
        return item;
      }

      if (Utils.isPrimaryKey(item)) {
        const id = em.getDriver().normalizePrimaryKey(item);
        return em.getReference(prop.type, id);
      }

      invalid.push(item);
    });

    if (invalid.length > 0) {
      const name = entity.constructor.name;
      throw new Error(`Invalid collection values provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(invalid)}`);
    }

    (entity[prop.name as keyof T] as Collection<IEntity>).set(items);
  }

  static decorate(meta: EntityMetadata, em: EntityManager) {
    const pk = meta.properties[meta.primaryKey];

    // define magic id property getter/setter if PK property is `_id` and there is no `id` property defined
    if (pk.name === '_id' && !meta.properties.id) {
      Object.defineProperty(meta.prototype, 'id', {
        get(): string | null {
          return this._id ? em.getDriver().normalizePrimaryKey<string>(this._id) : null;
        },
        set(id: string): void {
          this._id = id ? em.getDriver().denormalizePrimaryKey(id) : null;
        },
      });
    }

    Object.defineProperties(meta.prototype, {
      __populated: { value: false, writable: true, enumerable: false, configurable: false },
      __entity: { value: true, writable: false, enumerable: false, configurable: false },
      __em: { value: em, writable: false, enumerable: false, configurable: false },
      isInitialized: {
        value() {
          return this.__initialized !== false;
        },
      },
      populated: {
        value(populated = true) {
          this.__populated = populated;
        },
      },
      init: {
        async value(populated = true): Promise<IEntity> {
          return EntityHelper.init(this, populated);
        },
      },
      toObject: {
        value(parent?: IEntity, isCollection?: boolean) {
          return EntityHelper.toObject(this, parent, isCollection);
        }
      },
    });

    if (!(meta.prototype as any).assign) {
      Object.defineProperty(meta.prototype, 'assign', {
        value(data: any) {
          EntityHelper.assign(this, data);
        },
      });
    }

    if (!(meta.prototype as any).toJSON) {
      Object.defineProperty(meta.prototype, 'toJSON', {
        value() {
          return EntityHelper.toObject(this);
        },
      });
    }
  }

}
