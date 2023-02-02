import { BeforeCreate, Collection, PrimaryKey, Property, ReferenceKind, Utils, wrap } from '@mikro-orm/core';

export abstract class BaseEntity2 {

  @PrimaryKey()
  id!: number;

  @Property({ persist: false })
  hookTest = false;

  protected constructor() {
    const props = wrap(this, true).__meta.properties;

    Utils.keys(props).forEach(prop => {
      if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(props[prop].kind)) {
        (this as any)[prop] = new Collection(this);
      }
    });
  }

  @BeforeCreate()
  baseBeforeCreate() {
    this.hookTest = true;
  }

}
