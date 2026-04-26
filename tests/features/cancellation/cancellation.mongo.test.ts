import { defineEntity, MikroORM, ObjectId } from '@mikro-orm/mongodb';

const CancellationUser = defineEntity({
  name: 'CancellationUser',
  properties: p => ({
    _id: p.type(ObjectId).primary(),
    name: p.string(),
  }),
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [CancellationUser],
    dbName: 'mikro_orm_test_cancel_mongo',
    clientUrl: 'mongodb://localhost:27017',
    ensureIndexes: true,
  });
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  const fork = orm.em.fork();
  await fork.nativeDelete(CancellationUser, {});
  fork.create(CancellationUser, { name: 'a' });
  fork.create(CancellationUser, { name: 'b' });
  fork.create(CancellationUser, { name: 'c' });
  await fork.flush();
});

test('pre-aborted signal rejects em.find on mongo', async () => {
  const ac = new AbortController();
  ac.abort(new Error('mongo-aborted'));

  await expect(orm.em.fork().find(CancellationUser, {}, { signal: ac.signal })).rejects.toBeDefined();
});

test('fork-level signal applies to mongo find', async () => {
  const ac = new AbortController();
  ac.abort(new Error('fork-mongo'));

  await expect(orm.em.fork({ signal: ac.signal }).find(CancellationUser, {})).rejects.toBeDefined();
});

test('signal aborts mongo nativeUpdate', async () => {
  const ac = new AbortController();
  ac.abort(new Error('mongo-update'));

  await expect(
    orm.em.fork().nativeUpdate(CancellationUser, { name: 'a' }, { name: 'A' }, { signal: ac.signal }),
  ).rejects.toBeDefined();
});

test('signal aborts mongo nativeDelete', async () => {
  const ac = new AbortController();
  ac.abort(new Error('mongo-delete'));

  await expect(
    orm.em.fork().nativeDelete(CancellationUser, { name: 'a' }, { signal: ac.signal }),
  ).rejects.toBeDefined();
});
