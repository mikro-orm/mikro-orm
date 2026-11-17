import type { EntityMetadata, EntityProperty } from '../typings.js';
import { ReferenceKind } from '../enums.js';

/** Whether a property is serialized by default, i.e. it is not hidden and not `_` prefixed (unless it is a PK). */
export function isPropertyVisible<Entity>(prop: EntityProperty<Entity>): boolean {
  const prefixed = !prop.primary && !prop.accessor && prop.name.startsWith('_'); // ignore prefixed properties, if it's not a PK
  return !prop.hidden && !prefixed;
}

export interface PlanEntry<Entity> {
  prop: EntityProperty<Entity>;
  visible: boolean;
  key: string;
  /** scalar without getter, accessor or serializer, so a primitive or `Date` value can skip the relation and embeddable checks */
  scalar: boolean;
}

/** Per-entity-type part of the serialization that does not depend on the entity instance or the serialization options. */
export interface SerializationPlan<Entity> {
  /** `meta.props` the plan was built from, `meta.sync()` replaces it */
  source: EntityProperty<Entity>[];
  pks: PlanEntry<Entity>[];
  rest: PlanEntry<Entity>[];
  visible: Set<string>;
}

const plans = new WeakMap<EntityMetadata<any>, SerializationPlan<any>>();

export function getPlan<Entity>(meta: EntityMetadata<Entity>): SerializationPlan<Entity> {
  const cached = plans.get(meta);

  if (cached?.source === meta.props) {
    return cached;
  }

  const pkNames = meta.serializedPrimaryKey && !meta.compositePK ? [meta.serializedPrimaryKey] : meta.primaryKeys;
  const entry = (prop: EntityProperty<Entity>): PlanEntry<Entity> => ({
    prop,
    visible: isPropertyVisible(prop),
    key: prop.serializedName || (prop.primary && meta.serializedPrimaryKey ? meta.serializedPrimaryKey : prop.name),
    scalar: prop.kind === ReferenceKind.SCALAR && !prop.serializer && !prop.getter && !prop.accessor,
  });
  const plan: SerializationPlan<Entity> = {
    source: meta.props,
    pks: pkNames.filter(pk => meta.properties[pk]).map(pk => entry(meta.properties[pk])),
    rest: meta.props.filter(prop => !pkNames.includes(prop.name)).map(entry),
    visible: new Set(meta.props.filter(prop => isPropertyVisible(prop)).map(prop => prop.name)),
  };
  plans.set(meta, plan);

  return plan;
}

export function isPlainValue(value: unknown): boolean {
  return value == null || (typeof value !== 'object' && typeof value !== 'function') || value instanceof Date;
}
