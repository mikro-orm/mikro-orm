import { MikroORM } from '@mikro-orm/mongodb';

import { Author, Book } from '../entities/index.js';
import { initORMMongo } from '../bootstrap.js';

describe('GH4065', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());

  afterAll(async () => {
    await orm.close();
  });

  test('should load entities with $fulltext and filter set', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const booksRepository = orm.em.getRepository(Book);
    orm.em.addFilter('BreakFulltext', { title: { $re: '.*' } }, Book, true);
    const books = await booksRepository.find({ $fulltext: 'Bible' });
    expect(books.length).toBe(1);
  });
});
