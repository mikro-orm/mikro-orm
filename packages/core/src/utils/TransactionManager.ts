import type { EntityManager } from '../EntityManager';
import { type TransactionOptions, TransactionPropagation } from '../enums';
import { type FlushEventArgs, TransactionEventBroadcaster } from '../events';
import { TransactionContext } from '../utils/TransactionContext';
import { ChangeSetType } from '../unit-of-work';
import { TransactionStateError } from '../errors';
import { helper } from '../entity/wrap';

/**
 * Manages transaction lifecycle and propagation for EntityManager.
 */
export class TransactionManager {

  constructor(private readonly em: EntityManager) {}

  /**
   * Main entry point for handling transactional operations with propagation support.
   */
  async handle<T>(
    cb: (em: EntityManager) => T | Promise<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    const em = this.em.getContext(false);

    // Set NESTED as the default propagation type
    options.propagation ??= TransactionPropagation.NESTED;

    // Set the context to the current transaction context if not already set
    options.ctx ??= em.getTransactionContext();
    const hasExistingTransaction = !!em.getTransactionContext();

    return this.executeWithPropagation(options.propagation, em, cb, options, hasExistingTransaction);
  }

  /**
   * Executes the callback with the specified propagation type.
   */
  private async executeWithPropagation<T>(
    propagation: TransactionPropagation,
    em: EntityManager,
    cb: (em: EntityManager) => T | Promise<T>,
    options: TransactionOptions,
    hasExistingTransaction: boolean,
  ): Promise<T> {
    switch (propagation) {
      case TransactionPropagation.NOT_SUPPORTED:
        return this.executeWithoutTransaction(em, cb, options);

      case TransactionPropagation.REQUIRES_NEW:
        return this.executeWithNewTransaction(em, cb, options, hasExistingTransaction);

      case TransactionPropagation.REQUIRED:
        if (hasExistingTransaction) {
          return cb(em);
        }
        return this.createNewTransaction(em, cb, options);

      case TransactionPropagation.NESTED:
        if (hasExistingTransaction) {
          return this.executeNestedTransaction(em, cb, options);
        }
        return this.createNewTransaction(em, cb, options);

      case TransactionPropagation.SUPPORTS:
        if (hasExistingTransaction) {
          return cb(em);
        }
        return this.executeWithoutTransaction(em, cb, options);

      case TransactionPropagation.MANDATORY:
        if (!hasExistingTransaction) {
          throw TransactionStateError.requiredTransactionNotFound(propagation);
        }
        return cb(em);

      case TransactionPropagation.NEVER:
        if (hasExistingTransaction) {
          throw TransactionStateError.transactionNotAllowed(propagation);
        }
        return this.executeWithoutTransaction(em, cb, options);

      default:
        throw TransactionStateError.invalidPropagation(propagation);
    }
  }


  /**
   * Suspends the current transaction and returns the suspended resources.
   */
  private suspendTransaction(em: EntityManager): unknown {
    const suspended = em.getTransactionContext();
    em.resetTransactionContext();
    return suspended;
  }

  /**
   * Resumes a previously suspended transaction.
   */
  private resumeTransaction(em: EntityManager, suspended: unknown): void {
    if (suspended != null) {
      em.setTransactionContext(suspended!);
    }
  }

  /**
   * Executes operation without transaction context.
   */
  private async executeWithoutTransaction<T>(
    em: EntityManager,
    cb: (em: EntityManager) => T | Promise<T>,
    options: TransactionOptions,
  ): Promise<T> {
    const suspended = this.suspendTransaction(em);
    const fork = this.createFork(em, { ...options, disableTransactions: true } as TransactionOptions);
    const propagateToUpperContext = this.shouldPropagateToUpperContext(em);

    try {
      return await this.executeTransactionFlow(fork, cb, propagateToUpperContext, em);
    } finally {
      this.resumeTransaction(em, suspended);
    }
  }

  /**
   * Creates new independent transaction, suspending any existing one.
   */
  private async executeWithNewTransaction<T>(
    em: EntityManager,
    cb: (em: EntityManager) => T | Promise<T>,
    options: TransactionOptions,
    hasExistingTransaction: boolean,
  ): Promise<T> {
    const fork = this.createFork(em, options);
    let suspended: unknown = null;

    // Suspend existing transaction if present
    if (hasExistingTransaction) {
      suspended = this.suspendTransaction(em);
    }

    const newOptions = { ...options, ctx: undefined };

    try {
      return await this.processTransaction(em, fork, cb, newOptions);
    } finally {
      if (suspended != null) {
        this.resumeTransaction(em, suspended);
      }
    }
  }

  /**
   * Creates new transaction context.
   */
  private async createNewTransaction<T>(
    em: EntityManager,
    cb: (em: EntityManager) => T | Promise<T>,
    options: TransactionOptions,
  ): Promise<T> {
    const fork = this.createFork(em, options);
    return this.processTransaction(em, fork, cb, options);
  }

  /**
   * Executes nested transaction with savepoint.
   */
  private async executeNestedTransaction<T>(
    em: EntityManager,
    cb: (em: EntityManager) => T | Promise<T>,
    options: TransactionOptions,
  ): Promise<T> {
    const fork = this.createFork(em, options);

    // Pass existing context to create savepoint
    const nestedOptions = { ...options, ctx: em.getTransactionContext() };
    return this.processTransaction(em, fork, cb, nestedOptions);
  }

  /**
   * Creates a fork of the EntityManager with the given options.
   */
  private createFork(em: EntityManager, options: TransactionOptions): EntityManager {
    return em.fork({
      clear: options.clear ?? false,
      flushMode: options.flushMode,
      cloneEventManager: true,
      disableTransactions: options.ignoreNestedTransactions,
      loggerContext: options.loggerContext,
    }) as EntityManager;
  }

  /**
   * Determines if changes should be propagated to the upper context.
   */
  private shouldPropagateToUpperContext(em: EntityManager): boolean {
    return !em.global || this.em.config.get('allowGlobalContext');
  }

  /**
   * Merges entities from fork to parent EntityManager.
   */
  private mergeEntitiesToParent(fork: EntityManager, parent: EntityManager): void {
    const parentUoW = parent.getUnitOfWork(false);

    // perf: if parent is empty, we can just move all entities from the fork to skip the `em.merge` overhead
    if (parentUoW.getIdentityMap().keys().length === 0) {
      for (const entity of fork.getUnitOfWork(false).getIdentityMap()) {
        parentUoW.getIdentityMap().store(entity);
        helper(entity).__em = parent;
      }

      return;
    }

    for (const entity of fork.getUnitOfWork(false).getIdentityMap()) {
      const wrapped = helper(entity);
      const meta = wrapped.__meta;
      // eslint-disable-next-line dot-notation
      const parentEntity = parentUoW.getById(meta.className, wrapped.getPrimaryKey(), parent['_schema'], true);

      if (parentEntity && parentEntity !== entity) {
        const parentWrapped = helper(parentEntity);
        parentWrapped.__data = helper(entity).__data;
        parentWrapped.__originalEntityData = helper(entity).__originalEntityData;
      } else {
        parentUoW.merge(entity, new Set([entity]));
      }
   }
  }

  /**
   * Registers a deletion handler to unset entity identities after flush.
   */
  private registerDeletionHandler(fork: EntityManager, parent: EntityManager): void {
    fork.getEventManager().registerSubscriber({
      afterFlush: (args: FlushEventArgs) => {
        const deletionChangeSets = args.uow.getChangeSets()
          .filter(cs => cs.type === ChangeSetType.DELETE || cs.type === ChangeSetType.DELETE_EARLY);

        for (const cs of deletionChangeSets) {
          parent.getUnitOfWork(false).unsetIdentity(cs.entity);
        }
      },
    });
  }

  /**
   * Processes transaction execution.
   */
  private async processTransaction<T>(
    em: EntityManager,
    fork: EntityManager,
    cb: (em: EntityManager) => T | Promise<T>,
    options: TransactionOptions,
  ): Promise<T> {
    const propagateToUpperContext = this.shouldPropagateToUpperContext(em);
    const eventBroadcaster = new TransactionEventBroadcaster(
      fork,
      undefined,
      { topLevelTransaction: !options.ctx },
    );

    return TransactionContext.create(fork, () =>
      fork.getConnection().transactional(async trx => {
        fork.setTransactionContext(trx);
        return this.executeTransactionFlow(fork, cb, propagateToUpperContext, em);
      }, { ...options, eventBroadcaster }),
    );
  }

  /**
   * Executes transaction workflow with entity synchronization.
   */
  private async executeTransactionFlow<T>(
    fork: EntityManager,
    cb: (em: EntityManager) => T | Promise<T>,
    propagateToUpperContext: boolean,
    parentEm: EntityManager,
  ): Promise<T> {
    if (!propagateToUpperContext) {
      const ret = await cb(fork);
      await fork.flush();
      return ret;
    }

    // Setup: Register deletion handler before execution
    this.registerDeletionHandler(fork, parentEm);

    // Execute callback and flush
    const ret = await cb(fork);
    await fork.flush();

    // Synchronization: Merge entities back to the parent
    this.mergeEntitiesToParent(fork, parentEm);

    return ret;
  }

}
