import type { Transaction } from '../connections/Connection.js';
import type { EntityManager } from '../EntityManager.js';
import type { TransactionEventType } from '../enums.js';

/** Broadcasts transaction lifecycle events (start, commit, rollback) through the EventManager. */
export class TransactionEventBroadcaster {
  constructor(
    private readonly em: EntityManager,
    readonly context?: { topLevelTransaction?: boolean },
  ) {}

  /** Dispatches a transaction lifecycle event to the EventManager. */
  async dispatchEvent(event: TransactionEventType, transaction?: Transaction) {
    await this.em.getEventManager().dispatchEvent(event, {
      em: this.em,
      uow: this.em.getUnitOfWork(false),
      transaction,
    });
  }
}
