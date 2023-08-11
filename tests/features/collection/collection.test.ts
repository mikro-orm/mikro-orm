import { MikroORM } from '@mikro-orm/sqlite';
import { initORMSqlite2 } from '../../bootstrap';
import { Author4, Book4, BookTag4 } from '../../entities-schema';

describe.each(['sqlite', 'better-sqlite'] as const)('Collection (%s)', driver => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMSqlite2(driver));
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.close(true);
  });

  test('many to many relation', async () => {
    const author = orm.em.create(Author4, { name: 'Jon Snow', email: 'snow@wall.st' });
    const book1 = orm.em.create(Book4, { title: 'My Life on the Wall, part 1', author });
    const book2 = orm.em.create(Book4, { title: 'My Life on the Wall, part 2', author });
    const book3 = orm.em.create(Book4, { title: 'My Life on the Wall, part 3', author });
    const tag1 = orm.em.create(BookTag4, { name: 'silly' });
    const tag2 = orm.em.create(BookTag4, { name: 'funny' });
    const tag3 = orm.em.create(BookTag4, { name: 'sick' });
    const tag4 = orm.em.create(BookTag4, { name: 'strange' });
    const tag5 = orm.em.create(BookTag4, { name: 'sexy' });
    book1.tags.add(tag1, tag3);
    book2.tags.add(tag1, tag2, tag5);
    book3.tags.add(tag2, tag4, tag5);

    orm.em.persist([book1, book2, book3]);
    await orm.em.flush();

    const tagRepository = orm.em.getRepository(BookTag4);
    const tags = await tagRepository.findAll({ populate: ['books'] as const });

    orm.em.clear();
    let book = (await orm.em.findOne(Book4, { tags: tag1.id }))!;
    expect(book.tags.isInitialized()).toBe(false);
    await book.tags.init();

    // collection CRUD
    // remove
    expect(book.tags.count()).toBe(2);
    book.tags.remove(tagRepository.getReference(tag1.id));
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book4, book.id, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(1);

    // add
    book.tags.add(tagRepository.getReference(tag1.id)); // we need to get reference as tag1 is detached from current EM
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book4, book.id, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(2);

    // slice
    expect(book.tags.slice().length).toBe(2);
    expect(book.tags.slice(0, 2).length).toBe(2);
    expect(book.tags.slice(0, 1)).toEqual([book.tags[0]]);

    // contains
    expect(book.tags.contains(tagRepository.getReference(tag1.id))).toBe(true);
    expect(book.tags.contains(tagRepository.getReference(tag2.id))).toBe(false);
    expect(book.tags.contains(tagRepository.getReference(tag3.id))).toBe(true);
    expect(book.tags.contains(tagRepository.getReference(tag4.id))).toBe(false);
    expect(book.tags.contains(tagRepository.getReference(tag5.id))).toBe(false);

    // removeAll
    book.tags.removeAll();
    await orm.em.persist(book).flush();
    orm.em.clear();
    book = (await orm.em.findOne(Book4, book.id, { populate: ['tags'] as const }))!;
    expect(book.tags.count()).toBe(0);
    expect(book.tags.isEmpty()).toBe(true);

    // count
    expect(book.tags.count()).toBe(0);

    // isEmpty
    expect(book.tags.isEmpty()).toBe(true);
  });
});
