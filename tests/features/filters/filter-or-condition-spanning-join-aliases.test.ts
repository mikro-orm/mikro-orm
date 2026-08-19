import { MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, Filter, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Country {
  @PrimaryKey()
  id!: number;

  @Property()
  code!: string;
}

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

// `sibling` spans two to-one relations, so the disjunction anchors on their common parent join;
// the first `$or` of `stacked` targets only the publisher alias and is distributed into its `on`
// clause, the second spans the country join and must be attached intact on top of it
@Entity()
@Filter({ name: 'sibling', cond: { $or: [{ country: { code: 'DE' } }, { owner: { name: 'boss' } }] } })
@Filter({
  name: 'stacked',
  cond: {
    $and: [{ $or: [{ open: true }, { active: true }] }, { $or: [{ open: true }, { country: { code: 'DE' } }] }],
  },
})
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  open!: boolean;

  @Property()
  active!: boolean;

  @ManyToOne(() => Country, { ref: true, nullable: true })
  country?: Ref<Country>;

  @ManyToOne(() => Owner, { ref: true })
  owner!: Ref<Owner>;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Publisher, { ref: true })
  publisher!: Ref<Publisher>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Country, Owner, Publisher, Book],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  await em.insertMany(Country, [
    { id: 1, code: 'DE' },
    { id: 2, code: 'FR' },
  ]);
  await em.insertMany(Owner, [
    { id: 1, name: 'boss' },
    { id: 2, name: 'other' },
  ]);
  await em.insertMany(Publisher, [
    { id: 10, open: false, active: true, country: 1, owner: 2 },
    { id: 11, open: true, active: false, country: 2, owner: 1 },
    { id: 12, open: false, active: true, country: null, owner: 1 },
    { id: 13, open: false, active: false, country: 2, owner: 2 },
  ]);
  await em.insertMany(Book, [
    { id: 100, publisher: 10 },
    { id: 101, publisher: 11 },
    { id: 102, publisher: 12 },
    { id: 103, publisher: 13 },
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test('filter `$or` spanning two sibling to-one relations stays a disjunction on joined populate', async () => {
  const em = orm.em.fork();
  const books = await em.find(
    Book,
    {},
    { populate: ['publisher'], strategy: 'joined', filters: ['sibling'], orderBy: { id: 'asc' } },
  );

  // 10 passes via `country.code`, 11 via `owner.name`, 12 via `owner.name` despite missing country
  expect(books.map(b => b.id)).toEqual([100, 101, 102]);
});

test('both `$or` conditions of a filter apply on joined populate', async () => {
  const em = orm.em.fork();
  const books = await em.find(
    Book,
    {},
    { populate: ['publisher'], strategy: 'joined', filters: ['stacked'], orderBy: { id: 'asc' } },
  );

  // 10 passes via `active` + `country.code`, 11 via `open`, 12 fails the second `$or`, 13 the first
  expect(books.map(b => b.id)).toEqual([100, 101]);
});
