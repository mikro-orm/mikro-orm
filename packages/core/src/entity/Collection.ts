import { AnyEntity, Dictionary, EntityData, FilterQuery, Populate, Primary } from '../typings';
import { ArrayCollection } from './ArrayCollection';
import { Utils } from '../utils/Utils';
import { ValidationError } from '../errors';
import { QueryOrder, QueryOrderMap, ReferenceType } from '../enums';
import { Reference } from './Reference';

export class Collection<T, O = unknown> extends ArrayCollection<T, O> {

  private snapshot: T[] | undefined = []; // used to create a diff of the collection at commit time, undefined marks overridden values so we need to wipe when flushing
  private dirty = false;
  private _populated = false;
  private _lazyInitialized = false;

  constructor(owner: O, items?: T[], initialized = true) {
    super(owner, items);
    this.initialized = !!items || initialized;
    Object.defineProperty(this, 'snapshot', { enumerable: false });
    Object.defineProperty(this, '_populated', { enumerable: false });
    Object.defineProperty(this, '_lazyInitialized', { enumerable: false });
    Object.defineProperty(this, '$', { get: () => super.getItems() });
    Object.defineProperty(this, 'get', { value: () => super.getItems() });
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
    super.set(unwrapped);
    this.setDirty();
    this.cancelOrphanRemoval(unwrapped);
  }

  /**
   * @internal
   */
  hydrate(items: T[], validate = false, takeSnapshot = true): void {
    if (validate) {
      this.validateModification(items);
    }

    const wasInitialized = this.initialized;
    const wasDirty = this.dirty;
    this.initialized = true;
    super.hydrate(items);
    this.dirty = wasDirty;

    if (!wasInitialized && !takeSnapshot) {
      this.snapshot = undefined;
    } else if (takeSnapshot) {
      this.takeSnapshot();
    }
  }

  remove(...items: (T | Reference<T>)[]): void {
    const unwrapped = items.map(i => Reference.unwrapReference(i));
    this.modify('remove', unwrapped);
    const em = this.owner.__helper!.__em;

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

  async init(options?: InitOptions<T>): Promise<this>;
  async init(populate?: string[], where?: FilterQuery<T>, orderBy?: QueryOrderMap): Promise<this>;
  async init(populate: string[] | InitOptions<T> = [], where?: FilterQuery<T>, orderBy?: QueryOrderMap): Promise<this> {
    const options = Utils.isObject<InitOptions<T>>(populate) ? populate : { populate, where, orderBy };
    const em = this.owner.__helper!.__em;

    if (!em) {
      throw ValidationError.entityNotManaged(this.owner);
    }

    if (!this.initialized && this.property.reference === ReferenceType.MANY_TO_MANY && em.getDriver().getPlatform().usesPivotTable()) {
      const map = await em.getDriver().loadFromPivotTable(this.property, [this.owner.__helper!.__primaryKeys], options.where, options.orderBy);
      this.hydrate(map[this.owner.__helper!.getSerializedPrimaryKey()].map((item: EntityData<T>) => em.merge(this.property.type, item, false, true)));
      this._lazyInitialized = true;

      return this;
    }

    // do not make db call if we know we will get no results
    if (this.property.reference === ReferenceType.MANY_TO_MANY && (this.property.owner || em.getDriver().getPlatform().usesPivotTable()) && this.length === 0) {
      this.initialized = true;
      this.dirty = false;
      this._lazyInitialized = true;

      return this;
    }

    where = this.createCondition<T>(options.where);
    const order = [...this.items]; // copy order of references
    const customOrder = !!options.orderBy;
    orderBy = this.createOrderBy(options.orderBy);
    const items: T[] = await em.find(this.property.type, where, options.populate, orderBy);

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

    return this;
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

  private createCondition<T extends AnyEntity<T>>(cond: FilterQuery<T> = {}): FilterQuery<T> {
    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.mappedBy] = this.owner.__helper!.getPrimaryKey();
    } else { // MANY_TO_MANY
      this.createManyToManyCondition(cond as Dictionary);
    }

    return cond;
  }

  private createOrderBy(orderBy: QueryOrderMap = {}): QueryOrderMap {
    if (Utils.isEmpty(orderBy) && this.property.reference === ReferenceType.ONE_TO_MANY) {
      const defaultOrder = this.property.referencedColumnNames.reduce((o, name) => {
        o[name] = QueryOrder.ASC;
        return o;
      }, {} as QueryOrderMap);
      orderBy = this.property.orderBy || defaultOrder;
    }

    return orderBy;
  }

  private createManyToManyCondition(cond: Dictionary) {
    if (this.property.owner || this.property.pivotTable) {
      // we know there is at least one item as it was checked in load method
      const pk = (this._firstItem as AnyEntity<T>).__meta!.primaryKeys[0];
      cond[pk] = { $in: [] };
      this.items.forEach((item: AnyEntity<T>) => cond[pk].$in.push(item.__helper!.getPrimaryKey()));
    } else {
      cond[this.property.mappedBy] = this.owner.__helper!.getPrimaryKey();
    }
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
    const em = this.owner.__helper!.__em;

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
    // currently we allow persisting to inverse sides only in SQL drivers
    if (this.property.pivotTable || !this.property.mappedBy) {
      return;
    }

    const check = (item: T & AnyEntity<T>) => {
      if (item.__helper!.__initialized) {
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

export interface InitOptions<T> {
  populate?: Populate<T>;
  orderBy?: QueryOrderMap;
  where?: FilterQuery<T>;
}
