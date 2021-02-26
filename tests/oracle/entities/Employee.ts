import { Entity, Property } from '@mikro-orm/core';
import { BaseUser } from './BaseUser';

@Entity()
export class Employee extends BaseUser {

  @Property()
  employeeProp!: number;

}

