---
title: Using native BigInt PKs (MySQL and PostgreSQL)
---

We can use `BigIntType` to support `bigint`s. By default, it will represent the value as a `string`.

```ts
import { Entity, PrimaryKey, t } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey({ type: t.bigint })
  id: string;

}
```

`bigint` can fit larger numbers than JavaScript number, for this reason it is mapped to a string. If we want to map it to a number anyway, we can implement [custom type](custom-types.md) that will do so. Similarly, we can define one to use the native `bigint` type:

```ts
export class NativeBigIntType extends BigIntType {

  convertToJSValue(value: any): any {
    if (!value) {
      return value;
    }

    return BigInt(value);
  }

}

@Entity()
export class Book {

  @PrimaryKey({ type: NativeBigIntType })
  id: bigint;

}
```
