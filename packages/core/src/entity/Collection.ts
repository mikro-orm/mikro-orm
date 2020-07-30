import { AnyEntity, Dictionary, EntityData, FilterQuery, Loaded, Populate, Primary } from '../typings';
import { ArrayCollection } from './index';
import { ReferenceType } from './enums';
import { Utils, ValidationError } from '../utils';
import { QueryOrder, QueryOrderMap } from '../enums';
import { Reference } from './Reference';
import { wrap } from './wrap';

export class Collection<T extends AnyEntity<T>, O extends AnyEntity<O> = AnyEntity> extends ArrayCollection<T, O> {

  private snapshot: T[] | undefined = []; // used to create a diff of the collection at commit time, undefined marks overridden values so we need to wipe when flushing
  private initialized = false;
  private dirty = false;
  private _populated = false;

  constructor(owner: O, items?: T[], initialized = true) {
    super(owner, items);
    this.initialized = !!items || initialized;
    Object.defineProperty(this, 'snapshot', { enumerable: false });
    Object.defineProperty(this, '_populated', { enumerable: false });
    Object.defineProperty(this, '$', { value: this.items });
    Object.defineProperty(this, 'get', { value: () => this.items });
  }

  /**
   * Creates new Collection instance, assigns it to the owning entity and sets the items to it (propagating them to their inverse sides)
   */
  static create<T extends AnyEntity<T>, O extends AnyEntity<O> = AnyEntity>(owner: O, prop: keyof O, items: undefined | T[], initialized: boolean): Collection<T, O> {
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

  add(...items: (T | Reference<T>)[]): void {
    const unwrapped = items.map(i => Reference.unwrapReference(i));
    unwrapped.map(item => this.validateItemType(item));
    this.modify('add', unwrapped);
    this.cancelOrphanRemoval(unwrapped);
  }

  set(items: (T | Reference<T>)[]): void {
    const unwrapped = items.map(i => Reference.unwrapReference(i));
    unwrapped.map(item => this.validateItemType(item));
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
    const em = wrap(this.owner, true).__em;

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

  isInitialized(fully = false): boolean {
    if (fully) {
      return this.initialized && this.items.every(item => wrap(item, true).isInitialized());
    }

    return this.initialized;
  }

  shouldPopulate(): boolean {
    return this._populated;
  }

  populated(populated = true): void {
    this._populated = populated;
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
    const em = wrap(this.owner, true).__em;

    if (!em) {
      throw ValidationError.entityNotManaged(this.owner);
    }

    if (!this.initialized && this.property.reference === ReferenceType.MANY_TO_MANY && em.getDriver().getPlatform().usesPivotTable()) {
      const map = await em.getDriver().loadFromPivotTable<T, O>(this.property, [wrap(this.owner, true).__primaryKeys], options.where, options.orderBy);
      this.hydrate(map[wrap(this.owner, true).__serializedPrimaryKey].map(item => em.merge<T>(this.property.type, item)));

      return this;
    }

    // do not make db call if we know we will get no results
    if (this.property.reference === ReferenceType.MANY_TO_MANY && (this.property.owner || em.getDriver().getPlatform().usesPivotTable()) && this.length === 0) {
      this.initialized = true;
      this.dirty = false;
      this.populated();

      return this;
    }

    where = this.createCondition<T>(options.where);
    const order = [...this.items]; // copy order of references
    const customOrder = !!options.orderBy;
    orderBy = this.createOrderBy(options.orderBy);
    const items = await em.find<T>(this.property.type, where, options.populate, orderBy);

    if (!customOrder) {
      this.reorderItems(items, order);
    }

    this.items.length = 0;
    this.items.push(...items);
    Object.assign(this, items);
    this.initialized = true;
    this.dirty = false;
    this.populated();

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
      cond[this.property.mappedBy as string] = wrap(this.owner, true).__primaryKey;
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
    if (this.property.owner || wrap(this.owner, true).__internal.platform.usesPivotTable()) {
      const pk = wrap(this.items[0], true).__meta.primaryKeys[0]; // we know there is at least one item as it was checked in load method
      cond[pk] = { $in: this.items.map(item => wrap(item, true).__primaryKey) };
    } else {
      cond[this.property.mappedBy] = wrap(this.owner, true).__primaryKey;
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
      throw new Error(`Collection<${this.property.type}> of entity ${this.owner.constructor.name}[${wrap(this.owner, true).__primaryKey}] not initialized`);
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
    const em = wrap(this.owner, true).__em;

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
    if (wrap(this.owner, true).__internal.platform.usesPivotTable() || !this.property.mappedBy) {
      return;
    }

    const check = (item: T) => {
      if (wrap(item).isInitialized()) {
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
