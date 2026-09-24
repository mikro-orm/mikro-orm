import { defineEntity, MikroORM, p, SimpleLogger } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary().autoincrement(),
    key: p.string().unique(),
    name: p.string(),
    revision: p.integer().default(1),
  },
});

let orm: MikroORM;
const beforeUpsert = vi.fn();
const afterUpsert = vi.fn();

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
    upsertManaged: false,
    loggerFactory: SimpleLogger.create,
    subscribers: [{ beforeUpsert, afterUpsert }],
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.insert(User, { id: 1, key: 'managed', name: 'original' });
  beforeUpsert.mockClear();
  afterUpsert.mockClear();
});

afterEach(() => vi.restoreAllMocks());
afterAll(() => orm.close(true));

describe.each([true, false])('RETURNING supported: %s', returning => {
  beforeEach(() => {
    if (!returning) {
      vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(false);
    }
  });

  describe.each(['dto', 'entity'] as const)('%s inputs', input => {
    test.each([0, 1, 2])('preserves a managed row at index %s and its pending changes', async index => {
      const em = orm.em.fork();
      const managed = await em.findOneOrFail(User, 1);
      if (input === 'entity') {
        managed.name = 'pending';
      }
      const rows = [
        { id: 2, key: 'second', name: 'second', revision: 1 },
        { id: 3, key: 'third', name: 'third', revision: 1 },
      ];
      rows.splice(index, 0, { id: 1, key: 'managed', name: 'pending', revision: 1 });
      const entities =
        input === 'entity' ? rows.map(row => (row.id === 1 ? managed : em.create(User, row, { persist: false }))) : [];
      const result = input === 'dto' ? await em.upsertMany(User, rows) : await em.upsertMany(entities);

      expect(result.map(user => user.id)).toEqual(rows.map(row => row.id));
      expect(result[index]).toBe(managed);
      expect(managed.id).toBe(1);
      expect(managed.name).toBe('pending');
      if (input === 'entity') {
        result.forEach((user, i) => expect(user).toBe(entities[i]));
      }
      expect(beforeUpsert).toHaveBeenCalledTimes(2);
      expect(afterUpsert).toHaveBeenCalledTimes(2);
      expect(beforeUpsert.mock.calls.map(([args]) => args.entity.id)).not.toContain(1);
      expect(afterUpsert.mock.calls.map(([args]) => args.entity.id)).not.toContain(1);
      expect((await em.fork().findOneOrFail(User, 1)).name).toBe('original');

      await em.flush();
      expect(await em.fork().findAll(User, { orderBy: { id: 'asc' } })).toMatchObject([
        { id: 1, name: 'pending' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' },
      ]);
      const log = mockLogger(orm);
      await em.flush();
      expect(log).not.toHaveBeenCalled();
    });
  });

  test('hydrates generated primary keys and defaults only into SQL inputs', async () => {
    const em = orm.em.fork();
    const managed = await em.findOneOrFail(User, 1);
    const log = mockLogger(orm);
    const result = await em.upsertMany(User, [
      { id: 1, key: 'managed', name: 'pending' },
      { key: 'second', name: 'second' },
      { key: 'third', name: 'third' },
    ]);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(managed);
    expect(managed.id).toBe(1);
    expect(new Set(result.map(user => user.id)).size).toBe(3);
    expect(result.slice(1).every(user => user.id > 1)).toBe(true);
    expect(result.map(user => user.key)).toEqual(['managed', 'second', 'third']);
    expect(result.map(user => user.revision)).toEqual([1, 1, 1]);
    expect(log.mock.calls.filter(([query]) => /\bselect\b/.test(query))).toHaveLength(returning ? 0 : 1);
    expect((await em.fork().findOneOrFail(User, 1)).name).toBe('original');
    await em.flush();
    expect((await em.fork().findOneOrFail(User, 1)).name).toBe('pending');
    expect(await em.fork().findAll(User, { orderBy: { id: 'asc' } })).toMatchObject(result);
  });

  test.each(['ignore', 'where'] as const)('reloads only SQL inputs with conflict mode %s', async conflict => {
    const em = orm.em.fork();
    await em.insert(User, { id: 2, key: 'second', name: 'keep' });
    const managed = await em.findOneOrFail(User, 1);
    const result = await em.upsertMany(
      User,
      [
        { id: 1, key: 'managed', name: 'pending' },
        { id: 2, key: 'second', name: 'ignored' },
        { id: 3, key: 'third', name: 'third' },
      ],
      conflict === 'ignore' ? { onConflictAction: 'ignore' } : { onConflictWhere: { name: { $ne: 'keep' } } },
    );

    expect(result).toMatchObject([
      { id: 1, name: 'pending' },
      { id: 2, name: 'keep' },
      { id: 3, name: 'third' },
    ]);
    expect(result[0]).toBe(managed);
    await em.flush();
    expect(await em.fork().findAll(User, { orderBy: { id: 'asc' } })).toMatchObject(result);
  });
});

test.each(['dto', 'entity'] as const)('deduplicates repeated managed %s inputs without executing SQL', async input => {
  const em = orm.em.fork();
  const managed = await em.findOneOrFail(User, 1);
  managed.name = 'pending';
  const row = { id: 1, key: 'managed', name: 'pending' };
  const log = mockLogger(orm);
  const result = input === 'dto' ? await em.upsertMany(User, [row, row]) : await em.upsertMany([managed, managed]);

  expect(result).toEqual([managed]);
  expect(log).not.toHaveBeenCalled();
  expect(beforeUpsert).not.toHaveBeenCalled();
  expect(afterUpsert).not.toHaveBeenCalled();
  await em.flush();
  expect((await em.fork().findOneOrFail(User, 1)).name).toBe('pending');
});
