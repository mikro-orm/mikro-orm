import { Collection, Entity, ManyToOne, MikroORM, OneToMany, ManyToMany, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Book, b => b.author2)
  books2 = new Collection<Book>(this);

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

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToOne(() => Author, { nullable: true })
  author2?: Author;

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);

  constructor(author: Author, title: string, tags: BookTag[] = []) {
    this.author = author;
    this.title = title;
    this.tags.set(tags);
  }

}

@Entity()
class BookTag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Book, b => b.tags)
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
    populateWhere: 'infer',
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

  const t1 = new BookTag('t1');
  const t2 = new BookTag('t2');
  const t3 = new BookTag('t3');
  const t4 = new BookTag('t4');
  const t5 = new BookTag('t5');

  author2.books.add(
    new Book(author2, 'Foo', [t1, t5]),
    new Book(author2, 'Foo', [t1, t3]),
  );
  author3.books.add(
    new Book(author3, 'Foo', [t2]),
    new Book(author3, 'Foo', [t2]),
    new Book(author3, 'Bar', [t2]),
    new Book(author3, 'Bar', [t2]),
  );
  author4.books.add(
    new Book(author4, 'Foo Bar', [t1, t2]),
    new Book(author4, 'Foo Bar', [t1, t2, t4]),
  );
  author5.books.add(new Book(author5, 'Foo', [t4, t5]));

  await orm.em.fork().persist([author1, author2, author3, author4, author5]).flush();
}

test('1:m sub-query operators $some, $none and $every', async () => {
  const mock = mockLogger(orm);

  let results = await orm.em.fork().find(Author, {
    books: { $some: { title: 'Foo' } },
  });
  expect(results.map(res => res.name)).toEqual(['Author 2', 'Author 3', 'Author 5']);
  expect(mock.mock.calls[0][0]).toBe("[query] select `a0`.* from `author` as `a0` where `a0`.`id` in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`title` = 'Foo')");

  results = await orm.em.fork().find(Author, {
    books: { $none: { title: 'Foo' } },
  });
  expect(results.map(res => res.name)).toEqual(['Author 1', 'Author 4']);
  expect(mock.mock.calls[1][0]).toBe("[query] select `a0`.* from `author` as `a0` where `a0`.`id` not in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`title` = 'Foo')");

  results = await orm.em.fork().find(Author, {
    books: { $every: { title: 'Foo' } },
    id: [1, 2, 5],
  });
  expect(results.map(res => res.name)).toEqual(['Author 1', 'Author 2', 'Author 5']);
  expect(mock.mock.calls[2][0]).toBe("[query] select `a0`.* from `author` as `a0` where `a0`.`id` not in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where not (`b1`.`title` = 'Foo')) and `a0`.`id` in (1, 2, 5)");

  results = await orm.em.fork().find(Author, {
    books: { $some: {} },
  });
  expect(results.map(res => res.name)).toEqual(['Author 2', 'Author 3', 'Author 4', 'Author 5']);
  expect(mock.mock.calls[3][0]).toBe('[query] select `a0`.* from `author` as `a0` where `a0`.`id` in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id`)');

  results = await orm.em.fork().find(Author, {
    books: { $none: {} },
    books2: { $none: {} },
  });
  expect(results.map(res => res.name)).toEqual(['Author 1']);
  expect(mock.mock.calls[4][0]).toBe('[query] select `a0`.* from `author` as `a0` where `a0`.`id` not in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id`) and `a0`.`id` not in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author2_id`)');
});

test('m:n sub-query operators $some, $none and $every (select-in)', async () => {
  orm.config.set('loadStrategy', 'select-in');
  const mock = mockLogger(orm);

  let results = await orm.em.fork().find(Book, {
    tags: { $some: { name: ['t1', 't2'] } },
  }, { populate: ['tags'] });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([
    ['t1', 't5'],
    ['t1', 't3'],
    ['t1', 't2'],
    ['t1', 't2', 't4'],
    ['t2'],
    ['t2'],
    ['t2'],
    ['t2'],
  ]);
  expect(mock.mock.calls[0][0]).toBe("[query] select `b0`.* from `book` as `b0` where `b0`.`id` in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where `b1`.`name` in ('t1', 't2'))");
  expect(mock.mock.calls[1][0]).toBe('[query] select `b1`.*, `b0`.`book_tag_id` as `fk__book_tag_id`, `b0`.`book_id` as `fk__book_id` from `book_tags` as `b0` inner join `book_tag` as `b1` on `b0`.`book_tag_id` = `b1`.`id` where `b0`.`book_id` in (1, 2, 3, 4, 5, 6, 7, 8)');

  results = await orm.em.fork().find(Book, {
    tags: { $none: { name: ['t1', 't2'] } },
  }, { populate: ['tags'], orderBy: { tags: { name: 1 } } });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([
    ['t4', 't5'],
  ]);
  expect(mock.mock.calls[2][0]).toBe("[query] select `b0`.* from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where `b0`.`id` not in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where `b1`.`name` in ('t1', 't2')) order by `b1`.`name` asc");
  expect(mock.mock.calls[3][0]).toBe('[query] select `b1`.*, `b0`.`book_tag_id` as `fk__book_tag_id`, `b0`.`book_id` as `fk__book_id` from `book_tags` as `b0` inner join `book_tag` as `b1` on `b0`.`book_tag_id` = `b1`.`id` where `b0`.`book_id` in (9) order by `b1`.`name` asc');

  results = await orm.em.fork().find(Book, {
    tags: { $every: { name: ['t1', 't2'] } },
  }, { populate: ['tags'], orderBy: { tags: { name: 1 } } });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([
    ['t1', 't2'],
    ['t2'],
    ['t2'],
    ['t2'],
    ['t2'],
  ]);
  expect(mock.mock.calls[4][0]).toBe("[query] select `b0`.* from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where `b0`.`id` not in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where not (`b1`.`name` in ('t1', 't2'))) order by `b1`.`name` asc");
  expect(mock.mock.calls[5][0]).toBe('[query] select `b1`.*, `b0`.`book_tag_id` as `fk__book_tag_id`, `b0`.`book_id` as `fk__book_id` from `book_tags` as `b0` inner join `book_tag` as `b1` on `b0`.`book_tag_id` = `b1`.`id` where `b0`.`book_id` in (3, 5, 6, 7, 8) order by `b1`.`name` asc');

  results = await orm.em.fork().find(Book, {
    tags: { $some: {} },
  }, { populate: ['tags'], orderBy: { tags: { name: 1 } } });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([
    ['t1', 't5'],
    ['t1', 't3'],
    ['t1', 't2'],
    ['t1', 't2', 't4'],
    ['t2'],
    ['t2'],
    ['t2'],
    ['t2'],
    ['t4', 't5'],
  ]);
  expect(mock.mock.calls[6][0]).toBe('[query] select `b0`.* from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where `b0`.`id` in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id`) order by `b1`.`name` asc');
  expect(mock.mock.calls[7][0]).toBe('[query] select `b1`.*, `b0`.`book_tag_id` as `fk__book_tag_id`, `b0`.`book_id` as `fk__book_id` from `book_tags` as `b0` inner join `book_tag` as `b1` on `b0`.`book_tag_id` = `b1`.`id` where `b0`.`book_id` in (1, 2, 3, 4, 5, 6, 7, 8, 9) order by `b1`.`name` asc');

  results = await orm.em.fork().find(Book, {
    tags: { $none: {} },
  }, { populate: ['tags'], orderBy: { tags: { name: 1 } } });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([]);
  expect(mock.mock.calls[8][0]).toBe('[query] select `b0`.* from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where `b0`.`id` not in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id`) order by `b1`.`name` asc');
});

test('m:n sub-query operators $some, $none and $every (joined)', async () => {
  orm.config.set('loadStrategy', 'joined');
  const mock = mockLogger(orm);

  let results = await orm.em.fork().find(Book, {
    tags: { $some: { name: ['t1', 't2'] } },
  }, { populate: ['tags'] });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([
    ['t1', 't5'],
    ['t1', 't3'],
    ['t1', 't2'],
    ['t1', 't2', 't4'],
    ['t2'],
    ['t2'],
    ['t2'],
    ['t2'],
  ]);
  expect(mock.mock.calls[0][0]).toBe("[query] select `b0`.*, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name` from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `t1` on `b2`.`book_tag_id` = `t1`.`id` where `b0`.`id` in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where `b1`.`name` in ('t1', 't2'))");

  results = await orm.em.fork().find(Book, {
    tags: { $none: { name: ['t1', 't2'] } },
  }, { populate: ['tags'], orderBy: { tags: { name: 1 } } });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([
    ['t4', 't5'],
  ]);
  expect(mock.mock.calls[1][0]).toBe("[query] select `b0`.*, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name` from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `t1` on `b2`.`book_tag_id` = `t1`.`id` where `b0`.`id` not in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where `b1`.`name` in ('t1', 't2')) order by `t1`.`name` asc");

  results = await orm.em.fork().find(Book, {
    tags: { $every: { name: ['t1', 't2'] } },
  }, { populate: ['tags'], orderBy: { tags: { name: 1 } } });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([
    ['t1', 't2'],
    ['t2'],
    ['t2'],
    ['t2'],
    ['t2'],
  ]);
  expect(mock.mock.calls[2][0]).toBe("[query] select `b0`.*, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name` from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `t1` on `b2`.`book_tag_id` = `t1`.`id` where `b0`.`id` not in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id` where not (`b1`.`name` in ('t1', 't2'))) order by `t1`.`name` asc");

  results = await orm.em.fork().find(Book, {
    tags: { $some: {} },
  }, { populate: ['tags'], orderBy: { tags: { name: 1 } } });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([
    ['t1', 't5'],
    ['t1', 't3'],
    ['t1', 't2'],
    ['t1', 't2', 't4'],
    ['t2'],
    ['t2'],
    ['t2'],
    ['t2'],
    ['t4', 't5'],
  ]);
  expect(mock.mock.calls[3][0]).toBe('[query] select `b0`.*, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name` from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `t1` on `b2`.`book_tag_id` = `t1`.`id` where `b0`.`id` in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id`) order by `t1`.`name` asc');

  results = await orm.em.fork().find(Book, {
    tags: { $none: {} },
  }, { populate: ['tags'], orderBy: { tags: { name: 1 } } });
  expect(results.map(res => res.tags.getIdentifiers('name'))).toEqual([]);
  expect(mock.mock.calls[4][0]).toBe('[query] select `b0`.*, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name` from `book` as `b0` left join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` left join `book_tag` as `t1` on `b2`.`book_tag_id` = `t1`.`id` where `b0`.`id` not in (select `b0`.`id` from `book` as `b0` inner join `book_tags` as `b2` on `b0`.`id` = `b2`.`book_id` inner join `book_tag` as `b1` on `b2`.`book_tag_id` = `b1`.`id`) order by `t1`.`name` asc');
});

test('allows only one of $some, $none and $every on the given level', async () => {
  const mock = mockLogger(orm);
  let results = await orm.em.fork().find(Author, {
    books: {
      $some: { title: 'Foo' },
      $none: { title: 'Foo' },
    },
  });
  expect(mock.mock.calls[0][0]).toBe("[query] select `a0`.* from `author` as `a0` where `a0`.`id` in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`title` = 'Foo') and `a0`.`id` not in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`title` = 'Foo')");
  expect(results).toHaveLength(0);

  results = await orm.em.fork().find(Author, {
    books: {
      $some: { title: 'Foo' },
      $none: { title: 'Foo 123' },
    },
  });
  expect(mock.mock.calls[1][0]).toBe("[query] select `a0`.* from `author` as `a0` where `a0`.`id` in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`title` = 'Foo') and `a0`.`id` not in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`title` = 'Foo 123')");
  expect(results.map(res => res.name)).toEqual([
    'Author 2',
    'Author 3',
    'Author 5',
  ]);
});

test('update query with $none', async () => {
  const mock = mockLogger(orm);
  await orm.em.nativeUpdate(Author, {
    books: {
      $none: { title: 'Foo' },
    },
  }, { name: 'foobar' });
  expect(mock.mock.calls[0][0]).toBe("[query] update `author` set `name` = 'foobar' where `id` not in (select `a0`.`id` from `author` as `a0` inner join `book` as `b1` on `a0`.`id` = `b1`.`author_id` where `b1`.`title` = 'Foo')");
});

test('disallow mixing', async () => {
  const mock = mockLogger(orm);
  // separate branches work
  await orm.em.fork().find(Author, {
    $and: [
      { books: { $none: { title: 'Foo' } } },
      { books: { title: 'bar' } },
    ],
  });
  // mixing throws
  await expect(orm.em.fork().find(Author, {
    books: {
      $none: { title: 'Foo' },
      title: 'bar',
    },
  })).rejects.toThrow('Mixing collection operators with other filters is not allowed.');
});
