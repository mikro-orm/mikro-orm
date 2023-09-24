import type {
  AnyEntity,
  EntityData,
  EntityDTO,
  EntityMetadata,
  FilterQuery,
  Loaded,
  LoadedCollection,
  Populate,
  Primary,
  ConnectionType, Dictionary, FilterKey,
} from '../typings';
import { ArrayCollection } from './ArrayCollection';
import { Utils } from '../utils/Utils';
import { ValidationError } from '../errors';
import { QueryOrder, ReferenceKind, type LockMode, type QueryOrderMap } from '../enums';
import { Reference } from './Reference';
import type { Transaction } from '../connections/Connection';
import type { FindOptions } from '../drivers/IDatabaseDriver';
import { helper } from './wrap';

export interface MatchingOptions<T extends object, P extends string = never> extends FindOptions<T, P> {
  where?: FilterQuery<T>;
  store?: boolean;
  ctx?: Transaction;
}

export class Collection<T extends object, O extends object = object> extends ArrayCollection<T, O> {

  private snapshot: T[] | undefined = []; // used to create a diff of the collection at commit time, undefined marks overridden values so we need to wipe when flushing
  private readonly?: boolean;
  private _populated = false;
  private _lazyInitialized = false;
  private _em?: unknown;

  constructor(owner: O, items?: T[], initialized = true) {
    super(owner as unknown as O & AnyEntity, items);
    this.initialized = !!items || initialized;
  }

  /**
   * Creates new Collection instance, assigns it to the owning entity and sets the items to it (propagating them to their inverse sides)
   */
  static create<T extends object, O extends object = object>(owner: O, prop: keyof O & string, items: undefined | T[], initialized: boolean): Collection<T, O> {
    const coll = new Collection<T, O>(owner, undefined, initialized);
    coll.property = helper(owner).__meta.properties[prop];
    owner[prop] = coll as unknown as O[keyof O & string];

    if (items) {
      coll.set(items);
    }

    return coll;
  }

  /**
   * Initializes the collection and returns the items
   */
  async loadItems<P extends string = never>(options?: InitOptions<T, P>): Promise<Loaded<T, P>[]> {
    if (!this.isInitialized(true)) {
      await this.init(options);
    }

    return super.getItems() as Loaded<T, P>[];
  }

  /**
   * Gets the count of collection items from database instead of counting loaded items.
   * The value is cached (unless you use the `where` option), use `refresh: true` to force reload it.
   */
  async loadCount(options: LoadCountOptions<T> | boolean = {}): Promise<number> {
    options = typeof options === 'boolean' ? { refresh: options } : options;

    if (!options.refresh && !options.where && Utils.isDefined(this._count)) {
      return this._count!;
    }

    const em = this.getEntityManager();
    const pivotMeta = em.getMetadata().find(this.property.pivotEntity)!;

    if (!em.getPlatform().usesPivotTable() && this.property.kind === ReferenceKind.MANY_TO_MANY) {
      return this._count = this.length;
    } else if (this.property.pivotTable && !(this.property.inversedBy || this.property.mappedBy)) {
      const count = await em.count(this.property.type, this.createLoadCountCondition(options.where ?? {} as FilterQuery<T>, pivotMeta), { populate: [{ field: this.property.pivotEntity }] });
      if (!options.where) {
        this._count = count;
      }
      return count;
    }
    const count = await em.count(this.property.type, this.createLoadCountCondition(options.where ?? {} as FilterQuery<T>, pivotMeta));
    if (!options.where) {
      this._count = count;
    }
    return count;
  }

  async matching<P extends string = never>(options: MatchingOptions<T, P>): Promise<Loaded<T, P>[]> {
    const em = this.getEntityManager();
    const { where, ctx, ...opts } = options;
    opts.orderBy = this.createOrderBy(opts.orderBy);
    let items: Loaded<T, P>[];

    if (this.property.kind === ReferenceKind.MANY_TO_MANY && em.getPlatform().usesPivotTable()) {
      const cond = await em.applyFilters(this.property.type, where, options.filters ?? {}, 'read');
      const map = await em.getDriver().loadFromPivotTable(this.property, [helper(this.owner).__primaryKeys], cond, opts.orderBy, ctx, options);
      items = map[helper(this.owner).getSerializedPrimaryKey()].map((item: EntityData<T>) => em.merge(this.property.type, item, { convertCustomTypes: true }));
    } else {
      items = await em.find(this.property.type, this.createCondition(where), opts);
    }

    if (options.store) {
      this.hydrate(items, true);
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

    return super.getItems();
  }

  toJSON(): EntityDTO<T>[] {
    if (!this.isInitialized()) {
      return [];
    }

    return super.toJSON();
  }

  add(entity: T | Reference<T> | (T | Reference<T>)[], ...entities: (T | Reference<T>)[]): void {
    entities = Utils.asArray(entity).concat(entities);
    const unwrapped = entities.map(i => Reference.unwrapReference(i)) as T[];
    unwrapped.forEach(entity => this.validateItemType(entity));
    this.modify('add', unwrapped);
    this.cancelOrphanRemoval(unwrapped);
  }

  set(items: (T | Reference<T>)[]): void {
    if (!this.initialized) {
      this.initialized = true;
      this.snapshot = undefined;
    }

    super.set(items);
  }

  /**
   * @internal
   */
  hydrate(items: T[], forcePropagate?: boolean): void {
    this.initialized = true;
    super.hydrate(items);
    this.takeSnapshot(forcePropagate);
  }

  /**
   * @inheritDoc
   */
  remove(entity: T | Reference<T> | (T | Reference<T>)[] | ((item: T) => boolean), ...entities: (T | Reference<T>)[]): void {
    if (entity instanceof Function) {
      for (const item of this.items) {
        if (entity(item)) {
          this.remove(item);
        }
      }

      return;
    }

    entities = Utils.asArray(entity).concat(entities);
    const unwrapped = entities.map(i => Reference.unwrapReference(i)) as T[];
    this.modify('remove', unwrapped);
    const em = this.getEntityManager(unwrapped, false);

    if (this.property.orphanRemoval && em) {
      for (const item of unwrapped) {
        em.getUnitOfWork().scheduleOrphanRemoval(item);
      }
    }
  }

  /**
   * @inheritDoc
   */
  removeAll(): void {
    this.checkInitialized();
    super.removeAll();
  }

  contains(item: T | Reference<T>, check = true): boolean {
    if (check) {
      this.checkInitialized();
    }

    return super.contains(item);
  }

  count(): number {
    this.checkInitialized();
    return super.count();
  }

  isEmpty(): boolean {
    this.checkInitialized();
    return super.isEmpty();
  }

  /**
   * @inheritDoc
   */
  slice(start?: number, end?: number): T[]  {
    this.checkInitialized();
    return super.slice(start, end);
  }

  /**
   * @inheritDoc
   */
  exists(cb: (item: T) => boolean): boolean {
    this.checkInitialized();
    return super.exists(cb);
  }

  /**
   * @inheritDoc
   */
  find(cb: (item: T, index: number) => boolean): T | undefined {
    this.checkInitialized();
    return super.find(cb);
  }

  /**
   * @inheritDoc
   */
  filter(cb: (item: T, index: number) => boolean): T[] {
    this.checkInitialized();
    return super.filter(cb);
  }

  /**
   * @inheritDoc
   */
  map<R>(mapper: (item: T, index: number) => R): R[] {
    this.checkInitialized();
    return super.map(mapper);
  }


  /**
   * @inheritDoc
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1): Record<T[K1] & PropertyKey, T>;

  /**
   * @inheritDoc
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1, valueKey: K2): Record<T[K1] & PropertyKey, T[K2]>;

  /**
   * @inheritDoc
   */
  indexBy<K1 extends keyof T, K2 extends keyof T = never>(key: K1, valueKey?: K2): Record<T[K1] & PropertyKey, T> | Record<T[K1] & PropertyKey, T[K2]> {
    this.checkInitialized();
    return super.indexBy(key, valueKey as never);
  }

  shouldPopulate(): boolean {
    return this._populated && !this._lazyInitialized;
  }

  populated(populated = true): void {
    this._populated = populated;
    this._lazyInitialized = false;
  }

  async init<P extends string = never>(options: InitOptions<T, P> = {}): Promise<LoadedCollection<Loaded<T, P>>> {
    if (this.dirty) {
      const items = [...this.items];
      this.dirty = false;
      await this.init(options);
      items.forEach(i => this.add(i));

      return this as unknown as LoadedCollection<Loaded<T, P>>;
    }

    const em = this.getEntityManager();

    if (!this.initialized && this.property.kind === ReferenceKind.MANY_TO_MANY && em.getPlatform().usesPivotTable()) {
      const cond = await em.applyFilters(this.property.type, options.where, {}, 'read');
      const map = await em.getDriver().loadFromPivotTable(this.property, [helper(this.owner).__primaryKeys], cond, options.orderBy, undefined, options);
      this.hydrate(map[helper(this.owner).getSerializedPrimaryKey()].map((item: EntityData<T>) => em.merge(this.property.type, item, { convertCustomTypes: true })), true);
      this._lazyInitialized = true;

      return this as unknown as LoadedCollection<Loaded<T, P>>;
    }

    // do not make db call if we know we will get no results
    if (this.property.kind === ReferenceKind.MANY_TO_MANY && (this.property.owner || em.getPlatform().usesPivotTable()) && this.length === 0) {
      this.initialized = true;
      this.dirty = false;
      this._lazyInitialized = true;

      return this as unknown as LoadedCollection<Loaded<T, P>>;
    }

    const where = this.createCondition(options.where);
    const order = [...this.items]; // copy order of references
    const customOrder = !!options.orderBy;
    const items: T[] = await em.find(this.property.type, where, {
      populate: options.populate,
      lockMode: options.lockMode,
      orderBy: this.createOrderBy(options.orderBy),
      connectionType: options.connectionType,
      schema: this.property.targetMeta!.schema === '*'
        ? helper(this.owner).__schema
        : this.property.targetMeta!.schema,
    });

    if (!customOrder) {
      this.reorderItems(items, order);
    }

    this.items.clear();
    let i = 0;
    items.forEach(item => {
      this.items.add(item);
      this[i++] = item;
    });

    this.initialized = true;
    this.dirty = false;
    this._lazyInitialized = true;

    return this as unknown as LoadedCollection<Loaded<T, P>>;
  }

  /**
   * @internal
   */
  takeSnapshot(forcePropagate?: boolean): void {
    this.snapshot = [...this.items];
    this.setDirty(false);

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

  private getEntityManager(items: T[] = [], required = true) {
    let em = this._em ?? helper(this.owner).__em;

    if (!em) {
      for (const i of items) {
        if (i && helper(i).__em) {
          em = helper(i).__em;
          break;
        }
      }
    }

    if (em) {
      Object.defineProperty(this, '_em', { value: em });
    }

    if (!em && required) {
      throw ValidationError.entityNotManaged(this.owner);
    }

    return em;
  }

  private createCondition(cond: FilterQuery<T> = {}): FilterQuery<T> {
    if (this.property.kind === ReferenceKind.ONE_TO_MANY) {
      cond[this.property.mappedBy as FilterKey<T>] = helper(this.owner).getPrimaryKey() as any;
    } else { // MANY_TO_MANY
      this.createManyToManyCondition(cond);
    }

    return cond;
  }

  private createOrderBy(orderBy: QueryOrderMap<T> | QueryOrderMap<T>[] = []): QueryOrderMap<T>[] {
    if (Utils.isEmpty(orderBy) && this.property.kind === ReferenceKind.ONE_TO_MANY) {
      const defaultOrder = this.property.referencedColumnNames.map(name => {
        return { [name]: QueryOrder.ASC };
      });
      orderBy = this.property.orderBy as QueryOrderMap<T> || defaultOrder;
    }

    return Utils.asArray(orderBy);
  }

  private createManyToManyCondition(cond: FilterQuery<T>) {
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

  private createLoadCountCondition(cond: FilterQuery<T>, pivotMeta?: EntityMetadata) {
    const wrapped = helper(this.owner);
    const val = wrapped.__meta.compositePK ? { $in: wrapped.__primaryKeys } : wrapped.getPrimaryKey();
    const dict = cond as Dictionary;

    if (this.property.kind === ReferenceKind.ONE_TO_MANY) {
      dict[this.property.mappedBy] = val;
    } else if (pivotMeta && this.property.owner && !this.property.inversedBy) {
      const key = `${this.property.pivotEntity}.${pivotMeta.relations[0].name}`;
      dict[key] = val;
    } else {
      const key = this.property.owner ? this.property.inversedBy : this.property.mappedBy;
      dict[key] = val;
    }

    return cond;
  }

  private modify(method: 'add' | 'remove', items: T[]): void {
    if (method === 'remove') {
      this.checkInitialized();
    }

    this.validateModification(items);
    super[method](items);
    this.setDirty();
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Collection<${this.property.type}> of entity ${this.owner.constructor.name}[${helper(this.owner).getSerializedPrimaryKey()}] not initialized`);
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

  private validateItemType(item: T | Primary<T> | EntityData<T>): void {
    if (!Utils.isEntity(item)) {
      throw ValidationError.notEntity(this.owner, this.property, item);
    }
  }

  private validateModification(items: T[]): void {
    if (this.readonly) {
      throw ValidationError.cannotModifyReadonlyCollection(this.owner, this.property);
    }

    // currently we allow persisting to inverse sides only in SQL drivers
    if (this.property.pivotTable || !this.property.mappedBy) {
      return;
    }

    const check = (item: AnyEntity) => {
      if (!item || helper(item).__initialized) {
        return false;
      }

      return !item[this.property.mappedBy] && this.property.kind === ReferenceKind.MANY_TO_MANY;
    };

    // throw if we are modifying inverse side of M:N collection when owning side is initialized (would be ignored when persisting)
    if (items.find(item => check(item))) {
      throw ValidationError.cannotModifyInverseCollection(this.owner, this.property);
    }
  }

}

Object.defineProperties(Collection.prototype, {
  $: { get() { return this; } },
  get: { get() { return () => this; } },
});

export interface InitOptions<T, P extends string = never> {
  populate?: Populate<T, P>;
  orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[];
  where?: FilterQuery<T>;
  lockMode?: Exclude<LockMode, LockMode.OPTIMISTIC>;
  connectionType?: ConnectionType;
}

export interface LoadCountOptions<T> {
  refresh?: boolean;
  where?: FilterQuery<T>;
}
