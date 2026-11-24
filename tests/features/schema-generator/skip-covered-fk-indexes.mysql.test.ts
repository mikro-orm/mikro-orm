import { EntitySchema, type EntitySchemaMetadata } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

const Author = new EntitySchema({
  name: 'Author',
  properties: { id: { type: 'number', primary: true } },
});

const book = (extra: Partial<EntitySchemaMetadata<any>>, index?: boolean, withAuthor = true) =>
  new EntitySchema({
    name: 'Book',
    properties: {
      id: { type: 'number', primary: true },
      ...(withAuthor ? { author: { kind: 'm:1' as const, entity: () => Author, index } } : {}),
      published: { type: 'boolean' },
      title: { type: 'string' },
    },
    ...extra,
  });

const options = (Book: EntitySchema, skipCoveredForeignKeyIndexes = true) => ({
  entities: [Author, Book],
  dbName: 'mikro_orm_test_skip_covered_fk_indexes',
  port: 3308,
  schemaGenerator: { skipCoveredForeignKeyIndexes },
});

const init = (Book: EntitySchema) => MikroORM.init(options(Book));

const createSQL = async (Book: EntitySchema, skipCoveredForeignKeyIndexes?: boolean) => {
  const orm = new MikroORM(options(Book, skipCoveredForeignKeyIndexes));
  return orm.schema.getCreateSchemaSQL({ wrap: false });
};

test('implicit FK index is kept by default', async () => {
  const sql = await createSQL(book({ indexes: [{ properties: ['author', 'published'] }] }), false);
  expect(sql).toContain('add index `book_author_id_index` (`author_id`)');
});

test('no implicit FK index when a composite index starts with the relation', async () => {
  const sql = await createSQL(book({ indexes: [{ properties: ['author', 'published'] }] }));
  expect(sql).not.toContain('`book_author_id_index`');
  expect(sql).toContain('add index `book_author_id_published_index` (`author_id`, `published`)');
});

test('no implicit FK index when a composite unique starts with the relation', async () => {
  const sql = await createSQL(book({ uniques: [{ properties: ['author', 'published'] }] }));
  expect(sql).not.toContain('`book_author_id_index`');
  expect(sql).toContain('add unique `book_author_id_published_unique` (`author_id`, `published`)');
});

test('implicit FK index is kept when the relation is not the leading column', async () => {
  const sql = await createSQL(book({ indexes: [{ properties: ['published', 'author'] }] }));
  expect(sql).toContain('add index `book_author_id_index` (`author_id`)');
});

test('implicit FK index is kept when the composite index is partial', async () => {
  const sql = await createSQL(book({ indexes: [{ properties: ['author', 'published'], where: 'published = 1' }] }));
  expect(sql).toContain('add index `book_author_id_index` (`author_id`)');
});

test('implicit FK index is kept when the composite index has a custom type or expression', async () => {
  const sql1 = await createSQL(book({ indexes: [{ properties: ['author', 'title'], type: 'fulltext' }] }));
  expect(sql1).toContain('add index `book_author_id_index` (`author_id`)');

  const expression = 'alter table `book` add index `custom_idx` (`title`)';
  const sql2 = await createSQL(book({ indexes: [{ name: 'custom_idx', properties: ['author'], expression }] }));
  expect(sql2).toContain('add index `book_author_id_index` (`author_id`)');
});

test('implicit FK index is kept when the composite index has column options or is invisible', async () => {
  const columns = [{ name: 'author', sort: 'desc' as const }];
  const sql1 = await createSQL(book({ indexes: [{ properties: ['author', 'published'], columns }] }));
  expect(sql1).toContain('add index `book_author_id_index` (`author_id`)');

  const sql2 = await createSQL(book({ indexes: [{ properties: ['author', 'published'], invisible: true }] }));
  expect(sql2).toContain('add index `book_author_id_index` (`author_id`)');
});

test('explicit `index: true` on the relation keeps the FK index', async () => {
  const sql = await createSQL(book({ indexes: [{ properties: ['author', 'published'] }] }, true));
  expect(sql).toContain('add index `book_author_id_index` (`author_id`)');
  expect(sql).toContain('add index `book_author_id_published_index` (`author_id`, `published`)');
});

const migrate = async (from: EntitySchema, to: EntitySchema) => {
  const orm1 = await init(from);
  await orm1.schema.refresh();
  await orm1.close(true);

  const orm = await init(to);
  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  await orm.schema.execute(diff.up);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  await orm.schema.execute(diff.down);
  await orm.schema.dropDatabase();
  await orm.close(true);

  return diff;
};

test('existing implicit FK index gets dropped once covered by a composite index', async () => {
  const diff = await migrate(book({}, true), book({ indexes: [{ properties: ['author', 'published'] }] }));
  expect(diff.up).toContain('drop index `book_author_id_index`');
  expect(diff.up).toContain('add index `book_author_id_published_index` (`author_id`, `published`)');
});

test('existing implicit FK index gets dropped once a named index is reordered to cover it', async () => {
  const diff = await migrate(
    book({ indexes: [{ name: 'custom_idx', properties: ['published', 'author'] }] }),
    book({ indexes: [{ name: 'custom_idx', properties: ['author', 'published'] }] }),
  );
  expect(diff.up).toContain('drop index `book_author_id_index`');
});

test('named index backing the FK can change its other columns', async () => {
  const diff = await migrate(
    book({ indexes: [{ name: 'custom_idx', properties: ['author', 'published'] }] }),
    book({ indexes: [{ name: 'custom_idx', properties: ['author', 'title'] }] }),
  );
  expect(diff.up).toBe('alter table `book` drop index `custom_idx`, add index `custom_idx` (`author_id`, `title`);\n');
});

test('the index backing the FK can be swapped for another one', async () => {
  await migrate(
    book({
      indexes: [
        { name: 'idx1', properties: ['author', 'published'] },
        { name: 'idx2', properties: ['title', 'author'] },
      ],
    }),
    book({
      indexes: [
        { name: 'idx1', properties: ['published', 'author'] },
        { name: 'idx2', properties: ['author', 'title'] },
      ],
    }),
  );
});

test('relation can be removed while another index is added', async () => {
  const diff = await migrate(book({}), book({ indexes: [{ properties: ['title'] }] }, undefined, false));
  expect(diff.up).toContain('alter table `book` drop index `book_author_id_index`;');
});
