import { defineEntity, MikroORM, p, PrimaryKeyProp } from '@mikro-orm/pglite';

const Item = defineEntity({
  name: 'SelectionPgItem',
  properties: {
    id: p.uuid().primary(),
    tenant: p.integer(),
    title: p.string(),
    titleLength: p.integer().formula(cols => `length(${cols.title})`),
  },
});

class CompositeItem {
  tenant!: number;
  code!: string;
  [PrimaryKeyProp]?: ['tenant', 'code'];
}

const CompositeItemSchema = defineEntity({
  class: CompositeItem,
  properties: {
    tenant: p.integer().primary(),
    code: p.string().primary(),
  },
});

const id = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, '0')}`;
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Item, CompositeItemSchema], dbName: 'memory://' });
  await orm.schema.refresh();
});

afterAll(async () => orm.close(true));

test('pins UUID selections and orders by a formula with a partial projection', async () => {
  const em = orm.em.fork();
  em.create(Item, { id: id(1), tenant: 1, title: 'Pinned' });
  em.create(Item, { id: id(2), tenant: 1, title: 'Match two' });
  em.create(Item, { id: id(3), tenant: 1, title: 'Match three' });
  em.create(Item, { id: id(4), tenant: 2, title: 'Match other tenant' });
  await em.flush();
  em.clear();

  const [items, count] = await em.findAndCount(
    Item,
    { tenant: 1 },
    {
      selection: { ids: [id(1), id(1), id(4), id(9)], match: { title: { $ilike: 'match%' } } },
      fields: ['id', 'titleLength'],
      orderBy: [{ titleLength: 'desc' }, { id: 'asc' }],
      limit: 1,
    },
  );

  expect(items.map(item => item.id)).toEqual([id(1), id(3)]);
  expect(items.map(item => item.titleLength)).toEqual([6, 11]);
  expect(Object.keys(items[1])).not.toContain('title');
  expect(count).toBe(2);
});

test('excludes composite selected IDs from the regular count and page', async () => {
  const em = orm.em.fork();
  em.create(CompositeItem, { tenant: 1, code: 'a' });
  em.create(CompositeItem, { tenant: 1, code: 'b' });
  em.create(CompositeItem, { tenant: 1, code: 'c' });
  em.create(CompositeItem, { tenant: 2, code: 'b' });
  await em.flush();
  em.clear();

  const [items, count] = await em.findAndCount(
    CompositeItem,
    { tenant: 1 },
    {
      selection: {
        ids: [
          [1, 'b'],
          [1, 'b'],
          [2, 'b'],
        ],
      },
      orderBy: { code: 'asc' },
      limit: 1,
    },
  );

  expect(items.map(item => item.code)).toEqual(['b', 'a']);
  expect(count).toBe(2);
});
