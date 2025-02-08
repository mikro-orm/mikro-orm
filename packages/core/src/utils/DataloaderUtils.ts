import type { Primary, Ref } from '../typings';
import { Collection, type InitCollectionOptions } from '../entity/Collection';
import { helper } from '../entity/wrap';
import { type EntityManager } from '../EntityManager';
import type DataLoader from 'dataloader';
import { ReferenceKind } from '../enums';
import { type LoadReferenceOptions, Reference } from '../entity/Reference';

export class DataloaderUtils {

  /**
   * Groups identified references by entity and returns a Map with the
   * class name as the index and the corresponding primary keys as the value.
   */
  static groupPrimaryKeysByEntityAndOpts(
    refsWithOpts: readonly [Ref<any>, Omit<LoadReferenceOptions<any, any>, 'dataloader'>?][],
  ): Map<string, Set<Primary<any>>> {
    const map = new Map<string, Set<Primary<any>>>();
    for (const [ref, opts] of refsWithOpts) {
      /* The key is a combination of the className and a stringified version if the load options because we want
         to map each combination of entities/options into separate find queries in order to return accurate results.
         This could be further optimized finding the "lowest common denominator" among the different options
         for each Entity and firing a single query for each Entity instead of Entity+options combination.
         The former is the approach taken by the out-of-tree "find" dataloader: https://github.com/darkbasic/mikro-orm-dataloaders
         In real-world scenarios (GraphQL) most of the time you will end up batching the same sets of options anyway,
         so we end up getting most of the benefits with the much simpler implementation.
         Also there are scenarios where the single query per entity implementation may end up being slower, for example
         if the vast majority of the references batched for a certain entity  don't have populate options while a few ones have
         a wildcard populate so you end up doing the additional joins for all the entities.
         Thus such approach should probably be configurable, if not opt-in.
         NOTE: meta + opts multi maps (https://github.com/martian17/ds-js) might be a more elegant way
         to implement this but not necessarily faster.  */
      const key = `${helper(ref).__meta.className}|${JSON.stringify(opts ?? {})}`;
      let primaryKeysSet = map.get(key);
      if (primaryKeysSet == null) {
        primaryKeysSet = new Set();
        map.set(key, primaryKeysSet);
      }
      primaryKeysSet.add(helper(ref).getPrimaryKey() as Primary<any>);
    }
    return map;
  }

  /**
   * Returns the reference dataloader batchLoadFn, which aggregates references by entity,
   * makes one query per entity and maps each input reference to the corresponding result.
   */
  static getRefBatchLoadFn(em: EntityManager): DataLoader.BatchLoadFn<[Ref<any>, Omit<LoadReferenceOptions<any, any>, 'dataloader'>?], any> {
    return async (refsWithOpts: readonly [Ref<any>, Omit<LoadReferenceOptions<any, any>, 'dataloader'>?][]): Promise<ArrayLike<any | Error>> => {
      const groupedIdsMap = DataloaderUtils.groupPrimaryKeysByEntityAndOpts(refsWithOpts);
      const promises = Array.from(groupedIdsMap).map(
        ([key, idsSet]) => {
          const className = key.substring(0, key.indexOf('|'));
          const opts = JSON.parse(key.substring(key.indexOf('|') + 1));
          return em.find(className, Array.from(idsSet), opts);
        },
      );
      await Promise.all(promises);
      /* Instead of assigning each find result to the original reference we use a shortcut
        which takes advantage of the already existing Mikro-ORM caching mechanism:
        when it calls ref.unwrap it will automatically retrieve the entity
        from the cache (it will hit the cache because of the previous find query).
        This trick won't be possible for collections where we will be forced to map the results. */
      return refsWithOpts.map(([ref]) => ref.unwrap());
    };
  }

  /**
   * Groups collections by entity and returns a Map whose keys are the entity names and whose values are filter Maps
   * which we can use to narrow down the find query to return just the items of the collections that have been dataloaded.
   * The entries of the filter Map will be used as the values of an $or operator so we end up with a query per entity.
   */
  static groupInversedOrMappedKeysByEntityAndOpts(
    collsWithOpts: readonly [Collection<any>, Omit<InitCollectionOptions<any, any>, 'dataloader'>?][],
  ): Map<string, Map<string, Set<Primary<any>>>> {
    const entitiesMap = new Map<string, Map<string, Set<Primary<any>>>>();
    for (const [col, opts] of collsWithOpts) {
      /*
      We first get the entity name of the Collection and together with its options (see groupPrimaryKeysByEntityAndOpts
      for a full explanation) we use it as the key of the first Map.
      With that we know that we have to look for entities of this type (and with the same options) in order to fulfill the collection.
      The value is another Map which we can use to filter the find query to get results pertaining to the collections that have been dataloaded:
      its keys are the props we are going to filter to and its values are the corresponding PKs.
      */
      const key = `${col.property.targetMeta!.className}|${JSON.stringify(opts ?? {})}`;
      let filterMap = entitiesMap.get(key); // We are going to use this map to filter the entities pertaining to the collections that have been dataloaded.
      if (filterMap == null) {
        filterMap = new Map<string, Set<Primary<any>>>();
        entitiesMap.set(key, filterMap);
      }
      // The Collection dataloader relies on the inverse side of the relationship (inversedBy/mappedBy), which is going to be
      // the key of the filter Map and it's the prop that we use to filter the results pertaining to the Collection.
      const inversedProp = col.property.inversedBy ?? col.property.mappedBy; // Many to Many vs One to Many
      let primaryKeys = filterMap.get(inversedProp);
      if (primaryKeys == null) {
        primaryKeys = new Set();
        filterMap.set(inversedProp, primaryKeys);
      }
      // This is the PK that in conjunction with the filter Map key (the prop) will lead to this specific Collection
      primaryKeys.add(helper(col.owner).getPrimaryKey());
    }
    return entitiesMap;
  }

  /**
   * Turn the entity+options map into actual queries.
   * The keys are the entity names + a stringified version of the options and the values are filter Maps which will be used as the values of an $or operator so we end up with a query per entity+opts.
   * We must populate the inverse side of the relationship in order to be able to later retrieve the PK(s) from its item(s).
   * Together with the query the promises will also return the key which can be used to narrow down the results pertaining to a certain set of options.
   */
  static entitiesAndOptsMapToQueries(
    entitiesAndOptsMap: Map<string, Map<string, Set<Primary<any>>>>,
    em: EntityManager,
  ): Promise<[string, any[]]>[] {
    return Array.from(entitiesAndOptsMap, async ([key, filterMap]): Promise<[string, any[]]> => {
      const className = key.substring(0, key.indexOf('|'));
      const opts: Omit<InitCollectionOptions<any, any>, 'dataloader'> = JSON.parse(key.substring(key.indexOf('|') + 1));
      const res = await em.find<any>(
        className,
        opts?.where != null && Object.keys(opts.where).length > 0 ?
          {
            $and: [
              {
                $or: Array.from(filterMap.entries()).map(([prop, pks]) => {
                  return ({ [prop]: Array.from(pks) });
                }),
              },
              opts.where,
            ],
          } : {
            // The entries of the filter Map will be used as the values of the $or operator
            $or: Array.from(filterMap.entries()).map(([prop, pks]) => {
              return ({ [prop]: Array.from(pks) });
            }),
          },
        {
          ...opts,
          // We need to populate the inverse side of the relationship in order to be able to later retrieve the PK(s) from its item(s)
          populate: [
            ...(opts.populate === false ? [] : opts.populate ?? []),
            ...(opts.ref ? [':ref'] : []),
            ...Array.from(filterMap.keys()).filter(
              // We need to do so only if the inverse side is a collection, because we can already retrieve the PK from a reference without having to load it
              prop => em.getMetadata<any>(className).properties[prop]?.ref !== true,
            ),
          ],
        } as any);
      return [key, res];
    });
  }

  /**
   * Creates a filter which returns the results pertaining to a certain collection.
   * First checks if the Entity type matches, then retrieves the inverse side of the relationship
   * where the filtering will be done in order to match the target collection.
   */
  static getColFilter<T, S extends T>(collection: Collection<any>): (result: T) => result is S {
    return (result): result is S => {
      // There is no need to check if Entity matches because we already matched the key which is entity+options.
      // This is the inverse side of the relationship where the filtering will be done in order to match the target collection
      // Either inversedBy or mappedBy exist because we already checked in groupInversedOrMappedKeysByEntity
      const inverseProp = collection.property.inversedBy ?? collection.property.mappedBy;
      const target = Reference.unwrapReference(result[inverseProp as keyof T] as Ref<any> | Collection<any>);

      if (target instanceof Collection) {
        for (const item of target) {
          if (item === collection.owner) {
            return true;
          }
        }
      } else if (target) {
        return target === collection.owner;
      }

      // FIXME https://github.com/mikro-orm/mikro-orm/issues/6031
      if (!target && collection.property.kind === ReferenceKind.MANY_TO_MANY) {
        throw new Error(`Inverse side is required for M:N relations with dataloader: ${collection.owner.constructor.name}.${collection.property.name}`);
      }

      return false;
    };
  }

  /**
   * Returns the collection dataloader batchLoadFn, which aggregates collections by entity,
   * makes one query per entity and maps each input collection to the corresponding result.
   */
  static getColBatchLoadFn(em: EntityManager): DataLoader.BatchLoadFn<[Collection<any>, Omit<InitCollectionOptions<any, any>, 'dataloader'>?], any> {
    return async (collsWithOpts: readonly [Collection<any>, Omit<InitCollectionOptions<any, any>, 'dataloader'>?][]) => {
      const entitiesAndOptsMap = DataloaderUtils.groupInversedOrMappedKeysByEntityAndOpts(collsWithOpts);
      const promises = DataloaderUtils.entitiesAndOptsMapToQueries(entitiesAndOptsMap, em);
      const resultsMap = new Map(await Promise.all(promises));
      // We need to filter the results in order to map each input collection
      // to a subset of each query matching the collection items.
      return collsWithOpts.map(([col, opts]) => {
        const key = `${col.property.targetMeta!.className}|${JSON.stringify(opts ?? {})}`;
        const entities = resultsMap.get(key);
        if (entities == null) {
          // Should never happen
          /* istanbul ignore next */
          throw new Error('Cannot match results');
        }
        return entities.filter(DataloaderUtils.getColFilter(col));
      });
    };
  }

}
