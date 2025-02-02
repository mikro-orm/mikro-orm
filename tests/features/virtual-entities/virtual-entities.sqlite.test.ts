import { EntitySchema, QueryFlag, ReferenceKind, raw, sql } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/better-sqlite';
import { mockLogger } from '../../bootstrap';
import type { IAuthor4 } from '../../entities-schema';
import { Author4, BaseEntity5, Book4, BookTag4, FooBar4, FooBaz4, Publisher4, Test4, Identity, IdentitySchema } from '../../entities-schema';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';

class AuthorProfile {

  name!: string;
  age!: number;
  totalBooks!: number;
  usedTags!: string[];
  identity!: Identity;

}

const authorProfilesSQL = 'select name, age, identity, ' +
  '(select count(*) from book4 b where b.author_id = a.id) as total_books, ' +
  '(select group_concat(distinct t.name) from book4 b join tags_ordered bt on bt.book4_id = b.id join book_tag4 t on t.id = bt.book_tag4_id where b.author_id = a.id group by b.author_id) as used_tags ' +
  'from author4 a group by a.id';

const AuthorProfileSchema = new EntitySchema({
  class: AuthorProfile,
  expression: authorProfilesSQL,
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    totalBooks: { type: 'number' },
    usedTags: { type: 'string[]' },
    identity: { type: 'Identity', kind: ReferenceKind.EMBEDDED, object: true },
  },
});

class AuthorProfile3 {

  name!: string;
  age!: number;
  totalBooks!: number;
  usedTags!: string[];
  identity!: Identity;

}

const AuthorProfileSchema3 = new EntitySchema({
  class: AuthorProfile3,
  expression: () => raw(authorProfilesSQL),
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    totalBooks: { type: 'number' },
    usedTags: { type: 'string[]' },
    identity: { type: 'Identity', kind: ReferenceKind.EMBEDDED, object: true },
  },
});

class AuthorProfile2 {

  name!: string;
  age!: number;
  totalBooks!: number;
  usedTags!: string[];
  identity!: Identity;

}

const AuthorProfileSchema2 = new EntitySchema({
  class: AuthorProfile2,
  expression: () => authorProfilesSQL,
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    totalBooks: { type: 'number' },
    usedTags: { type: 'string[]' },
    identity: { type: 'Identity', kind: ReferenceKind.EMBEDDED, object: true },
  },
});

interface IBookWithAuthor{
  title: string;
  authorName: string;
  tags: string[];
}

const BookWithAuthor = new EntitySchema<IBookWithAuthor>({
  name: 'BookWithAuthor',
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book4, 'b')
      .select(['b.title', 'a.name as author_name', raw('group_concat(t.name) as tags')])
      .join('b.author', 'a')
      .join('b.tags', 't')
      .groupBy('b.id');
  },
  properties: {
    title: { type: 'string' },
    authorName: { type: 'string' },
    tags: { type: 'string[]' },
  },
});

const BookWithAuthor2 = new EntitySchema<IBookWithAuthor>({
  name: 'BookWithAuthor2',
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book4, 'b')
      .select(['b.title', 'a.name as author_name', sql`group_concat(t.name) as tags`])
      .join('b.author', 'a')
      .join('b.tags', 't')
      .groupBy('b.id');
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
      driver: BetterSqliteDriver,
      dbName: ':memory:',
      entities: [Author4, Book4, BookTag4, Publisher4, Test4, FooBar4, FooBaz4, BaseEntity5, AuthorProfileSchema, BookWithAuthor, AuthorProfileSchema2, AuthorProfileSchema3, BookWithAuthor2, IdentitySchema],
    });
    await orm.schema.createSchema();
  });
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => orm.close(true));

  async function createEntities(index: number): Promise<IAuthor4> {
    const author = orm.em.create(Author4, { name: 'Jon Snow ' + index, email: 'snow@wall.st-' + index, age: Math.floor(Math.random() * 100) });
    author.identity = new Identity('foo', 123);
    const book1 = orm.em.create(Book4, { title: 'My Life on the Wall, part 1/' + index, author });
    const book2 = orm.em.create(Book4, { title: 'My Life on the Wall, part 2/' + index, author });
    const book3 = orm.em.create(Book4, { title: 'My Life on the Wall, part 3/' + index, author });
    const tag1 = orm.em.create(BookTag4, { name: 'silly-' + index });
    const tag2 = orm.em.create(BookTag4, { name: 'funny-' + index });
    const tag3 = orm.em.create(BookTag4, { name: 'sick-' + index });
    const tag4 = orm.em.create(BookTag4, { name: 'strange-' + index });
    const tag5 = orm.em.create(BookTag4, { name: 'sexy-' + index });
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
    const [profiles, total] = await orm.em.findAndCount(AuthorProfile, {}, { cache: 50 });
    expect(mock.mock.calls).toHaveLength(2);
    const res2 = await orm.em.findAndCount(AuthorProfile, {}, { cache: 50 });
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
        usedTags: ['silly-1', 'sick-1', 'funny-1', 'sexy-1', 'strange-1'],
      },
      {
        name: 'Jon Snow 2',
        identity: { foo: 'foo', bar: 123 },
        age: expect.any(Number),
        totalBooks: 3,
        usedTags: ['silly-2', 'sick-2', 'funny-2', 'sexy-2', 'strange-2'],
      },
      {
        name: 'Jon Snow 3',
        identity: { foo: 'foo', bar: 123 },
        age: expect.any(Number),
        totalBooks: 3,
        usedTags: ['silly-3', 'sick-3', 'funny-3', 'sexy-3', 'strange-3'],
      },
    ]);

    for (const profile of profiles) {
      expect(profile).toBeInstanceOf(AuthorProfile);
      expect(profile.identity).toBeInstanceOf(Identity);
    }

    const someProfiles01 = await orm.em.qb(AuthorProfile).limit(2).offset(1).orderBy({ name: 'asc' });
    expect(someProfiles01).toHaveLength(2);
    expect(someProfiles01.map(p => p.name)).toEqual(['Jon Snow 2', 'Jon Snow 3']);

    const someProfiles02 = await orm.em.qb(AuthorProfile2).limit(2).offset(1).orderBy({ name: 'asc' });
    expect(someProfiles02).toHaveLength(2);
    expect(someProfiles02.map(p => p.name)).toEqual(['Jon Snow 2', 'Jon Snow 3']);

    const someProfiles03 = await orm.em.qb(AuthorProfile3).limit(2).offset(1).orderBy({ name: 'asc' });
    expect(someProfiles03).toHaveLength(2);
    expect(someProfiles03.map(p => p.name)).toEqual(['Jon Snow 2', 'Jon Snow 3']);

    const someProfiles1 = await orm.em.find(AuthorProfile2, {}, { limit: 2, offset: 1, orderBy: { name: 'asc' } });
    expect(someProfiles1).toHaveLength(2);
    expect(someProfiles1.map(p => p.name)).toEqual(['Jon Snow 2', 'Jon Snow 3']);

    const someProfiles2 = await orm.em.find(AuthorProfile2, {}, { limit: 2, orderBy: { name: 'asc' } });
    expect(someProfiles2).toHaveLength(2);
    expect(someProfiles2.map(p => p.name)).toEqual(['Jon Snow 1', 'Jon Snow 2']);

    const someProfiles3 = await orm.em.find(AuthorProfile2, { $and: [{ name: { $like: 'Jon%' } }, { age: { $gte: 0 } }] }, { limit: 2, orderBy: { name: 'asc' } });
    expect(someProfiles3).toHaveLength(2);
    expect(someProfiles3.map(p => p.name)).toEqual(['Jon Snow 1', 'Jon Snow 2']);

    const someProfiles4 = await orm.em.find(AuthorProfile2, { name: ['Jon Snow 2', 'Jon Snow 3'] });
    expect(someProfiles4).toHaveLength(2);
    expect(someProfiles4.map(p => p.name)).toEqual(['Jon Snow 2', 'Jon Snow 3']);

    const queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toHaveLength(9);
    expect(queries[0]).toMatch(`select * from (${authorProfilesSQL}) as \`a0\``);
    expect(queries[1]).toMatch(`select * from (${authorProfilesSQL}) as \`a0\` order by \`a0\`.\`name\` asc limit 2`);
    expect(queries[2]).toMatch(`select * from (${authorProfilesSQL}) as \`a0\` order by \`a0\`.\`name\` asc limit 2 offset 1`);
    expect(queries[3]).toMatch(`select * from (${authorProfilesSQL}) as \`a0\` where \`a0\`.\`name\` in ('Jon Snow 2', 'Jon Snow 3')`);
    expect(queries[4]).toMatch(`select * from (${authorProfilesSQL}) as \`a0\` where \`a0\`.\`name\` like 'Jon%' and \`a0\`.\`age\` >= 0 order by \`a0\`.\`name\` asc limit 2`);
    expect(queries[5]).toMatch(`select \`a0\`.* from (${authorProfilesSQL}) as \`a0\` order by \`a0\`.\`name\` asc limit 2 offset 1`);
    expect(queries[6]).toMatch(`select \`a0\`.* from (${authorProfilesSQL}) as \`a0\` order by \`a0\`.\`name\` asc limit 2 offset 1`);
    expect(queries[7]).toMatch(`select \`a0\`.* from (${authorProfilesSQL}) as \`a0\` order by \`a0\`.\`name\` asc limit 2 offset 1`);
    expect(queries[8]).toMatch(`select count(*) as \`count\` from (${authorProfilesSQL}) as \`a0\``);
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
  });

  test('with callback', async () => {
    await createEntities(1);
    await createEntities(2);
    await createEntities(3);

    const mock = mockLogger(orm);
    const [books, total] = await orm.em.findAndCount(BookWithAuthor, {});
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

    const someBooks01 = await orm.em.qb(BookWithAuthor).limit(2).offset(1).orderBy({ title: 'asc' });
    expect(someBooks01).toHaveLength(2);
    expect(someBooks01.map(p => p.title)).toEqual(['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3']);

    const someBooks02 = await orm.em.qb(BookWithAuthor2).limit(2).offset(1).orderBy({ title: 'asc' });
    expect(someBooks02).toHaveLength(2);
    expect(someBooks02.map(p => p.title)).toEqual(['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3']);

    const someBooks1 = await orm.em.find(BookWithAuthor2, {}, { limit: 2, offset: 1, orderBy: { title: 'asc' } });
    expect(someBooks1).toHaveLength(2);
    expect(someBooks1.map(p => p.title)).toEqual(['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3']);

    const someBooks2 = await orm.em.find(BookWithAuthor2, {}, { limit: 2, orderBy: { title: 'asc' } });
    expect(someBooks2).toHaveLength(2);
    expect(someBooks2.map(p => p.title)).toEqual(['My Life on the Wall, part 1/1', 'My Life on the Wall, part 1/2']);

    const someBooks3 = await orm.em.find(BookWithAuthor2, { $and: [{ title: { $like: 'My Life%' } }, { authorName: { $ne: null } }] }, { limit: 2, orderBy: { title: 'asc' } });
    expect(someBooks3).toHaveLength(2);
    expect(someBooks3.map(p => p.title)).toEqual(['My Life on the Wall, part 1/1', 'My Life on the Wall, part 1/2']);

    const someBooks4 = await orm.em.find(BookWithAuthor2, { title: ['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3'] });
    expect(someBooks4).toHaveLength(2);
    expect(someBooks4.map(p => p.title)).toEqual(['My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3']);

    const sql = 'select `b`.`title`, `a`.`name` as `author_name`, group_concat(t.name) as tags ' +
      'from `book4` as `b` ' +
      'inner join `author4` as `a` on `b`.`author_id` = `a`.`id` ' +
      'inner join `tags_ordered` as `t1` on `b`.`id` = `t1`.`book4_id` ' +
      'inner join `book_tag4` as `t` on `t1`.`book_tag4_id` = `t`.`id` ' +
      'group by `b`.`id`';
    const queries = mock.mock.calls.map(call => call[0]).sort();
    expect(queries).toHaveLength(8);
    expect(queries[0]).toMatch(`select * from (${sql}) as \`b0\``);
    expect(queries[1]).toMatch(`select * from (${sql}) as \`b0\` order by \`b0\`.\`title\` asc limit 2`);
    expect(queries[2]).toMatch(`select * from (${sql}) as \`b0\` order by \`b0\`.\`title\` asc limit 2 offset 1`);
    expect(queries[3]).toMatch(`select * from (${sql}) as \`b0\` where \`b0\`.\`title\` in ('My Life on the Wall, part 1/2', 'My Life on the Wall, part 1/3')`);
    expect(queries[4]).toMatch(`select * from (${sql}) as \`b0\` where \`b0\`.\`title\` like 'My Life%' and \`b0\`.\`author_name\` is not null order by \`b0\`.\`title\` asc limit 2`);
    expect(queries[5]).toMatch(`select \`b0\`.* from (${sql}) as \`b0\` order by \`b0\`.\`title\` asc limit 2 offset 1`);
    expect(queries[6]).toMatch(`select \`b0\`.* from (${sql}) as \`b0\` order by \`b0\`.\`title\` asc limit 2 offset 1`);
    expect(queries[7]).toMatch(`select count(*) as \`count\` from (${sql}) as \`b0\``);

    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
    expect(mock.mock.calls[0][0]).toMatch(sql);
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);

    // pagination
    {
      const [books, total] = await orm.em.findAndCount(BookWithAuthor, {}, { flags: [QueryFlag.PAGINATE], limit: 3, offset: 3 });
      expect(books).toEqual([
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
      ]);
      expect(total).toBe(9);
    }
  });

});
