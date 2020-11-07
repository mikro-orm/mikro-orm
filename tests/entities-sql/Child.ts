import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Parent } from './Parent';

@Entity()
export class Child {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @ManyToOne(() => Parent)
  parent!: Parent;

}
