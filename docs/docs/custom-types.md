---
title: Custom Types
---

You can define custom types by extending `Type` abstract class. It has several optional methods:

- `convertToDatabaseValue(value: any, platform: Platform): any`

  Converts a value from its JS representation to its database representation of this type. By default returns unchanged `value`.

- `convertToJSValue(value: any, platform: Platform): any`

  Converts a value from its database representation to its JS representation of this type. By default returns unchanged `value`.

- `toJSON(value: any, platform: Platform): any`

  Converts a value from its JS representation to its serialized JSON form of this type. By default uses the runtime value.

- `getColumnType(prop: EntityProperty, platform: Platform): string`

  Gets the SQL declaration snippet for a field of this type. By default returns `columnType` of given property.

- `convertToDatabaseValueSQL(key: string, platform: Platform): string`

  Converts a value from its JS representation to its database representation of this type. _(added in v4.4.2)_

- `convertToJSValueSQL(key: string, platform: Platform): string`

  Modifies the SQL expression (identifier, parameter) to convert to a JS value. _(added in v4.4.2)_

- `compareAsType(): string`

  How should the raw database values be compared? Used in `EntityComparator`.Possible values: `string` | `number` | `boolean` | `date` | `any` | `buffer` | `array`.

- `ensureComparable(): boolean`

  When a value is hydrated, we convert it back to the database value to ensure comparability, as often the raw database response is not the same as the `convertToDatabaseValue` result. This allows to disable the additional conversion in case you know it is not needed.

- `compareValues(a, b): boolean`

  Allows to override the internal comparison logic. Works with the database values (results of `convertToDatabaseValue` method). This can be helpful when the database value is not stable.

```ts
import { Type, Platform, EntityProperty, ValidationError } from '@mikro-orm/core';

/**
 * A custom type that maps SQL date column to JS Date objects.
 * Note that the ORM DateType maps to string instead of Date.
 */
export class MyDateType extends Type<Date, string> {

  convertToDatabaseValue(value: Date | string | undefined, platform: Platform): string {
    if (value instanceof Date) {
      return value.toISOString().substr(0, 10);
    }

    if (!value || value.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value as string;
    }

    throw ValidationError.invalidType(MyDateType, value, 'JS');
  }

  convertToJSValue(value: Date | string | undefined, platform: Platform): Date {
    if (!value || value instanceof Date) {
      return value as Date;
    }

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

```ts
import { IType } from '@mikro-orm/core';

@Entity()
class MyEntity {

  @Property({ type: MyType })
  // highlight-next-line
  foo?: IType<MyClass, string>;

}
```

This will make the `em.create()` properly disallow values other than MyClass, as well as convert the value type to `string` when serializing. Without the `IType`, there would be no error with `em.create()` and the serialization would result in `MyClass` on type level (but would be a `string` value on runtime):

```ts
// this will fail but wouldn't without the `IType`
const entity = em.create(MyEntity, { foo: 'bar' });

// serialized value is now correctly typed to `string`
const object = wrap(e).toObject(); // `{ foo: string }`
```

## Advanced example - PointType and WKT

In this example we will combine mapping values via database as well as during runtime.

> The Point type is part of the Spatial extension of MySQL and enables you to store a single location in a coordinate space by using x and y coordinates. You can use the Point type to store a longitude/latitude pair to represent a geographic location.

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

  convertToDatabaseValue(value: Point | undefined): string | undefined {
    if (!value) {
      return value;
    }

    return `point(${value.latitude} ${value.longitude})`;
  }

  convertToJSValue(value: string | undefined): Point | undefined {
    const m = value?.match(/point\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/i);

    if (!m) {
      return undefined;
    }

    return new Point(+m[1], +m[3]);
  }

  convertToJSValueSQL(key: string) {
    return `ST_AsText(${key})`;
  }

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

We do a 2-step conversion here. In the first step, we convert the Point object into a string representation before saving to the database (in the convertToDatabaseValue method) and back into an object after fetching the value from the database (in the convertToJSValue method).

The format of the string representation format is called Well-known text (WKT). The advantage of this format is, that it is both human readable and parsable by MySQL.

Internally, MySQL stores geometry values in a binary format that is not identical to the WKT format. So, we need to let MySQL transform the WKT representation into its internal format.

This is where the `convertToJSValueSQL` and `convertToDatabaseValueSQL` methods come into play.

This methods wrap a sql expression (the WKT representation of the Point) into MySQL functions ST_PointFromText and ST_AsText which convert WKT strings to and from the internal format of MySQL.

> When using DQL queries, the `convertToJSValueSQL` and `convertToDatabaseValueSQL` methods only apply to identification variables and path expressions in SELECT clauses. Expressions in WHERE clauses are not wrapped!

## Types provided by MikroORM

There are few types provided by MikroORM. All of them aim to provide similar experience among all the drivers, even if the particular feature is not supported out of box by the driver.

Since v5, we can also use the `type` map exported from the `core` package. It contains a map of all mapped types provided by the ORM, allowing autocomplete.

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
  string: StringType,
  uuid: UuidType,
  text: TextType,
};
```

### ArrayType

In PostgreSQL and MongoDB, it uses native arrays, otherwise it concatenates the values into string separated by commas. This means that you can't use values that contain comma with the `ArrayType` ( but you can create custom array type that will handle this case, e.g. by using different separator).

By default, array of strings is returned from the type. You can also have arrays of numbers or other data types - to do so, you will need to implement custom `hydrate` method that is used for converting the array values to the right type.

> `ArrayType` will be used automatically if `type` is set to `array` (default behaviour of reflect-metadata) or `string[]` or `number[]` (either manually or via ts-morph). In case of `number[]` it will automatically handle the conversion to numbers. This means that the following examples would both have the `ArrayType` used automatically (but with reflect-metadata we would have a string array for both unless we specify the type manually as `type: 'number[]')

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

To store objects we can use `JsonType`. As some drivers are handling objects automatically and some don't, this type will handle the serialization in a driver independent way (calling `parse` and `stringify` only when needed).

```ts
@Property({ type: JsonType, nullable: true })
object?: { foo: string; bar: number };
```

### DateType

To store dates without time information, we can use `DateType`. It does use `date` column type and maps it to a `string`.

```ts
@Property({ type: DateType, nullable: true })
born?: string;
```

### TimeType

As opposed to the `DateType`, to store only the time information, we can use `TimeType`. It will use the `time` column type, the runtime type is string.

```ts
@Property({ type: TimeType, nullable: true })
bornTime?: string;
```
