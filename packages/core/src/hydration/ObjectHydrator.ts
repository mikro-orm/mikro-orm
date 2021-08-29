import type { AnyEntity, EntityData, EntityMetadata, EntityProperty } from '../typings';
import { Hydrator } from './Hydrator';
import { Collection } from '../entity/Collection';
import { Reference } from '../entity/Reference';
import { Utils } from '../utils/Utils';
import { ReferenceType } from '../enums';
import type { EntityFactory } from '../entity/EntityFactory';

type EntityHydrator<T> = (entity: T, data: EntityData<T>, factory: EntityFactory, newEntity: boolean, convertCustomTypes: boolean) => void;

export class ObjectHydrator extends Hydrator {

  private readonly hydrators = {
    full: new Map<string, EntityHydrator<any>>(),
    reference: new Map<string, EntityHydrator<any>>(),
    returning: new Map<string, EntityHydrator<any>>(),
  };

  private tmpIndex = 0;

  /**
   * @inheritDoc
   */
  hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, type: 'full' | 'returning' | 'reference', newEntity = false, convertCustomTypes = false): void {
    const hydrate = this.getEntityHydrator(meta, type);
    Utils.callCompiledFunction(hydrate, entity, data, factory, newEntity, convertCustomTypes);
  }

  /**
   * @inheritDoc
   */
  hydrateReference<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, convertCustomTypes = false): void {
    const hydrate = this.getEntityHydrator(meta, 'reference');
    Utils.callCompiledFunction(hydrate, entity, data, factory, false, convertCustomTypes);
  }

  /**
   * @internal Highly performance-sensitive method.
   */
  getEntityHydrator<T extends AnyEntity<T>>(meta: EntityMetadata<T>, type: 'full' | 'returning' | 'reference'): EntityHydrator<T> {
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

    const preCondition = (dataKey: string) => {
      /* istanbul ignore next */
      const path = dataKey.match(/\[[^\]]+]|\.\w+/g) ?? [];
      path.pop();

      if (path.length === 0) {
        return '';
      }

      let ret = '';
      let prev = '';

      for (const p of path) {
        const key = prev ? prev + p : p;
        ret += `data${key} && `;
        prev = key;
      }

      return ret;
    };

    const hydrateScalar = <T, U>(prop: EntityProperty<T>, object: boolean | undefined, path: string[], dataKey: string): string[] => {
      const entityKey = path.map(k => this.wrap(k)).join('');
      const preCond = preCondition(dataKey);
      const convertorKey = path.filter(k => !k.match(/\[idx_\d+]/)).map(k => this.safeKey(k)).join('_');
      const ret: string[] = [];

      if (prop.type.toLowerCase() === 'date') {
        ret.push(
          `  if (${preCond}data${dataKey}) entity${entityKey} = new Date(data${dataKey});`,
          `  else if (${preCond}data${dataKey} === null) entity${entityKey} = null;`,
        );
      } else if (prop.customType) {
        context.set(`convertToJSValue_${convertorKey}`, (val: any) => prop.customType.convertToJSValue(val, this.platform));
        context.set(`convertToDatabaseValue_${convertorKey}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

        ret.push(
          `  if (${preCond}typeof data${dataKey} !== 'undefined') {`,
          `    if (convertCustomTypes) {`,
          `      const value = convertToJSValue_${convertorKey}(data${dataKey});`,
          `      data${dataKey} = convertToDatabaseValue_${convertorKey}(value);`, // make sure the value is comparable
          `      entity${entityKey} = value;`,
          `    } else {`,
          `      entity${entityKey} = data${dataKey};`,
          `    }`,
          `  }`,
        );
      } else if (prop.type.toLowerCase() === 'boolean') {
        ret.push(`  if (${preCond}typeof data${dataKey} !== 'undefined') entity${entityKey} = data${dataKey} === null ? null : !!data${dataKey};`);
      } else {
        ret.push(`  if (${preCond}typeof data${dataKey} !== 'undefined') entity${entityKey} = data${dataKey};`);
      }

      return ret;
    };

    const hydrateToOne = (prop: EntityProperty, dataKey: string, entityKey: string) => {
      const ret: string[] = [];

      ret.push(`  if (data${dataKey} === null) {\n    entity${entityKey} = null;`);
      ret.push(`  } else if (typeof data${dataKey} !== 'undefined') {`);
      ret.push(`    if (isPrimaryKey(data${dataKey}, true)) {`);

      if (prop.mapToPk) {
        ret.push(`      entity${entityKey} = data${dataKey};`);
      } else if (prop.wrappedReference) {
        ret.push(`      entity${entityKey} = new Reference(factory.createReference('${prop.type}', data${dataKey}, { merge: true, convertCustomTypes }));`);
      } else {
        ret.push(`      entity${entityKey} = factory.createReference('${prop.type}', data${dataKey}, { merge: true, convertCustomTypes });`);
      }

      ret.push(`    } else if (data${dataKey} && typeof data${dataKey} === 'object') {`);

      if (prop.mapToPk) {
        ret.push(`      entity${entityKey} = data${dataKey};`);
      } else if (prop.wrappedReference) {
        ret.push(`      entity${entityKey} = new Reference(factory.create('${prop.type}', data${dataKey}, { initialized: true, merge: true, newEntity, convertCustomTypes }));`);
      } else {
        ret.push(`      entity${entityKey} = factory.create('${prop.type}', data${dataKey}, { initialized: true, merge: true, newEntity, convertCustomTypes });`);
      }

      ret.push(`    }`);
      ret.push(`  }`);

      if (prop.reference === ReferenceType.ONE_TO_ONE && !prop.mapToPk) {
        const meta2 = this.metadata.get(prop.type);
        const prop2 = meta2.properties[prop.inversedBy || prop.mappedBy];

        if (prop2) {
          ret.push(`  if (entity${entityKey} && !entity${entityKey}.${prop2.name}) {`);
          ret.push(`    entity${entityKey}.${prop.wrappedReference ? 'unwrap().' : ''}${prop2.name} = ${prop2.wrappedReference ? 'new Reference(entity)' : 'entity'};`);
          ret.push(`  }`);
        }
      }

      if (prop.customType) {
        context.set(`convertToDatabaseValue_${this.safeKey(prop.name)}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

        ret.push(`  if (data${dataKey} != null && convertCustomTypes) {`);
        ret.push(`    data${dataKey} = convertToDatabaseValue_${this.safeKey(prop.name)}(entity${entityKey}.__helper.getPrimaryKey());`); // make sure the value is comparable
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
      ret.push(`     const items = data${dataKey}.map(value => createCollectionItem_${this.safeKey(prop.name)}(value));`);
      ret.push(`     const coll = Collection.create(entity, '${prop.name}', items, newEntity);`);
      ret.push(`     if (newEntity) {`);
      ret.push(`       coll.setDirty();`);
      ret.push(`     } else {`);
      ret.push(`       coll.takeSnapshot();`);
      ret.push(`     }`);
      ret.push(`  } else if (!entity${entityKey} && data${dataKey} instanceof Collection) {`);
      ret.push(`     entity${entityKey} = data${dataKey};`);
      ret.push(`  } else if (!entity${entityKey}) {`);
      const items = this.platform.usesPivotTable() || !prop.owner ? 'undefined' : '[]';
      ret.push(`    const coll = Collection.create(entity, '${prop.name}', ${items}, !!data${dataKey} || newEntity);`);
      ret.push(`    coll.setDirty(false);`);
      ret.push(`  }`);

      return ret;
    };

    const hydrateEmbedded = (prop: EntityProperty, path: string[], dataKey: string): string[] => {
      const entityKey = path.map(k => this.wrap(k)).join('');
      const convertorKey = path.filter(k => !k.match(/\[idx_\d+]/)).map(k => this.safeKey(k)).join('_');
      const ret: string[] = [];
      const conds: string[] = [];
      context.set(`prototype_${convertorKey}`, prop.embeddable.prototype);

      /* istanbul ignore next */
      if (!this.platform.convertsJsonAutomatically() && (prop.object || prop.array)) {
        context.set(`convertToJSValue_${convertorKey}`, (val: any) => prop.customType.convertToJSValue(val, this.platform));

        ret.push(
          `  if (typeof data${dataKey} === 'string') {`,
          `    data${dataKey} = JSON.parse(data${dataKey});`,
          `  }`,
        );
      }

      if (prop.object) {
        conds.push(`data${dataKey} != null`);
      } else {
        meta.props
          .filter(p => p.embedded?.[0] === prop.name)
          .forEach(p => conds.push(`data${this.wrap(p.name)} != null`));
      }

      ret.push(`  if (${conds.join(' || ')}) {`);
      ret.push(`    entity${entityKey} = Object.create(prototype_${convertorKey});`);
      meta.props
        .filter(p => p.embedded?.[0] === prop.name)
        .forEach(childProp => {
          const childDataKey = prop.object ? dataKey + this.wrap(childProp.embedded![1]) : this.wrap(childProp.name);
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          ret.push(...hydrateProperty(childProp, prop.object, [...path, childProp.embedded![1]], childDataKey).map(l => '  ' + l));
        });
      ret.push(`  }`);

      return ret;
    };

    const hydrateEmbeddedArray = (prop: EntityProperty, path: string[], dataKey: string): string[] => {
      const entityKey = path.map(k => this.wrap(k)).join('');
      const convertorKey = path.filter(k => !k.match(/\[idx_\d+]/)).map(k => this.safeKey(k)).join('_');
      const ret: string[] = [];
      const idx = this.tmpIndex++;

      context.set(`prototype_${convertorKey}`, prop.embeddable.prototype);
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

      if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
        ret.push(...hydrateToOne(prop, dataKey, entityKey));
      } else if (prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.MANY_TO_MANY) {
        ret.push(...hydrateToMany(prop, dataKey, entityKey));
      } else if (prop.reference === ReferenceType.EMBEDDED) {
        if (prop.array) {
          ret.push(...hydrateEmbeddedArray(prop, path, dataKey));
        } else {
          ret.push(...hydrateEmbedded(prop, path, dataKey));

          if (!prop.object) {
            ret.push(...hydrateEmbedded({ ...prop, object: true }, path, dataKey));
          }
        }
      } else { // ReferenceType.SCALAR
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
      + `return function(entity, data, factory, newEntity, convertCustomTypes) {\n`
      + `${lines.join('\n')}\n}`;
    const hydrator = Utils.createFunction(context, code);
    this.hydrators[type].set(meta.className, hydrator);

    return hydrator;
  }

  private createCollectionItemMapper<T>(prop: EntityProperty): string[] {
    const meta = this.metadata.find(prop.type)!;
    const lines: string[] = [];

    lines.push(`  const createCollectionItem_${this.safeKey(prop.name)} = value => {`);
    lines.push(`    if (isPrimaryKey(value, ${meta.compositePK})) return factory.createReference('${prop.type}', value, { convertCustomTypes, merge: true });`);
    lines.push(`    if (value && value.__entity) return value;`);
    lines.push(`    return factory.create('${prop.type}', value, { newEntity, convertCustomTypes, merge: true });`);
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
    return key.replace(/[^\w]/g, '_');
  }

}
