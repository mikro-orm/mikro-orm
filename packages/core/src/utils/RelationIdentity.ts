import type { AnyEntity, Dictionary, EntityClass, EntityProperty, Primary } from '../typings.js';
import type { EntityManager } from '../EntityManager.js';
import { Reference } from '../entity/Reference.js';
import { helper } from '../entity/wrap.js';
import { Utils } from './Utils.js';

/** Serialized map key for an entity, using `targetKey` when set instead of the primary key. */
export function getEntityIdentityKey(entity: AnyEntity, targetKey?: string): string {
  if (targetKey) {
    return '' + (entity as Dictionary)[targetKey];
  }

  return helper(entity).getSerializedPrimaryKey();
}

/**
 * FK / filter value for the owner side of an inverse collection (`OneToMany` / non-owning `ManyToMany`).
 * When `composite` is true, composite PK owners use `{ $in: primaryKeys }` (e.g. count queries).
 */
export function getInverseCollectionOwnerValue(
  owner: AnyEntity,
  ownerProp?: Pick<EntityProperty, 'targetKey'>,
  composite = false,
): unknown {
  if (ownerProp?.targetKey) {
    return (owner as Dictionary)[ownerProp.targetKey];
  }

  const wrapped = helper(owner);

  if (composite && wrapped.__meta.compositePK) {
    return { $in: wrapped.__primaryKeys };
  }

  return wrapped.getPrimaryKey();
}

/**
 * Map key for wiring loaded `OneToMany` children to their parent, from the child's owning FK (`mappedBy`).
 */
export function getOneToManyChildOwnerKey(
  child: AnyEntity,
  prop: Pick<EntityProperty, 'mappedBy'>,
  ownerProp: EntityProperty,
  targetClass: EntityClass<AnyEntity>,
  em: EntityManager,
): string | undefined {
  const fk = child.__helper.__data[prop.mappedBy] ?? child[prop.mappedBy];

  if (!fk) {
    return undefined;
  }

  return getRelationFkIdentityKey(fk, ownerProp, targetClass, em);
}

function getRelationFkIdentityKey(
  fk: unknown,
  ownerProp: EntityProperty,
  targetClass: EntityClass<AnyEntity>,
  em: EntityManager,
): string {
  const targetKey = ownerProp.targetKey;

  if (targetKey) {
    if (ownerProp.mapToPk) {
      return helper(em.getReference(targetClass, fk as Primary)).getSerializedPrimaryKey();
    }

    const ref = Reference.isReference(fk) ? fk.unwrap() : fk;

    if (Utils.isEntity(ref)) {
      return getEntityIdentityKey(ref, targetKey);
    }

    return '' + fk;
  }

  const entity = ownerProp.mapToPk ? em.getReference(targetClass, fk as Primary) : (fk as AnyEntity);

  return helper(entity).getSerializedPrimaryKey();
}
