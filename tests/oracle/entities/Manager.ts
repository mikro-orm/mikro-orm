import { Entity, Property } from '@mikro-orm/core';
import { BaseUser } from './BaseUser';

@Entity()
export class Manager extends BaseUser {

  @Property()
  managerProp!: string;

}
