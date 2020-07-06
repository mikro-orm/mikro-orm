import { EventSubscriber, FlushEventArgs, Subscriber } from '@mikro-orm/core';

@Subscriber()
export class FlushSubscriber implements EventSubscriber {

  static readonly log: [string, FlushEventArgs][] = [];

  async beforeFlush(args: FlushEventArgs): Promise<void> {
    FlushSubscriber.log.push(['beforeFlush', args]);
  }

  async onFlush(args: FlushEventArgs): Promise<void> {
    FlushSubscriber.log.push(['onFlush', args]);
  }

  async afterFlush(args: FlushEventArgs): Promise<void> {
    FlushSubscriber.log.push(['afterFlush', args]);
  }

}
