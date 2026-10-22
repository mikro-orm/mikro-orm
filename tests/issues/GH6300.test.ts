import { mkdir, rm } from 'node:fs/promises';
import { defineEntity, type MigrationsOptions, MikroORM, p } from '@mikro-orm/sqlite';
import { Migration, Migrator } from '@mikro-orm/migrations';
import { TEMP_DIR } from '../helpers.js';

// v2 changes the type of `bio`, which sqlite applies by rebuilding the `author` table
function createEntities(version: 1 | 2) {
  const Tag = defineEntity({
    name: 'Tag',
    properties: { id: p.integer().primary(), name: p.string() },
  });
  const Author = defineEntity({
    name: 'Author',
    properties: {
      id: p.integer().primary(),
      bio: version === 1 ? p.string().nullable() : p.integer().nullable(),
      tags: () => p.manyToMany(Tag),
    },
  });
  const Book = defineEntity({
    name: 'Book',
    properties: { id: p.integer().primary(), author: () => p.manyToOne(Author).nullable() },
  });
  const Chapter = defineEntity({
    name: 'Chapter',
    properties: { id: p.integer().primary(), author: () => p.manyToOne(Author).deleteRule('cascade') },
  });
  const Review = defineEntity({
    name: 'Review',
    properties: { id: p.integer().primary(), author: () => p.manyToOne(Author) },
  });
  return [Tag, Author, Book, Chapter, Review];
}

const dir = TEMP_DIR + '/gh6300';

async function init(name: string, migrations: MigrationsOptions = {}) {
  const dbName = `${dir}/${name}.db`;
  const orm1 = await MikroORM.init({ entities: createEntities(1), dbName });
  await orm1.schema.refresh();
  const conn = orm1.em.getConnection();
  await conn.execute(`insert into tag (id, name) values (1, 't')`);
  await conn.execute(`insert into author (id, bio) values (1, null)`);
  await conn.execute(`insert into author_tags (author_id, tag_id) values (1, 1)`);
  await conn.execute(`insert into book (id, author_id) values (1, 1)`);
  await conn.execute(`insert into chapter (id, author_id) values (1, 1)`);
  await conn.execute(`insert into review (id, author_id) values (1, 1)`);
  await orm1.close();

  return MikroORM.init({
    entities: createEntities(2),
    dbName,
    extensions: [Migrator],
    migrations: { path: `${dir}/${name}`, snapshot: false, silent: true, ...migrations },
  });
}

async function getChildRows(orm: MikroORM) {
  const conn = orm.em.getConnection();
  return {
    book: await conn.execute('select author_id from book'),
    chapter: await conn.execute('select author_id from chapter'),
    review: await conn.execute('select author_id from review'),
    authorTags: await conn.execute('select author_id, tag_id from author_tags'),
  };
}

class DeleteAuthor extends Migration {
  override up() {
    this.addSql('delete from author where id = 1');
  }
}

class DeleteAuthorOutsideTransaction extends DeleteAuthor {
  override isTransactional() {
    return false;
  }
}

class SelectOutsideTransaction extends DeleteAuthorOutsideTransaction {
  override up() {
    this.addSql('select 1');
  }
}

const childRows = {
  book: [{ author_id: 1 }],
  chapter: [{ author_id: 1 }],
  review: [{ author_id: 1 }],
  authorTags: [{ author_id: 1, tag_id: 1 }],
};

beforeAll(async () => {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
});
afterAll(() => rm(dir, { recursive: true, force: true }));

test.each([true, false])('table rebuild in a migration keeps child rows (allOrNothing: %s)', async allOrNothing => {
  const orm = await init(`all-or-nothing-${allOrNothing}`, { allOrNothing });
  await orm.migrator.create();

  await orm.migrator.up();
  expect(await getChildRows(orm)).toEqual(childRows);
  const conn = orm.em.getConnection();
  await conn.execute(`insert into author (id, bio) values (2, 5)`);
  expect(await conn.execute('select id, bio from author')).toEqual([
    { id: 1, bio: null },
    { id: 2, bio: 5 },
  ]);

  await orm.migrator.down();
  expect(await getChildRows(orm)).toEqual(childRows);

  // foreign keys are enforced again after the run
  await expect(conn.execute('delete from author where id = 1')).rejects.toThrow('FOREIGN KEY constraint failed');
  await orm.close();
});

test('a migration that leaves a row violating a foreign key is rolled back', async () => {
  const orm = await init('violation', { migrationsList: [{ name: 'DeleteAuthor', class: DeleteAuthor }] });
  await expect(orm.migrator.up()).rejects.toThrow('Migration DeleteAuthor left 4 rows that violate foreign keys');
  expect(await orm.em.getConnection().execute('select id from author')).toEqual([{ id: 1 }]);
  expect(await getChildRows(orm)).toEqual(childRows);
  expect(await orm.migrator.getExecuted()).toEqual([]);
  await orm.close();
});

test('rows that already violated a foreign key do not fail a migration', async () => {
  const orm = await init('existing-violation');
  const conn = orm.em.getConnection();
  await conn.execute('pragma foreign_keys = off');
  await conn.execute('insert into review (id, author_id) values (2, 99)');
  await conn.execute('pragma foreign_keys = on');
  await orm.migrator.create();

  await orm.migrator.up();
  expect(await orm.migrator.getExecuted()).toHaveLength(1);
  await orm.close();
});

test.each([{ transactional: false }, { allOrNothing: false }])(
  'foreign keys stay on in a non-transactional migration (%o)',
  async options => {
    const orm = await init(`non-transactional-${options.transactional ?? true}`, {
      ...options,
      migrationsList: [{ name: 'DeleteAuthor', class: DeleteAuthorOutsideTransaction }],
    });
    await expect(orm.migrator.up()).rejects.toThrow('FOREIGN KEY constraint failed');
    expect(await getChildRows(orm)).toEqual(childRows);
    await orm.close();
  },
);

test('a transactional migration after a non-transactional one runs with foreign keys off', async () => {
  const orm = await init('mixed', {
    allOrNothing: false,
    migrationsList: [
      { name: 'Migration1', class: SelectOutsideTransaction },
      { name: 'Migration2', class: DeleteAuthor },
    ],
  });
  await expect(orm.migrator.up()).rejects.toThrow('Migration DeleteAuthor left 4 rows that violate foreign keys');
  await orm.close();
});

test('a migration in a caller-supplied transaction runs with foreign keys on', async () => {
  const orm = await init('caller-transaction');
  await orm.migrator.create();

  await expect(
    orm.em.transactional(em => orm.migrator.up({ transaction: em.getTransactionContext() })),
  ).rejects.toThrow('FOREIGN KEY constraint failed');
  expect(await orm.migrator.getExecuted()).toEqual([]);
  await orm.close();
});
