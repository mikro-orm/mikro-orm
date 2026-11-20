import { defineEntity, MikroORM, p } from '@mikro-orm/core';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { MySqlDriver } from '@mikro-orm/mysql';
import { CompiledQuery, type DatabaseConnection } from 'kysely';

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    meta: p.json<{ note: string }>().nullable(),
  },
});

const enableMode = async (connection: unknown) => {
  const sql = `set session sql_mode = concat(@@sql_mode, ',NO_BACKSLASH_ESCAPES')`;
  await (connection as DatabaseConnection).executeQuery(CompiledQuery.raw(sql));
};

const titles = [
  `'`,
  `\\`,
  `\\'`,
  `''`,
  `it's`,
  `a\\b`,
  `x\\`,
  `"quoted"`,
  `line\nbreak`,
  `' or 1 = 1 -- `,
  `\\' or 1 = 1 -- `,
];

describe.each([
  ['mysql', MySqlDriver, 3308],
  ['mariadb', MariaDbDriver, 3309],
] as const)('string values with the NO_BACKSLASH_ESCAPES sql mode (%s)', (type, driver, port) => {
  describe.each([true, false])('mode enabled: %s', enabled => {
    let orm: MikroORM;

    beforeAll(async () => {
      orm = await MikroORM.init({
        driver,
        entities: [Book],
        dbName: `mikro_orm_test_nbe_${type}_${enabled ? 'on' : 'off'}`,
        port,
        onCreateConnection: async connection => {
          if (enabled) {
            await enableMode(connection);
          }
        },
      });
      await orm.schema.refresh();
    });

    beforeEach(() => orm.schema.clear());

    afterAll(async () => {
      await orm.schema.dropDatabase();
      await orm.close(true);
    });

    test('the session mode is what the test expects', async () => {
      const [{ mode }] = await orm.em.getConnection().execute('select @@sql_mode as mode');
      expect(mode.includes('NO_BACKSLASH_ESCAPES')).toBe(enabled);
    });

    test.each(titles)('round-trips %j', async title => {
      orm.em.create(Book, { title: 'other' });
      const book = orm.em.create(Book, { title, meta: { note: title } });
      await orm.em.flush();
      orm.em.clear();

      const found = await orm.em.find(Book, { title });
      expect(found.map(b => [b.id, b.title, b.meta])).toEqual([[book.id, title, { note: title }]]);

      found[0].title = `${title}${title}`;
      await orm.em.flush();
      orm.em.clear();

      const updated = await orm.em.find(Book, { title: { $in: [`${title}${title}`, 'missing'] } });
      expect(updated.map(b => [b.id, b.title])).toEqual([[book.id, `${title}${title}`]]);
    });

    test('the very first query of a connection', async () => {
      const other = await MikroORM.init({
        driver,
        entities: [Book],
        dbName: orm.config.get('dbName'),
        port,
        ensureDatabase: false,
        onCreateConnection: async connection => {
          if (enabled) {
            await enableMode(connection);
          }
        },
      });

      try {
        const res = await other.em.getConnection().execute('select ? as v', ['a\\b']);
        expect(res).toEqual([{ v: 'a\\b' }]);
      } finally {
        await other.close(true);
      }
    });

    test('batch insert', async () => {
      titles.forEach(title => orm.em.create(Book, { title }));
      await orm.em.flush();
      orm.em.clear();

      const books = await orm.em.find(Book, {}, { orderBy: { id: 'asc' } });
      expect(books.map(b => b.title)).toEqual(titles);
    });
  });
});
