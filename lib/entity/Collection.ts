import { IPrimaryKey, FilterQuery } from '..';
import { IEntity, IEntityType, ReferenceType } from '../decorators/Entity';
import { EntityManager } from '../EntityManager';
import { ArrayCollection } from './ArrayCollection';

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
    this.modify('add', items);
  }

  set(items: T[], initialize = false): void {
    if (initialize) {
      this.initialized = true;
    }

    super.set(items);

    if (initialize) {
      this.dirty = false;
    }
  }

  remove(...items: T[]): void {
    this.modify('remove', items);
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
    const em = this.owner.__em as EntityManager;

    if (!this.initialized && this.property.reference === ReferenceType.MANY_TO_MANY && em.getDriver().getConfig().usesPivotTable) {
      const map = await em.getDriver().loadFromPivotTable<T>(this.property, [this.owner.id]);
      this.set(map[this.owner.id].map(item => em.merge<T>(this.property.type, item)), true);

      return this;
    }

    // do not make db call if we know we will get no results
    if (this.property.reference === ReferenceType.MANY_TO_MANY && (this.property.owner || em.getDriver().getConfig().usesPivotTable) && this.items.length === 0) {
      this.initialized = true;
      this.dirty = false;
      this.populated();

      return this;
    }

    const cond = this.createCondition();
    const order = this.items.map(item => item.id);

    this.items.length = 0;
    const items = await em.find<T>(this.property.type, cond, populate);
    this.reorderItems(items, order);

    this.items.push(...items);
    Object.assign(this, items);
    this.initialized = true;
    this.dirty = false;
    this.populated();

    return this;
  }

  private createCondition(): FilterQuery<T> {
    const cond: Record<string, any> = {};

    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.fk as string] = this.owner.id;
    } else { // MANY_TO_MANY
      this.createManyToManyCondition(cond);
    }

    return cond;
  }

  private createManyToManyCondition(cond: Record<string, any>) {
    if (this.property.owner || this.owner.__em.getDriver().getConfig().usesPivotTable) {
      cond.id = { $in: this.items.map(item => item.id) };
    } else {
      cond[this.property.mappedBy] = this.owner.id;
    }
  }

  private modify(method: 'add' | 'remove', items: T[]): void {
    this.checkInitialized();
    super[method](...items);
    this.setDirty();
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Collection ${this.property.type}[] of entity ${this.owner.constructor.name}[${this.owner.id}] not initialized`);
    }
  }

  /**
   * re-orders items after searching with `$in` operator
   */
  private reorderItems(items: T[], order: IPrimaryKey[]): void {
    if (this.property.reference === ReferenceType.MANY_TO_MANY && this.property.owner) {
      items.sort((a: IEntity, b: IEntity) => {
        return order.indexOf(a.id) - order.indexOf(b.id);
      });
    }
  }

}
