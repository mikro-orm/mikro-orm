import { Collection, Entity, OneToMany, PrimaryKey, Property, Cascade } from '@mikro-orm/core';
import { Parent } from './Parent';

@Entity()
export class Grandparent {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToMany(() => Parent, parent => parent.parent, { orphanRemoval: true, cascade: [Cascade.ALL] })
  children = new Collection<Parent>(this);

}
