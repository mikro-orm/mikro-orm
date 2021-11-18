import clone from 'clone';
import type { AnyEntity, EntityData, EntityDictionary, EntityMetadata, EntityProperty, IMetadataStorage, Primary } from '../typings';
import { ReferenceType } from '../enums';
import type { Platform } from '../platforms';
import { compareArrays, compareBuffers, compareObjects, equals, Utils } from './Utils';

type Comparator<T> = (a: T, b: T) => EntityData<T>;
type ResultMapper<T> = (result: EntityData<T>) => EntityData<T> | null;
type SnapshotGenerator<T> = (entity: T) => EntityData<T>;
type PkGetter<T> = (entity: T) => Primary<T>;
type PkSerializer<T> = (entity: T) => string;

export class EntityComparator {

  private readonly comparators = new Map<string, Comparator<any>>();
  private readonly mappers = new Map<string, ResultMapper<any>>();
  private readonly snapshotGenerators = new Map<string, SnapshotGenerator<any>>();
  private readonly pkGetters = new Map<string, PkGetter<any>>();
  private readonly pkGettersConverted = new Map<string, PkGetter<any>>();
  private readonly pkSerializers = new Map<string, PkSerializer<any>>();
  private tmpIndex = 0;

  constructor(private readonly metadata: IMetadataStorage,
              private readonly platform: Platform) { }

  /**
   * Computes difference between two entities.
   */
  diffEntities<T>(entityName: string, a: EntityData<T>, b: EntityData<T>): EntityData<T> {
    const comparator = this.getEntityComparator(entityName);
    return Utils.callCompiledFunction(comparator, a, b);
  }

  /**
   * Removes ORM specific code from entities and prepares it for serializing. Used before change set computation.
   * References will be mapped to primary keys, collections to arrays of primary keys.
   */
  prepareEntity<T extends AnyEntity<T>>(entity: T): EntityData<T> {
    const generator = this.getSnapshotGenerator<T>(entity.constructor.name);
    return Utils.callCompiledFunction(generator, entity);
  }

  /**
   * Maps database columns to properties.
   */
  mapResult<T extends AnyEntity<T>>(entityName: string, result: EntityDictionary<T>): EntityData<T> | null {
    const mapper = this.getResultMapper<T>(entityName);
    return Utils.callCompiledFunction(mapper, result);
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getPkGetter<T extends AnyEntity<T>>(meta: EntityMetadata<T>) {
    const exists = this.pkGetters.get(meta.className);

    /* istanbul ignore next */
    if (exists) {
      return exists;
    }

    const lines: string[] = [];
    const context = new Map<string, any>();

    if (meta.primaryKeys.length > 1) {
      lines.push(`  const cond = {`);
      meta.primaryKeys.forEach(pk => {
        if (meta.properties[pk].reference !== ReferenceType.SCALAR) {
          lines.push(`    ${pk}: (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) ? entity${this.wrap(pk)}.__helper.getPrimaryKey() : entity${this.wrap(pk)},`);
        } else {
          lines.push(`    ${pk}: entity${this.wrap(pk)},`);
        }
      });
      lines.push(`  };`);
      lines.push(`  if (${meta.primaryKeys.map(pk => `cond.${pk} == null`).join(' || ')}) return null;`);
      lines.push(`  return cond;`);
    } else {
      const pk = meta.primaryKeys[0];

      if (meta.properties[pk].reference !== ReferenceType.SCALAR) {
        lines.push(`  if (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) return entity${this.wrap(pk)}.__helper.getPrimaryKey();`);
      }

      lines.push(`  return entity${this.wrap(pk)};`);
    }

    const code = `// compiled pk serializer for entity ${meta.className}\n`
      + `return function(entity) {\n${lines.join('\n')}\n}`;
    const pkSerializer = Utils.createFunction(context, code);
    this.pkGetters.set(meta.className, pkSerializer);

    return pkSerializer;
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getPkGetterConverted<T extends AnyEntity<T>>(meta: EntityMetadata<T>) {
    const exists = this.pkGettersConverted.get(meta.className);

    /* istanbul ignore next */
    if (exists) {
      return exists;
    }

    const lines: string[] = [];
    const context = new Map<string, any>();

    if (meta.primaryKeys.length > 1) {
      lines.push(`  const cond = {`);
      meta.primaryKeys.forEach(pk => {
        if (meta.properties[pk].reference !== ReferenceType.SCALAR) {
          lines.push(`    ${pk}: (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) ? entity${this.wrap(pk)}.__helper.getPrimaryKey(true) : entity${this.wrap(pk)},`);
        } else {
          lines.push(`    ${pk}: entity${this.wrap(pk)},`);
        }
      });
      lines.push(`  };`);
      lines.push(`  if (${meta.primaryKeys.map(pk => `cond.${pk} == null`).join(' || ')}) return null;`);
      lines.push(`  return cond;`);
    } else {
      const pk = meta.primaryKeys[0];

      if (meta.properties[pk].reference !== ReferenceType.SCALAR) {
        lines.push(`  if (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) return entity${this.wrap(pk)}.__helper.getPrimaryKey(true);`);
      }

      if (meta.properties[pk].customType) {
        context.set(`convertToDatabaseValue_${pk}`, (val: any) => meta.properties[pk].customType.convertToDatabaseValue(val, this.platform));
        lines.push(`  return convertToDatabaseValue_${pk}(entity${this.wrap(pk)});`);
      } else {
        lines.push(`  return entity${this.wrap(pk)};`);
      }
    }

    const code = `// compiled pk getter (with converted custom types) for entity ${meta.className}\n`
      + `return function(entity) {\n${lines.join('\n')}\n}`;
    const pkSerializer = Utils.createFunction(context, code);
    this.pkGettersConverted.set(meta.className, pkSerializer);

    return pkSerializer;
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getPkSerializer<T extends AnyEntity<T>>(meta: EntityMetadata<T>) {
    const exists = this.pkSerializers.get(meta.className);

    /* istanbul ignore next */
    if (exists) {
      return exists;
    }

    const lines: string[] = [];
    const context = new Map<string, any>();

    if (meta.primaryKeys.length > 1) {
      lines.push(`  const pks = [`);
      meta.primaryKeys.forEach(pk => {
        if (meta.properties[pk].reference !== ReferenceType.SCALAR) {
          lines.push(`    (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) ? entity${this.wrap(pk)}.__helper.getSerializedPrimaryKey() : entity${this.wrap(pk)},`);
        } else {
          lines.push(`    entity${this.wrap(pk)},`);
        }
      });
      lines.push(`  ];`);
      lines.push(`  return pks.join('${Utils.PK_SEPARATOR}');`);
    } else {
      const pk = meta.primaryKeys[0];

      if (meta.properties[pk].reference !== ReferenceType.SCALAR) {
        lines.push(`  if (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) return entity${this.wrap(pk)}.__helper.getSerializedPrimaryKey();`);
      }

      lines.push(`  return '' + entity.${meta.serializedPrimaryKey};`);
    }

    const code = `// compiled pk serializer for entity ${meta.className}\n`
      + `return function(entity) {\n${lines.join('\n')}\n}`;
    const pkSerializer = Utils.createFunction(context, code);
    this.pkSerializers.set(meta.className, pkSerializer);

    return pkSerializer;
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
    const lines: string[] = [];
    const context = new Map<string, any>();
    context.set('clone', clone);
    context.set('cloneEmbeddable', (o: any) => this.platform.cloneEmbeddable(o)); // do not clone prototypes

    if (meta.discriminatorValue) {
      lines.push(`  ret${this.wrap(meta.root.discriminatorColumn!)} = '${meta.discriminatorValue}'`);
    }

    const getRootProperty: (prop: EntityProperty) => EntityProperty = (prop: EntityProperty) => prop.embedded ? getRootProperty(meta.properties[prop.embedded[0]]) : prop;

    // copy all comparable props, ignore collections and references, process custom types
    meta.comparableProps
      .filter(prop => {
        const root = getRootProperty(prop);
        return prop === root || root.reference !== ReferenceType.EMBEDDED;
      })
      .forEach(prop => lines.push(this.getPropertySnapshot(meta, prop, context, this.wrap(prop.name), this.wrap(prop.name), [prop.name])));

    const code = `return function(entity) {\n  const ret = {};\n${lines.join('\n')}\n  return ret;\n}`;
    const snapshotGenerator = Utils.createFunction(context, code);
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

    const meta = this.metadata.get<T>(entityName)!;
    const lines: string[] = [];
    const context = new Map<string, any>();
    const propName = (name: string, parent = 'result') => parent + this.wrap(name);

    lines.push(`  const mapped = {};`);
    meta.props.forEach(prop => {
      if (prop.fieldNames) {
        if (prop.fieldNames.length > 1) {
          lines.push(`  if (${prop.fieldNames.map(field => `${propName(field)} != null`).join(' && ')}) {\n    ret${this.wrap(prop.name)} = [${prop.fieldNames.map(field => `${propName(field)}`).join(', ')}];`);
          lines.push(...prop.fieldNames.map(field => `    ${propName(field, 'mapped')} = true;`));
          lines.push(`  } else if (${prop.fieldNames.map(field => `${propName(field)} == null`).join(' && ')}) {\n    ret${this.wrap(prop.name)} = null;`);
          lines.push(...prop.fieldNames.map(field => `    ${propName(field, 'mapped')} = true;`), '  }');
        } else {
          if (prop.type === 'boolean') {
            lines.push(`  if ('${prop.fieldNames[0]}' in result) { ret${this.wrap(prop.name)} = ${propName(prop.fieldNames[0])} == null ? ${propName(prop.fieldNames[0])} : !!${propName(prop.fieldNames[0])}; mapped.${prop.fieldNames[0]} = true; }`);
          } else {
            lines.push(`  if ('${prop.fieldNames[0]}' in result) { ret${this.wrap(prop.name)} = ${propName(prop.fieldNames[0])}; ${propName(prop.fieldNames[0], 'mapped')} = true; }`);
          }
        }
      }
    });
    lines.push(`  for (let k in result) { if (result.hasOwnProperty(k) && !mapped[k]) ret[k] = result[k]; }`);

    const code = `// compiled mapper for entity ${meta.className}\n`
      + `return function(result) {\n  const ret = {};\n${lines.join('\n')}\n  return ret;\n}`;
    const snapshotGenerator = Utils.createFunction(context, code);
    this.mappers.set(entityName, snapshotGenerator);

    return snapshotGenerator;
  }

  private getPropertyCondition<T>(prop: EntityProperty<T>, entityKey: string, path: string[]): string {
    const parts = path.slice(); // copy first

    if (parts.length > 1) {
      parts.pop();
    }

    let tail = '';
    let ret = parts
      .map(k => {
        if (k.match(/^\[idx_\d+]$/)) {
          tail += k;
          return '';
        }

        const mapped = `'${k}' in entity${tail ? '.' + tail : ''}`;
        tail += tail ? ('.' + k) : k;

        return mapped;
      })
      .filter(k => k)
      .join(' && ');
    const isRef = [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference) && !prop.mapToPk;
    const isSetter = isRef && !!(prop.inversedBy || prop.mappedBy);

    if (prop.primary || isSetter) {
      ret += ` && entity${entityKey} != null`;
    }

    if (isRef) {
      ret += ` && (entity${entityKey} == null || entity${entityKey}.__helper.hasPrimaryKey())`;
    }

    return ret;
  }

  private getEmbeddedArrayPropertySnapshot<T>(meta: EntityMetadata<T>, prop: EntityProperty<T>, context: Map<string, any>, level: number, path: string[], dataKey: string): string {
    const entityKey = path.map(k => this.wrap(k)).join('');
    const ret: string[] = [];
    const padding = ' '.repeat(level * 2);
    const idx = this.tmpIndex++;

    ret.push(`${padding}if (Array.isArray(entity${entityKey})) {`);
    ret.push(`${padding}  ret${dataKey} = [];`);
    ret.push(`${padding}  entity${entityKey}.forEach((_, idx_${idx}) => {`);
    ret.push(this.getEmbeddedPropertySnapshot(meta, prop, context, level + 2, [...path, `[idx_${idx}]`], `${dataKey}[idx_${idx}]`, true));
    ret.push(`${padding}  });`);

    if (this.shouldSerialize(prop, dataKey)) {
      ret.push(`${padding}  ret${dataKey} = cloneEmbeddable(ret${dataKey});`);
    }

    ret.push(`${padding}}`);

    return ret.join('\n');
  }

  /**
   * we need to serialize only object embeddables, and only the top level ones, so root object embeddable
   * properties and first child nested object embeddables with inlined parent
   */
  private shouldSerialize(prop: EntityProperty, dataKey: string): boolean {
    dataKey = dataKey.replace(/^\./, '');
    const contains = (str: string, re: RegExp) => (str.match(re) || []).length > 0;
    const a = contains(dataKey, /\./g);
    const b = contains(dataKey, /\[/g);

    return !!prop.object && !(a || b);
  }

  private getEmbeddedPropertySnapshot<T>(meta: EntityMetadata<T>, prop: EntityProperty<T>, context: Map<string, any>, level: number, path: string[], dataKey: string, object = prop.object): string {
    const padding = ' '.repeat(level * 2);
    const cond = `entity${path.map(k => this.wrap(k)).join('')} != null`;
    let ret = `${level === 1 ? '' : '\n'}${padding}if (${cond}) {\n`;

    if (object) {
      ret += `${padding}  ret${dataKey} = {};\n`;
    }

    ret += meta.props.filter(p => p.embedded?.[0] === prop.name).map(childProp => {
      const childDataKey = prop.object ? dataKey + this.wrap(childProp.embedded![1]) : this.wrap(childProp.name);
      const childEntityKey = [...path, childProp.embedded![1]].map(k => this.wrap(k)).join('');

      if (childProp.reference === ReferenceType.EMBEDDED) {
        return this.getPropertySnapshot(meta, childProp, context, childDataKey, childEntityKey, [...path, childProp.embedded![1]], level + 1, prop.object);
      }

      if (childProp.reference !== ReferenceType.SCALAR) {
        return this.getPropertySnapshot(meta, childProp, context, childDataKey, childEntityKey, [...path, childProp.embedded![1]], level, prop.object)
          .split('\n').map(l => padding + l).join('\n');
      }

      if (childProp.customType) {
        context.set(`convertToDatabaseValue_${childProp.name}`, (val: any) => childProp.customType.convertToDatabaseValue(val, this.platform));

        if (['number', 'string', 'boolean'].includes(childProp.customType.compareAsType().toLowerCase())) {
          return `${padding}  ret${childDataKey} = convertToDatabaseValue_${childProp.name}(entity${childEntityKey});`;
        }

        return `${padding}  ret${childDataKey} = clone(convertToDatabaseValue_${childProp.name}(entity${childEntityKey}));`;
      }

      return `${padding}  ret${childDataKey} = clone(entity${childEntityKey});`;
    }).join('\n') + `\n`;

    if (this.shouldSerialize(prop, dataKey)) {
      return `${ret + padding}  ret${dataKey} = cloneEmbeddable(ret${dataKey});\n${padding}}`;
    }

    return `${ret}${padding}}`;
  }

  private getPropertySnapshot<T>(meta: EntityMetadata<T>, prop: EntityProperty<T>, context: Map<string, any>, dataKey: string, entityKey: string, path: string[], level = 1, object?: boolean): string {
    let ret = `  if (${this.getPropertyCondition(prop, entityKey, path)}) {\n`;

    if (['number', 'string', 'boolean'].includes(prop.type.toLowerCase())) {
      return ret + `    ret${dataKey} = entity${entityKey};\n  }\n`;
    }

    if (prop.reference === ReferenceType.EMBEDDED) {
      if (prop.array) {
        return this.getEmbeddedArrayPropertySnapshot(meta, prop, context, level, path, dataKey) + '\n';
      }

      return this.getEmbeddedPropertySnapshot(meta, prop, context, level, path, dataKey, object) + '\n';
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE || prop.reference === ReferenceType.MANY_TO_ONE) {
      if (prop.mapToPk) {
        ret += `    ret${dataKey} = entity${entityKey};\n`;
      } else {
        context.set(`getPrimaryKeyValues_${prop.name}`, (val: any) => val && Utils.getPrimaryKeyValues(val, this.metadata.find(prop.type)!.primaryKeys, true));
        ret += `    ret${dataKey} = getPrimaryKeyValues_${prop.name}(entity${entityKey});\n`;
      }

      if (prop.customType) {
        context.set(`convertToDatabaseValue_${prop.name}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

        if (['number', 'string', 'boolean'].includes(prop.customType.compareAsType().toLowerCase())) {
          return ret + `    ret${dataKey} = convertToDatabaseValue_${prop.name}(ret${dataKey});\n  }\n`;
        }

        return ret + `    ret${dataKey} = clone(convertToDatabaseValue_${prop.name}(ret${dataKey}));\n  }\n`;
      }

      return ret + '  }\n';
    }

    if (prop.customType) {
      context.set(`convertToDatabaseValue_${prop.name}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

      if (['number', 'string', 'boolean'].includes(prop.customType.compareAsType().toLowerCase())) {
        return ret + `    ret${dataKey} = convertToDatabaseValue_${prop.name}(entity${entityKey});\n  }\n`;
      }

      return ret + `    ret${dataKey} = clone(convertToDatabaseValue_${prop.name}(entity${entityKey}));\n  }\n`;
    }

    if (prop.type.toLowerCase() === 'date') {
      context.set('processDateProperty', this.platform.processDateProperty.bind(this.platform));
      return ret + `    ret${dataKey} = clone(processDateProperty(entity${entityKey}));\n  }\n`;
    }

    return ret + `    ret${dataKey} = clone(entity${entityKey});\n  }\n`;
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
    const lines: string[] = [];
    const context = new Map<string, any>();
    context.set('compareArrays', compareArrays);
    context.set('compareBuffers', compareBuffers);
    context.set('compareObjects', compareObjects);
    context.set('equals', equals);

    meta.comparableProps.forEach(prop => {
      lines.push(this.getPropertyComparator(prop));
    });

    const code = `// compiled comparator for entity ${meta.className}\n`
      + `return function(last, current) {\n  const diff = {};\n${lines.join('\n')}\n  return diff;\n}`;
    const comparator = Utils.createFunction(context, code);
    this.comparators.set(entityName, comparator);

    return comparator;
  }

  private getGenericComparator(prop: string, cond: string): string {
    return `  if (current${prop} == null && last${prop} == null) {\n\n` +
      `  } else if ((current${prop} && last${prop} == null) || (current${prop} == null && last${prop})) {\n` +
      `    diff${prop} = current${prop};\n` +
      `  } else if (${cond}) {\n` +
      `    diff${prop} = current${prop};\n` +
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
      type = prop.customType.compareAsType().toLowerCase();
    }

    if (type.endsWith('[]')) {
      type = 'array';
    }

    if (['string', 'number', 'boolean'].includes(type)) {
      return this.getGenericComparator(this.wrap(prop.name), `last${this.wrap(prop.name)} !== current${this.wrap(prop.name)}`);
    }

    if (['array'].includes(type) || type.endsWith('[]')) {
      return this.getGenericComparator(this.wrap(prop.name), `!compareArrays(last${this.wrap(prop.name)}, current${this.wrap(prop.name)})`);
    }

    if (['buffer', 'uint8array'].includes(type)) {
      return this.getGenericComparator(this.wrap(prop.name), `!compareBuffers(last${this.wrap(prop.name)}, current${this.wrap(prop.name)})`);
    }

    if (['date'].includes(type)) {
      return this.getGenericComparator(this.wrap(prop.name), `last${this.wrap(prop.name)}.valueOf() !== current${this.wrap(prop.name)}.valueOf()`);
    }

    if (['objectid'].includes(type)) {
      const cond = `last${this.wrap(prop.name)}.toHexString() !== current${this.wrap(prop.name)}.toHexString()`;
      return this.getGenericComparator(this.wrap(prop.name), cond);
    }

    return `  if (!equals(last${this.wrap(prop.name)}, current${this.wrap(prop.name)})) diff${this.wrap(prop.name)} = current${this.wrap(prop.name)};`;
  }

  private wrap(key: string): string {
    if (key.match(/^\[.*]$/)) {
      return key;
    }

    return key.match(/^\w+$/) ? `.${key}` : `['${key}']`;
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
