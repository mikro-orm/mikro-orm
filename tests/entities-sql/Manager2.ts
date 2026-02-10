import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { BaseUser2 } from './BaseUser2.js';

@Entity()
export class Manager2 extends BaseUser2 {
  @Property()
  managerProp!: string;
}
