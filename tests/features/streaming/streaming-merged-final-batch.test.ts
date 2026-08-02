import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () =>
      p
        .manyToMany(Book)
        .pivotTable('author_books')
        .fixedOrderColumn('sort_order')
        .joinColumn('author_id')
        .inverseJoinColumn('book_id'),
  },
});

// streaming a pivot entity whose local PK hash is not unique (externally managed pivot table with
// a non-unique fixed order column) - `mergeJoinedResult` can split one stack into multiple entities,
// and the final batch of the stream must yield all of them, not just the first one
describe('streaming with non-unique fixed order column', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: ':memory:',
    });

    // the pivot table is managed externally, the order column is not unique
    await orm.schema.execute(`
      create table book (id integer primary key, title text not null);
      create table author (id integer primary key, name text not null);
      create table author_books (
        author_id integer not null,
        book_id integer not null,
        sort_order integer not null,
        primary key (author_id, book_id)
      );
      insert into book (id, title) values (1, 'Shared'), (2, 'B2'), (3, 'B3');
      insert into author (id, name) values (1, 'A1'), (2, 'A2');
      insert into author_books (author_id, book_id, sort_order) values (1, 1, 10), (1, 2, 11), (2, 1, 10), (2, 3, 12);
    `);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('final stream batch yields all entities merged from the trailing stack', async () => {
    const qb = orm.em
      .fork()
      .createQueryBuilder<any, 'p'>('author_books' as any, 'p')
      .select('*')
      .leftJoinAndSelect('p.Author_owner', 'a')
      .orderBy({ sort_order: 'desc', Author_owner: 'asc' });

    const rows: any[] = [];

    // the two colliding `sort_order` rows come last, so they land in the final batch together
    for await (const row of qb.stream({ mapResults: false })) {
      rows.push(row);
    }

    expect(rows.map(r => [r.sort_order, r.Author_owner.id, r.Book_inverse])).toEqual([
      [12, 2, 3],
      [11, 1, 2],
      [10, 1, 1],
      [10, 2, 1],
    ]);
  });
});
