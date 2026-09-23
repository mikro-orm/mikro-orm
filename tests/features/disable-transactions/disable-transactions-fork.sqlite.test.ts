import { defineEntity, MikroORM, p, TransactionPropagation } from '@mikro-orm/sqlite';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [User], dbName: ':memory:', disableTransactions: false });
  await orm.schema.create();
});

beforeEach(() => orm.schema.clear());
afterEach(() => vi.restoreAllMocks());
afterAll(() => orm.close(true));

test.each([false, true])('flush respects locally disabled transactions (inherited: %s)', async inherited => {
  const parent = orm.em.fork({ disableTransactions: true });
  const em = inherited ? parent.fork() : parent;
  const begin = vi.spyOn(em.getConnection(), 'begin');
  em.create(User, { id: 1, name: 'first' });
  em.create(User, { id: 2, name: 'second' });
  await em.flush();

  expect(begin).not.toHaveBeenCalled();
  expect(await orm.em.fork().count(User)).toBe(2);
});

test('local commit flushes changes without starting a transaction', async () => {
  const em = orm.em.fork({ disableTransactions: true });
  const begin = vi.spyOn(em.getConnection(), 'begin');
  const commit = vi.spyOn(em.getConnection(), 'commit');
  const rollback = vi.spyOn(em.getConnection(), 'rollback');
  await em.begin();
  em.create(User, { id: 1, name: 'first' });
  await em.commit();
  await em.rollback();

  expect(begin).not.toHaveBeenCalled();
  expect(commit).not.toHaveBeenCalled();
  expect(rollback).not.toHaveBeenCalled();
  expect(await orm.em.fork().count(User)).toBe(1);
});

test('disabling transactions on one fork leaves sibling forks transactional', async () => {
  const disabled = orm.em.fork({ disableTransactions: true });
  const sibling = orm.em.fork();
  const begin = vi.spyOn(disabled.getConnection(), 'begin');
  disabled.create(User, { id: 1, name: 'disabled' });
  await disabled.flush();
  sibling.create(User, { id: 2, name: 'sibling' });
  await sibling.flush();

  expect(begin).toHaveBeenCalledTimes(1);
  expect(orm.config.get('disableTransactions')).toBe(false);
  expect(await orm.em.fork().count(User)).toBe(2);
});

test('a child fork can explicitly re-enable transactions', async () => {
  const disabled = orm.em.fork({ disableTransactions: true });
  const enabled = disabled.fork({ disableTransactions: false });
  const begin = vi.spyOn(enabled.getConnection(), 'begin');
  enabled.create(User, { id: 1, name: 'enabled' });
  await enabled.flush();

  expect(begin).toHaveBeenCalledTimes(1);
  expect(await orm.em.fork().count(User)).toBe(1);
});

describe.each([TransactionPropagation.NOT_SUPPORTED, TransactionPropagation.NEVER, TransactionPropagation.SUPPORTS])(
  '%s without an ambient transaction',
  propagation => {
    test.each([false, true])('does not start transactions during flush (explicit: %s)', async explicit => {
      const em = orm.em.fork();
      const begin = vi.spyOn(em.getConnection(), 'begin');
      const commit = vi.spyOn(em.getConnection(), 'commit');
      await em.transactional(
        async fork => {
          expect(fork.isInTransaction()).toBe(false);
          fork.create(User, { id: 1, name: 'first' });
          if (explicit) {
            await fork.flush();
          }
          fork.create(User, { id: 2, name: 'second' });
        },
        { propagation, ignoreNestedTransactions: false },
      );

      expect(begin).not.toHaveBeenCalled();
      expect(commit).not.toHaveBeenCalled();
      expect(await em.fork().count(User)).toBe(2);
      expect(orm.config.get('disableTransactions')).toBe(false);
    });
  },
);
