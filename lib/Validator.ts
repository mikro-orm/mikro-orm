import { SCALAR_TYPES } from './EntityFactory';
import { EntityMetadata, EntityProperty, IEntity, ReferenceType } from './decorators/Entity';
import { Utils } from './Utils';

export class Validator {

  constructor(private strict: boolean) { }

  validate(entity: IEntity, payload: any, meta: EntityMetadata): void {
    Object.keys(payload).forEach(prop => {
      const property = meta.properties[prop];

      if (!property || property.reference !== ReferenceType.SCALAR || !SCALAR_TYPES.includes(property.type)) {
        return;
      }

      payload[prop] = entity[prop] = this.validateProperty(property, payload[prop], entity);
    });
  }

  validateProperty(prop: EntityProperty, givenValue: any, entity: IEntity) {
    if (givenValue === null) {
      return givenValue;
    }

    const expectedType = prop.type.toLowerCase();
    const objectType = Object.prototype.toString.call(givenValue);
    let givenType = objectType.match(/\[object (\w+)]/)[1].toLowerCase();
    let ret = givenValue;

    if (!this.strict && expectedType === 'date' && givenType === 'string') {
      const date = new Date(givenValue);

      if (date.toString() !== 'Invalid Date') {
        ret = date;
        givenType = 'date';
      }
    }

    if (!this.strict && expectedType === 'number' && givenType === 'string') {
      const num = +givenValue;

      if ('' + num === givenValue) {
        ret = num;
        givenType = 'number';
      }
    }

    if (!this.strict && expectedType === 'boolean' && givenType === 'number') {
      const bool = !!givenValue;

      if (+bool === givenValue) {
        ret = bool;
        givenType = 'boolean';
      }
    }

    if (givenType !== expectedType) {
      throw new Error(`Validation error: trying to set ${entity.constructor.name}.${prop.name} of type '${expectedType}' to '${givenValue}' of type '${givenType}'`);
    }

    return ret;
  }

  validateParams(params: any, type = 'search condition', field?: string): void {
    if (Utils.isPrimaryKey(params)) {
      return;
    }

    if (Utils.isEntity(params)) {
      if (field) {
        throw new Error(`${params.constructor.name} entity provided in ${type} in field '${field}'. Please provide identifier instead.`);
      } else {
        throw new Error(`${params.constructor.name} entity provided in ${type}. Please provide identifier instead.`);
      }
    }

    if (Array.isArray(params)) {
      return params.forEach((item: any) => this.validateParams(item, type), field);
    }

    if (Utils.isObject(params)) {
      Object.keys(params).forEach(k => {
        this.validateParams(params[k], type, k);
      });
    }
  }

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
