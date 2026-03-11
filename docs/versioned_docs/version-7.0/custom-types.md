---
title: Custom Types
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

You can define custom types by extending `Type` abstract class. It has several optional methods:

- `convertToDatabaseValue(value: any, platform: Platform): any`

  Converts a value from its JS representation to its database representation of this type. By default, returns unchanged `value`.

- `convertToJSValue(value: any, platform: Platform): any`

  Converts a value from its database representation to its JS representation of this type. By default, returns unchanged `value`.

- `toJSON(value: any, platform: Platform): any`

  Converts a value from its JS representation to its serialized JSON form of this type. By default, uses the runtime value.

- `getColumnType(prop: EntityProperty, platform: Platform): string`

  Gets the SQL declaration snippet for a field of this type. By default, returns `columnType` of given property.

- `convertToDatabaseValueSQL(key: string, platform: Platform): string`

  Wraps the parameter placeholder in an SQL expression. Use this when the database needs to transform the value via an SQL function before storing.

- `convertToJSValueSQL(key: string, platform: Platform): string`

  Wraps the column identifier in an SQL expression during SELECT. Use this when the database needs to transform the stored value via an SQL function before returning it.

- `compareAsType(): string`

  How should the raw database values be compared? Used in `EntityComparator`. Possible values: `string` | `number` | `boolean` | `date` | `any` | `buffer` | `array`.

- `ensureComparable(): boolean`

  When a value is hydrated, we convert it back to the database value to ensure comparability, as often the raw database response is not the same as the `convertToDatabaseValue` result. This allows to disable the additional conversion in case you know it is not needed.

- `compareValues(a, b): boolean`

  Allows to override the internal comparison logic. Works with the database values (results of `convertToDatabaseValue` method). This can be helpful when the database value is not stable.

- `getDefaultLength?(platform: Platform): number`

  Allows defining a default value for the `length` property option when using this type and not specifying the `columnType` property option. If the method itself is undefined, or the `columnType` option is specified, the `length` property option is ignored.

## Understanding the conversion methods

Custom types involve two levels of conversion:

1. **Runtime conversion** (`convertToDatabaseValue` / `convertToJSValue`) - These methods transform values in JavaScript before they're sent to or after they're received from the database driver.
2. **SQL-level conversion** (`convertToDatabaseValueSQL` / `convertToJSValueSQL`) - These methods wrap SQL expressions with database functions. Use these when the database itself needs to perform the transformation.

### When to use which

| Scenario                                                    | Method to use                                                     |
|-------------------------------------------------------------|-------------------------------------------------------------------|
| Simple value transformation (e.g., Date ↔ string)           | `convertToDatabaseValue` / `convertToJSValue` only                |
| Database stores in a special format requiring SQL functions | Both runtime AND SQL methods                                      |
| Value needs database-specific encoding/decoding             | SQL methods (`convertToDatabaseValueSQL` / `convertToJSValueSQL`) |

For most custom types, you only need the runtime conversion methods. The SQL-level methods are needed when:

- The database stores values in a binary or internal format that requires SQL functions to convert (e.g., PostGIS geometry, MySQL spatial types)
- You want to leverage database-specific functions for encoding/decoding

### Handling null and undefined

**Important:** The ORM handles `null` values from the database automatically - they will **not** be passed to your custom type's `convertToJSValue` method. However, `null` or `undefined` values **can** be passed to `convertToDatabaseValue` when using `em.create()` or when setting property values directly.

Therefore, your `convertToDatabaseValue` implementation should handle `null`/`undefined`:

```ts
convertToDatabaseValue(value: MyType | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  // ... convert the value
}
```

```ts
import { Type, Platform, EntityProperty, ValidationError } from '@mikro-orm/core';

/**
 * A custom type that maps SQL date column to JS Date objects.
 * Note that the built-in ORM DateType maps to string instead of Date.
 *
 * This example only uses runtime conversion (convertToDatabaseValue/convertToJSValue)
 * because the database can directly store and return date strings - no SQL functions needed.
 */
export class MyDateType extends Type<Date, string> {

  convertToDatabaseValue(value: Date | string | null | undefined, platform: Platform): string | null {
    // Handle null/undefined - these can come from em.create() or direct assignment
    if (value == null) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().substr(0, 10);
    }

    if (value.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }

    throw ValidationError.invalidType(MyDateType, value, 'JS');
  }

  // Note: null values from the database are handled by the ORM and won't reach this method
  convertToJSValue(value: string, platform: Platform): Date {
    const date = new Date(value);

    if (date.toString() === 'Invalid Date') {
      throw ValidationError.invalidType(MyDateType, value, 'database');
    }

    return date;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return `date(${prop.length})`;
  }

}
```

Then you can use this type when defining your entity properties:

```ts
@Entity()
export class FooBar {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: MyDateType, length: 3 })
  born?: Date;

}
```

If your type implementation is stateful, e.g. if you want the type to behave differently for each property, provide an instance of the type:

```ts
@Property({ type: new MyDateType('DD-MM-YYYY') })
born?: Date;
```

## Mapping to objects and type-safety

When your custom type maps a value to an object, it might break the internal types like in `em.create()`, as there is no easy way to detect whether some object type is an entity or something else. In those cases, it can be handy to use `IType` to provide more information about your type on the type-level. It has three arguments, the first represents the runtime type, the second one is the raw value type, and the last optional argument allows overriding the serialized type (which defaults to the raw value type).

Consider the following custom type:

```ts
class MyClass {
  constructor(private value: string) {}
}

class MyType extends Type<MyClass, string> {

  convertToDatabaseValue(value: MyClass): string {
    return value.value;
  }

  convertToJSValue(value: string): MyClass {
    return new MyClass(value);
  }

}
```

Now let's use it together with the `IType`:

<Tabs
defaultValue="class"
values={[
{label: 'class', value: 'class'},
{label: 'defineEntity', value: 'define-entity'},
]} >
  <TabItem value="class">

```ts
import { IType } from '@mikro-orm/core';

@Entity()
class MyEntity {

  @Property({ type: MyType })
  // highlight-next-line
  foo?: IType<MyClass, string>;

}
```

  </TabItem>
  <TabItem value="define-entity">

```ts
import { defineEntity, p } from '@mikro-orm/core';

const MyEntity = defineEntity({
  name: 'MyEntity',
  properties: {
    // highlight-next-line
    foo: p.type(MyType).$type<MyClass, string>(),
  },
});
```

  </TabItem>
</Tabs>

This will make the `em.create()` properly disallow values other than MyClass, as well as convert the value type to `string` when serializing. Without the `IType`, there would be no error with `em.create()` and the serialization would result in `MyClass` on type level (but would be a `string` value on runtime):

```ts
// this will fail but wouldn't without the `IType`
const entity = em.create(MyEntity, { foo: 'bar' });

// serialized value is now correctly typed to `string`
const object = wrap(e).toObject(); // `{ foo: string }`
```

## Composing custom types

Custom types are simple classes with an empty constructor, so you can instantiate and reuse them within other custom types. This is useful when building complex types that share conversion logic.

For example, if you're implementing PostgreSQL range types, a `multirange` type can reuse the `range` type:

```ts
export class Int4RangeType extends Type<Range<number> | null, string | null> {

  convertToDatabaseValue(value: Range<number> | null): string | null {
    if (value == null) {
      return null;
    }
    const lower = value.lower ?? '';
    const upper = value.upper ?? '';
    return `${value.isLowerInclusive ? '[' : '('}${lower},${upper}${value.isUpperInclusive ? ']' : ')'}`;
  }

  convertToJSValue(value: string | null): Range<number> | null {
    if (value == null) {
      return null;
    }
    // Parse range string like "[1,10)" into Range object
    const match = value.match(/^([[(])(-?\d*),(-?\d*)([\])])$/);
    if (!match) return null;

    return {
      lower: match[2] ? parseInt(match[2], 10) : null,
      upper: match[3] ? parseInt(match[3], 10) : null,
      isLowerInclusive: match[1] === '[',
      isUpperInclusive: match[4] === ']',
    };
  }

  getColumnType(): string {
    return 'int4range';
  }

}

// Multirange type that reuses the range type for parsing individual ranges
export class Int4MultiRangeType extends Type<Range<number>[] | null, string | null> {

  // Reuse the range type for individual range conversion
  private rangeType = new Int4RangeType();

  convertToDatabaseValue(value: Range<number>[] | null): string | null {
    if (value == null) {
      return null;
    }
    const ranges = value.map(r => this.rangeType.convertToDatabaseValue(r));
    return `{${ranges.join(',')}}`;
  }

  convertToJSValue(value: string | null): Range<number>[] | null {
    if (value == null) {
      return null;
    }
    // Parse multirange string like "{[1,5),[10,20)}"
    const rangeStrings = value.slice(1, -1).match(/[[(][^\])]*[\])]/g) ?? [];
    return rangeStrings.map(r => this.rangeType.convertToJSValue(r)!);
  }

  getColumnType(): string {
    return 'int4multirange';
  }

}
```

You can also use `Type.getType()` to get a singleton instance of a registered type if you prefer not to instantiate it directly.

## Advanced example - PointType and WKT

This example demonstrates when you need **both** runtime conversion and SQL-level conversion. This is necessary when the database stores values in a special internal format that requires SQL functions to convert.

> The Point type is part of the Spatial extension of MySQL and enables you to store a single location in a coordinate space by using x and y coordinates. You can use the Point type to store a longitude/latitude pair to represent a geographic location.

**Why do we need SQL-level conversion here?**

MySQL stores geometry values in a binary format, not as plain text. We use [Well-known text (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) format like `point(1.23 4.56)` as an intermediate representation because it's both human-readable and understood by MySQL's spatial functions. The flow is:

1. **JS → Database:** `Point` object → WKT string (`convertToDatabaseValue`) → binary via `ST_PointFromText()` (`convertToDatabaseValueSQL`)
2. **Database → JS:** binary → WKT string via `ST_AsText()` (`convertToJSValueSQL`) → `Point` object (`convertToJSValue`)

First let's define the `Point` class that will be used to represent the value during runtime:

```ts
export class Point {

  constructor(
    public latitude: number,
    public longitude: number,
  ) {
  }

}
```

Then the mapping type:

```ts
export class PointType extends Type<Point | undefined, string | undefined> {

  // Runtime: Convert Point object to WKT string
  // This string will be bound to the SQL parameter
  convertToDatabaseValue(value: Point | null | undefined): string | null {
    if (value == null) {
      return null;
    }

    return `point(${value.latitude} ${value.longitude})`;
  }

  // Runtime: Convert WKT string (returned by ST_AsText) to Point object
  convertToJSValue(value: string | undefined): Point | undefined {
    const m = value?.match(/point\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/i);

    if (!m) {
      return undefined;
    }

    return new Point(+m[1], +m[3]);
  }

  // SQL: Wrap the column with ST_AsText() in SELECT queries
  // This converts MySQL's internal binary format to WKT string
  convertToJSValueSQL(key: string) {
    return `ST_AsText(${key})`;
  }

  // SQL: Wrap the parameter placeholder with ST_PointFromText() in INSERT/UPDATE
  // This converts the WKT string to MySQL's internal binary format
  convertToDatabaseValueSQL(key: string) {
    return `ST_PointFromText(${key})`;
  }

  getColumnType(): string {
    return 'point';
  }

}
```

Now let's define an entity:

```ts
@Entity()
export class Location {

  @PrimaryKey()
  id!: number;

  @Property({ type: PointType })
  point?: Point;

}
```

...and use it:

```ts
const loc = new Location();
loc.point = new Point(1.23, 4.56);
await em.persist(loc).flush();
em.clear();

const loc1 = await em.findOneOrFail(Location, loc.id);

// update it
loc1.point = new Point(2.34, 9.87);
await em.flush();
```

This will result in following queries:

```sql
begin
insert into `location` (`point`) values (ST_PointFromText('point(1.23 4.56)'))
commit

select `e0`.*, ST_AsText(`e0`.point) as point from `location` as `e0` where `e0`.`id` = ? limit ?

begin
update `location` set `point` = ST_PointFromText('point(2.34 9.87)') where `id` = ?
commit
```

Notice how:
- The WKT string `'point(1.23 4.56)'` (from `convertToDatabaseValue`) is wrapped with `ST_PointFromText()` (from `convertToDatabaseValueSQL`)
- The column `point` is wrapped with `ST_AsText()` (from `convertToJSValueSQL`) in the SELECT query

> When using DQL queries, the `convertToJSValueSQL` and `convertToDatabaseValueSQL` methods only apply to identification variables and path expressions in SELECT clauses. Expressions in WHERE clauses are not wrapped!

## Types provided by MikroORM

There are few types provided by MikroORM. All of them aim to provide similar experience among all the drivers, even if the particular feature is not supported out of box by the driver.

You can also use the `type` map exported from the `core` package. It contains a map of all mapped types provided by the ORM, allowing autocomplete.

```ts
import { Property, types } from '@mikro-orm/core';

@Property({ type: types.bigint, nullable: true })
largeNumber?: string; // bigints are mapped to strings so we don't loose precision
```

> Same map is also exported shortcut `t`.

The map is defined as follows:

```ts
export const types = {
  date: DateType,
  time: TimeType,
  datetime: DateTimeType,
  bigint: BigIntType,
  blob: BlobType,
  uint8array: Uint8ArrayType,
  array: ArrayType,
  enumArray: EnumArrayType,
  enum: EnumType,
  json: JsonType,
  integer: IntegerType,
  smallint: SmallIntType,
  tinyint: TinyIntType,
  mediumint: MediumIntType,
  float: FloatType,
  double: DoubleType,
  boolean: BooleanType,
  decimal: DecimalType,
  character: CharacterType,
  string: StringType,
  uuid: UuidType,
  text: TextType,
  interval: IntervalType,
  unknown: UnknownType,
} as const;
```

### ArrayType

In PostgreSQL and MongoDB, it uses native arrays, otherwise it concatenates the values into string separated by commas. This means that you can't use values that contain comma with the `ArrayType` ( but you can create custom array type that will handle this case, e.g. by using different separator).

By default, array of strings is returned from the type. You can also have arrays of numbers or other data types - to do so, you will need to implement custom `hydrate` method that is used for converting the array values to the right type.

> `ArrayType` will be used automatically if `type` is set to `array` (default behaviour of reflect-metadata) or `string[]` or `number[]` (either manually or via ts-morph). In case of `number[]` it will automatically handle the conversion to numbers. This means that the following examples would both have the `ArrayType` used automatically (but with reflect-metadata you would have a string array for both unless you specify the type manually as `type: 'number[]')

```ts
@Property({ type: ArrayType, nullable: true })
stringArray?: string[];

@Property({ type: new ArrayType(i => +i), nullable: true })
numericArray?: number[];
```

#### Extending `ArrayType`

You can also map the array items to more complex types like objects. Consider the following example of mapping a `date[]` column to array of objects with `date` string property:

```ts
import { ArrayType } from '@mikro-orm/core';

export interface CalendarDate {
  date: string;
}

export class CalendarDateArrayType extends ArrayType<CalendarDate> {

  constructor() {
    super(
      date => ({ date }), // to JS
      d => d.date, // to DB
    );
  }

  getColumnType(): string {
    return 'date[]';
  }

}

@Property({ type: CalendarDateArrayType })
favoriteDays!: CalendarDate[];
```

### BigIntType

Since v6, `bigint`s are represented by the native `BigInt` type, and as such, they don't require explicit type in the decorator options:

```ts
@PrimaryKey()
id: bigint;
```

You can also specify the target type you want your bigints to be mapped to:

```ts
@PrimaryKey({ type: new BigIntType('bigint') })
id1: bigint;

@PrimaryKey({ type: new BigIntType('string') })
id2: string;

@PrimaryKey({ type: new BigIntType('number') })
id3: number;
```

> JavaScript cannot represent all the possible values of a `bigint` when mapping to the `number` type - only values up to `Number.MAX_SAFE_INTEGER` (2^53 - 1) are safely supported.

### DecimalType

DecimalType represents a `decimal` or `numeric` column type. By default, it maps to a JS `string`, as mapping it to `number` could result is precision lost. If you are fine with that, you can force mapping to a `number` with its constructor (just like with the `BigIntType`).

```ts
@Property({ type: DecimalType })
price1: string;

@PrimaryKey({ type: new DecimalType('number') })
price2: number;
```

### BlobType

Blob type can be used to store binary data in the database.

> `BlobType` will be used automatically if you specify the type hint as `Buffer`. This means that the following example should work even without the explicit `type: BlobType` option (with both reflect-metadata and ts-morph providers).

```ts
@Property({ type: BlobType, nullable: true })
blob?: Buffer;
```

### Uint8ArrayType

Uint8Array type can be used to store binary data in the database.

> `Uint8ArrayType` will be used automatically if you specify the type hint as `Uint8Array`. This means that the following example should work even without the explicit `type: Uint8ArrayType` option (with both reflect-metadata and ts-morph providers).

```ts
@Property({ type: Uint8ArrayType, nullable: true })
blob?: Uint8Array;
```

### JsonType

To store objects you can use `JsonType`. As some drivers are handling objects automatically and some don't, this type will handle the serialization in a driver independent way (calling `parse` and `stringify` only when needed).

```ts
@Property({ type: JsonType, nullable: true })
object?: { foo: string; bar: number };
```

### DateType

To store dates without time information, you can use `DateType`. It uses the `date` column type and maps it to a `string`.

```ts
@Property({ type: DateType, nullable: true })
born?: string;
```

### TimeType

As opposed to the `DateType`, to store only the time information, you can use `TimeType`. It will use the `time` column type, the runtime type is string.

```ts
@Property({ type: TimeType, nullable: true })
bornTime?: string;
```
