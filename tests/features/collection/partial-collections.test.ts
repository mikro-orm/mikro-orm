import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  ManyToMany,
  PrimaryKey,
  Property,
  SimpleLogger,
  serialize,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Book, b => b.author, { where: { favorite: true } })
  favoriteBooks = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  favorite: boolean;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);

  @ManyToMany({ entity: () => BookTag, pivotTable: 'book_tags', where: { popular: true } })
  popularTags = new Collection<BookTag>(this);

  constructor(author: Author, title: string, tags: BookTag[] = [], favorite = false) {
    this.author = author;
    this.title = title;
    this.favorite = favorite;
    this.tags.set(tags);
  }

}

@Entity()
class BookTag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  popular: boolean;

  @ManyToMany(() => Book, b => b.tags)
  books = new Collection<Book>(this);

  constructor(name: string, popular = false) {
    this.name = name;
    this.popular = popular;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });

  await orm.schema.createSchema();
  await createEntities();
});

beforeEach(() => orm.em.clear());
afterAll(() => orm.close(true));

async function createEntities() {
  const author1 = new Author('Author 1'); // no books
  const author2 = new Author('Author 2'); // only 'Foo'
  const author3 = new Author('Author 3'); // 'Foo' and 'Bar'
  const author4 = new Author('Author 4'); // only 'Foo Bar'
  const author5 = new Author('Author 5'); // only 'Foo'

  const t1 = new BookTag('t1', true);
  const t2 = new BookTag('t2', true);
  const t3 = new BookTag('t3');
  const t4 = new BookTag('t4');
  const t5 = new BookTag('t5', true);

  author2.books.add(
    new Book(author2, 'Foo 1', [t1, t5], true),
    new Book(author2, 'Foo 2', [t1, t3]),
  );
  author3.books.add(
    new Book(author3, 'Foo 3', [t2]),
    new Book(author3, 'Foo 4', [t4], true),
    new Book(author3, 'Bar 1', [t2], true),
    new Book(author3, 'Bar 2', [t2], true),
  );
  author4.books.add(
    new Book(author4, 'Foo Bar 1', [t1, t2], true),
    new Book(author4, 'Foo Bar 2', [t1, t2, t4]),
  );
  author5.books.add(new Book(author5, 'Foo', [t4, t5]));

  await orm.em.fork().persist([author1, author2, author3, author4, author5]).flush();
}

const expected = [
  {
    favoriteBooks: [],
    id: 1,
    name: 'Author 1',
  },
  {
    favoriteBooks: [
      {
        author: { id: 2, name: 'Author 2' },
        favorite: true,
        id: 1,
        popularTags: [
          { id: 1, name: 't1', popular: true },
          { id: 2, name: 't5', popular: true },
        ],
        title: 'Foo 1',
      },
    ],
    id: 2,
    name: 'Author 2',
  },
  {
    favoriteBooks: [
      {
        author: { id: 3, name: 'Author 3' },
        favorite: true,
        id: 6,
        popularTags: [],
        title: 'Foo 4',
      },
      {
        author: { id: 3, name: 'Author 3' },
        favorite: true,
        id: 8,
        popularTags: [
          { id: 4, name: 't2', popular: true },
        ],
        title: 'Bar 1',
      },
      {
        author: { id: 3, name: 'Author 3' },
        favorite: true,
        id: 9,
        popularTags: [
          { id: 4, name: 't2', popular: true },
        ],
        title: 'Bar 2',
      },
    ],
    id: 3,
    name: 'Author 3',
  },
  {
    favoriteBooks: [
      {
        author: { id: 4, name: 'Author 4' },
        favorite: true,
        id: 3,
        popularTags: [
          { id: 1, name: 't1', popular: true },
          { id: 4, name: 't2', popular: true },
        ],
        title: 'Foo Bar 1',
      },
    ],
    id: 4,
    name: 'Author 4',
  },
  {
    favoriteBooks: [],
    id: 5,
    name: 'Author 5',
  },
];

test('declarative partial loading of 1:m and m:n', async () => {
  const mock = mockLogger(orm);
  const r1 = await orm.em.fork().findAll(Author, {
    populate: ['favoriteBooks.popularTags'],
    strategy: 'joined',
    orderBy: { id: 'asc' },
  });
  expect(mock.mock.calls).toHaveLength(1);
  expect(mock.mock.calls[0][0]).toBe('[query] ' +
    'select `a0`.*, `f1`.`id` as `f1__id`, `f1`.`title` as `f1__title`, `f1`.`favorite` as `f1__favorite`, `f1`.`author_id` as `f1__author_id`, `p2`.`id` as `p2__id`, `p2`.`name` as `p2__name`, `p2`.`popular` as `p2__popular` ' +
    'from `author` as `a0` ' +
    'left join `book` as `f1` on `a0`.`id` = `f1`.`author_id` and `f1`.`favorite` = true and `f1`.`favorite` = true ' +
    'left join (`book_tags` as `b3` inner join `book_tag` as `p2` on `b3`.`book_tag_id` = `p2`.`id` and `p2`.`popular` = true) on `f1`.`id` = `b3`.`book_id` ' +
    'order by `a0`.`id` asc');
  expect(serialize(r1, { populate: ['*'] })).toEqual(expected);

  mock.mockReset();
  const r2 = await orm.em.fork().findAll(Author, {
    populate: ['favoriteBooks.popularTags'],
    strategy: 'select-in',
    orderBy: { id: 'asc' },
  });
  expect(mock.mock.calls).toHaveLength(3);
  expect(mock.mock.calls[0][0]).toBe('[query] select `a0`.* from `author` as `a0` order by `a0`.`id` asc');
  expect(mock.mock.calls[1][0]).toBe('[query] select `b0`.* from `book` as `b0` where `b0`.`author_id` in (1, 2, 3, 4, 5) and `b0`.`favorite` = true');
  expect(mock.mock.calls[2][0]).toBe('[query] select `b1`.*, `b0`.`book_tag_id` as `fk__book_tag_id`, `b0`.`book_id` as `fk__book_id` from `book_tags` as `b0` inner join `book_tag` as `b1` on `b0`.`book_tag_id` = `b1`.`id` where `b1`.`popular` = true and `b0`.`book_id` in (1, 6, 8, 9, 3)');
  expect(serialize(r2, { populate: ['*'] })).toEqual(expected);
});
