import { MikroORM, raw } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Publisher, { nullable: true })
  publisher?: Publisher;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { nullable: true })
  author?: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Publisher, Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.create();
  const em = orm.em.fork();
  const publisher = em.create(Publisher, { id: 1, name: 'p1' });
  em.create(Book, { id: 1, title: 'b1', author: em.create(Author, { id: 1, name: 'a1', publisher }) });
  em.create(Book, { id: 2, title: 'b2', author: em.create(Author, { id: 2, name: 'a2' }) });
  em.create(Book, { id: 3, title: 'b3' });
  await em.flush();
});

afterAll(() => orm.close(true));

const createQueryBuilder = () =>
  orm.em
    .fork()
    .createQueryBuilder(Book, 'b')
    .select(['*', raw(`'x' as a__extra`)])
    .leftJoinAndSelect('b.author', 'a')
    .leftJoinAndSelect('a.publisher', 'p')
    .orderBy({ id: 'asc' });

const expected = [
  { id: 1, title: 'b1', a__extra: 'x', author: { id: 1, name: 'a1', publisher: { id: 1, name: 'p1' } } },
  { id: 2, title: 'b2', a__extra: 'x', author: { id: 2, name: 'a2', publisher: null } },
  { id: 3, title: 'b3', a__extra: 'x', author: null },
];

test('joined aliased columns are removed from mapped rows, unrelated aliased-looking columns are kept', async () => {
  const rows = await createQueryBuilder().execute('all');
  expect(rows).toStrictEqual(expected);
});

test('joined aliased columns are removed from streamed rows', async () => {
  const rows = [];

  for await (const row of createQueryBuilder().stream({ mapResults: false, mergeResults: false })) {
    rows.push(row);
  }

  expect(rows).toStrictEqual(expected);
});
