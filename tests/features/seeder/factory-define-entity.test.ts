import { defineEntity, type EntityData, type InferEntity } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { Factory } from '@mikro-orm/seeder';

const BookSchema = defineEntity({
  name: 'Book',
  tableName: 'books',
  properties: p => ({
    id: p.integer().autoincrement().primary(),
    title: p.string(),
  }),
});

type Book = InferEntity<typeof BookSchema>;

class BookFactory extends Factory<Book> {
  model = BookSchema;

  definition(): EntityData<Book> {
    return { title: 'book' };
  }
}

describe('Factory with defineEntity (GH discussion #7768)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [BookSchema],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('factory accepts a defineEntity schema as model', async () => {
    const book = await new BookFactory(orm.em).createOne();
    expect(book.id).toBeDefined();
    expect(book.title).toBe('book');
  });
});
