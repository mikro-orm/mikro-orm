import { AsyncLocalStorage } from 'async_hooks';
import type { EntityManager } from '../EntityManager';

export class TransactionContext {

  private static storage = new AsyncLocalStorage<TransactionContext>();
  readonly id = this.em.id;

  constructor(readonly em: EntityManager) { }

  /**
   * Creates new TransactionContext instance and runs the code inside its domain.
   */
  static async createAsync<T>(em: EntityManager, next: (...args: any[]) => Promise<T>): Promise<T> {
    const context = new TransactionContext(em);

    return new Promise((resolve, reject) => {
      this.storage.run(context, () => next().then(resolve).catch(reject));
    });
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
  static getEntityManager(): EntityManager | undefined {
    const context = TransactionContext.currentTransactionContext();
    return context ? context.em : undefined;
  }

}
