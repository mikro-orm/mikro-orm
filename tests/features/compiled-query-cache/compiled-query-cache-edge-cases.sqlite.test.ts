import {
  defineEntity,
  MikroORM,
  p,
  QueryBuilder,
  raw,
  ref,
  RequestContext,
  type EntityManager,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

const Tenant = defineEntity({
  name: 'Tenant',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    qty: p.integer(),
    price: p.double().nullable(),
    note: p.string().nullable(),
    tags: p.array().nullable(),
    data: p.json<{ a?: unknown; b?: unknown }>().nullable(),
    created: p.datetime(),
    day: p.date().nullable(),
    tenant: () => p.manyToOne(Tenant),
    parent: () => p.manyToOne(Item).nullable(),
    children: () => p.oneToMany(Item).mappedBy('parent'),
  },
});

let cached: MikroORM;
let plain: MikroORM;

async function init(enabled: boolean) {
  const orm = await MikroORM.init({ entities: [Item, Tenant], dbName: ':memory:', compiledQueryCache: { enabled } });
  await orm.schema.create();
  const em = orm.em.fork();
  const tenants = [1, 2, 3].map(id => em.create(Tenant, { id, name: `t${id}` }));
  const items: any[] = [];

  for (let i = 1; i <= 30; i++) {
    items.push(
      em.create(Item, {
        id: i,
        name: i % 7 === 0 ? `it?em ${i}%` : `item ${i}`,
        qty: i % 5,
        price: i % 4 === 0 ? null : i * 1.25,
        note: i % 3 === 0 ? null : i % 3 === 1 ? '' : `note's "${i}"`,
        tags: i % 2 ? ['a', `t${i % 3}`] : null,
        data: i % 2 ? { a: i % 3, b: `x${i % 2}` } : null,
        created: new Date(Date.UTC(2024, i % 12, i)),
        day: i % 4 ? `2024-0${(i % 9) + 1}-1${i % 9}` : null,
        tenant: tenants[i % 3],
        parent: i > 3 ? items[i % 3] : null,
      }),
    );
  }

  await em.flush();
  return orm;
}

beforeAll(async () => {
  cached = await init(true);
  plain = await init(false);
});

afterAll(async () => {
  await cached.close(true);
  await plain.close(true);
});

afterEach(() => vi.restoreAllMocks());

type Scenario = (em: EntityManager, i: number) => Promise<unknown>;

async function capture(scenario: Scenario, orm: MikroORM, i: number): Promise<string> {
  try {
    return JSON.stringify(await scenario(orm.em.fork(), i));
  } catch (e) {
    return `error: ${(e as Error).message}`;
  }
}

async function run(scenario: Scenario, iterations = 6): Promise<number> {
  const cachedLog = mockLogger(cached);
  const plainLog = mockLogger(plain);
  const hits = vi.spyOn(QueryBuilder.prototype, 'executeCompiled');
  const queries = (mock: typeof cachedLog) =>
    mock.mock.calls
      .splice(0)
      .map(call => call[0].replace(/ \[took .*$/, ''))
      .sort();

  for (let i = 0; i < iterations; i++) {
    const [actual, expected] = [await capture(scenario, cached, i), await capture(scenario, plain, i)];
    expect(actual).toEqual(expected);
    expect(queries(cachedLog)).toEqual(queries(plainLog));
  }

  const count = hits.mock.calls.length;
  hits.mockRestore();
  return count;
}

const scenarios: Record<string, Scenario> = {
  'strings with placeholders and quotes': (em, i) =>
    em.find(Item, { name: ['it?em 7%', "o'brien", 'a ?? b', ':name', '\\', '', 'item 3'][i % 7] }),
  'like with special chars': (em, i) =>
    em.find(Item, { name: { $like: ['it?em%', '%\\%', '%?%', "%'%", '_tem 1', '%'][i] } }),
  'empty string vs value': (em, i) => em.find(Item, { note: i % 2 ? '' : `note's "${i + 2}"` }),
  'numeric edge values': (em, i) => em.find(Item, { qty: [0, -0, -1, 1.5, Number.MAX_SAFE_INTEGER, 3][i] }),
  'NaN and Infinity': (em, i) => em.find(Item, { price: [NaN, Infinity, -Infinity, 5, 0, 2.5][i] }),
  'in with null item': (em, i) => em.find(Item, { note: { $in: i % 2 ? [null, ''] : ['', `note's "2"`] } as any }),
  'in with duplicates': (em, i) => em.find(Item, { id: { $in: [i, i, i + 1, i + 1, i] } }),
  nin: (em, i) => em.find(Item, { id: { $nin: i % 2 ? [1, 2, 3] : [4, 5, 6, 7, 8] } }, { limit: 5 }),
  'nin empty': (em, i) => em.find(Item, { id: { $nin: i % 2 ? [] : [4, 5] } }, { limit: 5 }),
  'array of pks': (em, i) => em.find(Item, i % 2 ? [1, 2, 3] : [4, 5]),
  'pk as string': (em, i) => em.find(Item, { id: (i % 2 ? String(i) : i) as number }),
  'date object for datetime': (em, i) =>
    em.find(Item, { created: { $gte: new Date(Date.UTC(2024, i, 1)) } }, { limit: 3 }),
  'date object for date-only': (em, i) =>
    em.find(Item, { day: { $gte: new Date(Date.UTC(2024, i, 1)) as any } }, { limit: 3 }),
  'invalid date': (em, i) => em.find(Item, { created: { $gte: i % 2 ? new Date('nope') : new Date(0) } }, { limit: 3 }),
  'json nested types': (em, i) => em.find(Item, { data: { a: i % 3 === 0 ? 1 : i % 3 === 1 ? '1' : true } as any }),
  'json nested': (em, i) => em.find(Item, { data: { a: i % 3, b: `x${i % 2}` } }),
  'array column': (em, i) => em.find(Item, { tags: { $contains: ['a'] } as any }, { limit: i + 1 }),
  'array column eq': (em, i) => em.find(Item, { tags: i % 2 ? ['a', 't1'] : ['a', 't0', 'x'] } as any),
  'entity value': (em, i) => em.find(Item, { tenant: em.getReference(Tenant, (i % 3) + 1) }, { limit: 4 }),
  'entity ref value': (em, i) => em.find(Item, { tenant: ref(em.getReference(Tenant, (i % 3) + 1)) }, { limit: 4 }),
  'new entity value without pk': (em, i) =>
    em.find(Item, { tenant: em.create(Tenant, { name: 'new' }, { persist: false }) as any }, { limit: 4 }),
  'entity in list': (em, i) =>
    em.find(
      Item,
      { tenant: { $in: [em.getReference(Tenant, 1), em.getReference(Tenant, (i % 3) + 1)] } },
      { limit: 4 },
    ),
  'relation with null': (em, i) => em.find(Item, { parent: i % 2 ? null : (i % 3) + 1 }, { limit: 4 }),
  'self relation nested': (em, i) => em.find(Item, { parent: { parent: null, qty: { $gte: i % 3 } } }, { limit: 4 }),
  'collection condition': (em, i) => em.find(Item, { children: { qty: i % 5 } }, { limit: 4 }),
  'some/none/every': async (em, i) => [
    await em.find(Item, { children: { $some: { qty: i % 5 } } }),
    await em.find(Item, { children: { $none: { qty: i % 5 } } }, { limit: 5 }),
    await em.find(Item, { children: { $every: { qty: { $gte: i % 2 } } } }, { limit: 5 }),
  ],
  'orderBy variants': async (em, i) => [
    await em.find(Item, { qty: i % 5 }, { orderBy: { name: i % 2 ? 'asc' : 'desc' } }),
    await em.find(Item, { qty: i % 5 }, { orderBy: [{ qty: 'desc' }, { id: i % 2 ? 'ASC' : 'DESC' }] }),
    await em.find(Item, { qty: i % 5 }, { orderBy: { tenant: { name: 'asc' }, id: 'desc' } }),
    await em.find(Item, { qty: i % 5 }, { orderBy: { price: i % 2 ? 'asc nulls last' : 'desc nulls first' } as any }),
  ],
  'orderBy raw': (em, i) =>
    em.find(Item, { qty: { $gte: i % 3 } }, { orderBy: { [raw('qty * 2')]: 'desc', id: 'asc' }, limit: 5 }),
  'fields raw': (em, i) =>
    em.find(
      Item,
      { qty: { $gte: i % 3 } },
      { fields: ['id', raw('qty * 2 as dbl')] as any, limit: 5, orderBy: { id: 'asc' } },
    ),
  'limit and offset edges': async (em, i) => [
    await em.find(Item, {}, { limit: i % 3 === 0 ? 0 : i, orderBy: { id: 'asc' } }),
    await em.find(Item, {}, { offset: i % 2 ? 0 : 28, orderBy: { id: 'asc' } }),
    await em.find(Item, {}, { limit: 3, offset: i % 2 ? undefined : 5, orderBy: { id: 'asc' } }),
    await em.find(Item, {}, { limit: i % 2 ? undefined : 2, orderBy: { id: 'asc' } }),
    await em.find(Item, {}, { limit: i % 2 ? -1 : 2, orderBy: { id: 'asc' } }),
  ],
  'populate with fields and strategy': async (em, i) => [
    await em.find(
      Item,
      { id: { $lte: i + 2 } },
      { populate: ['children', 'tenant'], fields: ['name', 'children.name', 'tenant.name'] },
    ),
    await em.find(
      Item,
      { id: { $lte: i + 2 } },
      { populate: ['children.tenant'], strategy: i % 2 ? 'joined' : 'select-in' },
    ),
    await em.find(Item, { id: { $lte: i + 2 } }, { populate: ['*'], limit: 2 }),
    await em.find(
      Item,
      { id: { $lte: i + 2 } },
      { populate: ['children'], populateOrderBy: { children: { id: 'desc' } }, limit: 3 },
    ),
    await em.find(
      Item,
      { id: { $lte: i + 2 } },
      { populate: ['children'], populateWhere: { children: { qty: i % 2 } }, limit: 3 },
    ),
  ],
  'partial then full entity in one context': async (em, i) => {
    const a = await em.findOne(Item, { name: `item ${i + 1}` }, { fields: ['name'] });
    const b = await em.findOne(Item, { name: `item ${i + 1}`, qty: { $gte: 0 } });
    const c = await em.findOne(Item, { name: `item ${i + 1}`, qty: { $gte: 0 } }, { refresh: true });
    return [a, b, c];
  },
  'auto flush before a compiled query': async (em, i) => {
    await em.begin();
    em.create(Item, { id: 1000 + i, name: 'fresh', qty: 99, created: new Date(0), tenant: 1 });
    const found = await em.find(Item, { qty: 99 });
    const count = await em.count(Item, { qty: 99 });
    await em.rollback();
    return [found.length, count];
  },
  'changes in the identity map': async (em, i) => {
    const item = await em.findOneOrFail(Item, { id: (i % 5) + 1 });
    item.name = 'changed';
    const again = await em.find(Item, { id: { $in: [(i % 5) + 1, 20] } }, { flushMode: 'commit' });
    const refreshed = await em.find(Item, { id: { $in: [(i % 5) + 1, 21] } }, { flushMode: 'commit', refresh: true });
    return [again.map(x => x.name), refreshed.map(x => x.name)];
  },
  disableIdentityMap: (em, i) => em.find(Item, { qty: i % 5 }, { disableIdentityMap: true, populate: ['children'] }),
  'findOneOrFail and strict': async (em, i) => [
    await em.findOneOrFail(Item, { id: i + 1 }),
    await em.findOneOrFail(Item, { id: i + 100 }).catch(e => e.message),
    await em.findOneOrFail(Item, { qty: i % 5 }, { strict: true }).catch(e => e.message),
  ],
  findAndCount: (em, i) =>
    em.findAndCount(Item, { qty: { $gte: i % 4 } }, { limit: 3, offset: i, orderBy: { id: 'asc' } }),
  'count variants': async (em, i) => [
    await em.count(Item, { children: { qty: i % 5 } }),
    await em.count(Item, { qty: { $in: [i % 5, 1] } }),
    await em.count(Item, {}, { populate: ['children'] } as any),
  ],
  'undefined values': (em, i) =>
    em.find(Item, { qty: i % 2 ? undefined : 1, note: i % 3 ? undefined : null } as any, { limit: 4 }),
  'comments and hints': (em, i) =>
    em.find(Item, { qty: i % 5 }, { comments: [`c${i % 2}`], hintComments: [`h${i % 2}`], limit: 2 }),
  'request context': (em, i) =>
    RequestContext.create(em, () => em.getRepository(Item).find({ qty: i % 5 }, { limit: 2 })),
  transactional: (em, i) => em.transactional(tx => tx.find(Item, { qty: i % 5 }, { limit: 2 })),
};

const seq = <T>(values: T[], i: number): T => values[i];
const edges: Record<string, [number, Scenario]> = {
  'findOne by pk then zero': [7, (em, i) => em.findOne(Item, seq([1, 2, 3, 4, 0, -1, 1.5], i))],
  'findOne by string pk then empty': [
    7,
    (em, i) => em.findOne(Item, seq(['1', '2', '3', '4', '', ' ', '0'], i) as any),
  ],
  'findOne by name then empty': [
    6,
    (em, i) => em.findOne(Item, { name: seq(['item 1', 'item 2', 'item 3', 'item 4', '', ' '], i) }),
  ],
  'find then NaN': [8, (em, i) => em.find(Item, { qty: seq([1, 2, 3, 4, NaN, Infinity, -Infinity, -0], i) })],
  'find then invalid date': [
    6,
    (em, i) =>
      em.find(
        Item,
        {
          created: {
            $gte: seq(
              [new Date(0), new Date(1e12), new Date(2e12), new Date(0), new Date('nope'), new Date(8.64e15)],
              i,
            ),
          },
        },
        { limit: 2 },
      ),
  ],
  'in then odd lists': [
    12,
    (em, i) =>
      em.find(Item, {
        id: {
          $in: seq(
            [
              [1, 2, 3],
              [2, 3, 4],
              [3, 4, 5],
              [4, 5, 6],
              [NaN],
              [1, NaN, 2],
              [],
              [7],
              [1, 2],
              [1, 2, 3, 4, 5],
              Array.from({ length: 17 }, (_, x) => x),
              Array.from({ length: 33 }, (_, x) => x),
            ],
            i,
          ),
        },
      }),
  ],
  'limit then odd': [
    9,
    (em, i) =>
      em.find(
        Item,
        { qty: { $gte: 0 } },
        { limit: seq([2, 3, 4, 5, NaN, Infinity, -1, 1.5, 2 ** 40], i), orderBy: { id: 'asc' } },
      ),
  ],
  'offset then odd': [
    8,
    (em, i) =>
      em.find(
        Item,
        { qty: { $gte: 0 } },
        { limit: 2, offset: seq([2, 3, 4, 5, NaN, -1, 1.5, 1e9], i), orderBy: { id: 'asc' } },
      ),
  ],
  'joined to-many with odd limit': [
    9,
    (em, i) =>
      em.find(
        Item,
        { qty: { $gte: 0 } },
        {
          populate: ['children'],
          strategy: 'joined',
          limit: seq([2, 3, 4, 5, -1, 0, NaN, -5, 3], i),
          orderBy: { id: 'asc' },
        },
      ),
  ],
  'joined to-many with odd offset': [
    9,
    (em, i) =>
      em.find(
        Item,
        { qty: { $gte: 0 } },
        {
          populate: ['children'],
          strategy: 'joined',
          offset: seq([2, 3, 4, 5, -1, 0, NaN, -5, 3], i),
          orderBy: { id: 'asc' },
        },
      ),
  ],
  'long and odd strings': [
    7,
    (em, i) => em.find(Item, { name: seq(['a', 'b', 'c', 'd', 'x'.repeat(20000), 'nul\0byte', '\u{1F600}'], i) }),
  ],
  'entity then entity without pk': [
    6,
    (em, i) =>
      em.find(
        Item,
        {
          tenant:
            i < 4
              ? em.getReference(Tenant, (i % 3) + 1)
              : (em.create(Tenant, { name: 'n' }, { persist: false }) as any),
        },
        { limit: 2 },
      ),
  ],
  'number then bigint and string': [
    7,
    (em, i) => em.find(Item, { qty: seq([1, 2, 3, 4, 2n, '2', true], i) as any }, { limit: 2 }),
  ],
  'count then odd': [6, (em, i) => em.count(Item, { qty: seq([1, 2, 3, 4, NaN, -0], i) })],
  'findOne empty object after warm': [6, (em, i) => em.findOne(Item, i < 4 ? { qty: i } : ({} as any))],
  'findOne undefined value after warm': [
    6,
    (em, i) => em.findOne(Item, { qty: seq([1, 2, 3, 4, undefined, null], i) } as any),
  ],
};

describe('compiled query cache edge cases', () => {
  test.each(Object.keys(edges))('values after the shape is cached: %s', async name => {
    await run(edges[name][1], edges[name][0]);
  });

  test.each(Object.keys(scenarios))('%s', async name => {
    await run(scenarios[name]);
  });

  test('per-fork tenant filters with static conditions', async () => {
    const results: number[][] = [];

    for (const orm of [cached, plain]) {
      const counts: number[] = [];
      for (let i = 0; i < 9; i++) {
        const em = orm.em.fork();
        em.addFilter({ name: 'tenant', entity: Item, cond: { tenant: (i % 3) + 1 } });
        counts.push(...(await em.find(Item, { qty: { $gte: 0 } })).map(x => x.tenant.id));
      }
      results.push(counts);
    }

    expect(results[0]).toEqual(results[1]);
  });

  test('many concurrent calls of a new shape', async () => {
    for (let round = 0; round < 3; round++) {
      const calls = Array.from({ length: 40 }, (_, i) => i);
      const [a, b] = await Promise.all(
        [cached, plain].map(orm =>
          Promise.all(
            calls.map(async i => {
              const em = orm.em.fork();
              const [items, count] = await em.findAndCount(
                Item,
                { qty: i % 5, id: { $gt: i % 7 }, name: { $ne: `r${round}` } },
                { populate: ['children'], orderBy: { id: 'asc' } },
              );
              return [items.map(x => [x.id, x.children.length]), count];
            }),
          ),
        ),
      );
      expect(a).toEqual(b);
    }
  });
});
