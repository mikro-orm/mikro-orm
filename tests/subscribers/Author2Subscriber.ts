import type { EntityName, EventArgs, EventSubscriber } from '@mikro-orm/core';
import { Subscriber } from '@mikro-orm/core';
import { Author2 } from '../entities-sql';

@Subscriber()
export class Author2Subscriber implements EventSubscriber<Author2> {

  static readonly log: [string, EventArgs<Author2>][] = [];

  getSubscribedEntities(): EntityName<Author2>[] {
    return [Author2];
  }

  async afterCreate(args: EventArgs<Author2>): Promise<void> {
    Author2Subscriber.log.push(['afterCreate', args]);
  }

  async afterDelete(args: EventArgs<Author2>): Promise<void> {
    Author2Subscriber.log.push(['afterDelete', args]);
  }

  async afterUpdate(args: EventArgs<Author2>): Promise<void> {
    Author2Subscriber.log.push(['afterUpdate', args]);
  }

  async beforeCreate(args: EventArgs<Author2>): Promise<void> {
    Author2Subscriber.log.push(['beforeCreate', args]);
  }

  async beforeDelete(args: EventArgs<Author2>): Promise<void> {
    Author2Subscriber.log.push(['beforeDelete', args]);
  }

  async beforeUpdate(args: EventArgs<Author2>): Promise<void> {
    Author2Subscriber.log.push(['beforeUpdate', args]);
  }

  onInit(args: EventArgs<Author2>): void {
    Author2Subscriber.log.push(['onInit', args]);
  }

}
