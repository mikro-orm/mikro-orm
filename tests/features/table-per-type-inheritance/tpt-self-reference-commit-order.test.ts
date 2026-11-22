import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ inheritance: 'tpt' })
class Animal {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Animal, { nullable: true, deleteRule: 'no action' })
  parent?: Animal;
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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Animal, Dog, Puppy],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
});

beforeEach(() => orm.schema.refresh());
afterAll(() => orm.close(true));

test('self-reference on the TPT root keeps parent tables first in a three-level hierarchy', async () => {
  const em = orm.em.fork();
  const p1 = em.create(Puppy, { name: 'p1', breed: 'pug', age: 1 });
  await em.flush();
  em.create(Puppy, { name: 'p2', breed: 'pug', age: 2, parent: p1 });
  em.create(Dog, { name: 'd1', breed: 'beagle', parent: p1 });
  await em.flush();

  const rows = await orm.em.fork().find(Animal, {}, { orderBy: { id: 'asc' } });
  expect(rows.map(a => [a.constructor.name, a.name, a.parent?.id])).toEqual([
    ['Puppy', 'p1', undefined],
    ['Puppy', 'p2', 1],
    ['Dog', 'd1', 1],
  ]);
});

test('self-referencing TPT entities can be removed', async () => {
  const em = orm.em.fork();
  const p1 = em.create(Puppy, { name: 'p1', breed: 'pug', age: 1 });
  await em.flush();
  const p2 = em.create(Puppy, { name: 'p2', breed: 'pug', age: 2, parent: p1 });
  const d1 = em.create(Dog, { name: 'd1', breed: 'beagle', parent: p1 });
  await em.flush();

  em.remove(p2).remove(d1);
  await em.flush();
  em.remove(p1);
  await em.flush();

  expect(await orm.em.fork().count(Animal)).toBe(0);
});

test('root row referencing a leaf two levels down is deleted before it', async () => {
  const em = orm.em.fork();
  const puppy = em.create(Puppy, { name: 'p1', breed: 'pug', age: 1 });
  await em.flush();
  const animal = em.create(Animal, { name: 'a1', parent: puppy });
  await em.flush();

  em.remove(puppy).remove(animal);
  await em.flush();

  expect(await orm.em.fork().count(Animal)).toBe(0);
});
