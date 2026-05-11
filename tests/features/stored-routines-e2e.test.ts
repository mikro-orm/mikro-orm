import {
  convertRoutineInbound,
  convertRoutineOutbound,
  defineRoutine,
  MikroORM,
  RoutineSchema,
  ScalarReference,
  Type,
} from '@mikro-orm/sqlite';

class UpperCaseType extends Type<string, string> {
  override convertToDatabaseValue(value: string): string {
    return value.toUpperCase();
  }

  override convertToJSValue(value: string): string {
    return `<<${value}>>`;
  }
}

describe('stored routines — end-to-end via MikroORM.init', () => {
  const HashUser = defineRoutine({
    name: 'hash_user',
    type: 'function',
    params: { name: { type: 'string' }, salt: { type: 'string' } },
    returns: { runtimeType: 'string', columnType: 'text' },
    body: 'SELECT name || salt',
    bodyJs: ({ name, salt }: { name: string; salt: string }) => `${name}::${salt}`,
  });

  const Concat = new RoutineSchema({
    name: 'concat_two',
    type: 'function',
    params: { a: { type: 'string' }, b: { type: 'string' } },
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

  it('routines pass through MikroORM.init and reach MetadataStorage', () => {
    const meta = orm.getMetadata();
    expect(meta.getAllRoutines().size).toBe(2);
    expect(meta.findRoutine('hash_user')).toBeDefined();
    expect(meta.findRoutine('concat_two')).toBeDefined();
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

  it('em.callRoutine resolves defineRoutine declarations and dispatches via bodyJs', async () => {
    const result = await orm.em.callRoutine<string>(HashUser, { name: 'jon', salt: 'pepper' });
    expect(result).toBe('jon::pepper');
  });

  it('em.callRoutine resolves RoutineSchema declarations and dispatches via bodyJs', async () => {
    const result = await orm.em.callRoutine<string>(Concat, { a: 'foo', b: 'bar' });
    expect(result).toBe('foo-bar');
  });

  it('em.callRoutine throws clearly when called against an unregistered routine', async () => {
    const Unregistered = defineRoutine({
      name: 'never_registered',
      type: 'function',
      params: { x: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'SELECT x',
      bodyJs: ({ x }: { x: string }) => x,
    });

    await expect(orm.em.callRoutine(Unregistered, { x: 'a' })).rejects.toThrow(/Routine metadata not found/);
  });

  it('ScalarReference is exported from the sqlite package barrel', () => {
    expect(typeof ScalarReference).toBe('function');
  });

  describe('customType on routine params/return', () => {
    let orm2: MikroORM;

    const Echo = defineRoutine({
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
      const result = await orm2.em.callRoutine<string>(Echo, { input: 'jon' });
      // 'jon' -> convertToDatabaseValue('JON') -> bodyJs echoes 'JON' -> convertToJSValue('<<JON>>')
      expect(result).toBe('<<JON>>');
    });

    it('accepts customType as either an instance or a constructor', () => {
      const param = Echo.meta.params[0];
      expect(param.customType).toBeInstanceOf(UpperCaseType);
      expect(Echo.meta.returnCustomType).toBeInstanceOf(UpperCaseType);
    });

    it('skips conversion when no customType is declared (existing behaviour preserved)', async () => {
      // HashUser declares no customType — call it on the first orm where it is registered.
      const plain = await orm.em.callRoutine<string>(HashUser, { name: 'jon', salt: 'pepper' });
      expect(plain).toBe('jon::pepper');
    });

    it('short-circuits when the inbound value is null/undefined', () => {
      const platform = orm2.em.getPlatform();
      expect(convertRoutineInbound(null, Echo.meta.params[0], platform)).toBeNull();
      expect(convertRoutineInbound(undefined, Echo.meta.params[0], platform)).toBeNull();
    });

    it('short-circuits when there is no customType on the outbound side', () => {
      const platform = orm2.em.getPlatform();
      expect(convertRoutineOutbound('raw', undefined, platform)).toBe('raw');
      expect(convertRoutineOutbound(null, new UpperCaseType(), platform)).toBeNull();
    });
  });

  it('multi-result-set procedures throw a clear "not supported on SQLite" error', async () => {
    const MultiOnSqlite = defineRoutine({
      name: 'multi_on_sqlite',
      type: 'procedure',
      params: {},
      resultSets: 2,
      body: 'select 1; select 2;',
    });

    const orm3 = await MikroORM.init({
      dbName: ':memory:',
      entities: [],
      routines: [MultiOnSqlite],
      discovery: { warnWhenNoEntities: false },
    });

    await expect(orm3.em.callRoutine(MultiOnSqlite, {})).rejects.toThrow(
      /Stored procedures are not supported on SQLite/,
    );

    await orm3.close(true);
  });
});
