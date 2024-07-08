import type { EntityData, EntityKey, EntityMetadata } from '../typings';
import type { UpsertOptions } from '../drivers/IDatabaseDriver';
import type { RawQueryFragment } from '../utils/RawQueryFragment';

/** @internal */
export function getOnConflictFields<T>(meta: EntityMetadata<T> | undefined, data: EntityData<T>, uniqueFields: (keyof T)[] | RawQueryFragment, options: UpsertOptions<T>): (keyof T)[] {
  if (options.onConflictMergeFields) {
    return options.onConflictMergeFields;
  }

  const keys = Object.keys(data).filter(f => {
    return Array.isArray(uniqueFields) && !uniqueFields.includes(f as keyof T) && !meta?.properties[f as EntityKey<T>]?.embeddable;
  }) as (keyof T)[];

  if (options.onConflictExcludeFields) {
    return keys.filter(f => !options.onConflictExcludeFields!.includes(f));
  }

  return keys;
}

/** @internal */
export function getOnConflictReturningFields<T>(meta: EntityMetadata<T> | undefined, data: EntityData<T>, uniqueFields: (keyof T)[] | RawQueryFragment, options: UpsertOptions<T>): (keyof T)[] | '*' {
  if (!meta) {
    return '*';
  }

  const keys = meta.comparableProps.filter(p => !p.lazy && !p.embeddable && Array.isArray(uniqueFields) && !uniqueFields.includes(p.name)).map(p => p.name) as (keyof T)[];

  if (meta.versionProperty) {
    keys.push(meta.versionProperty);
  }

  if (options.onConflictAction === 'ignore') {
    return keys;
  }

  if (options.onConflictMergeFields) {
    return keys.filter(key => !options.onConflictMergeFields!.includes(key));
  }

  if (options.onConflictExcludeFields) {
    return [...new Set(keys.concat(...options.onConflictExcludeFields))];
  }

  return keys.filter(key => !(key in data));
}
