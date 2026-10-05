import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// without RETURNING, each input is matched to its reloaded row by its own unique key, which can differ within a batch
const Slot = defineEntity({
  name: 'Slot',
  uniques: [{ properties: ['day', 'position'] }],
  properties: {
    id: p.integer().primary().autoincrement(),
    code: p.string().unique().nullable(),
    day: p.string(),
    position: p.integer(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Slot], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(false);
});

afterEach(() => vi.restoreAllMocks());
afterAll(() => orm.close(true));

async function expectReloaded(res: { id: number; name: string }[]) {
  const rows = await orm.em.fork().find(Slot, {}, { orderBy: { id: 'asc' } });
  expect([...res].sort((a, b) => a.id - b.id).map(e => [e.id, e.name])).toEqual(rows.map(e => [e.id, e.name]));
  expect(new Set(res.map(e => e.id)).size).toBe(res.length);
}

test('matches rows identified by different unique keys', async () => {
  const res = await orm.em.fork().upsertMany(Slot, [
    { code: 'a', day: '2026-01-01', position: 1, name: 'a' },
    { code: null, day: '2026-01-01', position: 2, name: 'b' },
    { code: 'c', day: '2026-01-02', position: 1, name: 'c' },
    { code: null, day: '2026-01-02', position: 2, name: 'd' },
  ]);

  expect(res.map(e => e.name)).toEqual(['a', 'b', 'c', 'd']);
  await expectReloaded(res);
});

test('matches rows identified by different unique keys when the composite key comes first', async () => {
  const res = await orm.em.fork().upsertMany(Slot, [
    { code: null, day: '2026-01-01', position: 2, name: 'b' },
    { code: 'a', day: '2026-01-01', position: 1, name: 'a' },
  ]);

  expect(res.map(e => e.name)).toEqual(['b', 'a']);
  await expectReloaded(res);
});

test('does not match a row to another one that has a null in the first unique key', async () => {
  await orm.em.fork().insertMany(Slot, [
    { code: null, day: '2025-12-31', position: 1, name: 'x' },
    { code: null, day: '2025-12-31', position: 2, name: 'y' },
  ]);
  const res = await orm.em.fork().upsertMany(Slot, [
    { code: 'a', day: '2026-01-01', position: 1, name: 'a' },
    { code: null, day: '2026-01-01', position: 2, name: 'b' },
  ]);

  expect(res.map(e => [e.day, e.name])).toEqual([
    ['2026-01-01', 'a'],
    ['2026-01-01', 'b'],
  ]);
  const rows = await orm.em.fork().find(Slot, { day: '2026-01-01' }, { orderBy: { id: 'asc' } });
  expect(res.map(e => e.id)).toEqual(rows.map(e => e.id));
});

test('matches rows identified by the primary key and by unique keys', async () => {
  const res = await orm.em.fork().upsertMany(Slot, [
    { id: 50, code: 'z', day: '2026-01-01', position: 1, name: 'z' },
    { code: 'a', day: '2026-01-01', position: 2, name: 'a' },
    { code: null, day: '2026-01-01', position: 3, name: 'b' },
  ]);

  expect(res.map(e => e.name)).toEqual(['z', 'a', 'b']);
  expect(res[0].id).toBe(50);
  await expectReloaded(res);
});

describe.each([true, false])('single row upsert (returning: %s)', returning => {
  const seed = [
    { code: null, day: '2025-12-31', position: 1, name: 'x' },
    { code: null, day: '2025-12-31', position: 2, name: 'y' },
    { code: 'k', day: '2025-12-31', position: 3, name: 'z' },
  ];
  const rows = {
    'the first unique key': { code: 'a', day: '2026-01-01', position: 1, name: 'new' },
    'the composite unique key': { code: null, day: '2026-01-01', position: 2, name: 'new' },
  };

  describe.each(Object.keys(rows) as (keyof typeof rows)[])('identified by %s', key => {
    test.each(['merge', 'ignore'] as const)('inserts a new row (%s)', async onConflictAction => {
      vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(returning);
      await orm.em.fork().insertMany(Slot, seed);

      const entity = await orm.em.fork().upsert(Slot, rows[key], { onConflictAction });

      const all = await orm.em.fork().find(Slot, {}, { orderBy: { id: 'asc' } });
      expect(all.map(e => e.name)).toEqual(['x', 'y', 'z', 'new']);
      expect([entity.id, entity.code, entity.position, entity.name]).toEqual([
        all[3].id,
        rows[key].code,
        rows[key].position,
        'new',
      ]);
    });

    test.each(['merge', 'ignore'] as const)('resolves an existing row (%s)', async onConflictAction => {
      vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(returning);
      await orm.em.fork().insertMany(Slot, [...seed, { ...rows[key], name: 'old' }]);

      const entity = await orm.em.fork().upsert(Slot, rows[key], { onConflictAction });

      const name = onConflictAction === 'merge' ? 'new' : 'old';
      const all = await orm.em.fork().find(Slot, {}, { orderBy: { id: 'asc' } });
      expect(all.map(e => e.name)).toEqual(['x', 'y', 'z', name]);
      expect([entity.id, entity.code, entity.position, entity.name]).toEqual([
        all[3].id,
        rows[key].code,
        rows[key].position,
        name,
      ]);
    });
  });
});
