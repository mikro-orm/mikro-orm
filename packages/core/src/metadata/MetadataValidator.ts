import type { EntityMetadata, EntityName, EntityProperty } from '../typings';
import { type MetadataDiscoveryOptions, Utils } from '../utils';
import { MetadataError } from '../errors';
import { ReferenceKind } from '../enums';
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
  static validateSingleDecorator(meta: EntityMetadata, propertyName: string, reference: ReferenceKind): void {
    if (meta.properties[propertyName] && meta.properties[propertyName].kind !== reference) {
      throw MetadataError.multipleDecorators(meta.className, propertyName);
    }
  }

  validateEntityDefinition<T>(metadata: MetadataStorage, name: string, options: MetadataDiscoveryOptions): void {
    const meta = metadata.get<T>(name);

    if (meta.virtual || meta.expression) {
      for (const prop of Utils.values(meta.properties)) {
        if (![ReferenceKind.SCALAR, ReferenceKind.EMBEDDED, ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
          throw new MetadataError(`Only scalars, embedded properties and to-many relations are allowed inside virtual entity. Found '${prop.kind}' in ${meta.className}.${prop.name}`);
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
    this.validateDuplicateFieldNames(meta, options);
    this.validateIndexes(meta, meta.indexes ?? [], 'index');
    this.validateIndexes(meta, meta.uniques ?? [], 'unique');

    for (const prop of Utils.values(meta.properties)) {
      if (prop.kind !== ReferenceKind.SCALAR) {
        this.validateReference(meta, prop, metadata);
        this.validateBidirectional(meta, prop, metadata);
      } else if (metadata.has(prop.type)) {
        throw MetadataError.propertyTargetsEntityType(meta, prop, metadata.get(prop.type));
      }
    }
  }

  validateDiscovered(discovered: EntityMetadata[], options: MetadataDiscoveryOptions): void {
    if (discovered.length === 0 && options.warnWhenNoEntities) {
      throw MetadataError.noEntityDiscovered();
    }

    const duplicates = Utils.findDuplicates(discovered.map(meta => meta.className));

    if (duplicates.length > 0 && options.checkDuplicateEntities) {
      throw MetadataError.duplicateEntityDiscovered(duplicates);
    }

    const tableNames = discovered.filter(meta => !meta.abstract && meta === meta.root && (meta.tableName || meta.collection) && meta.schema !== '*');
    const duplicateTableNames = Utils.findDuplicates(tableNames.map(meta => {
      const tableName = meta.tableName || meta.collection;
      return (meta.schema ? '.' + meta.schema : '') + tableName;
    }));

    if (duplicateTableNames.length > 0 && options.checkDuplicateTableNames && options.checkDuplicateEntities) {
      throw MetadataError.duplicateEntityDiscovered(duplicateTableNames, 'table names');
    }

    // validate we found at least one entity (not just abstract/base entities)
    if (discovered.filter(meta => meta.name).length === 0 && options.warnWhenNoEntities) {
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
      if (prop.kind !== ReferenceKind.SCALAR && !unwrap(prop.type).split(/ ?\| ?/).every(type => discovered.find(m => m.className === type))) {
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
    } else {
      // 1:m property has `mappedBy`
      if (prop.kind === ReferenceKind.ONE_TO_MANY && !prop.mappedBy) {
        throw MetadataError.fromMissingOption(meta, prop, 'mappedBy');
      }
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
      { owner: ReferenceKind.MANY_TO_ONE, inverse: ReferenceKind.ONE_TO_MANY },
      { owner: ReferenceKind.MANY_TO_MANY, inverse: ReferenceKind.MANY_TO_MANY },
      { owner: ReferenceKind.ONE_TO_ONE, inverse: ReferenceKind.ONE_TO_ONE },
    ];

    if (!valid.find(spec => spec.owner === owner.kind && spec.inverse === prop.kind)) {
      throw MetadataError.fromWrongReferenceKind(meta, owner, prop);
    }

    if (prop.primary) {
      throw MetadataError.fromInversideSidePrimary(meta, owner, prop);
    }
  }

  private validateIndexes(meta: EntityMetadata, indexes: { properties: string | string[] }[], type: 'index' | 'unique'): void {
    for (const index of indexes) {
      for (const prop of Utils.asArray(index.properties)) {
        if (!meta.properties[prop] && !Object.values(meta.properties).some(p => prop.startsWith(p.name + '.'))) {
          throw MetadataError.unknownIndexProperty(meta, prop, type);
        }
      }
    }
  }

  private validateDuplicateFieldNames(meta: EntityMetadata, options: MetadataDiscoveryOptions): void {
    const candidates = Object.values(meta.properties)
      .filter(prop => prop.persist !== false && !prop.inherited && prop.fieldNames?.length === 1)
      .map(prop => prop.fieldNames[0]);
    const duplicates = Utils.findDuplicates(candidates);

    if (duplicates.length > 0 && options.checkDuplicateFieldNames) {
      const pairs = duplicates.flatMap(name => {
        return Object.values(meta.properties)
          .filter(p => p.fieldNames[0] === name)
          .map(prop => [prop.name, prop.fieldNames[0]] as [string, string]);
      });

      throw MetadataError.duplicateFieldName(meta.className, pairs);
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
    const type = prop.runtimeType ?? prop.columnTypes?.[0] ?? prop.type;

    if (type !== 'number' && type !== 'Date' && !type.startsWith('timestamp') && !type.startsWith('datetime')) {
      throw MetadataError.invalidVersionFieldType(meta);
    }
  }

}
