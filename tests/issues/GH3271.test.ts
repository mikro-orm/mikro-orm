import { MikroORM, wrap } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';
import { initORMPostgreSql } from '../bootstrap.js';
import { Author2, Book2 } from '../entities-sql/index.js';

let orm: MikroORM;

beforeAll(async () => orm = await initORMPostgreSql());
beforeEach(async () => orm.schema.clearDatabase());
afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('test nested find with repository', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);

  const author = new Author2('Bartleby', 'bartelby@writer.org');
  const book = new Book2('My Life on The Wall, part 1', author);
  await orm.em.persistAndFlush(book);

  orm.em.clear();

  const reqEm = orm.em.fork();

  async function requestCommonService() {
    const [b] = await orm.em.getRepository(Book2).find({});
    return b.title;
  }

  const { titleA, titleB } = await reqEm.transactional(async em => {
    const b = await em.findOneOrFail(Book2, book.uuid);
    wrap(b).assign({
      title: 'New title',
    });
    await em.flush();
    const titleA = await requestCommonService();
    const titleB = b.title;
    return { titleA, titleB };
  });

  expect(titleA).toEqual(titleB);
});

test('test nested find with EM 1', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);

  const author = new Author2('Bartleby', 'bartelby@writer.org');
  const book = new Book2('My Life on The Wall, part 1', author);
  await orm.em.persistAndFlush(book);

  orm.em.clear();

  const reqEm = orm.em.fork();

  async function requestCommonService() {
    const [b] = await orm.em.find(Book2, {});
    return b.title;
  }

  const { titleA, titleB } = await reqEm.transactional(async em => {
    const b = await em.findOneOrFail(Book2, book.uuid);
    wrap(b).assign({
      title: 'New title',
    });
    await em.flush();
    const titleA = await requestCommonService();
    const titleB = b.title;
    return { titleA, titleB };
  });

  expect(titleA).toEqual(titleB);
});

test('test nested find with EM 2', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);

  const author = new Author2('Bartleby', 'bartelby@writer.org');
  const book = new Book2('My Life on The Wall, part 1', author);
  await orm.em.fork().persistAndFlush(book);

  async function requestCommonService() {
    const [b] = await orm.em.find(Book2, {});
    return b.title;
  }

  const { titleA, titleB } = await orm.em.transactional(async () => {
    const b = await orm.em.findOneOrFail(Book2, book.uuid);
    wrap(b).assign({
      title: 'New title',
    });
    await orm.em.flush();
    const titleA = await requestCommonService();
    const titleB = b.title;
    return { titleA, titleB };
  });

  expect(titleA).toEqual(titleB);
});

test('test nested find with EM 3', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);

  const author = new Author2('Bartleby', 'bartelby@writer.org');
  const book = new Book2('My Life on The Wall, part 1', author);
  await orm.em.fork().persistAndFlush(book);

  async function requestCommonService() {
    const b = await orm.em.findOne(Book2, book);
    return b?.title;
  }

  const { titleA, titleB } = await orm.em.transactional(async () => {
    const b = await orm.em.findOneOrFail(Book2, book.uuid);
    wrap(b).assign({
      title: 'New title',
    });
    await orm.em.flush();
    const titleA = await requestCommonService();
    const titleB = b.title;
    return { titleA, titleB };
  });

  expect(titleA).toEqual(titleB);
});
