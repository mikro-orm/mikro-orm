import { Utils } from '../utils/Utils.js';
import type {
  Constructor,
  Dictionary,
  EntityData,
  EntityDataValue,
  EntityKey,
  EntityMetadata,
  EntityName,
  EntityValue,
  IHydrator,
  New,
  Primary,
} from '../typings.js';
import type { EntityManager } from '../EntityManager.js';
import { QueryHelper } from '../utils/QueryHelper.js';
import { EventType, ReferenceKind } from '../enums.js';
import { Reference } from './Reference.js';
import { helper } from './wrap.js';
import type { EntityComparator } from '../utils/EntityComparator.js';
import { EntityHelper } from './EntityHelper.js';
import type { IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import type { Platform } from '../platforms/Platform.js';
import type { Configuration } from '../utils/Configuration.js';
import type { EventManager } from '../events/EventManager.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import { JsonType } from '../types/JsonType.js';
import { isRaw } from '../utils/RawQueryFragment.js';

/** @internal Options for creating and merging entities via the EntityFactory. */
export interface FactoryOptions {
  /** Whether the entity should be marked as initialized. */
  initialized?: boolean;
  /** Whether the entity is being newly created (uses constructor). */
  newEntity?: boolean;
  /**
   * Property `onCreate` hooks are normally executed during `flush` operation.
   * With this option, they will be processed early inside `em.create()` method.
   */
  processOnCreateHooksEarly?: boolean;
  /** Whether to merge the entity into the identity map. */
  merge?: boolean;
  /** Whether to refresh an already loaded entity with new data. */
  refresh?: boolean;
  /** Whether to convert custom types during hydration. */
  convertCustomTypes?: boolean;
  /** Whether to recompute the entity snapshot after creation. */
  recomputeSnapshot?: boolean;
  /** Schema from FindOptions, overrides default schema. */
  schema?: string;
  /** Parent entity schema for nested entity creation. */
  parentSchema?: string;
  /** Whether to normalize accessors to the correct property names (normally handled via result mapper). */
  normalizeAccessors?: boolean;
  /**
   * Property name to use for identity map lookup instead of the primary key.
   * This is useful for creating references by unique non-PK properties.
   */
  key?: string;
}

/** @internal Factory responsible for creating, merging, and hydrating entity instances. */
export class EntityFactory {
  readonly #driver: IDatabaseDriver;
  readonly #platform: Platform;
  readonly #config: Configuration;
  readonly #metadata: MetadataStorage;
  readonly #hydrator: IHydrator;
  readonly #eventManager: EventManager;
  readonly #comparator: EntityComparator;
  readonly #em: EntityManager;

  constructor(em: EntityManager) {
    this.#em = em;
    this.#driver = this.#em.getDriver();
    this.#platform = this.#driver.getPlatform();
    this.#config = this.#em.config;
    this.#metadata = this.#em.getMetadata();
    this.#hydrator = this.#config.getHydrator(this.#metadata);
    this.#eventManager = this.#em.getEventManager();
    this.#comparator = this.#em.getComparator();
  }

  /** Creates a new entity instance or returns an existing one from the identity map, hydrating it with the provided data. */
  create<T extends object, P extends string = string>(
    entityName: EntityName<T>,
    data: EntityData<T>,
    options: FactoryOptions = {},
  ): New<T, P> {
    data = Reference.unwrapReference(data as T);
    options.initialized ??= true;

    if (EntityHelper.isEntity(data)) {
      return data as New<T, P>;
    }

    const meta = this.#metadata.get<T>(entityName);

    if (meta.virtual) {
      data = { ...data };
      const entity = this.createEntity<T>(data, meta, options);
      this.hydrate(entity, meta, data, options);

      return entity as New<T, P>;
    }

    if (meta.serializedPrimaryKey) {
      this.denormalizePrimaryKey(meta, data);
    }

    const meta2 = this.processDiscriminatorColumn<T>(meta, data);
    const exists = this.findEntity<T>(data, meta2, options);
    let wrapped = exists && helper(exists);

    if (wrapped && !options.refresh) {
      const wasInitialized = wrapped.isInitialized();
      wrapped.__processing = true;
      Utils.dropUndefinedProperties(data);
      this.mergeData(meta2, exists!, data, options);
      wrapped.__processing = false;
      wrapped.__initialized ||= !!options.initialized;

      if (wrapped.isInitialized()) {
        if (!wasInitialized) {
          if (meta.root.inheritanceType && !(exists instanceof meta2.class)) {
            Object.setPrototypeOf(exists, meta2.prototype as object);
          }

          if (options.merge && wrapped.hasPrimaryKey()) {
            this.unitOfWork.register(exists!, data, { loaded: options.initialized });

            // ensure all data keys are tracked as loaded for shouldRefresh checks,
            // but don't overwrite __originalEntityData — mergeData already set it
            // with DB values for non-user-modified keys, leaving user changes detectable
            for (const key of Utils.keys(data)) {
              if (meta2.properties[key]) {
                wrapped.__loadedProperties.add(key as string);
              }
            }
          }

          if (this.#eventManager.hasListeners(EventType.onInit, meta2)) {
            this.#eventManager.dispatchEvent(EventType.onInit, { entity: exists, meta: meta2, em: this.#em });
          }
        }

        return exists as New<T, P>;
      }
    }

    data = { ...data };
    const entity = exists ?? this.createEntity<T>(data, meta2, options);
    wrapped = helper(entity);
    wrapped.__processing = true;
    wrapped.__initialized = options.initialized;

    if (options.newEntity || meta.forceConstructor || meta.virtual) {
      const tmp = { ...data };
      meta.constructorParams?.forEach(prop => delete tmp[prop as EntityKey<T>]);
      this.hydrate(entity, meta2, tmp, options);

      // since we now process only a copy of the `data` via hydrator, but later we register the state with the full snapshot,
      // we need to go through all props with custom types that have `ensureComparable: true` and ensure they are comparable
      // even if they are not part of constructor parameters (as this is otherwise normalized during hydration, here only in `tmp`)
      if (options.convertCustomTypes) {
        for (const prop of meta.props) {
          if (prop.customType?.ensureComparable(meta, prop) && data[prop.name]) {
            if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
              continue;
            }

            if (
              [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) &&
              Utils.isPlainObject(data[prop.name])
            ) {
              data[prop.name] = Utils.getPrimaryKeyValues(data[prop.name], prop.targetMeta!, true);
            }

            if (prop.customType instanceof JsonType && this.#platform.convertsJsonAutomatically()) {
              data[prop.name] = prop.customType.convertToDatabaseValue(data[prop.name], this.#platform, {
                key: prop.name,
                mode: 'hydration',
              }) as any;
            }
          }
        }
      }
    } else {
      this.hydrate(entity, meta2, data, options);
    }

    if (exists && meta.root.inheritanceType && !(entity instanceof meta2.class)) {
      Object.setPrototypeOf(entity, meta2.prototype as object);
    }

    if (options.merge && wrapped.hasPrimaryKey()) {
      this.unitOfWork.register(entity, data, {
        // Always refresh to ensure the payload is in correct shape for joined strategy. When loading nested relations,
        // they will be created early without `Type.ensureComparable` being properly handled, resulting in extra updates.
        refresh: options.initialized,
        newEntity: options.newEntity,
        loaded: options.initialized,
      });

      if (options.recomputeSnapshot) {
        wrapped.__originalEntityData = this.#comparator.prepareEntity(entity);
      }
    }

    if (this.#eventManager.hasListeners(EventType.onInit, meta2)) {
      this.#eventManager.dispatchEvent(EventType.onInit, { entity, meta: meta2, em: this.#em });
    }

    wrapped.__processing = false;

    return entity as New<T, P>;
  }

  /** Merges new data into an existing entity, preserving user-modified properties. */
  mergeData<T extends object>(
    meta: EntityMetadata<T>,
    entity: T,
    data: EntityData<T>,
    options: FactoryOptions = {},
  ): void {
    // merge unchanged properties automatically
    data = QueryHelper.processParams(data);
    const existsData = this.#comparator.prepareEntity(entity);
    const originalEntityData = helper(entity).__originalEntityData ?? ({} as EntityData<T>);
    const diff = this.#comparator.diffEntities(meta.class, originalEntityData, existsData);

    // version properties are not part of entity snapshots
    if (
      meta.versionProperty &&
      data[meta.versionProperty] &&
      data[meta.versionProperty] !== originalEntityData[meta.versionProperty]
    ) {
      diff[meta.versionProperty] = data[meta.versionProperty];
    }

    const diff2 = this.#comparator.diffEntities(meta.class, existsData, data, { includeInverseSides: true });

    // do not override values changed by user; for uninitialized entities,
    // the diff may include stale snapshot entries (value is undefined) — skip those
    if (helper(entity).__initialized) {
      Utils.keys(diff).forEach(key => delete diff2[key]);
    } else {
      Utils.keys(diff).forEach(key => {
        if (diff[key] !== undefined) {
          delete diff2[key];
        }
      });
    }

    Utils.keys(diff2)
      .filter(key => {
        // ignore null values if there is already present non-null value
        if (existsData[key] != null) {
          return diff2[key] == null;
        }

        return diff2[key] === undefined;
      })
      .forEach(key => delete diff2[key]);

    // but always add collection properties and formulas if they are part of the `data`
    Utils.keys(data)
      .filter(
        key =>
          meta.properties[key]?.formula ||
          [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(meta.properties[key]?.kind),
      )
      .forEach(key => (diff2[key] = data[key]));

    // rehydrated with the new values, skip those changed by user
    // use full hydration if the entity is already initialized, even if the caller used `initialized: false`
    // (e.g. from createReference), otherwise scalar properties in diff2 won't be applied
    const initialized = options.initialized || helper(entity).__initialized;
    this.hydrate(entity, meta, diff2, initialized ? { ...options, initialized } : options);

    // we need to update the entity data only with keys that were not present before
    const nullVal = this.#config.get('forceUndefined') ? undefined : null;
    Utils.keys(diff2).forEach(key => {
      const prop = meta.properties[key];

      if (
        [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) &&
        Utils.isPlainObject(data[prop.name])
      ) {
        // oxfmt-ignore
        diff2[key] = entity[prop.name] ? helper(entity[prop.name]!).getPrimaryKey(options.convertCustomTypes) as EntityDataValue<T> : null;
      }

      if (
        !options.convertCustomTypes &&
        [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE, ReferenceKind.SCALAR].includes(prop.kind) &&
        prop.customType?.ensureComparable(meta, prop) &&
        diff2[key] != null
      ) {
        const converted = prop.customType.convertToJSValue(diff2[key], this.#platform, { force: true });
        diff2[key] = prop.customType.convertToDatabaseValue(converted, this.#platform, { fromQuery: true });
      }

      originalEntityData[key] = diff2[key] === null ? nullVal : diff2[key];
      helper(entity).__loadedProperties.add(key);
    });

    // in case of joined loading strategy, we need to cascade the merging to possibly loaded relations manually
    meta.relations.forEach(prop => {
      if (
        [ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop.kind) &&
        Array.isArray(data[prop.name])
      ) {
        // instead of trying to match the collection items (which could easily fail if the collection was loaded with different ordering),
        // we just create the entity from scratch, which will automatically pick the right one from the identity map and call `mergeData` on it
        (data[prop.name] as EntityData<T>[])
          .filter(child => Utils.isPlainObject(child)) // objects with prototype can be PKs (e.g. `ObjectId`)
          .forEach(child => this.create(prop.targetMeta!.class, child, options)); // we can ignore the value, we just care about the `mergeData` call

        return;
      }

      if (
        [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) &&
        Utils.isPlainObject(data[prop.name]) &&
        entity[prop.name] &&
        helper(entity[prop.name]!).__initialized
      ) {
        this.create(prop.targetMeta!.class, data[prop.name] as EntityData<T>, options); // we can ignore the value, we just care about the `mergeData` call
      }
    });

    this.unitOfWork.normalizeEntityData(meta, originalEntityData);
  }

  /** Creates or retrieves an uninitialized entity reference by its primary key or alternate key. */
  createReference<T extends object>(
    entityName: EntityName<T>,
    id: Primary<T> | Primary<T>[] | Record<string, Primary<T>>,
    options: Pick<FactoryOptions, 'merge' | 'convertCustomTypes' | 'schema' | 'key'> = {},
  ): T {
    options.convertCustomTypes ??= true;
    const meta = this.#metadata.get<T>(entityName);
    const schema = this.#driver.getSchemaName(meta, options);

    // Handle alternate key lookup
    if (options.key) {
      const value =
        '' + (Array.isArray(id) ? id[0] : Utils.isPlainObject(id) ? (id as Record<string, any>)[options.key] : id);
      const exists = this.unitOfWork.getByKey(entityName, options.key, value, schema, options.convertCustomTypes);

      if (exists) {
        return exists;
      }

      // Create entity stub - storeByKey will set the alternate key property and store in identity map
      const entity = this.create(entityName, {} as EntityData<T>, { ...options, initialized: false }) as T;
      this.unitOfWork.storeByKey(entity, options.key, value, schema, options.convertCustomTypes);

      return entity;
    }

    if (meta.simplePK) {
      const exists = this.unitOfWork.getById(entityName, id as Primary<T>, schema);

      if (exists) {
        return exists;
      }

      const data = Utils.isPlainObject(id) ? id : { [meta.primaryKeys[0]]: Array.isArray(id) ? id[0] : id };
      return this.create(entityName, data as EntityData<T>, { ...options, initialized: false });
    }

    if (Array.isArray(id)) {
      id = Utils.getPrimaryKeyCondFromArray(id, meta);
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(id, meta, this.#platform);
    const exists = this.unitOfWork.getById<T>(entityName, pks as Primary<T>, schema, options.convertCustomTypes);

    if (exists) {
      return exists;
    }

    if (Utils.isPrimaryKey(id)) {
      id = { [meta.primaryKeys[0]]: id as Primary<T> };
    }

    return this.create<T>(entityName, id as EntityData<T>, { ...options, initialized: false }) as T;
  }

  /** Creates an embeddable entity instance from the provided data. */
  createEmbeddable<T extends object>(
    entityName: EntityName<T>,
    data: EntityData<T>,
    options: Pick<FactoryOptions, 'newEntity' | 'convertCustomTypes'> = {},
  ): T {
    data = { ...data };
    const meta = this.#metadata.get(entityName);
    const meta2 = this.processDiscriminatorColumn<T>(meta, data);

    return this.createEntity(data, meta2, options);
  }

  /** Returns the EntityComparator instance used for diffing entities. */
  getComparator(): EntityComparator {
    return this.#comparator;
  }

  private createEntity<T extends object>(data: EntityData<T>, meta: EntityMetadata<T>, options: FactoryOptions): T {
    const schema = this.#driver.getSchemaName(meta, options);

    if (options.newEntity || meta.forceConstructor || meta.virtual) {
      if (meta.polymorphs) {
        throw new Error(`Cannot create entity ${meta.className}, class prototype is unknown`);
      }

      const params = this.extractConstructorParams<T>(meta, data, options);
      const Entity = meta.class as Constructor<T>;

      // creates new instance via constructor as this is the new entity
      const entity = new Entity(...params);

      // creating managed entity instance when `forceEntityConstructor` is enabled,
      // we need to wipe all the values as they would cause update queries on next flush
      if (!options.newEntity && (meta.forceConstructor || this.#config.get('forceEntityConstructor'))) {
        meta.props
          .filter(prop => prop.persist !== false && !prop.primary && data[prop.name] === undefined)
          .forEach(prop => delete entity[prop.name]);
      }

      if (meta.virtual) {
        return entity;
      }

      helper(entity).__schema = schema;

      if (options.initialized) {
        EntityHelper.ensurePropagation(entity);
      }

      return entity;
    }

    // creates new entity instance, bypassing constructor call as its already persisted entity
    const entity = Object.create(meta.class.prototype) as T;
    helper(entity).__managed = true;
    helper(entity).__processing = !meta.embeddable && !meta.virtual;
    helper(entity).__schema = schema;

    if (options.merge && !options.newEntity) {
      this.#hydrator.hydrateReference(
        entity,
        meta,
        data,
        this,
        options.convertCustomTypes,
        options.schema,
        options.parentSchema,
      );
      this.unitOfWork.register(entity);
    }

    if (options.initialized) {
      EntityHelper.ensurePropagation(entity);
    }

    return entity;
  }

  /** @internal */
  assignDefaultValues<T extends object>(entity: T, meta: EntityMetadata<T>, onCreateOnly?: boolean): void {
    for (const prop of meta.props) {
      if (prop.embedded || [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
        continue;
      }

      if (prop.onCreate) {
        entity[prop.name] ??= prop.onCreate(entity, this.#em);
      } else if (!onCreateOnly && prop.default != null && !isRaw(prop.default) && entity[prop.name] === undefined) {
        entity[prop.name] = prop.default as EntityValue<T>;
      }

      if (prop.kind === ReferenceKind.EMBEDDED && entity[prop.name]) {
        const items = prop.array ? (entity[prop.name] as T[]) : [entity[prop.name] as T];

        for (const item of items) {
          // Embedded sub-properties need all defaults since the DB can't apply them within JSON columns.
          this.assignDefaultValues(item, prop.targetMeta! as EntityMetadata<T>);
        }
      }
    }
  }

  private hydrate<T extends object>(
    entity: T,
    meta: EntityMetadata<T>,
    data: EntityData<T>,
    options: FactoryOptions,
  ): void {
    if (options.initialized) {
      this.#hydrator.hydrate(
        entity,
        meta,
        data,
        this,
        'full',
        options.newEntity,
        options.convertCustomTypes,
        options.schema,
        this.#driver.getSchemaName(meta, options),
        options.normalizeAccessors,
      );
    } else {
      this.#hydrator.hydrateReference(
        entity,
        meta,
        data,
        this,
        options.convertCustomTypes,
        options.schema,
        this.#driver.getSchemaName(meta, options),
        options.normalizeAccessors,
      );
    }

    Utils.keys(data).forEach(key => {
      helper(entity)?.__loadedProperties.add(key);
      helper(entity)?.__serializationContext.fields?.add(key);
    });

    const processOnCreateHooksEarly =
      options.processOnCreateHooksEarly ?? this.#config.get('processOnCreateHooksEarly');

    if (options.newEntity && processOnCreateHooksEarly) {
      this.assignDefaultValues(entity, meta);
    }
  }

  private findEntity<T extends object>(
    data: EntityData<T>,
    meta: EntityMetadata<T>,
    options: FactoryOptions,
  ): T | undefined {
    const schema = this.#driver.getSchemaName(meta, options);

    if (meta.simplePK) {
      return this.unitOfWork.getById<T>(meta.class, data[meta.primaryKeys[0]] as Primary<T>, schema);
    }

    if (!Array.isArray(data) && meta.primaryKeys.some(pk => data[pk] == null)) {
      return undefined;
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(data as Dictionary, meta, this.#platform, options.convertCustomTypes);

    return this.unitOfWork.getById<T>(meta.class, pks, schema);
  }

  private processDiscriminatorColumn<T extends object>(
    meta: EntityMetadata<T>,
    data: EntityData<T>,
  ): EntityMetadata<T> {
    // Handle STI discriminator (persisted column)
    if (meta.root.inheritanceType === 'sti') {
      const prop = meta.properties[meta.root.discriminatorColumn as EntityKey<T>];
      const value = data[prop.name] as string;
      const type = meta.root.discriminatorMap![value];
      meta = type ? this.#metadata.get(type) : meta;
      return meta;
    }

    // Handle TPT discriminator (computed at query time)
    if (meta.root.inheritanceType === 'tpt' && meta.root.discriminatorMap) {
      const value = data[meta.root.tptDiscriminatorColumn as EntityKey<T>] as string;
      if (value) {
        const type = meta.root.discriminatorMap[value];
        meta = type ? this.#metadata.get(type) : meta;
      }
    }

    return meta;
  }

  /**
   * denormalize PK to value required by driver (e.g. ObjectId)
   */
  private denormalizePrimaryKey<T>(meta: EntityMetadata<T>, data: EntityData<T>): void {
    const pk = meta.getPrimaryProp();
    const spk = meta.properties[meta.serializedPrimaryKey!];

    if (!spk?.serializedPrimaryKey) {
      return;
    }

    if (pk.type === 'ObjectId' && (data[pk.name] != null || data[spk.name] != null)) {
      data[pk.name] = this.#platform.denormalizePrimaryKey(
        (data[spk.name] || data[pk.name]) as string,
      ) as EntityDataValue<T>;
      delete data[spk.name];
    }
  }

  /**
   * returns parameters for entity constructor, creating references from plain ids
   */
  private extractConstructorParams<T extends object>(
    meta: EntityMetadata<T>,
    data: EntityData<T>,
    options: FactoryOptions,
  ): EntityValue<T>[] | [EntityData<T>] {
    if (!meta.constructorParams) {
      return [data];
    }

    return meta.constructorParams.map(k => {
      const prop = meta.properties[k as EntityKey<T>];
      const value = data[k as EntityKey<T>];

      if (prop && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) && value) {
        const pk = Reference.unwrapReference<any>(value);
        const entity = this.unitOfWork.getById(prop.targetMeta!.class, pk, options.schema, true) as T[keyof T];

        if (entity) {
          return entity;
        }

        if (Utils.isEntity<T>(value)) {
          return value;
        }

        const nakedPk = Utils.extractPK(value, prop.targetMeta, true);

        if (Utils.isObject(value) && !nakedPk) {
          return this.create(prop.targetMeta!.class, value, options);
        }

        const { newEntity, initialized, ...rest } = options;
        const target = this.createReference(prop.targetMeta!.class, nakedPk, rest);

        return Reference.wrapReference(target, prop);
      }

      if (prop?.kind === ReferenceKind.EMBEDDED && value) {
        /* v8 ignore next */
        if (Utils.isEntity<T>(value)) {
          return value;
        }

        return this.createEmbeddable(prop.targetMeta!.class, value, options);
      }

      if (!prop) {
        const tmp = { ...data };

        for (const prop of meta.props) {
          if (!options.convertCustomTypes || !prop.customType || tmp[prop.name] == null) {
            continue;
          }

          if (
            [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) &&
            Utils.isPlainObject(tmp[prop.name]) &&
            !Utils.extractPK(tmp[prop.name], prop.targetMeta, true)
          ) {
            tmp[prop.name] = Reference.wrapReference(
              this.create(prop.targetMeta!.class, tmp[prop.name]!, options),
              prop,
            );
          } else if (prop.kind === ReferenceKind.SCALAR) {
            tmp[prop.name] = prop.customType.convertToJSValue(tmp[prop.name], this.#platform);
          }
        }

        return tmp;
      }

      if (options.convertCustomTypes && prop.customType && value != null) {
        return prop.customType.convertToJSValue(value, this.#platform);
      }

      return value;
    }) as EntityValue<T>[];
  }

  private get unitOfWork() {
    return this.#em.getUnitOfWork(false);
  }
}
