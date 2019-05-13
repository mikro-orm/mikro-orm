import { EntityMetadata, EntityProperty, IEntity } from '../decorators';

export class ValidationError extends Error {

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = message;
  }

  static fromWrongPropertyType(entity: IEntity, property: string, expectedType: string, givenType: string, givenValue: string): ValidationError {
    const entityName = entity.constructor.name;
    const msg = `Trying to set ${entityName}.${property} of type '${expectedType}' to '${givenValue}' of type '${givenType}'`;

    return new ValidationError(msg);
  }

  static fromCollectionNotInitialized(entity: IEntity, prop: EntityProperty): ValidationError {
    const entityName = entity.constructor.name;
    const msg = `${entityName}.${prop.name} is not initialized, define it as '${prop.name} = new Collection<${prop.type}>(this);'`;

    return new ValidationError(msg);
  }

  static fromMissingPrimaryKey(meta: EntityMetadata): ValidationError {
    return new ValidationError(`${meta.name} entity is missing @PrimaryKey()`);
  }

  static fromWrongReference(meta: EntityMetadata, prop: EntityProperty, key: keyof EntityProperty, owner?: EntityProperty): ValidationError {
    if (owner) {
      return ValidationError.fromMessage(meta, prop, `has wrong '${key}' reference type: ${owner.type} instead of ${meta.name}`);
    }

    return ValidationError.fromMessage(meta, prop, `has unknown '${key}' reference: ${prop.type}.${prop[key]}`);
  }

  static fromWrongTypeDefinition(meta: EntityMetadata, prop: EntityProperty): ValidationError {
    if (!prop.type) {
      return ValidationError.fromMessage(meta, prop, `is missing type definition`);
    }

    return ValidationError.fromMessage(meta, prop, `has unknown type: ${prop.type}`);
  }

  static fromWrongOwnership(meta: EntityMetadata, prop: EntityProperty, key: keyof EntityProperty): ValidationError {
    const type = key === 'inversedBy' ? 'owning' : 'inverse';
    const other = key === 'inversedBy' ? 'mappedBy' : 'inversedBy';

    return new ValidationError(`Both ${meta.name}.${prop.name} and ${prop.type}.${prop[key]} are defined as ${type} sides, use ${other} on one of them`);
  }

  static fromMissingOwnership(meta: EntityMetadata, prop: EntityProperty): ValidationError {
    return ValidationError.fromMessage(meta, prop, `needs to have one of 'owner', 'mappedBy' or 'inversedBy' attributes`);
  }

  static fromMergeWithoutPK(meta: EntityMetadata): void {
    throw new Error(`You cannot merge entity '${meta.name}' without identifier!`);
  }

  static fromUnknownBaseEntity(meta: EntityMetadata): ValidationError {
    return new Error(`Entity '${meta.name}' extends unknown base entity '${meta.extends}', please make sure to provide it in 'entities' array when initializing the ORM`);
  }

  private static fromMessage(meta: EntityMetadata, prop: EntityProperty, message: string): ValidationError {
    return new ValidationError(`${meta.name}.${prop.name} ${message}`);
  }

}
