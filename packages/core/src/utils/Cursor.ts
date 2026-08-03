import type { Dictionary, EntityKey, EntityMetadata, EntityProperty, FilterObject, Loaded } from '../typings.js';
import type { FindByCursorOptions, OrderDefinition } from '../drivers/IDatabaseDriver.js';
import { Utils } from './Utils.js';
import { ReferenceKind, type QueryOrder, type QueryOrderKeys } from '../enums.js';
import { Reference } from '../entity/Reference.js';
import { helper } from '../entity/wrap.js';
import { Raw } from '../utils/RawQueryFragment.js';
import { CursorError } from '../errors.js';
import { inspect } from '../logging/inspect.js';

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
  Fields extends string = never,
  Excludes extends string = never,
  IncludeCount extends boolean = true,
> {
  readonly hasPrevPage: boolean;
  readonly hasNextPage: boolean;

  readonly #definition: (readonly [EntityKey<Entity>, QueryOrder])[];
  readonly #meta: EntityMetadata<Entity>;

  constructor(
    readonly items: Loaded<Entity, Hint, Fields, Excludes>[],
    readonly totalCount: IncludeCount extends true ? number : undefined,
    options: FindByCursorOptions<Entity, Hint, Fields, Excludes, IncludeCount>,
    meta: EntityMetadata<Entity>,
  ) {
    const { first, last, before, after, orderBy, overfetch } = options;
    const limit = first ?? last;
    const isLast = !first && !!last;
    const hasMorePages = !!overfetch && limit != null && items.length > limit;
    this.hasPrevPage = isLast ? hasMorePages : !!after;
    this.hasNextPage = isLast ? !!before : hasMorePages;

    if (hasMorePages) {
      if (isLast) {
        items.shift();
      } else {
        items.pop();
      }
    }

    this.#definition = Cursor.getDefinition(meta, orderBy!);
    this.#meta = meta;
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
  from(entity: Entity | Loaded<Entity, Hint, Fields, Excludes>): string {
    const value = this.#definition.map(([key, direction]) =>
      Cursor.serialize(this.#meta.properties as Dictionary<EntityProperty>, entity as Entity, key, direction),
    );
    return Cursor.encode(value);
  }

  /** Serializes a single cursor value, walking nested directions and reading the owner's properties. */
  private static serialize<T extends object>(
    properties: Dictionary<EntityProperty>,
    owner: T,
    key: EntityKey<T>,
    direction: unknown,
  ): unknown {
    const prop = properties[key as string];
    let value: unknown = owner[key];

    if (Utils.isPlainObject(direction)) {
      const unwrapped: unknown = Reference.unwrapReference(value as object);

      // for nested properties, an uninitialized relation means not populated
      if (Utils.isEntity(unwrapped) && !helper(unwrapped).isInitialized()) {
        throw CursorError.entityNotPopulated(owner, key as string);
      }

      if (unwrapped == null || typeof unwrapped !== 'object') {
        return unwrapped;
      }

      const childProps = prop?.kind === ReferenceKind.EMBEDDED ? prop.embeddedProps : prop?.targetMeta?.properties;

      return Utils.keys(direction).reduce((o, childKey) => {
        o[childKey as string] = Cursor.serialize(
          childProps ?? {},
          unwrapped as Dictionary,
          childKey as string,
          (direction as Dictionary)[childKey as string],
        );
        return o;
      }, {} as Dictionary);
    }

    // allow null/undefined values in cursor - they will be handled in createCursorCondition
    // undefined can occur with forceUndefined config option which converts null to undefined
    if (value == null) {
      return null;
    }

    if (Utils.isEntity(value, true)) {
      value = helper(value).getPrimaryKey();
    }

    if (Utils.isScalarReference(value)) {
      value = value.unwrap();
    }

    // only types implementing `fromJSON` own their wire format, others keep the raw JS value,
    // so their cursors stay decodable by the `convertToJSValue` fallback
    if (prop?.customType?.fromJSON) {
      // the platform is assigned to the type instance during discovery
      return prop.customType.toJSON(value as never, prop.customType.platform!);
    }

    return value;
  }

  *[Symbol.iterator](): IterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
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
  static for<Entity extends object>(
    meta: EntityMetadata<Entity>,
    entity: FilterObject<Entity>,
    orderBy: OrderDefinition<Entity>,
  ): string {
    const definition = this.getDefinition(meta, orderBy);

    return Cursor.encode(
      definition.map(([key, direction]) => {
        if (entity[key] === undefined) {
          throw CursorError.missingValue(meta.className, key as string);
        }

        return this.serialize(meta.properties as Dictionary<EntityProperty>, entity as object, key as never, direction);
      }),
    );
  }

  static encode(value: unknown[]): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  static decode(value: string): unknown[] {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  }

  static getDefinition<Entity extends object>(
    meta: EntityMetadata<Entity>,
    orderBy: OrderDefinition<Entity>,
  ): [EntityKey, QueryOrder][] {
    return Utils.asArray(orderBy).flatMap(order => {
      const ret: [EntityKey, QueryOrder][] = [];

      for (const key of Utils.getObjectQueryKeys(order)) {
        if (Raw.isKnownFragmentSymbol(key)) {
          ret.push([key as EntityKey, order[key as unknown as EntityKey] as QueryOrder]);
          continue;
        }

        const prop = meta.properties[key];

        /* v8 ignore next */
        if (
          !prop ||
          !(
            [ReferenceKind.SCALAR, ReferenceKind.EMBEDDED, ReferenceKind.MANY_TO_ONE].includes(prop.kind) ||
            (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner)
          )
        ) {
          continue;
        }

        ret.push([prop.name as EntityKey, order[prop.name] as QueryOrder]);
      }

      return ret;
    });
  }

  /** @ignore */
  /* v8 ignore next */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    const type = this.items[0]?.constructor.name;
    const { items, startCursor, endCursor, hasPrevPage, hasNextPage, totalCount, length } = this;
    const options = inspect(
      { startCursor, endCursor, totalCount, hasPrevPage, hasNextPage, items, length },
      { depth: 0 },
    );
    return `Cursor${type ? `<${type}>` : ''} ${options.replace('items: [Array]', 'items: [...]')}`;
  }
}
