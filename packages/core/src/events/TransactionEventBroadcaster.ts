import { Transaction } from '../connections';
import { EntityManager } from '../EntityManager';
import { TransactionEventType } from '../enums';

export class TransactionEventBroadcaster {

  constructor(
    private entityManager: EntityManager
  ) {}

  async dispatchEvent(event: TransactionEventType, transaction?: Transaction) {
    await this.entityManager.getEventManager().dispatchEvent(event, { em: this.entityManager, transaction });
  }

}
