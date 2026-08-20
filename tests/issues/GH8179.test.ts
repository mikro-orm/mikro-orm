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
@Filter({ name: 'visible', cond: { $or: [{ open: true }, { country: { code: 'DE' } }] }, default: true })
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  open!: boolean;

  @ManyToOne(() => Country, { ref: true })
  country!: Ref<Country>;
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
    entities: [Country, Publisher, Book],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  await em.insertMany(Country, [
    { id: 1, code: 'DE' },
    { id: 2, code: 'FR' },
  ]);
  await em.insertMany(Publisher, [
    { id: 10, open: true, country: 2 }, // passes via `open`
    { id: 11, open: false, country: 1 }, // passes via `country.code`
    { id: 12, open: false, country: 2 }, // passes neither
  ]);
  await em.insertMany(Book, [
    { id: 100, publisher: 10 },
    { id: 101, publisher: 11 },
    { id: 102, publisher: 12 },
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test('filter `$or` spanning a joined to-one stays a disjunction (GH #8179)', async () => {
  const em = orm.em.fork();
  const books = await em.find(Book, {}, { populate: ['publisher'], strategy: 'joined', orderBy: { id: 'asc' } });

  expect(books.map(b => b.id)).toEqual([100, 101]);
});
