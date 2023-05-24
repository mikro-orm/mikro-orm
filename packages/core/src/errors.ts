import { inspect } from 'util';
import type { AnyEntity, Constructor, Dictionary, EntityMetadata, EntityProperty, IPrimaryKey } from './typings';

export class ValidationError<T extends AnyEntity = AnyEntity> extends Error {

  constructor(message: string, readonly entity?: T) {
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

  static fromWrongRepositoryType(entityName: string, repoType: string, method: string): ValidationError {
    const msg = `Trying to use EntityRepository.${method}() with '${entityName}' entity while the repository is of type '${repoType}'`;

    return new ValidationError(msg);
  }

  static fromCollectionNotInitialized(entity: AnyEntity, prop: EntityProperty): ValidationError {
    const entityName = entity.constructor.name;
    const msg = `${entityName}.${prop.name} is not initialized, define it as '${prop.name} = new Collection<${prop.type}>(this);'`;

    return new ValidationError(msg);
  }

  static fromMergeWithoutPK(meta: EntityMetadata): ValidationError {
    return new ValidationError(`You cannot merge entity '${meta.className}' without identifier!`);
  }

  static transactionRequired(): ValidationError {
    return new ValidationError('An open transaction is required for this operation');
  }

  static entityNotManaged(entity: AnyEntity): ValidationError {
    return new ValidationError(`Entity ${entity.constructor.name} is not managed. An entity is managed if its fetched from the database or registered as new through EntityManager.persist()`);
  }

  static notEntity(owner: AnyEntity, prop: EntityProperty, data: any): ValidationError {
    const type = Object.prototype.toString.call(data).match(/\[object (\w+)]/)![1].toLowerCase();
    return new ValidationError(`Entity of type ${prop.type} expected for property ${owner.constructor.name}.${prop.name}, ${inspect(data)} of type ${type} given. If you are using Object.assign(entity, data), use em.assign(entity, data) instead.`);
  }

  static notDiscoveredEntity(data: any, meta?: EntityMetadata, action = 'persist'): ValidationError {
    /* istanbul ignore next */
    const type = meta?.className ?? Object.prototype.toString.call(data).match(/\[object (\w+)]/)![1].toLowerCase();
    let err = `Trying to ${action} not discovered entity of type ${type}.`;

    /* istanbul ignore else */
    if (meta) {
      err += ` Entity with this name was discovered, but not the prototype you are passing to the ORM. If using EntitySchema, be sure to point to the implementation via \`class\`.`;
    }

    return new ValidationError(err);
  }

  static invalidPropertyName(entityName: string, invalid: string): ValidationError {
    return new ValidationError(`Entity '${entityName}' does not have property '${invalid}'`);
  }

  static invalidType(type: Constructor<any>, value: any, mode: string): ValidationError {
    const valueType = Object.prototype.toString.call(value).match(/\[object (\w+)]/)![1].toLowerCase();

    if (value instanceof Date) {
      value = value.toISOString();
    }

    return new ValidationError(`Could not convert ${mode} value '${value}' of type '${valueType}' to type ${type.name}`);
  }

  static propertyRequired(entity: AnyEntity, property: EntityProperty): ValidationError {
    const entityName = entity.__meta!.className;
    return new ValidationError(`Value for ${entityName}.${property.name} is required, '${entity[property.name]}' found\nentity: ${inspect(entity)}`, entity);
  }

  static cannotModifyInverseCollection(owner: AnyEntity, property: EntityProperty): ValidationError {
    const inverseCollection = `${owner.constructor.name}.${property.name}`;
    const ownerCollection = `${property.type}.${property.mappedBy}`;
    const error = `You cannot modify inverse side of M:N collection ${inverseCollection} when the owning side is not initialized. `
      + `Consider working with the owning side instead (${ownerCollection}).`;

    return new ValidationError(error, owner);
  }

  static cannotModifyReadonlyCollection(owner: AnyEntity, property: EntityProperty): ValidationError {
    return new ValidationError(`You cannot modify collection ${owner.constructor.name}.${property.name} as it is marked as readonly.`, owner);
  }

  static cannotRemoveFromCollectionWithoutOrphanRemoval(owner: AnyEntity, property: EntityProperty): ValidationError {
    const options = [
      ' - add `orphanRemoval: true` to the collection options',
      ' - add `onDelete: \'cascade\'` to the owning side options',
      ' - add `nullable: true` to the owning side options',
    ].join('\n');
    return new ValidationError(`Removing items from collection ${owner.constructor.name}.${property.name} without \`orphanRemoval: true\` would break non-null constraint on the owning side. You have several options: \n${options}`, owner);
  }

  static invalidCompositeIdentifier(meta: EntityMetadata): ValidationError {
    return new ValidationError(`Composite key required for entity ${meta.className}.`);
  }

  static cannotCommit(): ValidationError {
    return new ValidationError('You cannot call em.flush() from inside lifecycle hook handlers');
  }

  static cannotUseGlobalContext(): ValidationError {
    return new ValidationError('Using global EntityManager instance methods for context specific actions is disallowed. If you need to work with the global instance\'s identity map, use `allowGlobalContext` configuration option or `fork()` instead.');
  }

  static cannotUseOperatorsInsideEmbeddables(className: string, propName: string, payload: unknown): ValidationError {
    return new ValidationError(`Using operators inside embeddables is not allowed, move the operator above. (property: ${className}.${propName}, payload: ${inspect(payload)})`);
  }

  static invalidEmbeddableQuery(className: string, propName: string, embeddableType: string): ValidationError {
    return new ValidationError(`Invalid query for entity '${className}', property '${propName}' does not exist in embeddable '${embeddableType}'`);
  }

}

export class OptimisticLockError<T extends AnyEntity = AnyEntity> extends ValidationError<T> {

  static notVersioned(meta: EntityMetadata): OptimisticLockError {
    return new OptimisticLockError(`Cannot obtain optimistic lock on unversioned entity ${meta.className}`);
  }

  static lockFailed(entityOrName: AnyEntity | string): OptimisticLockError {
    const name = typeof entityOrName === 'string' ? entityOrName : entityOrName.constructor.name;
    const entity = typeof entityOrName === 'string' ? undefined : entityOrName;

    return new OptimisticLockError(`The optimistic lock on entity ${name} failed`, entity);
  }

  static lockFailedVersionMismatch(entity: AnyEntity, expectedLockVersion: number | Date, actualLockVersion: number | Date): OptimisticLockError {
    expectedLockVersion = expectedLockVersion instanceof Date ? expectedLockVersion.getTime() : expectedLockVersion;
    actualLockVersion = actualLockVersion instanceof Date ? actualLockVersion.getTime() : actualLockVersion;

    return new OptimisticLockError(`The optimistic lock failed, version ${expectedLockVersion} was expected, but is actually ${actualLockVersion}`, entity);
  }

}

export class MetadataError<T extends AnyEntity = AnyEntity> extends ValidationError<T> {

  static fromMissingPrimaryKey(meta: EntityMetadata): MetadataError {
    return new MetadataError(`${meta.className} entity is missing @PrimaryKey()`);
  }

  static fromWrongReference(meta: EntityMetadata, prop: EntityProperty, key: 'inversedBy' | 'mappedBy', owner?: EntityProperty): MetadataError {
    if (owner) {
      return MetadataError.fromMessage(meta, prop, `has wrong '${key}' reference type: ${owner.type} instead of ${meta.className}`);
    }

    return MetadataError.fromMessage(meta, prop, `has unknown '${key}' reference: ${prop.type}.${prop[key]}`);
  }

  static fromWrongTypeDefinition(meta: EntityMetadata, prop: EntityProperty): MetadataError {
    if (!prop.type) {
      return MetadataError.fromMessage(meta, prop, `is missing type definition`);
    }

    return MetadataError.fromMessage(meta, prop, `has unknown type: ${prop.type}`);
  }

  static fromWrongOwnership(meta: EntityMetadata, prop: EntityProperty, key: 'inversedBy' | 'mappedBy'): MetadataError {
    const type = key === 'inversedBy' ? 'owning' : 'inverse';
    const other = key === 'inversedBy' ? 'mappedBy' : 'inversedBy';

    return new MetadataError(`Both ${meta.className}.${prop.name} and ${prop.type}.${prop[key]} are defined as ${type} sides, use '${other}' on one of them`);
  }

  static fromWrongReferenceKind(meta: EntityMetadata, owner: EntityProperty, prop: EntityProperty): MetadataError {
    return new MetadataError(`${meta.className}.${prop.name} is of type ${prop.kind} which is incompatible with its owning side ${prop.type}.${owner.name} of type ${owner.kind}`);
  }

  static fromInversideSidePrimary(meta: EntityMetadata, owner: EntityProperty, prop: EntityProperty): MetadataError {
    return new MetadataError(`${meta.className}.${prop.name} cannot be primary key as it is defined as inverse side. Maybe you should swap the use of 'inversedBy' and 'mappedBy'.`);
  }

  /* istanbul ignore next */
  static entityNotFound(name: string, path: string): MetadataError {
    return new MetadataError(`Entity '${name}' not found in ${path}`);
  }

  static unknownIndexProperty(meta: EntityMetadata, prop: string, type: string): MetadataError {
    return new MetadataError(`Entity ${meta.className} has wrong ${type} definition: '${prop}' does not exist. You need to use property name, not column name.`);
  }

  static multipleVersionFields(meta: EntityMetadata, fields: string[]): MetadataError {
    return new MetadataError(`Entity ${meta.className} has multiple version properties defined: '${fields.join('\', \'')}'. Only one version property is allowed per entity.`);
  }

  static invalidVersionFieldType(meta: EntityMetadata): MetadataError {
    const prop = meta.properties[meta.versionProperty];
    return new MetadataError(`Version property ${meta.className}.${prop.name} has unsupported type '${prop.type}'. Only 'number' and 'Date' are allowed.`);
  }

  static fromUnknownEntity(className: string, source: string): MetadataError {
    return new MetadataError(`Entity '${className}' was not discovered, please make sure to provide it in 'entities' array when initializing the ORM (used in ${source})`);
  }

  static noEntityDiscovered(): MetadataError {
    return new MetadataError('No entities were discovered');
  }

  static onlyAbstractEntitiesDiscovered(): MetadataError {
    return new MetadataError('Only abstract entities were discovered, maybe you forgot to use @Entity() decorator?');
  }

  static duplicateEntityDiscovered(paths: string[], subject = 'entity names'): MetadataError {
    return new MetadataError(`Duplicate ${subject} are not allowed: ${paths.join(', ')}`);
  }

  static multipleDecorators(entityName: string, propertyName: string): MetadataError {
    return new MetadataError(`Multiple property decorators used on '${entityName}.${propertyName}' property`);
  }

  static missingMetadata(entity: string): MetadataError {
    return new MetadataError(`Metadata for entity ${entity} not found`);
  }

  static conflictingPropertyName(className: string, name: string, embeddedName: string): MetadataError {
    return new MetadataError(`Property ${className}:${name} is being overwritten by its child property ${embeddedName}:${name}. Consider using a prefix to overcome this issue.`);
  }

  static invalidPrimaryKey(meta: EntityMetadata, prop: EntityProperty, requiredName: string) {
    return this.fromMessage(meta, prop, `has wrong field name, '${requiredName}' is required in current driver`);
  }

  static invalidManyToManyWithPivotEntity(meta1: EntityMetadata, prop1: EntityProperty, meta2: EntityMetadata, prop2: EntityProperty) {
    const p1 = `${meta1.className}.${prop1.name}`;
    const p2 = `${meta2.className}.${prop2.name}`;
    return new MetadataError(`${p1} and ${p2} use the same 'pivotEntity', but don't form a bidirectional relation. Specify 'inversedBy' or 'mappedBy' to link them.`);
  }

  static targetIsAbstract(meta: EntityMetadata, prop: EntityProperty) {
    return this.fromMessage(meta, prop, `targets abstract entity ${prop.type}. Maybe you forgot to put @Entity() decorator on the ${prop.type} class?`);
  }

  static propertyTargetsEntityType(meta: EntityMetadata, prop: EntityProperty, target: EntityMetadata) {
    /* istanbul ignore next */
    const suggestion = target.embeddable ? 'Embedded' : 'ManyToOne';
    return this.fromMessage(meta, prop, `is defined as scalar @Property(), but its type is a discovered entity ${target.className}. Maybe you want to use @${suggestion}() decorator instead?`);
  }

  static fromMissingOption(meta: EntityMetadata, prop: EntityProperty, option: string) {
    return this.fromMessage(meta, prop, `is missing '${option}' option`);
  }

  private static fromMessage(meta: EntityMetadata, prop: EntityProperty, message: string): MetadataError {
    return new MetadataError(`${meta.className}.${prop.name} ${message}`);
  }

}

export class NotFoundError<T extends AnyEntity = AnyEntity> extends ValidationError<T> {

  static findOneFailed(name: string, where: Dictionary | IPrimaryKey): NotFoundError {
    return new NotFoundError(`${name} not found (${inspect(where)})`);
  }

  static findExactlyOneFailed(name: string, where: Dictionary | IPrimaryKey): NotFoundError {
    return new NotFoundError(`Wrong number of ${name} entities found for query ${inspect(where)}, expected exactly one`);
  }

}
