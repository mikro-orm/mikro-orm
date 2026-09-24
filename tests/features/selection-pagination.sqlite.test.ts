import { Collection, defineEntity, LoadStrategy, MikroORM, p, PrimaryKeyProp, Utils } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const Item = defineEntity({
  name: 'SelectionItem',
  properties: {
    id: p.integer().primary(),
    tenant: p.integer(),
    title: p.string(),
    rank: p.integer(),
    titleLength: p.integer().formula(cols => `length(${cols.title})`),
    reviews: () => p.oneToMany(Review).mappedBy(review => review.item),
  },
});

const Review = defineEntity({
  name: 'SelectionReview',
  properties: {
    id: p.integer().primary(),
    body: p.string(),
    item: () => p.manyToOne(Item),
  },
});

class CompositeItem {
  tenant!: number;
  code!: string;
  title!: string;
  [PrimaryKeyProp]?: ['tenant', 'code'];
}

const CompositeItemSchema = defineEntity({
  class: CompositeItem,
  properties: {
    tenant: p.integer().primary(),
    code: p.string().primary(),
    title: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Item, Review, CompositeItemSchema], dbName: ':memory:' });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.clear();
  const rows = [
    { id: 1, tenant: 1, title: 'Pinned', rank: 1 },
    { id: 2, tenant: 1, title: 'Match two', rank: 2 },
    { id: 3, tenant: 1, title: 'Match three', rank: 2 },
    { id: 4, tenant: 1, title: 'Match four', rank: 3 },
    { id: 5, tenant: 1, title: 'Match five', rank: 2 },
    { id: 6, tenant: 2, title: 'Match other tenant', rank: 0 },
  ];

  for (const row of rows) {
    orm.em.create(Item, row);
  }

  for (let id = 1; id <= 3; id++) {
    orm.em.create(Review, { id, body: `review ${id}`, item: id === 3 ? 2 : 1 });
  }

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => orm.close(true));
afterEach(() => vi.restoreAllMocks());

test('pins deduplicated in-scope IDs outside the search on every page and counts only available matches', async () => {
  const em = orm.em.fork();
  const selection = {
    ids: Object.freeze([3, 1, 3, 6, 999]),
    match: { title: { $like: 'Match%' } },
  };
  const options = Object.freeze({
    selection: Object.freeze(selection),
    limit: 2,
    offset: 1,
    orderBy: Object.freeze({ rank: 'asc' as const, id: 'desc' as const }),
  });
  const scope = Object.freeze({ tenant: 1 });
  const [items, count] = await em.findAndCount(Item, scope, options);

  expect(items.map(item => item.id)).toEqual([1, 3, 2, 4]);
  expect(count).toBe(3);
  expect(items).toHaveLength(4);
  expect(options.selection.ids).toEqual([3, 1, 3, 6, 999]);
  expect(scope).toEqual({ tenant: 1 });

  const [nextPage, nextCount] = await em.findAndCount(Item, scope, { ...options, offset: 2 });
  expect(nextPage.map(item => item.id)).toEqual([1, 3, 4]);
  expect(nextCount).toBe(3);
  expect(nextPage[0]).toBe(items[0]);
});

test('keeps the ordinary find and count path with an empty selection', async () => {
  const mock = mockLogger(orm);
  const [items, count] = await orm.em
    .fork()
    .findAndCount(
      Item,
      { tenant: 1 },
      { selection: { ids: [], match: { title: { $like: 'Match%' } } }, limit: 2, offset: 1 },
    );

  expect(items.map(item => item.id)).toEqual([3, 4]);
  expect(count).toBe(4);
  expect(mock.mock.calls.filter(call => call[0].includes('[query]'))).toHaveLength(2);
});

test.each(['em', 'repository'])('find() pins selections without issuing a count (%s)', async entryPoint => {
  const em = orm.em.fork();
  const mock = mockLogger(orm);
  const scope = Object.freeze({ tenant: 1 });
  const options = Object.freeze({
    selection: Object.freeze({
      ids: Object.freeze([1, 1, 6, 999]),
      match: Object.freeze({ title: { $like: 'Match%' } }),
    }),
    fields: ['id', 'titleLength'] as const,
    orderBy: { rank: 'asc' as const },
    limit: 2,
    offset: 1,
  });
  const items =
    entryPoint === 'em' ? await em.find(Item, scope, options) : await em.getRepository(Item).find(scope, options);

  expect(items.map(item => item.id)).toEqual([1, 3, 5]);
  expect(items.map(item => item.titleLength)).toEqual([6, 11, 10]);
  expect(Object.keys(items[1])).not.toContain('rank');
  expect(Object.keys(items[1])).not.toContain('title');
  const queries = mock.mock.calls.map(call => call[0]).filter(sql => sql.includes('[query]'));
  expect(queries).toHaveLength(2);
  expect(queries.every(sql => !sql.includes('count('))).toBe(true);
});

test.each(['em', 'repository'])('count() counts only scoped, unselected matches (%s)', async entryPoint => {
  const em = orm.em.fork();
  em.addFilter({ name: 'authorizedTenant', entity: Item, cond: { tenant: 1 }, default: true });
  const mock = mockLogger(orm);
  const options = Object.freeze({
    selection: Object.freeze({ ids: [1, 3, 3, 6, 999], match: { title: { $like: 'Match%' } } }),
  });
  const count =
    entryPoint === 'em' ? await em.count(Item, {}, options) : await em.getRepository(Item).count({}, options);

  expect(count).toBe(3);
  const queries = mock.mock.calls.map(call => call[0]).filter(sql => sql.includes('[query]'));
  expect(queries).toHaveLength(1);
  expect(queries[0]).toContain('count(');
});

test('find() uses one query when the selection is empty', async () => {
  const mock = mockLogger(orm);
  const items = await orm.em.fork().find(
    Item,
    { tenant: 1 },
    {
      selection: { ids: [], match: { title: { $like: 'Match%' } } },
      limit: 2,
      offset: 1,
    },
  );

  expect(items.map(item => item.id)).toEqual([3, 4]);
  expect(mock.mock.calls.filter(call => call[0].includes('[query]'))).toHaveLength(1);
});

test.each(['find', 'findAndCount'] as const)(
  'keeps named cache entries separate from selected rows (%s)',
  async method => {
    const em = orm.em.fork();
    const cacheKey = `selection-${method}`;
    const options = {
      selection: { ids: [1] },
      cache: [cacheKey, 60_000] as [string, number],
      limit: 1,
    };

    const find = async () => {
      if (method === 'find') {
        return em.find(Item, { tenant: 1 }, options);
      }

      const [items, count] = await em.findAndCount(Item, { tenant: 1 }, options);
      expect(count).toBe(4);
      return items;
    };

    expect((await find()).map(item => item.id)).toEqual([1, 2]);
    em.clear();
    expect((await find()).map(item => item.id)).toEqual([1, 2]);

    await em.nativeUpdate(Item, 1, { title: 'Updated selection' });
    await em.nativeUpdate(Item, 2, { title: 'Updated page' });
    await em.clearCache(cacheKey);
    em.clear();

    const items = await find();
    expect(items.map(item => item.id)).toEqual([1, 2]);
    expect(items.map(item => item.title)).toEqual(['Updated selection', 'Updated page']);
  },
);

test('find() keeps selected and paged entities in the same temporary identity map', async () => {
  const em = orm.em.fork();
  const items = await em.find(
    Item,
    { tenant: 1 },
    {
      selection: { ids: [1], match: { title: { $like: 'Match%' } } },
      disableIdentityMap: true,
      populate: ['reviews'],
      strategy: LoadStrategy.SELECT_IN,
      limit: 1,
    },
  );

  expect(items.map(item => item.id)).toEqual([1, 2]);
  expect(items[0].reviews.getItems()).toHaveLength(2);
  expect(items[0].reviews.getItems()[0].item).toBe(items[0]);
  expect(items[1].reviews.getItems()[0].item).toBe(items[1]);
  expect([...em.getUnitOfWork().getIdentityMap()]).toHaveLength(0);
});

test('applies enabled filters to selected entities and the regular page', async () => {
  const em = orm.em.fork();
  em.addFilter({ name: 'authorizedTenant', entity: Item, cond: { tenant: 1 }, default: true });
  const [items, count] = await em.findAndCount(
    Item,
    {},
    {
      selection: { ids: [1, 6], match: { title: { $like: 'Match%' } } },
      orderBy: { id: 'asc' },
      limit: 1,
    },
  );

  expect(items.map(item => item.id)).toEqual([1, 2]);
  expect(count).toBe(4);
});

test('preserves an explicit primary-key direction and its priority', async () => {
  const [items, count] = await orm.em.fork().findAndCount(
    Item,
    { tenant: 1 },
    {
      selection: { ids: [1, 3], match: { title: { $like: 'Match%' } } },
      orderBy: [{ id: 'desc' }, { rank: 'asc' }],
      limit: 2,
    },
  );

  expect(items.map(item => item.id)).toEqual([3, 1, 5, 4]);
  expect(count).toBe(3);
});

test('rejects cursor options when IDs are pinned', async () => {
  await expect(orm.em.fork().findAndCount(Item, { tenant: 1 }, { selection: { ids: [1] }, first: 2 })).rejects.toThrow(
    'Selection pagination supports limit and offset',
  );
});

test('preserves ordering priority for computed and omitted fields and keeps the count projection lean', async () => {
  const mock = mockLogger(orm);
  const [items, count] = await orm.em.fork().findAndCount(
    Item,
    { tenant: 1 },
    {
      selection: { ids: [1], match: { title: { $like: 'Match%' } } },
      fields: ['id', 'titleLength'],
      orderBy: { titleLength: 'desc', rank: 'asc' },
      limit: 2,
    },
  );

  expect(items.map(item => item.id)).toEqual([1, 3, 5]);
  expect(items.map(item => item.titleLength)).toEqual([6, 11, 10]);
  expect(Object.keys(items[1])).not.toContain('rank');
  expect(Object.keys(items[1])).not.toContain('title');
  expect(count).toBe(4);
  const countSql = mock.mock.calls.map(call => call[0]).find(sql => sql.includes('count('))!;
  expect(countSql).not.toContain('length(');
  expect(countSql).not.toContain('order by');
});

test.each([LoadStrategy.JOINED, LoadStrategy.SELECT_IN])(
  'populates full to-many collections with root pagination through the repository API (%s)',
  async strategy => {
    const mock = mockLogger(orm);
    const [items, count] = await orm.em
      .fork()
      .getRepository(Item)
      .findAndCount(
        { tenant: 1 },
        {
          selection: { ids: [1], match: { title: { $like: 'Match%' } } },
          populate: ['reviews'],
          strategy,
          limit: 1,
          orderBy: { id: 'asc' },
        },
      );

    expect(items.map(item => item.id)).toEqual([1, 2]);
    expect(count).toBe(4);
    expect(items[0].reviews).toBeInstanceOf(Collection);
    expect(items[0].reviews.getItems().map(review => review.body)).toEqual(['review 1', 'review 2']);
    expect(items[1].reviews.getItems().map(review => review.body)).toEqual(['review 3']);
    const countSql = mock.mock.calls.map(call => call[0]).find(sql => sql.includes('count('))!;
    expect(countSql).not.toContain('selection_review');
  },
);

test.each([true, false])('handles composite primary keys (tuple comparisons: %s)', async compareTuples => {
  const em = orm.em.fork();
  em.create(CompositeItem, { tenant: 1, code: 'a', title: 'Match a' });
  em.create(CompositeItem, { tenant: 1, code: 'b', title: 'Pinned' });
  em.create(CompositeItem, { tenant: 1, code: 'c', title: 'Match c' });
  em.create(CompositeItem, { tenant: 2, code: 'b', title: 'Pinned other tenant' });
  await em.flush();
  em.clear();
  vi.spyOn(orm.em.getPlatform(), 'allowsComparingTuples').mockReturnValue(compareTuples);

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
        match: { title: { $like: 'Match%' } },
      },
      orderBy: [{ code: 'desc' }],
      limit: 1,
    },
  );

  expect(items.map(item => item.code)).toEqual(['b', 'c']);
  expect(count).toBe(2);
  const primaryKey = Utils.getPrimaryKeyHash(['tenant', 'code']);
  expect(await em.count(CompositeItem, { [primaryKey]: { $in: [] } })).toBe(0);
  expect(await em.count(CompositeItem, { [primaryKey]: { $nin: [] } })).toBe(4);
});
