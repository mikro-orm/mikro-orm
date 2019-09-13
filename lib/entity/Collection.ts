import { FilterQuery, IPrimaryKey, QueryOrder, QueryOrderMap, Utils } from '..';
import { EntityData, IEntityType } from '../decorators';
import { ArrayCollection } from './ArrayCollection';
import { ReferenceType } from './enums';

export class Collection<T extends IEntityType<T>> extends ArrayCollection<T> {

  private initialized = false;
  private dirty = false;
  private _populated = false;

  constructor(owner: IEntityType<any>, items?: T[], initialized = true) {
    super(owner, items);
    this.initialized = !!items || initialized;
  }

  getItems(): T[] {
    this.checkInitialized();
    return super.getItems();
  }

  add(...items: T[]): void {
    items = items.map(item => this.mapToEntity(item));
    this.modify('add', items);

    for (const item of items) {
      this.owner.__em.getUnitOfWork().cancelOrphanRemoval(item);
    }
  }

  set(items: T[], initialize = false): void {
    if (initialize) {
      this.initialized = true;
    }

    items = items.map(item => this.mapToEntity(item));
    super.set(items);
    this.dirty = !initialize;

    for (const item of items) {
      this.owner.__em.getUnitOfWork().cancelOrphanRemoval(item);
    }
  }

  remove(...items: T[]): void {
    this.modify('remove', items);

    if (this.property.orphanRemoval) {
      for (const item of items) {
        this.owner.__em.getUnitOfWork().scheduleOrphanRemoval(item);
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
      return this.initialized && this.items.every(item => item.isInitialized());
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
    this.dirty = dirty && this.property.owner; // set dirty flag only to owning side
  }

  async init(populate: string[] = []): Promise<this> {
    const em = this.owner.__em;

    if (!this.initialized && this.property.reference === ReferenceType.MANY_TO_MANY && em.getDriver().getPlatform().usesPivotTable()) {
      const map = await em.getDriver().loadFromPivotTable<T>(this.property, [this.owner.__primaryKey]);
      this.set(map[this.owner.__primaryKey].map(item => em.merge<T>(this.property.type, item)), true);

      return this;
    }

    // do not make db call if we know we will get no results
    if (this.property.reference === ReferenceType.MANY_TO_MANY && (this.property.owner || em.getDriver().getPlatform().usesPivotTable()) && this.length === 0) {
      this.initialized = true;
      this.dirty = false;
      this.populated();

      return this;
    }

    const { cond, orderBy } = this.createCondition();
    const order = [...this.items]; // copy order of references

    this.items.length = 0;
    const items = await em.find<T>(this.property.type, cond, populate, orderBy);
    this.reorderItems(items, order);

    this.items.push(...items);
    Object.assign(this, items);
    this.initialized = true;
    this.dirty = false;
    this.populated();

    return this;
  }

  private createCondition<T>(): { cond: FilterQuery<T>; orderBy?: QueryOrderMap } {
    const cond: Record<string, any> = {};
    let orderBy;

    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.mappedBy as string] = this.owner.__primaryKey;
      orderBy = this.property.orderBy || { [this.property.referenceColumnName]: QueryOrder.ASC };
    } else { // MANY_TO_MANY
      this.createManyToManyCondition(cond);
    }

    return { cond, orderBy };
  }

  private createManyToManyCondition(cond: Record<string, any>) {
    if (this.property.owner || this.owner.__em.getDriver().getPlatform().usesPivotTable()) {
      const pk = this.items[0].__primaryKeyField; // we know there is at least one item as it was checked in load method
      cond[pk] = { $in: this.items.map(item => item.__primaryKey) };
    } else {
      cond[this.property.mappedBy] = this.owner.__primaryKey;
    }
  }

  private modify(method: 'add' | 'remove', items: T[]): void {
    this.checkInitialized();
    super[method](...items);
    this.setDirty();
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Collection ${this.property.type}[] of entity ${this.owner.constructor.name}[${this.owner.__primaryKey}] not initialized`);
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

  private mapToEntity(item: T | IPrimaryKey | EntityData<T>): T {
    if (Utils.isEntity(item)) {
      return item;
    }

    const em = this.owner.__em;
    let entity: T;

    if (Utils.isPrimaryKey(item)) {
      entity = em.getReference<T>(this.property.type, item);
    } else {
      entity = em.create<T>(this.property.type, item);
    }

    if (entity.__primaryKey) {
      return em.merge<T>(this.property.type, entity);
    }

    return entity;
  }

}
