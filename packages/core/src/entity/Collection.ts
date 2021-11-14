import type { AnyEntity, Dictionary, EntityData, EntityMetadata, FilterQuery, Loaded, LoadedCollection, Populate, Primary } from '../typings';
import { ArrayCollection } from './ArrayCollection';
import { Utils } from '../utils/Utils';
import { ValidationError } from '../errors';
import type { QueryOrderMap } from '../enums';
import { QueryOrder, ReferenceType } from '../enums';
import { Reference } from './Reference';
import type { Transaction } from '../connections/Connection';
import type { FindOptions } from '../drivers/IDatabaseDriver';

export interface MatchingOptions<T, P extends string = never> extends FindOptions<T, P> {
  where?: FilterQuery<T>;
  store?: boolean;
  ctx?: Transaction;
}

export class Collection<T, O = unknown> extends ArrayCollection<T, O> {

  private snapshot: T[] | undefined = []; // used to create a diff of the collection at commit time, undefined marks overridden values so we need to wipe when flushing
  private dirty = false;
  private readonly?: boolean;
  private _populated = false;
  private _lazyInitialized = false;

  constructor(owner: O, items?: T[], initialized = true) {
    super(owner, items);
    this.initialized = !!items || initialized;
    Object.defineProperty(this, 'snapshot', { enumerable: false });
    Object.defineProperty(this, '_populated', { enumerable: false });
    Object.defineProperty(this, '_lazyInitialized', { enumerable: false });
    Object.defineProperty(this, '$', { get: () => this });
    Object.defineProperty(this, 'get', { value: () => this });
  }

  /**
   * Creates new Collection instance, assigns it to the owning entity and sets the items to it (propagating them to their inverse sides)
   */
  static create<T, O = any>(owner: O, prop: keyof O, items: undefined | T[], initialized: boolean): Collection<T, O> {
    const coll = new Collection<T, O>(owner, items, initialized);
    owner[prop] = coll as unknown as O[keyof O];

    if (items) {
      coll.set(items);
    }

    return coll;
  }

  /**
   * Initializes the collection and returns the items
   */
  async loadItems(): Promise<T[]> {
    if (!this.isInitialized(true)) {
      await this.init();
    }

    return super.getItems();
  }

  /**
   * Gets the count of collection items from database instead of counting loaded items.
   * The value is cached, use `refresh = true` to force reload it.
   */
  async loadCount(refresh = false): Promise<number> {
    if (!refresh && Utils.isDefined(this._count)) {
      return this._count!;
    }

    const em = this.getEntityManager();
    const pivotMeta = em.getMetadata().find(this.property.pivotTable)!;

    if (!em.getPlatform().usesPivotTable() && this.property.reference === ReferenceType.MANY_TO_MANY) {
      this._count = this.length;
    } else if (this.property.pivotTable && !(this.property.inversedBy || this.property.mappedBy)) {
      this._count = await em.count(this.property.type, this.createLoadCountCondition({} as FilterQuery<T>, pivotMeta), { populate: [{ field: this.property.pivotTable }] });
    } else {
      this._count = await em.count(this.property.type, this.createLoadCountCondition({} as FilterQuery<T>, pivotMeta));
    }

    return this._count!;
  }

  async matching<P extends string = never>(options: MatchingOptions<T, P>): Promise<Loaded<T, P>[]> {
    const em = this.getEntityManager();
    const { where, ctx, ...opts } = options;
    opts.orderBy = this.createOrderBy(opts.orderBy);
    let items: Loaded<T, P>[];

    if (this.property.reference === ReferenceType.MANY_TO_MANY && em.getPlatform().usesPivotTable()) {
      const map = await em.getDriver().loadFromPivotTable(this.property, [this.owner.__helper!.__primaryKeys], where, opts.orderBy, ctx, options);
      items = map[this.owner.__helper!.getSerializedPrimaryKey()].map((item: EntityData<T>) => em.merge(this.property.type, item, { convertCustomTypes: true }));
    } else {
      items = await em.find(this.property.type, this.createCondition(where), opts);
    }

    if (options.store) {
      this.hydrate(items);
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

  toJSON(): Dictionary[] {
    if (!this.isInitialized()) {
      return [];
    }

    return super.toJSON();
  }

  add(...items: (T | Reference<T>)[]): void {
    const unwrapped = items.map(i => Reference.unwrapReference(i));
    unwrapped.forEach(item => this.validateItemType(item));
    this.modify('add', unwrapped);
    this.cancelOrphanRemoval(unwrapped);
  }

  set(items: (T | Reference<T>)[]): void {
    const unwrapped = items.map(i => Reference.unwrapReference(i));
    unwrapped.forEach(item => this.validateItemType(item));
    this.validateModification(unwrapped);

    if (!this.initialized) {
      this.initialized = true;
      this.snapshot = undefined;
    }

    super.set(unwrapped);
    this.setDirty();
    this.cancelOrphanRemoval(unwrapped);
  }

  /**
   * @internal
   */
  hydrate(items: T[]): void {
    this.initialized = true;
    super.hydrate(items);
    this.takeSnapshot();
  }

  removeAll(): void {
    const em = this.getEntityManager([], false);

    if (this.property.reference === ReferenceType.ONE_TO_MANY && this.property.orphanRemoval && em) {
      em.getUnitOfWork().scheduleCollectionDeletion(this);
      const unwrapped = this.getItems(false).map(i => Reference.unwrapReference(i));
      this.modify('remove', unwrapped);
    } else {
      super.removeAll();
    }
  }

  remove(...items: (T | Reference<T> | ((item: T) => boolean))[]): void {
    if (items[0] instanceof Function) {
      for (const item of this.items) {
        if (items[0](item)) {
          this.remove(item);
        }
      }

      return;
    }

    const unwrapped = items.map(i => Reference.unwrapReference(i as T));
    this.modify('remove', unwrapped);
    const em = this.getEntityManager(unwrapped, false);

    if (this.property.orphanRemoval && em) {
      for (const item of unwrapped) {
        em.getUnitOfWork().scheduleOrphanRemoval(item);
      }
    }
  }

  contains(item: (T | Reference<T>), check = true): boolean {
    if (check) {
      this.checkInitialized();
    }

    return super.contains(item);
  }

  count(): number {
    this.checkInitialized();
    return super.count();
  }

  shouldPopulate(): boolean {
    return this._populated && !this._lazyInitialized;
  }

  populated(populated = true): void {
    this._populated = populated;
    this._lazyInitialized = false;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  setDirty(dirty = true): void {
    this.dirty = dirty;
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

    if (!this.initialized && this.property.reference === ReferenceType.MANY_TO_MANY && em.getPlatform().usesPivotTable()) {
      const map = await em.getDriver().loadFromPivotTable(this.property, [this.owner.__helper!.__primaryKeys], options.where, options.orderBy);
      this.hydrate(map[this.owner.__helper!.getSerializedPrimaryKey()].map((item: EntityData<T>) => em.merge(this.property.type, item, { convertCustomTypes: true })));
      this._lazyInitialized = true;

      return this as unknown as LoadedCollection<Loaded<T, P>>;
    }

    // do not make db call if we know we will get no results
    if (this.property.reference === ReferenceType.MANY_TO_MANY && (this.property.owner || em.getPlatform().usesPivotTable()) && this.length === 0) {
      this.initialized = true;
      this.dirty = false;
      this._lazyInitialized = true;

      return this as unknown as LoadedCollection<Loaded<T, P>>;
    }

    const where = this.createCondition(options.where);
    const order = [...this.items]; // copy order of references
    const customOrder = !!options.orderBy;
    const orderBy = this.createOrderBy(options.orderBy);
    const items: T[] = await em.find(this.property.type, where, { populate: options.populate, orderBy });

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
  takeSnapshot(): void {
    this.snapshot = [...this.items];
    this.setDirty(false);
  }

  /**
   * @internal
   */
  getSnapshot() {
    return this.snapshot;
  }

  private getEntityManager(items: T[] = [], required = true) {
    let em = this.owner.__helper!.__em;

    if (!em) {
      const item = (items.concat(...this.items) as AnyEntity<T>[]).find(i => i?.__helper!.__em);
      em = item?.__helper!.__em;
    }

    if (!em && required) {
      throw ValidationError.entityNotManaged(this.owner);
    }

    return em;
  }

  private createCondition(cond: FilterQuery<T> = {} as FilterQuery<T>): FilterQuery<T> {
    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.mappedBy] = this.owner.__helper!.getPrimaryKey();
    } else { // MANY_TO_MANY
      this.createManyToManyCondition(cond);
    }

    return cond;
  }

  private createOrderBy(orderBy: QueryOrderMap<T> | QueryOrderMap<T>[] = []): QueryOrderMap<T>[] {
    if (Utils.isEmpty(orderBy) && this.property.reference === ReferenceType.ONE_TO_MANY) {
      const defaultOrder = this.property.referencedColumnNames.map(name => {
        return { [name]: QueryOrder.ASC };
      });
      orderBy = this.property.orderBy || defaultOrder;
    }

    return Utils.asArray(orderBy);
  }

  private createManyToManyCondition(cond: FilterQuery<T>) {
    if (this.property.owner || this.property.pivotTable) {
      // we know there is at least one item as it was checked in load method
      const pk = this.property.targetMeta!.primaryKeys[0];
      cond[pk] = { $in: [] };
      this.items.forEach((item: AnyEntity<T>) => cond[pk].$in.push(item.__helper!.getPrimaryKey()));
    } else {
      cond[this.property.mappedBy] = this.owner.__helper!.getPrimaryKey();
    }
  }

  private createLoadCountCondition(cond: FilterQuery<T>, pivotMeta?: EntityMetadata) {
    const val = this.owner.__meta!.compositePK ? { $in: this.owner.__helper!.__primaryKeys } : this.owner.__helper!.getPrimaryKey();

    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.mappedBy] = val;
    } else if (pivotMeta && this.property.owner && !this.property.inversedBy) {
      const pivotProp1 = pivotMeta.properties[this.property.type + '_inverse'];
      const inverse = pivotProp1.mappedBy;
      const key = `${this.property.pivotTable}.${pivotMeta.properties[inverse].name}`;
      cond[key] = val;
    } else {
      const key = this.property.owner ? this.property.inversedBy : this.property.mappedBy;
      cond[key] = val;
    }

    return cond;
  }

  private modify(method: 'add' | 'remove', items: T[]): void {
    if (method === 'remove') {
      this.checkInitialized();
    }

    this.validateModification(items);
    super[method](...items);
    this.setDirty();
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Collection<${this.property.type}> of entity ${this.owner.constructor.name}[${this.owner.__helper!.getPrimaryKey()}] not initialized`);
    }
  }

  /**
   * re-orders items after searching with `$in` operator
   */
  private reorderItems(items: T[], order: T[]): void {
    if (this.property.reference === ReferenceType.MANY_TO_MANY && this.property.owner) {
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

    const check = (item: T & AnyEntity<T>) => {
      if (!item || item.__helper!.__initialized) {
        return false;
      }

      return !item[this.property.mappedBy] && this.property.reference === ReferenceType.MANY_TO_MANY;
    };

    // throw if we are modifying inverse side of M:N collection when owning side is initialized (would be ignored when persisting)
    if (items.find(item => check(item))) {
      throw ValidationError.cannotModifyInverseCollection(this.owner, this.property);
    }
  }

}

export interface InitOptions<T, P extends string = never> {
  populate?: Populate<T, P>;
  orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[];
  where?: FilterQuery<T>;
}
