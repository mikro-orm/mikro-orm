import { EntityName, EventArgs, EventSubscriber, Subscriber } from '@mikro-orm/core';
import { Author } from '../entities';

@Subscriber()
export class AuthorSubscriber implements EventSubscriber<Author> {

  static readonly log: [string, EventArgs<Author>][] = [];

  getSubscribedEntities(): EntityName<Author>[] {
    return [Author];
  }

  async afterCreate(args: EventArgs<Author>): Promise<void> {
    AuthorSubscriber.log.push(['afterCreate', args]);
  }

  async afterDelete(args: EventArgs<Author>): Promise<void> {
    AuthorSubscriber.log.push(['afterDelete', args]);
  }

  async afterUpdate(args: EventArgs<Author>): Promise<void> {
    AuthorSubscriber.log.push(['afterUpdate', args]);
  }

  async beforeCreate(args: EventArgs<Author>): Promise<void> {
    AuthorSubscriber.log.push(['beforeCreate', args]);
  }

  async beforeDelete(args: EventArgs<Author>): Promise<void> {
    AuthorSubscriber.log.push(['beforeDelete', args]);
  }

  async beforeUpdate(args: EventArgs<Author>): Promise<void> {
    AuthorSubscriber.log.push(['beforeUpdate', args]);
  }

  onInit(args: EventArgs<Author>): void {
    AuthorSubscriber.log.push(['onInit', args]);
  }

}
