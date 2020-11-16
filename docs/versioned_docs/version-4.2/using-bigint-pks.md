---
title: Using native BigInt PKs (MySQL and PostgreSQL)
---

You can use `BigIntType` to support `bigint`s. By default it will represent the value as
a `string`.  

```typescript
@Entity()
export class Book {

  @PrimaryKey({ type: BigIntType })
  id: string;

}
```

If you want to use native `bigint` type, you will need to create new type based on the
`BigIntType`:

```typescript
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
