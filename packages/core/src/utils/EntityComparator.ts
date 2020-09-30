import { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityProperty, IMetadataStorage } from '../typings';
import { ReferenceType } from '../enums';
import { Platform } from '../platforms';
import { Utils } from './Utils';

type Comparator<T> = (a: T, b: T) => EntityData<T>;

/**
 * Checks if arguments are deeply (but not strictly) equal.
 */
function equals(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) {
      return false;
    }

    if (Array.isArray(a)) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return compareArrays(a, b);
    }

    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return compareBuffers(a as Buffer, b as Buffer);
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return compareObjects(a, b);
  }

  // true if both NaN, false otherwise
  return false;
}

function compareObjects(a: any, b: any) {
  if (a === b) {
    return true;
  }

  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || a.constructor !== b.constructor) {
    return false;
  }

  if (a.valueOf !== Object.prototype.valueOf) {
    return a.valueOf() === b.valueOf();
  }

  if (a.toString !== Object.prototype.toString) {
    return a.toString() === b.toString();
  }

  const keys = Object.keys(a);
  const length = keys.length;

  if (length !== Object.keys(b).length) {
    return false;
  }

  for (let i = length; i-- !== 0;) {
    if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
      return false;
    }
  }

  for (let i = length; i-- !== 0;) {
    const key = keys[i];

    if (!equals(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

function compareArrays(a: any[], b: any[]) {
  const length = a.length;

  if (length !== b.length) {
    return false;
  }

  for (let i = length; i-- !== 0;) {
    if (!equals(a[i], b[i])) {
      return false;
    }
  }

  return true;
}

function compareBuffers(a: Buffer, b: Buffer): boolean {
  const length = a.length;

  if (length !== b.length) {
    return false;
  }

  for (let i = length; i-- !== 0;) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

export class EntityComparator {

  private readonly comparators = new Map<string, Comparator<any>>();

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
      return entity as EntityData<T>;
    }

    const meta = this.metadata.get<T>(entity.constructor.name);
    const ret = {} as EntityData<T>;

    if (meta.discriminatorValue) {
      ret[meta.root.discriminatorColumn as keyof T] = meta.discriminatorValue as unknown as EntityData<T>[keyof T];
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

  getEntityComparator<T>(entityName: string): Comparator<T> {
    if (this.comparators.has(entityName)) {
      return this.comparators.get(entityName) as Comparator<any>;
    }

    const meta = this.metadata.find<T>(entityName)!;
    const props: string[] = [];
    const context = new Map<string, any>();
    context.set('compareArrays', compareArrays);
    context.set('compareBuffers', compareBuffers);
    context.set('compareObjects', compareObjects);
    context.set('equals', equals);

    meta.comparableProps.forEach(prop => {
      props.push(this.getPropertyComparator(prop));
    });

    const code = `return function(last, current) {\n  const diff = {};\n${props.join('\n')}\n  return diff;\n}`;
    const comparator = new Function(...context.keys(), code)(...context.values()) as Comparator<T>;
    this.comparators.set(entityName, comparator);

    return comparator;
  }

  private getGenericComparator(prop: string, cond: string): string {
    return `  if (!current.${prop} && !last.${prop}) {\n\n` +
           `  } else if ((current.${prop} && !last.${prop}) || (!current.${prop} && last.${prop})) {\n` +
           `    diff.${prop} = current.${prop};\n` +
           `  } else if (${cond}) {\n` +
           `    diff.${prop} = current.${prop};\n` +
           `  }\n`;
  }

  private getPropertyComparator<T>(prop: EntityProperty<T>): string {
    let type = prop.type.toLowerCase();

    if (prop.reference !== ReferenceType.SCALAR) {
      const meta2 = this.metadata.find(prop.type)!;

      if (meta2.primaryKeys.length > 1) {
        type = 'array';
      } else {
        type = meta2.properties[meta2.primaryKeys[0]].type.toLowerCase();
      }
    }

    if (prop.customType) {
      type = prop.customType.compareAsType();
    }

    if (['string', 'number', 'boolean'].includes(type)) {
      return `  if (last.${prop.name} !== current.${prop.name}) diff.${prop.name} = current.${prop.name};`;
    }

    if (['array'].includes(type) || type.endsWith('[]')) {
      return this.getGenericComparator(prop.name, `!compareArrays(last.${prop.name}, current.${prop.name})`);
    }

    if (['buffer', 'uint8array'].includes(type)) {
      return this.getGenericComparator(prop.name, `!compareBuffers(last.${prop.name}, current.${prop.name})`);
    }

    if (['date'].includes(type)) {
      return this.getGenericComparator(prop.name, `last.${prop.name}.valueOf() !== current.${prop.name}.valueOf()`);
    }

    if (['objectid'].includes(type)) {
      const cond = `last.${prop.name}.toHexString() !== current.${prop.name}.toHexString()`;
      return this.getGenericComparator(prop.name, cond);
    }

    return `  if (!compareObjects(last.${prop.name}, current.${prop.name})) diff.${prop.name} = current.${prop.name};`;
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
