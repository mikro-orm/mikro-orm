import { MikroORM } from '../lib';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { Author2, Book2, BookTag2 } from './entities-sql';
import { MetadataStorage } from '../lib/metadata/MetadataStorage';
import { Logger } from '../lib/utils/Logger';

/**
 * @class EntityHelperMySqlTest
 */
describe('EntityHelperMySql', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMMySql();
    const logger = new Logger({ logger: jest.fn() } as any);
    new MetadataStorage(orm.em, orm.options, logger).discover();
  });
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('#assign() should update entity values [mysql]', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    await orm.em.persist(book);
    expect(book.title).toBe('Book2');
    expect(book.author).toBe(jon);
    book.assign({ title: 'Better Book2 1', author: god, notExisting: true });
    expect(book.author).toBe(god);
    expect((book as any).notExisting).toBe(true);
    await orm.em.persist(god);
    book.assign({ title: 'Better Book2 2', author: god.id });
    expect(book.author).toBe(god);
    book.assign({ title: 'Better Book2 3', author: jon.id });
    expect(book.title).toBe('Better Book2 3');
    expect(book.author).toBe(jon);
  });

  test('#assign() should update entity collection [mysql]', async () => {
    const other = new BookTag2('other');
    await orm.em.persist(other);
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    const tag1 = new BookTag2('tag 1');
    const tag2 = new BookTag2('tag 2');
    const tag3 = new BookTag2('tag 3');
    book.tags.add(tag1);
    book.tags.add(tag2);
    book.tags.add(tag3);
    await orm.em.persist(book);
    book.assign({ tags: [other.id] });
    expect(book.tags.getIdentifiers()).toMatchObject([other.id]);
    book.assign({ tags: [] });
    expect(book.tags.getIdentifiers()).toMatchObject([]);
    book.assign({ tags: [tag1.id, tag3.id] });
    expect(book.tags.getIdentifiers()).toMatchObject([tag1.id, tag3.id]);
    book.assign({ tags: [tag2] });
    expect(book.tags.getIdentifiers()).toMatchObject([tag2.id]);
  });

  afterAll(async () => orm.close(true));

});
