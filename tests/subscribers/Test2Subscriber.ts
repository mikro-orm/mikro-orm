import type { EntityName, EventSubscriber, FlushEventArgs } from '@mikro-orm/core';
import { Subscriber } from '@mikro-orm/core';
import { Test2 } from '../entities-sql';
import type { SqlEntityManager } from '@mikro-orm/knex';

@Subscriber()
export class Test2Subscriber implements EventSubscriber<Test2> {

  static readonly log: [string, FlushEventArgs][] = [];

  getSubscribedEntities(): EntityName<Test2>[] {
    return [Test2];
  }

  private async fireQuery(method: string, args: FlushEventArgs): Promise<void> {
    if (!args.uow.getChangeSets().some(cs => cs.entity instanceof Test2)) {
      return;
    }

    const em = args.em as SqlEntityManager;
    await em.createQueryBuilder(Test2).where({ name: '' + Math.random() }).execute('all');
    Test2Subscriber.log.push([method, args]);
  }

  async beforeFlush(args: FlushEventArgs): Promise<void> {
    await this.fireQuery('beforeFlush', args);
  }

  async onFlush(args: FlushEventArgs): Promise<void> {
    await this.fireQuery('onFlush', args);
  }

  async afterFlush(args: FlushEventArgs): Promise<void> {
    await this.fireQuery('afterFlush', args);
  }

}
