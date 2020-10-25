import domain, { Domain } from 'domain';
import { EntityManager } from '../EntityManager';
import { Dictionary } from '../typings';

export type TXDomain = Domain & { __mikro_orm_tx_context?: TransactionContext };

export class TransactionContext {

  readonly id = this.em.id;

  constructor(readonly em: EntityManager) { }

  /**
   * Creates new TransactionContext instance and runs the code inside its domain.
   */
  static async createAsync<T>(em: EntityManager, next: (...args: any[]) => Promise<T>): Promise<T> {
    const context = new TransactionContext(em);
    const old = (domain as Dictionary).active;
    const d = domain.create() as TXDomain;
    Object.assign(d, old);
    d.__mikro_orm_tx_context = context;

    return new Promise((resolve, reject) => {
      d.run(() => next().then(resolve).catch(reject));
    });
  }

  /**
   * Returns current TransactionContext (if available).
   */
  static currentTransactionContext(): TransactionContext | undefined {
    const active = (domain as Dictionary).active as TXDomain;
    return active ? active.__mikro_orm_tx_context : undefined;
  }

  /**
   * Returns current EntityManager (if available).
   */
  static getEntityManager(): EntityManager | undefined {
    const context = TransactionContext.currentTransactionContext();
    return context ? context.em : undefined;
  }

}
