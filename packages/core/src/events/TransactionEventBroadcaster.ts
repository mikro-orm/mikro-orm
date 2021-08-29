import type { Transaction } from '../connections';
import type { EntityManager } from '../EntityManager';
import type { TransactionEventType } from '../enums';
import type { UnitOfWork } from '../unit-of-work';

export class TransactionEventBroadcaster {

  private readonly eventManager = this.em.getEventManager();

  constructor(private readonly em: EntityManager,
              private readonly uow?: UnitOfWork) {}

  async dispatchEvent(event: TransactionEventType, transaction?: Transaction) {
    await this.eventManager.dispatchEvent(event, { em: this.em, transaction, uow: this.uow });
  }

}
