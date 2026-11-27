import { defineEntity, MikroORM, p } from '@mikro-orm/mysql';
import { MikroORM as MariaDbMikroORM } from '@mikro-orm/mariadb';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
    label: p.string(),
    note: p.text().nullable(),
    data: p.json<{ value: string }>().nullable(),
    kind: p.enum(['plain', "it's", 'a\\b']).default('plain'),
    path: p.string().default("x\\'y").comment("it's a\\b"),
  },
});

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
  ['mysql', MikroORM, 3308],
  ['mariadb', MariaDbMikroORM, 3309],
] as const)('string values with quotes and backslashes in %s', (type, ORM, port) => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = (await ORM.init({
      entities: [Item],
      dbName: `mikro_orm_test_string_escaping`,
      port,
    })) as unknown as MikroORM;
  });

  beforeEach(() => orm.schema.refresh());
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
      expect(items[0]).toMatchObject({ label: value, note: value, data: { value }, kind: 'plain', path: "x\\'y" });
    }

    const em = orm.em.fork();
    const item = await em.findOneOrFail(Item, { label: `it's` });
    item.label = `\\' or 1=1 -- `;
    item.kind = 'a\\b';
    await em.flush();
    expect(await orm.em.fork().count(Item, { label: `it's` })).toBe(0);
    expect(await orm.em.fork().count(Item, { label: `\\' or 1=1 -- ` })).toBe(2);
    expect(await orm.em.fork().count(Item, { label: `\\' or 1=1 -- `, kind: 'a\\b' })).toBe(1);
    expect(await orm.em.fork().count(Item, { label: { $in: [`a\\b`, `trailing\\`] } })).toBe(2);
    expect(await orm.em.fork().count(Item, { label: { $like: `%\\\\' or%` } })).toBe(2);
    expect(await orm.em.fork().count(Item, { label: /^say "hi"$/ })).toBe(1);
    expect(await orm.em.fork().count(Item, { label: /100%_!/ })).toBe(1);
    expect(await orm.em.fork().count(Item, { data: { value: `\\\\''` } })).toBe(1);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
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
      em.create(Item, { id: 3, label: `\\', 'x', null, 'plain', 'x') -- `, note: `it's` });
      await em.flush();
      em.clear();
      expect(await em.count(Item)).toBe(3);
      expect(await em.findOneOrFail(Item, 3)).toMatchObject({ note: `it's`, data: null, kind: 'plain' });
    });
  });
});
