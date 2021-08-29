import type {
  EntityManager,
  EventSubscriber,
  EventArgs,
  TransactionEventArgs,
  Transaction } from '@mikro-orm/core';
import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  UnitOfWork,
  Unique,
} from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { v4 as uuid } from 'uuid';

class UserSubscriber implements EventSubscriber {

  pendingActions = new Map<Transaction, (() => void | Promise<void>)[]>();

  async beforeTransactionStart(args: TransactionEventArgs) {
    //
  }

  async afterTransactionStart(args: TransactionEventArgs) {
    const { em } = args;
    this.pendingActions.set(em, []);
  }

  async afterTransactionCommit(args: TransactionEventArgs) {
    const { em } = args;
    const actions = this.pendingActions.get(em);
    if (actions) {
      for (const action of actions) {
        await action();
      }
    }
    this.pendingActions.delete(em);
  }

  async afterTransactionRollback(args: TransactionEventArgs) {
    const { em } = args;
    this.pendingActions.delete(em);
  }

  async afterCreate(args: EventArgs<any>) {
    const { em } = args;
    this.pendingActions.get(em)?.push(() => {
      this.afterCommitCreate(args);
    });
  }

  async afterCommitCreate(args: EventArgs<any>) {
    //
  }

}

describe('GH issue 1175', () => {
  let em: EntityManager;
  const testSubscriber = new UserSubscriber();
  const afterCreate = jest.spyOn(testSubscriber, 'afterCreate');
  const beforeTransactionStart = jest.spyOn(testSubscriber, 'beforeTransactionStart');
  const afterTransactionStart = jest.spyOn(testSubscriber, 'afterTransactionStart');
  const afterTransactionCommit = jest.spyOn(testSubscriber, 'afterTransactionCommit');
  const afterTransactionRollback = jest.spyOn(testSubscriber, 'afterTransactionRollback');
  const afterCommitCreate = jest.spyOn(testSubscriber, 'afterCommitCreate');

  afterEach(() => {
    beforeTransactionStart.mockClear();
    afterTransactionStart.mockClear();
    afterCreate.mockClear();
    afterTransactionCommit.mockClear();
    afterCommitCreate.mockClear();
    afterTransactionRollback.mockClear();
  });

  describe('sql', () => {
    @Entity({ tableName: 'users' })
    class User {

      @PrimaryKey()
      id!: number;

      @Property()
      readonly username: string;

      constructor(username: string) {
        this.username = username;
      }

    }

    async function getOrmInstance(subscriber?: EventSubscriber): Promise<MikroORM<PostgreSqlDriver>> {
      const orm = await MikroORM.init({
        entities: [User],
        dbName: 'mikro_orm_test_gh_1175',
        type: 'postgresql',
        subscribers: subscriber ? [subscriber] : [],
      });

      return orm as MikroORM<PostgreSqlDriver>;
    }

    let orm: MikroORM<PostgreSqlDriver>;

    beforeAll(async () => {
      orm = await getOrmInstance(testSubscriber);
      await orm.getSchemaGenerator().dropDatabase('mikro_orm_test_gh_1175');
      await orm.getSchemaGenerator().createDatabase('mikro_orm_test_gh_1175');
    });

    afterAll(async () => {
      await orm.close();
    });

    beforeEach(() => {
      em = orm.em.fork();
    });

    describe('immediate constraints (failures on insert)', () => {
      beforeAll(async () => {
        const orm = await getOrmInstance();
        await orm.em.getConnection().execute(
          `
            drop table if exists users;
            create table users (
              id serial primary key,
              username varchar(50) not null unique deferrable initially immediate
            );
            `,
        );
        await orm.close();
      });
      describe('implicit transactions', () => {
        let username: string;
        it('afterCommitCreate called when transaction succeeds', async () => {
          username = uuid();
          const user = new User(username);
          em.persist(user);

          await expect(em.flush()).resolves.toBeUndefined();
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledWith(expect.objectContaining({ em, uow: expect.any(UnitOfWork) }));
          expect(afterCommitCreate).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
          expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
        });
        it('afterCommitCreate not called when transaction fails', async () => {
          const user = new User(username);
          em.persist(user);

          await expect(em.flush()).rejects.toThrowError(
            /^insert.+duplicate key value/,
          );
          expect(afterCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
          expect(afterCommitCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
        });
      });

      describe('explicit transactions with "transactional()"', () => {
        let username: string;
        it('afterCommitCreate called when transaction succeeds', async () => {
          const work = em.transactional(async em => {
            username = uuid();
            const user = new User(username);
            em.persist(user);
          });

          await expect(work).resolves.toBeUndefined();
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
          expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
        });
        it('afterCommitCreate not called when transaction fails', async () => {
          const work = em.transactional(async em => {
            const user = new User(username);
            em.persist(user);
          });

          await expect(work).rejects.toThrowError(/^insert.+duplicate key value/);
          expect(afterCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
          expect(afterCommitCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
        });
        describe('nested transactions', () => {
          it('inner and outer afterCommitCreate called', async () => {
            let em1: EntityManager;
            let trx1: Transaction;
            const work = async () => {
              await em.transactional(async em => {
                em1 = em;
                trx1 = em.getTransactionContext();
                username = 'nested1';
                const user = new User(username);
                em.persist(user);
                await em.transactional(async em => {
                  username = 'nested2';
                  const user = new User(username);
                  em.persist(user);
                });
              });
            };
            await expect(work()).resolves.toBeUndefined();
            expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
            expect(beforeTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: undefined }));
            expect(afterTransactionStart).toHaveBeenCalledTimes(1);
            expect(afterTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCreate).toHaveBeenCalledTimes(2);
            expect(afterCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ entity: expect.objectContaining({ username: 'nested2' }) }));
            expect(afterCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({ entity: expect.objectContaining({ username: 'nested1' }) }));
            expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
            expect(afterTransactionCommit).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            // expect(afterCommitCreate).toHaveBeenCalledTimes(2); // called only for the root EM, so fires only one event
            expect(afterCommitCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ em: em1!, entity: expect.objectContaining({ username: 'nested1' }) }));
            // expect(afterCommitCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({ em: em1!, entity: expect.objectContaining({ username: 'nested2' }) }));
            expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
          });
          it('no afterCommitCreate called if inner transaction fails', async () => {
            const username = uuid();
            let em1: EntityManager;
            let trx1: Transaction;
            const work = async () => {
              await em.transactional(async em => {
                em1 = em;
                trx1 = em.getTransactionContext();
                const user = new User(username);
                em.persist(user);
                await em.transactional(async em => {
                  const user = new User(username);
                  em.persist(user);
                });
              });
            };
            await expect(work()).rejects.toThrowError(/^insert.+duplicate key value/);
            expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
            expect(beforeTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: undefined }));
            expect(afterTransactionStart).toHaveBeenCalledTimes(1);
            expect(afterTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCreate).toHaveBeenCalledTimes(1);
            expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
            expect(afterCommitCreate).toHaveBeenCalledTimes(0);
            expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
            expect(afterTransactionRollback).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
          });
          it('no afterCommitCreate called if outer transaction fails before running inner transaction', async () => {
            let em1: EntityManager;
            let trx1: Transaction;
            const work = async () => {
              await em.transactional(async em => {
                em1 = em;
                trx1 = em.getTransactionContext();
                const user = new User(username);
                em.persist(user);
                await em.flush();
                await em.transactional(async em => {
                  const user = new User(username);
                  em.persist(user);
                });
              });
            };
            await expect(work()).rejects.toThrowError(/^insert.+duplicate key value/);
            expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
            expect(beforeTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: undefined }));
            expect(afterTransactionStart).toHaveBeenCalledTimes(1);
            expect(afterTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCreate).toHaveBeenCalledTimes(0);
            expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
            expect(afterCommitCreate).toHaveBeenCalledTimes(0);
            expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
            expect(afterTransactionRollback).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
          });
          it('no afterCommitCreate called if outer transaction fails after running inner transaction', async () => {
            const username = uuid();
            let em1: EntityManager;
            let trx1: Transaction;
            const work = async () => {
              await em.transactional(async em => {
                em1 = em;
                trx1 = em.getTransactionContext();
                await em.transactional(async em => {
                  const user = new User(username);
                  em.persist(user);
                });
                const user = new User(username);
                em.persist(user);
              });
            };
            await expect(work()).rejects.toThrowError(/^insert.+duplicate key value/);
            expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
            expect(beforeTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: undefined }));
            expect(afterTransactionStart).toHaveBeenCalledTimes(1);
            expect(afterTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCreate).toHaveBeenCalledTimes(1);
            expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
            expect(afterCommitCreate).toHaveBeenCalledTimes(0);
            expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
            expect(afterTransactionRollback).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
          });
        });
      });

      describe('explicit transactions with explicit begin/commit method calls', () => {
        let username: string;
        it('creating a new user succeeds', async () => {
          await em.begin();
          username = uuid();
          const user = new User(username);
          em.persist(user);

          await expect(em.commit()).resolves.toBeUndefined();
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
          expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
        });
        it('afterCreate hook is called when commit() fails', async () => {
          await em.begin();
          const work = async () => {
            try {
              const user = new User(username);
              em.persist(user);
              await em.commit();
            } catch (error) {
              await em.rollback();
              throw error;
            }
          };

          await expect(work()).rejects.toThrowError(/^insert.+duplicate key value/);
          expect(afterCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
          expect(afterCommitCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('deferred constraints (failures on commit)', () => {
      beforeAll(async () => {
        const orm = await getOrmInstance();
        await orm.em.getConnection().execute(
          `
          drop table if exists users;
          create table users (
            id serial primary key,
            username varchar(50) not null unique deferrable initially deferred
          );
            `,
        );
        await orm.close();
      });

      describe('implicit transactions', () => {
        let username: string;
        it('creating a new user succeeds', async () => {
          username = uuid();
          const user = new User(username);
          em.persist(user);

          await expect(em.flush()).resolves.toBeUndefined();
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledWith(expect.objectContaining({ em, uow: expect.any(UnitOfWork) }));
          expect(afterCommitCreate).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
          expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
        });
        it('afterCreate hook is called when flush fails', async () => {
          const user = new User(username);
          em.persist(user);

          await expect(em.flush()).rejects.toThrowError(
            /^COMMIT.+duplicate key value/,
          );
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
          expect(afterCommitCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
        });
      });

      describe('explicit transactions with "transactional()"', () => {
        let username: string;
        it('creating a new user succeeds', async () => {
          const work = em.transactional(async em => {
            username = uuid();
            const user = new User(username);
            em.persist(user);
          });

          await expect(work).resolves.toBeUndefined();
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
          expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
        });
        it('afterCreate hook is called when transactional() fails', async () => {
          const work = async () => {
            await em.transactional(async em => {
              const user = new User(username);
              em.persist(user);
            });
          };

          await expect(work()).rejects.toThrowError(/^COMMIT.+duplicate key value/);
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
          expect(afterCommitCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
        });
        describe('nested transactions', () => {
          it('inner and outer afterCommitCreate called', async () => {
            let em1: EntityManager;
            let trx1: Transaction;
            const work = async () => {
              await em.transactional(async em => {
                em1 = em;
                trx1 = em.getTransactionContext();
                username = 'dnested1';
                const user = new User(username);
                em.persist(user);
                await em.transactional(async em => {
                  username = 'dnested2';
                  const user = new User(username);
                  em.persist(user);
                });
              });
            };
            await expect(work()).resolves.toBeUndefined();
            expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
            expect(beforeTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: undefined }));
            expect(afterTransactionStart).toHaveBeenCalledTimes(1);
            expect(afterTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCreate).toHaveBeenCalledTimes(2);
            expect(afterCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ entity: expect.objectContaining({ username: 'dnested2' }) }));
            expect(afterCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({ entity: expect.objectContaining({ username: 'dnested1' }) }));
            expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
            expect(afterTransactionCommit).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCommitCreate).toHaveBeenCalledTimes(1);
            expect(afterCommitCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ entity: expect.objectContaining({ username: 'dnested1' }) }));
            // expect(afterCommitCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({ entity: expect.objectContaining({ username: 'dnested2' }) }));
            expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
          });
          it('no afterCommitCreate called if inner transaction fails', async () => {
            const username = uuid();
            let em1: EntityManager;
            let trx1: Transaction;
            const work = async () => {
              await em.transactional(async em => {
                em1 = em;
                trx1 = em.getTransactionContext();
                const user = new User(username);
                em.persist(user);
                await em.transactional(async em => {
                  const user = new User(username);
                  em.persist(user);
                });
              });
            };
            await expect(work()).rejects.toThrowError(/^COMMIT.+duplicate key value/);
            expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
            expect(beforeTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: undefined }));
            expect(afterTransactionStart).toHaveBeenCalledTimes(1);
            expect(afterTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCreate).toHaveBeenCalledTimes(2);
            expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
            expect(afterCommitCreate).toHaveBeenCalledTimes(0);
            expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
            expect(afterTransactionRollback).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
          });
          it('no afterCommitCreate called if outer transaction fails before running inner transaction', async () => {
            let em1: EntityManager;
            let trx1: Transaction;
            const work = async () => {
              await em.transactional(async em => {
                em1 = em;
                trx1 = em.getTransactionContext();
                const user = new User(username);
                em.persist(user);
                await em.flush();
                await em.transactional(async em => {
                  const user = new User(username);
                  em.persist(user);
                });
              });
            };
            await expect(work()).rejects.toThrowError(/^COMMIT.+duplicate key value/);
            expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
            expect(beforeTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: undefined }));
            expect(afterTransactionStart).toHaveBeenCalledTimes(1);
            expect(afterTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCreate).toHaveBeenCalledTimes(2);
            expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
            expect(afterCommitCreate).toHaveBeenCalledTimes(0);
            expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
            expect(afterTransactionRollback).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
          });
          it('no afterCommitCreate called if outer transaction fails after running inner transaction', async () => {
            const username = uuid();
            let em1: EntityManager;
            let trx1: Transaction;
            const work = async () => {
              await em.transactional(async em => {
                em1 = em;
                trx1 = em.getTransactionContext();
                await em.transactional(async em => {
                  const user = new User(username);
                  em.persist(user);
                });
                const user = new User(username);
                em.persist(user);
              });
            };
            await expect(work()).rejects.toThrowError(/^COMMIT.+duplicate key value/);
            expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
            expect(beforeTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: undefined }));
            expect(afterTransactionStart).toHaveBeenCalledTimes(1);
            expect(afterTransactionStart).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
            expect(afterCreate).toHaveBeenCalledTimes(2);
            expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
            expect(afterCommitCreate).toHaveBeenCalledTimes(0);
            expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
            expect(afterTransactionRollback).toHaveBeenCalledWith(expect.objectContaining({ em: em1!, transaction: trx1 }));
          });
        });
      });

      describe('explicit transactions with explicit begin/commit/rollback method calls', () => {
        let username: string;
        it('creating a new user succeeds', async () => {
          await em.begin();
          username = uuid();
          const user = new User(username);
          em.persist(user);

          await expect(em.commit()).resolves.toBeUndefined();
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledTimes(1);
          expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
          expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
        });
        it('afterCreate hook is called when commit() fails', async () => {
          await em.begin();
          const work = async () => {
            try {
              const user = new User(username);
              em.persist(user);
              await em.commit();
            } catch (error) {
              await em.rollback();
              throw error;
            }
          };

          await expect(work()).rejects.toThrowError(/^COMMIT.+duplicate key value/);
          expect(afterCreate).toHaveBeenCalledTimes(1);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
          expect(afterCommitCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('mongo', () => {
    @Entity()
    class Entity1175 {

      @PrimaryKey()
      _id!: ObjectId;

      @Unique()
      @Property()
      readonly username: string;

      constructor(username: string) {
        this.username = username;
      }

    }

    let orm: MikroORM<MongoDriver>;

    beforeAll(async () => {
      orm = await MikroORM.init({
        entities: [Entity1175],
        clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs0',
        type: 'mongo',
        implicitTransactions: true,
        subscribers: [testSubscriber],
      });
      await orm.em.nativeDelete(Entity1175, {});
      await orm.em.nativeInsert(Entity1175, { username: 'test1' });
      await orm.em.getDriver().ensureIndexes();
    });

    afterAll(async () => {
      await orm.close();
    });

    beforeEach(() => {
      em = orm.em.fork();
    });

    describe('implicit transactions', () => {
      let username: string;
      it('afterCommitCreate called when transaction succeeds', async () => {
        username = uuid();
        const user = new Entity1175(username);
        em.persist(user);

        await expect(em.flush()).resolves.toBeUndefined();
        expect(afterCreate).toHaveBeenCalledTimes(1);
        expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
        expect(afterTransactionCommit).toHaveBeenCalledWith(expect.objectContaining({ em, uow: expect.any(UnitOfWork) }));
        expect(afterCommitCreate).toHaveBeenCalledTimes(1);
        expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
        expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
      });
      it('afterCommitCreate not called when transaction fails', async () => {
        const user = new Entity1175(username);
        em.persist(user);

        await expect(em.flush()).rejects.toThrowError(
          /^E11000 duplicate key error/,
        );
        expect(afterCreate).toHaveBeenCalledTimes(0);
        expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
        expect(afterCommitCreate).toHaveBeenCalledTimes(0);
        expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
      });
    });

    describe('explicit transactions with "transactional()"', () => {
      let username: string;
      it('afterCommitCreate called when transaction succeeds', async () => {
        const work = em.transactional(async em => {
          username = uuid();
          const user = new Entity1175(username);
          em.persist(user);
        });

        await expect(work).resolves.toBeUndefined();
        expect(afterCreate).toHaveBeenCalledTimes(1);
        expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
        expect(afterCommitCreate).toHaveBeenCalledTimes(1);
        expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
        expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
      });
      it('afterCommitCreate not called when transaction fails', async () => {
        const work = em.transactional(async em => {
          const user = new Entity1175(username);
          em.persist(user);
        });

        await expect(work).rejects.toThrowError(/^E11000 duplicate key error/);
        expect(afterCreate).toHaveBeenCalledTimes(0);
        expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
        expect(afterCommitCreate).toHaveBeenCalledTimes(0);
        expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
      });
      describe('nested transactions', () => {
        it('not allowed', async () => {
          const work = async () => {
            await em.transactional(async em => {
              username = 'nested1';
              const user = new Entity1175(username);
              em.persist(user);
              await em.transactional(async em => {
                username = 'nested2';
                const user = new Entity1175(username);
                em.persist(user);
              });
            });
          };
          await expect(work()).rejects.toThrowError(/Transaction already in progress/);
          expect(beforeTransactionStart).toHaveBeenCalledTimes(1);
          expect(afterCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
          expect(afterCommitCreate).toHaveBeenCalledTimes(0);
          expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('explicit transactions with explicit begin/commit method calls', () => {
      let username: string;
      it('creating a new user succeeds', async () => {
        await em.begin();
        username = uuid();
        const user = new Entity1175(username);
        em.persist(user);

        await expect(em.commit()).resolves.toBeUndefined();
        expect(afterCreate).toHaveBeenCalledTimes(1);
        expect(afterTransactionCommit).toHaveBeenCalledTimes(1);
        expect(afterCommitCreate).toHaveBeenCalledTimes(1);
        expect(afterCommitCreate).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ username }) }));
        expect(afterTransactionRollback).toHaveBeenCalledTimes(0);
      });
      it('afterCreate hook is called when commit() fails', async () => {
        await em.begin();
        const work = async () => {
          try {
            const user = new Entity1175(username);
            em.persist(user);
            await em.commit();
          } catch (error) {
            await em.rollback();
            throw error;
          }
        };

        await expect(work()).rejects.toThrowError(/^E11000 duplicate key error/);
        expect(afterCreate).toHaveBeenCalledTimes(0);
        expect(afterTransactionCommit).toHaveBeenCalledTimes(0);
        expect(afterCommitCreate).toHaveBeenCalledTimes(0);
        expect(afterTransactionRollback).toHaveBeenCalledTimes(1);
      });
    });
  });
});
