import { MikroORM } from '../lib';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { Author2, Book2, BookTag2 } from './entities-sql';
import { MetadataDiscovery } from '../lib/metadata';

/**
 * @class EntityHelperMySqlTest
 */
describe('EntityHelperMySql', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMMySql();
    await new MetadataDiscovery(orm.em, orm.config, orm.config.getLogger()).discover();
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

  test('#assign() allows deep merging of object properties [mysql]', async () => {
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    book.meta = { items: 5, category: 'test' };
    book.assign({ meta: { items: 3, category: 'foo' } });
    expect(book.meta).toEqual({ items: 3, category: 'foo' });
    book.assign({ meta: { category: 'bar' } }, { mergeObjects: true });
    expect(book.meta).toEqual({ items: 3, category: 'bar' });
    book.assign({ meta: { category: 'bar' } });
    expect(book.meta).toEqual({ category: 'bar' });
    jon.identities = ['1', '2'];
    jon.assign({ identities: ['3', '4'] }, { mergeObjects: true });
    expect(jon.identities).toEqual(['3', '4']);
  });

  afterAll(async () => orm.close(true));

});
