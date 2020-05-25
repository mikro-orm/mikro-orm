import { inspect } from 'util';
import { Dictionary, EntityMetadata, EntityProperty, AnyEntity, IPrimaryKey, Constructor } from '../typings';
import { Utils } from './Utils';
import { Type } from '../types';

export class ValidationError<T extends AnyEntity = AnyEntity> extends Error {

  constructor(message: string, private readonly entity?: T) {
    super(message);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = message;
  }

  /**
   * Gets instance of entity that caused this error.
   */
  getEntity(): AnyEntity | undefined {
    return this.entity;
  }

  static fromWrongPropertyType(entity: AnyEntity, property: string, expectedType: string, givenType: string, givenValue: string): ValidationError {
    const entityName = entity.constructor.name;
    const msg = `Trying to set ${entityName}.${property} of type '${expectedType}' to '${givenValue}' of type '${givenType}'`;

    return new ValidationError(msg);
  }

  static fromCollectionNotInitialized(entity: AnyEntity, prop: EntityProperty): ValidationError {
    const entityName = entity.constructor.name;
    const msg = `${entityName}.${prop.name} is not initialized, define it as '${prop.name} = new Collection<${prop.type}>(this);'`;

    return new ValidationError(msg);
  }

  static fromMissingPrimaryKey(meta: EntityMetadata): ValidationError {
    return new ValidationError(`${meta.className} entity is missing @PrimaryKey()`);
  }

  static fromWrongReference(meta: EntityMetadata, prop: EntityProperty, key: keyof EntityProperty, owner?: EntityProperty): ValidationError {
    if (owner) {
      return ValidationError.fromMessage(meta, prop, `has wrong '${key}' reference type: ${owner.type} instead of ${meta.className}`);
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

    return new ValidationError(`Both ${meta.className}.${prop.name} and ${prop.type}.${prop[key]} are defined as ${type} sides, use '${other}' on one of them`);
  }

  static fromMergeWithoutPK(meta: EntityMetadata): void {
    throw new ValidationError(`You cannot merge entity '${meta.className}' without identifier!`);
  }

  static fromUnknownEntity(className: string, source: string): ValidationError {
    return new ValidationError(`Entity '${className}' was not discovered, please make sure to provide it in 'entities' array when initializing the ORM (used in ${source})`);
  }

  static fromUnknownBaseEntity(meta: EntityMetadata): ValidationError {
    return new ValidationError(`Entity '${meta.className}' extends unknown base entity '${meta.extends}', please make sure to provide it in 'entities' array when initializing the ORM`);
  }

  static transactionRequired(): ValidationError {
    return new ValidationError('An open transaction is required for this operation');
  }

  static entityNotManaged(entity: AnyEntity): ValidationError {
    return new ValidationError(`Entity ${entity.constructor.name} is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()`);
  }

  static notEntity(owner: AnyEntity, prop: EntityProperty, data: any): ValidationError {
    return new ValidationError(`Entity of type ${prop.type} expected for property ${owner.constructor.name}.${prop.name}, ${inspect(data)} of type ${Utils.getObjectType(data)} given. If you are using Object.assign(entity, data), use wrap(entity).assign(data, { em }) instead.`);
  }

  static notVersioned(meta: EntityMetadata): ValidationError {
    return new ValidationError(`Cannot obtain optimistic lock on unversioned entity ${meta.className}`);
  }

  static multipleVersionFields(meta: EntityMetadata, fields: string[]): ValidationError {
    return new ValidationError(`Entity ${meta.className} has multiple version properties defined: '${fields.join('\', \'')}'. Only one version property is allowed per entity.`);
  }

  static invalidVersionFieldType(meta: EntityMetadata): ValidationError {
    const prop = meta.properties[meta.versionProperty];
    return new ValidationError(`Version property ${meta.className}.${prop.name} has unsupported type '${prop.type}'. Only 'number' and 'Date' are allowed.`);
  }

  static lockFailed(entityOrName: AnyEntity | string): ValidationError {
    const name = Utils.isString(entityOrName) ? entityOrName : entityOrName.constructor.name;
    const entity = Utils.isString(entityOrName) ? undefined : entityOrName;

    return new ValidationError(`The optimistic lock on entity ${name} failed`, entity);
  }

  static lockFailedVersionMismatch(entity: AnyEntity, expectedLockVersion: number | Date, actualLockVersion: number | Date): ValidationError {
    expectedLockVersion = expectedLockVersion instanceof Date ? expectedLockVersion.getTime() : expectedLockVersion;
    actualLockVersion = actualLockVersion instanceof Date ? actualLockVersion.getTime() : actualLockVersion;

    return new ValidationError(`The optimistic lock failed, version ${expectedLockVersion} was expected, but is actually ${actualLockVersion}`, entity);
  }

  static noEntityDiscovered(): ValidationError {
    return new ValidationError('No entities were discovered');
  }

  static onlyAbstractEntitiesDiscovered(): ValidationError {
    return new ValidationError('Only abstract entities were discovered, maybe you forgot to use @Entity() decorator?');
  }

  static duplicateEntityDiscovered(paths: string[]): ValidationError {
    return new ValidationError(`Duplicate entity names are not allowed: ${paths.join(', ')}`);
  }

  static entityNotFound(name: string, path: string): ValidationError {
    return new ValidationError(`Entity '${name}' not found in ${path}`);
  }

  static findOneFailed(name: string, where: Dictionary | IPrimaryKey): ValidationError {
    return new ValidationError(`${name} not found (${inspect(where)})`);
  }

  static missingMetadata(entity: string): ValidationError {
    return new ValidationError(`Metadata for entity ${entity} not found`);
  }

  static invalidPropertyName(entityName: string, invalid: string): ValidationError {
    return new ValidationError(`Entity '${entityName}' does not have property '${invalid}'`);
  }

  static multipleDecorators(entityName: string, propertyName: string): ValidationError {
    return new ValidationError(`Multiple property decorators used on '${entityName}.${propertyName}' property`);
  }

  static invalidType(type: Constructor<Type<any>>, value: any, mode: string): ValidationError {
    const valueType = Utils.getObjectType(value);

    if (value instanceof Date) {
      value = value.toISOString();
    }

    return new ValidationError(`Could not convert ${mode} value '${value}' of type '${valueType}' to type ${type.name}`);
  }

  static cannotModifyInverseCollection(owner: AnyEntity, property: EntityProperty): ValidationError {
    const inverseCollection = `${owner.constructor.name}.${property.name}`;
    const ownerCollection = `${property.type}.${property.mappedBy}`;
    const error = `You cannot modify inverse side of M:N collection ${inverseCollection} when the owning side is not initialized. `
      + `Consider working with the owning side instead (${ownerCollection}).`;

    return new ValidationError(error, owner);
  }

  static invalidCompositeIdentifier(meta: EntityMetadata): ValidationError {
    return new ValidationError(`Composite key required for entity ${meta.className}.`);
  }

  static cannotCommit(): ValidationError {
    return new ValidationError('You cannot call em.flush() from inside lifecycle hook handlers');
  }

  static cannotUseOperatorsInsideEmbeddables(className: string, propName: string, payload: Dictionary): ValidationError {
    return new ValidationError(`Using operators inside embeddables is not allowed, move the operator above. (property: ${className}.${propName}, payload: ${inspect(payload)})`);
  }

  private static fromMessage(meta: EntityMetadata, prop: EntityProperty, message: string): ValidationError {
    return new ValidationError(`${meta.className}.${prop.name} ${message}`);
  }

}
