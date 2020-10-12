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

    for (const prop of props) {
      if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
        lines.push(`  if (data.${prop.name} === null) {\n    entity.${prop.name} = null;`);
        lines.push(`  } else if (typeof data.${prop.name} !== 'undefined') {`);
        lines.push(`    if (isPrimaryKey(data.${prop.name}, true)) {`);

        if (prop.wrappedReference) {
          lines.push(`      entity.${prop.name} = new Reference(factory.createReference('${prop.type}', data.${prop.name}, { merge: true }));`);
        } else {
          lines.push(`      entity.${prop.name} = factory.createReference('${prop.type}', data.${prop.name}, { merge: true });`);
        }

        lines.push(`    } else if (data.${prop.name} && typeof data.${prop.name} === 'object') {`);

        if (prop.wrappedReference) {
          lines.push(`      entity.${prop.name} = new Reference(factory.create('${prop.type}', data.${prop.name}, { initialized: true, merge: true }));`);
        } else {
          lines.push(`      entity.${prop.name} = factory.create('${prop.type}', data.${prop.name}, { initialized: true, merge: true });`);
        }

        lines.push(`    }`);
        lines.push(`  }`);

        if (prop.reference === ReferenceType.ONE_TO_ONE) {
          const meta2 = this.metadata.get(prop.type);
          const prop2 = meta2.properties[prop.inversedBy || prop.mappedBy];

          if (prop2) {
            lines.push(`  if (entity.${prop.name} && !entity.${prop.name}.${prop2.name}) {`);
            lines.push(`    entity.${prop.name}.${prop.wrappedReference ? 'unwrap().' : ''}${prop2.name} = ${prop2.wrappedReference ? 'new Reference(entity)' : 'entity'};`);
            lines.push(`  }`);
          }
        }
      } else if (prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.MANY_TO_MANY) {
        lines.push(...this.createCollectionItemMapper(prop));
        lines.push(`  if (Array.isArray(data.${prop.name})) {`);
        lines.push(`     const items = data.${prop.name}.map(value => createCollectionItem_${prop.name}(value));`);
        lines.push(`     const coll = Collection.create(entity, '${prop.name}', items, newEntity);`);
        lines.push(`     coll.setDirty(newEntity);`);
        lines.push(`  } else if (!entity.${prop.name}) {`);
        const items = this.platform.usesPivotTable() || !prop.owner ? 'undefined' : '[]';
        lines.push(`    const coll = Collection.create(entity, '${prop.name}', ${items}, data.${prop.name} || newEntity);`);
        lines.push(`    coll.setDirty(false);`);
        lines.push(`  }`);
      } else if (prop.reference === ReferenceType.EMBEDDED) {
        context.set(`prototype_${prop.name}`, prop.embeddable.prototype);

        lines.push(`  entity.${prop.name} = Object.create(prototype_${prop.name});`);
        meta.props
          .filter(p => p.embedded?.[0] === prop.name)
          .forEach(childProp => lines.push(`  entity.${prop.name}.${childProp.embedded![1]} = data.${childProp.name};`));
      } else { // ReferenceType.SCALAR
        if (prop.type.toLowerCase() === 'date') {
          lines.push(`  if (data.${prop.name}) entity.${prop.name} = new Date(data.${prop.name});`);
          lines.push(`  else if (data.${prop.name} === null) entity.${prop.name} = null;`);
        } else if (prop.customType) {
          context.set(`convertToJSValue_${prop.name}`, (val: any) => prop.customType.convertToJSValue(val, this.platform));
          context.set(`convertToDatabaseValue_${prop.name}`, (val: any) => prop.customType.convertToDatabaseValue(val, this.platform));

          lines.push(`  if (typeof data.${prop.name} !== 'undefined') {`);
          lines.push(`    if (convertCustomTypes) {`);
          lines.push(`      const value = convertToJSValue_${prop.name}(data.${prop.name});`);
          lines.push(`      data.${prop.name} = convertToDatabaseValue_${prop.name}(value);`); // make sure the value is comparable
          lines.push(`      entity.${prop.name} = value;`);
          lines.push(`    } else {`);
          lines.push(`      entity.${prop.name} = data.${prop.name};`);
          lines.push(`    }`);
          lines.push(`  }`);
        } else {
          lines.push(`  if (typeof data.${prop.name} !== 'undefined') entity.${prop.name} = data.${prop.name};`);
        }
      }
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
    lines.push(`    if (isPrimaryKey(value, ${meta.compositePK})) return factory.createReference('${prop.type}', value, { merge: true });`);
    lines.push(`    if (value && value.__entity) return value;`);
    lines.push(`    return factory.create('${prop.type}', value, { newEntity, merge: true });`);
    lines.push(`  }`);

    return lines;
  }

}
