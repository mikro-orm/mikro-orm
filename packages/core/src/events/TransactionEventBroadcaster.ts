import { Transaction } from '../connections';
import { EntityManager } from '../EntityManager';
import { TransactionEventType } from '../enums';
import { UnitOfWork } from '../unit-of-work';

export class TransactionEventBroadcaster {

  constructor(
    private entityManager: EntityManager,
    private uow?: UnitOfWork
  ) {}

  async dispatchEvent(event: TransactionEventType, transaction?: Transaction) {
    await this.entityManager.getEventManager().dispatchEvent(event, { em: this.entityManager, transaction, uow: this.uow });
  }

}
