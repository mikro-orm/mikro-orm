import { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityProperty, IMetadataStorage } from '../typings';
import { ReferenceType } from '../enums';
import { Platform } from '../platforms';
import { Utils } from './Utils';

export class EntityComparator {

  constructor(private readonly metadata: IMetadataStorage,
              private readonly platform: Platform) { }

  /**
   * Computes difference between two entities. First calls `prepareEntity` on both, then uses the `diff` method.
   */
  diffEntities<T extends AnyEntity<T>>(a: T, b: T): EntityData<T> {
    return Utils.diff(this.prepareEntity(a), this.prepareEntity(b)) as EntityData<T>;
  }

  /**
   * Removes ORM specific code from entities and prepares it for serializing. Used before change set computation.
   * References will be mapped to primary keys, collections to arrays of primary keys.
   */
  prepareEntity<T extends AnyEntity<T>>(entity: T): EntityData<T> {
    if ((entity as Dictionary).__prepared) {
      return entity;
    }

    const meta = this.metadata.get<T>(entity.constructor.name);
    const root = Utils.getRootEntity(this.metadata, meta);
    const ret = {} as EntityData<T>;

    if (meta.discriminatorValue) {
      ret[root.discriminatorColumn as keyof T] = meta.discriminatorValue as unknown as T[keyof T];
    }

    // copy all props, ignore collections and references, process custom types
    Object.values<EntityProperty<T>>(meta.properties).forEach(prop => {
      if (this.shouldIgnoreProperty(entity, prop, root)) {
        return;
      }

      if (prop.reference === ReferenceType.EMBEDDED) {
        return Object.values<EntityProperty>(meta.properties).filter(p => p.embedded?.[0] === prop.name).forEach(childProp => {
          ret[childProp.name as keyof T] = Utils.copy(entity[prop.name][childProp.embedded![1]]);
        });
      }

      if (Utils.isEntity(entity[prop.name], true)) {
        ret[prop.name] = Utils.getPrimaryKeyValues(entity[prop.name], this.metadata.find(prop.type)!.primaryKeys, true);

        if (prop.customType) {
          return ret[prop.name] = Utils.copy(prop.customType.convertToDatabaseValue(ret[prop.name], this.platform));
        }

        return;
      }

      if (prop.customType) {
        return ret[prop.name] = Utils.copy(prop.customType.convertToDatabaseValue(entity[prop.name], this.platform));
      }

      if (Array.isArray(entity[prop.name]) || Utils.isObject(entity[prop.name])) {
        return ret[prop.name] = Utils.copy(entity[prop.name]);
      }

      ret[prop.name] = Utils.copy(entity[prop.name]);
    });

    Object.defineProperty(ret, '__prepared', { value: true });

    return ret;
  }

  private shouldIgnoreProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>, root: EntityMetadata) {
    if (!(prop.name in entity) || prop.persist === false) {
      return true;
    }

    const value = entity[prop.name];
    const collection = Utils.isCollection(value);
    const noPkRef = Utils.isEntity<T>(value, true) && !value.__helper!.__primaryKeys.every(pk => Utils.isDefined(pk, true));
    const noPkProp = prop.primary && !Utils.isDefined(value, true);
    const inverse = prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner;
    const discriminator = prop.name === root.discriminatorColumn;

    // bidirectional 1:1 and m:1 fields are defined as setters, we need to check for `undefined` explicitly
    const isSetter = [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference) && (prop.inversedBy || prop.mappedBy);
    const emptyRef = isSetter && value === undefined;

    return collection || noPkProp || noPkRef || inverse || discriminator || emptyRef;
  }

}
