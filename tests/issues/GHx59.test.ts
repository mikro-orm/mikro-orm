import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// GHSA-7j79-7q93-6v69: the orderBy field/key is validated against entity metadata, but the
// order direction was concatenated into the SQL `ORDER BY` clause after a bare `toLowerCase()`,
// with no allow-listing. A request-derived direction (`orderBy: { [field]: req.query.dir }`)
// therefore allowed ORDER BY SQL injection. The direction must now be validated.
const Account = defineEntity({
  name: 'Account',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    apiKey: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Account],
    dbName: ':memory:',
  });
  await orm.schema.create();
  const em = orm.em.fork();
  em.create(Account, { id: 1, name: 'alice', apiKey: 'sk_TOPSECRET' });
  em.create(Account, { id: 2, name: 'bob', apiKey: 'sk_other' });
  em.create(Account, { id: 3, name: 'carol', apiKey: 'sk_other' });
  await em.flush();
});

afterAll(async () => orm.close(true));

const findOrdered = (field: string, dir: string) =>
  orm.em.fork().find(Account, {}, { orderBy: { [field]: dir } as any });

test('rejects an injected SQL fragment as the order direction', async () => {
  await expect(findOrdered('id', 'asc, (select max(api_key) from account)')).rejects.toThrow(/Invalid order direction/);
});

test('rejects a blind-extraction payload as the order direction', async () => {
  const dir =
    '* 0, (case when unicode(substr((select api_key from account where id = 1), 1, 1)) = 115 ' +
    'then a0.id else 0 - a0.id end) asc';
  await expect(findOrdered('id', dir)).rejects.toThrow(/Invalid order direction/);
});

test('still accepts all legitimate direction values', async () => {
  await expect(findOrdered('id', 'asc')).resolves.toHaveLength(3);
  await expect(findOrdered('id', 'DESC')).resolves.toHaveLength(3);
  await expect(findOrdered('id', 'asc nulls last')).resolves.toHaveLength(3);
  await expect(findOrdered('id', 'DESC NULLS FIRST')).resolves.toHaveLength(3);
  await expect(orm.em.fork().find(Account, {}, { orderBy: { id: 1 } })).resolves.toHaveLength(3);
  await expect(orm.em.fork().find(Account, {}, { orderBy: { id: -1 } })).resolves.toHaveLength(3);
});
