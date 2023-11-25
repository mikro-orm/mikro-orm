import type { EntityData, EntityMetadata, EntityProperty } from '../typings';
import { Hydrator } from './Hydrator';
import { Collection } from '../entity/Collection';
import { Reference, ScalarReference } from '../entity/Reference';
import { parseJsonSafe, Utils } from '../utils/Utils';
import { ReferenceKind } from '../enums';
import type { EntityFactory } from '../entity/EntityFactory';

type EntityHydrator<T extends object> = (entity: T, data: EntityData<T>, factory: EntityFactory, newEntity: boolean, convertCustomTypes: boolean, schema?: string) => void;

export class ObjectHydrator extends Hydrator {

  private readonly hydrators = {
    full: new Map<string, EntityHydrator<any>>(),
    reference: new Map<string, EntityHydrator<any>>(),
  };

  private tmpIndex = 0;

  /**
   * @inheritDoc
   */
  override hydrate<T extends object>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, type: 'full' | 'reference', newEntity = false, convertCustomTypes = false, schema?: string): void {
    const hydrate = this.getEntityHydrator(meta, type);
    const running = this.running;
    // the running state is used to consider propagation as hydration, saving the values directly to the entity data,
    // but we don't want that for new entities, their propagation should result in entity updates when flushing
    this.running = !newEntity;
    Utils.callCompiledFunction(hydrate, entity, data, factory, newEntity, convertCustomTypes, schema);
    this.running = running;
  }

  /**
   * @inheritDoc
   */
  override hydrateReference<T extends object>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, convertCustomTypes = false, schema?: string): void {
    const hydrate = this.getEntityHydrator(meta, 'reference');
    const running = this.running;
    this.running = true;
    Utils.callCompiledFunction(hydrate, entity, data, factory, false, convertCustomTypes, schema);
    this.running = running;
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getEntityHydrator<T extends object>(meta: EntityMetadata<T>, type: 'full' | 'reference'): EntityHydrator<T> {
    const exists = this.hydrators[type].get(meta.className);

    if (exists) {
      return exists;
    }

    const lines: string[] = [];
    const context = new Map<string, any>();
    const props = this.getProperties(meta, type);
    context.set('isPrimaryKey', Utils.isPrimaryKey);
    context.set('Collection', Collection);
    context.set('Reference', Reference);

    const hydrateScalar = (prop: EntityProperty<T>, object: boolean | undefined, path: string[], dataKey: string): string[] => {
      const entityKey = path.map(k => this.wrap(k)).join('');
      const tz = this.platform.getTimezone();
      const convertorKey = path.filter(k => !k.match(/\[idx_\d+]/)).map(k => this.safeKey(k)).join('_');
      const ret: string[] = [];
      const idx = this.tmpIndex++;
      const nullVal = this.config.get('forceUndefined') ? 'undefined' : 'null';

      if (prop.ref) {
        context.set('ScalarReference', ScalarReference);
        ret.push(`  const oldValue_${idx} = entity${entityKey};`);
      }

      ret.push(`  if (data${dataKey} === null) {`);
      ret.push(`    entity${entityKey} = ${nullVal};`);
      ret.push(`  } else if (typeof data${dataKey} !== 'undefined') {`);

      if (prop.customType) {
        context.set(`convertToJSValue_${convertorKey}`, (val: any) => prop.customType.convertToJSValue(val, this.platform));
        context.set(`convertToDatabaseValue_${convertorKey}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform, { mode: 'hydration' }));

        ret.push(
          `    if (convertCustomTypes) {`,
          `      const value = convertToJSValue_${convertorKey}(data${dataKey});`,
        );

        if (prop.customType.ensureComparable(meta, prop)) {
          ret.push(`      data${dataKey} = convertToDatabaseValue_${convertorKey}(value);`);
        }

        ret.push(
          `      entity${entityKey} = value;`,
          `    } else {`,
          `      entity${entityKey} = data${dataKey};`,
          `    }`,
        );
      } else if (prop.runtimeType === 'boolean') {
        ret.push(`    entity${entityKey} = !!data${dataKey};`);
      } else if (prop.runtimeType === 'Date') {
        ret.push(`    if (data${dataKey} instanceof Date) {`);
        ret.push(`      entity${entityKey} = data${dataKey};`);

        if (!tz || tz === 'local') {
          ret.push(`    } else {`);
          ret.push(`      entity${entityKey} = new Date(data${dataKey});`);
        } else {
          ret.push(`    } else if (typeof data${dataKey} === 'number' || data${dataKey}.includes('+')) {`);
          ret.push(`      entity${entityKey} = new Date(data${dataKey});`);
          ret.push(`    } else {`);
          ret.push(`      entity${entityKey} = new Date(data${dataKey} + '${tz}');`);
        }

        ret.push(`    }`);
      } else {
        ret.push(`    entity${entityKey} = data${dataKey};`);
      }

      if (prop.ref) {
        ret.push(`    const value = entity${entityKey};`);
        ret.push(`    entity${entityKey} = oldValue_${idx} ?? new ScalarReference(value);`);
        ret.push(`    entity${entityKey}.bind(entity, '${prop.name}');`);
        ret.push(`    entity${entityKey}.set(value);`);
      }

      ret.push(`  }`);

      if (prop.ref) {
        ret.push(`  if (!entity${entityKey}) {`);
        ret.push(`    entity${entityKey} = new ScalarReference();`);
        ret.push(`    entity${entityKey}.bind(entity, '${prop.name}');`);
        ret.push(`  }`);
      }

      return ret;
    };

    const hydrateToOne = (prop: EntityProperty, dataKey: string, entityKey: string) => {
      const ret: string[] = [];

      const method = type === 'reference' ? 'createReference' : 'create';
      const nullVal = this.config.get('forceUndefined') ? 'undefined' : 'null';
      ret.push(`  if (data${dataKey} === null) {\n    entity${entityKey} = ${nullVal};`);
      ret.push(`  } else if (typeof data${dataKey} !== 'undefined') {`);
      ret.push(`    if (isPrimaryKey(data${dataKey}, true)) {`);

      if (prop.ref) {
        ret.push(`      entity${entityKey} = Reference.create(factory.createReference('${prop.type}', data${dataKey}, { merge: true, convertCustomTypes, schema }));`);
      } else {
        ret.push(`      entity${entityKey} = factory.createReference('${prop.type}', data${dataKey}, { merge: true, convertCustomTypes, schema });`);
      }

      ret.push(`    } else if (data${dataKey} && typeof data${dataKey} === 'object') {`);

      if (prop.ref) {
        ret.push(`      entity${entityKey} = Reference.create(factory.${method}('${prop.type}', data${dataKey}, { initialized: true, merge: true, newEntity, convertCustomTypes, schema }));`);
      } else {
        ret.push(`      entity${entityKey} = factory.${method}('${prop.type}', data${dataKey}, { initialized: true, merge: true, newEntity, convertCustomTypes, schema });`);
      }

      ret.push(`    }`);
      ret.push(`  }`);

      if (prop.kind === ReferenceKind.ONE_TO_ONE) {
        const meta2 = this.metadata.get(prop.type);
        const prop2 = meta2.properties[prop.inversedBy || prop.mappedBy];

        if (prop2 && !prop2.mapToPk) {
          ret.push(`  if (data${dataKey} && entity${entityKey} && !entity${entityKey}.${this.safeKey(prop2.name)}) {`);
          ret.push(`    entity${entityKey}.${prop.ref ? 'unwrap().' : ''}${this.safeKey(prop2.name)} = ${prop2.ref ? 'Reference.create(entity)' : 'entity'};`);
          ret.push(`  }`);
        }
      }

      if (prop.customType?.ensureComparable(meta, prop)) {
        context.set(`convertToDatabaseValue_${this.safeKey(prop.name)}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform, { mode: 'hydration' }));

        ret.push(`  if (data${dataKey} != null && convertCustomTypes) {`);
        ret.push(`    data${dataKey} = convertToDatabaseValue_${this.safeKey(prop.name)}(entity${entityKey}.__helper.getPrimaryKey());`);
        ret.push(`  }`);
      }

      return ret;
    };

    const hydrateToMany = (prop: EntityProperty, dataKey: string, entityKey: string) => {
      const ret: string[] = [];

      ret.push(...this.createCollectionItemMapper(prop));
      ret.push(`  if (data${dataKey} && !Array.isArray(data${dataKey}) && typeof data${dataKey} === 'object') {`);
      ret.push(`    data${dataKey} = [data${dataKey}];`);
      ret.push(`  }`);
      ret.push(`  if (Array.isArray(data${dataKey})) {`);
      ret.push(`    const items = data${dataKey}.map(value => createCollectionItem_${this.safeKey(prop.name)}(value, entity));`);
      ret.push(`    const coll = Collection.create(entity, '${prop.name}', items, newEntity);`);
      ret.push(`    if (newEntity) {`);
      ret.push(`      coll.setDirty();`);
      ret.push(`    } else {`);
      ret.push(`      coll.takeSnapshot(true);`);
      ret.push(`    }`);
      ret.push(`  } else if (!entity${entityKey} && data${dataKey} instanceof Collection) {`);
      ret.push(`    entity${entityKey} = data${dataKey};`);
      ret.push(`  } else if (!entity${entityKey}) {`);
      const items = this.platform.usesPivotTable() || !prop.owner ? 'undefined' : '[]';
      ret.push(`    const coll = Collection.create(entity, '${prop.name}', ${items}, !!data${dataKey} || newEntity);`);
      ret.push(`    coll.setDirty(false);`);
      ret.push(`  }`);

      return ret;
    };

    const registerEmbeddedPrototype = (prop: EntityProperty, path: string[]): void => {
      const convertorKey = path.filter(k => !k.match(/\[idx_\d+]/)).map(k => this.safeKey(k)).join('_');

      if (prop.targetMeta?.polymorphs) {
        prop.targetMeta.polymorphs.forEach(meta => {
          context.set(`prototype_${convertorKey}_${meta.className}`, meta.prototype);
        });
      } else {
        context.set(`prototype_${convertorKey}`, prop.embeddable.prototype);
      }
    };

    const parseObjectEmbeddable = (prop: EntityProperty, dataKey: string, ret: string[]): void => {
      if (!this.platform.convertsJsonAutomatically() && (prop.object || prop.array)) {
        context.set('parseJsonSafe', parseJsonSafe);
        ret.push(
          `  if (typeof data${dataKey} === 'string') {`,
          `    data${dataKey} = parseJsonSafe(data${dataKey});`,
          `  }`,
        );
      }
    };

    const createCond = (prop: EntityProperty, dataKey: string, cond?: string) => {
      const conds: string[] = [];

      if (prop.object) {
        conds.push(`data${dataKey} ${cond ?? '!= null'}`);
      } else {
        const notNull = cond ?? (prop.nullable ? '!= null' : '!== undefined');
        meta.props
          .filter(p => p.embedded?.[0] === prop.name)
          .forEach(p => {
            if (p.kind === ReferenceKind.EMBEDDED && !p.object && !p.array) {
              conds.push(...createCond(p, dataKey + this.wrap(p.embedded![1]), cond));
              return;
            }

            conds.push(`data${this.wrap(p.name)} ${notNull}`);
          });
      }

      return conds;
    };

    const hydrateEmbedded = (prop: EntityProperty, path: string[], dataKey: string): string[] => {
      const entityKey = path.map(k => this.wrap(k)).join('');
      const ret: string[] = [];

      registerEmbeddedPrototype(prop, path);
      parseObjectEmbeddable(prop, dataKey, ret);

      ret.push(`  if (${createCond(prop, dataKey).join(' || ')}) {`);

      if (prop.targetMeta?.polymorphs) {
        prop.targetMeta.polymorphs!.forEach(meta => {
          const childProp = prop.embeddedProps[prop.targetMeta!.discriminatorColumn!];
          const childDataKey = prop.object ? dataKey + this.wrap(childProp.embedded![1]) : this.wrap(childProp.name);
          // weak comparison as we can have numbers that might have been converted to strings due to being object keys
          ret.push(`    if (data${childDataKey} == '${meta.discriminatorValue}' && entity${entityKey} == null) {`);
          ret.push(`      entity${entityKey} = factory.createEmbeddable('${meta.className}', data${prop.object ? dataKey : ''}, { newEntity, convertCustomTypes });`);
          ret.push(`    }`);
        });
      } else {
        ret.push(`    if (entity${entityKey} == null) {`);
        ret.push(`      entity${entityKey} = factory.createEmbeddable('${prop.targetMeta!.className}', data${prop.object ? dataKey : ''}, { newEntity, convertCustomTypes });`);
        ret.push(`    }`);
      }

      meta.props
        .filter(p => p.embedded?.[0] === prop.name)
        .forEach(childProp => {
          const childDataKey = prop.object ? dataKey + this.wrap(childProp.embedded![1]) : this.wrap(childProp.name);
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          ret.push(...hydrateProperty(childProp, prop.object, [...path, childProp.embedded![1]], childDataKey).map(l => '  ' + l));
        });

      /* istanbul ignore next */
      const nullVal = this.config.get('forceUndefined') ? 'undefined' : 'null';

      if (prop.object) {
        ret.push(`  } else if (data${dataKey} === null) {`);
      } else {
        ret.push(`  } else if (${createCond(prop, dataKey, '=== null').join(' && ')}) {`);
      }

      ret.push(`    entity${entityKey} = ${nullVal};`);
      ret.push(`  }`);

      return ret;
    };

    const hydrateEmbeddedArray = (prop: EntityProperty, path: string[], dataKey: string): string[] => {
      const entityKey = path.map(k => this.wrap(k)).join('');
      const ret: string[] = [];
      const idx = this.tmpIndex++;
      registerEmbeddedPrototype(prop, path);
      parseObjectEmbeddable(prop, dataKey, ret);

      ret.push(`  if (Array.isArray(data${dataKey})) {`);
      ret.push(`    entity${entityKey} = [];`);
      ret.push(`    data${dataKey}.forEach((_, idx_${idx}) => {`);
      ret.push(...hydrateEmbedded(prop, [...path, `[idx_${idx}]`], `${dataKey}[idx_${idx}]`).map(l => '    ' + l));
      ret.push(`    });`);
      ret.push(`  }`);

      return ret;
    };

    const hydrateProperty = (prop: EntityProperty, object = prop.object, path: string[] = [prop.name], dataKey?: string): string[] => {
      const entityKey = path.map(k => this.wrap(k)).join('');
      dataKey = dataKey ?? (object ? entityKey : this.wrap(prop.name));
      const ret: string[] = [];

      if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) && !prop.mapToPk) {
        ret.push(...hydrateToOne(prop, dataKey, entityKey));
      } else if (prop.kind === ReferenceKind.ONE_TO_MANY || prop.kind === ReferenceKind.MANY_TO_MANY) {
        ret.push(...hydrateToMany(prop, dataKey, entityKey));
      } else if (prop.kind === ReferenceKind.EMBEDDED) {
        if (prop.array) {
          ret.push(...hydrateEmbeddedArray(prop, path, dataKey));
        } else {
          ret.push(...hydrateEmbedded(prop, path, dataKey));

          if (!prop.object) {
            ret.push(...hydrateEmbedded({ ...prop, object: true }, path, dataKey));
          }
        }
      } else { // ReferenceKind.SCALAR
        ret.push(...hydrateScalar(prop, object, path, dataKey));
      }

      if (this.config.get('forceUndefined')) {
        ret.push(`  if (data${dataKey} === null) entity${entityKey} = undefined;`);
      }

      return ret;
    };

    for (const prop of props) {
      lines.push(...hydrateProperty(prop));
    }

    const code = `// compiled hydrator for entity ${meta.className} (${type})\n`
      + `return function(entity, data, factory, newEntity, convertCustomTypes, schema) {\n`
      + `${lines.join('\n')}\n}`;
    const hydrator = Utils.createFunction(context, code);
    this.hydrators[type].set(meta.className, hydrator);

    return hydrator;
  }

  private createCollectionItemMapper<T extends object>(prop: EntityProperty): string[] {
    const meta = this.metadata.get(prop.type);
    const lines: string[] = [];

    lines.push(`  const createCollectionItem_${this.safeKey(prop.name)} = (value, entity) => {`);
    const prop2 = prop.targetMeta?.properties[prop.mappedBy];

    if (prop2?.primary) {
      lines.push(`    if (typeof value === 'object' && value?.['${prop2.name}'] == null) {`);
      lines.push(`      value = { ...value, ['${prop2.name}']: Reference.wrapReference(entity, { ref: ${prop2.ref} }) };`);
      lines.push(`    }`);
    }

    lines.push(`    if (isPrimaryKey(value, ${meta.compositePK})) return factory.createReference('${prop.type}', value, { convertCustomTypes, schema, merge: true });`);
    lines.push(`    if (value && value.__entity) return value;`);

    if (prop2 && !prop2.primary) {
      lines.push(`    if (typeof value === 'object' && value?.['${prop2.name}'] == null) {`);
      lines.push(`      value = { ...value, ['${prop2.name}']: Reference.wrapReference(entity, { ref: ${prop2.ref} }) };`);
      lines.push(`    }`);
    }

    lines.push(`    return factory.create('${prop.type}', value, { newEntity, convertCustomTypes, schema, merge: true });`);
    lines.push(`  }`);

    return lines;
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

}
