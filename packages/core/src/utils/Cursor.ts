import { inspect } from 'util';
import type { Loaded } from '../typings';
import type { FindByCursorOptions, OrderDefinition } from '../drivers/IDatabaseDriver';
import { Utils } from './Utils';
import type { QueryOrder } from '../enums';

/**
 * As an alternative to the offset based pagination with `limit` and `offset`, we can paginate based on a cursor.
 * A cursor is an opaque string that defines specific place in ordered entity graph. You can use `em.findByCursor()`
 * to access those options. Under the hood, it will call `em.find()` and `em.count()` just like the `em.findAndCount()`
 * method, but will use the cursor options instead.
 *
 * Supports `before`, `after`, `first` and `last` options while disallowing `limit` and `offset`. Explicit `orderBy` option is required.
 *
 * Use `first` and `after` for forward pagination, or `last` and `before` for backward pagination.
 *
 * - `first` and `last` are numbers and serve as an alternative to `offset`, those options are mutually exclusive, use only one at a time
 * - `before` and `after` specify the previous cursor value
 *
 * ```ts
 * const currentCursor = await em.findByCursor(User, {}, {
 *   first: 10,
 *   after: previousCursor, // can be either string or `Cursor` instance
 *   orderBy: { id: 'desc' },
 * });
 *
 * // to fetch next page
 * const nextCursor = await em.findByCursor(User, {}, {
 *   first: 10,
 *   after: currentCursor.endCursor, // or currentCursor.endCursor
 *   orderBy: { id: 'desc' },
 * });
 * ```
 *
 * The `Cursor` object provides following interface:
 *
 * ```ts
 * Cursor<User> {
 *   items: [
 *     User { ... },
 *     User { ... },
 *     User { ... },
 *     ...
 *   ],
 *   totalCount: 50,
 *   length: 10,
 *   startCursor: 'WzRd',
 *   endCursor: 'WzZd',
 *   hasPrevPage: true,
 *   hasNextPage: true,
 * }
 * ```
 *
 * - `before` and `after` take the cursor type as described in the cursor field section.
 * - `first` takes a non-negative integer.
 */
export class Cursor<Entity extends object, Hint extends string = never> {

  readonly hasPrevPage: boolean;
  readonly hasNextPage: boolean;

  private readonly definition: (readonly [keyof Entity, QueryOrder])[];

  constructor(
    readonly items: Loaded<Entity, Hint>[],
    readonly totalCount: number,
    options: FindByCursorOptions<Entity, Hint>,
  ) {
    const { first, last, orderBy } = options;
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

    this.definition = Cursor.getDefinition(orderBy!);
  }

  get startCursor(): string | null {
    if (this.items.length === 0) {
      return null;
    }

    return this.for(this.items[0]);
  }

  get endCursor(): string | null {
    if (this.items.length === 0) {
      return null;
    }

    return this.for(this.items[this.items.length - 1]);
  }

  /**
   * Computes the cursor value for given entity.
   */
  for(entity: Entity) {
    return Cursor.encode(this.definition.map(([key]) => entity[key]));
  }

  * [Symbol.iterator](): IterableIterator<Loaded<Entity, Hint>> {
    for (const item of this.items) {
      yield item;
    }
  }

  get length(): number {
    return this.items.length;
  }

  /**
   * Computes the cursor value for given entity and order definition.
   */
  static for<Entity extends object>(entity: Entity, orderBy: OrderDefinition<Entity>) {
    const definition = this.getDefinition(orderBy);
    return Cursor.encode(definition.map(([key]) => entity[key]));
  }

  static encode(value: unknown[]): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  static decode(value: string): unknown[] {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  }

  static getDefinition<Entity extends object>(orderBy: OrderDefinition<Entity>) {
    return Utils.asArray(orderBy).flatMap(order => {
      return Object.keys(order).map(key => [key as keyof Entity, order[key] as QueryOrder] as const);
    });
  }

  /* istanbul ignore next */
  [inspect.custom]() {
    const type = this.items[0]?.constructor.name;
    const { items, startCursor, endCursor, hasPrevPage, hasNextPage, totalCount, length } = this;
    const options = inspect({ startCursor, endCursor, totalCount, hasPrevPage, hasNextPage, items, length }, { depth: 0 });
    return `Cursor${type ? `<${type}>` : ''} ${options.replace('items: [Array]', 'items: [...]')}`;
  }

}
