import type { EntityManager } from '../EntityManager.js';
import { ReferenceKind, type TransactionOptions, TransactionPropagation } from '../enums.js';
import { type FlushEventArgs } from '../events/EventSubscriber.js';
import { TransactionEventBroadcaster } from '../events/TransactionEventBroadcaster.js';
import { TransactionContext } from '../utils/TransactionContext.js';
import { ChangeSetType } from '../unit-of-work/ChangeSet.js';
import { TransactionStateError } from '../errors.js';
import type { Transaction } from '../connections/Connection.js';
import { helper } from '../entity/wrap.js';
import type { Collection } from '../entity/Collection.js';
import type { AnyEntity, Dictionary, EntityData, EntityProperty } from '../typings.js';

/** Maps a transactional fork to the fork that started its database transaction, savepoints share the root. */
const transactionRoots = new WeakMap<EntityManager, EntityManager>();

/**
 * Manages transaction lifecycle and propagation for EntityManager.
 */
export class TransactionManager {
  constructor(private readonly em: EntityManager) {}

  /**
   * Main entry point for handling transactional operations with propagation support.
   */
  async handle<T>(cb: (em: EntityManager) => T | Promise<T>, options: TransactionOptions = {}): Promise<T> {
    const em = this.em.getContext(false);
    options.propagation ??= TransactionPropagation.NESTED;
    options.ctx ??= em.getTransactionContext();
    const hasExistingTransaction = !!em.getTransactionContext();

    return this.executeWithPropagation(options.propagation, em, cb, options, hasExistingTransaction);
  }

  /**
   * Executes the callback with the specified propagation type.
   */
  private async executeWithPropagation<T>(
    propagation: TransactionPropagation | `${TransactionPropagation}`,
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
      em.setTransactionContext(suspended);
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
    const fork = this.createFork(em, options);
    const propagateToUpperContext = this.shouldPropagateToUpperContext(em);

    try {
      return await TransactionContext.create(fork, () =>
        this.executeTransactionFlow(fork, cb, propagateToUpperContext, em),
      );
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
      signal: options.signal,
      inflightQueryAbortStrategy: options.inflightQueryAbortStrategy,
    });
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
      const parentEntity = parentUoW.getIdentityMap().getByEntity(entity);

      if (parentEntity && parentEntity !== entity) {
        const parentWrapped = helper(parentEntity);

        // Don't overwrite a fully-loaded entity with an uninitialized reference
        if (!wrapped.__initialized && parentWrapped.__initialized) {
          continue;
        }
        const parentData = parentWrapped.__data;
        const parentSnapshot = parentWrapped.__originalEntityData;
        parentWrapped.__data = { ...wrapped.__data };
        const originalEntityData = { ...wrapped.__originalEntityData } as Dictionary;

        for (const prop of meta.hydrateProps) {
          const tracked = this.getTrackedValues(prop, entity[prop.name]);

          // the fork entity can be partially loaded, and propagating a property it does not know about
          // would clobber the parent state, so we restore both its value and its snapshot entries
          if (!tracked.every(([key, value]) => value !== undefined || wrapped.__loadedProperties.has(key))) {
            this.restore(parentWrapped.__data, parentData, prop.name);
            tracked.forEach(([key]) => this.restore(originalEntityData, parentSnapshot, key));

            continue;
          }

          // only to-one relations with an inverse side are backed by `__data`, other values live on the entity itself
          if (
            ![ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind) &&
            (!(prop.inversedBy || prop.mappedBy) || prop.mapToPk)
          ) {
            (parentEntity as Dictionary)[prop.name] = entity[prop.name];
          }
        }

        if (wrapped.__originalEntityData) {
          parentWrapped.__originalEntityData = originalEntityData;
        }

        // index a merged `targetKey` value, `getByKey` ignores the old one as stale
        if (meta.root.targetKeys) {
          parentUoW.getIdentityMap().store(parentEntity);
        }
      } else {
        parentUoW.merge(entity, new Set([entity]));
      }
    }
  }

  /**
   * Returns the property names a given property is tracked and snapshotted under, paired with their values.
   * Inlined embeddables are hydrated as a single object, so only their leaves tell whether it is complete.
   */
  private getTrackedValues(prop: EntityProperty, value: unknown): [string, unknown][] {
    if (prop.kind === ReferenceKind.EMBEDDED && !prop.object) {
      return Object.values(prop.embeddedProps).flatMap(child => {
        return this.getTrackedValues(child, (value as Dictionary)?.[child.embedded![1]]);
      });
    }

    return [[prop.name, value]];
  }

  private restore(target: Dictionary, source: Dictionary | undefined, key: string): void {
    if (source && key in source) {
      target[key] = source[key];
    } else {
      delete target[key];
    }
  }

  /**
   * Tracks entities deleted by the fork, the returned callback unsets their identity in the parent.
   */
  private registerDeletionHandler(fork: EntityManager, parent: EntityManager): () => void {
    const deleted = new Set<AnyEntity>();
    fork.getEventManager().registerSubscriber({
      afterFlush: (args: FlushEventArgs) => {
        for (const cs of args.uow.getChangeSets()) {
          if (cs.type === ChangeSetType.DELETE || cs.type === ChangeSetType.DELETE_EARLY) {
            deleted.add(cs.entity);
          } else if (cs.type === ChangeSetType.CREATE) {
            deleted.delete(cs.entity);
          }
        }
      },
    });

    return () => deleted.forEach(entity => parent.getUnitOfWork(false).unsetIdentity(entity));
  }

  /**
   * Tracks the state of everything the fork flushes, the returned callback reverts it. Entities are shared
   * with the parent, so once the fork's transaction is rolled back, they would be seen as already persisted.
   */
  private registerRollbackHandler(fork: EntityManager, parent: EntityManager): () => void {
    const entities = new Map<
      AnyEntity,
      { snapshot?: EntityData<AnyEntity>; managed: boolean; pks: string[]; version: unknown }
    >();
    const collections = new Map<Collection<AnyEntity>, AnyEntity[] | undefined>();
    const root = transactionRoots.get(fork);
    fork.getEventManager().registerSubscriber({
      onFlush: (args: FlushEventArgs) => {
        // nested forks inherit this subscriber, but those outside of this transaction are not rolled back with it
        if (transactionRoots.get(args.em) !== root) {
          return;
        }

        for (const cs of args.uow.getChangeSets()) {
          if (entities.has(cs.entity)) {
            continue;
          }

          const wrapped = helper(cs.entity);
          const deletion = cs.type === ChangeSetType.DELETE || cs.type === ChangeSetType.DELETE_EARLY;
          entities.set(cs.entity, {
            // the snapshot of created and updated entities is already overwritten when the change set is computed
            snapshot: deletion ? wrapped.__originalEntityData : cs.originalEntity,
            managed: wrapped.__managed,
            pks: cs.meta.primaryKeys.filter(pk => cs.entity[pk] == null),
            version: cs.entity[wrapped.__meta.versionProperty],
          });
        }

        for (const coll of args.uow.getCollectionUpdates()) {
          if (!collections.has(coll)) {
            collections.set(coll, coll.getSnapshot());
          }
        }
      },
    });

    return () => {
      const parentUoW = parent.getUnitOfWork(false);

      for (const [entity, { snapshot, managed, pks, version }] of entities) {
        const wrapped = helper(entity);

        // entities created by the fork could be already merged to the parent if the commit itself failed
        if (!managed && !parentUoW.getPersistStack().has(entity)) {
          parentUoW.getIdentityMap().delete(entity);
        }

        wrapped.__originalEntityData = snapshot;
        wrapped.__managed = managed;

        // the version was bumped by the flush, and would no longer match the database
        if (wrapped.__meta.versionProperty) {
          entity[wrapped.__meta.versionProperty] = version;
        }

        if (pks.length > 0) {
          pks.forEach(pk => delete entity[pk]);
          wrapped.__identifier = undefined;
        }
      }

      collections.forEach((snapshot, coll) => coll.restoreSnapshot(snapshot));
    };
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
    const eventBroadcaster = new TransactionEventBroadcaster(fork, undefined);
    transactionRoots.set(fork, (options.ctx && transactionRoots.get(em)) || fork);
    const revertFlushedState = this.registerRollbackHandler(fork, em);

    try {
      return await TransactionContext.create(fork, () =>
        fork.getConnection().transactional(
          async (trx: Transaction) => {
            fork.setTransactionContext(trx);
            return this.executeTransactionFlow(fork, cb, propagateToUpperContext, em);
          },
          { sessionContext: fork.getTransactionSessionContext(), ...options, eventBroadcaster },
        ),
      );
    } catch (e) {
      revertFlushedState();
      throw e;
    }
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
    const unsetDeletedEntities = this.registerDeletionHandler(fork, parentEm);

    // Execute callback and flush
    const ret = await cb(fork);
    await fork.flush();

    // Synchronization: Merge entities back to the parent
    unsetDeletedEntities();
    this.mergeEntitiesToParent(fork, parentEm);

    return ret;
  }
}
