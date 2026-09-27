import { defineEntity, MetadataStorage, p } from '@mikro-orm/core';
import { vi } from 'vitest';
import { type Kysely, MikroORM } from '@mikro-orm/sqlite';
import { MikroTransformer } from '../../packages/sql/src/plugin/transformer.js';

const Author = defineEntity({
  name: 'Author',
  tableName: 'author_table',
  properties: {
    id: p.integer().primary(),
    firstName: p.string(),
  },
});

const Book = defineEntity({
  name: 'Book',
  tableName: 'book_table',
  properties: {
    id: p.integer().primary(),
    bookTitle: p.string(),
    author: p.manyToOne(Author),
  },
});

const Publisher = defineEntity({
  name: 'Publisher',
  tableName: 'publisher_table',
  properties: {
    id: p.integer().primary(),
    companyName: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.create();
  await orm.em.insert(Author, { id: 1, firstName: 'John' });
  await orm.em.insert(Book, { id: 1, bookTitle: 'Foo', author: 1 });
});

afterAll(() => orm.close(true));

afterEach(() => vi.restoreAllMocks());

const kysely = () => orm.em.fork().getKysely({ columnNamingStrategy: 'property' }) as Kysely<any>;

const selectBooks = () =>
  kysely()
    .selectFrom('book_table as b')
    .innerJoin('author_table as a', 'a.id', 'b.author_id')
    .select(['b.book_title', 'b.author_id', 'a.first_name'])
    .execute();

test('kysely queries do not rescan metadata or rebuild field maps per query', async () => {
  await expect(selectBooks()).resolves.toEqual([{ bookTitle: 'Foo', author: 1, firstName: 'John' }]);

  const iterator = vi.spyOn(MetadataStorage.prototype, Symbol.iterator);
  const buildFieldMap = vi.spyOn(MikroTransformer.prototype, 'buildFieldToPropertyMap');
  const buildRelationMap = vi.spyOn(MikroTransformer.prototype, 'buildRelationFieldMap');

  await expect(selectBooks()).resolves.toEqual([{ bookTitle: 'Foo', author: 1, firstName: 'John' }]);
  expect(iterator).not.toHaveBeenCalled();
  expect(buildFieldMap).not.toHaveBeenCalled();
  expect(buildRelationMap).not.toHaveBeenCalled();
});

test('table name lookup sees entities discovered at runtime', async () => {
  await selectBooks();
  orm.discoverEntity(Publisher);
  await orm.schema.update();
  await orm.em.insert(Publisher, { id: 1, companyName: 'Acme' });

  const res = await kysely().selectFrom('publisher_table').select(['company_name']).execute();
  expect(res).toEqual([{ companyName: 'Acme' }]);
});
