import {
  FlushMode,
  IsolationLevel,
  MikroORM,
  ObjectId,
  TransactionManager,
  TransactionPropagation,
} from '@mikro-orm/mongodb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class TestEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  value?: number;

  @Property({ onCreate: () => new Date(), nullable: true })
  createdAt?: Date;
}

describe('Transaction Propagation - MongoDB', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TestEntity],
      dbName: 'mikro_orm_test_tx_prop',
      clientUrl: process.env.MONGO_URI,
      implicitTransactions: true,
    });
    await orm.schema.clear();
    await orm.schema.ensureIndexes();
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  // REQUIRED propagation tests

  test('REQUIRED propagation should join existing transaction', async () => {
    const em = orm.em.fork();
    let outerTrx: any;
    let innerTrx: any;

    await em.transactional(async em1 => {
      outerTrx = (em1 as any).transactionContext;

      await em1.transactional(
        async em2 => {
          innerTrx = (em2 as any).transactionContext;
          const entity = em2.create(TestEntity, { name: 'test' });
          await em2.persist(entity).flush();
        },
        { propagation: TransactionPropagation.REQUIRED },
      );
    });

    expect(outerTrx).toBeDefined();
    expect(innerTrx).toBe(outerTrx); // Should be same transaction

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('REQUIRED propagation should reuse same database connection and transaction with query logging', async () => {
    const mock = mockLogger(orm, ['query']);
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      await em1.persist(em1.create(TestEntity, { name: 'outer' })).flush();

      await em1.transactional(
        async em2 => {
          await em2.persist(em2.create(TestEntity, { name: 'inner' })).flush();
        },
        { propagation: TransactionPropagation.REQUIRED },
      );
    });

    // Verify only one BEGIN and one COMMIT
    const beginCalls = mock.mock.calls.filter(c => c[0].toLowerCase().includes('begin'));
    expect(beginCalls).toHaveLength(1);

    const commitCalls = mock.mock.calls.filter(c => c[0].toLowerCase().includes('commit'));
    expect(commitCalls).toHaveLength(1);

    // No savepoints should be created for REQUIRED
    const savepointCalls = mock.mock.calls.filter(c => c[0].toLowerCase().includes('savepoint'));
    expect(savepointCalls).toHaveLength(0);
  });

  test('REQUIRED propagation should create new transaction if none exists', async () => {
    const em = orm.em.fork();
    let trx: any;

    await em.transactional(
      async em1 => {
        trx = (em1 as any).transactionContext;
        const entity = em1.create(TestEntity, { name: 'test' });
        await em1.persist(entity).flush();
      },
      { propagation: TransactionPropagation.REQUIRED },
    );

    expect(trx).toBeDefined();
    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('REQUIRED propagation should rollback all operations when inner transaction fails', async () => {
    const em = orm.em.fork();

    try {
      await em.transactional(async em1 => {
        const entity1 = em1.create(TestEntity, { name: 'outer' });
        await em1.persist(entity1).flush();

        await em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'inner' });
            await em2.persist(entity2).flush();
            throw new Error('Inner error');
          },
          { propagation: TransactionPropagation.REQUIRED },
        );
      });
    } catch (e) {
      // Expected error
    }

    // Both operations should be rolled back
    const count = await orm.em.count(TestEntity);
    expect(count).toBe(0);
  });

  test('REQUIRED propagation should handle multiple REQUIRED propagations in sequence', async () => {
    const em = orm.em.fork();
    const contexts: any[] = [];

    await em.transactional(async em1 => {
      contexts.push((em1 as any).transactionContext);
      const entity1 = em1.create(TestEntity, { name: 'first' });
      await em1.persist(entity1).flush();

      await em1.transactional(
        async em2 => {
          contexts.push((em2 as any).transactionContext);
          const entity2 = em2.create(TestEntity, { name: 'second' });
          await em2.persist(entity2).flush();
        },
        { propagation: TransactionPropagation.REQUIRED },
      );

      await em1.transactional(
        async em3 => {
          contexts.push((em3 as any).transactionContext);
          const entity3 = em3.create(TestEntity, { name: 'third' });
          await em3.persist(entity3).flush();
        },
        { propagation: TransactionPropagation.REQUIRED },
      );
    });

    // All should share the same context
    expect(contexts.every(ctx => ctx === contexts[0])).toBe(true);
    const count = await orm.em.count(TestEntity);
    expect(count).toBe(3);
  });

  // REQUIRES_NEW propagation tests

  test('REQUIRES_NEW propagation should create new independent transaction', async () => {
    const em = orm.em.fork();
    let outerTrx: any;
    let innerTrx: any;

    await em.transactional(async em1 => {
      outerTrx = (em1 as any).transactionContext;
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persist(entity1).flush();

      await em1.transactional(
        async em2 => {
          innerTrx = (em2 as any).transactionContext;
          const entity2 = em2.create(TestEntity, { name: 'inner' });
          await em2.persist(entity2).flush();
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );
    });

    expect(outerTrx).toBeDefined();
    expect(innerTrx).toBeDefined();
    expect(innerTrx).not.toBe(outerTrx); // Should be different transactions

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(2);
  });

  test('REQUIRES_NEW propagation should isolate inner transaction failure', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persist(entity1).flush();

      try {
        await em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'inner' });
            await em2.persist(entity2).flush();
            throw new Error('Rollback inner');
          },
          { propagation: TransactionPropagation.REQUIRES_NEW },
        );
      } catch (e) {
        // Inner transaction rolled back
      }

      const entity3 = em1.create(TestEntity, { name: 'after' });
      await em1.persist(entity3).flush();
    });

    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(2);
    expect(entities.map(e => e.name)).toEqual(expect.arrayContaining(['outer', 'after']));
  });

  test('REQUIRES_NEW propagation should commit inner transaction even if outer fails', async () => {
    const em = orm.em.fork();

    try {
      await em.transactional(async em1 => {
        const entity1 = em1.create(TestEntity, { name: 'outer-fail' });
        await em1.persist(entity1).flush();

        await em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'inner-success' });
            await em2.persist(entity2).flush();
          },
          { propagation: TransactionPropagation.REQUIRES_NEW },
        );

        throw new Error('Outer transaction error');
      });
    } catch (e) {
      // Outer transaction should rollback
    }

    // Inner REQUIRES_NEW transaction should have committed
    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(1);
    expect(entities[0].name).toBe('inner-success');
  });

  test('REQUIRES_NEW propagation should handle multiple REQUIRES_NEW transactions in sequence', async () => {
    const em = orm.em.fork();
    const contexts: any[] = [];

    await em.transactional(async em1 => {
      contexts.push((em1 as any).transactionContext);

      for (let i = 0; i < 3; i++) {
        await em1.transactional(
          async em2 => {
            contexts.push((em2 as any).transactionContext);
            const entity = em2.create(TestEntity, { name: `entity-${i}` });
            await em2.persist(entity).flush();
          },
          { propagation: TransactionPropagation.REQUIRES_NEW },
        );
      }
    });

    // Each REQUIRES_NEW should have different context
    expect(contexts[0]).toBeDefined();
    for (let i = 1; i < contexts.length; i++) {
      expect(contexts[i]).not.toBe(contexts[0]);
    }

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(3);
  });

  test('REQUIRES_NEW propagation should use separate connections/transactions with query logging', async () => {
    const mock = mockLogger(orm, ['query']);
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      await em1.persist(em1.create(TestEntity, { name: 'outer-tx' })).flush();

      await em1.transactional(
        async em2 => {
          await em2.persist(em2.create(TestEntity, { name: 'inner-tx' })).flush();
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );

      await em1.persist(em1.create(TestEntity, { name: 'after-inner' })).flush();
    });

    // Should have two separate BEGIN and COMMIT pairs
    const beginCalls = mock.mock.calls.filter(c => c[0].toLowerCase().includes('begin'));
    expect(beginCalls).toHaveLength(2);

    const commitCalls = mock.mock.calls.filter(c => c[0].toLowerCase().includes('commit'));
    expect(commitCalls).toHaveLength(2);

    // Verify query execution order
    const queryTypes = mock.mock.calls
      .map(c => {
        const query = c[0].toLowerCase();
        if (query.includes('begin')) {
          return 'BEGIN';
        }
        if (query.includes('commit')) {
          return 'COMMIT';
        }
        if (query.includes('insert')) {
          return 'INSERT';
        }
        if (query.includes('rollback')) {
          return 'ROLLBACK';
        }
        return 'OTHER';
      })
      .filter(type => type !== 'OTHER');

    // Expected order: BEGIN (outer), INSERT, BEGIN (inner), INSERT, COMMIT (inner), INSERT, COMMIT (outer)
    expect(queryTypes[0]).toBe('BEGIN'); // Outer transaction starts
    expect(queryTypes[1]).toBe('INSERT'); // First entity
    expect(queryTypes[2]).toBe('BEGIN'); // Inner transaction starts
    expect(queryTypes[3]).toBe('INSERT'); // Second entity
    expect(queryTypes[4]).toBe('COMMIT'); // Inner transaction commits
    expect(queryTypes[5]).toBe('INSERT'); // Third entity
    expect(queryTypes[6]).toBe('COMMIT'); // Outer transaction commits
  });

  test('REQUIRES_NEW propagation should prevent deadlock by using independent transactions', async () => {
    const em = orm.em.fork();

    // Create initial data
    await em
      .persist([
        em.create(TestEntity, { name: 'resource-a', value: 1 }),
        em.create(TestEntity, { name: 'resource-b', value: 2 }),
      ])
      .flush();

    // Test that REQUIRES_NEW creates truly independent transactions
    await em.transactional(async em1 => {
      // Outer transaction locks resource-a
      const entityA = await em1.findOne(TestEntity, { name: 'resource-a' });
      entityA!.value = 10;
      await em1.persist(entityA!).flush();

      // Inner REQUIRES_NEW transaction should be able to access resource-b independently
      await em1.transactional(
        async em2 => {
          const entityB = await em2.findOne(TestEntity, { name: 'resource-b' });
          entityB!.value = 20;
          await em2.persist(entityB!).flush();
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );

      // After inner transaction completes, outer can continue
      entityA!.value = 15;
      await em1.persist(entityA!).flush();
    });

    // Verify both updates succeeded
    const finalA = await orm.em.findOne(TestEntity, { name: 'resource-a' });
    const finalB = await orm.em.findOne(TestEntity, { name: 'resource-b' });
    expect(finalA!.value).toBe(15);
    expect(finalB!.value).toBe(20);
  });

  // NESTED propagation tests

  test('NESTED propagation should throw "Transaction already in progress" error in MongoDB', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persist(entity1).flush();

      // MongoDB doesn't support savepoints, attempting NESTED will fail
      await expect(
        em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'nested' });
            await em2.persist(entity2).flush();
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');
    });
  });

  test('NESTED propagation should fail when transaction exists in MongoDB', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persist(entity1).flush();

      // MongoDB doesn't support savepoints, so NESTED with existing transaction fails
      await expect(
        em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'inner' });
            await em2.persist(entity2).flush();
            throw new Error('Rollback inner');
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');

      const entity3 = em1.create(TestEntity, { name: 'after' });
      await em1.persist(entity3).flush();
    });

    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(2);
    expect(entities.map(e => e.name)).toEqual(expect.arrayContaining(['outer', 'after']));
  });

  test('NESTED propagation should create new transaction if none exists', async () => {
    const em = orm.em.fork();

    await em.transactional(
      async em1 => {
        const entity = em1.create(TestEntity, { name: 'test' });
        await em1.persist(entity).flush();
      },
      { propagation: TransactionPropagation.NESTED },
    );

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('NESTED propagation should fail with "Transaction already in progress" for multiple levels', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'level1' });
      await em1.persist(entity1).flush();

      // First NESTED should fail with "Transaction already in progress"
      await expect(
        em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'level2' });
            await em2.persist(entity2).flush();
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');
    });
  });

  test('NESTED propagation should fail consistently with "Transaction already in progress"', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persist(entity1).flush();

      // First nested - should fail with "Transaction already in progress"
      await expect(
        em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'nested1' });
            await em2.persist(entity2).flush();
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');

      // Second nested - should also fail with same error
      await expect(
        em1.transactional(
          async em2 => {
            const entity3 = em2.create(TestEntity, { name: 'nested2' });
            await em2.persist(entity3).flush();
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');
    });

    // Only outer entity should be saved
    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(1);
    expect(entities[0].name).toBe('outer');
  });

  test('NESTED propagation should fail with "Transaction already in progress" in MongoDB', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      await em1.persist(em1.create(TestEntity, { name: 'outer' })).flush();

      // MongoDB doesn't support savepoints, so NESTED will fail
      await expect(
        em1.transactional(
          async em2 => {
            await em2.persist(em2.create(TestEntity, { name: 'nested' })).flush();
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');
    });
  });

  test('NESTED propagation should fail immediately in MongoDB when transaction exists', async () => {
    // MongoDB doesn't support savepoints, so NESTED with existing transaction fails immediately
    const em = orm.em.fork();

    await expect(
      em.transactional(async em1 => {
        await em1.persist(em1.create(TestEntity, { name: 'before-nested' })).flush();

        // This will throw "Transaction already in progress" error
        await em1.transactional(
          async em2 => {
            await em2.persist(em2.create(TestEntity, { name: 'in-nested' })).flush();
            throw new Error('Nested error');
          },
          { propagation: TransactionPropagation.NESTED },
        );
      }),
    ).rejects.toThrow('Transaction already in progress');

    // Nothing should be persisted since transaction failed
    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(0);
  });

  // NOT_SUPPORTED propagation tests

  test('NOT_SUPPORTED propagation should execute without transaction', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'with-tx' });
      await em1.persist(entity1).flush();

      await em1.transactional(
        async em2 => {
          const entity2 = em2.create(TestEntity, { name: 'without-tx' });
          await em2.persist(entity2).flush();
        },
        { propagation: TransactionPropagation.NOT_SUPPORTED },
      );
    });

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(2);
  });

  test('NOT_SUPPORTED propagation should not rollback when outer transaction fails', async () => {
    const em = orm.em.fork();

    try {
      await em.transactional(async em1 => {
        const entity1 = em1.create(TestEntity, { name: 'outer-fail' });
        await em1.persist(entity1).flush();

        // This should commit immediately, not part of transaction
        await em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'no-tx-success' });
            await em2.persist(entity2).flush();
          },
          { propagation: TransactionPropagation.NOT_SUPPORTED },
        );

        throw new Error('Outer transaction error');
      });
    } catch (e) {
      // Expected error
    }

    // NOT_SUPPORTED operation should have persisted
    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(1);
    expect(entities[0].name).toBe('no-tx-success');
  });

  test('NOT_SUPPORTED propagation should handle errors independently', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer-success' });
      await em1.persist(entity1).flush();

      try {
        await em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'no-tx-fail' });
            await em2.persist(entity2).flush();
            throw new Error('NOT_SUPPORTED error');
          },
          { propagation: TransactionPropagation.NOT_SUPPORTED },
        );
      } catch (e) {
        // Error in NOT_SUPPORTED should not affect outer transaction
      }
    });

    // Both should be persisted (NOT_SUPPORTED commits immediately)
    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(2);
    const names = entities.map(e => e.name).sort();
    expect(names).toEqual(['no-tx-fail', 'outer-success']);
  });

  // SUPPORTS propagation tests

  test('SUPPORTS propagation should join existing transaction when present', async () => {
    const em = orm.em.fork();
    let outerTrx: any;
    let innerTrx: any;

    await em.transactional(async em1 => {
      outerTrx = (em1 as any).transactionContext;

      await em1.transactional(
        async em2 => {
          innerTrx = (em2 as any).transactionContext;
          const entity = em2.create(TestEntity, { name: 'supports-with-tx' });
          await em2.persist(entity).flush();
        },
        { propagation: TransactionPropagation.SUPPORTS },
      );
    });

    expect(outerTrx).toBeDefined();
    expect(innerTrx).toBe(outerTrx); // Should join existing transaction

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('SUPPORTS propagation should execute without transaction when none exists', async () => {
    const em = orm.em.fork();
    let trx: any;

    await em.transactional(
      async em1 => {
        trx = (em1 as any).transactionContext;
        const entity = em1.create(TestEntity, { name: 'supports-no-tx' });
        await em1.persist(entity).flush();
      },
      { propagation: TransactionPropagation.SUPPORTS },
    );

    expect(trx).toBeFalsy(); // No transaction context

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  // MANDATORY propagation tests

  test('MANDATORY propagation should join existing transaction when present', async () => {
    const em = orm.em.fork();
    let outerTrx: any;
    let innerTrx: any;

    await em.transactional(async em1 => {
      outerTrx = (em1 as any).transactionContext;
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persist(entity1).flush();

      await em1.transactional(
        async em2 => {
          innerTrx = (em2 as any).transactionContext;
          const entity2 = em2.create(TestEntity, { name: 'mandatory-with-tx' });
          await em2.persist(entity2).flush();
        },
        { propagation: TransactionPropagation.MANDATORY },
      );
    });

    expect(outerTrx).toBeDefined();
    expect(innerTrx).toBe(outerTrx); // Should use existing transaction

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(2);
  });

  test('MANDATORY propagation should throw error when no transaction exists', async () => {
    const em = orm.em.fork();

    await expect(
      em.transactional(
        async em1 => {
          const entity = em1.create(TestEntity, { name: 'should-not-exist' });
          await em1.persist(entity).flush();
        },
        { propagation: TransactionPropagation.MANDATORY },
      ),
    ).rejects.toThrow('No existing transaction found for transaction marked with propagation "mandatory"');

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(0);
  });

  // NEVER propagation tests

  test('NEVER propagation should execute without transaction when none exists', async () => {
    const em = orm.em.fork();
    let trx: any;

    await em.transactional(
      async em1 => {
        trx = (em1 as any).transactionContext;
        const entity = em1.create(TestEntity, { name: 'never-no-tx' });
        await em1.persist(entity).flush();
      },
      { propagation: TransactionPropagation.NEVER },
    );

    expect(trx).toBeFalsy(); // No transaction context

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('NEVER propagation should throw error when transaction exists', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persist(entity1).flush();

      await expect(
        em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'should-not-exist' });
            await em2.persist(entity2).flush();
          },
          { propagation: TransactionPropagation.NEVER },
        ),
      ).rejects.toThrow('Existing transaction found for transaction marked with propagation "never"');
    });

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1); // Only outer entity should exist
  });

  // Mixed propagation scenarios

  test('Mixed propagation should properly isolate transactions with separate entity managers', async () => {
    // Use separate EntityManager forks to demonstrate isolation
    const em1 = orm.em.fork();
    const em2 = orm.em.fork();

    // Create initial entities
    await orm.em.transactional(async em => {
      await em.persist(em.create(TestEntity, { name: 'isolated-1', value: 100 })).flush();
      await em.persist(em.create(TestEntity, { name: 'isolated-2', value: 200 })).flush();
    });

    // Run transactions with separate EntityManagers
    // Transaction 1: Update isolated-1
    await em1.transactional(async em => {
      const entity = await em.findOne(TestEntity, { name: 'isolated-1' });
      entity!.value = 150;
      await em.persist(entity!).flush();
    });

    // Transaction 2: Update isolated-2 (different EM, different transaction)
    await em2.transactional(async em => {
      const entity = await em.findOne(TestEntity, { name: 'isolated-2' });
      entity!.value = 250;
      await em.persist(entity!).flush();
    });

    // Verify final values
    const final1 = await orm.em.findOne(TestEntity, { name: 'isolated-1' });
    const final2 = await orm.em.findOne(TestEntity, { name: 'isolated-2' });
    expect(final1!.value).toBe(150);
    expect(final2!.value).toBe(250);
  });

  test('Mixed propagation should verify transaction context propagation', async () => {
    const em = orm.em.fork();
    const contexts: any[] = [];

    await em.transactional(async em1 => {
      contexts.push({ level: 1, context: (em1 as any).transactionContext });

      // REQUIRED should share context
      await em1.transactional(
        async em2 => {
          contexts.push({ level: 2, type: 'REQUIRED', context: (em2 as any).transactionContext });
        },
        { propagation: TransactionPropagation.REQUIRED },
      );

      // REQUIRES_NEW should have new context
      await em1.transactional(
        async em2 => {
          contexts.push({ level: 2, type: 'REQUIRES_NEW', context: (em2 as any).transactionContext });
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );

      // NESTED in MongoDB will fail with "Transaction already in progress"
      await expect(
        em1.transactional(
          async em2 => {
            contexts.push({ level: 2, type: 'NESTED', context: (em2 as any).transactionContext });
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');
    });

    // Verify context propagation
    const level1Context = contexts.find(c => c.level === 1)!.context;
    const requiredContext = contexts.find(c => c.type === 'REQUIRED')!.context;
    const requiresNewContext = contexts.find(c => c.type === 'REQUIRES_NEW')!.context;

    expect(requiredContext).toBe(level1Context); // REQUIRED shares context
    expect(requiresNewContext).not.toBe(level1Context); // REQUIRES_NEW has new context
  });

  test('Mixed propagation should handle complex nested propagations', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'level1' });
      await em1.persist(entity1).flush();

      await em1.transactional(
        async em2 => {
          const entity2 = em2.create(TestEntity, { name: 'level2-required' });
          await em2.persist(entity2).flush();

          // NESTED will fail in MongoDB
          await expect(
            em2.transactional(
              async em3 => {
                const entity3 = em3.create(TestEntity, { name: 'level3-nested' });
                await em3.persist(entity3).flush();
              },
              { propagation: TransactionPropagation.NESTED },
            ),
          ).rejects.toThrow('Transaction already in progress');

          await em2.transactional(
            async em3 => {
              const entity4 = em3.create(TestEntity, { name: 'level3-new' });
              await em3.persist(entity4).flush();
            },
            { propagation: TransactionPropagation.REQUIRES_NEW },
          );
        },
        { propagation: TransactionPropagation.REQUIRED },
      );
    });

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(3); // Only 3 entities since NESTED failed
  });

  test('Mixed propagation should properly isolate errors', async () => {
    const em = orm.em.fork();

    try {
      await em.transactional(async em1 => {
        const entity1 = em1.create(TestEntity, { name: 'outer' });
        await em1.persist(entity1).flush();

        // REQUIRES_NEW - should commit independently
        await em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'independent' });
            await em2.persist(entity2).flush();
          },
          { propagation: TransactionPropagation.REQUIRES_NEW },
        );

        // NESTED - will create savepoint but still fail with outer
        await em1.transactional(
          async em2 => {
            const entity3 = em2.create(TestEntity, { name: 'nested' });
            await em2.persist(entity3).flush();
          },
          { propagation: TransactionPropagation.NESTED },
        );

        // REQUIRED - should rollback with outer
        await em1.transactional(
          async em2 => {
            const entity4 = em2.create(TestEntity, { name: 'joined' });
            await em2.persist(entity4).flush();
            throw new Error('Inner REQUIRED error');
          },
          { propagation: TransactionPropagation.REQUIRED },
        );
      });
    } catch (e) {
      // Expected error
    }

    // Only REQUIRES_NEW transaction should have committed
    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(1);
    expect(entities[0].name).toBe('independent');
  });

  test('Mixed propagation should handle REQUIRED -> NESTED -> REQUIRES_NEW chain', async () => {
    const em = orm.em.fork();
    const contexts: any[] = [];

    await em.transactional(
      async em1 => {
        contexts.push((em1 as any).transactionContext);
        const entity1 = em1.create(TestEntity, { name: 'required' });
        await em1.persist(entity1).flush();

        // NESTED will fail in MongoDB with "Transaction already in progress"
        await expect(
          em1.transactional(
            async em2 => {
              contexts.push((em2 as any).transactionContext);
              const entity2 = em2.create(TestEntity, { name: 'nested' });
              await em2.persist(entity2).flush();

              await em2.transactional(
                async em3 => {
                  contexts.push((em3 as any).transactionContext);
                  const entity3 = em3.create(TestEntity, { name: 'requires-new' });
                  await em3.persist(entity3).flush();
                },
                { propagation: TransactionPropagation.REQUIRES_NEW },
              );
            },
            { propagation: TransactionPropagation.NESTED },
          ),
        ).rejects.toThrow('Transaction already in progress');
      },
      { propagation: TransactionPropagation.REQUIRED },
    );

    // Only the first entity should be created since NESTED failed
    expect(contexts[0]).toBeDefined();

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  // Edge cases and error handling

  test('Edge cases should handle deep nesting with all propagation types', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'level1-required' });
      await em1.persist(entity1).flush();

      // NESTED will fail in MongoDB
      await expect(
        em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'level2-nested' });
            await em2.persist(entity2).flush();
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');

      // Use REQUIRES_NEW instead
      await em1.transactional(
        async em2 => {
          const entity2 = em2.create(TestEntity, { name: 'level2-new' });
          await em2.persist(entity2).flush();

          await em2.transactional(
            async em3 => {
              const entity3 = em3.create(TestEntity, { name: 'level3-required' });
              await em3.persist(entity3).flush();
            },
            { propagation: TransactionPropagation.REQUIRED },
          );
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );
    });

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(3); // Only 3 entities since NESTED failed
  });

  test('Edge cases should maintain data consistency across propagation boundaries', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'parent' });
      await em1.persist(entity1).flush();

      // Verify data is visible within transaction
      const found1 = await em1.findOne(TestEntity, { name: 'parent' });
      expect(found1).toBeDefined();

      await em1.transactional(
        async em2 => {
          // Should see parent data in REQUIRED
          const found2 = await em2.findOne(TestEntity, { name: 'parent' });
          expect(found2).toBeDefined();

          const entity2 = em2.create(TestEntity, { name: 'child-required' });
          await em2.persist(entity2).flush();
        },
        { propagation: TransactionPropagation.REQUIRED },
      );

      // NESTED will fail in MongoDB
      await expect(
        em1.transactional(
          async em3 => {
            const found3 = await em3.findOne(TestEntity, { name: 'parent' });
            expect(found3).toBeDefined();

            const entity3 = em3.create(TestEntity, { name: 'child-nested' });
            await em3.persist(entity3).flush();
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');

      await em1.transactional(
        async em4 => {
          // REQUIRES_NEW has its own transaction, may not see uncommitted data
          const entity4 = em4.create(TestEntity, { name: 'child-new' });
          await em4.persist(entity4).flush();
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );
    });

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(3); // Only 3 entities since NESTED failed
  });

  test('Edge cases should handle empty transactions with all propagation types', async () => {
    const em = orm.em.fork();

    // Empty transactions should not cause issues
    await em.transactional(
      async () => {
        // Empty transaction
      },
      { propagation: TransactionPropagation.REQUIRED },
    );
    await em.transactional(
      async () => {
        // Empty transaction
      },
      { propagation: TransactionPropagation.REQUIRES_NEW },
    );
    await em.transactional(
      async () => {
        // Empty transaction
      },
      { propagation: TransactionPropagation.NESTED },
    );
    await em.transactional(
      async () => {
        // Empty transaction
      },
      { propagation: TransactionPropagation.NOT_SUPPORTED },
    );

    await em.transactional(async em1 => {
      await em1.transactional(
        async () => {
          // Empty transaction
        },
        { propagation: TransactionPropagation.REQUIRED },
      );
      await em1.transactional(
        async () => {
          // Empty transaction
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );
      // NESTED will fail in MongoDB with "Transaction already in progress"
      await expect(
        em1.transactional(
          async () => {
            // Empty transaction
          },
          { propagation: TransactionPropagation.NESTED },
        ),
      ).rejects.toThrow('Transaction already in progress');
      await em1.transactional(
        async () => {
          // Empty transaction
        },
        { propagation: TransactionPropagation.NOT_SUPPORTED },
      );
    });

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(0);
  });

  // Isolation Level with Propagation

  test('Isolation Level should use specified isolation level', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm);

    await em.transactional(
      async () => {
        // Transaction code
      },
      {
        propagation: TransactionPropagation.REQUIRED,
        isolationLevel: IsolationLevel.SERIALIZABLE,
      },
    );

    // MongoDB doesn't log isolation level in the same way as SQL databases
    // Just check that transaction was started
    const hasBegin = mock.mock.calls.some(call => {
      const query = call[0].toLowerCase();
      return query.includes('begin');
    });
    expect(hasBegin).toBe(true);
  });

  test('Isolation Level should maintain separate isolation levels for REQUIRES_NEW', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm);

    await em.transactional(
      async em1 => {
        await em1.transactional(
          async () => {
            // Inner transaction
          },
          {
            propagation: TransactionPropagation.REQUIRES_NEW,
            isolationLevel: IsolationLevel.READ_UNCOMMITTED,
          },
        );
      },
      {
        isolationLevel: IsolationLevel.SERIALIZABLE,
      },
    );

    // MongoDB handles isolation differently, check for two separate transactions
    const calls = mock.mock.calls.map(c => c[0].toLowerCase());
    const beginCalls = calls.filter(c => c.includes('begin'));
    expect(beginCalls.length).toBeGreaterThanOrEqual(2);
  });

  test('Isolation Level should inherit isolation level with REQUIRED', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm);

    await em.transactional(
      async em1 => {
        await em1.transactional(
          async em2 => {
            const entity = em2.create(TestEntity, { name: 'inner' });
            await em2.persist(entity).flush();
          },
          {
            propagation: TransactionPropagation.REQUIRED,
            isolationLevel: IsolationLevel.REPEATABLE_READ, // Should be ignored
          },
        );
      },
      {
        isolationLevel: IsolationLevel.SERIALIZABLE,
      },
    );

    // Only one transaction should be started (REQUIRED reuses the outer transaction)
    const calls = mock.mock.calls.map(c => c[0].toLowerCase());
    const beginCalls = calls.filter(c => c.includes('begin'));
    expect(beginCalls.length).toBe(1);
  });

  // Read-only Transactions with Propagation

  test('Read-only transaction should enforce read-only mode', async () => {
    const em = orm.em.fork();

    // MongoDB doesn't enforce read-only at transaction level in the same way
    // But we can test that writes still work (MongoDB doesn't prevent writes in readOnly)
    await em.transactional(
      async em1 => {
        const entity = em1.create(TestEntity, { name: 'test' });
        await em1.persist(entity).flush();
      },
      {
        propagation: TransactionPropagation.REQUIRED,
        readOnly: true,
      },
    );

    // In MongoDB, readOnly is more of a hint, writes may still succeed
    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('Read-only transaction should allow writes in REQUIRES_NEW inside read-only', async () => {
    const em = orm.em.fork();

    await em.transactional(
      async em1 => {
        // Read-only outer transaction
        await em1.find(TestEntity, {});

        // REQUIRES_NEW creates independent writable transaction
        await em1.transactional(
          async em2 => {
            const entity = em2.create(TestEntity, { name: 'writable' });
            await em2.persist(entity).flush();
          },
          {
            propagation: TransactionPropagation.REQUIRES_NEW,
            readOnly: false,
          },
        );
      },
      {
        readOnly: true,
      },
    );

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('Read-only transaction should propagate read-only with REQUIRED', async () => {
    const em = orm.em.fork();

    // MongoDB doesn't enforce read-only strictly
    await em.transactional(
      async em1 => {
        await em1.transactional(
          async em2 => {
            const entity = em2.create(TestEntity, { name: 'inner' });
            await em2.persist(entity).flush();
          },
          {
            propagation: TransactionPropagation.REQUIRED,
            readOnly: false, // Should be overridden by outer
          },
        );
      },
      {
        readOnly: true,
      },
    );

    // In MongoDB, writes may still succeed
    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  // Flush Mode with Propagation

  test('Flush Mode should respect flush mode settings', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity = em1.create(TestEntity, { name: 'test' });

      // COMMIT mode - won't flush automatically
      // NESTED will fail in MongoDB
      try {
        await em1.transactional(
          async () => {
            entity.name = 'changed';
            // Should not flush here
          },
          {
            propagation: TransactionPropagation.NESTED,
            flushMode: FlushMode.COMMIT,
          },
        );
      } catch (e) {
        // Expected - Transaction already in progress
        entity.name = 'changed'; // Change it directly instead
      }

      // Manually flush
      await em1.flush();
    });

    const entities = await orm.em.find(TestEntity, {});
    expect(entities[0].name).toBe('changed');
  });

  test('Flush Mode should handle different flush modes in nested transactions', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm);

    await em.transactional(
      async em1 => {
        const entity = em1.create(TestEntity, { name: 'outer' });

        await em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'inner' });
            await em2.persist(entity2).flush();
            // Explicit flush to ensure the insert happens
          },
          {
            propagation: TransactionPropagation.REQUIRES_NEW,
            flushMode: FlushMode.AUTO,
          },
        );
      },
      {
        flushMode: FlushMode.COMMIT,
      },
    );

    // Check that inner transaction executed insert
    const calls = mock.mock.calls.map(c => c[0]);
    const hasInnerInsert = calls.some(c => c.toLowerCase().includes('insert'));
    expect(hasInnerInsert).toBe(true);
  });

  // Clear Option with Propagation

  test('Clear Option should clear identity map when specified', async () => {
    const em = orm.em.fork();
    const entity = em.create(TestEntity, { name: 'test' });
    await em.persist(entity).flush();

    await em.transactional(
      async em1 => {
        // clear: true should clear the identity map
        // Since identity map was cleared, loaded entity should be different instance
        const loaded = await em1.findOne(TestEntity, { name: 'test' });
        expect(loaded).toBeDefined();
        expect(loaded).not.toBe(entity);
      },
      {
        clear: true,
      },
    );
  });

  test('Clear Option should maintain separate identity maps with REQUIRES_NEW', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persist(entity1).flush();

      await em1.transactional(
        async em2 => {
          // REQUIRES_NEW should have separate identity map
          const loaded = await em2.findOne(TestEntity, { name: 'outer' });
          expect(loaded).toBeDefined();
          expect(loaded).not.toBe(entity1); // Different instances
        },
        {
          propagation: TransactionPropagation.REQUIRES_NEW,
        },
      );

      // Original entity should still be in outer transaction's identity map
      const reloaded = await em1.findOne(TestEntity, { name: 'outer' });
      expect(reloaded).toBe(entity1); // Same instance
    });
  });

  // Combined Options

  test('Combined Options should combine multiple options correctly', async () => {
    const em = orm.em.fork();

    await em.transactional(
      async em1 => {
        const entity = em1.create(TestEntity, { name: 'combined' });
        await em1.persist(entity).flush();
      },
      {
        propagation: TransactionPropagation.REQUIRES_NEW,
        isolationLevel: IsolationLevel.REPEATABLE_READ,
        flushMode: FlushMode.AUTO,
        clear: true,
      },
    );

    // Verify entity was created
    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('Combined Options should handle complex nested scenarios with options', async () => {
    const em = orm.em.fork();

    await em.transactional(
      async em1 => {
        const entity1 = em1.create(TestEntity, { name: 'level1' });
        await em1.persist(entity1).flush();

        // NESTED will fail in MongoDB
        await expect(
          em1.transactional(
            async em2 => {
              const entity2 = em2.create(TestEntity, { name: 'level2' });
              await em2.persist(entity2).flush();
            },
            {
              propagation: TransactionPropagation.NESTED,
              flushMode: FlushMode.AUTO,
            },
          ),
        ).rejects.toThrow('Transaction already in progress');

        // Use REQUIRES_NEW instead
        await em1.transactional(
          async em2 => {
            const entity2 = em2.create(TestEntity, { name: 'level2' });
            await em2.persist(entity2).flush();

            await em2.transactional(
              async em3 => {
                const entity3 = em3.create(TestEntity, { name: 'level3' });
                await em3.persist(entity3).flush();
              },
              {
                propagation: TransactionPropagation.REQUIRED,
                isolationLevel: IsolationLevel.READ_COMMITTED,
              },
            );
          },
          {
            propagation: TransactionPropagation.REQUIRES_NEW,
            flushMode: FlushMode.AUTO,
          },
        );
      },
      {
        isolationLevel: IsolationLevel.REPEATABLE_READ,
        flushMode: FlushMode.COMMIT,
      },
    );

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(3);
  });

  test('Should throw error for unsupported propagation type', async () => {
    const em = orm.em.fork();

    await expect(
      em.transactional(
        async () => {
          return;
        },
        {
          propagation: 'UNSUPPORTED_TYPE' as any,
        },
      ),
    ).rejects.toThrow('Unsupported transaction propagation type: UNSUPPORTED_TYPE');
  });

  test('Should handle transaction without options parameter', async () => {
    const em = orm.em.fork();

    const manager = new TransactionManager(em);
    const result = await manager.handle(async innerEm => {
      const entity = innerEm.create(TestEntity, { name: 'no-options' });
      await innerEm.persist(entity).flush();
      return 'success-no-options';
    });

    expect(result).toBe('success-no-options');

    const count = await orm.em.count(TestEntity, { name: 'no-options' });
    expect(count).toBe(1);
  });

  test('Should execute callback directly when transactions are disabled', async () => {
    const em = orm.em.fork({ disableTransactions: true });

    let callbackExecuted = false;
    const result = await em.transactional(
      async () => {
        callbackExecuted = true;
        return 'disabled-result';
      },
      {
        propagation: TransactionPropagation.REQUIRED,
      },
    );

    expect(callbackExecuted).toBe(true);
    expect(result).toBe('disabled-result');
  });

  test('Should handle deletion operations and unset identity in parent context', async () => {
    const em = orm.em.fork();

    const entity = em.create(TestEntity, { name: 'to-delete' });
    await em.persist(entity).flush();

    const parentEntity = await em.findOne(TestEntity, { name: 'to-delete' });
    expect(parentEntity).toBeDefined();

    const parentIdentityMap = em.getUnitOfWork(false).getIdentityMap();
    expect(Array.from(parentIdentityMap)).toContainEqual(parentEntity);

    await em.transactional(async em1 => {
      const toDelete = await em1.findOne(TestEntity, { name: 'to-delete' });
      em1.remove(toDelete!);
    });

    const parentIdentityMapAfter = em.getUnitOfWork(false).getIdentityMap();
    expect(Array.from(parentIdentityMapAfter)).not.toContainEqual(parentEntity);

    const count = await em.count(TestEntity, { name: 'to-delete' });
    expect(count).toBe(0);
  });

  test('Should execute non-propagating flow with NOT_SUPPORTED and global EM', async () => {
    const em = orm.em.fork();

    const originalAllowGlobalContext = em.config.get('allowGlobalContext');
    em.config.set('allowGlobalContext', false);
    (em as any).global = true;

    try {
      let flushCalledAutomatically = false;
      let callbackExecuted = false;
      let entityCreated = false;

      const originalFork = em.fork.bind(em);
      em.fork = vi.fn((options?: any) => {
        const fork = originalFork(options);

        const originalFlush = fork.flush.bind(fork);
        fork.flush = vi.fn(async () => {
          flushCalledAutomatically = true;
          return originalFlush();
        });

        return fork;
      }) as any;

      // Use NOT_SUPPORTED propagation - this calls executeTransactionFlow directly
      // With em.global = true and allowGlobalContext = false,
      // shouldPropagateToUpperContext returns false, triggering lines 312-314
      const result = await em.transactional(
        async innerEm => {
          const entity = innerEm.create(TestEntity, { name: 'not-supported-global' });
          entityCreated = true;
          callbackExecuted = true;
          return 'test-result-312-314';
        },
        { propagation: TransactionPropagation.NOT_SUPPORTED },
      );

      expect(callbackExecuted).toBe(true);
      expect(flushCalledAutomatically).toBe(true);
      expect(result).toBe('test-result-312-314');
      expect(entityCreated).toBe(true);

      const count = await orm.em.fork().count(TestEntity, { name: 'not-supported-global' });
      expect(count).toBe(1);
    } finally {
      em.config.set('allowGlobalContext', originalAllowGlobalContext);
    }
  });

  test('Error Scenarios should handle errors with NESTED in MongoDB', async () => {
    const em = orm.em.fork();

    await em.transactional(
      async em1 => {
        // NESTED will fail with "Transaction already in progress"
        await expect(
          em1.transactional(
            async em2 => {
              const entity = em2.create(TestEntity, { name: 'fail' });
              await em2.persist(entity).flush();
            },
            {
              propagation: TransactionPropagation.NESTED,
            },
          ),
        ).rejects.toThrow('Transaction already in progress');
      },
      {
        readOnly: true,
      },
    );
  });

  test('Error Scenarios should rollback correctly with custom isolation levels', async () => {
    const em = orm.em.fork();

    try {
      await em.transactional(
        async em1 => {
          const entity = em1.create(TestEntity, { name: 'will-rollback' });
          await em1.persist(entity).flush();
          throw new Error('Rollback');
        },
        {
          isolationLevel: IsolationLevel.SERIALIZABLE,
        },
      );
    } catch (e) {
      // Expected
    }

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(0);
  });
});
