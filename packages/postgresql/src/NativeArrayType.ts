import type { Constructor, EntityProperty, Platform, TransformContext } from '@mikro-orm/core';
import { Type } from '@mikro-orm/core';

/**
 * Maps a PostgreSQL native typed array column (e.g. `integer[]`, `decimal(10,2)[]`) to a JS array.
 *
 * Unlike the core `ArrayType` which always uses a `text[]` column and marshalls values to/from
 * a delimited string, `NativeArrayType` derives the element column type from the supplied inner
 * type and appends `[]`, producing a proper PostgreSQL typed array column. Per-element conversion
 * is delegated to the inner type, so features like `DecimalType`'s precision-aware comparison
 * continue to work on each element.
 *
 * The `nullable` decorator/defineEntity option applies to the array column itself (i.e. the
 * column may be `NULL`), while all other property options (e.g. `precision`, `scale`) are
 * forwarded to the inner type when determining the element column type.
 *
 * @example
 * // integer[] column
 * @Property({ type: new NativeArrayType(types.integer) })
 * ids!: number[];
 *
 * @example
 * // decimal(10,2)[] column
 * @Property({ type: new NativeArrayType(new DecimalType('number')), precision: 10, scale: 2 })
 * prices!: number[];
 */
export class NativeArrayType<InnerJsType, InnerDbType> extends Type<InnerJsType[] | null, InnerDbType[] | null> {
  readonly #inner: Type<InnerJsType, InnerDbType>;

  constructor(inner: Constructor<Type<InnerJsType, InnerDbType>> | Type<InnerJsType, InnerDbType>) {
    super();
    this.#inner = inner instanceof Type ? inner : new inner();

    for (const key of ['platform', 'meta', 'prop'] as const) {
      Object.defineProperty(this, key, {
        get: () => this.#inner[key],
        set: (value) => this.#inner.prop = key === 'prop' ? { ...value, autoincrement: false } : value,
        enumerable: true,
        configurable: true,
      });
    }
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    const innerProp = { ...prop, autoincrement: false };
    return `${this.#inner.getColumnType(innerProp, platform)}[]`;
  }

  override convertToDatabaseValue(
    value: InnerJsType[] | null,
    platform: Platform,
    context?: TransformContext,
  ): InnerDbType[] | null {
    if (value == null) {
      return value;
    }

    return value.map(item => this.#inner.convertToDatabaseValue(item, platform, context));
  }

  override convertToJSValue(
    value: InnerDbType[] | null,
    platform: Platform,
  ): InnerJsType[] | null {
    if (value == null) {
      return value;
    }

    return value.map(item => this.#inner.convertToJSValue(item, platform));
  }

  override compareAsType(): string {
    return 'array';
  }

  override toJSON(value: InnerJsType[] | null, platform: Platform): InnerJsType[] | InnerDbType[] | null {
    if (value == null) {
      return value;
    }

    return value.map(item => this.#inner.toJSON(item, platform)) as InnerJsType[] | InnerDbType[];
  }
}
