import { defineRoutine, MikroORM } from '@mikro-orm/libsql';

describe('stored routines — libSQL', () => {
  const HashUser = defineRoutine({
    name: 'libsql_hash_user',
    type: 'function',
    params: { name: { type: 'string' }, salt: { type: 'string' } },
    returns: { runtimeType: 'string', columnType: 'text' },
    body: 'select name || salt',
    bodyJs: ({ name, salt }: { name: string; salt: string }) => `${name}::${salt}`,
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [],
      routines: [HashUser],
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(() => orm.close(true));

  it('em.callRoutine throws with a clear message — libsql does not implement UDF registration', async () => {
    await expect(orm.em.callRoutine(HashUser, { name: 'jon', salt: 'pepper' })).rejects.toThrow(
      /Stored routines are not supported on libSQL/,
    );
  });
});
