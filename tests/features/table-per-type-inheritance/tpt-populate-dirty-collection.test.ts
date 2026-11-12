import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ inheritance: 'tpt' })
class Animal {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Dog extends Animal {
  @Property()
  breed!: string;
}

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Dog)
  dogs = new Collection<Dog>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Owner, Animal, Dog],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const dogs = [1, 2].map(id => orm.em.create(Dog, { id, name: `d${id}`, breed: `b${id}` }));
  orm.em.create(Owner, { id: 1, dogs: [dogs[0]] });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('populate loads a child reference added to a dirty collection', async () => {
  const owner = await orm.em.findOneOrFail(Owner, 1, { populate: ['dogs'] });
  owner.dogs.add(orm.em.getReference(Dog, 2));
  await orm.em.populate(owner, ['dogs']);
  expect(owner.dogs.getItems().map(d => [d.name, d.breed])).toEqual([
    ['d1', 'b1'],
    ['d2', 'b2'],
  ]);
});

test('populate loads child-only fields of a reference added to a dirty collection', async () => {
  const owner = await orm.em.findOneOrFail(Owner, 1, { populate: ['dogs'] });
  owner.dogs.add(orm.em.getReference(Dog, 2));
  await orm.em.populate(owner, ['dogs'], { fields: ['dogs.breed'] });
  expect(owner.dogs.getItems().map(d => d.breed)).toEqual(['b1', 'b2']);
});
