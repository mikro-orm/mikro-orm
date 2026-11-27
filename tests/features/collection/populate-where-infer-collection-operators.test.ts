import { Collection, MikroORM, type FilterQuery } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
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

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Book, Tag],
  });
  await orm.schema.create();
  const t1 = orm.em.create(Tag, { name: 't1' });
  const t2 = orm.em.create(Tag, { name: 't2' });
  orm.em.create(Author, {
    name: 'a1',
    books: [
      { title: 'x', tags: [t1, t2] },
      { title: 'y', tags: [t2] },
    ],
  });
  orm.em.create(Author, { name: 'a2', books: [{ title: 'y', tags: [t2] }] });
  orm.em.create(Author, { name: 'a3' });
  await orm.em.flush();
});

afterAll(() => orm.close(true));

const x = ['x', ['t1', 't2']];
const y = ['y', ['t2']];

const cases: [string, FilterQuery<Author>, unknown][] = [
  ['$some', { books: { $some: { title: 'x' } } }, [['a1', [x, y]]]],
  [
    '$none',
    { books: { $none: { title: 'x' } } },
    [
      ['a2', [y]],
      ['a3', []],
    ],
  ],
  [
    '$every',
    { books: { $every: { title: 'y' } } },
    [
      ['a2', [y]],
      ['a3', []],
    ],
  ],
  ['$size', { books: { $size: 2 } }, [['a1', [x, y]]]],
  ['$all', { books: { $all: [{ title: 'x' }, { title: 'y' }] } }, [['a1', [x, y]]]],
  [
    '$some in $or',
    { $or: [{ books: { $some: { title: 'x' } } }, { name: 'a3' }] },
    [
      ['a1', [x, y]],
      ['a3', []],
    ],
  ],
  ['$some in $and', { $and: [{ books: { $some: { title: 'x' } } }, { books: { title: 'y' } }] }, [['a1', [y]]]],
  [
    '$some in $not',
    { $not: { books: { $some: { title: 'x' } } } },
    [
      ['a2', [y]],
      ['a3', []],
    ],
  ],
  ['nested $some', { books: { tags: { $some: { name: 't1' } } } }, [['a1', [x]]]],
];

describe.each(['select-in', 'joined', 'balanced'] as const)('%s strategy', strategy => {
  test.each(cases)('%s with populateWhere: infer', async (_, where, expected) => {
    const authors = await orm.em.fork().find(Author, where, {
      populate: ['books.tags'],
      populateWhere: 'infer',
      strategy,
      orderBy: { id: 'asc', books: { id: 'asc', tags: { id: 'asc' } } },
    });
    const actual = authors.map(a => [
      a.name,
      a.books.getItems().map(b => [b.title, b.tags.getItems().map(t => t.name)]),
    ]);
    expect(actual).toEqual(expected);
  });

  test('explicit populateWhere with a collection operator', async () => {
    const authors = await orm.em
      .fork()
      .find(
        Author,
        {},
        { populate: ['books'], populateWhere: { books: { $some: { title: 'x' } } }, strategy, orderBy: { id: 'asc' } },
      );
    expect(authors.map(a => a.books.getItems().map(b => b.title))).toEqual([['x', 'y'], ['y'], []]);
  });
});
