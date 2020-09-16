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
    const ret = {} as EntityData<T>;

    if (meta.discriminatorValue) {
      ret[meta.root.discriminatorColumn as keyof T] = meta.discriminatorValue as unknown as T[keyof T];
    }

    // copy all comparable props, ignore collections and references, process custom types
    meta.comparableProps.forEach(prop => {
      if (this.shouldIgnoreProperty(entity, prop)) {
        return;
      }

      if (prop.reference === ReferenceType.EMBEDDED) {
        return meta.props.filter(p => p.embedded?.[0] === prop.name).forEach(childProp => {
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

      if (prop.type.toLowerCase() === 'date') {
        return ret[prop.name] = Utils.copy(this.platform.processDateProperty(entity[prop.name]));
      }

      if (Array.isArray(entity[prop.name]) || Utils.isObject(entity[prop.name])) {
        return ret[prop.name] = Utils.copy(entity[prop.name]);
      }

      ret[prop.name] = Utils.copy(entity[prop.name]);
    });

    Object.defineProperty(ret, '__prepared', { value: true });

    return ret;
  }

  /**
   * should be used only for `meta.comparableProps` that are defined based on the static `isComparable` helper
   */
  private shouldIgnoreProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>) {
    if (!(prop.name in entity)) {
      return true;
    }

    const value = entity[prop.name];
    const noPkRef = Utils.isEntity<T>(value, true) && !value.__helper!.hasPrimaryKey();
    const noPkProp = prop.primary && !Utils.isDefined(value, true);

    // bidirectional 1:1 and m:1 fields are defined as setters, we need to check for `undefined` explicitly
    const isSetter = [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference) && (prop.inversedBy || prop.mappedBy);
    const emptyRef = isSetter && value === undefined;

    return noPkProp || noPkRef || emptyRef || prop.version;
  }

  /**
   * perf: used to generate list of comparable properties during discovery, so we speed up the runtime comparison
   */
  static isComparable<T extends AnyEntity<T>>(prop: EntityProperty<T>, root: EntityMetadata) {
    const virtual = prop.persist === false;
    const inverse = prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner;
    const discriminator = prop.name === root.discriminatorColumn;
    const collection = prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.MANY_TO_MANY;

    return !virtual && !collection && !inverse && !discriminator && !prop.version;
  }

}
