import type { EntityMetadata, EntityProperty, IPrimaryKey, Primary } from '../typings.js';
import type { Platform } from '../platforms/Platform.js';
import { ReferenceKind } from '../enums.js';
import { Utils } from '../utils/Utils.js';

/** `_` prefixed properties are not serialized, unless it is a PK or an accessor. */
export function isPrefixed<Entity>(prop: EntityProperty<Entity>): boolean {
  return !prop.primary && !prop.accessor && prop.name.startsWith('_');
}

/** Whether a property is serialized by default, i.e. it is not hidden and not `_` prefixed. */
export function isPropertyVisible<Entity>(prop: EntityProperty<Entity>): boolean {
  return !prop.hidden && !isPrefixed(prop);
}

/** Output key of a property, its `serializedName` or the serialized PK name. */
export function getPropertyKey<Entity>(meta: EntityMetadata<Entity>, prop: EntityProperty<Entity>): string {
  return prop.serializedName || (prop.primary && meta.serializedPrimaryKey ? meta.serializedPrimaryKey : prop.name);
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
    key: getPropertyKey(meta, prop),
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

/** Converts a custom type value via `toJSON()`, or to its database value with `convertCustomTypes`. */
export function convertCustomType<Entity, V>(
  prop: EntityProperty<Entity>,
  value: V,
  platform: Platform,
  convertCustomTypes?: boolean,
): V {
  if (!prop.customType) {
    return value;
  }

  if (convertCustomTypes) {
    return prop.customType.convertToDatabaseValue(value, platform, { mode: 'serialization' });
  }

  return prop.customType.toJSON(value, platform);
}

/** Serializes the PK of a reference that is not expanded, a composite one is pruned to its `visible` properties. */
export function referencePrimaryKey<Entity>(
  meta: EntityMetadata<Entity>,
  pk: Primary<Entity>,
  visible: string[],
  platform: Platform,
  forceObject?: boolean,
): unknown {
  if (forceObject) {
    return Utils.primaryKeyToObject(meta, pk, visible as any);
  }

  if (Utils.isPlainObject(pk)) {
    const pruned = Utils.primaryKeyToObject(meta, pk, visible as any);

    if (visible.length === 1) {
      return platform.normalizePrimaryKey(pruned[visible[0] as keyof typeof pruned] as IPrimaryKey);
    }

    return pruned;
  }

  return platform.normalizePrimaryKey(pk as IPrimaryKey);
}
