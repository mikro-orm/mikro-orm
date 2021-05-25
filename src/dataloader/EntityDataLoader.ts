/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AnyEntity,
  IdentifiedReference,
  Collection,
  EntityManager,
  wrap,
  EntityRepository,
  Primary,
  FilterQuery,
} from '@mikro-orm/core';
import DataLoader from 'dataloader';
import {
  groupPrimaryKeysByEntity,
  groupInversedOrMappedKeysByEntity,
  groupFindQueries,
  ensureIsArray,
  RepoFind,
  Result,
  arrayAreEqual,
  arrayIncludes,
  hasRefOrCol,
  isRef,
  getRefPk,
  getHelperPk,
  getEntityMetadataClassName,
  IWrappedEntityInternalWithEntity,
} from './dataloader';

export class EntityDataLoader<T extends AnyEntity<T> = any> {
  private bypass: boolean;
  private refLoader: DataLoader<IdentifiedReference<T>, T>;
  private colLoader: DataLoader<Collection<T, AnyEntity<T>>, T[]>;
  private findLoader: DataLoader<RepoFind<T>, T[] | T | null>;

  constructor(em: EntityManager, bypass = false) {
    this.bypass = bypass;

    this.refLoader = new DataLoader<IdentifiedReference<T>, T>(async refs => {
      const groupedIds = groupPrimaryKeysByEntity(refs);
      const promises = Object.entries(groupedIds).map(([entity, ids]) =>
        (em.getRepository<T>(entity) as EntityRepository<T>).find(
          ids as FilterQuery<T>
        )
      );
      await Promise.all(promises);
      return Promise.all(refs.map(async ref => await ref.load()));
    });

    this.colLoader = new DataLoader<Collection<T, AnyEntity>, T[]>(
      async collections => {
        const groupedKeys = groupInversedOrMappedKeysByEntity(collections);
        const promises: Promise<T[]>[] = Object.entries(groupedKeys).map(
          ([entity, record]) =>
            (em.getRepository<T>(entity) as EntityRepository<T>).find(
              record,
              Object.keys(record)
            )
        );
        const results = (await Promise.all(promises))
          .flat()
          .map(
            entity => wrap(entity, true) as IWrappedEntityInternalWithEntity<T>
          );
        return collections.map(collection =>
          results
            .filter(result => {
              // Class matches
              if (
                getEntityMetadataClassName(result.__meta) ===
                collection.property.type
              ) {
                const inversedOrMappedBy = collection.property.inversedBy
                  ? 'inversedBy'
                  : collection.property.mappedBy
                  ? 'mappedBy'
                  : undefined;
                if (!inversedOrMappedBy) {
                  throw new Error('Cannot find inversedBy or mappedBy prop');
                }
                const refOrCol = hasRefOrCol(result.entity)[
                  collection.property[inversedOrMappedBy]
                ];
                return isRef(refOrCol)
                  ? getRefPk(refOrCol) ===
                      getHelperPk(collection.owner.__helper)
                  : refOrCol
                      .getItems()
                      .map(el => getHelperPk(el.__helper))
                      .includes(getHelperPk(collection.owner.__helper));
              }
              return false;
            })
            .map(wrapped => wrapped.entity)
        );
      }
    );

    this.findLoader = new DataLoader<RepoFind<T>, T[] | T | null>(
      async repoFinds => {
        const groupedKeys = groupFindQueries(repoFinds);
        const groupedResults: Result<T>[] = await Promise.all(
          Object.entries(groupedKeys)
            .map(([entityName, records]) => {
              return records.map(async record => {
                let entitiesOrError: T[] | Error;
                try {
                  const {properties} = em.getMetadata().get(entityName);
                  entitiesOrError = await (
                    em.getRepository<T>(entityName) as EntityRepository<T>
                  ).find(
                    record,
                    Object.keys(record).filter(
                      key => properties[key].reference !== 'scalar'
                    )
                  );
                } catch (e) {
                  entitiesOrError = e as Error;
                }
                return {
                  entityName,
                  keys: Object.keys(record),
                  entitiesOrError,
                };
              });
            })
            .flat()
        );

        return repoFinds.map(({repo, filter, many}) => {
          const result = groupedResults.find(
            ({entityName, keys, entitiesOrError}) => {
              if (
                entityName === String(repo['entityName']) &&
                arrayAreEqual(Object.keys(filter), keys)
              ) {
                if (!(entitiesOrError instanceof Error)) {
                  return true;
                } else {
                  throw entitiesOrError;
                }
              }
              return false;
            }
          );
          if (!result) {
            throw new Error('Cannot match results');
          }

          const {entitiesOrError} = result;
          if (!(entitiesOrError instanceof Error)) {
            return (
              entitiesOrError[many ? 'filter' : 'find'](entity => {
                for (const key of Object.keys(filter) as (keyof T & string)[]) {
                  const {properties} = em.getMetadata().get(result.entityName);
                  const idsFromSearchFilter = ensureIsArray(filter[key]);
                  const idsFromFindResult =
                    properties[key].reference !== 'scalar'
                      ? ensureIsArray(entity[key]).map(
                          (el: AnyEntity) => el.id as Primary<T>
                        )
                      : (ensureIsArray(entity[key]) as Primary<T>[]);
                  if (
                    !arrayIncludes(
                      idsFromSearchFilter,
                      idsFromFindResult,
                      entity[key] instanceof Collection ? 'any' : 'every'
                    )
                  ) {
                    return false;
                  }
                }
                return true;
              }) ?? null
            );
          } else {
            throw entitiesOrError;
          }
        });
      }
    );
  }

  load<K>(ref: IdentifiedReference<K>, bypass?: boolean): Promise<K>;
  load<K>(collection: Collection<K>, bypass?: boolean): Promise<K[]>;
  load<K>(
    refOrCol: IdentifiedReference<K> | Collection<K>,
    bypass?: boolean
  ): Promise<K> | Promise<K[]> {
    if (isRef(refOrCol)) {
      return bypass ?? this.bypass
        ? refOrCol.load()
        : (this.refLoader.load(
            refOrCol as unknown as IdentifiedReference<T>
          ) as unknown as Promise<K>);
    } else {
      return bypass ?? this.bypass
        ? refOrCol.loadItems()
        : (this.colLoader.load(
            refOrCol as unknown as Collection<T, AnyEntity<T>>
          ) as unknown as Promise<K[]>);
    }
  }

  find<K>(
    repo: EntityRepository<K>,
    filter: Record<string, number | number[]>,
    bypass?: boolean
  ): Promise<K[]> {
    return bypass ?? this.bypass
      ? repo.find(filter)
      : (this.findLoader.load({
          repo: repo as unknown as EntityRepository<T>,
          filter: filter as Record<string, Primary<T> | Primary<T>[]>,
          many: true,
        }) as unknown as Promise<K[]>);
  }

  findOne<K>(
    repo: EntityRepository<K>,
    filter: Record<string, number | number[]>,
    bypass?: boolean
  ): Promise<K | null> {
    return bypass ?? this.bypass
      ? repo.findOne(filter)
      : (this.findLoader.load({
          repo: repo as unknown as EntityRepository<T>,
          filter: filter as Record<string, Primary<T> | Primary<T>[]>,
          many: false,
        }) as unknown as Promise<K | null>);
  }

  async findOneOrFail<K>(
    repo: EntityRepository<K>,
    filter: Record<string, number | number[]>,
    bypass?: boolean
  ): Promise<K> {
    if (bypass ?? this.bypass) {
      return repo.findOneOrFail(filter);
    }
    const one = (await this.findLoader.load({
      repo: repo as unknown as EntityRepository<T>,
      filter: filter as Record<string, Primary<T> | Primary<T>[]>,
      many: false,
    })) as unknown as K | null;
    if (one == null) {
      throw new Error('Cannot find result');
    }
    return one;
  }
}
