import { MikroORM, ref, type Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
class Puppy extends Dog {
  @Property()
  age!: number;
}

@Entity()
class Keeper {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Animal, { ref: true })
  animal!: Ref<Animal>;
}

@Entity()
class Cat extends Animal {
  @ManyToOne(() => Keeper, { ref: true })
  keeper!: Ref<Keeper>;
}

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Dog, { ref: true })
  dog!: Ref<Dog>;

  @ManyToOne(() => Animal, { ref: true, nullable: true })
  pet?: Ref<Animal>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Owner, Animal, Dog, Puppy, Keeper, Cat],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('relation to an intermediate TPT class is inserted after its subclass target in the same flush', async () => {
  const em = orm.em.fork();
  const puppy = em.create(Puppy, { id: 1, name: 'max', breed: 'pug', age: 1 });
  em.create(Owner, { id: 1, dog: ref(puppy) });
  await em.flush();

  const owner = await orm.em.fork().findOneOrFail(Owner, 1, { populate: ['dog'] });
  expect(owner.dog.unwrap()).toBeInstanceOf(Puppy);
});

test('relations to TPT classes are deleted before their subclass target in the same flush', async () => {
  const em = orm.em.fork();
  const puppy = em.create(Puppy, { id: 2, name: 'rex', breed: 'beagle', age: 2 });
  const owner = em.create(Owner, { id: 2, dog: ref(puppy), pet: ref(puppy) });
  await em.flush();

  em.remove([puppy, owner]);
  await em.flush();

  expect(await orm.em.fork().count(Owner, 2)).toBe(0);
  expect(await orm.em.fork().count(Animal, 2)).toBe(0);
});

test('subclass with a required FK to an entity referencing its TPT root is inserted after that entity', async () => {
  const em = orm.em.fork();
  const animal = em.create(Animal, { id: 10, name: 'a' });
  em.create(Keeper, { id: 10, animal: ref(animal) });
  await em.flush();
  em.clear();

  const existingKeeper = await em.findOneOrFail(Keeper, 10);
  const existingAnimal = await em.findOneOrFail(Animal, 10);
  // the first change set is a Cat, so its node is visited first by the commit order calculator
  em.create(Cat, { id: 11, name: 'c1', keeper: ref(existingKeeper) });
  const keeper = em.create(Keeper, { id: 11, animal: ref(existingAnimal) });
  em.create(Cat, { id: 12, name: 'c2', keeper: ref(keeper) });
  await em.flush();

  expect(await orm.em.fork().count(Cat)).toBe(2);
});
