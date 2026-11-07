import { defineEntity, MikroORM, p } from '@mikro-orm/oracledb';

const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary().autoincrement(false),
    title: p.string(),
    createdAt: p.datetime().defaultRaw('current_timestamp'),
    version: p.datetime().version(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Article],
    dbName: 'mikro_orm_test_returning_datetime',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.refresh();
});

beforeEach(() => orm.schema.clear());

afterAll(() => orm.close(true));

async function expectReturnedMatchesStored(id: number, returned: { createdAt: Date; version: Date }) {
  const stored = await orm.em.fork().findOneOrFail(Article, id);
  expect(returned.createdAt.toISOString()).toBe(stored.createdAt.toISOString());
  expect(returned.version.toISOString()).toBe(stored.version.toISOString());
}

test('datetime values returned from insert keep fractional seconds', async () => {
  const em = orm.em.fork();
  const a = em.create(Article, { id: 1, title: 'a' });
  await em.flush();
  await expectReturnedMatchesStored(1, a);
});

test('datetime values returned from batch insert keep fractional seconds', async () => {
  const em = orm.em.fork();
  const a = em.create(Article, { id: 1, title: 'a' });
  const b = em.create(Article, { id: 2, title: 'b' });
  await em.flush();
  await expectReturnedMatchesStored(1, a);
  await expectReturnedMatchesStored(2, b);
});

test('datetime values returned from upsert keep fractional seconds', async () => {
  const a = await orm.em.fork().upsert(Article, { id: 1, title: 'a' });
  await expectReturnedMatchesStored(1, a);
});

test('datetime version returned from insert and update passes the optimistic lock check', async () => {
  const em = orm.em.fork();
  const a = em.create(Article, { id: 1, title: 'a' });
  await em.flush();
  a.title = 'b';
  await em.flush();
  await expectReturnedMatchesStored(1, a);
  a.title = 'c';
  await em.flush();
  await expectReturnedMatchesStored(1, a);
});
