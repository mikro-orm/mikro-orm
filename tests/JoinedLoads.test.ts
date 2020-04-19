import { MikroORM, Logger } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { initORMPostgreSql, wipeDatabasePostgreSql } from './bootstrap';
import { Author2, Book2 } from './entities-sql';

describe('Joined loading', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => orm = await initORMPostgreSql());
  beforeEach(async () => wipeDatabasePostgreSql(orm.em));

  afterAll(async () => orm.close(true));

  test('populate OneToMany with joined strategy', async () => {
    const author2 = new Author2('Albert Camus', 'albert.camus@email.com');
    const stranger = new Book2('The Stranger', author2);
    const fall = new Book2('The Fall', author2);

    author2.books.add(stranger, fall);

    await orm.em.persistAndFlush(author2);
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, {
      id: author2.id,
    }, {
      populate: ['books', 'following'],
    });

    expect(a2.books).toHaveLength(2);
    expect(a2.books[0].title).toEqual('The Stranger');
    expect(a2.books[1].title).toEqual('The Fall');
  });

  test('should only fire one query', async () => {
    const author2 = new Author2('Albert Camus', 'albert.camus@email.com');
    const stranger = new Book2('The Stranger', author2);
    const fall = new Book2('The Fall', author2);

    author2.books.add(stranger, fall);

    await orm.em.persistAndFlush(author2);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.em.config, { logger });

    await orm.em.findOneOrFail(Author2, {
      id: author2.id,
    }, {
      populate: ['books'],
    });

    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toMatch('select "e0"."id", "e0"."created_at", "e0"."updated_at", "e0"."name", "e0"."email", "e0"."age", "e0"."terms_accepted", "e0"."optional", "e0"."identities", "e0"."born", "e0"."born_time", "books"."uuid_pk" as "b0_uuid_pk", "books"."created_at" as "b0_created_at", "books"."title" as "b0_title", "books"."perex" as "b0_perex", "books"."price" as "b0_price", "books"."double" as "b0_double", "books"."meta" as "b0_meta" from "author2" as "e0" inner join "book2" as "books" on "e0"."id" = "books"."author_id" where "e0"."id" = $1');
  });
});
