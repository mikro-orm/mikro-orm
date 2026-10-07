import { MikroORM, ref, type Opt, type Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

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

  @Property({ formula: cols => `upper(${cols.breed})` })
  breedUpper!: Opt<string>;

  @Property({ formula: cols => `${cols.name} || ' the ' || ${cols.breed}` })
  title!: Opt<string>;
}

@Entity()
class Puppy extends Dog {
  @Property()
  age!: number;

  @Property({ formula: cols => `${cols.name} || ' ' || ${cols.breed} || ' ' || ${cols.age}` })
  label!: Opt<string>;
}

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Animal, { ref: true })
  pet!: Ref<Animal>;

  @ManyToOne(() => Dog, { ref: true, nullable: true })
  dog?: Ref<Dog>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Owner, Animal, Dog, Puppy],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
  const dog = orm.em.create(Dog, { id: 1, name: 'rex', breed: 'beagle' });
  const puppy = orm.em.create(Puppy, { id: 2, name: 'max', breed: 'pug', age: 1 });
  await orm.em.flush();
  orm.em.create(Owner, { id: 1, pet: ref(dog), dog: ref(puppy) });
  await orm.em.flush();
});

afterAll(() => orm.close(true));

test('formulas on a TPT child are selected when querying the root entity', async () => {
  const em = orm.em.fork();
  const dog = await em.findOneOrFail(Animal, 1);

  expect(dog).toBeInstanceOf(Dog);
  expect((dog as Dog).breedUpper).toBe('BEAGLE');
  expect((dog as Dog).title).toBe('rex the beagle');
});

test('formulas on a TPT child are selected when joining the root entity', async () => {
  const em = orm.em.fork();
  const owner = await em.findOneOrFail(Owner, 1, { populate: ['pet'], strategy: 'joined' });
  const dog = owner.pet.unwrap() as Dog;

  expect(dog).toBeInstanceOf(Dog);
  expect(dog.breedUpper).toBe('BEAGLE');
  expect(dog.title).toBe('rex the beagle');
});

test('formulas on a nested TPT child resolve inherited columns from every ancestor table', async () => {
  const em = orm.em.fork();
  const fromRoot = await em.findOneOrFail(Animal, 2);
  expect(fromRoot).toBeInstanceOf(Puppy);
  expect((fromRoot as Puppy).label).toBe('max pug 1');
  expect((fromRoot as Puppy).title).toBe('max the pug');

  const fromDog = await orm.em.fork().findOneOrFail(Dog, 2);
  expect(fromDog).toBeInstanceOf(Puppy);
  expect((fromDog as Puppy).label).toBe('max pug 1');

  const sql = em.createQueryBuilder(Dog, 'd').select('*').getFormattedQuery();
  expect(sql).toContain("a1.name || ' ' || d.breed || ' ' || p2.age as `p2__label`");
  expect(em.createQueryBuilder(Puppy, 'p').select('*').getFormattedQuery()).not.toContain('__title');

  const mock = mockLogger(orm);
  await orm.em.fork().findOneOrFail(Owner, 1, { populate: ['dog'], strategy: 'joined' });
  expect(mock.mock.calls[0][0]).toMatch(/a\d\.name \|\| ' ' \|\| d\d\.breed \|\| ' ' \|\| p\d\.age as `p\d__label`/);
});
