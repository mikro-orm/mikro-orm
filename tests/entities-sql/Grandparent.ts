import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Parent } from './Parent';

@Entity()
export class Grandparent {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToMany(() => Parent, parent => parent.parent, { orphanRemoval: true })
  children = new Collection<Parent>(this);

}
