import { MikroORM } from '@mikro-orm/sqlite';
import { Routine } from '@mikro-orm/decorators/es';

describe('stored routines — ES decorator path', () => {
  @Routine<{ name: string; salt: string }>({
    name: 'es_hash',
    type: 'function',
    params: { name: { type: 'string' }, salt: { type: 'string' } },
    returns: { runtimeType: 'string', columnType: 'text' },
    body: 'SELECT name || salt',
    bodyJs: ({ name, salt }) => `${name}~${salt}`,
  })
  class EsHash {}

  it('@Routine ES decorator registers metadata for the class', async () => {
    const orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [],
      routines: [EsHash as any],
      discovery: { warnWhenNoEntities: false },
    });

    const meta = orm.getMetadata();
    expect(meta.getAllRoutines().size).toBe(1);
    expect(meta.findRoutine('es_hash')).toBeDefined();

    const result = await orm.em.callRoutine<string>(EsHash as any, { name: 'jon', salt: 'pep' });
    expect(result).toBe('jon~pep');

    await orm.close(true);
  });
});
