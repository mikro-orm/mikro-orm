import { defineRoutine, MetadataValidator, RoutineMetadata, RoutineSchema } from '@mikro-orm/core';

describe('stored routines — metadata layer', () => {
  it('defineRoutine produces a RoutineMetadata with declared params in order', () => {
    const HashUser = defineRoutine({
      name: 'hash_user',
      type: 'function',
      params: {
        name: { type: 'string' },
        salt: { type: 'string' },
      },
      returns: { runtimeType: 'string', columnType: 'char(40)' },
      body: 'SELECT 1',
    });

    expect(HashUser.meta).toBeInstanceOf(RoutineMetadata);
    expect(HashUser.meta.routineName).toBe('hash_user');
    expect(HashUser.meta.type).toBe('function');
    expect(HashUser.meta.params).toHaveLength(2);
    expect(HashUser.meta.params[0].name).toBe('name');
    expect(HashUser.meta.params[1].name).toBe('salt');
    expect(HashUser.meta.params.every(p => p.direction === 'in')).toBe(true);
  });

  it('RoutineSchema and defineRoutine produce equivalent metadata for the same shape', () => {
    const a = defineRoutine({
      name: 'concat_two',
      type: 'function',
      params: { a: { type: 'string' }, b: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'SELECT a || b',
    }).meta;

    const b = new RoutineSchema({
      name: 'concat_two',
      type: 'function',
      params: { a: { type: 'string' }, b: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'SELECT a || b',
    }).meta;

    expect(a.routineName).toBe(b.routineName);
    expect(a.type).toBe(b.type);
    expect(a.params.map(p => p.name)).toEqual(b.params.map(p => p.name));
    expect(a.body).toBe(b.body);
  });

  it('validator rejects body + expression', () => {
    const meta = new RoutineMetadata({
      className: 'Bad',
      routineName: 'bad',
      type: 'function',
      body: 'SELECT 1',
      expression: 'CREATE FUNCTION bad() RETURNS int AS $$ SELECT 1 $$ LANGUAGE sql',
      returns: { type: 'int' } as any,
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).toThrow(/both 'body' and 'expression'/);
  });

  it('validator requires returns for functions', () => {
    const meta = new RoutineMetadata({
      className: 'NoReturns',
      routineName: 'no_returns',
      type: 'function',
      body: 'SELECT 1',
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).toThrow(/must declare a 'returns' option/);
  });

  it('validator rejects bodyJs on procedures', () => {
    const meta = new RoutineMetadata({
      className: 'NoJsProc',
      routineName: 'no_js_proc',
      type: 'procedure',
      body: 'BEGIN END',
      bodyJs: () => undefined,
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).toThrow(/bodyJs.*procedure/);
  });

  it('validator rejects out param without ref', () => {
    const meta = new RoutineMetadata({
      className: 'BadOut',
      routineName: 'bad_out',
      type: 'procedure',
      body: 'BEGIN END',
    });
    meta.addParam({
      name: 'inserted_id' as any,
      type: 'int',
      runtimeType: 'number',
      columnTypes: ['int'],
      direction: 'out',
      index: 0,
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).toThrow(/missing 'ref: true'/);
  });

  it('validator rejects non-IN params on functions', () => {
    const meta = new RoutineMetadata({
      className: 'BadFn',
      routineName: 'bad_fn',
      type: 'function',
      body: 'SELECT 1',
      returns: { type: 'int' } as any,
    });
    meta.addParam({
      name: 'x' as any,
      type: 'int',
      runtimeType: 'number',
      columnTypes: ['int'],
      direction: 'inout',
      ref: true,
      index: 0,
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).toThrow(/Functions only support IN parameters/);
  });

  it('validator accepts a well-formed function declaration', () => {
    const meta = defineRoutine({
      name: 'ok_fn',
      type: 'function',
      params: { x: { type: 'int' } },
      returns: { runtimeType: 'number', columnType: 'int' },
      body: 'SELECT x',
    }).meta;

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).not.toThrow();
  });
});
