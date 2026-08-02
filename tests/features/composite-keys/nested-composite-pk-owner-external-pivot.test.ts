import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});

const Region = defineEntity({
  name: 'Region',
  properties: {
    country: p.string().primary(),
    code: p.string().primary(),
  },
});

// nested composite PK (a primary M:1 to a composite PK entity) + externally managed
// pivot table with a non-unique fixed order column
const Owner = defineEntity({
  name: 'Owner',
  properties: {
    region: () => p.manyToOne(Region).primary(),
    id: p.integer().primary(),
    name: p.string(),
    books: () =>
      p
        .manyToMany(Book)
        .pivotTable('owner_books')
        .fixedOrderColumn('sort_order')
        .joinColumns('o_country', 'o_code', 'o_id')
        .inverseJoinColumns('book_id'),
  },
});

async function createSchema(orm: MikroORM) {
  await orm.schema.execute(`
    create table book (id integer primary key, title text not null);
    create table region (country text not null, code text not null, primary key (country, code));
    create table owner (region_country text not null, region_code text not null, id integer not null, name text not null, primary key (region_country, region_code, id));
    create table owner_books (
      o_country text not null,
      o_code text not null,
      o_id integer not null,
      book_id integer not null,
      sort_order integer not null,
      primary key (o_country, o_code, o_id, book_id)
    );
    insert into book (id, title) values (1, 'Shared'), (2, 'B2'), (3, 'B3');
  `);
}

describe('M:N with a nested composite PK owner and an external pivot table', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Owner, Region, Book],
      dbName: ':memory:',
    });

    await createSchema(orm);
    await orm.schema.execute(`
      insert into region (country, code) values ('cz', 'pr');
      insert into owner (region_country, region_code, id, name) values ('cz', 'pr', 1, 'O1'), ('cz', 'pr', 2, 'O2');
      insert into owner_books (o_country, o_code, o_id, book_id, sort_order)
        values ('cz', 'pr', 1, 1, 10), ('cz', 'pr', 1, 2, 11), ('cz', 'pr', 2, 1, 10), ('cz', 'pr', 2, 3, 12);
    `);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('populating m:n with select-in strategy', async () => {
    const owners = await orm.em
      .fork()
      .find(Owner, {}, { populate: ['books'], strategy: 'select-in', orderBy: { id: 'asc' } });

    expect(owners.map(o => o.books.getItems().map(b => b.id))).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });

  test('populating m:n with joined strategy', async () => {
    const owners = await orm.em
      .fork()
      .find(Owner, {}, { populate: ['books'], strategy: 'joined', orderBy: { id: 'asc' } });

    expect(owners.map(o => o.books.getItems().map(b => b.id))).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });
});

describe('nested PK tuples that comma-join to the same string', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Owner, Region, Book],
      dbName: ':memory:',
    });

    // the region tuples differ, but both comma-join to 'a,b,c', so a naive
    // one-level flattening of the nested PK produces the same row hash
    await createSchema(orm);
    await orm.schema.execute(`
      insert into region (country, code) values ('a', 'b,c'), ('a,b', 'c');
      insert into owner (region_country, region_code, id, name) values ('a', 'b,c', 1, 'O1'), ('a,b', 'c', 1, 'O2');
      insert into owner_books (o_country, o_code, o_id, book_id, sort_order)
        values ('a', 'b,c', 1, 1, 10), ('a', 'b,c', 1, 2, 11), ('a,b', 'c', 1, 1, 10), ('a,b', 'c', 1, 3, 12);
    `);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('pivot rows of different owners are not deduplicated (select-in)', async () => {
    const owners = await orm.em
      .fork()
      .find(Owner, {}, { populate: ['books'], strategy: 'select-in', orderBy: { region: { country: 'asc' } } });

    expect(owners.map(o => o.books.getItems().map(b => b.id))).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });

  test('owner rows are not merged (joined)', async () => {
    const owners = await orm.em
      .fork()
      .find(Owner, {}, { populate: ['books'], strategy: 'joined', orderBy: { region: { country: 'asc' } } });

    expect(owners.map(o => o.name)).toEqual(['O1', 'O2']);
    expect(owners.map(o => o.books.getItems().map(b => b.id))).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });
});
