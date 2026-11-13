import * as sqlite from '@mikro-orm/sqlite';
import {
  defineEntity,
  LockMode,
  MikroORM,
  p,
  QueryBuilder,
  raw,
  ref,
  Type,
  type Dictionary,
  type EntityManager,
} from '@mikro-orm/sqlite';
import { CompiledQuery } from '../../../packages/core/src/utils/CompiledQueryCache.js';
import { mockLogger } from '../../helpers.js';

class UpperCaseType extends Type<string | null, string | null> {
  override convertToDatabaseValue(value: string | null): string | null {
    return value ? value.toUpperCase() : null;
  }

  override getColumnType(): string {
    return 'text';
  }
}

class TruthyType extends Type<string | null, number | null> {
  override convertToDatabaseValue(value: string | null): number | null {
    return value == null ? null : value ? 1 : 0;
  }

  override convertToJSValue(value: number | null): string | null {
    return value == null ? null : value ? 'yes' : '';
  }

  override getColumnType(): string {
    return 'integer';
  }
}

// ambient state read by a filter callback, like a clock or an async context would be
let clock = 0;
const minAge = (args: Dictionary) => ({ age: { $gte: args.min } });

const Address = defineEntity({
  name: 'Address',
  embeddable: true,
  properties: {
    city: p.string(),
    zip: p.string(),
  },
});

const Publisher = defineEntity({
  name: 'Publisher',
  properties: {
    id: p.bigint().primary(),
    name: p.string(),
  },
});

const Tag = defineEntity({
  name: 'Tag',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    age: p.integer().nullable(),
    born: p.date().nullable(),
    balance: p.decimal().nullable(),
    active: p.boolean(),
    code: p.type(UpperCaseType).nullable(),
    rank: p.type(TruthyType).nullable(),
    meta: p.json<{ level: number; label: string }>().nullable(),
    createdAt: p.datetime(),
    address: () => p.embedded(Address),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    price: p.double(),
    deletedAt: p.datetime().nullable(),
    author: () => p.manyToOne(Author),
    publisher: () => p.manyToOne(Publisher).nullable(),
    tags: () => p.manyToMany(Tag),
  },
  filters: {
    softDelete: { name: 'softDelete', cond: { deletedAt: null }, default: true },
    expensive: { name: 'expensive', cond: (args: Dictionary) => ({ price: { $gte: args.min } }), default: false },
    cheap: {
      name: 'cheap',
      cond: async (args: Dictionary) => (args.max % 2 ? { price: { $lte: args.max } } : {}),
      default: false,
    },
    recent: { name: 'recent', cond: () => ({ id: { $lt: clock } }), default: false, args: false },
    ownTitle: {
      name: 'ownTitle',
      cond: (args: Dictionary, type: string, em: EntityManager) => ({ title: { $ne: em.name + args.title } }),
      default: false,
    },
  },
});

let cached: MikroORM;
let plain: MikroORM;

async function init(enabled: boolean) {
  const orm = await MikroORM.init({
    entities: [Author, Book, Tag, Publisher, Address],
    dbName: ':memory:',
    compiledQueryCache: { enabled },
  });
  await orm.schema.create();
  const em = orm.em.fork();
  const tags = [1, 2, 3].map(id => em.create(Tag, { id, name: `tag ${id}` }));
  const publishers = [1n, 2n].map(id => em.create(Publisher, { id, name: `publisher ${id}` }));

  for (let i = 1; i <= 8; i++) {
    const author = em.create(Author, {
      id: i,
      name: `author ${i}`,
      age: i % 4 === 0 ? null : 20 + i,
      born: i % 3 === 0 ? null : `199${i}-0${i}-1${i}`,
      balance: `${i * 10}.50`,
      active: i % 2 === 0,
      code: i % 2 === 0 ? `code${i}` : null,
      rank: i % 2 ? 'yes' : '',
      meta: { level: i % 3, label: `label ${i % 2}` },
      createdAt: new Date(Date.UTC(2020, i, i)),
      address: { city: `city ${i % 3}`, zip: `${10000 + i}` },
    });

    for (let j = 1; j <= 3; j++) {
      em.create(Book, {
        id: i * 10 + j,
        title: `book ${i}/${j}`,
        price: i * j * 1.5,
        deletedAt: j === 3 ? new Date(Date.UTC(2021, 0, i)) : null,
        author,
        publisher: j === 1 ? null : publishers[(i + j) % 2],
        tags: tags.filter(tag => (i + j + tag.id) % 2 === 0),
      });
    }
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

type Scenario = (em: EntityManager, i: number) => Promise<unknown>;

/** Runs the scenario with and without the cache, compares the queries and results, returns the number of cache hits. */
async function run(scenario: Scenario, iterations = 6): Promise<number> {
  const cachedLog = mockLogger(cached);
  const plainLog = mockLogger(plain);
  // `bind()` also runs when a recording is built, only executions of the cached SQL are hits
  const hits = vi.spyOn(QueryBuilder.prototype, 'executeCompiled');
  // `findAndCount()` runs its two queries concurrently, so their order is not stable
  const queries = (mock: typeof cachedLog) =>
    mock.mock.calls
      .splice(0)
      .map(call => unpad(call[0].replace(/ \[took .*$/, '')))
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

async function capture(scenario: Scenario, orm: MikroORM, i: number): Promise<string> {
  try {
    return JSON.stringify(await scenario(orm.em.fork(), i));
  } catch (e) {
    return `error: ${(e as Error).message}`;
  }
}

const cacheable: Record<string, Scenario> = {
  'findOne by primary key': (em, i) => em.findOne(Author, i + 1),
  'findOne by multiple properties': (em, i) => em.findOne(Author, { id: i + 1, name: `author ${i + 1}` }),
  'findOne with populate': (em, i) => em.findOne(Author, { id: i + 1 }, { populate: ['books.tags'] }),
  'findOne with joined to-many populate': (em, i) =>
    em.findOne(Author, { name: `author ${i + 1}` }, { populate: ['books'], strategy: 'joined' }),
  'findOne without a match': (em, i) => em.findOne(Author, { id: 100 + i }),
  'find with operators': (em, i) =>
    em.find(Author, { age: { $gte: 20 + i, $lt: 30 }, name: { $like: `author ${i}%` }, id: { $ne: i } }),
  'find with $in': (em, i) => em.find(Author, { id: { $in: [i, i + 1, i + 2] } }, { orderBy: { id: 'desc' } }),
  'find with $in of varying length': (em, i) =>
    em.find(Author, { id: { $in: i % 2 ? [i, i + 1] : [i, i + 1, i + 2] } }),
  'find with empty $in': (em, i) => em.find(Author, { id: { $in: i % 2 ? [] : [i, i + 1] } }),
  'find with null and value': (em, i) => em.find(Author, { age: i % 2 ? null : 20 + i }),
  'find with booleans': (em, i) => em.find(Author, { active: i % 2 === 0, age: { $ne: null } }),
  'find with $and/$or/$not': (em, i) =>
    em.find(Author, {
      $and: [{ $or: [{ id: i }, { age: { $gt: 20 + i } }] }, { $not: { name: `author ${i + 2}` } }],
      $or: [{ active: true }, { id: { $lte: i + 3 } }],
    }),
  'find by to-one relation property': (em, i) => em.find(Book, { author: { age: { $gte: 20 + i } } }),
  'find by to-many relation property': (em, i) =>
    em.find(Author, { books: { title: { $like: `book ${i + 1}/%` }, tags: { name: `tag ${(i % 3) + 1}` } } }),
  'find by entity and reference': async (em, i) => [
    await em.find(Book, { author: em.getReference(Author, i + 1) }),
    await em.find(Book, { author: ref(em.getReference(Author, i + 1)) }),
    await em.find(Book, { author: i + 1 }),
  ],
  'find by embedded property': (em, i) =>
    em.find(Author, { address: { city: `city ${i % 3}`, zip: { $gt: '10003' } } }),
  'find by json property': (em, i) => em.find(Author, { meta: { level: i % 3, label: `label ${i % 2}` } }),
  'find by date, decimal and bigint': async (em, i) => [
    await em.find(Author, { born: { $gte: `199${i + 1}-01-01` }, balance: { $gte: `${i * 10}.25` } }),
    await em.find(Author, { createdAt: { $lt: new Date(Date.UTC(2020, i + 2, 1)) } }),
    await em.find(Book, { publisher: BigInt((i % 2) + 1) }),
    await em.find(Book, { publisher: { id: { $in: [1n, BigInt(i)] } } }),
  ],
  'find by custom type': (em, i) => em.find(Author, { code: `code${i + 1}` }),
  'find by custom type collapsing to null': (em, i) => em.find(Author, { code: i === 4 ? '' : `code${i + 1}` }),
  'find with limit and offset': (em, i) =>
    em.find(Author, { id: { $gt: i } }, { limit: 2 + (i % 2), offset: i + 1, orderBy: { name: 'asc' } }),
  'findAll with where': (em, i) => em.findAll(Author, { where: { id: { $gt: i } }, limit: 3 }),
  'find with zero and non-zero offset': (em, i) => em.find(Author, {}, { limit: 3, offset: i % 2 ? 0 : i }),
  'find with fields, exclude and populate': async (em, i) => [
    await em.find(Book, { id: { $gt: i * 10 } }, { fields: ['title', 'author.name'], limit: 3 }),
    await em.find(Author, { id: i + 1 }, { exclude: ['meta'], populate: ['books:ref'] }),
    await em.find(Book, { price: { $gt: i } }, { populate: ['author', 'publisher', 'tags'], strategy: 'select-in' }),
  ],
  'find with static filter': async (em, i) => [
    await em.find(Book, { author: i + 1 }),
    await em.find(Book, { author: i + 1 }, { filters: { softDelete: false } }),
    await em.find(Book, { author: i + 1 }, { filters: false }),
    await em.find(Author, { id: i + 1 }, { populate: ['books'], strategy: 'joined' }),
  ],
  'find with callback filter': (em, i) =>
    em.find(Book, { author: { $ne: null } }, { filters: { expensive: { min: i } } }),
  'find with async callback filter changing its shape': (em, i) =>
    em.find(Book, { id: { $gt: i } }, { filters: { cheap: { max: i } } }),
  'find with callback filter reading ambient state': (em, i) => {
    clock = 40 + i * 5;
    return em.find(Book, { id: { $gt: i } }, { filters: { recent: true } });
  },
  'find with callback filter on a joined relation': async (em, i) => [
    await em.find(
      Author,
      { id: { $gt: i } },
      { populate: ['books'], strategy: 'joined', filters: { expensive: { min: i } } },
    ),
    await em.find(Book, { id: { $gt: i } }, { populate: ['author.books'], filters: { expensive: { min: i } } }),
  ],
  'find with callback filter on a select-in relation': (em, i) =>
    em.find(
      Author,
      { id: { $gt: i } },
      { populate: ['books.tags'], strategy: 'select-in', filters: { expensive: { min: i } } },
    ),
  'count with callback filter': (em, i) => em.count(Book, { id: { $gt: i } }, { filters: { expensive: { min: i } } }),
  'findAndCount with paginated to-many join': (em, i) =>
    em.findAndCount(
      Author,
      { books: { price: { $gte: i } } },
      { populate: ['books'], strategy: 'joined', limit: 2, offset: i % 3, orderBy: { id: 'asc' } },
    ),
  count: async (em, i) => [
    await em.count(Author, { age: { $gte: 20 + i } }),
    await em.count(Book, { author: { name: `author ${i + 1}` }, tags: { id: (i % 3) + 1 } }),
    await em.count(Author),
  ],
};

const bypassed: Record<string, Scenario> = {
  'raw fragment as a key': (em, i) => em.find(Author, { [raw('lower(name)')]: `author ${i}` }),
  'raw fragment as a value': (em, i) => em.find(Author, { age: raw('? + 20', [i]) }),
  'callback filter reading the entity manager': (em, i) =>
    em.find(Book, { id: { $gt: i } }, { filters: { ownTitle: { title: ` ${i}` } } }),
  'callback filter without its arguments': (em, i) => em.find(Book, { id: { $gt: i } }, { filters: ['expensive'] }),
  '$in list over the size limit': (em, i) =>
    em.find(Author, { id: { $in: Array.from({ length: 600 }, (_, idx) => idx + i) } }),
  'long list that is not padded': (em, i) =>
    em.find(
      Author,
      Array.from({ length: 40 }, (_, idx) => idx + i),
    ),
  'pessimistic lock': (em, i) =>
    em.transactional(() => em.findOne(Author, { id: i + 1 }, { lockMode: LockMode.PESSIMISTIC_WRITE })),
  'cursor pagination': (em, i) => em.findByCursor(Author, { first: 2 + (i % 2), orderBy: { id: 'asc' } }),
  'populateWhere infer': (em, i) =>
    em.find(Author, { books: { title: `book ${i + 1}/1` } }, { populate: ['books'], populateWhere: 'infer' }),
  'result cache': (em, i) => em.find(Author, { id: i + 1 }, { cache: 50 }),
  'regular expression': (em, i) => em.find(Author, { name: new RegExp(`author ${i}`) }),
};

describe('compiled query cache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cached.config.set('compiledQueryCache', { enabled: true });

    for (const orm of [cached, plain]) {
      orm.config.set('loadStrategy', 'balanced');
    }
  });

  test.each(Object.keys(cacheable))('%s produces the same queries and hits the cache', async name => {
    await expect(run(cacheable[name])).resolves.toBeGreaterThan(0);
  });

  test.each(Object.keys(bypassed))('%s produces the same queries and bypasses the cache', async name => {
    await expect(run(bypassed[name])).resolves.toBe(0);
  });

  test('identity map lookups keep working on a cache hit', async () => {
    mockLogger(cached);
    const em = cached.em.fork();

    for (let i = 1; i <= 4; i++) {
      await cached.em.fork().findOne(Author, { id: i });
    }

    const a1 = await em.findOne(Author, { id: 5 });
    const mock = mockLogger(cached);
    const a2 = await em.findOne(Author, { id: 5 });
    expect(a2).toBe(a1);
    expect(mock).not.toHaveBeenCalled();
  });

  test('filters registered at runtime are not served from older entries', async () => {
    const scenario: Scenario = (em, i) => em.find(Author, { id: { $gt: i } });
    await expect(run(scenario)).resolves.toBeGreaterThan(0);

    const withFilter: Scenario = (em, i) => {
      em.addFilter({ name: 'adults', cond: { age: { $gte: 25 } }, entity: Author });
      return em.find(Author, { id: { $gt: i } });
    };
    await expect(run(withFilter)).resolves.toBeGreaterThan(0);
  });

  test('filter params are passed to the callback on every call', async () => {
    const scenario: Scenario = (em, i) => {
      em.addFilter({ name: 'minAge', cond: minAge, entity: Author });
      em.setFilterParams('minAge', { min: 21 + i });

      return em.find(Author, { active: true }, { populate: ['books'] });
    };
    await expect(run(scenario)).resolves.toBeGreaterThan(0);
  });

  test('filter callbacks on a joined relation run once per call on a cache hit', async () => {
    // verify mode compiles every hit again, which invokes the callbacks too
    cached.config.set('compiledQueryCache', { enabled: true, verify: false });
    let calls = 0;
    const cond = (args: Dictionary) => {
      calls++;
      return { price: { $gte: args.min } };
    };
    const find = (i: number) => {
      const em = cached.em.fork();
      em.addFilter({ name: 'counted', cond, entity: Book, default: false });
      em.setFilterParams('counted', { min: i });

      return em.find(Author, { id: { $gt: i } }, { populate: ['books'], strategy: 'joined', filters: ['counted'] });
    };

    // the second call records the compiled query, invoking the callbacks again
    await find(0);
    await find(1);
    calls = 0;
    const bind = vi.spyOn(CompiledQuery.prototype, 'bind');

    for (let i = 2; i < 6; i++) {
      await find(i);
    }

    expect(bind).toHaveBeenCalledTimes(4);
    bind.mockRestore();
    expect(calls).toBe(4);
  });

  test('$in lists are padded to share the compiled query', async () => {
    cached.config.getCompiledQueryCache()!.clear();
    const scenario: Scenario = (em, i) =>
      em.find(Author, { id: { $in: Array.from({ length: 5 + (i % 4) }, (_, idx) => idx + i) } });
    await expect(run(scenario, 8)).resolves.toBeGreaterThan(5);
    expect(cached.config.getCompiledQueryCache()!.size).toBe(1);

    const mock = mockLogger(cached);
    const where = { id: { $in: [1, 2, 3] }, name: { $nin: ['a', 'b', 'c'] } };
    await cached.em.fork().find(Author, where);
    expect(mock.mock.calls[0][0]).toMatch("in (1, 2, 3, 3) and `a0`.`name` not in ('a', 'b', 'c', 'c')");
    expect(where).toEqual({ id: { $in: [1, 2, 3] }, name: { $nin: ['a', 'b', 'c'] } });
  });

  test('custom type mapping values to a constant of the query is not cached', async () => {
    // both `'yes'` and the placeholder convert to 1, the same value as the `limit 1` of `findOne()`
    await expect(
      run((em, i) => em.findOne(Author, { rank: i < 3 ? 'yes' : '' }, { orderBy: { id: 'asc' } })),
    ).resolves.toBe(0);
  });

  test('names containing the separators of the key do not share the compiled query', async () => {
    const scenario: Scenario = (em, i) =>
      em.find(Author, { meta: i % 2 ? { 'level:n,label': 'label 1' } : { level: i % 3, label: 'label 0' } } as any);
    await expect(run(scenario, 8)).resolves.toBeGreaterThan(0);
  });

  test('changing the configuration drops the compiled queries', async () => {
    const scenario: Scenario = (em, i) => em.find(Book, { id: { $gt: i } }, { populate: ['author'], limit: 2 });
    await expect(run(scenario)).resolves.toBeGreaterThan(0);

    for (const orm of [cached, plain]) {
      orm.config.set('loadStrategy', 'select-in');
    }

    await expect(run(scenario)).resolves.toBeGreaterThan(0);
  });

  test('resetting an option drops the compiled queries', async () => {
    await run((em, i) => em.find(Book, { id: { $gt: i } }, { limit: 2 }));
    expect(cached.config.getCompiledQueryCache()!.size).toBeGreaterThan(0);
    cached.config.reset('loadStrategy');
    expect(cached.config.getCompiledQueryCache()!.size).toBe(0);
  });

  test('the internals of the cache are not exported', () => {
    // the drivers re-export kysely too, which has its own `CompiledQuery`
    expect(sqlite).not.toHaveProperty('CompiledQuery');
    expect(sqlite).not.toHaveProperty('CompiledQueryCache');
  });

  test('compiled queries do not keep the logger context of the call they were recorded for', async () => {
    const qbs: QueryBuilder<any>[] = [];
    const setCompilation = QueryBuilder.prototype.setCompilation;
    vi.spyOn(QueryBuilder.prototype, 'setCompilation').mockImplementation(function (this: QueryBuilder<any>, c) {
      if (c?.dry) {
        qbs.push(this);
      }

      setCompilation.call(this, c);
    });
    cached.config.set('compiledQueryCache', { enabled: true, verify: false });
    const user = { name: 'request scoped' };

    for (let i = 0; i < 3; i++) {
      await cached.em.fork({ loggerContext: { user } }).find(Author, { id: i, name: { $ne: 'logger context' } });
    }

    expect(qbs).toHaveLength(1);
    expect(qbs[0].getLoggerContext()).not.toHaveProperty('user');
  });

  test('verify mode compiles every cached query again', async () => {
    cached.config.set('compiledQueryCache', { enabled: true, size: 10, verify: true });
    await expect(run((em, i) => em.findAndCount(Author, { id: { $gte: i } }, { limit: 3 }))).resolves.toBeGreaterThan(
      0,
    );
    const cache = cached.config.getCompiledQueryCache()!;
    expect(cache.verify).toBe(true);

    // the oldest shapes are evicted once the cache is full
    for (let i = 1; i <= 30; i++) {
      await cached.em.fork().find(Author, { $or: Array.from({ length: i }, (_, id) => ({ id })) });
    }

    expect(cache.size).toBe(10);
  });
});
