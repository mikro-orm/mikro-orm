import type { EventArgs, EventSubscriber } from '@mikro-orm/core';

export class EverythingSubscriber implements EventSubscriber {

  static readonly log: [string, EventArgs<any>][] = [];

  async afterCreate<T>(args: EventArgs<T>): Promise<void> {
    EverythingSubscriber.log.push(['afterCreate', args]);
  }

  async afterDelete<T>(args: EventArgs<T>): Promise<void> {
    EverythingSubscriber.log.push(['afterDelete', args]);
  }

  async afterUpdate<T>(args: EventArgs<T>): Promise<void> {
    EverythingSubscriber.log.push(['afterUpdate', args]);
  }

  async beforeCreate<T>(args: EventArgs<T>): Promise<void> {
    EverythingSubscriber.log.push(['beforeCreate', args]);
  }

  async beforeDelete<T>(args: EventArgs<T>): Promise<void> {
    EverythingSubscriber.log.push(['beforeDelete', args]);
  }

  async beforeUpdate<T>(args: EventArgs<T>): Promise<void> {
    EverythingSubscriber.log.push(['beforeUpdate', args]);
  }

  async onLoad<T>(args: EventArgs<T>): Promise<void> {
    EverythingSubscriber.log.push(['onLoad', args]);
  }

  onInit<T>(args: EventArgs<T>): void {
    EverythingSubscriber.log.push(['onInit', args]);
  }

}
