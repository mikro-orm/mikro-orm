import type {
  AnyEntity,
  Dictionary,
  EntityData,
  EntityDTO,
  EntityKey,
  EntityProperty,
  EntityValue,
  FilterKey,
  FilterQuery,
  IPrimaryKey,
  Loaded,
  LoadedCollection,
  Populate,
  Primary,
} from '../typings.js';
import { Utils } from '../utils/Utils.js';
import { MetadataError, ValidationError } from '../errors.js';
import { DataloaderType, type QueryOrderMap, ReferenceKind } from '../enums.js';
import { Reference } from './Reference.js';
import type { Transaction } from '../connections/Connection.js';
import type { CountOptions, FindOptions, LoadHint } from '../drivers/IDatabaseDriver.js';
import { helper, wrap } from './wrap.js';
import type { EntityLoaderOptions } from './EntityLoader.js';
import { QueryHelper } from '../utils/QueryHelper.js';
import { Raw } from '../utils/RawQueryFragment.js';
import { inspect } from '../logging/inspect.js';

export interface MatchingOptions<T extends object, P extends string = never> extends FindOptions<T, P> {
  where?: FilterQuery<T>;
  store?: boolean;
  ctx?: Transaction;
}

export class Collection<T extends object, O extends object = object> {

  [k: number]: T;

  protected readonly items = new Set<T>();
  protected initialized = true;
  protected dirty = false;
  protected partial = false; // mark partially loaded collections, propagation is disabled for those
  protected snapshot: T[] | undefined = []; // used to create a diff of the collection at commit time, undefined marks overridden values so we need to wipe when flushing
  private readonly?: boolean;
  protected _count?: number;
  private _property?: EntityProperty;
  private _populated?: boolean;

  constructor(readonly owner: O, items?: T[], initialized = true) {
    /* v8 ignore next */
    if (items) {
      let i = 0;
      this.items = new Set(items);
      this.items.forEach(item => this[i++] = item);
    }

    this.initialized = !!items || initialized;
  }

  /**
   * Creates new Collection instance, assigns it to the owning entity and sets the items to it (propagating them to their inverse sides)
   */
  static create<T extends object, O extends object = object>(owner: O, prop: EntityKey<O>, items: undefined | T[], initialized: boolean): Collection<T, O> {
    const coll = new Collection<T, O>(owner, undefined, initialized);
    coll.property = helper(owner).__meta.properties[prop as EntityKey] as any;
    owner[prop] = coll as EntityValue<O>;

    if (items) {
      coll.set(items);
    }

    return coll;
  }

  /**
   * Ensures the collection is loaded first (without reloading it if it already is loaded).
   * Returns the Collection instance (itself), works the same as `Reference.load()`.
   */
  async load<TT extends T, P extends string = never>(options: InitCollectionOptions<TT, P> = {}): Promise<LoadedCollection<Loaded<TT, P>>> {
    if (this.isInitialized(true) && !options.refresh) {
      const em = this.getEntityManager(this.items, false);
      options = { ...options, filters: QueryHelper.mergePropertyFilters(this.property.filters, options.filters)! };
      await em?.populate(this.items, options.populate as any, options as any);
      this.setSerializationContext(options);
    } else {
      await this.init({ refresh: false, ...options });
    }

    return this as unknown as LoadedCollection<Loaded<TT, P>>;
  }

  private setSerializationContext<TT extends T>(options: LoadHint<TT, any, any, any>): void {
    helper(this.owner).setSerializationContext({
      populate: Array.isArray(options.populate)
        ? options.populate.map(hint => `${this.property.name}.${hint}`) as any
        : options.populate ?? [this.property.name],
    });
  }

  /**
   * Initializes the collection and returns the items
   */
  async loadItems<TT extends T, P extends string = never>(options?: InitCollectionOptions<TT, P>): Promise<Loaded<TT, P>[]> {
    await this.load(options);
    return this.getItems(false) as Loaded<TT, P>[];
  }

  /**
   * Gets the count of collection items from database instead of counting loaded items.
   * The value is cached (unless you use the `where` option), use `refresh: true` to force reload it.
   */
  async loadCount(options: LoadCountOptions<T> | boolean = {}): Promise<number> {
    options = typeof options === 'boolean' ? { refresh: options } : options;
    const { refresh, where, ...countOptions } = options;

    if (!refresh && !where && this._count != null) {
      return this._count!;
    }

    const em = this.getEntityManager()!;

    if (!em.getPlatform().usesPivotTable() && this.property.kind === ReferenceKind.MANY_TO_MANY && this.property.owner) {
      return this._count = this.length;
    }

    const cond = this.createLoadCountCondition(where ?? {} as FilterQuery<T>);
    const count = await em.count(this.property.targetMeta!.class, cond, countOptions as any);

    if (!where) {
      this._count = count;
    }

    return count;
  }

  async matching<TT extends T, P extends string = never>(options: MatchingOptions<T, P>): Promise<Loaded<TT, P>[]> {
    const em = this.getEntityManager()!;
    const { where, ctx, ...opts } = options;
    let items: Loaded<TT, P>[];

    if (this.property.kind === ReferenceKind.MANY_TO_MANY && em.getPlatform().usesPivotTable()) {
      // M:N via pivot table bypasses em.find(), so merge all 3 levels here
      opts.orderBy = QueryHelper.mergeOrderBy(opts.orderBy, this.property.orderBy, this.property.targetMeta?.orderBy);
      options.populate = await em.preparePopulate(this.property.targetMeta!.class, options) as any;
      const cond = await em.applyFilters(this.property.targetMeta!.class, where, options.filters ?? {}, 'read') as FilterQuery<T>;
      const map = await em.getDriver().loadFromPivotTable(this.property, [helper(this.owner).__primaryKeys], cond, opts.orderBy, ctx, options);
      items = map[helper(this.owner).getSerializedPrimaryKey()].map((item: EntityData<TT>) => em.merge(this.property.targetMeta!.class, item, { convertCustomTypes: true })) as any;
      await em.populate(items, options.populate as any, options as any);
    } else {
      // em.find() merges entity-level orderBy, so only merge runtime + relation here
      opts.orderBy = QueryHelper.mergeOrderBy(opts.orderBy, this.property.orderBy);
      items = await em.find(this.property.targetMeta!.class, this.createCondition(where), opts as any) as any;
    }

    if (options.store) {
      this.hydrate(items, true);
      this.setSerializationContext(options);
      this.populated();
      this.readonly = true;
    }

    return items;
  }

  /**
   * Returns the items (the collection must be initialized)
   */
  getItems(check = true): T[] {
    if (check) {
      this.checkInitialized();
    }

    return [...this.items];
  }

  toJSON<TT extends T>(): EntityDTO<TT>[] {
    if (!this.isInitialized()) {
      return [];
    }

    return this.toArray();
  }

  add<TT extends T>(entity: TT | Reference<TT> | Iterable<TT | Reference<TT>>, ...entities: (TT | Reference<TT>)[]): number {
    entities = Utils.asArray(entity).concat(entities);
    const unwrapped = entities.map(i => Reference.unwrapReference(i)) as T[];
    this.validateModification(unwrapped);
    const em = this.getEntityManager(entities as T[], false);
    let added = 0;

    for (const item of entities) {
      const entity = Reference.unwrapReference(item) as T;

      if (!this.contains(entity, false)) {
        this.incrementCount(1);
        this[this.items.size] = entity;
        this.items.add(entity);
        added++;
        this.dirty = true;
        this.propagate(entity, 'add');
      }
    }

    if (this.property.kind === ReferenceKind.ONE_TO_MANY && em) {
      em.persist(entities);
    }

    this.cancelOrphanRemoval(unwrapped);

    return added;
  }

  /**
   * Remove specified item(s) from the collection. Note that removing item from collection does not necessarily imply deleting the target entity,
   * it means we are disconnecting the relation - removing items from collection, not removing entities from database - `Collection.remove()`
   * is not the same as `em.remove()`. If we want to delete the entity by removing it from collection, we need to enable `orphanRemoval: true`,
   * which tells the ORM we don't want orphaned entities to exist, so we know those should be removed.
   */
  remove<TT extends T>(entity: TT | Reference<TT> | Iterable<TT | Reference<TT>> | ((item: TT) => boolean), ...entities: (TT | Reference<TT>)[]): number {
    if (entity instanceof Function) {
      let removed = 0;

      for (const item of this.items) {
        if (entity(item as TT)) {
          removed += this.remove(item);
        }
      }

      return removed;
    }

    this.checkInitialized();
    entities = Utils.asArray(entity).concat(entities);
    const unwrapped = entities.map(i => Reference.unwrapReference(i)) as T[];
    this.validateModification(unwrapped);
    const em = this.getEntityManager(entities as T[], false);
    let removed = 0;

    for (const item of entities) {
      if (!item) {
        continue;
      }

      const entity = Reference.unwrapReference(item) as T;

      if (this.items.delete(entity)) {
        this.incrementCount(-1);
        delete this[this.items.size]; // remove last item
        this.propagate(entity, 'remove');
        removed++;
        this.dirty = true;
      }

      if (this.property.orphanRemoval && em) {
        em.getUnitOfWork().scheduleOrphanRemoval(entity);
      }
    }

    if (this.property.kind === ReferenceKind.ONE_TO_MANY && !this.property.orphanRemoval && em) {
      em.persist(entities);
    }

    if (removed > 0) {
      Object.assign(this, [...this.items]); // reassign array access
    }

    return removed;
  }

  contains<TT extends T>(item: TT | Reference<TT>, check = true): boolean {
    if (check) {
      this.checkInitialized();
    }

    const entity = Reference.unwrapReference(item) as T;
    return this.items.has(entity);
  }

  count(): number {
    this.checkInitialized();
    return this.items.size;
  }

  isEmpty(): boolean {
    this.checkInitialized();
    return this.count() === 0;
  }

  shouldPopulate(populated?: boolean): boolean {
    if (!this.isInitialized(true)) {
      return false;
    }

    if (this._populated != null) {
      return this._populated;
    }

    return !!populated;
  }

  populated(populated: boolean | undefined = true): void {
    this._populated = populated;
  }

  async init<TT extends T, P extends string = never>(options: InitCollectionOptions<TT, P> = {}): Promise<LoadedCollection<Loaded<TT, P>>> {
    if (this.dirty) {
      const items = [...this.items];
      this.dirty = false;
      await this.init(options);
      items.forEach(i => this.add(i));

      return this as unknown as LoadedCollection<Loaded<TT, P>>;
    }

    const em = this.getEntityManager()!;
    options = { ...options, filters: QueryHelper.mergePropertyFilters(this.property.filters, options.filters)! };

    if (options.dataloader ?? [DataloaderType.ALL, DataloaderType.COLLECTION].includes(em.config.getDataloaderType())) {
      const order = [...this.items]; // copy order of references
      const orderBy = QueryHelper.mergeOrderBy(options.orderBy, this.property.orderBy, this.property.targetMeta?.orderBy);
      const customOrder = orderBy.length > 0;
      const pivotTable = this.property.kind === ReferenceKind.MANY_TO_MANY && em.getPlatform().usesPivotTable();
      const loader = await em.getDataLoader(pivotTable ? 'm:n' : '1:m');
      const items: TT[] = await loader.load([this, { ...options, orderBy }]);

      if (this.property.kind === ReferenceKind.MANY_TO_MANY) {
        this.initialized = true;
        this.dirty = false;

        if (!customOrder) {
          this.reorderItems(items, order);
        }

        return this as unknown as LoadedCollection<Loaded<TT, P>>;
      }

      this.items.clear();
      let i = 0;

      for (const item of items) {
        this.items.add(item);
        this[i++] = item;
      }

      this.initialized = true;
      this.dirty = false;

      return this as unknown as LoadedCollection<Loaded<TT, P>>;
    }

    const populate = Array.isArray(options.populate)
      ? options.populate.map(f => f === '*' ? f : `${this.property.name}.${f}`)
      : [`${this.property.name}${options.ref ? ':ref' : ''}`];
    const schema = this.property.targetMeta!.schema === '*'
      ? helper(this.owner).__schema
      : undefined;
    await em.populate(this.owner as TT[], populate, {
      refresh: true,
      ...options,
      connectionType: options.connectionType,
      schema,
      where: { [this.property.name]: options.where },
      orderBy: { [this.property.name]: options.orderBy },
    } as any);

    return this as unknown as LoadedCollection<Loaded<TT, P>>;
  }

  private getEntityManager(items: Iterable<T> = [], required = true) {
    const wrapped = helper(this.owner);
    let em = wrapped.__em;

    if (!em) {
      for (const i of items) {
        if (i && helper(i).__em) {
          em = helper(i).__em;
          break;
        }
      }
    }

    if (!em && required) {
      throw ValidationError.entityNotManaged(this.owner);
    }

    return em;
  }

  private createCondition<TT extends T>(cond: FilterQuery<TT> = {}): FilterQuery<TT> {
    if (this.property.kind === ReferenceKind.ONE_TO_MANY) {
      cond[this.property.mappedBy as unknown as FilterKey<TT>] = helper(this.owner).getPrimaryKey() as any;
    } else { // MANY_TO_MANY
      this.createManyToManyCondition(cond);
    }

    return cond;
  }

  private createManyToManyCondition<TT extends T>(cond: FilterQuery<TT>) {
    const dict = cond as Dictionary;

    if (this.property.owner || this.property.pivotTable) {
      // we know there is at least one item as it was checked in load method
      const pk = this.property.targetMeta!.primaryKeys[0];
      dict[pk] = { $in: [] };
      this.items.forEach(item => dict[pk].$in.push(helper(item).getPrimaryKey()));
    } else {
      dict[this.property.mappedBy] = helper(this.owner).getPrimaryKey();
    }
  }

  private createLoadCountCondition(cond: FilterQuery<T>) {
    const wrapped = helper(this.owner);
    const val = wrapped.__meta.compositePK ? { $in: wrapped.__primaryKeys } : wrapped.getPrimaryKey();
    const dict = cond as Dictionary;

    if (this.property.kind === ReferenceKind.ONE_TO_MANY) {
      dict[this.property.mappedBy] = val;
    } else {
      const key = this.property.owner ? this.property.inversedBy : this.property.mappedBy;
      dict[key] = val;
    }

    return cond;
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Collection<${this.property.type}> of entity ${helper(this.owner).__meta.name}[${helper(this.owner).getSerializedPrimaryKey()}] not initialized`);
    }
  }

  /**
   * re-orders items after searching with `$in` operator
   */
  private reorderItems(items: T[], order: T[]): void {
    if (this.property.kind === ReferenceKind.MANY_TO_MANY && this.property.owner) {
      items.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
  }

  private cancelOrphanRemoval(items: T[]): void {
    const em = this.getEntityManager(items, false);

    if (!em) {
      return;
    }

    for (const item of items) {
      em!.getUnitOfWork().cancelOrphanRemoval(item);
    }
  }

  private validateModification(items: T[]): void {
    if (this.readonly) {
      throw ValidationError.cannotModifyReadonlyCollection(this.owner, this.property);
    }

    const check = (item: AnyEntity) => {
      if (!item) {
        return false;
      }

      if (!Utils.isEntity(item)) {
        throw ValidationError.notEntity(this.owner, this.property, item);
      }

      // currently we allow persisting to inverse sides only in SQL drivers
      if (this.property.pivotTable || !this.property.mappedBy) {
        return false;
      }

      if (helper(item).__initialized) {
        return false;
      }

      return !item[this.property.mappedBy] && this.property.kind === ReferenceKind.MANY_TO_MANY;
    };

    // throw if we are modifying inverse side of M:N collection when owning side is initialized (would be ignored when persisting)
    if (items.some(item => check(item))) {
      throw ValidationError.cannotModifyInverseCollection(this.owner, this.property);
    }
  }

  toArray<TT extends T>(): EntityDTO<TT>[] {
    if (this.items.size === 0) {
      return [];
    }

    return this.map(item => wrap(item as TT).toJSON());
  }

  getIdentifiers<U extends IPrimaryKey = Primary<T> & IPrimaryKey>(field?: string | string[]): U[] {
    const items = this.getItems();
    const targetMeta = this.property.targetMeta!;

    if (items.length === 0) {
      return [];
    }

    field ??= targetMeta.compositePK ? targetMeta.primaryKeys : (targetMeta.serializedPrimaryKey ?? targetMeta.primaryKeys[0]);

    const cb = (i: T, f: keyof T) => {
      if (Utils.isEntity(i[f], true)) {
        return wrap(i[f]!, true).getPrimaryKey();
      }

      return i[f] as U;
    };

    return items.map(i => {
      if (Array.isArray(field)) {
        return field.map(f => cb(i, f as keyof T));
      }

      return cb(i, field as keyof T);
    }) as U[];
  }

  /**
   * @internal
   */
  addWithoutPropagation(entity: T): void {
    if (!this.contains(entity, false)) {
      this.incrementCount(1);
      this[this.items.size] = entity;
      this.items.add(entity);
      this.dirty = true;
    }
  }

  set(items: Iterable<T | Reference<T>>): void {
    if (!this.initialized) {
      this.initialized = true;
      this.snapshot = undefined;
    }

    if (this.compare(Utils.asArray(items).map(item => Reference.unwrapReference(item)))) {
      return;
    }

    this.remove(this.items);
    this.add(items);
  }

  private compare(items: T[]): boolean {
    if (items.length !== this.items.size) {
      return false;
    }

    let idx = 0;

    for (const item of this.items) {
      if (item !== items[idx++]) {
        return false;
      }
    }

    return true;
  }

  /**
   * @internal
   */
  hydrate(items: T[], forcePropagate?: boolean, partial?: boolean): void {
    for (let i = 0; i < this.items.size; i++) {
      delete this[i];
    }

    this.initialized = true;
    this.partial = !!partial;
    this.items.clear();
    this._count = 0;
    this.add(items);
    this.takeSnapshot(forcePropagate);
  }

  /**
   * Remove all items from the collection. Note that removing items from collection does not necessarily imply deleting the target entity,
   * it means we are disconnecting the relation - removing items from collection, not removing entities from database - `Collection.remove()`
   * is not the same as `em.remove()`. If we want to delete the entity by removing it from collection, we need to enable `orphanRemoval: true`,
   * which tells the ORM we don't want orphaned entities to exist, so we know those should be removed.
   */
  removeAll(): void {
    if (!this.initialized) {
      this.initialized = true;
      this.snapshot = undefined;
    }

    this.remove(this.items);
    this.dirty = true;
  }

  /**
   * @internal
   */
  removeWithoutPropagation(entity: T): void {
    if (!this.items.delete(entity)) {
      return;
    }

    this.incrementCount(-1);
    delete this[this.items.size];
    Object.assign(this, [...this.items]);
    this.dirty = true;
  }

  /**
   * Extracts a slice of the collection items starting at position start to end (exclusive) of the collection.
   * If end is null it returns all elements from start to the end of the collection.
   */
  slice(start = 0, end?: number): T[] {
    this.checkInitialized();
    let index = 0;
    end ??= this.items.size;
    const items: T[] = [];

    for (const item of this.items) {
      if (index === end) {
        break;
      }

      if (index >= start && index < end) {
        items.push(item);
      }

      index++;
    }

    return items;
  }

  /**
   * Tests for the existence of an element that satisfies the given predicate.
   */
  exists(cb: (item: T) => boolean): boolean {
    this.checkInitialized();

    for (const item of this.items) {
      if (cb(item)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns the first element of this collection that satisfies the predicate.
   */
  find<S extends T>(cb: (item: T, index: number) => item is S): S | undefined;

  /**
   * Returns the first element of this collection that satisfies the predicate.
   */
  find(cb: (item: T, index: number) => boolean): T | undefined;

  /**
   * Returns the first element of this collection that satisfies the predicate.
   */
  find(cb: (item: T, index: number) => boolean): T | undefined {
    this.checkInitialized();
    let index = 0;

    for (const item of this.items) {
      if (cb(item, index++)) {
        return item;
      }
    }

    return undefined;
  }

  /**
   * Extracts a subset of the collection items.
   */
  filter<S extends T>(cb: (item: T, index: number) => item is S): S[];

  /**
   * Extracts a subset of the collection items.
   */
  filter(cb: (item: T, index: number) => boolean): T[];

  /**
   * Extracts a subset of the collection items.
   */
  filter(cb: (item: T, index: number) => boolean): T[] {
    this.checkInitialized();
    const items: T[] = [];
    let index = 0;

    for (const item of this.items) {
      if (cb(item, index++)) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Maps the collection items based on your provided mapper function.
   */
  map<R>(mapper: (item: T, index: number) => R): R[] {
    this.checkInitialized();
    const items: R[] = [];
    let index = 0;

    for (const item of this.items) {
      items.push(mapper(item, index++));
    }

    return items;
  }

  /**
   * Maps the collection items based on your provided mapper function to a single object.
   */
  reduce<R>(cb: (obj: R, item: T, index: number) => R, initial = {} as R): R {
    this.checkInitialized();
    let index = 0;

    for (const item of this.items) {
      initial = cb(initial, item, index++);
    }

    return initial;
  }

  /**
   * Maps the collection items to a dictionary, indexed by the key you specify.
   * If there are more items with the same key, only the first one will be present.
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1): Record<T[K1] & PropertyKey, T>;

  /**
   * Maps the collection items to a dictionary, indexed by the key you specify.
   * If there are more items with the same key, only the first one will be present.
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1, valueKey: K2): Record<T[K1] & PropertyKey, T[K2]>;

  /**
   * Maps the collection items to a dictionary, indexed by the key you specify.
   * If there are more items with the same key, only the first one will be present.
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1, valueKey?: K2): Record<T[K1] & PropertyKey, T> | Record<T[K1] & PropertyKey, T[K2]> {
    return this.reduce((obj, item) => {
      obj[item[key] as string] ??= valueKey ? item[valueKey] : item;
      return obj;
    }, {} as any);
  }

  isInitialized(fully = false): boolean {
    if (!this.initialized || !fully) {
      return this.initialized;
    }

    for (const item of this.items) {
      if (!helper(item).__initialized) {
        return false;
      }
    }

    return true;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  isPartial(): boolean {
    return this.partial;
  }

  setDirty(dirty = true): void {
    this.dirty = dirty;
  }

  get length(): number {
    return this.count();
  }

  * [Symbol.iterator](): IterableIterator<T> {
    for (const item of this.getItems()) {
      yield item;
    }
  }

  /**
   * @internal
   */
  takeSnapshot(forcePropagate?: boolean): void {
    this.snapshot = [...this.items];
    this.dirty = false;

    if (this.property.owner || forcePropagate) {
      this.items.forEach(item => {
        this.propagate(item, 'takeSnapshot');
      });
    }
  }

  /**
   * @internal
   */
  getSnapshot() {
    return this.snapshot;
  }

  /**
   * @internal
   */
  get property(): EntityProperty { // cannot be typed to `EntityProperty<O, T>` as it causes issues in assignability of `Loaded` type
    if (!this._property) {
      const meta = wrap(this.owner, true).__meta;

      /* v8 ignore next */
      if (!meta) {
        throw MetadataError.fromUnknownEntity(this.owner.constructor.name, 'Collection.property getter, maybe you just forgot to initialize the ORM?');
      }

      this._property = meta.relations.find(prop => this.owner[prop.name] === this)!;
    }

    return this._property;
  }

  /**
   * @internal
   */
  set property(prop: EntityProperty) { // cannot be typed to `EntityProperty<O, T>` as it causes issues in assignability of `Loaded` type
    this._property = prop;
  }

  protected propagate(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    if (this.property.owner && this.property.inversedBy) {
      this.propagateToInverseSide(item, method);
    } else if (!this.property.owner && this.property.mappedBy) {
      this.propagateToOwningSide(item, method);
    }
  }

  protected propagateToInverseSide(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    const collection = item[this.property.inversedBy as keyof T] as Collection<O, T>;

    if (this.shouldPropagateToCollection(collection, method)) {
      method = method === 'takeSnapshot' ? method : (method + 'WithoutPropagation') as any;
      collection[method as 'add'](this.owner);
    }
  }

  protected propagateToOwningSide(item: T, method: 'add' | 'remove' | 'takeSnapshot'): void {
    const mappedBy = this.property.mappedBy as EntityKey<T>;
    const collection = item[mappedBy] as Collection<O, T>;

    if (this.property.kind === ReferenceKind.MANY_TO_MANY) {
      if (this.shouldPropagateToCollection(collection, method)) {
        collection[method as 'add'](this.owner);
      }
    } else if (this.property.kind === ReferenceKind.ONE_TO_MANY && method !== 'takeSnapshot') {
      const prop2 = this.property.targetMeta!.properties[mappedBy];
      const owner = prop2.mapToPk ? helper(this.owner).getPrimaryKey() : this.owner;
      const value = method === 'add' ? owner : null;

      if (this.property.orphanRemoval && method === 'remove') {
        // cache the PK before we propagate, as its value might be needed when flushing
        helper(item).__pk = helper(item).getPrimaryKey()!;
      }

      if (!prop2.nullable && prop2.deleteRule !== 'cascade' && method === 'remove') {
        if (!this.property.orphanRemoval) {
          throw ValidationError.cannotRemoveFromCollectionWithoutOrphanRemoval(this.owner, this.property);
        }

        return;
      }

      // skip if already propagated
      if (Reference.unwrapReference(item[mappedBy] as object) !== value) {
        item[mappedBy] = value as EntityValue<T>;
      }
    }
  }

  protected shouldPropagateToCollection(collection: Collection<O, T>, method: 'add' | 'remove' | 'takeSnapshot'): boolean {
    if (!collection) {
      return false;
    }

    switch (method) {
      case 'add':
        return !collection.contains(this.owner, false);
      case 'remove':
        return collection.isInitialized() && collection.contains(this.owner, false);
      case 'takeSnapshot':
        return collection.isDirty();
    }
  }

  protected incrementCount(value: number) {
    if (typeof this._count === 'number' && this.initialized) {
      this._count += value;
    }
  }

  /** @ignore */
  [Symbol.for('nodejs.util.inspect.custom')](depth = 2) {
    const object = { ...this } as Dictionary;
    const hidden = ['items', 'owner', '_property', '_count', 'snapshot', '_populated', '_lazyInitialized', '_em', 'readonly', 'partial'];
    hidden.forEach(k => delete object[k]);
    const ret = inspect(object, { depth });
    const name = `${this.constructor.name}<${this.property?.type ?? 'unknown'}>`;

    return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
  }

}

Object.defineProperties(Collection.prototype, {
  $: { get() { return this; } },
  get: { get() { return () => this; } },
  __collection: { value: true, enumerable: false, writable: false },
});

export interface InitCollectionOptions<T, P extends string = never, F extends string = '*', E extends string = never> extends EntityLoaderOptions<T, F, E>{
  dataloader?: boolean;
  populate?: Populate<T, P>;
  ref?: boolean; // populate only references, works only with M:N collections that use pivot table
}

export interface LoadCountOptions<T extends object> extends CountOptions<T, '*'> {
  refresh?: boolean;
  where?: FilterQuery<T>;
}
