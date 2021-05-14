import { AnyEntity, EntityData, EntityMetadata, EntityProperty } from '../typings';
import { Hydrator } from './Hydrator';
import { Collection } from '../entity/Collection';
import { Reference } from '../entity/Reference';
import { Utils } from '../utils/Utils';
import { ReferenceType } from '../enums';
import { EntityFactory } from '../entity/EntityFactory';

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
  private getEntityHydrator<T extends AnyEntity<T>>(meta: EntityMetadata<T>, type: 'full' | 'returning' | 'reference'): EntityHydrator<T> {
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
      const path = dataKey.split('.');
      path.pop();

      if (path.length === 0) {
        return '';
      }

      let ret = '';
      let prev = '';

      for (const p of path) {
        const key = prev ? prev + '.' + p : p;
        ret += `data.${key} && `;
        prev = key;
      }

      return ret;
    };

    const hydrateScalar = <T, U>(prop: EntityProperty<T>, object: boolean | undefined, path: string[], dataKey: string): string[] => {
      const entityKey = path.join('.');
      const preCond = preCondition(dataKey);
      const convertorKey = path.join('_').replace(/\[idx_[\d+]]/g, '');
      const ret: string[] = [];

      if (prop.type.toLowerCase() === 'date') {
        ret.push(
          `  if (${preCond}data.${dataKey}) entity.${entityKey} = new Date(data.${dataKey});`,
          `  else if (${preCond}data.${dataKey} === null) entity.${entityKey} = null;`,
        );
      } else if (prop.customType) {
        context.set(`convertToJSValue_${convertorKey}`, (val: any) => prop.customType.convertToJSValue(val, this.platform));
        context.set(`convertToDatabaseValue_${convertorKey}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

        ret.push(
          `  if (${preCond}typeof data.${dataKey} !== 'undefined') {`,
          `    if (convertCustomTypes) {`,
          `      const value = convertToJSValue_${convertorKey}(data.${dataKey});`,
          `      data.${dataKey} = convertToDatabaseValue_${convertorKey}(value);`, // make sure the value is comparable
          `      entity.${entityKey} = value;`,
          `    } else {`,
          `      entity.${entityKey} = data.${dataKey};`,
          `    }`,
          `  }`,
        );
      } else if (prop.type.toLowerCase() === 'boolean') {
        ret.push(`  if (${preCond}typeof data.${dataKey} !== 'undefined') entity.${entityKey} = data.${dataKey} === null ? null : !!data.${dataKey};`);
      } else {
        ret.push(`  if (${preCond}typeof data.${dataKey} !== 'undefined') entity.${entityKey} = data.${dataKey};`);
      }

      return ret;
    };

    const hydrateToOne = (prop: EntityProperty) => {
      const ret: string[] = [];

      ret.push(`  if (data.${prop.name} === null) {\n    entity.${prop.name} = null;`);
      ret.push(`  } else if (typeof data.${prop.name} !== 'undefined') {`);
      ret.push(`    if (isPrimaryKey(data.${prop.name}, true)) {`);

      if (prop.mapToPk) {
        ret.push(`      entity.${prop.name} = data.${prop.name};`);
      } else if (prop.wrappedReference) {
        ret.push(`      entity.${prop.name} = new Reference(factory.createReference('${prop.type}', data.${prop.name}, { merge: true, convertCustomTypes }));`);
      } else {
        ret.push(`      entity.${prop.name} = factory.createReference('${prop.type}', data.${prop.name}, { merge: true, convertCustomTypes });`);
      }

      ret.push(`    } else if (data.${prop.name} && typeof data.${prop.name} === 'object') {`);

      if (prop.mapToPk) {
        ret.push(`      entity.${prop.name} = data.${prop.name};`);
      } else if (prop.wrappedReference) {
        ret.push(`      entity.${prop.name} = new Reference(factory.create('${prop.type}', data.${prop.name}, { initialized: true, merge: true, newEntity, convertCustomTypes }));`);
      } else {
        ret.push(`      entity.${prop.name} = factory.create('${prop.type}', data.${prop.name}, { initialized: true, merge: true, newEntity, convertCustomTypes });`);
      }

      ret.push(`    }`);
      ret.push(`  }`);

      if (prop.reference === ReferenceType.ONE_TO_ONE && !prop.mapToPk) {
        const meta2 = this.metadata.get(prop.type);
        const prop2 = meta2.properties[prop.inversedBy || prop.mappedBy];

        if (prop2) {
          ret.push(`  if (entity.${prop.name} && !entity.${prop.name}.${prop2.name}) {`);
          ret.push(`    entity.${prop.name}.${prop.wrappedReference ? 'unwrap().' : ''}${prop2.name} = ${prop2.wrappedReference ? 'new Reference(entity)' : 'entity'};`);
          ret.push(`  }`);
        }
      }

      if (prop.customType) {
        context.set(`convertToDatabaseValue_${prop.name}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

        ret.push(`  if (data.${prop.name} != null && convertCustomTypes) {`);
        ret.push(`    data.${prop.name} = convertToDatabaseValue_${prop.name}(entity.${prop.name}.__helper.getPrimaryKey());`); // make sure the value is comparable
        ret.push(`  }`);
      }

      return ret;
    };

    const hydrateToMany = (prop: EntityProperty) => {
      const ret: string[] = [];

      ret.push(...this.createCollectionItemMapper(prop));
      ret.push(`  if (Array.isArray(data.${prop.name})) {`);
      ret.push(`     const items = data.${prop.name}.map(value => createCollectionItem_${prop.name}(value));`);
      ret.push(`     const coll = Collection.create(entity, '${prop.name}', items, newEntity);`);
      ret.push(`     if (newEntity) {`);
      ret.push(`       coll.setDirty();`);
      ret.push(`     } else {`);
      ret.push(`       coll.takeSnapshot();`);
      ret.push(`     }`);
      ret.push(`  } else if (!entity.${prop.name} && data.${prop.name} instanceof Collection) {`);
      ret.push(`     entity.${prop.name} = data.${prop.name};`);
      ret.push(`  } else if (!entity.${prop.name}) {`);
      const items = this.platform.usesPivotTable() || !prop.owner ? 'undefined' : '[]';
      ret.push(`    const coll = Collection.create(entity, '${prop.name}', ${items}, !!data.${prop.name} || newEntity);`);
      ret.push(`    coll.setDirty(false);`);
      ret.push(`  }`);

      return ret;
    };

    const hydrateEmbedded = (prop: EntityProperty, object: boolean | undefined, path: string[], dataKey: string): string[] => {
      const entityKey = path.join('.');
      const convertorKey = path.join('_').replace(/\[idx_[\d+]]/g, '');
      const ret: string[] = [];
      const conds: string[] = [];
      context.set(`prototype_${convertorKey}`, prop.embeddable.prototype);

      if (prop.object) {
        conds.push(`data.${dataKey} != null`);
      } else {
        meta.props
          .filter(p => p.embedded?.[0] === prop.name)
          .forEach(p => conds.push(`data.${p.name} != null`));
      }

      ret.push(`  if (${conds.join(' || ')}) {`);
      ret.push(`    entity.${entityKey} = Object.create(prototype_${convertorKey});`);
      meta.props
        .filter(p => p.embedded?.[0] === prop.name)
        .forEach(childProp => {
          const childDataKey = prop.object ? dataKey + '.' + childProp.embedded![1] : childProp.name;
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          ret.push(...hydrateProperty(childProp, prop.object, [...path, childProp.embedded![1]], childDataKey).map(l => '  ' + l));
        });
      ret.push(`  }`);

      return ret;
    };

    const hydrateEmbeddedArray = (prop: EntityProperty, path: string[], dataKey: string): string[] => {
      const entityKey = path.join('.');
      const convertorKey = path.join('_').replace(/\[idx_[\d+]]/g, '');
      const ret: string[] = [];
      const idx = this.tmpIndex++;

      context.set(`prototype_${convertorKey}`, prop.embeddable.prototype);
      ret.push(`  if (Array.isArray(data.${dataKey})) {`);
      ret.push(`    entity.${entityKey} = [];`);
      ret.push(`    data.${dataKey}.forEach((_, idx_${idx}) => {`);
      const last = path.pop();
      ret.push(...hydrateEmbedded(prop, true, [...path, `${last}[idx_${idx}]`], `${dataKey}[idx_${idx}]`).map(l => '    ' + l));
      ret.push(`    });`);
      ret.push(`  }`);

      return ret;
    };

    const hydrateProperty = (prop: EntityProperty, object = prop.object, path: string[] = [prop.name], dataKey?: string): string[] => {
      const entityKey = path.join('.');
      dataKey = dataKey ?? (object ? entityKey : prop.name);
      const ret: string[] = [];

      if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
        ret.push(...hydrateToOne(prop));
      } else if (prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.MANY_TO_MANY) {
        ret.push(...hydrateToMany(prop));
      } else if (prop.reference === ReferenceType.EMBEDDED) {
        if (prop.array) {
          ret.push(...hydrateEmbeddedArray(prop, path, dataKey));
        } else {
          ret.push(...hydrateEmbedded(prop, object, path, dataKey));
        }
      } else { // ReferenceType.SCALAR
        ret.push(...hydrateScalar(prop, object, path, dataKey));
      }

      if (this.config.get('forceUndefined')) {
        ret.push(`  if (data.${dataKey} === null) entity.${entityKey} = undefined;`);
      }

      return ret;
    };

    for (const prop of props) {
      lines.push(...hydrateProperty(prop));
    }

    const code = `return function(entity, data, factory, newEntity, convertCustomTypes) {\n${lines.join('\n')}\n}`;
    const hydrator = Utils.createFunction(context, code);
    this.hydrators[type].set(meta.className, hydrator);

    return hydrator;
  }

  private createCollectionItemMapper<T>(prop: EntityProperty): string[] {
    const meta = this.metadata.find(prop.type)!;
    const lines: string[] = [];

    lines.push(`  const createCollectionItem_${prop.name} = value => {`);
    lines.push(`    if (isPrimaryKey(value, ${meta.compositePK})) return factory.createReference('${prop.type}', value, { convertCustomTypes, merge: true });`);
    lines.push(`    if (value && value.__entity) return value;`);
    lines.push(`    return factory.create('${prop.type}', value, { newEntity, convertCustomTypes, merge: true });`);
    lines.push(`  }`);

    return lines;
  }

}
