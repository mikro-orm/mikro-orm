import { EntityMetadata, EntityProperty } from '../decorators';
import { ValidationError } from '../utils';
import { ReferenceType } from '../entity';

export class MetadataValidator {

  validateEntityDefinition(metadata: Record<string, EntityMetadata>, name: string): void {
    const meta = metadata[name];

    // entities have PK
    if (!meta.primaryKey) {
      throw ValidationError.fromMissingPrimaryKey(meta);
    }

    const references = Object.values(meta.properties).filter(prop => prop.reference !== ReferenceType.SCALAR);

    for (const prop of references) {
      this.validateReference(meta, prop, metadata);

      if (![ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
        this.validateCollection(meta, prop, metadata);
      }
    }
  }

  private validateReference(meta: EntityMetadata, prop: EntityProperty, metadata: Record<string, EntityMetadata>): void {
    // references do have types
    if (!prop.type) {
      throw ValidationError.fromWrongTypeDefinition(meta, prop);
    }

    // references do have type of known entity
    if (!metadata[prop.type]) {
      throw ValidationError.fromWrongTypeDefinition(meta, prop);
    }
  }

  private validateCollection(meta: EntityMetadata, prop: EntityProperty, metadata: Record<string, EntityMetadata>): void {
    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      const owner = metadata[prop.type].properties[prop.fk];
      return this.validateOneToManyInverseSide(meta, prop, owner);
    }

    // m:n collection either is owner or has `mappedBy`
    if (!prop.owner && !prop.mappedBy && !prop.inversedBy) {
      throw ValidationError.fromMissingOwnership(meta, prop);
    }

    if (prop.inversedBy) {
      const inverse = metadata[prop.type].properties[prop.inversedBy];
      this.validateManyToManyOwningSide(meta, prop, inverse);
    } else if (prop.mappedBy) {
      const inverse = metadata[prop.type].properties[prop.mappedBy];
      this.validateManyToManyInverseSide(meta, prop, inverse);
    }
  }

  private validateOneToManyInverseSide(meta: EntityMetadata, prop: EntityProperty, owner: EntityProperty): void {
    // 1:m collection has existing `fk` reference
    if (!owner) {
      throw ValidationError.fromWrongReference(meta, prop, 'fk');
    }

    // 1:m collection has correct `fk` reference type
    if (owner.type !== meta.name) {
      throw ValidationError.fromWrongReference(meta, prop, 'fk', owner);
    }
  }

  private validateManyToManyOwningSide(meta: EntityMetadata, prop: EntityProperty, inverse: EntityProperty): void {
    // m:n collection has correct `inversedBy` on owning side
    if (!inverse) {
      throw ValidationError.fromWrongReference(meta, prop, 'inversedBy');
    }

    // m:n collection has correct `inversedBy` reference type
    if (inverse.type !== meta.name) {
      throw ValidationError.fromWrongReference(meta, prop, 'inversedBy', inverse);
    }

    // m:n collection inversed side is not defined as owner
    if (inverse.inversedBy) {
      throw ValidationError.fromWrongOwnership(meta, prop, 'inversedBy');
    }
  }

  private validateManyToManyInverseSide(meta: EntityMetadata, prop: EntityProperty, owner: EntityProperty): void {
    // m:n collection has correct `mappedBy` on inverse side
    if (prop.mappedBy && !owner) {
      throw ValidationError.fromWrongReference(meta, prop, 'mappedBy');
    }

    // m:n collection has correct `mappedBy` reference type
    if (owner.type !== meta.name) {
      throw ValidationError.fromWrongReference(meta, prop, 'mappedBy', owner);
    }

    // m:n collection owning side is not defined as inverse
    if (owner.mappedBy) {
      throw ValidationError.fromWrongOwnership(meta, prop, 'mappedBy');
    }
  }

}
