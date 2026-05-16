import { MikroORM } from '@mikro-orm/sqlite';
import { Routine } from '@mikro-orm/core';

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
    expect(Routine.is({ routineName: 'x' })).toBe(false);
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

  it('Configuration exposes registered routines by name', async () => {
    const HashUser = new Routine({
      name: 'hash_lookup',
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

    expect(orm.config.getRoutines()).toHaveLength(1);
    expect(orm.config.findRoutine('hash_lookup')).toBe(HashUser);
    expect(orm.config.findRoutine('does_not_exist')).toBeUndefined();

    await orm.close(true);
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
