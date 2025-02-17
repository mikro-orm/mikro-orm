import type { EntityName, EventSubscriber, FlushEventArgs } from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/knex';
import { Test2 } from '../entities-sql/index.js';

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
    // test we can run queries via QB
    await em.createQueryBuilder(Test2).where({ name: '' + Math.random() }).execute('all');
    // test we can run queries via EM that touch context
    await em.findOne(Test2, { name: '' + Math.random() });
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
