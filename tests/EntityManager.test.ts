'use strict';

import { MikroORM, EntityManager, Collection } from '../lib';
import { Author } from './entities/Author';
import { Publisher } from './entities/Publisher';
import { Book } from './entities/Book';
import { AuthorRepository } from './repositories/AuthorRepository';

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

      const god = new Author('God', 'hello@heaven.god');
      const bible = new Book('Bible', god);
      await orm.em.persist(bible, true);

      const author = new Author('Jon Snow', 'snow@wall.st');
      author.born = new Date();
      author.favouriteBook = bible;

      const publisher = new Publisher('7K publisher');

      const book1 = new Book('My Life on The Wall, part 1', author);
      book1.publisher = publisher;
      book1.metaObject = {};
      book1.metaArray = [{test: 123, lol: true}];
      book1.metaArrayOfStrings = ['test'];
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
      const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books', 'favouriteBook']);
      const authors = await authorRepository.findAll(['books', 'favouriteBook']);

      // identity map test
      authors.shift(); // shift the god away, as that entity is detached from IM
      expect(jon).toBe(authors[0]);

      // serialization test
      const o = jon.toObject();
      expect(o).toMatchObject({
        id: jon.id,
        createdAt: jon.createdAt,
        updatedAt: jon.updatedAt,
        books: [
          { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 1' },
          { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 2' },
          { author: jon.id, publisher: publisher.id, title: 'My Life on The Wall, part 3' },
        ],
        favouriteBook: { author: god.toObject(jon), title: 'Bible' },
        born: jon.born,
        email: 'snow@wall.st',
        name: 'Jon Snow',
      });
      expect(jon.toJSON()).toEqual(o);

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

      const booksRepository = orm.em.getRepository<Book>(Book.name);
      const booksByTitleAsc = await booksRepository.find({ author: jon._id }, [], { title: 1 });
      expect(booksByTitleAsc[0].title).toBe('My Life on The Wall, part 1');
      expect(booksByTitleAsc[1].title).toBe('My Life on The Wall, part 2');
      expect(booksByTitleAsc[2].title).toBe('My Life on The Wall, part 3');

      const booksByTitleDesc = await booksRepository.find({ author: jon._id }, [], { title: -1 });
      expect(booksByTitleDesc[0].title).toBe('My Life on The Wall, part 3');
      expect(booksByTitleDesc[1].title).toBe('My Life on The Wall, part 2');
      expect(booksByTitleDesc[2].title).toBe('My Life on The Wall, part 1');

      const twoBooks = await booksRepository.find({ author: jon._id }, [], { title: -1 }, 2);
      expect(twoBooks.length).toBe(2);
      expect(twoBooks[0].title).toBe('My Life on The Wall, part 3');
      expect(twoBooks[1].title).toBe('My Life on The Wall, part 2');

      const lastBook = await booksRepository.find({ author: jon._id }, ['author'], { title: -1 }, 2, 2);
      expect(lastBook.length).toBe(1);
      expect(lastBook[0].title).toBe('My Life on The Wall, part 1');
      expect(lastBook[0].author).toBeInstanceOf(Author);
      expect(lastBook[0].author.isInitialized()).toBe(true);
    });

    test('should provide custom repository', async () => {
      const repo = orm.em.getRepository<Author>(Author.name) as AuthorRepository;
      expect(repo).toBeInstanceOf(AuthorRepository);
      expect(repo.magic).toBeInstanceOf(Function);
      expect(repo.magic('test')).toBe('111 test 222');
    });

    test('hooks', async () => {
      Author.beforeDestroyCalled = 0;
      Author.afterDestroyCalled = 0;
      const repo = orm.em.getRepository<Author>(Author.name);
      const author = new Author('Jon Snow', 'snow@wall.st');
      expect(author.id).toBeNull();
      expect(author.version).toBeUndefined();
      expect(author.versionAsString).toBeUndefined();

      await repo.persist(author, true);
      expect(author.id).not.toBeNull();
      expect(author.version).toBe(1);
      expect(author.versionAsString).toBe('v1');

      author.name = 'John Snow';
      await repo.persist(author, true);
      expect(author.version).toBe(2);
      expect(author.versionAsString).toBe('v2');

      expect(Author.beforeDestroyCalled).toBe(0);
      expect(Author.afterDestroyCalled).toBe(0);
      await repo.remove(author);
      expect(Author.beforeDestroyCalled).toBe(1);
      expect(Author.afterDestroyCalled).toBe(1);

      const author2 = new Author('Johny Cash', 'johny@cash.com');
      await repo.persist(author2, true);
      await repo.remove(author2);
      expect(Author.beforeDestroyCalled).toBe(2);
      expect(Author.afterDestroyCalled).toBe(2);
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

});
