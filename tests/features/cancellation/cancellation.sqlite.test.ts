import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class CancellationUser {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [CancellationUser],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.fork().insertMany(CancellationUser, [{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
});

test('pre-aborted signal rejects em.find', async () => {
  const ac = new AbortController();
  ac.abort(new Error('pre-aborted'));

  await expect(orm.em.fork().find(CancellationUser, {}, { signal: ac.signal })).rejects.toThrow('pre-aborted');
});

test('signal aborted before em.qb().execute() rejects', async () => {
  const ac = new AbortController();
  const em = orm.em.fork();
  const qb = em.qb(CancellationUser);
  qb.setAbortOptions({ signal: ac.signal });

  ac.abort(new Error('cancelled'));
  await expect(qb.execute()).rejects.toThrow('cancelled');
});

test('fork-level signal applies to find without per-call signal', async () => {
  const ac = new AbortController();
  ac.abort(new Error('fork-level'));
  const fork = orm.em.fork({ signal: ac.signal });

  await expect(fork.find(CancellationUser, {})).rejects.toThrow('fork-level');
});

test('fork-level signal does not leak to the parent EM', async () => {
  const ac = new AbortController();
  ac.abort(new Error('aborted-fork'));
  const fork = orm.em.fork({ signal: ac.signal });

  await expect(fork.find(CancellationUser, {})).rejects.toThrow('aborted-fork');
  // parent EM has no signal, this must succeed
  await expect(orm.em.fork().find(CancellationUser, {})).resolves.toHaveLength(3);
});

test('per-call signal overrides fork-level signal', async () => {
  const forkAc = new AbortController();
  forkAc.abort(new Error('fork-level'));
  const fork = orm.em.fork({ signal: forkAc.signal });

  const callAc = new AbortController();
  // not aborted — per-call wins because options.signal is set explicitly
  await expect(fork.find(CancellationUser, {}, { signal: callAc.signal })).resolves.toHaveLength(3);
});

test('signal aborts em.transactional and triggers rollback', async () => {
  const ac = new AbortController();
  ac.abort(new Error('tx-aborted'));

  await expect(
    orm.em.transactional(
      async em => {
        await em.find(CancellationUser, {});
      },
      { signal: ac.signal },
    ),
  ).rejects.toThrow('tx-aborted');

  // pre-existing rows remain — the failed transaction left no trace
  const fresh = orm.em.fork();
  await expect(fresh.count(CancellationUser)).resolves.toBe(3);
});

test('signal aborts em.insert', async () => {
  const ac = new AbortController();
  ac.abort(new Error('insert-aborted'));

  await expect(orm.em.fork().insert(CancellationUser, { name: 'x' }, { signal: ac.signal })).rejects.toThrow(
    'insert-aborted',
  );
});

test('signal aborts em.nativeUpdate', async () => {
  const ac = new AbortController();
  ac.abort(new Error('update-aborted'));

  await expect(
    orm.em.fork().nativeUpdate(CancellationUser, { name: 'a' }, { name: 'A' }, { signal: ac.signal }),
  ).rejects.toThrow('update-aborted');
});

test('signal aborts em.nativeDelete', async () => {
  const ac = new AbortController();
  ac.abort(new Error('delete-aborted'));

  await expect(orm.em.fork().nativeDelete(CancellationUser, { name: 'a' }, { signal: ac.signal })).rejects.toThrow(
    'delete-aborted',
  );
});

test('signal aborts em.count', async () => {
  const ac = new AbortController();
  ac.abort(new Error('count-aborted'));

  await expect(orm.em.fork().count(CancellationUser, {}, { signal: ac.signal })).rejects.toThrow('count-aborted');
});

test('signal aborts em.insertMany', async () => {
  const ac = new AbortController();
  ac.abort(new Error('insertMany-aborted'));

  await expect(
    orm.em.fork().insertMany(CancellationUser, [{ name: 'x' }, { name: 'y' }], { signal: ac.signal }),
  ).rejects.toThrow('insertMany-aborted');
});

test('signal aborts em.upsert', async () => {
  const ac = new AbortController();
  ac.abort(new Error('upsert-aborted'));

  await expect(orm.em.fork().upsert(CancellationUser, { id: 1, name: 'A' }, { signal: ac.signal })).rejects.toThrow(
    'upsert-aborted',
  );
});

test('signal aborts qb.stream()', async () => {
  const ac = new AbortController();
  ac.abort(new Error('stream-aborted'));
  const qb = orm.em.fork().qb(CancellationUser);
  qb.setAbortOptions({ signal: ac.signal });

  const consume = async () => {
    for await (const _ of qb.stream()) {
      // drain
    }
  };
  await expect(consume()).rejects.toThrow('stream-aborted');
});

test('signal aborts em.execute (raw SQL) via fork-level signal', async () => {
  const ac = new AbortController();
  ac.abort(new Error('raw-aborted'));

  await expect(orm.em.fork({ signal: ac.signal }).execute('select * from cancellation_user')).rejects.toThrow(
    'raw-aborted',
  );
});
