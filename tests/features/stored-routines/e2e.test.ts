import { MikroORM, Routine, ScalarReference, Type } from '@mikro-orm/sqlite';

class UpperCaseType extends Type<string, string> {
  override convertToDatabaseValue(value: string): string {
    return value.toUpperCase();
  }

  override convertToJSValue(value: string): string {
    return `<<${value}>>`;
  }
}

describe('stored routines — end-to-end via MikroORM.init', () => {
  const HashUser = new Routine({
    name: 'hash_user',
    type: 'function',
    params: {
      name: { type: 'string', runtimeType: 'string' },
      salt: { type: 'string', runtimeType: 'string' },
    },
    returns: { runtimeType: 'string', columnType: 'text' },
    body: 'SELECT name || salt',
    bodyJs: ({ name, salt }: { name: string; salt: string }) => `${name}::${salt}`,
  });

  const Concat = new Routine({
    name: 'concat_two',
    type: 'function',
    params: {
      a: { type: 'string', runtimeType: 'string' },
      b: { type: 'string', runtimeType: 'string' },
    },
    returns: { runtimeType: 'string', columnType: 'text' },
    body: 'SELECT a || b',
    bodyJs: ({ a, b }: { a: string; b: string }) => `${a}-${b}`,
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [],
      routines: [HashUser, Concat],
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(() => orm.close(true));

  it('routines pass through MikroORM.init and reach the Configuration', () => {
    expect(orm.config.getRoutines()).toEqual([HashUser, Concat]);
    expect(orm.config.hasRoutine(HashUser)).toBe(true);
    expect(orm.config.hasRoutine(Concat)).toBe(true);
  });

  it('schema generator silent-skips routines on sqlite (no DDL emitted)', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).not.toContain('hash_user');
    expect(sql).not.toContain('concat_two');
  });

  it('schema diff against an empty DB produces no routine churn on sqlite', async () => {
    await orm.schema.refresh();
    const diff = await orm.schema.getUpdateSchemaSQL();
    expect(diff).toBe('');
  });

  it('em.callRoutine resolves Routine instances and dispatches via bodyJs', async () => {
    const hashResult = await orm.em.callRoutine(HashUser, { name: 'jon', salt: 'pepper' });
    expect(hashResult).toBe('jon::pepper');

    const concatResult = await orm.em.callRoutine(Concat, { a: 'foo', b: 'bar' });
    expect(concatResult).toBe('foo-bar');
  });

  it('em.callRoutine throws clearly when called against an unregistered routine', async () => {
    const Unregistered = new Routine({
      name: 'never_registered',
      type: 'function',
      params: { x: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'SELECT x',
      bodyJs: ({ x }: { x: string }) => x,
    });

    await expect(orm.em.callRoutine(Unregistered, { x: 'a' })).rejects.toThrow(
      /'never_registered' is not registered in the 'routines' config option/,
    );
  });

  it('ScalarReference is exported from the sqlite package barrel', () => {
    expect(typeof ScalarReference).toBe('function');
  });

  describe('customType on routine params/return', () => {
    let orm2: MikroORM;

    const Echo = new Routine({
      name: 'echo_typed',
      type: 'function',
      params: { input: { type: 'text', customType: UpperCaseType } },
      returns: { runtimeType: 'string', columnType: 'text', customType: new UpperCaseType() },
      body: 'SELECT input',
      // bodyJs sees the value after convertToDatabaseValue (uppercase).
      bodyJs: ({ input }: { input: string }) => input,
    });

    beforeAll(async () => {
      orm2 = await MikroORM.init({
        dbName: ':memory:',
        entities: [],
        routines: [Echo],
        discovery: { warnWhenNoEntities: false },
      });
    });

    afterAll(() => orm2.close(true));

    it('marshals IN value through convertToDatabaseValue and scalar return through convertToJSValue', async () => {
      const result = await orm2.em.callRoutine(Echo, { input: 'jon' });
      // 'jon' -> convertToDatabaseValue('JON') -> bodyJs echoes 'JON' -> convertToJSValue('<<JON>>')
      expect(result).toBe('<<JON>>');
    });

    it('accepts customType as either an instance or a constructor', () => {
      const param = Echo.params[0];
      expect(param.customType).toBeInstanceOf(UpperCaseType);
      expect(Echo.returnCustomType).toBeInstanceOf(UpperCaseType);
    });

    it('skips conversion when no customType is declared (existing behaviour preserved)', async () => {
      // HashUser declares no customType — call it on the first orm where it is registered.
      const plain = await orm.em.callRoutine(HashUser, { name: 'jon', salt: 'pepper' });
      expect(plain).toBe('jon::pepper');
    });
  });

  it('procedures throw a clear "not supported on SQLite" error', async () => {
    const SomeProc = new Routine({
      name: 'some_proc',
      type: 'procedure',
      params: {},
      body: 'select 1; select 2;',
    });

    const orm3 = await MikroORM.init({
      dbName: ':memory:',
      entities: [],
      routines: [SomeProc],
      discovery: { warnWhenNoEntities: false },
    });

    await expect(orm3.em.callRoutine(SomeProc, {})).rejects.toThrow(/Stored procedures are not supported on SQLite/);

    await orm3.close(true);
  });

  it('functions without bodyJs throw a clear "no JS fallback" error on SQLite', async () => {
    const NoFallback = new Routine({
      name: 'no_fallback',
      type: 'function',
      params: { x: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select x',
    });

    const orm3 = await MikroORM.init({
      dbName: ':memory:',
      entities: [],
      routines: [NoFallback],
      discovery: { warnWhenNoEntities: false },
    });

    await expect(orm3.em.callRoutine(NoFallback, { x: 'a' })).rejects.toThrow(
      /cannot be invoked on SQLite without a 'bodyJs' fallback/,
    );

    await orm3.close(true);
  });
});
