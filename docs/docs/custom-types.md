---
title: Custom Types
---

You can define custom types by extending `Type` abstract class. It has 4 optional methods:

- `convertToDatabaseValue(value: any, platform: Platform): any`

  Converts a value from its JS representation to its database representation of this type.
  By default returns unchanged `value`.

- `convertToJSValue(value: any, platform: Platform): any`

  Converts a value from its database representation to its JS representation of this type.
  By default returns unchanged `value`.

- `toJSON(value: any, platform: Platform): any`

  Converts a value from its JS representation to its serialized JSON form of this type.
  By default converts to the database value.
  
- `getColumnType(prop: EntityProperty, platform: Platform): string`

  Gets the SQL declaration snippet for a field of this type.
  By default returns `columnType` of given property.

> `DateType` and `TimeType` types are already implemented in the ORM.

```typescript
import { Type, Platform, EntityProperty, ValidationError } from 'mikro-orm';

export class DateType extends Type {

  convertToDatabaseValue(value: any, platform: Platform): any {
    if (value instanceof Date) {
      return value.toISOString().substr(0, 10);
    }

    if (!value || value.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }

    throw ValidationError.invalidType(DateType, value, 'JS');
  }

  convertToJSValue(value: any, platform: Platform): any {
    if (!value || value instanceof Date) {
      return value;
    }

    const date = new Date(value);

    if (date.toString() === 'Invalid Date') {
      throw ValidationError.invalidType(DateType, value, 'database');
    }

    return date;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return `date(${prop.length})`;
  }

}
```

Then you can use this type when defining your entity properties:

```typescript
@Entity()
export class FooBar {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: DateType, length: 3 })
  born?: Date;

}
```
