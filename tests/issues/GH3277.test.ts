import { Collection, Entity, EntityManager, IdentifiedReference, Loaded, ManyToOne, OneToMany } from '@mikro-orm/core';

@Entity()
class Owner {

  @OneToMany(() => Vehicle, v => v.owner)
  vehicles = new Collection<Vehicle>(this);

}

@Entity()
class Manufacturer {

}

@Entity()
class Type {

}

@Entity()
class Vehicle {

  @ManyToOne(() => Owner, { wrappedReference: true, inversedBy: 'vehicles' })
  owner!: IdentifiedReference<Owner>;

  @ManyToOne(() => Manufacturer, { wrappedReference: true })
  manufacturer!: IdentifiedReference<Manufacturer>;

  @ManyToOne(() => Type, { wrappedReference: true })
  type!: IdentifiedReference<Type>;

}

function preloaded(owner: Loaded<Owner, 'vehicles.type'>) {
  // no-op
}

async function service() {
  const em = {} as EntityManager;

  const owner1 = await em.findOneOrFail(Owner, {}, { populate: ['vehicles.type', 'vehicles.manufacturer'] });

  preloaded(owner1);

  const owner2 = await em.findOneOrFail(Owner, {}, { populate: ['vehicles.type'] });

  preloaded(owner2);
}

const owner1 = {} as Loaded<Owner, 'vehicles.manufacturer' | 'vehicles.type'>;
const owner2 = {} as Loaded<Owner, 'vehicles.type'>;

preloaded(owner1);
preloaded(owner2);
