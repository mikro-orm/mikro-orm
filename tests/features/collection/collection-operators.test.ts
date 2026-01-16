import { Collection, MikroORM, SimpleLogger, Utils, IDatabaseDriver } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';
import { PLATFORMS } from '../../bootstrap.js';

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

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_collection_ops', port: 3308 },
  mariadb: { dbName: 'mikro_orm_collection_ops', port: 3309 },
  postgresql: { dbName: 'mikro_orm_collection_ops' },
};

describe.each(Utils.keys(options))('collection operators [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      driver: PLATFORMS[type],
      metadataProvider: ReflectMetadataProvider,
      entities: [Author],
      loggerFactory: SimpleLogger.create,
      populateWhere: 'infer',
      ...options[type],
    });

    await orm.schema.refresh();
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
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.name)).toEqual(['Author 2', 'Author 3', 'Author 5']);
    expect(mock.mock.calls[0][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Author, {
      books: { $none: { title: 'Foo' } },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.name)).toEqual(['Author 1', 'Author 4']);
    expect(mock.mock.calls[1][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Author, {
      books: { $every: { title: 'Foo' } },
      id: [1, 2, 5],
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.name)).toEqual(['Author 1', 'Author 2', 'Author 5']);
    expect(mock.mock.calls[2][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Author, {
      books: { $some: {} },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.name)).toEqual(['Author 2', 'Author 3', 'Author 4', 'Author 5']);
    expect(mock.mock.calls[3][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Author, {
      books: { $none: {} },
      books2: { $none: {} },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.name)).toEqual(['Author 1']);
    expect(mock.mock.calls[4][0]).toMatchSnapshot();
  });

  test('m:n sub-query operators $some, $none and $every (select-in)', async () => {
    orm.config.set('loadStrategy', 'select-in');
    const mock = mockLogger(orm);

    let results = await orm.em.fork().find(Book, {
      tags: { $some: { name: ['t1', 't2'] } },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([
      ['t1', 't5'],
      ['t1', 't3'],
      ['t1', 't2'],
      ['t1', 't2', 't4'],
      ['t2'],
      ['t2'],
      ['t2'],
      ['t2'],
    ]);
    expect(mock.mock.calls[0][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Book, {
      tags: { $none: { name: ['t1', 't2'] } },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([
      ['t4', 't5'],
    ]);
    expect(mock.mock.calls[2][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Book, {
      tags: { $every: { name: ['t1', 't2'] } },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([
      ['t1', 't2'],
      ['t2'],
      ['t2'],
      ['t2'],
      ['t2'],
    ]);
    expect(mock.mock.calls[4][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Book, {
      tags: { $some: {} },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([
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
    expect(mock.mock.calls[6][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Book, {
      tags: { $none: {} },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([]);
    expect(mock.mock.calls[8][0]).toMatchSnapshot();
  });

  test('m:n sub-query operators $some, $none and $every (joined)', async () => {
    orm.config.set('loadStrategy', 'joined');
    const mock = mockLogger(orm);

    let results = await orm.em.fork().find(Book, {
      tags: { $some: { name: ['t1', 't2'] } },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([
      ['t1', 't5'],
      ['t1', 't3'],
      ['t1', 't2'],
      ['t1', 't2', 't4'],
      ['t2'],
      ['t2'],
      ['t2'],
      ['t2'],
    ]);
    expect(mock.mock.calls[0][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Book, {
      tags: { $none: { name: ['t1', 't2'] } },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([
      ['t4', 't5'],
    ]);
    expect(mock.mock.calls[1][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Book, {
      tags: { $every: { name: ['t1', 't2'] } },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([
      ['t1', 't2'],
      ['t2'],
      ['t2'],
      ['t2'],
      ['t2'],
    ]);
    expect(mock.mock.calls[2][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Book, {
      tags: { $some: {} },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([
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
    expect(mock.mock.calls[3][0]).toMatchSnapshot();

    results = await orm.em.fork().find(Book, {
      tags: { $none: {} },
    }, { populate: ['tags'], orderBy: { id: 1 } });
    expect(results.map(res => res.tags.getIdentifiers('name').sort())).toEqual([]);
    expect(mock.mock.calls[4][0]).toMatchSnapshot();
  });

  test('allows only one of $some, $none and $every on the given level', async () => {
    const mock = mockLogger(orm);
    let results = await orm.em.fork().find(Author, {
      books: {
        $some: { title: 'Foo' },
        $none: { title: 'Foo' },
      },
    }, { orderBy: { id: 1 } });
    expect(mock.mock.calls[0][0]).toMatchSnapshot();
    expect(results).toHaveLength(0);

    results = await orm.em.fork().find(Author, {
      books: {
        $some: { title: 'Foo' },
        $none: { title: 'Foo 123' },
      },
    }, { orderBy: { id: 1 } });
    expect(mock.mock.calls[1][0]).toMatchSnapshot();
    expect(results.map(res => res.name)).toEqual([
      'Author 2',
      'Author 3',
      'Author 5',
    ]);
  });

  test('update query with $none', async () => {
    // MySQL doesn't support subqueries referencing the target table in UPDATE
    if (type === 'mysql') {
      await expect(orm.em.nativeUpdate(Author, {
        books: { $none: { title: 'Foo' } },
      }, { name: 'foobar' })).rejects.toThrow(/You can't specify target table/);
      return;
    }

    const mock = mockLogger(orm);
    await orm.em.nativeUpdate(Author, {
      books: {
        $none: { title: 'Foo' },
      },
    }, { name: 'foobar' });
    expect(mock.mock.calls[0][0]).toMatchSnapshot();
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

  test('1:m $size operator', async () => {
    const mock = mockLogger(orm);

    // $size: 0 - authors with no books
    let results = await orm.em.fork().find(Author, {
      books: { $size: 0 },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.id)).toEqual([1]);
    expect(mock.mock.calls[0][0]).toMatchSnapshot();

    // $size: 1 - authors with exactly 1 book
    results = await orm.em.fork().find(Author, {
      books: { $size: 1 },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.id)).toEqual([5]);
    expect(mock.mock.calls[1][0]).toMatchSnapshot();

    // $size: 2 - authors with exactly 2 books
    results = await orm.em.fork().find(Author, {
      books: { $size: 2 },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.id)).toEqual([2, 4]);
    expect(mock.mock.calls[2][0]).toMatchSnapshot();

    // $size: 4 - authors with exactly 4 books
    results = await orm.em.fork().find(Author, {
      books: { $size: 4 },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.id)).toEqual([3]);
    expect(mock.mock.calls[3][0]).toMatchSnapshot();

    // $size with $gte - authors with at least 2 books
    results = await orm.em.fork().find(Author, {
      books: { $size: { $gte: 2 } },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.id)).toEqual([2, 3, 4]);
    expect(mock.mock.calls[4][0]).toMatchSnapshot();

    // $size with $gt and $lte - authors with between 1 and 2 books (exclusive lower, inclusive upper)
    results = await orm.em.fork().find(Author, {
      books: { $size: { $gt: 0, $lte: 2 } },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.id)).toEqual([2, 4, 5]);
    expect(mock.mock.calls[5][0]).toMatchSnapshot();

    // $size with $ne - authors that don't have exactly 2 books (now includes author 1 with 0 books)
    results = await orm.em.fork().find(Author, {
      books: { $size: { $ne: 2 } },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.id)).toEqual([1, 3, 5]);
    expect(mock.mock.calls[6][0]).toMatchSnapshot();
  });

  test('m:n $size operator', async () => {
    const mock = mockLogger(orm);

    // Books with exactly 2 tags
    let results = await orm.em.fork().find(Book, {
      tags: { $size: 2 },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.title)).toEqual(['Foo', 'Foo', 'Foo Bar', 'Foo']);
    expect(mock.mock.calls[0][0]).toMatchSnapshot();

    // Books with at least 3 tags
    results = await orm.em.fork().find(Book, {
      tags: { $size: { $gte: 3 } },
    }, { orderBy: { id: 1 } });
    expect(results.map(res => res.title)).toEqual(['Foo Bar']);
    expect(mock.mock.calls[1][0]).toMatchSnapshot();
  });
});
