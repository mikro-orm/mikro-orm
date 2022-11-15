import { Collection, IdentifiedReference, Loaded, ManyToOne, OneToMany, Reference } from '@mikro-orm/core';

class Parent {

  @OneToMany(() => Child, c => c.parent)
  children = new Collection<Child>(this);

}

class Child {

  @ManyToOne(() => Parent, { inversedBy: 'children' })
  parent!: IdentifiedReference<Parent>;

}

async function load() {
  let populated: Loaded<Parent, 'children'>;
  const parent = {};

  if (Reference.isReference<Parent>(parent)) {
    populated = await parent.load({ populate: ['children'] });
  }
}
