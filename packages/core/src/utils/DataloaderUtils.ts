import type {
  EntityMetadata,
  Primary,
  Ref,
} from '../typings';
import { Collection } from '../entity/Collection';
import { helper } from '../entity/wrap';
import { type EntityManager } from '../EntityManager';
import type DataLoader from 'dataloader';
import { Dataloader } from '..';

export class DataloaderUtils {

  /**
   * Groups identified references by entity and returns a Map with the
   * class name as the index and the corresponging primary keys as the value.
   */
  static groupPrimaryKeysByEntity(
    refs: readonly Ref<any>[],
  ): Map<EntityMetadata<any>, Set<Primary<any>>> {
    const map = new Map<EntityMetadata<any>, Set<Primary<any>>>();
    for (const ref of refs) {
      // We use EntityMetadata objects as the key instead of __meta.className because it will be more performant
      const meta = helper(ref).__meta;
      let primaryKeysSet = map.get(meta);
      if (primaryKeysSet == null) {
        primaryKeysSet = new Set();
        map.set(meta, primaryKeysSet);
      }
      primaryKeysSet.add(helper(ref).getPrimaryKey() as Primary<any>);
    }
    return map;
  }

  /**
   * Returns the reference dataloader batchLoadFn, which aggregates references by entity,
   * makes one query per entity and maps each input reference to the corresponging result.
   */
  static getRefBatchLoadFn(em: EntityManager): DataLoader.BatchLoadFn<Ref<any>, any> {
    return async (refs: readonly Ref<any>[]): Promise<ArrayLike<any | Error>> => {
      const groupedIdsMap = DataloaderUtils.groupPrimaryKeysByEntity(refs);
      const promises = Array.from(groupedIdsMap).map(
        ([{ className }, idsSet]) =>
          em.find(className, Array.from(idsSet)),
      );
      await Promise.all(promises);
      /* Instead of assigning each find result to the original reference we use a shortcut
        which takes advantage of the already existing Mikro-ORM caching mechanism:
        when it calls ref.unwrap it will automatically retrieve the entity
        from the cache (it will hit the cache because of the previous find query).
        This trick won't be possible for collections where we will be forced to map the results. */
      return refs.map(ref => ref.unwrap());
    };
  }

  /**
   * Groups collections by entity and returns a Map whose keys are the entity names and whose values are filter Maps
   * which we can use to narrow down the find query to return just the items of the collections that have been dataloaded.
   * The entries of the filter Map will be used as the values of an $or operator so we end up with a query per entity.
   */
  static groupInversedOrMappedKeysByEntity(
    collections: readonly Collection<any>[],
  ): Map<EntityMetadata<any>, Map<string, Set<Primary<any>>>> {
    const entitiesMap = new Map<EntityMetadata<any>, Map<string, Set<Primary<any>>>>();
    for (const col of collections) {
      /*
      We first get the entity name of the Collection and we use it as the key of the first Map.
      With that we know that we have to look for entities of this type in order to fulfill the collection.
      The value is another Map which we can use to filter the find query to get results pertaining to the collections that have been dataloaded:
      its keys are the props we are going to filter to and its values are the corresponding PKs.
      */
      // We use EntityMetadata objects as the key instead of __meta.className because it will be more performant
      const entityMeta = col.property.targetMeta!; // The Entity Name (targetMeta.className) we will search for
      let filterMap = entitiesMap.get(entityMeta); // We are going to use this map to filter the entities pertaining to the collections that have been dataloaded.
      if (filterMap == null) {
        filterMap = new Map<string, Set<Primary<any>>>();
        entitiesMap.set(entityMeta, filterMap);
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
   * Turn the entity map into actual queries.
   * The keys are the entity names and the values are filter Maps which will be used as the values of an $or operator so we end up with a query per entity.
   * We must populate the inverse side of the relationship in order to be able to later retrieve the PK(s) from its item(s).
   */
  static entitiesMapToQueries(
    entitiesMap: Map<EntityMetadata<any>, Map<string, Set<Primary<any>>>>,
    em: EntityManager,
  ): Promise<any[]>[] {
    return Array.from(entitiesMap.entries()).map(
      ([{ className }, filterMap]) =>
        em.find(
          className,
          {
            // The entries of the filter Map will be used as the values of the $or operator
            $or: Array.from(filterMap.entries()).map(([prop, pks]) => ({ [prop]: Array.from(pks) })),
          },
          {
            // We need to populate the inverse side of the relationship in order to be able to later retrieve the PK(s) from its item(s)
            populate: Array.from(filterMap.keys()).filter(
              // We need to do so only if the inverse side is a collection, because we can already retrieve the PK from a reference without having to load it
              prop => em.getMetadata().get(className).properties[prop]?.ref !== true,
            ) as any,
          },
        ),
    );
  }

  /**
   * Creates a filter which returns the results pertaining to a certain collection.
   * First checks if the Entity type matches, then retrieves the inverse side of the relationship
   * where the filtering will be done in order to match the target collection.
   */
  static getColFilter<T, S extends T>(
    collection: Collection<any, object>,
  ): (result: T) => result is S {
    return (result): result is S => {
      // First check if Entity matches
      if (helper(result).__meta.className === collection.property.type) {
        // This is the inverse side of the relationship where the filtering will be done in order to match the target collection
        // Either inversedBy or mappedBy exist because we already checked in groupInversedOrMappedKeysByEntity
        const refOrCol = result[((collection.property.inversedBy ?? collection.property.mappedBy) as keyof T)] as
          | Ref<any>
          | Collection<any>;
        if (refOrCol instanceof Collection) {
          // The inverse side is a Collection
          // We keep the result if any of PKs of the inverse side matches the PK of the collection owner
          for (const item of refOrCol.getItems()) {
            if (helper(item).getSerializedPrimaryKey() === helper(collection.owner).getSerializedPrimaryKey()) {
              return true;
            }
          }
        } else {
          // The inverse side is a Reference
          // We keep the result if the PK of the inverse side matches the PK of the collection owner
          return helper(refOrCol).getSerializedPrimaryKey() === helper(collection.owner).getSerializedPrimaryKey();
        }
      }
      return false;
    };
  }

  /**
   * Returns the collection dataloader batchLoadFn, which aggregates collections by entity,
   * makes one query per entity and maps each input collection to the corresponging result.
   */
  static getColBatchLoadFn(em: EntityManager): DataLoader.BatchLoadFn<Collection<any>, any> {
    return async (collections: readonly Collection<any>[]) => {
      const entitiesMap = DataloaderUtils.groupInversedOrMappedKeysByEntity(collections);
      const promises = DataloaderUtils.entitiesMapToQueries(entitiesMap, em);
      const results = (await Promise.all(promises)).flat();
      // We need to filter the results in order to map each input collection
      // to a subset of each query matching the collection items.
      return collections.map(collection =>
        results.filter(DataloaderUtils.getColFilter(collection)),
      );
    };
  }

  static getDataloaderType(dataloaderCfg: Dataloader | boolean): Dataloader {
    switch (dataloaderCfg) {
      case true:
        return Dataloader.ALL;
      case false:
        return Dataloader.OFF;
      default:
        return dataloaderCfg;
    }
  }

}
