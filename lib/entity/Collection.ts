import { Dictionary, FilterQuery, Primary, QueryOrder, QueryOrderMap, Utils, wrap } from '..';
import { EntityData, AnyEntity } from '../typings';
import { ArrayCollection } from './ArrayCollection';
import { ReferenceType } from './enums';
import { ValidationError } from '../utils';

export class Collection<T extends AnyEntity<T>> extends ArrayCollection<T> {

  private initialized = false;
  private dirty = false;
  private _populated = false;

  constructor(owner: AnyEntity, items?: T[], initialized = true) {
    super(owner, items);
    this.initialized = !!items || initialized;
    Object.defineProperty(this, '_populated', { enumerable: false });
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
  getItems(): T[] {
    this.checkInitialized();
    return super.getItems();
  }

  add(...items: T[]): void {
    items.map(item => this.validateItemType(item));
    this.modify('add', items);
    this.cancelOrphanRemoval(items);
  }

  set(items: T[]): void {
    items.map(item => this.validateItemType(item));
    this.validateModification(items);
    super.set(items);
    this.setDirty();
    this.cancelOrphanRemoval(items);
  }

  /**
   * @internal
   */
  hydrate(items: T[], validate = false): void {
    if (validate) {
      this.validateModification(items);
    }

    this.initialized = true;
    this.dirty = false;
    super.hydrate(items);
  }

  remove(...items: T[]): void {
    this.modify('remove', items);
    const em = wrap(this.owner).__em;

    if (this.property.orphanRemoval && em) {
      for (const item of items) {
        em.getUnitOfWork().scheduleOrphanRemoval(item);
      }
    }
  }

  contains(item: T): boolean {
    this.checkInitialized();
    return super.contains(item);
  }

  count(): number {
    this.checkInitialized();
    return super.count();
  }

  isInitialized(fully = false): boolean {
    if (fully) {
      return this.initialized && this.items.every(item => wrap(item).isInitialized());
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
    this.dirty = dirty && !!this.property.owner; // set dirty flag only to owning side
  }

  async init(options?: InitOptions<T>): Promise<this>; // tslint:disable-next-line:lines-between-class-members
  async init(populate?: string[], where?: FilterQuery<T>, orderBy?: QueryOrderMap): Promise<this>; // tslint:disable-next-line:lines-between-class-members
  async init(populate: string[] | InitOptions<T> = [], where?: FilterQuery<T>, orderBy?: QueryOrderMap): Promise<this> {
    const options = Utils.isObject<InitOptions<T>>(populate) ? populate : { populate, where, orderBy };
    const em = wrap(this.owner).__em;

    if (!em) {
      throw ValidationError.entityNotManaged(this.owner);
    }

    if (!this.initialized && this.property.reference === ReferenceType.MANY_TO_MANY && em.getDriver().getPlatform().usesPivotTable()) {
      const map = await em.getDriver().loadFromPivotTable<T>(this.property, [wrap(this.owner).__primaryKey], options.where, options.orderBy);
      this.hydrate(map[wrap(this.owner).__primaryKey].map(item => em.merge<T>(this.property.type, item)));

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

  private createCondition<T extends AnyEntity<T>>(cond: FilterQuery<T> = {}): FilterQuery<T> {
    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.mappedBy as string] = wrap(this.owner).__primaryKey;
    } else { // MANY_TO_MANY
      this.createManyToManyCondition(cond as Dictionary);
    }

    return cond;
  }

  private createOrderBy(orderBy: QueryOrderMap = {}): QueryOrderMap {
    if (Utils.isEmpty(orderBy) && this.property.reference === ReferenceType.ONE_TO_MANY) {
      orderBy = this.property.orderBy || { [this.property.referenceColumnName]: QueryOrder.ASC };
    }

    return orderBy;
  }

  private createManyToManyCondition(cond: Dictionary) {
    if (this.property.owner || wrap(this.owner).__internal.platform.usesPivotTable()) {
      const pk = wrap(this.items[0]).__meta.primaryKey; // we know there is at least one item as it was checked in load method
      cond[pk] = { $in: this.items.map(item => wrap(item).__primaryKey) };
    } else {
      cond[this.property.mappedBy] = wrap(this.owner).__primaryKey;
    }
  }

  private modify(method: 'add' | 'remove', items: T[]): void {
    this.checkInitialized();
    this.validateModification(items);
    super[method](...items);
    this.setDirty();
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Collection<${this.property.type}> of entity ${this.owner.constructor.name}[${wrap(this.owner).__primaryKey}] not initialized`);
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
    const em = wrap(this.owner).__em;

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
    // throw if we are modifying inverse side of M:N collection when owning side is initialized (would be ignored when persisting)
    const manyToManyInverse = this.property.reference === ReferenceType.MANY_TO_MANY && this.property.mappedBy;

    if (manyToManyInverse && items.find(item => !item[this.property.mappedBy] || !item[this.property.mappedBy].isInitialized())) {
      throw ValidationError.cannotModifyInverseCollection(this.owner, this.property);
    }
  }

}

export interface InitOptions<T> {
  populate?: string[];
  orderBy?: QueryOrderMap;
  where?: FilterQuery<T>;
}
