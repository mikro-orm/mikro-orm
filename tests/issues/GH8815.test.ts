import { defineEntity, MikroORM, p, Type } from '@mikro-orm/sqlite';

class StrictType extends Type<string, string> {
  override convertToJSValue(value: string): string {
    if (value === 'invalid') {
      throw new Error('invalid value');
    }

    return value;
  }

  override getColumnType(): string {
    return 'text';
  }
}

const Setting = defineEntity({
  name: 'Setting',
  properties: {
    id: p.integer().primary(),
    value: p.type(StrictType),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Setting, Author, Book], dbName: ':memory:' });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('a relation assigned after a failed hydration is persisted', async () => {
  await orm.em.insert(Setting, { id: 1, value: 'invalid' });
  await expect(orm.em.fork().findOneOrFail(Setting, 1)).rejects.toThrow('invalid value');

  const em = orm.em.fork();
  const author = em.create(Author, { id: 1, name: 'Jon' });
  const book = em.create(Book, { id: 1, title: 'Foo' });
  await em.flush();

  book.author = author;
  await em.flush();

  const reloaded = await orm.em.fork().findOneOrFail(Book, 1);
  expect(reloaded.author?.id).toBe(1);
});
