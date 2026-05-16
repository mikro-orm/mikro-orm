import { MikroORM } from '@mikro-orm/sqlite';
import { RoutineMetadata, Routine } from '@mikro-orm/core';

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
    expect(Routine.is({ meta: { className: 'x' } })).toBe(false);
    expect(Routine.is({})).toBe(false);
    expect(Routine.is(null)).toBe(false);
    expect(Routine.is(undefined)).toBe(false);
  });

  it('RoutineMetadata.fromConfig defaults uniqueName via routineName/schema/_id', () => {
    const meta = RoutineMetadata.fromConfig({
      name: 'foo',
      type: 'function',
      schema: 'public',
      body: 'select 1',
      returns: { runtimeType: 'string' },
    });

    expect(meta.uniqueName.startsWith('public.foo_')).toBe(true);

    const meta2 = RoutineMetadata.fromConfig({
      name: 'bar',
      type: 'function',
      body: 's',
      returns: { runtimeType: 'string' },
    });
    expect(meta2.uniqueName.startsWith('bar_')).toBe(true);
  });

  it('RoutineMetadata.fromConfig preserves param order via Object.keys', () => {
    const meta = RoutineMetadata.fromConfig({
      name: 'ordered',
      type: 'procedure',
      params: { z: { type: 'int' }, a: { type: 'int' }, m: { type: 'int' } },
      body: 'noop',
    });

    expect(meta.params.map(p => p.name)).toEqual(['z', 'a', 'm']);
  });

  it('createParamMappingObject returns identity map keyed by param name', () => {
    const meta = RoutineMetadata.fromConfig({
      name: 'map',
      type: 'function',
      params: { x: { type: 'int' }, y: { type: 'int' } },
      returns: { runtimeType: 'number' },
      body: 'select x + y',
    });

    expect(meta.createParamMappingObject()).toEqual({ x: 'x', y: 'y' });
  });
});
