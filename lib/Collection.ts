import { IPrimaryKey } from './decorators/PrimaryKey';
import { EntityProperty, IEntity, ReferenceType } from './decorators/Entity';
import { getMetadataStorage } from './MikroORM';

export class Collection<T extends IEntity> {

  [k: number]: T;

  private initialized = false;
  private dirty = false;
  private _populated = false;
  private _property: EntityProperty;
  private readonly items: T[] = [];

  constructor(readonly owner: IEntity, items: T[] = null, initialized = true) {
    if (items) {
      this.initialized = true;
      this.items = items;
      Object.assign(this, items);
    } else if (initialized) {
      this.initialized = initialized;
    }
  }

  isInitialized(fully = false): boolean {
    if (fully) {
      return this.initialized && this.items.every(i => i.isInitialized());
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

  async init(populate: string[] = []): Promise<Collection<T>> {
    const em = this.owner.getEntityManager();

    if (!this.initialized && this.property.reference === ReferenceType.MANY_TO_MANY && em.getDriver().usesPivotTable()) {
      const map = await em.getDriver().loadFromPivotTable(this.property, [this.owner.id]);
      map[this.owner.id as number].forEach(item => this.items.push(em.entityFactory.createReference(this.property.type, item)));
    }

    // do not make db call if we know we will get no results
    if (this.property.reference === ReferenceType.MANY_TO_MANY && (this.property.owner || em.getDriver().usesPivotTable()) && this.items.length === 0) {
      this.initialized = true;
      this.dirty = false;
      this.populated();

      return this;
    }

    const cond = this.createCondition();
    const order = this.items.map(item => item.id);

    this.items.length = 0;
    const items = await em.find<T>(this.property.type, cond, populate);

    // re-order items when searching with `$in` operator
    if (this.property.reference === ReferenceType.MANY_TO_MANY && this.property.owner) {
      items.sort((a: IEntity, b: IEntity) => {
        return order.indexOf(a.id) - order.indexOf(b.id);
      });
    }

    this.items.push(...items);
    Object.assign(this, items);
    this.initialized = true;
    this.dirty = false;
    this.populated();

    return this;
  }

  getItems(): T[] {
    this.checkInitialized();

    return [...this.items];
  }

  toArray(parent: IEntity = this.owner): any[] {
    return this.getItems().map(item => item.toObject(parent, this));
  }

  getIdentifiers(field = 'id'): IPrimaryKey[] {
    return this.getItems().map(i => i[field]);
  }

  add(...items: T[]): void {
    this.checkInitialized();

    for (const item of items) {
      if (!this.contains(item)) {
        this.handleInverseSide(item, 'add');
        this.items.push(item);
      }
    }

    Object.assign(this, items);
    this.dirty = this.property.owner; // set dirty flag only to owning side
  }

  set(items: T[], initialize = false): void {
    if (initialize) {
      this.initialized = true;
    }

    this.removeAll();
    this.add(...items);

    if (initialize) {
      this.dirty = false;
    }
  }

  remove(...items: T[]): void {
    this.checkInitialized();

    for (const item of items) {
      this.handleInverseSide(item, 'remove');
      const idx = this.items.findIndex(i => i.id === item.id);

      if (idx !== -1) {
        delete this[this.items.length]; // remove last item
        this.items.splice(idx, 1);
        Object.assign(this, this.items); // reassign array access
      }
    }

    this.dirty = this.property.owner; // set dirty flag only to owning side
  }

  removeAll(): void {
    this.remove(...this.items);
  }

  contains(item: T): boolean {
    this.checkInitialized();
    return !!this.items.find(i => i === item || (i.id && item.id && i.id === item.id));
  }

  count(): number {
    this.checkInitialized();
    return this.items.length;
  }

  get length(): number {
    return this.count();
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (const item of this.items) {
      yield item;
    }
  }

  private checkInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Collection ${this.property.type}[] of entity ${this.owner.constructor.name}[${this.owner.id}] not initialized`);
    }
  }

  private handleInverseSide(item: T, method: string): void {
    if (this.property.owner && this.property.inversedBy && item[this.property.inversedBy].isInitialized()) {
      item[this.property.inversedBy][method](this.owner);
    }
  }

  private createCondition(): any {
    const cond: any = {};
    const em = this.owner.getEntityManager();

    if (this.property.reference === ReferenceType.ONE_TO_MANY) {
      cond[this.property.fk] = this.owner.id;
    } else { // MANY_TO_MANY
      if (this.property.owner || em.getDriver().usesPivotTable()) {
        cond.id = { $in: this.items.map(item => item.id) };
      } else {
        cond[this.property.mappedBy] = this.owner.id;
      }
    }

    return cond;
  }

  private get property() {
    if (!this._property) {
      const metadata = getMetadataStorage();
      const meta = metadata[this.owner.constructor.name];
      const field = Object.keys(meta.properties).find(k => this.owner[k] === this);
      this._property = meta.properties[field];
    }

    return this._property;
  }

}
