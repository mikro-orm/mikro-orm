import { Opt } from '@mikro-orm/core';
import { BeforeCreate, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

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
