import type { EntityName, EntityMetadata, EntityProperty } from '../typings';
import { Utils } from '../utils';
import { MetadataError } from '../errors';
import { ReferenceType } from '../enums';
import type { MetadataStorage } from './MetadataStorage';

/**
 * @internal
 */
export class MetadataValidator {

  /**
   * Validate there is only one property decorator. This disallows using `@Property()` together with e.g. `@ManyToOne()`
   * on the same property. One should use only `@ManyToOne()` in such case.
   * We allow the existence of the property in metadata if the reference type is the same, this should allow things like HMR to work.
   */
  static validateSingleDecorator(meta: EntityMetadata, propertyName: string, reference: ReferenceType): void {
    if (meta.properties[propertyName] && meta.properties[propertyName].reference !== reference) {
      throw MetadataError.multipleDecorators(meta.className, propertyName);
    }
  }

  validateEntityDefinition(metadata: MetadataStorage, name: string): void {
    const meta = metadata.get(name);

    if (meta.virtual || meta.expression) {
      for (const prop of Object.values(meta.properties)) {
        if (![ReferenceType.SCALAR, ReferenceType.EMBEDDED].includes(prop.reference)) {
          throw new MetadataError(`Only scalar and embedded properties are allowed inside virtual entity. Found '${prop.reference}' in ${meta.className}.${prop.name}`);
        }

        if (prop.primary) {
          throw new MetadataError(`Virtual entity ${meta.className} cannot have primary key ${meta.className}.${prop.name}`);
        }
      }

      return;
    }

    // entities have PK
    if (!meta.embeddable && (!meta.primaryKeys || meta.primaryKeys.length === 0)) {
      throw MetadataError.fromMissingPrimaryKey(meta);
    }

    this.validateVersionField(meta);
    this.validateIndexes(meta, meta.indexes ?? [], 'index');
    this.validateIndexes(meta, meta.uniques ?? [], 'unique');
    const references = Object.values(meta.properties).filter(prop => prop.reference !== ReferenceType.SCALAR);

    for (const prop of references) {
      this.validateReference(meta, prop, metadata);
      this.validateBidirectional(meta, prop, metadata);
    }
  }

  validateDiscovered(discovered: EntityMetadata[], warnWhenNoEntities?: boolean, checkDuplicateTableNames?: boolean, checkDuplicateEntities = true): void {
    if (discovered.length === 0 && warnWhenNoEntities) {
      throw MetadataError.noEntityDiscovered();
    }

    const duplicates = Utils.findDuplicates(discovered.map(meta => meta.className));

    if (duplicates.length > 0 && checkDuplicateEntities) {
      throw MetadataError.duplicateEntityDiscovered(duplicates);
    }

    const tableNames = discovered.filter(meta => !meta.abstract && meta === meta.root && (meta.tableName || meta.collection) && meta.schema !== '*');
    const duplicateTableNames = Utils.findDuplicates(tableNames.map(meta => {
      const tableName = meta.tableName || meta.collection;
      return (meta.schema ? '.' + meta.schema : '') + tableName;
    }));

    if (duplicateTableNames.length > 0 && checkDuplicateTableNames && checkDuplicateEntities) {
      throw MetadataError.duplicateEntityDiscovered(duplicateTableNames, 'table names');
    }

    // validate we found at least one entity (not just abstract/base entities)
    if (discovered.filter(meta => meta.name).length === 0 && warnWhenNoEntities) {
      throw MetadataError.onlyAbstractEntitiesDiscovered();
    }

    const unwrap = (type: string) => type
      .replace(/Array<(.*)>/, '$1') // unwrap array
      .replace(/\[]$/, '')          // remove array suffix
      .replace(/\((.*)\)/, '$1');   // unwrap union types

    const name = <T> (p: EntityName<T> | (() => EntityName<T>)): string => {
      if (typeof p === 'function') {
        return Utils.className((p as () => EntityName<T>)());
      }

      return Utils.className(p);
    };

    const pivotProps = new Map<string, { prop: EntityProperty; meta: EntityMetadata }[]>();

    // check for not discovered entities
    discovered.forEach(meta => Object.values(meta.properties).forEach(prop => {
      if (prop.reference !== ReferenceType.SCALAR && !unwrap(prop.type).split(/ ?\| ?/).every(type => discovered.find(m => m.className === type))) {
        throw MetadataError.fromUnknownEntity(prop.type, `${meta.className}.${prop.name}`);
      }

      if (prop.pivotEntity) {
        const props = pivotProps.get(name(prop.pivotEntity)) ?? [];
        props.push({ meta, prop });
        pivotProps.set(name(prop.pivotEntity), props);
      }
    }));

    pivotProps.forEach(props => {
      // if the pivot entity is used in more than one property, check if they are linked
      if (props.length > 1 && props.every(p => !p.prop.mappedBy && !p.prop.inversedBy)) {
        throw MetadataError.invalidManyToManyWithPivotEntity(props[0].meta, props[0].prop, props[1].meta, props[1].prop);
      }
    });
  }

  private validateReference(meta: EntityMetadata, prop: EntityProperty, metadata: MetadataStorage): void {
    // references do have types
    if (!prop.type) {
      throw MetadataError.fromWrongTypeDefinition(meta, prop);
    }

    // references do have type of known entity
    if (!metadata.find(prop.type)) {
      throw MetadataError.fromWrongTypeDefinition(meta, prop);
    }

    if (metadata.find(prop.type)!.abstract && !metadata.find(prop.type)!.discriminatorColumn) {
      throw MetadataError.targetIsAbstract(meta, prop);
    }
  }

  private validateBidirectional(meta: EntityMetadata, prop: EntityProperty, metadata: MetadataStorage): void {
    if (prop.inversedBy) {
      const inverse = metadata.get(prop.type).properties[prop.inversedBy];
      this.validateOwningSide(meta, prop, inverse, metadata);
    } else if (prop.mappedBy) {
      const inverse = metadata.get(prop.type).properties[prop.mappedBy];
      this.validateInverseSide(meta, prop, inverse, metadata);
    }
  }

  private validateOwningSide(meta: EntityMetadata, prop: EntityProperty, inverse: EntityProperty, metadata: MetadataStorage): void {
    // has correct `inversedBy` on owning side
    if (!inverse) {
      throw MetadataError.fromWrongReference(meta, prop, 'inversedBy');
    }

    const targetClassName = metadata.find(inverse.type)?.root.className;

    // has correct `inversedBy` reference type
    if (inverse.type !== meta.className && targetClassName !== meta.root.className) {
      throw MetadataError.fromWrongReference(meta, prop, 'inversedBy', inverse);
    }

    // inverse side is not defined as owner
    if (inverse.inversedBy) {
      throw MetadataError.fromWrongOwnership(meta, prop, 'inversedBy');
    }
  }

  private validateInverseSide(meta: EntityMetadata, prop: EntityProperty, owner: EntityProperty, metadata: MetadataStorage): void {
    // has correct `mappedBy` on inverse side
    if (prop.mappedBy && !owner) {
      throw MetadataError.fromWrongReference(meta, prop, 'mappedBy');
    }

    // has correct `mappedBy` reference type
    if (owner.type !== meta.className && metadata.find(owner.type)?.root.className !== meta.root.className) {
      throw MetadataError.fromWrongReference(meta, prop, 'mappedBy', owner);
    }

    // owning side is not defined as inverse
    if (owner.mappedBy) {
      throw MetadataError.fromWrongOwnership(meta, prop, 'mappedBy');
    }

    // owning side is not defined as inverse
    const valid = [
      { owner: ReferenceType.MANY_TO_ONE, inverse: ReferenceType.ONE_TO_MANY },
      { owner: ReferenceType.MANY_TO_MANY, inverse: ReferenceType.MANY_TO_MANY },
      { owner: ReferenceType.ONE_TO_ONE, inverse: ReferenceType.ONE_TO_ONE },
    ];

    if (!valid.find(spec => spec.owner === owner.reference && spec.inverse === prop.reference)) {
      throw MetadataError.fromWrongReferenceType(meta, owner, prop);
    }

    if (prop.primary) {
      throw MetadataError.fromInversideSidePrimary(meta, owner, prop);
    }
  }

  private validateIndexes(meta: EntityMetadata, indexes: { properties: string | string[] }[], type: 'index' | 'unique'): void {
    for (const index of indexes) {
      for (const prop of Utils.asArray(index.properties)) {
        if (!(prop in meta.properties)) {
          throw MetadataError.unknownIndexProperty(meta, prop, type);
        }
      }
    }
  }

  private validateVersionField(meta: EntityMetadata): void {
    if (!meta.versionProperty) {
      return;
    }

    const props = Object.values(meta.properties).filter(p => p.version);

    if (props.length > 1) {
      throw MetadataError.multipleVersionFields(meta, props.map(p => p.name));
    }

    const prop = meta.properties[meta.versionProperty];
    const type = prop.type.toLowerCase();

    if (type !== 'number' && type !== 'date' && !type.startsWith('timestamp') && !type.startsWith('datetime')) {
      throw MetadataError.invalidVersionFieldType(meta);
    }
  }

}
