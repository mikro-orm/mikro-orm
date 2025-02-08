import type { Transaction } from '../connections';
import type { EntityManager } from '../EntityManager';
import type { TransactionEventType } from '../enums';

export class TransactionEventBroadcaster {

  constructor(
    private readonly em: EntityManager,
    readonly context?: { topLevelTransaction?: boolean },
  ) {}

  async dispatchEvent(event: TransactionEventType, transaction?: Transaction) {
    await this.em.getEventManager().dispatchEvent(event, {
      em: this.em,
      uow: this.em.getUnitOfWork(false),
      transaction,
    });
  }

}
