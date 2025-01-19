import type {
  AnyEntity,
  Dictionary,
  EntityData,
  EntityDTO,
  EntityKey,
  EntityValue,
  FilterKey,
  FilterQuery,
  Loaded,
  LoadedCollection,
  Populate,
  Primary,
} from "../typings";
import { ArrayCollection } from "./ArrayCollection";
import { DataloaderUtils, Utils } from "../utils";
import { ValidationError } from "../errors";
import { type QueryOrderMap, ReferenceKind, DataloaderType } from "../enums";
import { Reference } from "./Reference";
import type { Transaction } from "../connections/Connection";
import type {
  FindOptions,
  CountOptions,
  LoadHint,
} from "../drivers/IDatabaseDriver";
import { helper } from "./wrap";
import type { EntityLoaderOptions } from "./EntityLoader";

export interface MatchingOptions<T extends object, P extends string = never>
  extends FindOptions<T, P> {
  where?: FilterQuery<T>;
  store?: boolean;
  ctx?: Transaction;
}

export class Collection<
  T extends object,
  O extends object = object
> extends ArrayCollection<T, O> {
  private cachedOptions = new Map<string, InitCollectionOptions<any, any>>();
  private inMemoryAdded = new Map<string, T>();
  private readonly?: boolean;
  private _populated?: boolean;
  private _em?: unknown;
  // this is for some reason needed for TS, otherwise it can fail with `Type instantiation is excessively deep and possibly infinite.`
  private _snapshot?: T[];

  constructor(owner: O, items?: T[], initialized = true) {
    super(owner as unknown as O & AnyEntity, items);
    this.initialized = !!items || initialized;
  }

  /**
   * Creates new Collection instance, assigns it to the owning entity and sets the items to it (propagating them to their inverse sides)
   */
  static create<T extends object, O extends object = object>(
    owner: O,
    prop: EntityKey<O>,
    items: undefined | T[],
    initialized: boolean
  ): Collection<T, O> {
    const coll = new Collection<T, O>(owner, undefined, initialized);
    coll.property = helper(owner).__meta.properties[prop as EntityKey] as any;
    owner[prop] = coll as EntityValue<O>;

    if (items) {
      coll.set(items);
    }

    return coll;
  }

  async get<TT extends T, P extends string = never>(
    options?: InitCollectionOptions<TT, P>
  ): Promise<Loaded<TT, P>[]> {
    if (!options && this.cachedOptions.size > 0) {
      return [...this.inMemoryAdded.values()] as Loaded<TT, P>[];
    }

    if (options && options.refresh) {
      return this.loadItems(options);
    }

    const sortedOptions = options ? this.sortObjectKeys(options) : {};
    const optionsKey = JSON.stringify(sortedOptions);
    let freshResults: T[] = [];

    if (!this.cachedOptions.has(optionsKey)) {
      this.cachedOptions.set(optionsKey, sortedOptions);
      freshResults = (await this.loadItems({
        ...options,
        refresh: true,
      })) as T[];

      if (freshResults.length > 0) {
        for (const item of freshResults) {
          this._add(item);
        }
      }
    }

    return [...this.inMemoryAdded.values()] as Loaded<TT, P>[];
  }

  private _add(item: T): void {
    if (Array.isArray(item)) {
      item.forEach((i) => this._add(i));
      return;
    }

    const inMemoryAddedKeyOfItem = this.sortObjectKeys(
      (item as any).__helper.__primaryKeys
    );

    if (!this.inMemoryAdded.has(inMemoryAddedKeyOfItem)) {
      this.inMemoryAdded.set(inMemoryAddedKeyOfItem, item);
    }
  }

  /**
   * Ensures the collection is loaded first (without reloading it if it already is loaded).
   * Returns the Collection instance (itself), works the same as `Reference.load()`.
   */
  async load<TT extends T, P extends string = never>(
    options: InitCollectionOptions<TT, P> = {}
  ): Promise<LoadedCollection<Loaded<TT, P>>> {
    if (this.isInitialized(true) && !options.refresh) {
      const em = this.getEntityManager(this.items, false);
      await em?.populate(this.items, options.populate as any, options as any);
      this.setSerializationContext(options);
    } else {
      await this.init({ refresh: false, ...options });
    }

    return this as unknown as LoadedCollection<Loaded<TT, P>>;
  }

  private setSerializationContext<TT extends T>(
    options: LoadHint<TT, any, any, any>
  ): void {
    helper(this.owner).setSerializationContext({
      populate: Array.isArray(options.populate)
        ? (options.populate.map(
            (hint) => `${this.property.name}.${hint}`
          ) as any)
        : options.populate ?? [this.property.name],
    });
  }

  /**
   * Initializes the collection and returns the items
   */
  async loadItems<TT extends T, P extends string = never>(
    options?: InitCollectionOptions<TT, P>
  ): Promise<Loaded<TT, P>[]> {
    await this.load(options);
    return super.getItems() as Loaded<TT, P>[];
  }

  /**
   * Gets the count of collection items from database instead of counting loaded items.
   * The value is cached (unless you use the `where` option), use `refresh: true` to force reload it.
   */
  override async loadCount(
    options: LoadCountOptions<T> | boolean = {}
  ): Promise<number> {
    options = typeof options === "boolean" ? { refresh: options } : options;
    const { refresh, where, ...countOptions } = options;

    if (!refresh && !where && Utils.isDefined(this._count)) {
      return this._count!;
    }

    const em = this.getEntityManager()!;

    if (
      !em.getPlatform().usesPivotTable() &&
      this.property.kind === ReferenceKind.MANY_TO_MANY &&
      this.property.owner
    ) {
      return (this._count = this.length);
    }

    const cond = this.createLoadCountCondition(where ?? ({} as FilterQuery<T>));
    const count = await em.count(this.property.type, cond, countOptions as any);

    if (!where) {
      this._count = count;
    }

    return count;
  }

  async matching<TT extends T, P extends string = never>(
    options: MatchingOptions<T, P>
  ): Promise<Loaded<TT, P>[]> {
    const em = this.getEntityManager()!;
    const { where, ctx, ...opts } = options;
    opts.orderBy = this.createOrderBy(opts.orderBy);
    let items: Loaded<TT, P>[];

    if (
      this.property.kind === ReferenceKind.MANY_TO_MANY &&
      em.getPlatform().usesPivotTable()
    ) {
      const cond = (await em.applyFilters(
        this.property.type,
        where,
        options.filters ?? {},
        "read"
      )) as FilterQuery<T>;
      const map = await em
        .getDriver()
        .loadFromPivotTable(
          this.property,
          [helper(this.owner).__primaryKeys],
          cond,
          opts.orderBy,
          ctx,
          options
        );
      items = map[helper(this.owner).getSerializedPrimaryKey()].map(
        (item: EntityData<TT>) =>
          em.merge(this.property.type, item, { convertCustomTypes: true })
      ) as any;
    } else {
      items = (await em.find(
        this.property.type,
        this.createCondition(where),
        opts as any
      )) as any;
    }

    if (options.store) {
      this.hydrate(items, true);
      this.setSerializationContext(options);
      this.populated();
      this.readonly = true;
    }

    return items;
  }

  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item));
    }

    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = this.sortObjectKeys(obj[key]);
        return result;
      }, {});
  }

  /**
   * Returns the items (the collection must be initialized)
   */
  override getItems(check = true): T[] {
    if (check) {
      this.checkInitialized();
    }

    return super.getItems();
  }

  override toJSON<TT extends T>(): EntityDTO<TT>[] {
    if (!this.isInitialized()) {
      return [];
    }

    return super.toJSON() as unknown as EntityDTO<TT>[];
  }

  override add<TT extends T>(
    entity: TT | Reference<TT> | Iterable<TT | Reference<TT>>,
    ...entities: (TT | Reference<TT>)[]
  ): void {
    entities = Utils.asArray(entity).concat(entities);

    entities.forEach((e) => this._add(e as T));

    const unwrapped = entities.map((i) => Reference.unwrapReference(i)) as T[];
    unwrapped.forEach((entity) => this.validateItemType(entity));
    this.modify("add", unwrapped);
    this.cancelOrphanRemoval(unwrapped);
  }

  /**
   * @inheritDoc
   */
  override remove<TT extends T>(
    entity:
      | TT
      | Reference<TT>
      | Iterable<TT | Reference<TT>>
      | ((item: TT) => boolean),
    ...entities: (TT | Reference<TT>)[]
  ): void {
    if (entity instanceof Function) {
      for (const item of this.items) {
        if (entity(item as TT)) {
          this._delete(e as T);
          this.remove(item);
        }
      }

      return;
    }

    entities = Utils.asArray(entity).concat(entities);
    entities.forEach((e) => this._delete(e as T));
    const unwrapped = entities.map((i) => Reference.unwrapReference(i)) as T[];
    this.modify("remove", unwrapped);
    const em = this.getEntityManager(unwrapped, false);

    if (this.property.orphanRemoval && em) {
      for (const item of unwrapped) {
        em.getUnitOfWork().scheduleOrphanRemoval(item);
      }
    }
  }

  private _delete(item: T) {
    const inMemoryAddedKeyOfItem = this.sortObjectKeys(
      (item as any).__helper.__primaryKeys
    );
    this.inMemoryAdded.delete(inMemoryAddedKeyOfItem);
  }

  override contains<TT extends T>(
    item: TT | Reference<TT>,
    check = true
  ): boolean {
    if (check) {
      this.checkInitialized();
    }

    return super.contains(item as T);
  }

  override count(): number {
    this.checkInitialized();
    return super.count();
  }

  override isEmpty(): boolean {
    this.checkInitialized();
    return super.isEmpty();
  }

  /**
   * @inheritDoc
   */
  override slice(start?: number, end?: number): T[] {
    this.checkInitialized();
    return super.slice(start, end);
  }

  /**
   * @inheritDoc
   */
  override exists(cb: (item: T) => boolean): boolean {
    this.checkInitialized();
    return super.exists(cb);
  }

  /**
   * @inheritDoc
   */
  override find(cb: (item: T, index: number) => boolean): T | undefined {
    this.checkInitialized();
    return super.find(cb);
  }

  /**
   * @inheritDoc
   */
  override filter(cb: (item: T, index: number) => boolean): T[] {
    this.checkInitialized();
    return super.filter(cb);
  }

  /**
   * @inheritDoc
   */
  override map<R>(mapper: (item: T, index: number) => R): R[] {
    this.checkInitialized();
    return super.map(mapper);
  }

  /**
   * @inheritDoc
   */
  override indexBy<K1 extends keyof T, K2 extends keyof T = never>(
    key: K1
  ): Record<T[K1] & PropertyKey, T>;

  /**
   * @inheritDoc
   */
  override indexBy<K1 extends keyof T, K2 extends keyof T = never>(
    key: K1,
    valueKey: K2
  ): Record<T[K1] & PropertyKey, T[K2]>;

  /**
   * @inheritDoc
   */
  override indexBy<K1 extends keyof T, K2 extends keyof T = never>(
    key: K1,
    valueKey?: K2
  ): Record<T[K1] & PropertyKey, T> | Record<T[K1] & PropertyKey, T[K2]> {
    this.checkInitialized();
    return super.indexBy(key, valueKey as never);
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

  async init<TT extends T, P extends string = never>(
    options: InitCollectionOptions<TT, P> = {}
  ): Promise<LoadedCollection<Loaded<TT, P>>> {
    if (this.dirty) {
      const items = [...this.items];
      this.dirty = false;
      await this.init(options);
      items.forEach((i) => this.add(i));

      return this as unknown as LoadedCollection<Loaded<TT, P>>;
    }

    const em = this.getEntityManager()!;

    if (
      options.dataloader ??
      [DataloaderType.ALL, DataloaderType.COLLECTION].includes(
        DataloaderUtils.getDataloaderType(em.config.get("dataloader"))
      )
    ) {
      const order = [...this.items]; // copy order of references
      const customOrder = !!options.orderBy;
      // eslint-disable-next-line dot-notation
      const items: TT[] = await em["colLoader"].load([this, options]);

      if (!customOrder) {
        this.reorderItems(items, order);
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
      ? options.populate.map((f) =>
          f === "*" ? f : `${this.property.name}.${f}`
        )
      : [`${this.property.name}${options.ref ? ":ref" : ""}`];
    const schema =
      this.property.targetMeta!.schema === "*"
        ? helper(this.owner).__schema
        : undefined;
    await em.populate(this.owner as TT[], populate, {
      refresh: true,
      ...options,
      connectionType: options.connectionType,
      schema,
      where: { [this.property.name]: options.where } as FilterQuery<TT>,
      orderBy: { [this.property.name]: options.orderBy } as QueryOrderMap<TT>,
    });

    return this as unknown as LoadedCollection<Loaded<TT, P>>;
  }

  private getEntityManager(items: Iterable<T> = [], required = true) {
    const wrapped = helper(this.owner);
    let em = (this._em ?? wrapped.__em) as typeof wrapped.__em;

    if (!em) {
      for (const i of items) {
        if (i && helper(i).__em) {
          em = helper(i).__em;
          break;
        }
      }
    }

    if (em) {
      Object.defineProperty(this, "_em", { value: em });
    }

    if (!em && required) {
      throw ValidationError.entityNotManaged(this.owner);
    }

    return em;
  }

  private createCondition<TT extends T>(
    cond: FilterQuery<TT> = {}
  ): FilterQuery<TT> {
    if (this.property.kind === ReferenceKind.ONE_TO_MANY) {
      cond[this.property.mappedBy as unknown as FilterKey<TT>] = helper(
        this.owner
      ).getPrimaryKey() as any;
    } else {
      // MANY_TO_MANY
      this.createManyToManyCondition(cond);
    }

    return cond;
  }

  private createOrderBy<TT extends T>(
    orderBy: QueryOrderMap<TT> | QueryOrderMap<TT>[] = []
  ): QueryOrderMap<TT>[] {
    if (Utils.isEmpty(orderBy) && this.property.orderBy) {
      orderBy = this.property.orderBy;
    }

    return Utils.asArray(orderBy);
  }

  private createManyToManyCondition<TT extends T>(cond: FilterQuery<TT>) {
    const dict = cond as Dictionary;

    if (this.property.owner || this.property.pivotTable) {
      // we know there is at least one item as it was checked in load method
      const pk = this.property.targetMeta!.primaryKeys[0];
      dict[pk] = { $in: [] };
      this.items.forEach((item) =>
        dict[pk].$in.push(helper(item).getPrimaryKey())
      );
    } else {
      dict[this.property.mappedBy] = helper(this.owner).getPrimaryKey();
    }
  }

  private createLoadCountCondition(cond: FilterQuery<T>) {
    const wrapped = helper(this.owner);
    const val = wrapped.__meta.compositePK
      ? { $in: wrapped.__primaryKeys }
      : wrapped.getPrimaryKey();
    const dict = cond as Dictionary;

    if (this.property.kind === ReferenceKind.ONE_TO_MANY) {
      dict[this.property.mappedBy] = val;
    } else {
      const key = this.property.owner
        ? this.property.inversedBy
        : this.property.mappedBy;
      dict[key] = val;
    }

    return cond;
  }

  private modify(method: "add" | "remove", items: T[]): void {
    if (method === "remove") {
      this.checkInitialized();
    }

    this.validateModification(items);
    super[method](items);
    this.setDirty();
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(
        `Collection<${this.property.type}> of entity ${
          this.owner.constructor.name
        }[${helper(this.owner).getSerializedPrimaryKey()}] not initialized`
      );
    }
  }

  /**
   * re-orders items after searching with `$in` operator
   */
  private reorderItems(items: T[], order: T[]): void {
    if (
      this.property.kind === ReferenceKind.MANY_TO_MANY &&
      this.property.owner
    ) {
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

  private validateItemType(item: T | Primary<T> | EntityData<T>): void {
    if (!Utils.isEntity(item)) {
      throw ValidationError.notEntity(this.owner, this.property, item);
    }
  }

  private validateModification(items: T[]): void {
    if (this.readonly) {
      throw ValidationError.cannotModifyReadonlyCollection(
        this.owner,
        this.property
      );
    }

    // currently we allow persisting to inverse sides only in SQL drivers
    if (this.property.pivotTable || !this.property.mappedBy) {
      return;
    }

    const check = (item: AnyEntity) => {
      if (!item || helper(item).__initialized) {
        return false;
      }

      return (
        !item[this.property.mappedBy] &&
        this.property.kind === ReferenceKind.MANY_TO_MANY
      );
    };

    // throw if we are modifying inverse side of M:N collection when owning side is initialized (would be ignored when persisting)
    if (items.find((item) => check(item))) {
      throw ValidationError.cannotModifyInverseCollection(
        this.owner,
        this.property
      );
    }
  }
}

Object.defineProperties(Collection.prototype, {
  $: {
    get() {
      return this;
    },
  },
  get: {
    get() {
      return () => this;
    },
  },
});

export interface InitCollectionOptions<
  T,
  P extends string = never,
  F extends string = "*",
  E extends string = never
> extends EntityLoaderOptions<T, F, E> {
  dataloader?: boolean;
  populate?: Populate<T, P>;
  ref?: boolean; // populate only references, works only with M:N collections that use pivot table
}

export interface LoadCountOptions<T extends object>
  extends CountOptions<T, "*"> {
  refresh?: boolean;
  where?: FilterQuery<T>;
}
