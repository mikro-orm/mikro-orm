import clone from 'clone';
import { AnyEntity, EntityData, EntityMetadata, EntityProperty, IMetadataStorage } from '../typings';
import { ReferenceType } from '../enums';
import { Platform } from '../platforms';
import { Utils, compareArrays, compareBuffers, compareObjects, equals } from './Utils';

type Comparator<T> = (a: T, b: T) => EntityData<T>;
type ResultMapper<T> = (result: EntityData<T>) => EntityData<T> | null;
type SnapshotGenerator<T> = (entity: T) => EntityData<T>;

export class EntityComparator {

  private readonly comparators = new Map<string, Comparator<any>>();
  private readonly mappers = new Map<string, ResultMapper<any>>();
  private readonly snapshotGenerators = new Map<string, SnapshotGenerator<any>>();

  constructor(private readonly metadata: IMetadataStorage,
              private readonly platform: Platform) { }

  /**
   * Computes difference between two entities.
   */
  diffEntities<T extends EntityData<T>>(entityName: string, a: T, b: T): EntityData<T> {
    const comparator = this.getEntityComparator<T>(entityName);
    return comparator(a, b);
  }

  /**
   * Removes ORM specific code from entities and prepares it for serializing. Used before change set computation.
   * References will be mapped to primary keys, collections to arrays of primary keys.
   */
  prepareEntity<T extends AnyEntity<T>>(entity: T): EntityData<T> {
    const generator = this.getSnapshotGenerator<T>(entity.constructor.name);
    return generator(entity);
  }

  /**
   * Maps database columns to properties.
   */
  mapResult<T extends AnyEntity<T>>(entityName: string, result: EntityData<T>): EntityData<T> | null {
    const mapper = this.getResultMapper<T>(entityName);
    return mapper(result);
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getSnapshotGenerator<T extends AnyEntity<T>>(entityName: string): SnapshotGenerator<T> {
    const exists = this.snapshotGenerators.get(entityName);

    if (exists) {
      return exists;
    }

    const meta = this.metadata.find<T>(entityName)!;
    const props: string[] = [];
    const context = new Map<string, any>();
    context.set('clone', clone);

    if (meta.discriminatorValue) {
      props.push(`  ret.${meta.root.discriminatorColumn} = '${meta.discriminatorValue}'`);
    }

    // copy all comparable props, ignore collections and references, process custom types
    meta.comparableProps.forEach(prop => {
      props.push(this.getPropertySnapshot(meta, prop, context));
    });

    const code = `return function(entity) {\n  const ret = {};\n${props.join('\n')}\n  return ret;\n}`;
    const snapshotGenerator = this.createFunction(context, code);
    this.snapshotGenerators.set(entityName, snapshotGenerator);

    return snapshotGenerator;
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getResultMapper<T extends AnyEntity<T>>(entityName: string): ResultMapper<T> {
    const exists = this.mappers.get(entityName);

    if (exists) {
      return exists;
    }

    const meta = this.metadata.find<T>(entityName)!;

    if (!meta) {
      return i => i;
    }

    const props: string[] = [];
    const context = new Map<string, any>();

    props.push(`  const mapped = {};`);
    meta.props.forEach(prop => {
      if (prop.fieldNames) {
        if (prop.fieldNames.length > 1) {
          props.push(`  if (${prop.fieldNames.map(field => `result.${field} != null`).join(' && ')}) {\n    ret.${prop.name} = [${prop.fieldNames.map(field => `result.${field}`).join(', ')}];`);
          props.push(...prop.fieldNames.map(field => `    mapped.${field} = true;`));
          props.push(`  } else if (${prop.fieldNames.map(field => `result.${field} == null`).join(' && ')}) {\n    ret.${prop.name} = null;`);
          props.push(...prop.fieldNames.map(field => `    mapped.${field} = true;`), '  }');
        } else {
          if (prop.type === 'boolean') {
            props.push(`  if ('${prop.fieldNames[0]}' in result) { ret.${prop.name} = result.${prop.fieldNames[0]} == null ? result.${prop.fieldNames[0]} : !!result.${prop.fieldNames[0]}; mapped.${prop.fieldNames[0]} = true; }`);
          } else {
            props.push(`  if ('${prop.fieldNames[0]}' in result) { ret.${prop.name} = result.${prop.fieldNames[0]}; mapped.${prop.fieldNames[0]} = true; }`);
          }
        }
      }
    });
    props.push(`  for (let k in result) { if (result.hasOwnProperty(k) && !mapped[k]) ret[k] = result[k]; }`);

    const code = `return function(result) {\n  const ret = {};\n${props.join('\n')}\n  return ret;\n}`;
    const snapshotGenerator = this.createFunction(context, code);
    this.mappers.set(entityName, snapshotGenerator);

    return snapshotGenerator;
  }

  /* istanbul ignore next */
  private createFunction(context: Map<string, any>, code: string) {
    try {
      return new Function(...context.keys(), code)(...context.values());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(code);
      throw e;
    }
  }

  private getPropertyCondition<T>(prop: EntityProperty<T>): string {
    let ret = `'${prop.name}' in entity`;
    const isRef = [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference);
    const isSetter = isRef && !!(prop.inversedBy || prop.mappedBy);

    if (prop.primary || isSetter) {
      ret += ` && entity.${prop.name} != null`;
    }

    if (isRef) {
      ret += ` && (entity.${prop.name} == null || entity.${prop.name}.__helper.hasPrimaryKey())`;
    }

    return ret;
  }

  private getPropertySnapshot<T>(meta: EntityMetadata<T>, prop: EntityProperty<T>, context: Map<string, any>): string {
    let ret = `  if (${this.getPropertyCondition(prop)}) {\n`;

    if (['number', 'string', 'boolean'].includes(prop.type.toLowerCase())) {
      return ret + `    ret.${prop.name} = entity.${prop.name};\n}\n`;
    }

    if (prop.reference === ReferenceType.EMBEDDED) {
      return ret + meta.props.filter(p => p.embedded?.[0] === prop.name).map(childProp => {
        return `    ret.${childProp.name} = clone(entity.${prop.name}.${childProp.embedded![1]});`;
      }).join('\n') + '\n}\n';
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE || prop.reference === ReferenceType.MANY_TO_ONE) {
      context.set(`getPrimaryKeyValues_${prop.name}`, (val: any) => val && Utils.getPrimaryKeyValues(val, this.metadata.find(prop.type)!.primaryKeys, true));
      ret += `    ret.${prop.name} = getPrimaryKeyValues_${prop.name}(entity.${prop.name});\n`;

      if (prop.customType) {
        context.set(`convertToDatabaseValue_${prop.name}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

        /* istanbul ignore next */
        if (['number', 'string', 'boolean'].includes(prop.customType.compareAsType().toLowerCase())) {
          return ret + `    ret.${prop.name} = convertToDatabaseValue_${prop.name}(ret.${prop.name});\n}\n`;
        }

        return ret + `    ret.${prop.name} = clone(convertToDatabaseValue_${prop.name}(ret.${prop.name}));\n}\n`;
      }

      return ret + '  }\n';
    }

    if (prop.customType) {
      context.set(`convertToDatabaseValue_${prop.name}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

      if (['number', 'string', 'boolean'].includes(prop.customType.compareAsType().toLowerCase())) {
        return ret + `  ret.${prop.name} = convertToDatabaseValue_${prop.name}(entity.${prop.name});\n}\n`;
      }

      return ret + `  ret.${prop.name} = clone(convertToDatabaseValue_${prop.name}(entity.${prop.name}));\n}\n`;
    }

    if (prop.type.toLowerCase() === 'date') {
      context.set('processDateProperty', this.platform.processDateProperty.bind(this.platform));
      return ret + `  ret.${prop.name} = clone(processDateProperty(entity.${prop.name}));\n}\n`;
    }

    return ret + `  ret.${prop.name} = clone(entity.${prop.name});\n}\n`;
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getEntityComparator<T>(entityName: string): Comparator<T> {
    const exists = this.comparators.get(entityName);

    if (exists) {
      return exists;
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
    const comparator = this.createFunction(context, code);
    this.comparators.set(entityName, comparator);

    return comparator;
  }

  private getGenericComparator(prop: string, cond: string): string {
    return `  if (current.${prop} == null && last.${prop} == null) {\n\n` +
      `  } else if ((current.${prop} && last.${prop} == null) || (current.${prop} == null && last.${prop})) {\n` +
      `    diff.${prop} = current.${prop};\n` +
      `  } else if (${cond}) {\n` +
      `    diff.${prop} = current.${prop};\n` +
      `  }\n`;
  }

  private getPropertyComparator<T>(prop: EntityProperty<T>): string {
    let type = prop.type.toLowerCase();

    if (prop.reference !== ReferenceType.SCALAR && prop.reference !== ReferenceType.EMBEDDED) {
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
      return this.getGenericComparator(prop.name, `last.${prop.name} !== current.${prop.name}`);
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
