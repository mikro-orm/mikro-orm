import { BeforeCreate, PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity2 {

  @PrimaryKey()
  id!: number;

  @Property({ persist: false })
  hookTest = false;

  @BeforeCreate()
  baseBeforeCreate() {
    this.hookTest = true;
  }

}
