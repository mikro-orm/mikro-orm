import type { MikroORM } from '@mikro-orm/core';
import { wrap } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';

import { Author, Book, BookTag, Publisher } from './entities';
import { initORMMongo, wipeDatabase } from './bootstrap';

describe('EntityManagerMongo2', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => wipeDatabase(orm.em));

  test('loaded references and collections', async () => {
    const pub = new Publisher('Publisher 123');
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    bible.publisher = wrap(pub).toReference();
    bible.tags.add(new BookTag('t1'), new BookTag('t2'), new BookTag('t3'));
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const book0 = await orm.em.findOne(Book, { author: { books: { publisher: ['1', '2'] } } }, { populate: ['publisher', 'tags'] });
    expect(book0).toBeNull();

    const book1 = await orm.em.findOneOrFail(Book, bible, { populate: ['publisher', 'tags'] });
    expect(book1.publisher!.$.name).toBe('Publisher 123');
    expect(book1.tags.$[0].name).toBe('t1');
    expect(book1.tags.$[1].name).toBe('t2');
    expect(book1.tags.$[2].name).toBe('t3');
    orm.em.clear();

    const books = await orm.em.find(Book, { id: bible.id }, { populate: ['publisher.books.publisher'] });
    expect(books[0].publisher!.get().books.get()[0].publisher!.$.name).toBe('Publisher 123');

    const book5 = await orm.em.findOneOrFail(Book, bible, { populate: ['publisher', 'tags', 'perex'] });
    expect(book5.publisher!.$.name).toBe('Publisher 123');
    expect(book5.tags.$[0].name).toBe('t1');

    const pub2 = orm.em.create(Publisher, { name: 'asd' });
    const wrapped0 = wrap(pub2).toReference<'id' | '_id'>();
    // @ts-expect-error
    expect(wrapped0.books).toBeUndefined();
    book5.publisher = wrapped0;
  });

  test('loadCount with m:n relationships', async () => {
    let bible = new Book('Bible');
    bible.tags.add(new BookTag('t1'), new BookTag('t2'), new BookTag('t3'));
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    bible = await orm.em.findOneOrFail(Book, bible.id);
    await expect(bible.tags.loadCount()).resolves.toEqual(3);
    bible.tags.removeAll();
    await expect(bible.tags.loadCount()).resolves.toEqual(0);
  });

  afterAll(async () => orm.close(true));

});
