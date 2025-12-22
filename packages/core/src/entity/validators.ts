import type { Dictionary, EntityData, EntityMetadata, EntityProperty, FilterQuery } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import { ValidationError } from '../errors.js';
import { isRaw, RawQueryFragment } from '../utils/RawQueryFragment.js';
import { SCALAR_TYPES } from '../enums.js';

/** @internal */
export function validateProperty<T extends object>(prop: EntityProperty, givenValue: any, entity: T): void {
  if (givenValue == null || isRaw(givenValue)) {
    return;
  }

  const expectedType = prop.runtimeType;
  const propName = prop.embedded ? prop.name.replace(/~/g, '.') : prop.name;
  const givenType = Utils.getObjectType(givenValue);

  if (prop.enum && prop.items) {
    /* v8 ignore next */
    if (!prop.items.some(it => it === givenValue)) {
      throw ValidationError.fromWrongPropertyType(entity, propName, expectedType, givenType, givenValue);
    }
  } else {
    if (givenType !== expectedType && SCALAR_TYPES.has(expectedType)) {
      throw ValidationError.fromWrongPropertyType(entity, propName, expectedType, givenType, givenValue);
    }
  }
}

function getValue(o: Dictionary, prop: EntityProperty) {
  if (prop.embedded && prop.embedded[0] in o) {
    return o[prop.embedded[0]]?.[prop.embedded[1]];
  }

  /* v8 ignore next */
  if (prop.ref) {
    return o[prop.name]?.unwrap();
  }

  return o[prop.name];
}

/** @internal */
export function validateEntity<T extends object>(entity: T, meta: EntityMetadata<T>): void {
  for (const prop of meta.validateProps) {
    validateProperty(prop, getValue(entity, prop), entity);
  }
}

/** @internal */
export function validateParams(params: any, type = 'search condition', field?: string): void {
  if (Utils.isPrimaryKey(params) || Utils.isEntity(params)) {
    return;
  }

  if (Array.isArray(params)) {
    return params.forEach(item => validateParams(item, type, field));
  }

  if (Utils.isPlainObject(params)) {
    Object.keys(params).forEach(k => validateParams(params[k], type, k));
  }
}

/** @internal */
export function validatePrimaryKey<T>(entity: EntityData<T>, meta: EntityMetadata<T>): void {
  const pkExists = meta.primaryKeys.every(pk => entity[pk] != null) || (meta.serializedPrimaryKey && entity[meta.serializedPrimaryKey] != null);

  if (!entity || !pkExists) {
    throw ValidationError.fromMergeWithoutPK(meta);
  }
}

/** @internal */
export function validateEmptyWhere<T>(where: FilterQuery<T>): void {
  if (Utils.isEmpty(where) && !RawQueryFragment.hasObjectFragments(where)) {
    throw new Error(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
  }
}
