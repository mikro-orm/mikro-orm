import { Collection, EntityManager, MikroORM, QueryOrder } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

import {  initORMSqlite3 } from './bootstrap';
import { Book5 } from './entities-5';

describe('EntityManagerSqlite fts5 table', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => orm = await initORMSqlite3());
  beforeEach(async () => orm.schema.clearDatabase());

  test('should load entities', async () => {
    expect(orm).toBeInstanceOf(MikroORM);
    expect(orm.em).toBeInstanceOf(EntityManager);

    const book1 = new Book5('My Life on The Wall, part 1');
    const book2 = new Book5('My Life on The Wall, part 2');
    const book3 = new Book5('My Life on The Wall, part 3');
    const book4 = new Book5('My Life on an island, part 4');
    const book5 = new Book5('My Death in a grass field, part 5');

    const repo = orm.em.getRepository(Book5);
    repo.persist(book1);
    repo.persist(book2);
    repo.persist(book3);
    repo.persist(book4);
    repo.persist(book5);
    await repo.flush();
    orm.em.clear();

    expect((await repo.count())!).toBe(5);

    // full text search test
    const fullTextBooks = (await repo.find({ title: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks.length).toBe(3);
  });


  afterAll(async () => {
    await orm.close(true);
  });

});
