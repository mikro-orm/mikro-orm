import { Embedded, Entity, EntitySchema, Property, raw, sql } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { mockLogger } from '../../bootstrap';
import { Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, Identity } from '../../entities-sql';

const authorProfilesSQL = 'select min(name) as name, min(age) as age, identity, ' +
  '(select count(*) from book2 b where b.author_id = a.id)::int as total_books, ' +
  // this subquery is wrong, it returns the tags in wrong order, but that is not relevant to the actual test which is about mapping any query results
  '(select array_agg(t.name) from book2 b join book2_tags bt on bt.book2_uuid_pk = b.uuid_pk join book_tag2 t on t.id = bt.book_tag2_id where b.author_id = a.id group by b.author_id order by min(bt.order)) as used_tags ' +
  'from author2 a ' +
  'group by a.id';

@Entity({ expression: authorProfilesSQL })
class AuthorProfile {

  @Property()
  name!: string;

  @Property()
  age!: number;

  @Property()
  totalBooks!: number;

  @Property()
  usedTags!: string[];

  @Embedded({ object: true })
  identity!: Identity;

}

interface IBookWithAuthor{
  title: string;
  authorName: string;
  tags: string[];
}

const BookWithAuthor = new EntitySchema<IBookWithAuthor>({
  name: 'BookWithAuthor',
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book2, 'b')
      .select([sql`min(b.title)`.as('title'), sql`min(a.name)`.as('author_name'), raw('array_agg(t.name) as tags')])
      .join('b.author', 'a')
      .join('b.tags', 't')
      .groupBy('b.uuid_pk');
  },
  properties: {
    title: { type: 'string' },
    authorName: { type: 'string' },
    tags: { type: 'string[]' },
  },
});

describe('virtual entities (sqlite)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'virtual_entities_pg',
      entities: [Author2, Book2, BookTag2, Publisher2, Test2, FooBar2, FooBaz2, AuthorProfile, BookWithAuthor],
    });
    await orm.schema.refreshDatabase();
  });
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => orm.close(true));

  async function createEntities(index: number): Promise<Author2> {
    const author = orm.em.create(Author2, { name: 'Jon Snow ' + index, email: 'snow@wall.st-' + index, age: Math.floor(Math.random() * 100) });
    author.identity = new Identity('foo', 123);
    const book1 = orm.em.create(Book2, { title: 'My Life on the Wall, part 1/' + index, author });
    const book2 = orm.em.create(Book2, { title: 'My Life on the Wall, part 2/' + index, author });
    const book3 = orm.em.create(Book2, { title: 'My Life on the Wall, part 3/' + index, author });
    const tag1 = orm.em.create(BookTag2, { name: 'silly-' + index });
    const tag2 = orm.em.create(BookTag2, { name: 'funny-' + index });
    const tag3 = orm.em.create(BookTag2, { name: 'sick-' + index });
    const tag4 = orm.em.create(BookTag2, { name: 'strange-' + index });
    const tag5 = orm.em.create(BookTag2, { name: 'sexy-' + index });
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    await orm.em.persist(author).flush();
    orm.em.clear();

    return author;
  }

  test('schema', async () => {
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
    await expect(orm.schema.getDropSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
  });

  test('with SQL expression', async () => {
    await createEntities(1);
    await createEntities(2);
    await createEntities(3);

    const mock = mockLogger(orm);
    const [profiles, total] = await orm.em.findAndCount(AuthorProfile, {}, { cache: 50, orderBy: { name: 1, usedTags: 1 } });
    expect(mock.mock.calls).toHaveLength(2);
    const res2 = await orm.em.findAndCount(AuthorProfile, {}, { cache: 50, orderBy: { name: 1, usedTags: 1 } });
    expect(res2).toEqual([profiles, total]);
    expect(mock.mock.calls).toHaveLength(2); // from cache, no additional queries

    expect(total).toBe(3);
    expect(JSON.parse(JSON.stringify(profiles[0])).identity).toEqual({
      fooBar: 'foo 123',
    });
    expect(profiles).toEqual([
      {
        name: 'Jon Snow 1',
        identity: { foo: 'foo', bar: 123 },
        age: expect.any(Number),
        totalBooks: 3,
        usedTags: ['silly-1', 'sick-1', 'silly-1', 'funny-1', 'sexy-1', 'funny-1', 'strange-1', 'sexy-1'],
        // usedTags: ['silly-1', 'sick-1', 'funny-1', 'sexy-1', 'strange-1'],
      },
      {
        name: 'Jon Snow 2',
        identity: { foo: 'foo', bar: 123 },
        age: expect.any(Number),
        totalBooks: 3,
        usedTags: ['silly-2', 'sick-2', 'silly-2', 'funny-2', 'sexy-2', 'funny-2', 'strange-2', 'sexy-2'],
        // usedTags: ['silly-2', 'sick-2', 'funny-2', 'sexy-2', 'strange-2'],
      },
      {
        name: 'Jon Snow 3',
        identity: { foo: 'foo', bar: 123 },
        age: expect.any(Number),
        totalBooks: 3,
        usedTags: ['silly-3', 'sick-3', 'silly-3', 'funny-3', 'sexy-3', 'funny-3', 'strange-3', 'sexy-3'],
        // usedTags: ['silly-3', 'sick-3', 'funny-3', 'sexy-3', 'strange-3'],
      },
    ]);

    for (const profile of profiles) {
      expect(profile).toBeInstanceOf(AuthorProfile);
      expect(profile.identity).toBeInstanceOf(Identity);
    }

    const someProfiles1 = await orm.em.find(AuthorProfile, {}, { limit: 2, offset: 1, orderBy: { name: 'asc' } });
    expect(someProfiles1).toHaveLength(2);
    expect(someProfiles1.map(p => p.name)).toEqual(['Jon Snow 2', 'Jon Snow 3']);

    const someProfiles2 = await orm.em.find(AuthorProfile, {}, { limit: 2, orderBy: { name: 'asc' } });
    expect(someProfiles2).toHaveLength(2);
    expect(someProfiles2.map(p => p.name)).toEqual(['Jon Snow 1', 'Jon Snow 2']);

    const someProfiles3 = await orm.em.find(AuthorProfile, { $and: [{ name: { $like: 'Jon%' } }, { age: { $gte: 0 } }] }, { limit: 2, orderBy: { name: 'asc' } });
    expect(someProfiles3).toHaveLength(2);
    expect(someProfiles3.map(p => p.name)).toEqual(['Jon Snow 1', 'Jon Snow 2']);

    const someProfiles4 = await orm.em.find(AuthorProfile, { name: ['Jon Snow 2', 'Jon Snow 3'] });
    expect(someProfiles4).toHaveLength(2);
    expect(someProfiles4.map(p => p.name)).toEqual(['Jon Snow 2', 'Jon Snow 3']);

    expect(mock.mock.calls).toHaveLength(6);
    expect(mock.mock.calls[0][0]).toMatch(`select count(*) as count from (${authorProfilesSQL}) as "a0"`);
    expect(mock.mock.calls[1][0]).toMatch(`select * from (${authorProfilesSQL}) as "a0"`);
    expect(mock.mock.calls[2][0]).toMatch(`select * from (${authorProfilesSQL}) as "a0" order by "a0"."name" asc limit 2 offset 1`);
    expect(mock.mock.calls[3][0]).toMatch(`select * from (${authorProfilesSQL}) as "a0" order by "a0"."name" asc limit 2`);
    expect(mock.mock.calls[4][0]).toMatch(`select * from (${authorProfilesSQL}) as "a0" where "a0"."name" like 'Jon%' and "a0"."age" >= 0 order by "a0"."name" asc limit 2`);
    expect(mock.mock.calls[5][0]).toMatch(`select * from (${authorProfilesSQL}) as "a0" where "a0"."name" in ('Jon Snow 2', 'Jon Snow 3')`);
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
  });

  test('with callback', async () => {
    await createEntities(1);
    await createEntities(2);
    await createEntities(3);

    const mock = mockLogger(orm);
    const [books, total] = await orm.em.findAndCount(BookWithAuthor, {}, { orderBy: { authorName: 1, title: 1 } });
    expect(total).toBe(9);
    expect(books).toEqual([
      {
        title: 'My Life on the Wall, part 1/1',
        authorName: 'Jon Snow 1',
        tags: ['silly-1', 'sick-1'],
      },
      {
        title: 'My Life on the Wall, part 2/1',
        authorName: 'Jon Snow 1',
        tags: ['silly-1', 'funny-1', 'sexy-1'],
      },
      {
        title: 'My Life on the Wall, part 3/1',
        authorName: 'Jon Snow 1',
        tags: ['funny-1', 'strange-1', 'sexy-1'],
      },
      {
        title: 'My Life on the Wall, part 1/2',
        authorName: 'Jon Snow 2',
        tags: ['silly-2', 'sick-2'],
      },
      {
        title: 'My Life on the Wall, part 2/2',
        authorName: 'Jon Snow 2',
        tags: ['silly-2', 'funny-2', 'sexy-2'],
      },
      {
        title: 'My Life on the Wall, part 3/2',
        authorName: 'Jon Snow 2',
        tags: ['funny-2', 'strange-2', 'sexy-2'],
      },
      {
        title: 'My Life on the Wall, part 1/3',
        authorName: 'Jon Snow 3',
        tags: ['silly-3', 'sick-3'],
      },
      {
        title: 'My Life on the Wall, part 2/3',
        authorName: 'Jon Snow 3',
        tags: ['silly-3', 'funny-3', 'sexy-3'],
      },
      {
        title: 'My Life on the Wall, part 3/3',
        authorName: 'Jon Snow 3',
        tags: ['funny-3', 'strange-3', 'sexy-3'],
      },
    ]);

    for (const book of books) {
      expect(book.constructor.name).toBe('BookWithAuthor');
    }

    const someBooks1 = await orm.em.find(BookWithAuthor, {}, { limit: 2, offset: 1, orderBy: { title: 'asc' } });
    expect(someBooks1).toHaveLength(2);
    expect(someBooks1.map(p => p.title)).toEqual(['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3']);

    const someBooks2 = await orm.em.find(BookWithAuthor, {}, { limit: 2, orderBy: { title: 'asc' } });
    expect(someBooks2).toHaveLength(2);
    expect(someBooks2.map(p => p.title)).toEqual(['My Life on the Wall, part 1/1', 'My Life on the Wall, part 1/2']);

    const someBooks3 = await orm.em.find(BookWithAuthor, { $and: [{ title: { $like: 'My Life%' } }, { authorName: { $ne: null } }] }, { limit: 2, orderBy: { title: 'asc' } });
    expect(someBooks3).toHaveLength(2);
    expect(someBooks3.map(p => p.title)).toEqual(['My Life on the Wall, part 1/1', 'My Life on the Wall, part 1/2']);

    const someBooks4 = await orm.em.find(BookWithAuthor, { title: ['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3'] }, { orderBy: { authorName: 1, title: 1 } });
    expect(someBooks4).toHaveLength(2);
    expect(someBooks4.map(p => p.title)).toEqual(['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3']);

    const sql = 'select min(b.title) as title, min(a.name) as author_name, array_agg(t.name) as tags ' +
      'from "book2" as "b" ' +
      'inner join "author2" as "a" on "b"."author_id" = "a"."id" ' +
      'inner join "book2_tags" as "b1" on "b"."uuid_pk" = "b1"."book2_uuid_pk" ' +
      'inner join "book_tag2" as "t" on "b1"."book_tag2_id" = "t"."id" ' +
      'group by "b"."uuid_pk"';
    expect(mock.mock.calls).toHaveLength(6);
    expect(mock.mock.calls[0][0]).toMatch(`select count(*) as count from (${sql}) as "b0"`);
    expect(mock.mock.calls[1][0]).toMatch(`select * from (${sql}) as "b0"`);
    expect(mock.mock.calls[2][0]).toMatch(`select * from (${sql}) as "b0" order by "b0"."title" asc limit 2 offset 1`);
    expect(mock.mock.calls[3][0]).toMatch(`select * from (${sql}) as "b0" order by "b0"."title" asc limit 2`);
    expect(mock.mock.calls[4][0]).toMatch(`select * from (${sql}) as "b0" where "b0"."title" like 'My Life%' and "b0"."author_name" is not null order by "b0"."title" asc limit 2`);
    expect(mock.mock.calls[5][0]).toMatch(`select * from (${sql}) as "b0" where "b0"."title" in ('My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3')`);

    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
    expect(mock.mock.calls[0][0]).toMatch(sql);
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
  });

});
