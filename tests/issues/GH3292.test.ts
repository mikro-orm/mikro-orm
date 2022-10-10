import type { MikroORM } from '@mikro-orm/core';
import { mockLogger } from '../helpers';
import { initORMPostgreSql } from '../bootstrap';
import { Author2, Book2 } from '../entities-sql';

let orm: MikroORM;

beforeAll(async () => orm = await initORMPostgreSql());
beforeEach(async () => orm.schema.clearDatabase());
afterAll(() => orm.close(true));

test('test findOne without a offset', async () => {
    mockLogger(orm, ['query', 'query-params']);

    const author = new Author2('Bartleby', 'bartelby@writer.org');
    const book = new Book2('My Life on The Wall, part 1', author);
    new Book2('My Life on The Wall, part 2', author);

    await orm.em.fork().persistAndFlush(author);

    async function requestCommonService() {
      const b = await orm.em.findOne(Book2, {});
      return b?.title;
    }

    const { titleA, titleB } = await orm.em.transactional(async () => {
      const b = await orm.em.findOneOrFail(Book2, book.uuid);
      const titleA = await requestCommonService();
      const titleB = b.title;
      return { titleA, titleB };
    });

    expect(titleA).toEqual(titleB);
});

test('test findOne but with a offset', async () => {
  mockLogger(orm, ['query', 'query-params']);

  const author = new Author2('Bartleby', 'bartelby@writer.org');
  new Book2('My Life on The Wall, part 1', author);
  const book2 = new Book2('My Life on The Wall, part 2', author);

  await orm.em.fork().persistAndFlush(author);

  async function requestCommonService() {
    const b = await orm.em.findOne(Book2, {}, {
        offset: 1,
    });
    return b?.title;
  }

  const { titleA, titleB } = await orm.em.transactional(async () => {
    const b = await orm.em.findOneOrFail(Book2, book2.uuid);
    const titleA = await requestCommonService();
    const titleB = b.title;
    return { titleA, titleB };
  });

  expect(titleA).toEqual(titleB);
});
