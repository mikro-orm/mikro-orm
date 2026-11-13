import { defineEntity, LoadStrategy, MikroORM, p, quote } from '@mikro-orm/postgresql';
import {
  Entity,
  Formula,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Formula(cols => `(select count(*) from book where book.author_id = ${cols.id})`)
  bookCount?: number;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;
}

const Shelf = defineEntity({
  name: 'Shelf',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    bookCount: p.integer().formula(() => quote`(select count(*) from ${'book'})`),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book, Shelf],
    dbName: 'numeric_formula_hydration',
  });
  await orm.schema.refresh();

  const author = orm.em.create(Author, { name: 'a' });
  orm.em.create(Book, { title: 'b1', author });
  orm.em.create(Book, { title: 'b2', author });
  orm.em.create(Shelf, { name: 's' });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

beforeEach(() => orm.em.clear());

// `count(*)` is a bigint in postgres, which the driver returns as a string
test('formula typed as number is hydrated as number', async () => {
  const author = await orm.em.findOneOrFail(Author, { name: 'a' });
  expect(author.bookCount).toBe(2);

  const shelf = await orm.em.findOneOrFail(Shelf, { name: 's' });
  expect(shelf.bookCount).toBe(2);
});

test.each([LoadStrategy.JOINED, LoadStrategy.SELECT_IN])(
  'formula typed as number is hydrated as number on a populated relation (%s)',
  async strategy => {
    const book = await orm.em.findOneOrFail(Book, { title: 'b1' }, { populate: ['author'], strategy });
    expect(book.author.bookCount).toBe(2);
  },
);
