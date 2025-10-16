import { Entity, Property } from '@mikro-orm/core';
import { BaseUser2 } from './BaseUser2.js';

@Entity()
export class Manager2 extends BaseUser2 {

  @Property()
  managerProp!: string;

}
