import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseUser2 } from './BaseUser2.js';

@Entity()
@Unique({ properties: 'employeeProp' })
export class Employee2 extends BaseUser2 {

  @Property()
  employeeProp!: number;

}
