'use strict';

import { MikroORM, EntityManager, Collection } from '../lib';
import { Author } from './entities/Author';
import { Publisher } from './entities/Publisher';
import { Book } from './entities/Book';

let orm: MikroORM;

/**
 * @class EntityManagerTest
 */
describe('EntityManager', () => {

  beforeAll(async () => {
    orm = await MikroORM.init({
      entitiesDirs: ['entities'],
      dbName: 'mikro-orm-test',
      baseDir: __dirname,
    });

    await orm.em.getRepository<Author>(Author.name).remove({});
    await orm.em.getRepository<Book>(Book.name).remove({});
    await orm.em.getRepository<Publisher>(Publisher.name).remove({});
  });

  describe('Container', () => {
    test('should load entities', async () => {
      expect(orm).toBeInstanceOf(MikroORM);
      expect(orm.em).toBeInstanceOf(EntityManager);

      const author = new Author('Jon Snow', 'snow@wall.st');
      author.born = new Date();

      const publisher = new Publisher('7K publisher');

      const book1 = new Book('My Life on The Wall, part 1', author);
      book1.publisher = publisher;
      const book2 = new Book('My Life on The Wall, part 2', author);
      book2.publisher = publisher;
      const book3 = new Book('My Life on The Wall, part 3', author);
      book3.publisher = publisher;

      await orm.em.persist(book1);
      await orm.em.persist(book2);
      await orm.em.persist(book3, true);

      // clear EM so we do not have author and publisher loaded in identity map
      orm.em.clear();

      const authorRepository = orm.em.getRepository<Author>(Author.name);
      const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books']);
      const authors = await authorRepository.findAll(['books']);

      // identity map test
      expect(jon).toBe(authors[0]);

      for (const author of authors) {
        expect(author.books).toBeInstanceOf(Collection);
        expect(author.books.isInitialized()).toBe(true);

        // iterator test
        for (const book of author.books) {
          expect(book.title).toMatch(/My Life on The Wall, part \d/);

          expect(book.author).toBeInstanceOf(Author);
          expect(book.author.isInitialized()).toBe(true);
          expect(book.publisher).toBeInstanceOf(Publisher);
          expect(book.publisher.isInitialized()).toBe(false);
        }
      }
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

});
