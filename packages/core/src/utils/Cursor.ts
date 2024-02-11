import { inspect } from 'util';
import type { Dictionary, EntityKey, EntityMetadata, FilterObject, Loaded } from '../typings';
import type { FindByCursorOptions, OrderDefinition } from '../drivers/IDatabaseDriver';
import { Utils } from './Utils';
import { ReferenceKind, type QueryOrder, type QueryOrderKeys } from '../enums';
import { Reference } from '../entity/Reference';
import { helper } from '../entity/wrap';
import { RawQueryFragment } from '../utils/RawQueryFragment';
import { CursorError } from '../errors';

/**
 * As an alternative to the offset-based pagination with `limit` and `offset`, we can paginate based on a cursor.
 * A cursor is an opaque string that defines a specific place in ordered entity graph. You can use `em.findByCursor()`
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
 * The `Cursor` object provides the following interface:
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
 */
export class Cursor<
  Entity extends object,
  Hint extends string = never,
  Fields extends string = '*',
  Excludes extends string = never,
> {

  readonly hasPrevPage: boolean;
  readonly hasNextPage: boolean;

  private readonly definition: (readonly [EntityKey<Entity>, QueryOrder])[];

  constructor(
    readonly items: Loaded<Entity, Hint, Fields, Excludes>[],
    readonly totalCount: number,
    options: FindByCursorOptions<Entity, Hint, Fields, Excludes>,
    meta: EntityMetadata<Entity>,
  ) {
    const { first, last, before, after, orderBy, overfetch } = options;
    const limit = first || last;
    const isLast = !first && !!last;
    const hasMorePages = !!overfetch && limit != null && items.length > limit;
    this.hasPrevPage = before || after ? true : (isLast && hasMorePages);
    this.hasNextPage = !(isLast && !before && !after) && hasMorePages;

    if (hasMorePages) {
      if (isLast) {
        items.shift();
      } else {
        items.pop();
      }
    }

    this.definition = Cursor.getDefinition(meta, orderBy!);
  }

  get startCursor(): string | null {
    if (this.items.length === 0) {
      return null;
    }

    return this.from(this.items[0]);
  }

  get endCursor(): string | null {
    if (this.items.length === 0) {
      return null;
    }

    return this.from(this.items[this.items.length - 1]);
  }

  /**
   * Computes the cursor value for a given entity.
   */
  from(entity: Entity | Loaded<Entity, Hint, Fields, Excludes>) {
    const processEntity = <T extends object> (entity: T, prop: EntityKey<T>, direction: QueryOrderKeys<T>, object = false) => {
      if (Utils.isPlainObject(direction)) {
        const value = Utils.keys(direction).reduce((o, key) => {
          Object.assign(o, processEntity(Reference.unwrapReference(entity[prop] as T), key as EntityKey<T>, direction[key] as QueryOrderKeys<T>, true));
          return o;
        }, {} as Dictionary);
        return ({ [prop]: value });
      }

      if (entity[prop] == null) {
        throw CursorError.entityNotPopulated(entity, prop);
      }

      let value: unknown = entity[prop];

      if (Utils.isEntity(value, true)) {
        value = helper(value).getPrimaryKey();
      }

      if (object) {
        return ({ [prop]: value });
      }

      return value;
    };
    const value = this.definition.map(([key, direction]) => processEntity(entity as Entity, key, direction));
    return Cursor.encode(value);
  }

  * [Symbol.iterator](): IterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
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
  static for<Entity extends object>(meta: EntityMetadata<Entity>, entity: FilterObject<Entity>, orderBy: OrderDefinition<Entity>) {
    const definition = this.getDefinition(meta, orderBy);
    return Cursor.encode(definition.map(([key]) => entity[key]));
  }

  static encode(value: unknown[]): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  static decode(value: string): unknown[] {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  }

  static getDefinition<Entity extends object>(meta: EntityMetadata<Entity>, orderBy: OrderDefinition<Entity>) {
    return Utils.asArray(orderBy).flatMap(order => {
      const ret: [EntityKey, QueryOrder][] = [];

      for (const key of Utils.keys(order)) {
        if (RawQueryFragment.isKnownFragment(key)) {
          ret.push([key as EntityKey, order[key] as QueryOrder]);
          continue;
        }

        const prop = meta.properties[key];

        if (!prop || !([ReferenceKind.SCALAR, ReferenceKind.EMBEDDED, ReferenceKind.MANY_TO_ONE].includes(prop.kind) || (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner))) {
          continue;
        }

        ret.push([prop.name as EntityKey, order[prop.name] as QueryOrder]);
      }

      return ret;
    });
  }

  /* istanbul ignore next */
  /** @ignore */
  [inspect.custom]() {
    const type = this.items[0]?.constructor.name;
    const { items, startCursor, endCursor, hasPrevPage, hasNextPage, totalCount, length } = this;
    const options = inspect({ startCursor, endCursor, totalCount, hasPrevPage, hasNextPage, items, length }, { depth: 0 });
    return `Cursor${type ? `<${type}>` : ''} ${options.replace('items: [Array]', 'items: [...]')}`;
  }

}
