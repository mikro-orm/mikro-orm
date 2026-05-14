import { Routine, MetadataValidator, RoutineMetadata } from '@mikro-orm/core';

describe('stored routines — metadata layer', () => {
  it('Routine produces a RoutineMetadata with declared params in order', () => {
    const HashUser = new Routine({
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

  it('applyConfig clears both params array and paramMap when re-applied (HMR safety)', () => {
    const meta = new RoutineMetadata().applyConfig({
      name: 'r',
      type: 'function',
      params: { old_param: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'SELECT 1',
    });
    expect(meta.params).toHaveLength(1);
    expect(meta.paramMap.old_param).toBeDefined();

    meta.applyConfig({
      name: 'r',
      type: 'function',
      params: { new_param: { type: 'integer' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'SELECT 1',
    });
    expect(meta.params).toHaveLength(1);
    expect(meta.paramMap.new_param).toBeDefined();
    expect((meta.paramMap as Record<string, unknown>).old_param).toBeUndefined();
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
    const meta = new Routine({
      name: 'ok_fn',
      type: 'function',
      params: { x: { type: 'int' } },
      returns: { runtimeType: 'number', columnType: 'int' },
      body: 'SELECT x',
    }).meta;

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).not.toThrow();
  });

  it('validator rejects routines that are missing the type option', () => {
    const meta = new RoutineMetadata({ className: 'NoType', routineName: 'no_type', body: 'select 1' });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).toThrow(/missing the required 'type' option/);
  });

  it('validator rejects routines with no body/expression/bodyJs', () => {
    const meta = new RoutineMetadata({ className: 'Empty', routineName: 'empty', type: 'function' });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).toThrow(/must define a 'body', 'expression', or 'bodyJs'/);
  });

  it('validator rejects params with an invalid direction string', () => {
    const meta = new RoutineMetadata({
      className: 'BadDir',
      routineName: 'bad_dir',
      type: 'procedure',
      body: 'BEGIN END',
    });
    meta.addParam({
      name: 'x' as any,
      type: 'int',
      runtimeType: 'number',
      columnTypes: ['int'],
      direction: 'sideways' as any,
      index: 0,
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(meta)).toThrow(/has invalid direction 'sideways'/);
  });
});
