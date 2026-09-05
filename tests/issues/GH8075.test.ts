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

describe('non-unique fixed order column', () => {
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

  test('populating m:n keeps shared items on every owner', async () => {
    const authors = await orm.em.fork().find(Author, {}, { populate: ['books'], orderBy: { id: 'asc' } });

    expect(authors.map(a => a.books.getItems().map(b => b.id))).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });
});

const Tenant = defineEntity({
  name: 'Tenant',
  properties: {
    tenant: p.integer().primary(),
    id: p.integer().primary(),
    name: p.string(),
    books: () =>
      p
        .manyToMany(Book)
        .pivotTable('tenant_books')
        .fixedOrderColumn('sort_order')
        .joinColumns('tenant_tenant', 'tenant_id')
        .inverseJoinColumns('book_id'),
  },
});

describe('non-unique fixed order column with a composite key owner', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Tenant, Book],
      dbName: ':memory:',
    });

    await orm.schema.execute(`
      create table book (id integer primary key, title text not null);
      create table tenant (tenant integer not null, id integer not null, name text not null, primary key (tenant, id));
      create table tenant_books (
        tenant_tenant integer not null,
        tenant_id integer not null,
        book_id integer not null,
        sort_order integer not null,
        primary key (tenant_tenant, tenant_id, book_id)
      );
      insert into book (id, title) values (1, 'Shared'), (2, 'B2'), (3, 'B3');
      insert into tenant (tenant, id, name) values (1, 1, 'T1'), (1, 2, 'T2');
      insert into tenant_books (tenant_tenant, tenant_id, book_id, sort_order)
        values (1, 1, 1, 10), (1, 1, 2, 11), (1, 2, 1, 10), (1, 2, 3, 12);
    `);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('populating m:n keeps shared items on every owner', async () => {
    const tenants = await orm.em.fork().find(Tenant, {}, { populate: ['books'], orderBy: { id: 'asc' } });

    expect(tenants.map(t => t.books.getItems().map(b => b.id))).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });
});

const Tag = defineEntity({
  name: 'Tag',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Comment = defineEntity({
  name: 'Comment',
  properties: {
    id: p.integer().primary(),
    text: p.string(),
    postTag: () => p.manyToOne(PostTag),
  },
});

const PostTag = defineEntity({
  name: 'PostTag',
  properties: {
    id: p.integer().primary(),
    post: () => p.manyToOne(Post),
    tag: () => p.manyToOne(Tag).nullable(),
    note: p.string(),
    comments: () => p.oneToMany(Comment).mappedBy('postTag'),
  },
});

const Post = defineEntity({
  name: 'Post',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    tags: () =>
      p
        .manyToMany(Tag)
        .pivotEntity(() => PostTag)
        .owner(),
  },
});

describe('pivot entity with a surrogate primary key', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Post, Tag, PostTag, Comment],
      dbName: ':memory:',
    });

    await orm.schema.create();

    const conn = orm.em.getConnection();
    await conn.execute(`insert into tag (id, name) values (1, 't1'), (2, 't2')`);
    await conn.execute(`insert into post (id, title) values (1, 'p1'), (2, 'p2')`);
    await conn.execute(
      `insert into post_tag (id, post_id, tag_id, note) values (1, 1, 1, 'a'), (2, 1, 1, 'b'), (3, 1, 2, 'c'), (4, 1, null, 'd'), (5, 2, null, 'e')`,
    );
    await conn.execute(`insert into comment (id, text, post_tag_id) values (1, 'c1', 1), (2, 'c2', 1), (3, 'c3', 3)`);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('rows sharing the same FK pair are not merged', async () => {
    const rows = await orm.em.fork().find(PostTag, {}, { populate: ['tag'], orderBy: { id: 'asc' } });

    expect(rows.map(r => r.note)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  test('rows are not merged when the FKs are not selected', async () => {
    const rows = await orm.em
      .fork()
      .find(PostTag, {}, { populate: ['tag'], fields: ['note', 'tag.name'], orderBy: { id: 'asc' } });

    expect(rows.map(r => r.note)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  test('rows are still merged when a to-many relation is joined', async () => {
    const rows = await orm.em.fork().find(PostTag, {}, { populate: ['comments'], orderBy: { id: 'asc' } });

    expect(rows.map(r => r.note)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(rows.map(r => r.comments.getItems().map(c => c.text))).toEqual([['c1', 'c2'], [], ['c3'], [], []]);
  });

  test('rows are not merged when a joined FK is null', async () => {
    const rows = await orm.em
      .fork()
      .createQueryBuilder(PostTag, 'pt')
      .select('*')
      .leftJoinAndSelect('pt.tag', 't')
      .orderBy({ id: 'asc' })
      .getResultList();

    expect(rows.map(r => r.note)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
