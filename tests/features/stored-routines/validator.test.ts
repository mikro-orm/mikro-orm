import { JsonType, MetadataValidator, Routine, StringType } from '@mikro-orm/core';

describe('stored routines — Routine + validator', () => {
  it('Routine populates declared params in declaration order', () => {
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

    expect(HashUser.name).toBe('hash_user');
    expect(HashUser.type).toBe('function');
    expect(HashUser.params).toHaveLength(2);
    expect(HashUser.params[0].name).toBe('name');
    expect(HashUser.params[1].name).toBe('salt');
    expect(HashUser.params.every(p => p.direction === 'in')).toBe(true);
  });

  it('validator rejects body + expression', () => {
    const routine = new Routine({
      name: 'bad',
      type: 'function',
      body: 'SELECT 1',
      expression: 'CREATE FUNCTION bad() RETURNS int AS $$ SELECT 1 $$ LANGUAGE sql',
      returns: { runtimeType: 'number', columnType: 'int' },
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(/both 'body' and 'expression'/);
  });

  it('validator requires returns for functions', () => {
    const routine = new Routine({
      name: 'no_returns',
      type: 'function',
      body: 'SELECT 1',
    } as any);

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(/must declare a 'returns' option/);
  });

  it('validator rejects bodyJs on procedures', () => {
    const routine = new Routine({
      name: 'no_js_proc',
      type: 'procedure',
      body: 'BEGIN END',
      bodyJs: () => undefined,
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(/bodyJs.*procedure/);
  });

  it('validator rejects out param without ref', () => {
    const routine = new Routine({
      name: 'bad_out',
      type: 'procedure',
      params: { inserted_id: { type: 'int', runtimeType: 'number', direction: 'out' } },
      body: 'BEGIN END',
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(/missing 'ref: true'/);
  });

  it('validator rejects non-IN params on functions', () => {
    const routine = new Routine({
      name: 'bad_fn',
      type: 'function',
      params: { x: { type: 'int', runtimeType: 'number', direction: 'inout', ref: true } },
      returns: { runtimeType: 'number', columnType: 'int' },
      body: 'SELECT 1',
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(/Functions only support IN parameters/);
  });

  it('validator accepts a well-formed function declaration', () => {
    const routine = new Routine({
      name: 'ok_fn',
      type: 'function',
      params: { x: { type: 'int' } },
      returns: { runtimeType: 'number', columnType: 'int' },
      body: 'SELECT x',
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).not.toThrow();
  });

  it('validator rejects routines that are missing the type option', () => {
    const routine = new Routine({ name: 'no_type', body: 'select 1' } as any);

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(/missing the required 'type' option/);
  });

  it('validator rejects routines whose name is empty or whitespace', () => {
    const validator = new MetadataValidator();
    expect(() =>
      validator.validateRoutineDefinition(new Routine({ name: '', type: 'function', body: 'select 1' } as any)),
    ).toThrow(/missing the required 'name'/);
    expect(() =>
      validator.validateRoutineDefinition(new Routine({ name: '   ', type: 'function', body: 'select 1' } as any)),
    ).toThrow(/missing the required 'name'/);
  });

  it('validator rejects routines with no body/expression/bodyJs', () => {
    const routine = new Routine({ name: 'empty', type: 'function' } as any);

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(
      /must define a 'body', 'expression', or 'bodyJs'/,
    );
  });

  it('validator rejects ref: true on IN params', () => {
    const routine = new Routine({
      name: 'in_with_ref',
      type: 'procedure',
      params: { x: { type: 'int', runtimeType: 'number', ref: true } },
      body: 'BEGIN END',
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(/declares 'ref: true' on an IN parameter/);
  });

  it('validator rejects params with an invalid direction string', () => {
    const routine = new Routine({
      name: 'bad_dir',
      type: 'procedure',
      params: { x: { type: 'int', runtimeType: 'number', direction: 'sideways' as any } },
      body: 'BEGIN END',
    });

    const validator = new MetadataValidator();
    expect(() => validator.validateRoutineDefinition(routine)).toThrow(/has invalid direction 'sideways'/);
  });

  it('Routine accepts a Type class as `type` and wires it as the customType', () => {
    const r = new Routine({
      name: 'with_type_class',
      type: 'function',
      params: { p_payload: { type: JsonType } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select 1',
    });

    expect(r.params[0].customType).toBeInstanceOf(JsonType);
    expect(r.params[0].type).toBeInstanceOf(JsonType);
  });

  it('Routine accepts a Type instance as `type` and reuses it for customType', () => {
    const stringType = new StringType();
    const r = new Routine({
      name: 'with_type_instance',
      type: 'function',
      params: { p_name: { type: stringType } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select p_name',
    });

    expect(r.params[0].customType).toBe(stringType);
    expect(r.params[0].type).toBe(stringType);
  });
});
