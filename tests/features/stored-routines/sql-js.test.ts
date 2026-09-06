import { Routine, MikroORM } from '@mikro-orm/sql-js';

describe('stored routines — sql.js', () => {
  const HashUser = new Routine({
    name: 'sql_js_hash_user',
    type: 'function',
    params: { name: { type: 'string' }, salt: { type: 'string' } },
    returns: { runtimeType: 'string', columnType: 'text' },
    body: 'select name || salt',
    bodyJs: ({ name, salt }: { name: string; salt: string }) => `${name}::${salt}`,
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [],
      routines: [HashUser],
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(() => orm.close(true));

  it('em.callRoutine dispatches via a bodyJs UDF registered with create_function', async () => {
    expect(await orm.em.callRoutine(HashUser, { name: 'jon', salt: 'pepper' })).toBe('jon::pepper');
    // the second call reuses the registration, as the bodyJs reference did not change
    expect(await orm.em.callRoutine(HashUser, { name: 'arya', salt: 'salt' })).toBe('arya::salt');
  });

  it('a swapped bodyJs reference is re-registered', async () => {
    const Rebound = new Routine({
      name: 'sql_js_hash_user',
      type: 'function',
      params: { name: { type: 'string' }, salt: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select name || salt',
      bodyJs: ({ name, salt }: { name: string; salt: string }) => `${name}--${salt}`,
    });

    expect(await orm.em.getConnection().callRoutine(Rebound, { name: 'jon', salt: 'pepper' })).toBe('jon--pepper');
  });

  it('procedures throw, as SQLite has no procedure concept', async () => {
    const SomeProc = new Routine({
      name: 'sql_js_proc',
      type: 'procedure',
      params: {},
      body: 'select 1',
    });

    await expect(orm.em.getConnection().callRoutine(SomeProc, {})).rejects.toThrow(
      /Stored procedures are not supported on SQLite/,
    );
  });

  it('functions without a bodyJs fallback throw', async () => {
    const NoFallback = new Routine({
      name: 'sql_js_no_fallback',
      type: 'function',
      params: { x: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'select x',
    });

    await expect(orm.em.getConnection().callRoutine(NoFallback, { x: 'a' })).rejects.toThrow(
      /cannot be invoked on SQLite without a 'bodyJs' fallback/,
    );
  });
});
