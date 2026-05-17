import { MikroORM, SqliteDriver } from '@mikro-orm/sqlite';
import { Configuration, Routine } from '@mikro-orm/core';

describe('stored routines — metadata edges', () => {
  it('routines config rejects items that are not Routine instances', async () => {
    class PlainClass {}

    await expect(
      MikroORM.init({
        dbName: ':memory:',
        entities: [],
        routines: [PlainClass as any],
        discovery: { warnWhenNoEntities: false },
      }),
    ).rejects.toThrow(/not a stored routine declaration/);
  });

  it('rejects duplicate routine names at discovery (instead of silently overwriting)', async () => {
    const a = new Routine({
      name: 'dup_routine',
      type: 'function',
      params: { x: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select x',
      bodyJs: ({ x }: { x: string }) => x,
    });
    const b = new Routine({
      name: 'dup_routine',
      type: 'function',
      params: { y: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select y',
      bodyJs: ({ y }: { y: string }) => y,
    });

    await expect(
      MikroORM.init({
        dbName: ':memory:',
        entities: [],
        routines: [a, b],
        discovery: { warnWhenNoEntities: false },
      }),
    ).rejects.toThrow(/Duplicate routine 'dup_routine'/);
  });

  it('rejects routine names that collide case-insensitively (matches schema comparator folding)', async () => {
    const a = new Routine({
      name: 'Sql_Hash',
      type: 'function',
      params: { x: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select x',
      bodyJs: ({ x }: { x: string }) => x,
    });
    const b = new Routine({
      name: 'sql_hash',
      type: 'function',
      params: { y: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select y',
      bodyJs: ({ y }: { y: string }) => y,
    });

    await expect(
      MikroORM.init({
        dbName: ':memory:',
        entities: [],
        routines: [a, b],
        discovery: { warnWhenNoEntities: false },
      }),
    ).rejects.toThrow(/Duplicate routine 'sql_hash'/);
  });

  it('Routine.is recognises Routine instances', () => {
    const a = new Routine({
      name: 'a',
      type: 'function',
      returns: { runtimeType: 'string' },
      body: 'select 1',
    });
    const b = new Routine({ name: 'b', type: 'function', returns: { runtimeType: 'string' }, body: 'select 1' });

    expect(Routine.is(a)).toBe(true);
    expect(Routine.is(b)).toBe(true);
    expect(Routine.is({ name: 'x' })).toBe(false);
    expect(Routine.is({})).toBe(false);
    expect(Routine.is(null)).toBe(false);
    expect(Routine.is(undefined)).toBe(false);
  });

  it('Routine preserves param order via Object.keys', () => {
    const routine = new Routine({
      name: 'ordered',
      type: 'procedure',
      params: { z: { type: 'int' }, a: { type: 'int' }, m: { type: 'int' } },
      body: 'noop',
    });

    expect(routine.params.map(p => p.name)).toEqual(['z', 'a', 'm']);
  });

  it('Configuration registers routines by reference for membership checks', async () => {
    const HashUser = new Routine({
      name: 'hash_lookup',
      type: 'function',
      body: 'select 1',
      returns: { runtimeType: 'string' },
    });
    const NotRegistered = new Routine({
      name: 'not_registered',
      type: 'function',
      body: 'select 1',
      returns: { runtimeType: 'string' },
    });

    const orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [],
      routines: [HashUser],
      discovery: { warnWhenNoEntities: false },
    });

    expect(orm.config.getRoutines()).toEqual([HashUser]);
    expect(orm.config.hasRoutine(HashUser)).toBe(true);
    expect(orm.config.hasRoutine(NotRegistered)).toBe(false);

    await orm.close(true);
  });

  it('a failed validation does not partially populate the routine list (no duplicates on retry)', () => {
    const good = new Routine({
      name: 'good_routine',
      type: 'function',
      body: 'select 1',
      returns: { runtimeType: 'number' },
    });
    const bad = new Routine({ name: 'bad_routine', type: 'function' } as any);

    const config = new Configuration(
      {
        driver: SqliteDriver,
        dbName: ':memory:',
        entities: [],
        routines: [good, bad],
        discovery: { warnWhenNoEntities: false },
      },
      false,
    );

    // Without the staged collection, the second call would surface a "Duplicate routine 'good_routine'"
    // error because `good` had been pushed before `bad` failed validation. With the fix, the same
    // validation error keeps surfacing on every retry until the user fixes the offending entry.
    expect(() => config.getRoutines()).toThrow(/must define a 'body', 'expression', or 'bodyJs'/);
    expect(() => config.getRoutines()).toThrow(/must define a 'body', 'expression', or 'bodyJs'/);
  });

  it('createParamMappingObject returns identity map keyed by param name', () => {
    const routine = new Routine({
      name: 'map',
      type: 'function',
      params: { x: { type: 'int' }, y: { type: 'int' } },
      returns: { runtimeType: 'number' },
      body: 'select x + y',
    });

    expect(routine.createParamMappingObject()).toEqual({ x: 'x', y: 'y' });
  });
});
