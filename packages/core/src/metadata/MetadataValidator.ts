import type { EntityMetadata, EntityProperty } from '../typings';
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

  validateDiscovered(discovered: EntityMetadata[], warnWhenNoEntities: boolean): void {
    if (discovered.length === 0 && warnWhenNoEntities) {
      throw MetadataError.noEntityDiscovered();
    }

    const duplicates = Utils.findDuplicates(discovered.map(meta => meta.className));

    if (duplicates.length > 0) {
      throw MetadataError.duplicateEntityDiscovered(duplicates);
    }

    // validate we found at least one entity (not just abstract/base entities)
    if (discovered.filter(meta => meta.name).length === 0 && warnWhenNoEntities) {
      throw MetadataError.onlyAbstractEntitiesDiscovered();
    }

    // check for not discovered entities
    discovered.forEach(meta => Object.values(meta.properties).forEach(prop => {
      if (prop.reference !== ReferenceType.SCALAR && !discovered.find(m => m.className === prop.type)) {
        throw MetadataError.fromUnknownEntity(prop.type, `${meta.className}.${prop.name}`);
      }
    }));
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

    /* istanbul ignore next */
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
