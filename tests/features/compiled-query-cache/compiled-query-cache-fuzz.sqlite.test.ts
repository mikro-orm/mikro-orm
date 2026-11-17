import { defineEntity, MikroORM, p, QueryBuilder, type Dictionary } from '@mikro-orm/sqlite';
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
  const tenants = [1, 2, 3].map(id => em.create(Tenant, { id, name: `tenant ${id}` }));

  for (let i = 1; i <= 40; i++) {
    em.create(Item, {
      id: i,
      name: i % 7 === 0 ? `it?em ${i}%` : `item ${i}`,
      qty: i % 5,
      price: i % 4 === 0 ? null : i * 1.25,
      note: i % 3 === 0 ? null : i % 3 === 1 ? '' : `note's "${i}"`,
      created: new Date(Date.UTC(2024, i % 12, (i % 27) + 1)),
      day: i % 4 ? `2024-0${(i % 9) + 1}-1${i % 9}` : null,
      tenant: tenants[i % 3],
      parent: i > 4 ? (i % 4) + 1 : null,
    });
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

type Random = () => number;
/** A value of a condition, generated again for every call of the same shape. */
type Leaf = (random: Random) => unknown;

function createRandom(seed: number): Random {
  return () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

const pick = <T>(random: Random, items: T[]): T => items[Math.floor(random() * items.length) % items.length];
const strings = [
  'item 1',
  'item 12',
  'it?em 7%',
  "o'brien",
  'a ?? b',
  ':name',
  '',
  '%',
  'note\'s "5"',
  'tenant 2',
  'ünï',
];
const numbers = [0, 1, 2, 3, 4, 7, 12, 39, 40, -1, 1.25, 2.5, 1000];
const values: Dictionary<Leaf> = {
  number: random => pick(random, numbers),
  string: random => pick(random, strings),
  date: random => new Date(Date.UTC(2024, Math.floor(random() * 12), 1 + Math.floor(random() * 27))),
  day: random => `2024-0${1 + Math.floor(random() * 9)}-1${Math.floor(random() * 9)}`,
};
const fields: Dictionary<{ kind: string; nullable?: boolean }> = {
  id: { kind: 'number' },
  qty: { kind: 'number' },
  price: { kind: 'number', nullable: true },
  name: { kind: 'string' },
  note: { kind: 'string', nullable: true },
  created: { kind: 'date' },
  day: { kind: 'day', nullable: true },
};

/** Builds a condition where every value is a function, so the same shape can be instantiated with other values. */
function createCondition(random: Random, depth = 0, relations = true): Dictionary {
  const cond: Dictionary = {};
  const size = 1 + Math.floor(random() * 3);

  for (let i = 0; i < size; i++) {
    const roll = random();

    if (roll < 0.1 && depth < 2) {
      const operator = pick(random, ['$and', '$or']);
      cond[operator] = [createCondition(random, depth + 1, relations), createCondition(random, depth + 1, relations)];
    } else if (roll < 0.14 && depth < 2) {
      cond.$not = createCondition(random, depth + 1, relations);
    } else if (roll < 0.26 && relations && depth < 2) {
      const relation = pick(random, ['tenant', 'parent', 'children']);
      const nested = relation === 'tenant' ? { name: values.string } : createCondition(random, depth + 1, false);
      const roll2 = random();
      cond[relation] =
        relation === 'children' && roll2 < 0.3
          ? { [pick(random, ['$some', '$none', '$every'])]: nested }
          : relation !== 'children' && roll2 < 0.3
            ? (r: Random) => 1 + Math.floor(r() * 4)
            : nested;
    } else {
      const name = pick(random, Object.keys(fields));
      const { kind, nullable } = fields[name];
      const value = values[kind];
      const roll2 = random();

      if (roll2 < 0.3) {
        cond[name] = nullable ? (r: Random) => (r() < 0.3 ? null : value(r)) : value;
      } else if (roll2 < 0.5) {
        const length: Leaf = r => Math.floor(r() * 6);
        cond[name] = {
          [pick(random, ['$in', '$nin'])]: (r: Random) => Array.from({ length: length(r) as number }, () => value(r)),
        };
      } else if (roll2 < 0.6 && kind === 'string') {
        cond[name] = { $like: (r: Random) => pick(r, ['item 1%', '%?%', "%'%", '_tem%', '%', 'it?em%']) };
      } else {
        const operators = ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte'];
        const first = pick(random, operators);
        const second = pick(random, operators);
        cond[name] = first === second || random() < 0.6 ? { [first]: value } : { [first]: value, [second]: value };
      }
    }
  }

  return cond;
}

function instantiate(value: unknown, random: Random): unknown {
  if (typeof value === 'function') {
    return (value as Leaf)(random);
  }

  if (Array.isArray(value)) {
    return value.map(item => instantiate(item, random));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, instantiate(v, random)]));
  }

  return value;
}

function createOptions(random: Random): Dictionary<unknown> {
  const options: Dictionary<unknown> = {};

  if (random() < 0.5) {
    options.limit = (r: Random) => 1 + Math.floor(r() * 6);
  }

  if (random() < 0.3) {
    options.offset = (r: Random) => Math.floor(r() * 4);
  }

  if (random() < 0.6 || options.limit || options.offset) {
    options.orderBy = pick(random, [
      { id: 'asc' },
      { id: 'desc' },
      { qty: 'asc', id: 'asc' },
      { tenant: { name: 'desc' }, id: 'asc' },
    ]);
  }

  if (random() < 0.4) {
    options.populate = pick(random, [['children'], ['tenant'], ['parent'], ['children.tenant'], ['parent.tenant']]);

    if (random() < 0.5) {
      options.strategy = pick(random, ['joined', 'select-in']);
    }
  }

  if (random() < 0.15) {
    options.fields = pick(random, [['name'], ['name', 'qty'], ['name', 'tenant.name']]);
    delete options.populate;
  }

  return options;
}

/** Drops the repeated last value of `in (...)` lists, as the cache pads them to a power of two. */
function unpad(sql: string): string {
  return sql.replace(/ in \(([^()]+)\)/g, (_, list: string) => {
    const items = list.split(', ');

    while (items.length > 1 && items.at(-1) === items.at(-2)) {
      items.pop();
    }

    return ` in (${items.join(', ')})`;
  });
}

async function capture(orm: MikroORM, kind: string, where: Dictionary, options: Dictionary): Promise<string> {
  const em = orm.em.fork();

  try {
    if (kind === 'count') {
      return JSON.stringify(await em.count(Item, where));
    }

    if (kind === 'findOne') {
      return JSON.stringify(await em.findOne(Item, where, options));
    }

    return JSON.stringify(await em.find(Item, where, options));
  } catch (e) {
    return unpad(`error: ${(e as Error).message}`);
  }
}

test('random conditions and options produce the same queries and results with the cache', async () => {
  const cachedLog = mockLogger(cached);
  const plainLog = mockLogger(plain);
  const hits = vi.spyOn(QueryBuilder.prototype, 'executeCompiled');
  const queries = (mock: typeof cachedLog) =>
    mock.mock.calls
      .splice(0)
      .map(call => unpad(call[0].replace(/ \[took .*$/, '')))
      .sort();

  for (let shape = 0; shape < 250; shape++) {
    const random = createRandom(1000 + shape * 7919);
    const condition = createCondition(random);
    const options = createOptions(random);
    const kind = pick(random, ['find', 'find', 'find', 'findOne', 'count']);

    for (let call = 0; call < 5; call++) {
      const seed = 5000 + shape * 31 + call * 17;
      // the same values for both instances, the generators are consumed in the same order
      const args = () => {
        const r = createRandom(seed);
        return [instantiate(condition, r), instantiate(options, r)] as [Dictionary, Dictionary];
      };
      const actual = await capture(cached, kind, ...args());
      const expected = await capture(plain, kind, ...args());
      const context = `shape ${shape}, call ${call}: ${kind} ${JSON.stringify(args())}`;
      expect(actual, context).toBe(expected);
      expect(queries(cachedLog), context).toEqual(queries(plainLog));
    }
  }

  expect(hits.mock.calls.length).toBeGreaterThan(300);
});
