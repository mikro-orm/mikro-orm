import {
  defineEntity,
  MikroORM,
  p,
  RequestContext,
  TransactionContext,
  TransactionPropagation,
  UniqueConstraintViolationException,
} from '@mikro-orm/sqlite';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string().unique(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [User], dbName: ':memory:', allowGlobalContext: false });
  await orm.schema.create();
});

beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

describe.each([TransactionPropagation.NOT_SUPPORTED, TransactionPropagation.NEVER, TransactionPropagation.SUPPORTS])(
  '%s without an existing transaction',
  propagation => {
    test('resolves an existing repository to the callback fork across await', async () => {
      const repository = orm.em.getRepository(User);
      const result = await orm.em.transactional(
        async fork => {
          await Promise.resolve();
          const user = repository.create({ id: 1, name: 'created in the callback' });
          expect(repository.getEntityManager().getContext()).toBe(fork);
          expect(fork.isInTransaction()).toBe(false);
          return user;
        },
        { propagation },
      );

      expect(await orm.em.fork().findOneOrFail(User, 1)).toMatchObject({ name: result.name });
      expect(TransactionContext.getEntityManager()).toBeUndefined();
      expect(orm.em.getContext(false)).toBe(orm.em);
    });

    test.each([false, true])('restores a surrounding request context (callback fails: %s)', async fails => {
      const repository = orm.em.getRepository(User);
      const failure = new Error('callback failed');

      await RequestContext.create(orm.em, async () => {
        const parent = orm.em.getContext();
        const result = orm.em.transactional(
          async fork => {
            await Promise.resolve();
            repository.create({ id: 1, name: 'request user' });
            expect(repository.getEntityManager().getContext()).toBe(fork);
            expect(fork).not.toBe(parent);
            if (fails) {
              throw failure;
            }
            return 'done';
          },
          { propagation },
        );

        if (fails) {
          await expect(result).rejects.toBe(failure);
        } else {
          await expect(result).resolves.toBe('done');
        }
        expect(repository.getEntityManager().getContext()).toBe(parent);
        expect(TransactionContext.getEntityManager()).toBeUndefined();
      });

      expect(await orm.em.fork().count(User)).toBe(fails ? 0 : 1);
      expect(orm.em.getContext(false)).toBe(orm.em);
    });

    test('restores a surrounding request context when the automatic flush fails', async () => {
      await orm.em.fork().insert(User, { id: 1, name: 'duplicate' });
      const repository = orm.em.getRepository(User);

      await RequestContext.create(orm.em, async () => {
        const parent = orm.em.getContext();
        await expect(
          orm.em.transactional(
            async fork => {
              repository.create({ id: 2, name: 'duplicate' });
              expect(repository.getEntityManager().getContext()).toBe(fork);
            },
            { propagation },
          ),
        ).rejects.toThrow(UniqueConstraintViolationException);
        expect(repository.getEntityManager().getContext()).toBe(parent);
        expect(TransactionContext.getEntityManager()).toBeUndefined();
      });

      expect(await orm.em.fork().count(User)).toBe(1);
    });

    test('nested transactions resolve the repository to their fork and still roll back', async () => {
      const repository = orm.em.getRepository(User);
      const failure = new Error('rollback inner transaction');

      await orm.em.transactional(
        async outer => {
          await expect(
            orm.em.transactional(async inner => {
              expect(inner.isInTransaction()).toBe(true);
              expect(repository.getEntityManager().getContext()).toBe(inner);
              repository.create({ id: 1, name: 'rolled back' });
              await orm.em.flush();
              throw failure;
            }),
          ).rejects.toBe(failure);

          expect(repository.getEntityManager().getContext()).toBe(outer);
          expect(outer.isInTransaction()).toBe(false);
          repository.create({ id: 2, name: 'kept' });
        },
        { propagation },
      );

      expect(await orm.em.fork().findAll(User)).toMatchObject([{ id: 2, name: 'kept' }]);
      expect(TransactionContext.getEntityManager()).toBeUndefined();
    });

    test('keeps overlapping callbacks in separate contexts', async () => {
      const repository = orm.em.getRepository(User);
      let release!: () => void;
      const ready = new Promise<void>(resolve => {
        release = resolve;
      });
      let entered = 0;

      const users = await Promise.all(
        [1, 2].map(() =>
          orm.em.transactional(
            async fork => {
              if (++entered === 2) {
                release();
              }
              await ready;
              expect(repository.getEntityManager().getContext()).toBe(fork);
              return repository.getReference(1);
            },
            { propagation },
          ),
        ),
      );

      expect(users[0]).not.toBe(users[1]);
      expect(TransactionContext.getEntityManager()).toBeUndefined();
    });
  },
);

test.each([false, true])('NOT_SUPPORTED restores the outer transaction context (callback fails: %s)', async fails => {
  const repository = orm.em.getRepository(User);
  const failure = new Error('non-transactional callback failed');

  await orm.em.transactional(async outer => {
    const transaction = outer.getTransactionContext();
    const result = orm.em.transactional(
      async inner => {
        await Promise.resolve();
        expect(repository.getEntityManager().getContext()).toBe(inner);
        expect(inner.isInTransaction()).toBe(false);
        if (fails) {
          throw failure;
        }
      },
      { propagation: TransactionPropagation.NOT_SUPPORTED },
    );

    if (fails) {
      await expect(result).rejects.toBe(failure);
    } else {
      await result;
    }
    expect(repository.getEntityManager().getContext()).toBe(outer);
    expect(outer.getTransactionContext()).toBe(transaction);
    expect(outer.isInTransaction()).toBe(true);
    repository.create({ id: 1, name: 'outer transaction' });
  });

  expect(await orm.em.fork().count(User)).toBe(1);
  expect(TransactionContext.getEntityManager()).toBeUndefined();
});

describe('different ORM context names', () => {
  let other: MikroORM;

  beforeAll(async () => {
    other = await MikroORM.init({
      entities: [User],
      dbName: ':memory:',
      contextName: 'other',
      allowGlobalContext: false,
    });
    await other.schema.create();
  });

  beforeEach(() => other.schema.clear());
  afterAll(() => other.close(true));

  test.each([
    TransactionPropagation.NOT_SUPPORTED,
    TransactionPropagation.NEVER,
    TransactionPropagation.SUPPORTS,
    TransactionPropagation.NESTED,
  ])('%s keeps another ORM transaction accessible and its writes roll back', async propagation => {
    const repository = orm.em.getRepository(User);
    const otherRepository = other.em.getRepository(User);
    const failure = new Error('rollback outer transaction');

    await expect(
      orm.em.transactional(async outer => {
        const transaction = outer.getTransactionContext();
        await other.em.transactional(
          async inner => {
            await Promise.resolve();
            expect(repository.getEntityManager().getContext()).toBe(outer);
            expect(orm.em.getTransactionContext()).toBe(transaction);
            expect(otherRepository.getEntityManager().getContext()).toBe(inner);
            repository.create({ id: 1, name: 'rolled back' });
            await orm.em.flush();
            otherRepository.create({ id: 1, name: 'kept' });
          },
          { propagation },
        );

        expect(repository.getEntityManager().getContext()).toBe(outer);
        expect(TransactionContext.getEntityManager('other')).toBeUndefined();
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(await orm.em.fork().count(User)).toBe(0);
    expect(await other.em.fork().findAll(User)).toMatchObject([{ id: 1, name: 'kept' }]);
    expect(TransactionContext.getEntityManager()).toBeUndefined();
    expect(TransactionContext.getEntityManager('other')).toBeUndefined();
  });
});
