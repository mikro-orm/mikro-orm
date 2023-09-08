import type { EntityData, EntityMetadata } from '../typings';
import type { UpsertOptions } from '../drivers/IDatabaseDriver';

/** @internal */
export function getOnConflictFields<T>(data: EntityData<T>, uniqueFields: (keyof T)[], options: UpsertOptions<T>): (keyof T)[] {
  if (options.onConflictMergeFields) {
    return options.onConflictMergeFields;
  }

  const keys = Object.keys(data).filter(f => !uniqueFields.includes(f as keyof T)) as (keyof T)[];

  if (options.onConflictExcludeFields) {
    return keys.filter(f => !options.onConflictExcludeFields!.includes(f));
  }

  return keys;
}

/** @internal */
export function getOnConflictReturningFields<T>(meta: EntityMetadata<T> | undefined, data: EntityData<T>, uniqueFields: (keyof T)[], options: UpsertOptions<T>): (keyof T)[] | '*' {
  if (!meta) {
    return '*';
  }

  const keys = meta.comparableProps.filter(p => !p.lazy && !p.embeddable && !uniqueFields.includes(p.name)).map(p => p.name) as (keyof T)[];

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
