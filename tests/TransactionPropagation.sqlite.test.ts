import { Entity, MikroORM, PrimaryKey, Property, TransactionPropagation, IsolationLevel, FlushMode } from '@mikro-orm/sqlite';
import { TransactionManager } from '@mikro-orm/core';
import { mockLogger } from './bootstrap';

@Entity()
class TestEntity {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  value?: number;

  @Property({ onCreate: () => new Date(), nullable: true })
  createdAt?: Date;

}

describe('Transaction Propagation - SQLite', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TestEntity],
      dbName: ':memory:',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    await orm.em.nativeDelete(TestEntity, {});
  });

  // REQUIRED propagation tests

  test('REQUIRED propagation should join existing transaction', async () => {
    const em = orm.em.fork();
    let outerTrx: any;
    let innerTrx: any;

    await em.transactional(async em1 => {
      outerTrx = (em1 as any).transactionContext;

      await em1.transactional(async em2 => {
        innerTrx = (em2 as any).transactionContext;
        const entity = em2.create(TestEntity, { name: 'test' });
        await em2.persistAndFlush(entity);
      }, { propagation: TransactionPropagation.REQUIRED });
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
      await em1.persistAndFlush(em1.create(TestEntity, { name: 'outer' }));

      await em1.transactional(async em2 => {
        await em2.persistAndFlush(em2.create(TestEntity, { name: 'inner' }));
      }, { propagation: TransactionPropagation.REQUIRED });
    });

    // Verify only one BEGIN and one COMMIT
    const beginCalls = mock.mock.calls.filter(c =>
      c[0].toLowerCase().includes('begin'),
    );
    expect(beginCalls).toHaveLength(1);

    const commitCalls = mock.mock.calls.filter(c =>
      c[0].toLowerCase().includes('commit'),
    );
    expect(commitCalls).toHaveLength(1);

    // No savepoints should be created for REQUIRED
    const savepointCalls = mock.mock.calls.filter(c =>
      c[0].toLowerCase().includes('savepoint'),
    );
    expect(savepointCalls).toHaveLength(0);
  });

  test('REQUIRED propagation should create new transaction if none exists', async () => {
    const em = orm.em.fork();
    let trx: any;

    await em.transactional(async em1 => {
      trx = (em1 as any).transactionContext;
      const entity = em1.create(TestEntity, { name: 'test' });
      await em1.persistAndFlush(entity);
    }, { propagation: TransactionPropagation.REQUIRED });

    expect(trx).toBeDefined();
    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('REQUIRED propagation should rollback all operations when inner transaction fails', async () => {
    const em = orm.em.fork();

    try {
      await em.transactional(async em1 => {
        const entity1 = em1.create(TestEntity, { name: 'outer' });
        await em1.persistAndFlush(entity1);

        await em1.transactional(async em2 => {
          const entity2 = em2.create(TestEntity, { name: 'inner' });
          await em2.persistAndFlush(entity2);
          throw new Error('Inner error');
        }, { propagation: TransactionPropagation.REQUIRED });
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
      await em1.persistAndFlush(entity1);

      await em1.transactional(async em2 => {
        contexts.push((em2 as any).transactionContext);
        const entity2 = em2.create(TestEntity, { name: 'second' });
        await em2.persistAndFlush(entity2);
      }, { propagation: TransactionPropagation.REQUIRED });

      await em1.transactional(async em3 => {
        contexts.push((em3 as any).transactionContext);
        const entity3 = em3.create(TestEntity, { name: 'third' });
        await em3.persistAndFlush(entity3);
      }, { propagation: TransactionPropagation.REQUIRED });
    });

    // All should share the same context
    expect(contexts.every(ctx => ctx === contexts[0])).toBe(true);
    const count = await orm.em.count(TestEntity);
    expect(count).toBe(3);
  });

  // NESTED propagation tests

  test('NESTED propagation should create savepoint when transaction exists', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persistAndFlush(entity1);

      try {
        await em1.transactional(async em2 => {
          const entity2 = em2.create(TestEntity, { name: 'inner' });
          await em2.persistAndFlush(entity2);
          throw new Error('Rollback inner');
        }, { propagation: TransactionPropagation.NESTED });
      } catch (e) {
        // Inner transaction rolled back to savepoint
      }

      const entity3 = em1.create(TestEntity, { name: 'after' });
      await em1.persistAndFlush(entity3);
    });

    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(2);
    expect(entities.map(e => e.name)).toEqual(expect.arrayContaining(['outer', 'after']));
  });

  test('NESTED propagation should create new transaction if none exists', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity = em1.create(TestEntity, { name: 'test' });
      await em1.persistAndFlush(entity);
    }, { propagation: TransactionPropagation.NESTED });

    const count = await orm.em.count(TestEntity);
    expect(count).toBe(1);
  });

  test('NESTED propagation should handle multiple nested savepoints', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'level1' });
      await em1.persistAndFlush(entity1);

      await em1.transactional(async em2 => {
        const entity2 = em2.create(TestEntity, { name: 'level2' });
        await em2.persistAndFlush(entity2);

        try {
          await em2.transactional(async em3 => {
            const entity3 = em3.create(TestEntity, { name: 'level3' });
            await em3.persistAndFlush(entity3);
            throw new Error('Rollback level3');
          }, { propagation: TransactionPropagation.NESTED });
        } catch (e) {
          // Level 3 rolled back
        }

        const entity4 = em2.create(TestEntity, { name: 'level2-after' });
        await em2.persistAndFlush(entity4);
      }, { propagation: TransactionPropagation.NESTED });
    });

    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(3);
    const names = entities.map(e => e.name).sort();
    expect(names).toEqual(['level1', 'level2', 'level2-after']);
  });

  test('NESTED propagation should properly isolate savepoint rollbacks', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity1 = em1.create(TestEntity, { name: 'outer' });
      await em1.persistAndFlush(entity1);

      // First nested - will fail
      try {
        await em1.transactional(async em2 => {
          const entity2 = em2.create(TestEntity, { name: 'nested1' });
          await em2.persistAndFlush(entity2);
          throw new Error('Rollback nested1');
        }, { propagation: TransactionPropagation.NESTED });
      } catch (e) {
        // Expected
      }

      // Second nested - should succeed
      await em1.transactional(async em2 => {
        const entity3 = em2.create(TestEntity, { name: 'nested2' });
        await em2.persistAndFlush(entity3);
      }, { propagation: TransactionPropagation.NESTED });
    });

    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(2);
    const names = entities.map(e => e.name).sort();
    expect(names).toEqual(['nested2', 'outer']);
  });

  test('NESTED propagation should create and use savepoints with query logging', async () => {
    const mock = mockLogger(orm, ['query']);
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      await em1.persistAndFlush(em1.create(TestEntity, { name: 'outer' }));

      await em1.transactional(async em2 => {
        await em2.persistAndFlush(em2.create(TestEntity, { name: 'nested' }));
      }, { propagation: TransactionPropagation.NESTED });
    });

    // Verify savepoint creation
    const savepointCalls = mock.mock.calls.filter(c =>
      c[0].toLowerCase().includes('savepoint'),
    );
    expect(savepointCalls.length).toBeGreaterThan(0);

    // Check savepoint naming pattern
    const savepointCreate = savepointCalls.find(c =>
      !c[0].toLowerCase().includes('release') && !c[0].toLowerCase().includes('rollback'),
    );
    expect(savepointCreate).toBeDefined();
    expect(savepointCreate![0]).toMatch(/savepoint/i);
  });

  test('NESTED propagation should rollback to savepoint on nested failure with query logging', async () => {
    const mock = mockLogger(orm, ['query']);
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      await em1.persistAndFlush(em1.create(TestEntity, { name: 'before-savepoint' }));

      try {
        await em1.transactional(async em2 => {
          await em2.persistAndFlush(em2.create(TestEntity, { name: 'in-savepoint' }));
          throw new Error('Nested error');
        }, { propagation: TransactionPropagation.NESTED });
      } catch (e) {
        // Expected
      }

      await em1.persistAndFlush(em1.create(TestEntity, { name: 'after-savepoint' }));
    });

    // Should have: BEGIN, INSERT, SAVEPOINT, INSERT, ROLLBACK TO SAVEPOINT, INSERT, COMMIT
    const queryTypes = mock.mock.calls.map(c => {
      const query = c[0].toLowerCase();
      if (query.includes('begin')) { return 'BEGIN'; }
      if (query.includes('commit')) { return 'COMMIT'; }
      if (query.includes('insert')) { return 'INSERT'; }
      if (query.includes('rollback to savepoint')) { return 'ROLLBACK_TO_SAVEPOINT'; }
      if (query.includes('release savepoint')) { return 'RELEASE_SAVEPOINT'; }
      if (query.includes('savepoint')) { return 'SAVEPOINT'; }
      return 'OTHER';
    }).filter(type => type !== 'OTHER');

    // Verify ROLLBACK TO SAVEPOINT was called
    expect(queryTypes).toContain('ROLLBACK_TO_SAVEPOINT');

    // Transaction should still commit
    expect(queryTypes[queryTypes.length - 1]).toBe('COMMIT');

    // Verify data consistency
    const entities = await orm.em.find(TestEntity, {});
    expect(entities).toHaveLength(2);
    expect(entities.map(e => e.name).sort()).toEqual(['after-savepoint', 'before-savepoint']);
  });

  // Note about SQLite limitations:
  // SQLite has a single-writer limitation due to its file-based locking mechanism.
  // This means:
  // - REQUIRES_NEW propagation cannot work as it would need a separate connection/transaction
  //   while the outer transaction holds a write lock on the database file
  // - NOT_SUPPORTED propagation also fails as it tries to execute queries outside the transaction
  //   but the database file is still locked by the suspended outer transaction
  //
  // Therefore, only REQUIRED and NESTED propagation types are tested for SQLite.
  // REQUIRED joins the existing transaction, and NESTED uses savepoints within the same transaction,
  // both of which work within SQLite's single-writer model.

  // Additional tests for edge cases and options

  test('Should throw error for unsupported propagation type', async () => {
    const em = orm.em.fork();

    await expect(em.transactional(async () => {
      return;
    }, {
      propagation: 'UNSUPPORTED_TYPE' as any,
    })).rejects.toThrow('Unsupported transaction propagation type: UNSUPPORTED_TYPE');
  });

  test('Should handle transaction without options parameter', async () => {
    const em = orm.em.fork();

    const manager = new TransactionManager(em);
    const result = await manager.handle(async innerEm => {
      const entity = innerEm.create(TestEntity, { name: 'no-options' });
      await innerEm.persistAndFlush(entity);
      return 'success-no-options';
    });

    expect(result).toBe('success-no-options');

    const count = await orm.em.count(TestEntity, { name: 'no-options' });
    expect(count).toBe(1);
  });

  test('Isolation Level should use specified isolation level', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm);

    await em.transactional(async () => {
      // Transaction code
    }, {
      propagation: TransactionPropagation.REQUIRED,
      isolationLevel: IsolationLevel.SERIALIZABLE,
    });

    // SQLite doesn't explicitly set isolation level, it's always SERIALIZABLE
    // Just check that transaction started
    const hasBegin = mock.mock.calls.some(call => {
      const query = call[0].toLowerCase();
      return query.includes('begin');
    });
    expect(hasBegin).toBe(true);
  });

  test('Isolation Level should inherit isolation level with REQUIRED', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm);

    await em.transactional(async em1 => {
      await em1.transactional(async em2 => {
        const entity = em2.create(TestEntity, { name: 'inner' });
        await em2.persistAndFlush(entity);
      }, {
        propagation: TransactionPropagation.REQUIRED,
        isolationLevel: IsolationLevel.REPEATABLE_READ, // Should be ignored
      });
    }, {
      isolationLevel: IsolationLevel.SERIALIZABLE,
    });

    // SQLite doesn't explicitly set isolation levels in SQL
    // Just verify transaction and insert happened
    const calls = mock.mock.calls.map(c => c[0].toLowerCase());
    const hasBegin = calls.some(c => c.includes('begin'));
    const hasInsert = calls.some(c => c.includes('insert'));
    expect(hasBegin).toBe(true);
    expect(hasInsert).toBe(true);
  });

  test('Flush Mode should respect flush mode settings', async () => {
    const em = orm.em.fork();

    await em.transactional(async em1 => {
      const entity = em1.create(TestEntity, { name: 'test' });
      em1.persist(entity);

      // COMMIT mode - won't flush automatically
      await em1.transactional(async () => {
        entity.name = 'changed';
        // Should not flush here
      }, {
        propagation: TransactionPropagation.NESTED,
        flushMode: FlushMode.COMMIT,
      });

      // Manually flush
      await em1.flush();
    });

    const entities = await orm.em.find(TestEntity, {});
    expect(entities[0].name).toBe('changed');
  });

  test('Clear Option should clear identity map when specified', async () => {
    const em = orm.em.fork();
    const entity = em.create(TestEntity, { name: 'test' });
    await em.persistAndFlush(entity);

    await em.transactional(async em1 => {
      // clear: true should clear the identity map
      // Since identity map was cleared, loaded entity should be different instance
      const loaded = await em1.findOne(TestEntity, { name: 'test' });
      expect(loaded).toBeDefined();
      expect(loaded).not.toBe(entity);
    }, {
      clear: true,
    });
  });
});
