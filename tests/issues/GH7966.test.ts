// GH #7966 - custom `Type` whose JS-form and DB-form are different string shapes
// desyncs `__originalEntityData` when a to-one relation is assigned a raw scalar PK,
// causing a spurious UPDATE of the referenced entity's PK on every flush.
import { defineEntity, MikroORM, p, Type } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

// JS-form: "js-<n>"   DB-form: "db-<n>" (analogous to ULID <-> UUID)
class RemappingType extends Type<string | null | undefined> {
  override convertToDatabaseValue(value: string | null | undefined): string | null | undefined {
    return value == null ? value : value.replace(/^js-/, 'db-');
  }

  override convertToJSValue(value: string | null | undefined): string | null | undefined {
    return value == null ? value : value.replace(/^db-/, 'js-');
  }

  override compareAsType(): string {
    return 'string';
  }
}

const authorSchema = defineEntity({
  name: 'Author7966',
  properties: {
    id: p.type(RemappingType).primary(),
    name: p.string(),
  },
});

class Author extends authorSchema.class {}
authorSchema.setClass(Author);

const bookSchema = defineEntity({
  name: 'Book7966',
  properties: {
    id: p.integer().primary().autoincrement(),
    title: p.string(),
    author: () => p.manyToOne(Author).ref(),
  },
});

class Book extends bookSchema.class {}
bookSchema.setClass(Book);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('assigning a to-one relation via raw scalar PK does not emit a spurious PK update', async () => {
  const em = orm.em.fork();

  // seed an Author directly with a known DB-form id
  await em.getConnection().execute('insert into "author7966" ("id", "name") values (?, ?)', ['db-1', 'Ada']);

  const book = em.create(Book, {
    title: 'Structure and Interpretation',
    author: 'js-1', // JS-form id, as seen on `author.id`
  });
  em.persist(book);

  const author = await em.findOneOrFail(Author, 'js-1');
  expect(author.id).toBe('js-1');
  expect(author === book.author.unwrap()).toBe(true);

  const mock = mockLogger(orm);
  await em.flush();

  const updates = mock.mock.calls.filter(([msg]) => /update `author7966`/i.test(String(msg)));
  expect(updates).toHaveLength(0);

  // sanity: the row is untouched
  const rows = await em.getConnection().execute('select * from "author7966"');
  expect(rows).toEqual([{ id: 'db-1', name: 'Ada' }]);
});
