import { defineRoutine, MikroORM, RoutineSchema, ScalarReference } from '@mikro-orm/sqlite';

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
});
