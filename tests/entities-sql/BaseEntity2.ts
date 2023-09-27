import { BeforeCreate, Opt, PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity2 {

  @PrimaryKey()
  id!: number;

  @Property({ persist: false })
  hookTest: boolean & Opt = false;

  @BeforeCreate()
  baseBeforeCreate() {
    this.hookTest = true;
  }

}
