import { EntityMetadata, EntityProperty, ReferenceType } from '../decorators/Entity';

export class MetadataValidator {

  validateEntityDefinition(metadata: { [name: string]: EntityMetadata }, name: string): void {
    const meta = metadata[name];

    // entities have PK
    if (!meta.primaryKey) {
      throw new Error(`${meta.name} entity is missing @PrimaryKey()`);
    }

    Object.values(meta.properties).forEach(prop => {
      // references do have types
      if (prop.reference !== ReferenceType.SCALAR && !prop.type) {
        throw new Error(`${meta.name}.${prop.name} is missing type definition`);
      }

      // references do have type of known entity
      if (prop.reference !== ReferenceType.SCALAR && !metadata[prop.type]) {
        throw new Error(`${meta.name}.${prop.name} has unknown type: ${prop.type}`);
      }

      if (prop.reference === ReferenceType.ONE_TO_MANY) {
        const owner = metadata[prop.type].properties[prop.fk];
        this.validateOneToManyInverseSide(meta, prop, owner);
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY) {
        // m:n collection either is owner or has `mappedBy`
        if (!prop.owner && !prop.mappedBy && !prop.inversedBy) {
          throw new Error(`${meta.name}.${prop.name} needs to have one of 'owner', 'mappedBy' or 'inversedBy' attributes`);
        }

        if (prop.inversedBy) {
          const inverse = metadata[prop.type].properties[prop.inversedBy];
          this.validateManyToManyOwningSide(meta, prop, inverse);
        }

        if (prop.mappedBy) {
          const inverse = metadata[prop.type].properties[prop.mappedBy];
          this.validateManyToManyInverseSide(meta, prop, inverse);
        }
      }
    })
  }

  private validateOneToManyInverseSide(meta: EntityMetadata, prop: EntityProperty, owner: EntityProperty): void {
    // 1:m collection has existing `fk` reference
    if (!owner) {
      throw new Error(`${meta.name}.${prop.name} has unknown 'fk' reference: ${prop.type}.${prop.fk}`);
    }

    // 1:m collection has correct `fk` reference type
    if (owner.type !== meta.name) {
      throw new Error(`${meta.name}.${prop.name} has wrong 'fk' reference type: ${owner.type} instead of ${meta.name}`);
    }
  }

  private validateManyToManyOwningSide(meta: EntityMetadata, prop: EntityProperty, inverse: EntityProperty): void {
    // m:n collection has correct `inversedBy` on owning side
    if (!inverse) {
      throw new Error(`${meta.name}.${prop.name} has unknown 'inversedBy' reference: ${prop.type}.${prop.inversedBy}`);
    }

    // m:n collection has correct `inversedBy` reference type
    if (inverse.type !== meta.name) {
      throw new Error(`${meta.name}.${prop.name} has wrong 'inversedBy' reference type: ${inverse.type} instead of ${meta.name}`);
    }

    // m:n collection inversed side is not defined as owner
    if (inverse.inversedBy) {
      throw new Error(`Both ${meta.name}.${prop.name} and ${prop.type}.${prop.inversedBy} are defined as owning sides, use mappedBy on one of them`);
    }
  }

  private validateManyToManyInverseSide(meta: EntityMetadata, prop: EntityProperty, owner: EntityProperty): void {
    // m:n collection has correct `mappedBy` on inverse side
    if (prop.reference === ReferenceType.MANY_TO_MANY && prop.mappedBy && !owner) {
      throw new Error(`${meta.name}.${prop.name} has unknown 'mappedBy' reference: ${prop.type}.${prop.mappedBy}`);
    }

    // m:n collection has correct `mappedBy` reference type
    if (prop.reference === ReferenceType.MANY_TO_MANY && owner.type !== meta.name) {
      throw new Error(`${meta.name}.${prop.name} has wrong 'mappedBy' reference type: ${owner.type} instead of ${meta.name}`);
    }

    // m:n collection owning side is not defined as inverse
    if (prop.reference === ReferenceType.MANY_TO_MANY && owner.mappedBy) {
      throw new Error(`Both ${meta.name}.${prop.name} and ${prop.type}.${prop.mappedBy} are defined as inverse sides, use inversedBy on one of them`);
    }
  }

}
