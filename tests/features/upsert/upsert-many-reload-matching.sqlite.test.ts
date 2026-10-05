import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// Without RETURNING support, `upsertMany` reloads the rows and matches each input to its row. A date key is not
// compared with `!==`, so it takes the path that compares every reloaded row instead of grouping by value.
const Event = defineEntity({
  name: 'Event',
  properties: {
    id: p.integer().primary().autoincrement(),
    day: p.datetime().unique(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Event], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(false);
});

afterEach(() => vi.restoreAllMocks());
afterAll(() => orm.close(true));

test('matches rows on a date unique key', async () => {
  const res = await orm.em.fork().upsertMany(Event, [
    { day: new Date('2026-01-01T00:00:00.000Z'), name: 'a' },
    { day: new Date('2026-01-02T00:00:00.000Z'), name: 'b' },
    { day: new Date('2026-01-03T00:00:00.000Z'), name: 'c' },
  ]);

  const rows = await orm.em.fork().find(Event, {}, { orderBy: { id: 'asc' } });
  expect(rows.map(e => [e.id, e.name])).toEqual(res.map(e => [e.id, e.name]));
});
