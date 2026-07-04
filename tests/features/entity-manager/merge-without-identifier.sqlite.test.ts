import { defineEntity, MikroORM, p, ValidationError } from '@mikro-orm/sqlite';

const BookSchema = defineEntity({
  name: 'BookMergeValidation',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});
class Book extends BookSchema.class {}
BookSchema.setClass(Book);

describe('merge without identifier validation (SQLite)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Book],
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.schema.clear());

  test('merge rejects entity instances without a primary key', () => {
    const book = new Book();
    book.title = 'Untitled';

    expect(() => orm.em.merge(book)).toThrow(`You cannot merge entity 'BookMergeValidation' without identifier!`);
  });

  test('merge rejects plain data without a primary key', () => {
    expect(() => orm.em.merge(Book, { title: 'Untitled' })).toThrow(
      `You cannot merge entity 'BookMergeValidation' without identifier!`,
    );
  });

  test('merge succeeds when primary key is provided', async () => {
    const book = orm.em.create(Book, { title: 'First Edition' });
    await orm.em.flush();
    orm.em.clear();

    const merged = orm.em.merge(Book, { id: book.id, title: 'Second Edition' });
    expect(merged.id).toBe(book.id);
    expect(merged.title).toBe('Second Edition');
  });
});
