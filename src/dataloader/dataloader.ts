import {EntityMetadata} from '@mikro-orm/core';
import {
  AnyEntity,
  Reference,
  Primary,
  Collection,
  EntityRepository,
  PrimaryProperty,
} from '@mikro-orm/core';
import {IWrappedEntityInternal} from '@mikro-orm/core/dist/typings';

function objectsHaveSameKeys<T>(
  ...objects: Record<string, Primary<T> | Primary<T>[]>[]
): boolean {
  const allKeys = new Set(
    objects.reduce(
      (keys, object) => keys.concat(Object.keys(object)),
      [] as string[]
    )
  );
  return objects.every(object => allKeys.size === Object.keys(object).length);
}

export function ensureIsArray<T>(
  colOrArrOrAny: T | T[] | Collection<T, AnyEntity<T>>
): T[] {
  return colOrArrOrAny instanceof Collection
    ? colOrArrOrAny.getItems()
    : Array.isArray(colOrArrOrAny)
    ? colOrArrOrAny
    : [colOrArrOrAny];
}

export type RepoFind<K> = {
  repo: EntityRepository<K>;
  filter: Record<string, Primary<K> | Primary<K>[]>;
  many: boolean;
};

export function getEntityMetadataClassName<T extends AnyEntity<T>>(
  meta?: EntityMetadata<T>
): string {
  if (!meta) {
    throw new Error('Cannot find entity metadata');
  }
  return meta.className;
}

export function getRefClassName<T extends AnyEntity<T>>(
  ref: Reference<T>
): string {
  return getEntityMetadataClassName((ref['entity'] as T).__meta);
}

export function getHelperPk<T extends AnyEntity<T>>(
  helper?: IWrappedEntityInternal<T>
): Primary<T> {
  if (!helper) {
    throw new Error('Cannot find entity helper');
  }
  if (helper.__primaryKeys.length !== 1) {
    throw new Error('Composite PKs not yet supported');
  }
  return helper.__primaryKeys[0];
}

export function getRefPk<T extends AnyEntity<T>>(
  ref: Reference<T>
): Primary<T> {
  return getHelperPk((ref['entity'] as T).__helper);
}

export function groupPrimaryKeysByEntity<T extends AnyEntity<T>>(
  refs: readonly Reference<T>[]
) {
  return refs.reduce((acc, cur) => {
    const className = getRefClassName(cur);
    const primaryKeys: Primary<T>[] = acc[className];
    const primaryKey: Primary<T> = getRefPk(cur);
    acc[className] = primaryKeys
      ? [...new Set([...primaryKeys, primaryKey])]
      : [primaryKey];
    return acc;
  }, {} as Record<string, Primary<T>[]>);
}

export function groupInversedOrMappedKeysByEntity<T extends AnyEntity<T>>(
  collections: readonly Collection<T, AnyEntity>[]
): Record<string, Record<string, Primary<T>[]>> {
  return collections.reduce((acc, cur) => {
    const className = cur.property.type;
    const record = acc[className] || (acc[className] = {});
    // Many to Many vs One to Many
    const inversedOrMappedBy = cur.property.inversedBy
      ? 'inversedBy'
      : cur.property.mappedBy
      ? 'mappedBy'
      : undefined;
    if (!inversedOrMappedBy) {
      throw new Error(
        'Cannot find inversedBy or mappedBy prop: did you forget to set the inverse side of a many-to-many relationship?'
      );
    }
    const key: Primary<T> = getHelperPk(cur.owner.__helper);
    const keys: Primary<T>[] = record[cur.property[inversedOrMappedBy]];
    record[cur.property[inversedOrMappedBy]] = keys
      ? [...new Set([...keys, key])]
      : [key];
    return acc;
  }, {} as Record<string, Record<string, Primary<T>[]>>);
}

export function groupFindQueries<T extends AnyEntity<T>>(
  repoFinds: readonly RepoFind<T>[]
) {
  return repoFinds.reduce((acc, {repo, filter}) => {
    const entityName = repo['entityName'] as string;
    if (acc[entityName]) {
      let matchFound = false;
      const curFilters = acc[entityName].map(el => ({...el}));
      for (const curFilter of curFilters) {
        if (objectsHaveSameKeys(curFilter, filter)) {
          matchFound = true;
          Object.entries(filter).forEach(([prop, idOrIds]) => {
            const curIdOrIds = curFilter[prop];
            if (
              Array.isArray(curIdOrIds) ||
              Array.isArray(idOrIds) ||
              (curIdOrIds && curIdOrIds !== idOrIds)
            ) {
              curFilter[prop] = [
                ...new Set([
                  ...ensureIsArray(curIdOrIds ?? []),
                  ...ensureIsArray(idOrIds),
                ]),
              ];
            } else {
              curFilter[prop] = idOrIds;
            }
          });
          break;
        }
      }
      if (matchFound) {
        acc[entityName] = [...curFilters];
      } else {
        acc[entityName] = [...curFilters, filter];
      }
    } else {
      acc[entityName] = [filter];
    }
    return acc;
  }, {} as Record<string, Record<string, Primary<T> | Primary<T>[]>[]>);
}

export type Result<K> = {
  entityName: string;
  keys: string[];
  entitiesOrError: K[] | Error;
};

export function arrayAreEqual<T extends Primary<unknown>[] | string[]>(
  a: T,
  b: T
): boolean {
  return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
}

export function arrayIncludes<T>(
  arr: Array<Primary<T>>,
  target: Array<Primary<T>>,
  type: 'every' | 'any'
): boolean {
  return !!target[type === 'every' ? 'every' : 'find'](v => arr.includes(v));
}

export function hasRef<T extends AnyEntity<T>>(
  entity: T
): T & Record<string, Reference<T>> {
  return entity as T & Record<string, Reference<T>>;
}

export function hasCol<T extends AnyEntity<T>, K>(
  entity: T
): T & Record<string, Collection<T, K>> {
  return entity as T & Record<string, Collection<T, K>>;
}

export interface IWrappedEntityInternalWithEntity<
  T,
  PK extends keyof T | unknown = PrimaryProperty<T>,
  P = keyof T
> extends IWrappedEntityInternal<T, PK, P> {
  entity: T;
}

export function hasRefOrCol<T extends AnyEntity<T>, K>(
  entity: T
): T & Record<string, Reference<T> | Collection<T, K>> {
  return entity as T & Record<string, Reference<T> | Collection<T, K>>;
}

export function isRef<T extends AnyEntity<T>, K>(
  refOrCol: Reference<T> | Collection<T, K>
): refOrCol is Reference<T> {
  return !(refOrCol instanceof Collection);
}

export function isCol<T extends AnyEntity<T>, K>(
  refOrCol: Reference<T> | Collection<T, K>
): refOrCol is Collection<T, K> {
  return refOrCol instanceof Collection;
}
