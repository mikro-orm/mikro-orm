import type { MikroORM } from '@mikro-orm/core';
import { ref, wrap } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';

import { Author, Book, BookTag, Publisher } from './entities';
import { initORMMongo } from './bootstrap';

describe('EntityManagerMongo2', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());

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

    const books = await orm.em.find(Book, { id: bible.id }, {
      populate: ['publisher.books.publisher'],
      fields: ['*', 'publisher.name'],
    });
    expect(books[0].publisher!.get().books.get()[0].publisher!.$.name).toBe('Publisher 123');
    expect(books[0].publisher!.$
      // @ts-expect-error
      .type).toBeUndefined();

    const book5 = await orm.em.findOneOrFail(Book, bible, { populate: ['publisher', 'tags', 'perex'] });
    expect(book5.publisher!.$.name).toBe('Publisher 123');
    expect(book5.tags.$[0].name).toBe('t1');

    const pub2 = orm.em.create(Publisher, { name: 'asd' });
    const wrapped0 = ref(pub2);
    // @ts-expect-error
    expect(wrapped0.books).toBeUndefined();
    book5.publisher = wrapped0;
  });

  test('loadCount with m:n relationships', async () => {
    let bible = new Book('Bible');
    bible.author = new Author('a', 'b');
    bible.tags.add(new BookTag('t1'), new BookTag('t2'), new BookTag('t3'));
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    bible = await orm.em.findOneOrFail(Book, bible.id);
    await expect(bible.tags.loadCount()).resolves.toEqual(3);
    bible.tags.removeAll();
    await expect(bible.tags.loadCount()).resolves.toEqual(0);
  });

  test('required fields validation', async () => {
    const jon = new Author('Jon', undefined as any);
    await expect(orm.em.persistAndFlush(jon)).rejects.toThrow(`Value for Author.email is required, 'undefined' found`);
  });

  test('Loaded type does not remove optionality', async () => {
    const b = await orm.em.find(Book, {}, { populate: ['publisher'] });
    // @ts-expect-error publisher can be null
    const p1 = b[0]?.publisher.$.name;
    const p2 = b[0]?.publisher?.$.name;
  });

  afterAll(async () => orm.close(true));

});
