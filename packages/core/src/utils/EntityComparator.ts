import { clone } from './clone';
import type {
  Dictionary,
  EntityData,
  EntityDictionary,
  EntityKey,
  EntityMetadata,
  EntityProperty,
  IMetadataStorage,
  Primary,
} from '../typings';
import { ReferenceKind } from '../enums';
import type { Platform } from '../platforms';
import { compareArrays, compareBooleans, compareBuffers, compareObjects, equals, parseJsonSafe, Utils } from './Utils';
import { JsonType } from '../types/JsonType';

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

  matching<T>(entityName: string, a: EntityData<T>, b: EntityData<T>): boolean {
    const diff = this.diffEntities(entityName, a, b);
    return Utils.getObjectKeysSize(diff) === 0;
  }

  /**
   * Removes ORM specific code from entities and prepares it for serializing. Used before change set computation.
   * References will be mapped to primary keys, collections to arrays of primary keys.
   */
  prepareEntity<T>(entity: T): EntityData<T> {
    const generator = this.getSnapshotGenerator<T>((entity as Dictionary).constructor.name);
    return Utils.callCompiledFunction(generator, entity);
  }

  /**
   * Maps database columns to properties.
   */
  mapResult<T>(entityName: string, result: EntityDictionary<T>): EntityData<T> {
    const mapper = this.getResultMapper<T>(entityName);
    return Utils.callCompiledFunction(mapper, result)!;
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getPkGetter<T>(meta: EntityMetadata<T>) {
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
        if (meta.properties[pk].kind !== ReferenceKind.SCALAR) {
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

      if (meta.properties[pk].kind !== ReferenceKind.SCALAR) {
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
  getPkGetterConverted<T>(meta: EntityMetadata<T>) {
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
        if (meta.properties[pk].kind !== ReferenceKind.SCALAR) {
          lines.push(`    ${pk}: (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) ? entity${this.wrap(pk)}.__helper.getPrimaryKey(true) : entity${this.wrap(pk)},`);
        } else {
          if (meta.properties[pk].customType) {
            const convertorKey = this.safeKey(pk);
            context.set(`convertToDatabaseValue_${convertorKey}`, (val: any) => meta.properties[pk].customType.convertToDatabaseValue(val, this.platform, { mode: 'serialization' }));
            lines.push(`    ${pk}: convertToDatabaseValue_${convertorKey}(entity${this.wrap(pk)}),`);
          } else {
            lines.push(`    ${pk}: entity${this.wrap(pk)},`);
          }
        }
      });
      lines.push(`  };`);
      lines.push(`  if (${meta.primaryKeys.map(pk => `cond.${pk} == null`).join(' || ')}) return null;`);
      lines.push(`  return cond;`);
    } else {
      const pk = meta.primaryKeys[0];

      if (meta.properties[pk].kind !== ReferenceKind.SCALAR) {
        lines.push(`  if (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) return entity${this.wrap(pk)}.__helper.getPrimaryKey(true);`);
      }

      if (meta.properties[pk].customType) {
        const convertorKey = this.safeKey(pk);
        context.set(`convertToDatabaseValue_${convertorKey}`, (val: any) => meta.properties[pk].customType.convertToDatabaseValue(val, this.platform, { mode: 'serialization' }));
        lines.push(`  return convertToDatabaseValue_${convertorKey}(entity${this.wrap(pk)});`);
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
  getPkSerializer<T>(meta: EntityMetadata<T>) {
    const exists = this.pkSerializers.get(meta.className);

    /* istanbul ignore next */
    if (exists) {
      return exists;
    }

    const lines: string[] = [];
    const context = new Map<string, any>();
    context.set('getCompositeKeyValue', (val: any) => Utils.flatten(Utils.getCompositeKeyValue(val, meta, true, this.platform) as unknown[][]));

    if (meta.primaryKeys.length > 1) {
      lines.push(`  const pks = entity.__helper.__pk ? getCompositeKeyValue(entity.__helper.__pk) : [`);
      meta.primaryKeys.forEach(pk => {
        if (meta.properties[pk].kind !== ReferenceKind.SCALAR) {
          lines.push(`    (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) ? entity${this.wrap(pk)}.__helper.getSerializedPrimaryKey() : entity${this.wrap(pk)},`);
        } else {
          lines.push(`    entity${this.wrap(pk)},`);
        }
      });
      lines.push(`  ];`);
      lines.push(`  return pks.join('${Utils.PK_SEPARATOR}');`);
    } else {
      const pk = meta.primaryKeys[0];

      if (meta.properties[pk].kind !== ReferenceKind.SCALAR) {
        lines.push(`  if (entity${this.wrap(pk)} != null && (entity${this.wrap(pk)}.__entity || entity${this.wrap(pk)}.__reference)) return entity${this.wrap(pk)}.__helper.getSerializedPrimaryKey();`);
      }

      const serializedPrimaryKey = meta.props.find(p => p.serializedPrimaryKey);

      if (serializedPrimaryKey) {
        lines.push(`  return '' + entity.${serializedPrimaryKey.name};`);
      }

      lines.push(`  return '' + entity.${meta.primaryKeys[0]};`);
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
  getSnapshotGenerator<T>(entityName: string): SnapshotGenerator<T> {
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

    const getRootProperty: (prop: EntityProperty) => EntityProperty = (prop: EntityProperty) => prop.embedded ? getRootProperty(meta.properties[prop.embedded[0] as EntityKey<T>]) : prop;

    // copy all comparable props, ignore collections and references, process custom types
    meta.comparableProps
      .filter(prop => {
        const root = getRootProperty(prop);
        return prop === root || root.kind !== ReferenceKind.EMBEDDED;
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
  getResultMapper<T>(entityName: string): ResultMapper<T> {
    const exists = this.mappers.get(entityName);

    if (exists) {
      return exists;
    }

    const meta = this.metadata.get<T>(entityName)!;
    const lines: string[] = [];
    const context = new Map<string, any>();
    const propName = (name: string, parent = 'result') => parent + this.wrap(name);

    // respects nested composite keys, e.g. `[1, [2, 3]]`
    const createCompositeKeyArray = (prop: EntityProperty, fieldNames = prop.fieldNames, idx = 0): string => {
      if (!prop.targetMeta) {
        return propName(fieldNames[idx++]);
      }

      const parts: string[] = [];

      for (const pk of prop.targetMeta.getPrimaryProps()) {
        parts.push(createCompositeKeyArray(pk, fieldNames, idx));
        idx += pk.fieldNames.length;
      }

      if (parts.length < 2) {
        return parts[0];
      }

      return '[' + parts.join(', ') + ']';
    };

    const tz = this.platform.getTimezone();
    const parseDate = (key: string, value: string, padding = '') => {
      lines.push(`${padding}    if (${value} == null || ${value} instanceof Date) {`);
      lines.push(`${padding}      ${key} = ${value};`);

      if (!tz || tz === 'local') {
        lines.push(`${padding}    } else {`);
        lines.push(`${padding}      ${key} = new Date(${value});`);
      } else {
        lines.push(`${padding}    } else if (typeof ${value} === 'number' || ${value}.includes('+')) {`);
        lines.push(`${padding}      ${key} = new Date(${value});`);
        lines.push(`${padding}    } else {`);
        lines.push(`${padding}      ${key} = new Date(${value} + '${tz}');`);
      }

      lines.push(`${padding}    }`);
    };

    lines.push(`  const mapped = {};`);
    meta.props.forEach(prop => {
      if (!prop.fieldNames) {
        return;
      }

      if (prop.targetMeta && prop.fieldNames.length > 1) {
        lines.push(`  if (${prop.fieldNames.map(field => `typeof ${propName(field)} === 'undefined'`).join(' && ')}) {`);
        lines.push(`  } else if (${prop.fieldNames.map(field => `${propName(field)} != null`).join(' && ')}) {`);
        lines.push(`    ret${this.wrap(prop.name)} = ${createCompositeKeyArray(prop)};`);
        lines.push(...prop.fieldNames.map(field => `    ${propName(field, 'mapped')} = true;`));
        lines.push(`  } else if (${prop.fieldNames.map(field => `${propName(field)} == null`).join(' && ')}) {\n    ret${this.wrap(prop.name)} = null;`);
        lines.push(...prop.fieldNames.map(field => `    ${propName(field, 'mapped')} = true;`), '  }');
        return;
      }

      if (prop.embedded && (meta.embeddable || meta.properties[prop.embedded[0]].object)) {
        return;
      }

      if (prop.runtimeType === 'boolean') {
        lines.push(`  if (typeof ${propName(prop.fieldNames[0])} !== 'undefined') {`);
        lines.push(`    ret${this.wrap(prop.name)} = ${propName(prop.fieldNames[0])} == null ? ${propName(prop.fieldNames[0])} : !!${propName(prop.fieldNames[0])};`);
        lines.push(`    ${propName(prop.fieldNames[0], 'mapped')} = true;`);
        lines.push(`  }`);
      } else if (prop.runtimeType === 'Date') {
        lines.push(`  if (typeof ${propName(prop.fieldNames[0])} !== 'undefined') {`);
        parseDate('ret' + this.wrap(prop.name), propName(prop.fieldNames[0]));
        lines.push(`    ${propName(prop.fieldNames[0], 'mapped')} = true;`);
        lines.push(`  }`);
      } else if (prop.kind === ReferenceKind.EMBEDDED && (prop.object || meta.embeddable)) {
        const idx = this.tmpIndex++;
        context.set(`mapEmbeddedResult_${idx}`, (data: Dictionary) => {
          const item = parseJsonSafe(data);

          if (Array.isArray(item)) {
            return item.map(row => row == null ? row : this.getResultMapper(prop.type)(row));
          }

          return item == null ? item : this.getResultMapper(prop.type)(item);
        });
        lines.push(`  if (typeof ${propName(prop.fieldNames[0])} !== 'undefined') {`);
        lines.push(`    ret${this.wrap(prop.name)} = ${propName(prop.fieldNames[0])} == null ? ${propName(prop.fieldNames[0])} : mapEmbeddedResult_${idx}(${propName(prop.fieldNames[0])});`);
        lines.push(`    ${propName(prop.fieldNames[0], 'mapped')} = true;`);
        lines.push(`  }`);
      } else {
        lines.push(`  if (typeof ${propName(prop.fieldNames[0])} !== 'undefined') {`);
        lines.push(`    ret${this.wrap(prop.name)} = ${propName(prop.fieldNames[0])};`);
        lines.push(`    ${propName(prop.fieldNames[0], 'mapped')} = true;`);
        lines.push(`  }`);
      }
    });
    lines.push(`  for (let k in result) { if (result.hasOwnProperty(k) && !mapped[k]) ret[k] = result[k]; }`);

    const code = `// compiled mapper for entity ${meta.className}\n`
      + `return function(result) {\n  const ret = {};\n${lines.join('\n')}\n  return ret;\n}`;
    const resultMapper = Utils.createFunction(context, code);
    this.mappers.set(entityName, resultMapper);

    return resultMapper;
  }

  private getPropertyCondition(path: string[]): string {
    const parts = path.slice(); // copy first

    if (parts.length > 1) {
      parts.pop();
    }

    let tail = '';

    return parts
      .map(k => {
        if (k.match(/^\[idx_\d+]$/)) {
          tail += k;
          return '';
        }

        const mapped = `typeof entity${tail ? '.' + tail : ''}${this.wrap(k)} !== 'undefined'`;
        tail += tail ? ('.' + k) : k;

        return mapped;
      })
      .filter(k => k)
      .join(' && ');
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
    let ret = `${level === 1 ? '' : '\n'}`;

    if (object) {
      const nullCond = `entity${path.map(k => this.wrap(k)).join('')} === null`;
      ret += `${padding}if (${nullCond}) ret${dataKey} = null;\n`;
    }

    const cond = `entity${path.map(k => this.wrap(k)).join('')} != null`;
    ret += `${padding}if (${cond}) {\n`;

    if (object) {
      ret += `${padding}  ret${dataKey} = {};\n`;
    }

    function shouldProcessCustomType(childProp: EntityProperty) {
      if (!childProp.customType) {
        return false;
      }

      if (childProp.customType instanceof JsonType) {
        return !prop.object;
      }

      return true;
    }

    ret += meta.props.filter(p => p.embedded?.[0] === prop.name).map(childProp => {
      const childDataKey = meta.embeddable || prop.object ? dataKey + this.wrap(childProp.embedded![1]) : this.wrap(childProp.name);
      const childEntityKey = [...path, childProp.embedded![1]].map(k => this.wrap(k)).join('');
      const childCond = `typeof entity${childEntityKey} !== 'undefined'`;

      if (childProp.kind === ReferenceKind.EMBEDDED) {
        return this.getPropertySnapshot(meta, childProp, context, childDataKey, childEntityKey, [...path, childProp.embedded![1]], level + 1, prop.object);
      }

      if (childProp.kind !== ReferenceKind.SCALAR) {
        return this.getPropertySnapshot(meta, childProp, context, childDataKey, childEntityKey, [...path, childProp.embedded![1]], level, prop.object)
          .split('\n').map(l => padding + l).join('\n');
      }

      if (shouldProcessCustomType(childProp)) {
        const convertorKey = this.safeKey(childProp.name);
        context.set(`convertToDatabaseValue_${convertorKey}`, (val: any) => childProp.customType.convertToDatabaseValue(val, this.platform, { mode: 'serialization' }));

        if (['number', 'string', 'boolean', 'bigint'].includes(childProp.customType.compareAsType().toLowerCase())) {
          return `${padding}  if (${childCond}) ret${childDataKey} = convertToDatabaseValue_${convertorKey}(entity${childEntityKey});`;
        }

        return `${padding}  if (${childCond}) ret${childDataKey} = clone(convertToDatabaseValue_${convertorKey}(entity${childEntityKey}));`;
      }

      return `${padding}  if (${childCond}) ret${childDataKey} = clone(entity${childEntityKey});`;
    }).join('\n') + `\n`;

    if (this.shouldSerialize(prop, dataKey)) {
      return `${ret + padding}  ret${dataKey} = cloneEmbeddable(ret${dataKey});\n${padding}}`;
    }

    return `${ret}${padding}}`;
  }

  private getPropertySnapshot<T>(meta: EntityMetadata<T>, prop: EntityProperty<T>, context: Map<string, any>, dataKey: string, entityKey: string, path: string[], level = 1, object?: boolean): string {
    const convertorKey = this.safeKey(prop.name);
    const unwrap = prop.ref ? '?.unwrap()' : '';
    let ret = `  if (${this.getPropertyCondition(path)}) {\n`;

    if (['number', 'string', 'boolean'].includes(prop.type.toLowerCase())) {
      return ret + `    ret${dataKey} = entity${entityKey}${unwrap};\n  }\n`;
    }

    if (prop.kind === ReferenceKind.EMBEDDED) {
      if (prop.array) {
        return this.getEmbeddedArrayPropertySnapshot(meta, prop, context, level, path, dataKey) + '\n';
      }

      return this.getEmbeddedPropertySnapshot(meta, prop, context, level, path, dataKey, object) + '\n';
    }

    if (prop.kind === ReferenceKind.ONE_TO_ONE || prop.kind === ReferenceKind.MANY_TO_ONE) {
      if (prop.mapToPk) {
        if (prop.customType) {
          context.set(`convertToDatabaseValue_${convertorKey}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform, { mode: 'serialization' }));
          ret += `    ret${dataKey} = convertToDatabaseValue_${convertorKey}(entity${entityKey});\n`;
        } else {
          ret += `    ret${dataKey} = entity${entityKey};\n`;
        }
      } else {
        const toArray = (val: unknown): unknown => {
          if (Utils.isPlainObject(val)) {
            return Object.values(val).map(v => toArray(v));
          }

          return val;
        };

        context.set('toArray', toArray);
        ret += `    if (entity${entityKey} === null) {\n`;
        ret += `      ret${dataKey} = null;\n`;
        ret += `    } else if (typeof entity${entityKey} !== 'undefined') {\n`;
        ret += `      ret${dataKey} = toArray(entity${entityKey}.__helper.getPrimaryKey(true));\n`;
        ret += `    }\n`;
      }

      return ret + '  }\n';
    }

    if (prop.customType) {
      context.set(`convertToDatabaseValue_${convertorKey}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform, { mode: 'serialization' }));

      if (['number', 'string', 'boolean', 'bigint'].includes(prop.customType.compareAsType().toLowerCase())) {
        return ret + `    ret${dataKey} = convertToDatabaseValue_${convertorKey}(entity${entityKey}${unwrap});\n  }\n`;
      }

      return ret + `    ret${dataKey} = clone(convertToDatabaseValue_${convertorKey}(entity${entityKey}${unwrap}));\n  }\n`;
    }

    if (prop.runtimeType === 'Date') {
      context.set('processDateProperty', this.platform.processDateProperty.bind(this.platform));
      return ret + `    ret${dataKey} = clone(processDateProperty(entity${entityKey}${unwrap}));\n  }\n`;
    }

    return ret + `    ret${dataKey} = clone(entity${entityKey}${unwrap});\n  }\n`;
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getEntityComparator<T extends object>(entityName: string): Comparator<T> {
    const exists = this.comparators.get(entityName);

    if (exists) {
      return exists;
    }

    const meta = this.metadata.find<T>(entityName)!;
    const lines: string[] = [];
    const context = new Map<string, any>();
    context.set('compareArrays', compareArrays);
    context.set('compareBooleans', compareBooleans);
    context.set('compareBuffers', compareBuffers);
    context.set('compareObjects', compareObjects);
    context.set('equals', equals);

    meta.comparableProps.forEach(prop => {
      lines.push(this.getPropertyComparator(prop, context));
    });

    const code = `// compiled comparator for entity ${meta.className}\n`
      + `return function(last, current) {\n  const diff = {};\n${lines.join('\n')}\n  return diff;\n}`;
    const comparator = Utils.createFunction(context, code);
    this.comparators.set(entityName, comparator);

    return comparator;
  }

  private getGenericComparator(prop: string, cond: string): string {
    return `  if (current${prop} == null && last${prop} == null) {\n\n` +
      `  } else if ((current${prop} != null && last${prop} == null) || (current${prop} == null && last${prop} != null)) {\n` +
      `    diff${prop} = current${prop};\n` +
      `  } else if (${cond}) {\n` +
      `    diff${prop} = current${prop};\n` +
      `  }\n`;
  }

  private getPropertyComparator<T>(prop: EntityProperty<T>, context: Map<string, any>): string {
    let type = prop.type.toLowerCase();

    if (prop.kind !== ReferenceKind.SCALAR && prop.kind !== ReferenceKind.EMBEDDED) {
      const meta2 = this.metadata.find(prop.type)!;

      if (meta2.primaryKeys.length > 1) {
        type = 'array';
      } else {
        type = meta2.properties[meta2.primaryKeys[0]].type.toLowerCase();
      }
    }

    if (prop.customType) {
      if (prop.customType.compareValues) {
        const idx = this.tmpIndex++;
        context.set(`compareValues_${idx}`, (a: unknown, b: unknown) => prop.customType.compareValues!(a, b));
        return this.getGenericComparator(this.wrap(prop.name), `!compareValues_${idx}(last${this.wrap(prop.name)}, current${this.wrap(prop.name)})`);
      }

      type = prop.customType.compareAsType().toLowerCase();
    }

    if (type.endsWith('[]')) {
      type = 'array';
    }

    if (['string', 'number', 'bigint'].includes(type)) {
      return this.getGenericComparator(this.wrap(prop.name), `last${this.wrap(prop.name)} !== current${this.wrap(prop.name)}`);
    }

    if (type === 'boolean') {
      return this.getGenericComparator(this.wrap(prop.name), `!compareBooleans(last${this.wrap(prop.name)}, current${this.wrap(prop.name)})`);
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
      // We might be comparing PK to object, in case we compare with cached data of populated entity
      // in such case we just ignore the comparison and fallback to `equals()` (which will still mark
      // it as not equal as we compare PK to plain object).
      const cond = `last${this.wrap(prop.name)}.toHexString?.() !== current${this.wrap(prop.name)}.toHexString?.()`;
      return this.getGenericComparator(this.wrap(prop.name), cond);
    }

    return this.getGenericComparator(this.wrap(prop.name), `!equals(last${this.wrap(prop.name)}, current${this.wrap(prop.name)})`);
  }

  private wrap(key: string): string {
    if (key.match(/^\[.*]$/)) {
      return key;
    }

    return key.match(/^\w+$/) ? `.${key}` : `['${key}']`;
  }

  private safeKey(key: string): string {
    return key.replace(/\W/g, '_');
  }

  /**
   * perf: used to generate list of comparable properties during discovery, so we speed up the runtime comparison
   */
  static isComparable<T>(prop: EntityProperty<T>, root: EntityMetadata) {
    const virtual = prop.persist === false;
    const inverse = prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner;
    const discriminator = prop.name === root.discriminatorColumn;
    const collection = prop.kind === ReferenceKind.ONE_TO_MANY || prop.kind === ReferenceKind.MANY_TO_MANY;

    return !virtual && !collection && !inverse && !discriminator && !prop.version;
  }

}
