import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';

@Entity()
class Item {

  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;

  @Property({ type: 'text', nullable: true })
  note?: string;

  @Property({ type: 'json', nullable: true })
  data?: { value: string };

}

const values = [
  `it's`,
  `a\\b`,
  `trailing\\`,
  `\\' or 1=1 -- `,
  `\\\\''`,
  `say "hi"`,
  `line\nbreak\ttab\0nul`,
  `100%_!`,
];

describe.each([
  ['mysql', MySqlDriver, 3308],
  ['mariadb', MariaDbDriver, 3309],
] as const)('string values with quotes and backslashes in %s', (type, driver, port) => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<MySqlDriver>({
      entities: [Item],
      dbName: `mikro_orm_test_string_escaping_v6`,
      driver: driver as typeof MySqlDriver,
      port,
    });
  });

  beforeEach(() => orm.schema.refreshDatabase());
  afterAll(() => orm.close(true));

  test('round-trip in the default sql mode', async () => {
    values.forEach((value, idx) => {
      orm.em.create(Item, { id: idx + 1, label: value, note: value, data: { value } });
    });
    await orm.em.flush();
    orm.em.clear();

    for (const value of values) {
      const items = await orm.em.fork().find(Item, { label: value });
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ label: value, note: value, data: { value } });
    }

    const em = orm.em.fork();
    const item = await em.findOneOrFail(Item, { label: `it's` });
    item.label = `\\' or 1=1 -- `;
    await em.flush();
    expect(await orm.em.fork().count(Item, { label: `it's` })).toBe(0);
    expect(await orm.em.fork().count(Item, { label: `\\' or 1=1 -- ` })).toBe(2);
    expect(await orm.em.fork().count(Item, { label: { $in: [`a\\b`, `trailing\\`] } })).toBe(2);
    expect(await orm.em.fork().count(Item, { data: { value: `\\\\''` } })).toBe(1);
  });

  test('values keep the statement intact with the NO_BACKSLASH_ESCAPES sql mode', async () => {
    orm.em.create(Item, { id: 1, label: `it's` });
    orm.em.create(Item, { id: 2, label: `plain` });
    await orm.em.flush();

    await orm.em.fork().transactional(async em => {
      await em.execute(`set session sql_mode = concat(@@sql_mode, ',NO_BACKSLASH_ESCAPES')`);

      for (const value of values) {
        const items = await em.find(Item, { label: value });
        expect(items.map(item => item.id)).toEqual(value === `it's` ? [1] : []);
      }

      expect(await em.count(Item, { label: { $in: [`trailing\\`, `\\' or 1=1 -- `] } })).toBe(0);
      em.create(Item, { id: 3, label: `\\', 'x', null) -- `, note: `it's` });
      await em.flush();
      em.clear();
      expect(await em.count(Item)).toBe(3);
      expect(await em.findOneOrFail(Item, 3)).toMatchObject({ note: `it's`, data: null });
    });
  });

});
