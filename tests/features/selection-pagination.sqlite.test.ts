import { Collection, defineEntity, LoadStrategy, MikroORM, p, PrimaryKeyProp, Type, Utils } from '@mikro-orm/sqlite';
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

class SelectionTag {
  id!: number;
}

const SelectionTagSchema = defineEntity({
  class: SelectionTag,
  properties: { id: p.integer().primary() },
});

class CompositeItem {
  tenant!: number;
  code!: string;
  title!: string;
  tags = new Collection<SelectionTag>(this);
  [PrimaryKeyProp]?: ['tenant', 'code'];
}

const CompositeItemSchema = defineEntity({
  class: CompositeItem,
  properties: {
    tenant: p.integer().primary(),
    code: p.string().primary(),
    title: p.string(),
    tags: () => p.manyToMany(SelectionTag),
  },
});

class SelectionIdType extends Type<string, number> {
  override convertToDatabaseValue(value: string): number {
    return Number(value.slice(3));
  }

  override convertToJSValue(value: number): string {
    return `id:${value}`;
  }

  override getColumnType(): string {
    return 'integer';
  }
}

const CustomIdItem = defineEntity({
  name: 'SelectionCustomIdItem',
  properties: { id: p.type(SelectionIdType).primary(), title: p.string() },
});

const RelatedKeyItem = defineEntity({
  name: 'SelectionRelatedKeyItem',
  properties: {
    item: () => p.manyToOne(CompositeItem).primary(),
    title: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Item, Review, CompositeItemSchema, CustomIdItem, RelatedKeyItem, SelectionTagSchema],
    dbName: ':memory:',
  });
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
  const mock = mockLogger(orm);
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
  const { items, totalCount: count } = await em.findWithSelection(Item, scope, options);

  expect(items.map(item => item.id)).toEqual([1, 3, 2, 4]);
  expect(count).toBe(3);
  expect(items).toHaveLength(4);
  expect(options.selection.ids).toEqual([3, 1, 3, 6, 999]);
  expect(scope).toEqual({ tenant: 1 });
  expect(mock.mock.calls.filter(call => call[0].includes('[query]'))).toHaveLength(2);

  const { items: nextPage, totalCount: nextCount } = await em.findWithSelection(Item, scope, { ...options, offset: 2 });
  expect(nextPage.map(item => item.id)).toEqual([1, 3, 4]);
  expect(nextCount).toBe(3);
  expect(nextPage[0]).toBe(items[0]);
});

test('keeps the ordinary find and count path with an empty selection', async () => {
  const mock = mockLogger(orm);
  const { items, totalCount: count } = await orm.em
    .fork()
    .findWithSelection(
      Item,
      { tenant: 1 },
      { selection: { ids: [], match: { title: { $like: 'Match%' } } }, limit: 2, offset: 1 },
    );

  expect(items.map(item => item.id)).toEqual([3, 4]);
  expect(count).toBe(4);
  expect(mock.mock.calls.filter(call => call[0].includes('[query]'))).toHaveLength(2);
});

test.each(['em', 'repository'])('omits the count query when includeCount is false (%s)', async entryPoint => {
  const em = orm.em.fork();
  const mock = mockLogger(orm);
  const scope = Object.freeze({ tenant: 1 });
  const options = Object.freeze({
    selection: Object.freeze({
      ids: Object.freeze([1, 1, 6, 999]),
      match: Object.freeze({ title: { $like: 'Match%' } }),
    }),
    includeCount: false as const,
    fields: ['id', 'titleLength'] as const,
    orderBy: { rank: 'asc' as const },
    limit: 2,
    offset: 1,
  });
  const { items, totalCount } =
    entryPoint === 'em'
      ? await em.findWithSelection(Item, scope, options)
      : await em.getRepository(Item).findWithSelection(scope, options);
  expectTypeOf(totalCount).toEqualTypeOf<undefined>();
  expect(totalCount).toBeUndefined();

  expect(items.map(item => item.id)).toEqual([1, 3, 5]);
  expect(items.map(item => item.titleLength)).toEqual([6, 11, 10]);
  expect(Object.keys(items[1])).not.toContain('rank');
  expect(Object.keys(items[1])).not.toContain('title');
  const queries = mock.mock.calls.map(call => call[0]).filter(sql => sql.includes('[query]'));
  expect(queries).toHaveLength(1);
  expect(queries.every(sql => !sql.includes('count('))).toBe(true);
});

test.each(['em', 'repository'])('counts only scoped, unselected matches (%s)', async entryPoint => {
  const em = orm.em.fork();
  em.addFilter({ name: 'authorizedTenant', entity: Item, cond: { tenant: 1 }, default: true });
  const mock = mockLogger(orm);
  const options = Object.freeze({
    selection: Object.freeze({ ids: [1, 3, 3, 6, 999], match: { title: { $like: 'Match%' } } }),
  });
  const { totalCount: count } =
    entryPoint === 'em'
      ? await em.findWithSelection(Item, {}, options)
      : await em.getRepository(Item).findWithSelection({}, options);
  expectTypeOf(count).toEqualTypeOf<number>();

  expect(count).toBe(3);
  const queries = mock.mock.calls.map(call => call[0]).filter(sql => sql.includes('[query]'));
  expect(queries).toHaveLength(2);
  expect(queries.filter(sql => sql.includes('count('))).toHaveLength(1);
});

test('uses one query when the selection is empty and counting is disabled', async () => {
  const mock = mockLogger(orm);
  const { items } = await orm.em.fork().findWithSelection(
    Item,
    { tenant: 1 },
    {
      selection: { ids: [], match: { title: { $like: 'Match%' } } },
      includeCount: false,
      limit: 2,
      offset: 1,
    },
  );

  expect(items.map(item => item.id)).toEqual([3, 4]);
  expect(mock.mock.calls.filter(call => call[0].includes('[query]'))).toHaveLength(1);
});

test.each([true, false])(
  'caches the combined entity result with a named key (includeCount: %s)',
  async includeCount => {
    const em = orm.em.fork();
    const cacheKey = `selection-${includeCount}`;
    const options = {
      selection: { ids: [1] },
      includeCount,
      cache: [cacheKey, 60_000] as [string, number],
      limit: 1,
    };
    const find = async () => {
      const { items, totalCount } = await em.findWithSelection(Item, { tenant: 1 }, options);
      expect(totalCount).toBe(includeCount ? 4 : undefined);
      return items;
    };

    expect((await find()).map(item => item.id)).toEqual([1, 2]);
    em.clear();
    const mock = mockLogger(orm);
    expect((await find()).map(item => item.id)).toEqual([1, 2]);
    expect(mock.mock.calls.filter(call => call[0].includes('[query]'))).toHaveLength(includeCount ? 1 : 0);

    await em.nativeUpdate(Item, 1, { title: 'Updated selection' });
    await em.nativeUpdate(Item, 2, { title: 'Updated page' });
    await em.clearCache(cacheKey);
    em.clear();
    const items = await find();
    expect(items.map(item => item.title)).toEqual(['Updated selection', 'Updated page']);
  },
);

test('keeps selected and paged entities in the same temporary identity map', async () => {
  const em = orm.em.fork();
  const { items } = await em.findWithSelection(
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
  const { items, totalCount: count } = await em.findWithSelection(
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
  const { items, totalCount: count } = await orm.em.fork().findWithSelection(
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
  await expect(
    orm.em.fork().findWithSelection(
      Item,
      { tenant: 1 },
      {
        selection: { ids: [1] },
        // @ts-expect-error cursor pagination is not part of the selection interface
        first: 2,
      },
    ),
  ).rejects.toThrow('Selection pagination supports limit and offset');
});

test('preserves ordering priority for computed and omitted fields and keeps the count projection lean', async () => {
  const mock = mockLogger(orm);
  const { items, totalCount: count } = await orm.em.fork().findWithSelection(
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
    const { items, totalCount: count } = await orm.em
      .fork()
      .getRepository(Item)
      .findWithSelection(
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

  const { items, totalCount: count } = await em.findWithSelection(
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

test.each([LoadStrategy.JOINED, LoadStrategy.SELECT_IN])(
  'pages unique roots when matching a to-many relation (%s)',
  async strategy => {
    const em = orm.em.fork();
    em.create(Review, { id: 4, body: 'review 4', item: 2 });
    em.create(Review, { id: 5, body: 'review 5', item: 3 });
    await em.flush();
    em.clear();
    const mock = mockLogger(orm);
    const { items, totalCount } = await em.findWithSelection(
      Item,
      { tenant: 1 },
      {
        selection: { ids: [4], match: { reviews: { body: { $like: 'review%' } } } },
        populate: ['reviews'],
        strategy,
        orderBy: { id: 'asc' },
        offset: 1,
        limit: 2,
      },
    );

    expect(items.map(item => item.id)).toEqual([4, 2, 3]);
    expect(items[0].reviews).toHaveLength(0);
    expect(items[1].reviews).toHaveLength(2);
    expect(totalCount).toBe(3);
    expect(mock.mock.calls.filter(call => call[0].includes('[query]'))).toHaveLength(
      strategy === LoadStrategy.JOINED ? 2 : 3,
    );
  },
);

test.each([
  { ids: [1], offset: 50, limit: 2, expected: [1] },
  { ids: [], offset: 50, limit: 2, expected: [] },
  { ids: [1], offset: 0, limit: 0, expected: [1] },
])(
  'preserves the count with an empty regular page ($ids, $offset, $limit)',
  async ({ ids, offset, limit, expected }) => {
    const { items, totalCount } = await orm.em.fork().findWithSelection(
      Item,
      { tenant: 1 },
      {
        selection: { ids, match: { title: { $like: 'Match%' } } },
        offset,
        limit,
      },
    );
    expect(items.map(item => item.id)).toEqual(expected);
    expect(totalCount).toBe(4);
  },
);

test('returns selections when no entities match and supports an unbounded regular page', async () => {
  const em = orm.em.fork();
  const noMatches = await em.findWithSelection(
    Item,
    { tenant: 1 },
    {
      selection: { ids: [1, 6, 999], match: { title: 'absent' } },
      limit: 2,
    },
  );
  expect(noMatches.items.map(item => item.id)).toEqual([1]);
  expect(noMatches.totalCount).toBe(0);

  const all = await em.findWithSelection(Item, { tenant: 1 }, { selection: { ids: [3] } });
  expect(all.items.map(item => item.id)).toEqual([3, 1, 2, 4, 5]);
  expect(all.totalCount).toBe(4);
});

test('converts custom primary keys in both membership branches and the count', async () => {
  const em = orm.em.fork();
  for (let id = 1; id <= 3; id++) {
    em.create(CustomIdItem, { id: `id:${id}`, title: id === 1 ? 'Pinned' : 'Match' });
  }
  await em.flush();
  em.clear();
  const { items, totalCount } = await em.findWithSelection(
    CustomIdItem,
    {},
    {
      selection: { ids: ['id:1', 'id:1'], match: { title: 'Match' } },
      limit: 1,
    },
  );
  expect(items.map(item => item.id)).toEqual(['id:1', 'id:2']);
  expect(totalCount).toBe(2);
});

test('applies joined filters to the selected and matching branches', async () => {
  const em = orm.em.fork();
  em.create(Review, { id: 4, item: 6, body: 'unauthorized' });
  await em.flush();
  em.clear();
  em.addFilter({ name: 'tenant', entity: Item, cond: { tenant: 1 }, default: true });
  const { items, totalCount } = await em.findWithSelection(
    Review,
    {},
    {
      selection: { ids: [1, 4] },
      populate: ['item'],
      limit: 1,
    },
  );
  expect(items.map(review => review.id)).toEqual([1, 2]);
  expect(totalCount).toBe(2);
});

test('applies filters to relations introduced only by the search', async () => {
  const em = orm.em.fork();
  em.addFilter({ name: 'visibleReview', entity: Review, cond: { id: { $ne: 3 } }, default: true });
  const { items, totalCount } = await em.findWithSelection(
    Item,
    { tenant: 1 },
    {
      selection: { ids: [4], match: { reviews: { body: { $like: 'review%' } } } },
      limit: 2,
    },
  );
  expect(items.map(item => item.id)).toEqual([4, 1]);
  expect(totalCount).toBe(1);
});

test('supports a primary key backed by a relation with multiple columns', async () => {
  const em = orm.em.fork();
  const tag = em.create(SelectionTag, { id: 1 });
  for (const code of ['a', 'b', 'c']) {
    const item = em.create(CompositeItem, { tenant: 1, code, title: code, tags: [tag] });
    em.create(RelatedKeyItem, { item, title: code });
  }
  await em.flush();
  em.clear();
  const { items, totalCount } = await em.findWithSelection(
    RelatedKeyItem,
    {},
    {
      selection: { ids: [[1, 'b']], match: { item: { tags: { id: 1 } } } },
      limit: 1,
    },
  );
  expect(items.map(item => item.title)).toEqual(['b', 'a']);
  expect(totalCount).toBe(2);
});

test('keeps inheritance discriminator columns outside the key union', async () => {
  const Base = defineEntity({
    name: 'SelectionInheritanceItem',
    discriminator: 'kind',
    properties: {
      id: p.integer().primary(),
      kind: p.enum(['base', 'child']),
      reviews: () => p.oneToMany(InheritedReview).mappedBy('item'),
    },
  });
  const Child = defineEntity({
    name: 'SelectionInheritanceChild',
    extends: Base,
    discriminatorValue: 'child',
    properties: { title: p.string() },
  });
  const InheritedReview = defineEntity({
    name: 'SelectionInheritanceReview',
    properties: { id: p.integer().primary(), item: () => p.manyToOne(Base), body: p.string() },
  });
  const localOrm = await MikroORM.init({ entities: [Base, Child, InheritedReview], dbName: ':memory:' });

  try {
    await localOrm.schema.refresh();
    const em = localOrm.em.fork();
    for (const id of [1, 2]) {
      em.create(Child, { id, title: `Item ${id}` });
      em.create(InheritedReview, { id, item: id, body: 'match' });
    }
    await em.flush();
    em.clear();
    const { items, totalCount } = await em.findWithSelection(
      Child,
      {},
      { selection: { ids: [1], match: { reviews: { body: 'match' } } }, limit: 1 },
    );
    expect(items.map(item => item.id)).toEqual([1, 2]);
    expect(items.every(item => item instanceof Child.class)).toBe(true);
    expect(totalCount).toBe(1);
  } finally {
    await localOrm.close(true);
  }
});
