import { Transaction } from '../connections';
import { EntityManager } from '../EntityManager';
import { TransactionEventType } from '../enums';
import { UnitOfWork } from '../unit-of-work';

export class TransactionEventBroadcaster {

  private readonly eventManager = this.em.getEventManager();

  constructor(private readonly em: EntityManager,
              private readonly uow?: UnitOfWork) {}

  async dispatchEvent(event: TransactionEventType, transaction?: Transaction) {
    await this.eventManager.dispatchEvent(event, { em: this.em, transaction, uow: this.uow });
  }

}
