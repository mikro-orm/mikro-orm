import { MikroORM } from '@mikro-orm/sqlite';
import { MetadataStorage, RoutineMetadata, Routine as RoutineClass } from '@mikro-orm/core';
import { Routine } from '@mikro-orm/decorators/legacy';

describe('stored routines — decorator + metadata edges', () => {
  @Routine<{ name: string; salt: string }>({
    name: 'hash_decor',
    type: 'function',
    params: { name: { type: 'string' }, salt: { type: 'string' } },
    returns: { runtimeType: 'string', columnType: 'text' },
    body: 'SELECT name || salt',
    bodyJs: ({ name, salt }) => `${name}@${salt}`,
  })
  class HashDecor {}

  @Routine<{ x: number }>({
    name: 'add_decor',
    type: 'procedure',
    params: { x: { type: 'int' } },
    body: 'INSERT INTO x (val) VALUES (x)',
  })
  class AddDecor {}

  it('@Routine class is discovered via the routines config option', async () => {
    const orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [],
      routines: [HashDecor, AddDecor],
      discovery: { warnWhenNoEntities: false },
    });

    const meta = orm.getMetadata();
    expect(meta.getAllRoutines().size).toBe(2);
    expect(meta.findRoutine('hash_decor')).toBeDefined();
    expect(meta.findRoutine('add_decor')).toBeDefined();

    const result = await orm.em.callRoutine<string>(HashDecor as any, { name: 'jon', salt: 'pep' });
    expect(result).toBe('jon@pep');

    await orm.close(true);
  });

  it('routines config rejects items that are neither Routine/Routine output nor @Routine classes', async () => {
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
    const a = new RoutineClass({
      name: 'dup_routine',
      type: 'function',
      params: { x: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select x',
      bodyJs: ({ x }: { x: string }) => x,
    });
    const b = new RoutineClass({
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

  it('Routine.is recognises both Routine instances and Routine outputs', () => {
    const a = new RoutineClass({
      name: 'a',
      type: 'function',
      returns: { runtimeType: 'string' },
      body: 'select 1',
    });
    const b = new RoutineClass({ name: 'b', type: 'function', returns: { runtimeType: 'string' }, body: 'select 1' });

    expect(RoutineClass.is(a)).toBe(true);
    expect(RoutineClass.is(b)).toBe(true);
    expect(RoutineClass.is({ meta: { className: 'x' } })).toBe(false);
    expect(RoutineClass.is({})).toBe(false);
    expect(RoutineClass.is(null)).toBe(false);
    expect(RoutineClass.is(undefined)).toBe(false);
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

  it('MetadataStorage.getRoutineMetadata lazy-creates entries for decorator path', () => {
    const before = Object.keys(MetadataStorage.getRoutineMetadata()).length;
    const meta = MetadataStorage.getRoutineMetadata('LazyRoutine', '/tmp/path');
    const after = Object.keys(MetadataStorage.getRoutineMetadata()).length;

    expect(meta).toBeInstanceOf(RoutineMetadata);
    expect(meta.className).toBe('LazyRoutine');
    expect(after).toBe(before + 1);

    // Idempotent: second lookup returns the same instance.
    const meta2 = MetadataStorage.getRoutineMetadata('LazyRoutine', '/tmp/path');
    expect(meta2).toBe(meta);
  });
});
