import type { Dictionary, EntityData, EntityKey, EntityMetadata, EntityProperty, FilterQuery } from '../typings.js';
import type { UpsertOptions } from '../drivers/IDatabaseDriver.js';
import { isRaw, type RawQueryFragment } from '../utils/RawQueryFragment.js';
import { Utils } from './Utils.js';

function expandEmbeddedProperties<T>(prop: EntityProperty<T>, key?: string): (keyof T)[] {
  if (prop.object) {
    return [prop.name];
  }

  return Object.values(prop.embeddedProps).flatMap(p => {
    /* v8 ignore next 3 */
    if (p.embeddable && !p.object) {
      return expandEmbeddedProperties<T>(p);
    }

    return [p.name as keyof T];
  });
}

/**
 * Expands dot paths and stars
 */
function expandFields<T>(meta: EntityMetadata<T> | undefined, fields: (keyof T)[]): (keyof T)[] {
  return fields.flatMap(f => {
    if (f === '*' && meta) {
      return meta.comparableProps.filter(p => !p.lazy && !p.embeddable).map(p => p.name) as (keyof T)[];
    }

    if ((f as string).includes('.')) {
      const [k, ...tmp] = (f as string).split('.');
      const rest = tmp.join('.');
      const prop = meta?.properties[k as EntityKey<T>];

      if (prop?.embeddable) {
        if (rest === '*') {
          return expandEmbeddedProperties(prop);
        }

        return expandEmbeddedProperties(prop, rest);
      }
    }

    const prop = meta?.properties[f as EntityKey<T>];

    if (prop?.embeddable) {
      return expandEmbeddedProperties(prop);
    }

    return [f];
  });
}

/** @internal */
export function getOnConflictFields<T>(meta: EntityMetadata<T> | undefined, data: EntityData<T>, uniqueFields: (keyof T)[] | RawQueryFragment, options: UpsertOptions<T>): (keyof T)[] {
  if (options.onConflictMergeFields) {
    const onConflictMergeFields = expandFields(meta, options.onConflictMergeFields);
    return onConflictMergeFields.flatMap(f => {
      const prop = meta?.properties[f as EntityKey<T>];

      /* v8 ignore next 3 */
      if (prop?.embeddable && !prop.object) {
        return Object.values(prop.embeddedProps).map(p => p.name as keyof T);
      }

      return f;
    }) as (keyof T)[];
  }

  const keys = Object.keys(data).flatMap(f => {
    if (!(Array.isArray(uniqueFields) && !uniqueFields.includes(f as keyof T))) {
      return [];
    }

    const prop = meta?.properties[f as EntityKey<T>];

    if (prop?.embeddable && !prop.object) {
      return expandEmbeddedProperties<T>(prop);
    }

    return [f as keyof T];
  }) as (keyof T)[];

  if (options.onConflictExcludeFields) {
    const onConflictExcludeFields = expandFields(meta, options.onConflictExcludeFields);
    return keys.filter(f => !onConflictExcludeFields!.includes(f));
  }

  return keys;
}

/** @internal */
export function getOnConflictReturningFields<T, P extends string>(meta: EntityMetadata<T> | undefined, data: EntityData<T>, uniqueFields: (keyof T)[] | RawQueryFragment, options: UpsertOptions<T, P>): (keyof T)[] | '*' {
  /* v8 ignore next 3 */
  if (!meta) {
    return '*';
  }

  const keys = meta.comparableProps.filter(p => {
    if (p.lazy || p.embeddable) {
      return false;
    }

    if (p.autoincrement) {
      return true;
    }

    return Array.isArray(uniqueFields) && !uniqueFields.includes(p.name);
  }).map(p => p.name) as (keyof T)[];

  if (meta.versionProperty) {
    keys.push(meta.versionProperty);
  }

  if (options.onConflictAction === 'ignore') {
    return keys;
  }

  if (options.onConflictMergeFields) {
    const onConflictMergeFields = expandFields(meta, options.onConflictMergeFields as (keyof T)[]);
    return keys.filter(key => !onConflictMergeFields!.includes(key as never));
  }

  if (options.onConflictExcludeFields) {
    const onConflictExcludeFields = expandFields(meta, options.onConflictExcludeFields as (keyof T)[]);
    return [...new Set(keys.concat(...onConflictExcludeFields))];
  }

  return keys.filter(key => !(key in data));
}

function getPropertyValue(obj: Dictionary, key: string) {
  if (key.indexOf('.') === -1) {
    return obj[key];
  }

  const parts = key.split('.');
  let curr = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    curr[parts[i]] ??= {};
    curr = curr[parts[i]];
  }

  return curr[parts[parts.length - 1]];
}

/** @internal */
export function getWhereCondition<T extends object>(
  meta: EntityMetadata<T>, onConflictFields: (keyof T)[] | RawQueryFragment | undefined,
  data: EntityData<T>,
  where: FilterQuery<T>,
): { where: FilterQuery<T>; propIndex: number | false } {
  const unique = onConflictFields as string[] ?? meta.props.filter(p => p.unique).map(p => p.name);
  const propIndex = !isRaw(unique) && unique.findIndex(p => (data as Dictionary)[p] ?? (data as Dictionary)[p.substring(0, p.indexOf('.'))] != null);

  if (onConflictFields || where == null) {
    if (propIndex !== false && propIndex >= 0) {
      let key = unique[propIndex];

      if (key.includes('.')) {
        const prop = meta.properties[key.substring(0, key.indexOf('.')) as EntityKey<T>];

        if (prop) {
          key = `${prop.fieldNames[0]}${key.substring(key.indexOf('.'))}`;
        }
      }

      where = { [key]: getPropertyValue(data as Dictionary, unique[propIndex]) } as FilterQuery<T>;
    } else if (meta.uniques.length > 0) {
      for (const u of meta.uniques) {
        if (Utils.asArray<EntityKey<T>>(u.properties).every(p => data![p] != null)) {
          where = Utils.asArray<EntityKey<T>>(u.properties).reduce((o, key) => {
            o[key] = data![key];
            return o;
          }, {} as any);
          break;
        }
      }
    }
  }

  return { where, propIndex };
}
