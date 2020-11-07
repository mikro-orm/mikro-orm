import { Cascade, Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Grandparent } from './Grandparent';
import { Child } from './Child';


@Entity()
export class Parent {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @ManyToOne(() => Grandparent)
  parent!: Grandparent;

  @OneToMany(() => Child, parent => parent.parent, { orphanRemoval: true, cascade: [Cascade.ALL] })
  children = new Collection<Child>(this);

}


