import type { Loaded } from '../typings';
import type { FindOptions } from '../drivers/IDatabaseDriver';
import { Utils } from './Utils';
import type { QueryOrder } from '../enums';

export class Cursor<Entity extends object, Hint extends string = never> {

  readonly hasPrevPage: boolean;
  readonly hasNextPage: boolean;

  private readonly definition: (readonly [keyof Entity, QueryOrder])[];

  constructor(
    readonly items: Loaded<Entity, Hint>[],
    readonly totalCount: number,
    options: FindOptions<Entity, Hint>,
  ) {
    const { first, last } = options;
    const limit = first || last;
    const isLast = !first && !!last;
    const hasMorePages = limit != null && items.length > limit;
    this.hasPrevPage = isLast && hasMorePages;
    this.hasNextPage = !isLast && hasMorePages;

    if (hasMorePages) {
      items.pop();
    }

    if (isLast) {
      items.reverse();
    }

    this.definition = Cursor.getDefinition(options);
  }

  get startCursor(): string {
    if (this.items.length === 0) {
      return '';
    }

    return this.encode(this.items[0]);
  }

  get endCursor(): string | undefined {
    if (this.items.length === 0) {
      return '';
    }

    return this.encode(this.items[this.items.length - 1]);
  }

  encode(entity: Entity) {
    return Cursor.encode(this.definition.map(([key]) => entity[key]));
  }

  * [Symbol.iterator](): IterableIterator<Loaded<Entity, Hint>> {
    for (const item of this.items) {
      yield item;
    }
  }

  static encode<Data extends unknown[]>(value: Data): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  static decode<Data extends unknown[]>(value: string): Data {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  }

  static getDefinition<Entity extends object>(options: FindOptions<Entity, any>) {
    return Utils.asArray(options.orderBy).flatMap(order => {
      return Object.keys(order).map(key => [key as keyof Entity, order[key] as QueryOrder] as const);
    });
  }

}
