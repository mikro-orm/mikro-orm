import { CacheAdapter, defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Foo = defineEntity({
  name: 'Foo',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const setCalls: string[] = [];

class RecordingAdapter implements CacheAdapter {
  get() {
    return undefined;
  }

  set(name: string): void {
    setCalls.push(name);
  }

  remove(): void {
    // no-op
  }

  clear(): void {
    // no-op
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Foo],
    dbName: ':memory:',
    resultCache: { adapter: RecordingAdapter, global: 100 },
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

beforeEach(() => {
  setCalls.length = 0;
});

test('GH #7644: single em.find writes the cache once', async () => {
  await orm.em.fork().find(Foo, {});
  expect(setCalls).toHaveLength(1);
});

test('GH #7644: single em.findOne writes the cache once', async () => {
  await orm.em.fork().findOne(Foo, { id: 1 });
  expect(setCalls).toHaveLength(1);
});
