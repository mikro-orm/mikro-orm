import { AsyncLocalStorage } from 'async_hooks';
import type { EntityManager } from '../EntityManager';

export class TransactionContext {

  private static storage = new AsyncLocalStorage<TransactionContext>();
  readonly id: number;

  constructor(readonly em: EntityManager) {
    this.id = this.em._id;
  }

  /**
   * Creates new TransactionContext instance and runs the code inside its domain.
   */
  static create<T>(em: EntityManager, next: (...args: any[]) => T): T {
    const context = new TransactionContext(em);
    return this.storage.run(context, next);
  }

  /**
   * Returns current TransactionContext (if available).
   */
  static currentTransactionContext(): TransactionContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Returns current EntityManager (if available).
   */
  static getEntityManager(name = /* istanbul ignore next */ 'default'): EntityManager | undefined {
    const context = TransactionContext.currentTransactionContext();
    return context?.em.name === name ? context.em : undefined;
  }

}
