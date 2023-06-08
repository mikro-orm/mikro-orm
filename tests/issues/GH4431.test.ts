import type { MikroORM } from '@mikro-orm/core';
import { Author, Book } from '../entities';
import { initORMMongo } from '../bootstrap';

describe('GH4431', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());

  test('adding a collection before flushing its owner shouldnt lead to find throwing', async () => {
    {
      const authors = [
        new Author('a', 'a@a.com'),
        new Author('b', 'b@b.com'),
        new Author('c', 'c@c.com'),
        new Author('d', 'd@d.com'),
        new Author('e', 'e@e.com'),
      ];

      // This would fix the issue
      // await orm.em.persistAndFlush(authors);

      // This causes the issue
      authors[0].friends.add([authors[1], authors[3]]);
      // These do work though
      // authors[2].friends.add([authors[3]]);
      // authors[3].friends.add([authors[0], authors[2]]);

      orm.em.persist(authors);
      await orm.em.flush();

      const books = [
        new Book('One', authors[0]),
        new Book('Two', authors[0]),
        new Book('Three', authors[1]),
        new Book('Four', authors[2]),
        new Book('Five', authors[2]),
        new Book('Six', authors[2]),
      ];
      orm.em.persist(books);

      await orm.em.flush();
      orm.em.clear();
    }
    const authors = await orm.em.find(Author, {}, { first: 3 });
    expect(authors).toBeDefined();
  });

  afterAll(async () => orm.close(true));

});
